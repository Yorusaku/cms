import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { ConfigService } from '@nestjs/config'
import { User } from '../modules/auth/entities/user.entity'
import { Page } from '../modules/page/entities/page.entity'
import { PublishLog } from '../modules/page/entities/publish-log.entity'
import { Template } from '../modules/template/entities/template.entity'
import { TEMPLATE_SEEDS } from './seeds/template-seeds'
import { buildDemoPageSchema } from './seeds/demo-page-schemas'
import { DEFAULT_ADMIN_PASSWORDS } from '../common/config/env-validation'

const DEMO_PAGES = [
  { name: '618 年中大促', isAbled: 1, status: 'published' },
  { name: '新品首发活动页', isAbled: 1, status: 'published' },
  { name: '会员日专属优惠', isAbled: 0, status: 'draft' },
  { name: '品牌联合推广页', isAbled: 0, status: 'draft' },
  { name: '限时秒杀活动', isAbled: 1, status: 'published' },
  { name: '积分商城兑换页', isAbled: 0, status: 'draft' },
  { name: '新用户注册有礼', isAbled: 1, status: 'published' },
  { name: '直播间活动页', isAbled: 0, status: 'draft' }
] as const

const SEED_USERS = [
  { username: 'editor', password: 'editor123', role: 'editor' as const, nickname: '编辑员' },
  { username: 'viewer', password: 'viewer123', role: 'viewer' as const, nickname: '观察员' }
]

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name)

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(PublishLog)
    private readonly publishLogRepo: Repository<PublishLog>,
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.isSeedEnabled()) {
      this.logger.log('种子数据已关闭（SEED_ENABLED=false），跳过初始化')
      return
    }

    await this.seedAdminUser()

    if (this.isProduction()) {
      this.logger.log('生产环境仅创建管理员账号，跳过演示账号、演示页与演示模板')
      return
    }

    await this.seedDemoUsers()
    await this.seedDemoPages()
    await this.seedTemplates()
  }

  /**
   * 是否启用种子数据。
   * 显式配置 SEED_ENABLED 时以其为准；未配置时开发/测试默认开启，生产默认关闭。
   */
  private isSeedEnabled(): boolean {
    const raw = this.configService.get<string>('SEED_ENABLED')
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      return String(raw).toLowerCase() !== 'false'
    }
    return !this.isProduction()
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV', 'development') === 'production'
  }

  private async seedAdminUser(): Promise<void> {
    const count = await this.userRepo.count()
    if (count > 0) return

    const adminUsername = this.configService.get<string>('ADMIN_USERNAME', 'admin')
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD')

    if (this.isProduction()) {
      // 独立入口（pnpm seed）不经过 main.ts 的启动校验，这里再兜一次底
      if (!adminPassword || DEFAULT_ADMIN_PASSWORDS.includes(adminPassword)) {
        throw new Error(
          '生产环境首次初始化必须显式配置非默认的 ADMIN_PASSWORD，已拒绝创建管理员账号'
        )
      }
    }

    const password = adminPassword || 'admin123456'
    const adminHash = await bcrypt.hash(password, 10)
    await this.userRepo.save({
      username: adminUsername,
      password: adminHash,
      role: 'admin',
      nickname: '管理员'
    })
    this.logger.log(`Seeded admin user: ${adminUsername}`)
  }

  /** 演示账号（editor / viewer）仅用于开发与测试环境 */
  private async seedDemoUsers(): Promise<void> {
    const count = await this.userRepo.count()
    if (count > 1) return

    for (const u of SEED_USERS) {
      const hash = await bcrypt.hash(u.password, 10)
      await this.userRepo.save({
        username: u.username,
        password: hash,
        role: u.role,
        nickname: u.nickname
      })
      this.logger.log(`Seeded ${u.role} user: ${u.username}`)
    }
  }

  private async seedDemoPages(): Promise<void> {
    const count = await this.pageRepo.count()
    if (count > 0) return

    const admin = await this.userRepo.findOne({ where: { role: 'admin' } })

    for (const p of DEMO_PAGES) {
      const schema = buildDemoPageSchema(p.name)

      const shareDesc = p.name + ' 分享描述'

      const page = this.pageRepo.create({
        name: p.name,
        schema,
        componentList: [],
        shareDesc,
        shareImage: '',
        backgroundColor: '#ffffff',
        backgroundImage: '',
        backgroundPosition: 'top',
        cover: '',
        isAbled: p.isAbled,
        status: p.status,
        isDeleted: false
      })
      const saved = await this.pageRepo.save(page)

      if (p.status === 'published') {
        const versionId = `seed-${saved.id}-v1`
        const publishedAt = new Date()
        await this.publishLogRepo.save({
          versionId,
          pageId: saved.id,
          displayVersion: 'v1',
          versionNo: 1,
          action: 'publish',
          operatorUserId: admin?.id ?? null,
          operator: 'admin',
          reviewerName: 'admin',
          publisherName: 'admin',
          rollbackerName: null,
          note: '首次发布',
          sourceVersionId: null,
          schemaSnapshot: schema,
          publishedAt
        })
        saved.publishedSchema = schema
        saved.publishedVersionId = versionId
        saved.publishedAt = publishedAt
        await this.pageRepo.save(saved)
      }
    }

    this.logger.log(`Seeded ${DEMO_PAGES.length} demo pages`)
  }

  private async seedTemplates(): Promise<void> {
    const count = await this.templateRepo.count()
    if (count > 0) return

    for (const t of TEMPLATE_SEEDS) {
      await this.templateRepo.save({
        name: t.name,
        thumbnail: t.thumbnail,
        category: t.category,
        schema: t.schema,
        description: t.description,
        useCount: 0,
        isActive: true
      })
    }

    this.logger.log(`Seeded ${TEMPLATE_SEEDS.length} templates`)
  }
}

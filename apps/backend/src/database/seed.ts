import 'reflect-metadata'
import * as bcrypt from 'bcrypt'
import { AppDataSource } from './data-source'
import { User } from '../modules/auth/entities/user.entity'
import { Page } from '../modules/page/entities/page.entity'
import { PublishLog } from '../modules/page/entities/publish-log.entity'
import { Template } from '../modules/template/entities/template.entity'
import { TEMPLATE_SEEDS } from './seeds/template-seeds'
import { buildDemoPageSchema } from './seeds/demo-page-schemas'

const DEMO_PAGES = [
  { name: '618 年中大促', published: true },
  { name: '新品首发活动页', published: true },
  { name: '会员日专属优惠', published: false },
  { name: '品牌联合推广页', published: false },
  { name: '限时秒杀活动', published: true },
  { name: '积分商城兑换页', published: false },
  { name: '新用户注册有礼', published: true },
  { name: '直播间活动页', published: false }
] as const

// 演示页 schema 统一由 buildDemoPageSchema 生成（F5，真实组件）
async function ensureUser(
  username: string,
  password: string,
  role: User['role'],
  nickname: string
) {
  const repo = AppDataSource.getRepository(User)
  const existing = await repo.findOne({ where: { username } })
  if (existing) return existing
  return repo.save(
    repo.create({ username, password: await bcrypt.hash(password, 10), role, nickname })
  )
}

async function seed() {
  await AppDataSource.initialize()
  try {
    const admin = await ensureUser(
      process.env.ADMIN_USERNAME || 'admin',
      process.env.ADMIN_PASSWORD || 'admin123456',
      'admin',
      '管理员'
    )
    await ensureUser('editor', 'editor123', 'editor', '编辑员')
    await ensureUser('viewer', 'viewer123', 'viewer', '观察员')

    const pageRepo = AppDataSource.getRepository(Page)
    const logRepo = AppDataSource.getRepository(PublishLog)
    if ((await pageRepo.count()) === 0) {
      for (const item of DEMO_PAGES) {
        const schema = buildDemoPageSchema(item.name)
        const page = await pageRepo.save(
          pageRepo.create({
            name: item.name,
            schema,
            componentList: [],
            shareDesc: `${item.name} 分享描述`,
            shareImage: '',
            backgroundColor: '#ffffff',
            backgroundImage: '',
            backgroundPosition: 'top',
            cover: '',
            isAbled: item.published ? 1 : 0,
            status: item.published ? 'published' : 'draft',
            isDeleted: false
          })
        )
        if (item.published) {
          const versionId = `seed-${page.id}-v1`
          const publishedAt = new Date()
          await logRepo.save({
            versionId,
            pageId: page.id,
            displayVersion: 'v1',
            versionNo: 1,
            action: 'publish',
            operatorUserId: admin.id,
            operator: admin.username,
            note: '首次发布',
            sourceVersionId: null,
            schemaSnapshot: schema,
            publishedAt
          })
          page.publishedSchema = schema
          page.publishedVersionId = versionId
          page.publishedAt = publishedAt
          await pageRepo.save(page)
        }
      }
      console.log(`Seeded ${DEMO_PAGES.length} demo pages.`)
    }

    const templateRepo = AppDataSource.getRepository(Template)
    if ((await templateRepo.count()) === 0) {
      await templateRepo.save(
        TEMPLATE_SEEDS.map(template =>
          templateRepo.create({ ...template, useCount: 0, isActive: true })
        )
      )
      console.log(`Seeded ${TEMPLATE_SEEDS.length} templates.`)
    }
    console.log('Database seed complete.')
  } finally {
    await AppDataSource.destroy()
  }
}

seed().catch(error => {
  console.error('Seed failed:', error)
  process.exit(1)
})

import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { ConfigService } from "@nestjs/config";
import { User } from "../modules/auth/entities/user.entity";
import { Page } from "../modules/page/entities/page.entity";
import { PublishLog } from "../modules/page/entities/publish-log.entity";
import { Template } from "../modules/template/entities/template.entity";
import { TEMPLATE_SEEDS } from "./seeds/template-seeds";

const DEMO_PAGES = [
  { name: "618 年中大促", isAbled: 1, status: "published" },
  { name: "新品首发活动页", isAbled: 1, status: "published" },
  { name: "会员日专属优惠", isAbled: 0, status: "draft" },
  { name: "品牌联合推广页", isAbled: 0, status: "draft" },
  { name: "限时秒杀活动", isAbled: 1, status: "published" },
  { name: "积分商城兑换页", isAbled: 0, status: "draft" },
  { name: "新用户注册有礼", isAbled: 1, status: "published" },
  { name: "直播间活动页", isAbled: 0, status: "draft" },
] as const;

const SEED_USERS = [
  { username: "editor", password: "editor123", role: "editor" as const, nickname: "编辑员" },
  { username: "viewer", password: "viewer123", role: "viewer" as const, nickname: "观察员" },
];


@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(PublishLog)
    private readonly publishLogRepo: Repository<PublishLog>,
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedUsers();
    await this.seedDemoPages();
    await this.seedTemplates();
  }

  private async seedUsers(): Promise<void> {
    const count = await this.userRepo.count();
    if (count > 0) return;

    // Admin
    const adminUsername = this.configService.get<string>("ADMIN_USERNAME", "admin");
    const adminPassword = this.configService.get<string>("ADMIN_PASSWORD", "admin123456");
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await this.userRepo.save({
      username: adminUsername,
      password: adminHash,
      role: "admin",
      nickname: "管理员",
    });
    this.logger.log(`Seeded admin user: ${adminUsername}`);

    // Editor & Viewer
    for (const u of SEED_USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      await this.userRepo.save({
        username: u.username,
        password: hash,
        role: u.role,
        nickname: u.nickname,
      });
      this.logger.log(`Seeded ${u.role} user: ${u.username}`);
    }
  }

  private async seedDemoPages(): Promise<void> {
    const count = await this.pageRepo.count();
    if (count > 0) return;

    for (const p of DEMO_PAGES) {
      const schema = {
        version: "2.0.0" as const,
        pageConfig: {
          name: p.name,
          shareDesc: "分享描述",
          shareImage: "",
          backgroundColor: "#ffffff",
          backgroundImage: "",
          backgroundPosition: "top",
          cover: "",
        },
        componentMap: {},
        rootIds: [],
      };

      const shareDesc = p.name + " 分享描述";

      const page = this.pageRepo.create({
        name: p.name,
        schema,
        componentList: [],
        shareDesc,
        shareImage: "",
        backgroundColor: "#ffffff",
        backgroundImage: "",
        backgroundPosition: "top",
        cover: "",
        isAbled: p.isAbled,
        status: p.status,
        isDeleted: false,
      });
      const saved = await this.pageRepo.save(page);

      if (p.status === "published") {
        const now = Date.now();
        const d = new Date(now);
        const v = `v${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
        await this.publishLogRepo.save({
          versionId: `${saved.id}-${now}`,
          pageId: saved.id,
          displayVersion: v,
          operator: "admin",
          note: "首次发布",
          schemaSnapshot: schema,
        });
      }
    }

    this.logger.log(`Seeded ${DEMO_PAGES.length} demo pages`);
  }

  private async seedTemplates(): Promise<void> {
    const count = await this.templateRepo.count();
    if (count > 0) return;

    for (const t of TEMPLATE_SEEDS) {
      await this.templateRepo.save({
        name: t.name,
        thumbnail: t.thumbnail,
        category: t.category,
        schema: t.schema,
        description: t.description,
        useCount: 0,
        isActive: true,
      });
    }

    this.logger.log(`Seeded ${TEMPLATE_SEEDS.length} templates`);
  }
}

import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { ConfigService } from "@nestjs/config";
import { User } from "../modules/auth/entities/user.entity";
import { Page } from "../modules/page/entities/page.entity";
import { PublishLog } from "../modules/page/entities/publish-log.entity";

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
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdminUser();
    await this.seedDemoPages();
  }

  private async seedAdminUser(): Promise<void> {
    const count = await this.userRepo.count();
    if (count > 0) return;

    const username = this.configService.get<string>("ADMIN_USERNAME", "admin");
    const password = this.configService.get<string>("ADMIN_PASSWORD", "admin123456");
    const hash = await bcrypt.hash(password, 10);
    await this.userRepo.save({ username, password: hash });
    this.logger.log(`Seeded admin user: ${username}`);
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

      const page = this.pageRepo.create({
        name: p.name,
        schema,
        componentList: [],
        shareDesc: `${p.name} — 分享描述`,
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
}

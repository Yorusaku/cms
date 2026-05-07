/**
 * Database seed script.
 * Run: cd apps/backend && npx ts-node src/database/seed.ts
 *
 * Creates sample pages for development/demo.
 */
import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Page } from "../modules/page/entities/page.entity";
import { PublishLog } from "../modules/page/entities/publish-log.entity";

async function seed() {
  await AppDataSource.initialize();
  console.log("Connected to database.");

  const pageRepo = AppDataSource.getRepository(Page);
  const logRepo = AppDataSource.getRepository(PublishLog);

  const existingCount = await pageRepo.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} pages. Skipping seed.`);
    await AppDataSource.destroy();
    return;
  }

  const mockSchema = (name: string) => ({
    version: "2.0.0" as const,
    pageConfig: {
      name,
      shareDesc: "分享描述",
      shareImage: "",
      backgroundColor: "#ffffff",
      backgroundImage: "",
      backgroundPosition: "top",
      cover: "",
    },
    componentMap: {},
    rootIds: [],
  });

  const pages = [
    { name: "618 年中大促", isAbled: 1, status: "published" },
    { name: "新品首发活动页", isAbled: 1, status: "published" },
    { name: "会员日专属优惠", isAbled: 0, status: "draft" },
    { name: "品牌联合推广页", isAbled: 0, status: "draft" },
    { name: "限时秒杀活动", isAbled: 1, status: "published" },
    { name: "积分商城兑换页", isAbled: 0, status: "draft" },
    { name: "新用户注册有礼", isAbled: 1, status: "published" },
    { name: "直播间活动页", isAbled: 0, status: "draft" },
  ];

  for (const p of pages) {
    const schema = mockSchema(p.name);
    const page = pageRepo.create({
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
    const saved = await pageRepo.save(page);

    // Create a publish log for published pages
    if (p.status === "published") {
      const now = Date.now();
      await logRepo.save({
        versionId: `${saved.id}-${now}`,
        pageId: saved.id,
        displayVersion: `v20260507-${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        operator: "admin",
        note: "首次发布",
        schemaSnapshot: schema,
      });
    }

    console.log(`  Created: ${p.name} (id=${saved.id}, status=${p.status})`);
  }

  console.log(`\nSeed complete: ${pages.length} pages created.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

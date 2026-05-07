import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Page } from "./entities/page.entity";
import { PublishLog } from "./entities/publish-log.entity";
import type { IPageSchemaV2, IComponentSchemaV1 } from "@cms/types";

export interface PageListQuery {
  pageNum: number;
  pageSize: number;
  name?: string;
  isAbled?: number;
}

export interface PageItem {
  id: number;
  name: string;
  isAbled: number;
  create_time: string;
  update_time: string;
}

interface SavePageInput {
  id?: number;
  name: string;
  schema: Record<string, unknown>;
  componentList?: Record<string, unknown>[];
  shareDesc?: string;
  shareImage?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  cover?: string;
  online?: number;
}

@Injectable()
export class PageService {
  private readonly logger = new Logger(PageService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(PublishLog)
    private readonly publishLogRepo: Repository<PublishLog>,
  ) {}

  async getPageList(query: PageListQuery): Promise<{
    list: PageItem[];
    total: number;
    pageNum: number;
    pageSize: number;
  }> {
    const { pageNum, pageSize, name, isAbled } = query;

    const where: Record<string, unknown> = { isDeleted: false };
    if (isAbled !== undefined && isAbled !== null) {
      where.isAbled = isAbled;
    }

    const findWhere: Record<string, unknown> = { ...where };
    if (name) {
      findWhere.name = ILike(`%${name}%`);
    }

    const [rows, total] = await this.pageRepo.findAndCount({
      where: findWhere as unknown as Record<string, unknown>,
      order: { updateTime: "DESC" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return {
      list: rows.map((p) => ({
        id: p.id,
        name: p.name,
        isAbled: p.isAbled,
        create_time: p.createTime?.toISOString() ?? "",
        update_time: p.updateTime?.toISOString() ?? "",
      })),
      total,
      pageNum,
      pageSize,
    };
  }

  async getPageJson(id: number): Promise<Record<string, unknown>> {
    const page = await this.pageRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!page) {
      throw new NotFoundException("页面不存在");
    }

    return {
      id: page.id,
      name: page.name,
      isAbled: page.isAbled,
      create_time: page.createTime?.toISOString() ?? "",
      update_time: page.updateTime?.toISOString() ?? "",
      schema: page.schema ?? {},
      shareDesc: page.shareDesc ?? "",
      shareImage: page.shareImage ?? "",
      backgroundColor: page.backgroundColor ?? "",
      backgroundImage: page.backgroundImage ?? "",
      backgroundPosition: page.backgroundPosition ?? "top",
      cover: page.cover ?? "",
      componentList: page.componentList ?? [],
    };
  }

  async addPageJson(input: SavePageInput): Promise<{ id: number }> {
    const page = this.pageRepo.create({
      name: input.name,
      schema: input.schema as unknown as IPageSchemaV2,
      componentList: (input.componentList ?? []) as unknown as IComponentSchemaV1[],
      shareDesc: input.shareDesc ?? "",
      shareImage: input.shareImage ?? "",
      backgroundColor: input.backgroundColor ?? "",
      backgroundImage: input.backgroundImage ?? "",
      backgroundPosition: input.backgroundPosition ?? "top",
      cover: input.cover ?? "",
      isAbled: 0,
      status: "draft",
    });

    const saved = await this.pageRepo.save(page);

    if (input.online === 1) {
      await this.createPublishLog(saved);
      saved.status = "published";
      saved.isAbled = 1;
      await this.pageRepo.save(saved);
    }

    return { id: saved.id };
  }

  async updatePageJson(input: SavePageInput): Promise<void> {
    const page = await this.pageRepo.findOne({
      where: { id: input.id!, isDeleted: false },
    });
    if (!page) {
      throw new NotFoundException("页面不存在");
    }

    Object.assign(page, {
      name: input.name,
      schema: input.schema as unknown as IPageSchemaV2,
      componentList: (input.componentList ?? page.componentList) as unknown as IComponentSchemaV1[],
      shareDesc: input.shareDesc ?? page.shareDesc,
      shareImage: input.shareImage ?? page.shareImage,
      backgroundColor: input.backgroundColor ?? page.backgroundColor,
      backgroundImage: input.backgroundImage ?? page.backgroundImage,
      backgroundPosition: input.backgroundPosition ?? page.backgroundPosition,
      cover: input.cover ?? page.cover,
    });

    await this.pageRepo.save(page);

    if (input.online === 1) {
      await this.createPublishLog(page);
      page.status = "published";
      page.isAbled = 1;
      await this.pageRepo.save(page);
    }
  }

  async deletePage(id: number): Promise<void> {
    const page = await this.pageRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!page) {
      throw new NotFoundException("页面不存在");
    }
    page.isDeleted = true;
    await this.pageRepo.save(page);
  }

  async updatePageStatus(id: number, isAbled: number): Promise<void> {
    const page = await this.pageRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!page) {
      throw new NotFoundException("页面不存在");
    }
    page.isAbled = isAbled;
    await this.pageRepo.save(page);
  }

  async getPagePublishLogs(pageId: number): Promise<
    {
      versionId: string;
      displayVersion: string;
      operator: string | null;
      note: string | null;
      publishedAt: number;
    }[]
  > {
    const logs = await this.publishLogRepo.find({
      where: { pageId },
      order: { publishedAt: "DESC" },
    });

    return logs.map((log) => ({
      versionId: log.versionId,
      displayVersion: log.displayVersion,
      operator: log.operator,
      note: log.note,
      publishedAt: log.publishedAt.getTime(),
    }));
  }

  async rollbackPageVersion(
    pageId: number,
    versionId: string,
  ): Promise<{ schema: Record<string, unknown> }> {
    const log = await this.publishLogRepo.findOne({
      where: { versionId, pageId },
    });
    if (!log) {
      throw new NotFoundException("未找到该发布版本");
    }

    const page = await this.pageRepo.findOne({
      where: { id: pageId, isDeleted: false },
    });
    if (!page) {
      throw new NotFoundException("页面不存在");
    }

    page.schema = log.schemaSnapshot;
    page.status = "draft";
    page.isAbled = 0;
    await this.pageRepo.save(page);

    return { schema: log.schemaSnapshot as unknown as Record<string, unknown> };
  }

  private async createPublishLog(page: Page): Promise<void> {
    const now = Date.now();
    const formatted = this.formatVersionDate(now);

    await this.publishLogRepo.save({
      versionId: `${page.id}-${now}`,
      pageId: page.id,
      displayVersion: `v${formatted}`,
      operator: "admin",
      note: "发布",
      schemaSnapshot: page.schema,
    });
  }

  private formatVersionDate(ts: number): string {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}${m}${day}-${h}${min}`;
  }
}

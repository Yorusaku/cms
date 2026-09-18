import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, ILike, Repository } from "typeorm";
import { v4 as uuid } from "uuid";
import { Page } from "./entities/page.entity";
import { PublishLog } from "./entities/publish-log.entity";
import type { IPageSchemaV2, IComponentSchemaV1 } from "@cms/types";

export interface PublishActor {
  id: string;
  username: string;
}

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
  status: string;
  publishedVersionId: string | null;
  publishedAt: string | null;
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
  constructor(
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(PublishLog)
    private readonly publishLogRepo: Repository<PublishLog>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getPageList(query: PageListQuery): Promise<{
    list: PageItem[];
    total: number;
    pageNum: number;
    pageSize: number;
  }> {
    const { pageNum, pageSize, name, isAbled } = query;
    const where: Record<string, unknown> = { isDeleted: false };
    if (isAbled !== undefined && isAbled !== null) where.isAbled = isAbled;
    const findWhere: Record<string, unknown> = { ...where };
    if (name) findWhere.name = ILike(`%${name}%`);
    const [rows, total] = await this.pageRepo.findAndCount({
      where: findWhere as unknown as Record<string, unknown>,
      order: { updateTime: "DESC" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });
    return { list: rows.map((page) => this.toPageItem(page)), total, pageNum, pageSize };
  }

  async getPublishedPageList(query: PageListQuery): Promise<{
    list: PageItem[];
    total: number;
    pageNum: number;
    pageSize: number;
  }> {
    const { pageNum, pageSize, name } = query;
    const findWhere: Record<string, unknown> = {
      isDeleted: false,
      isAbled: 1,
      status: "published",
    };
    if (name) findWhere.name = ILike(`%${name}%`);
    const [rows, total] = await this.pageRepo.findAndCount({
      where: findWhere as unknown as Record<string, unknown>,
      order: { updateTime: "DESC" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });
    return { list: rows.map((page) => this.toPageItem(page)), total, pageNum, pageSize };
  }

  async getPageJson(id: number): Promise<Record<string, unknown>> {
    return this.toDraftResponse(await this.getEditablePage(id));
  }

  async getPublishedPage(id: number): Promise<Record<string, unknown>> {
    const page = await this.pageRepo.findOne({ where: { id, isDeleted: false } });
    if (!page || page.isAbled !== 1 || page.status !== "published" || !page.publishedSchema || !page.publishedVersionId) {
      throw new NotFoundException("页面暂不可访问");
    }
    return {
      id: page.id,
      name: page.name,
      schema: page.publishedSchema,
      publishedVersionId: page.publishedVersionId,
      publishedAt: page.publishedAt?.toISOString() ?? null,
      shareDesc: page.shareDesc ?? "",
      shareImage: page.shareImage ?? "",
      backgroundColor: page.backgroundColor ?? "",
      backgroundImage: page.backgroundImage ?? "",
      backgroundPosition: page.backgroundPosition ?? "top",
      cover: page.cover ?? "",
    };
  }

  async addPageJson(input: SavePageInput, actor?: PublishActor): Promise<{ id: number }> {
    const saved = await this.pageRepo.save(this.pageRepo.create({
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
    }));
    if (input.online === 1) {
      if (!actor) throw new ConflictException("缺少发布操作人");
      await this.publishPage(saved.id, actor, "兼容发布");
    }
    return { id: saved.id };
  }

  async updatePageJson(input: SavePageInput, actor?: PublishActor): Promise<void> {
    const page = await this.getEditablePage(input.id!);
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
      if (!actor) throw new ConflictException("缺少发布操作人");
      await this.publishPage(page.id, actor, "兼容发布");
    }
  }

  async publishPage(pageId: number, actor: PublishActor, note = "发布"): Promise<{ versionId: string; versionNo: number }> {
    return this.dataSource.transaction(async (manager) => {
      const page = await this.lockPage(manager, pageId);
      if (!page.schema) throw new ConflictException("页面草稿为空，无法发布");
      const versionNo = await this.getNextVersionNo(manager, pageId);
      const versionId = `${page.id}-${Date.now()}-${uuid().slice(0, 8)}`;
      const publishedAt = new Date();
      await manager.getRepository(PublishLog).save({
        versionId,
        pageId: page.id,
        displayVersion: `v${versionNo}`,
        versionNo,
        action: "publish",
        operatorUserId: actor.id,
        operator: actor.username,
        note,
        sourceVersionId: null,
        schemaSnapshot: page.schema,
        publishedAt,
      });
      Object.assign(page, { publishedSchema: page.schema, publishedVersionId: versionId, publishedAt, status: "published", isAbled: 1 });
      await manager.getRepository(Page).save(page);
      return { versionId, versionNo };
    });
  }

  async deletePage(id: number): Promise<void> {
    const page = await this.getEditablePage(id);
    page.isDeleted = true;
    await this.pageRepo.save(page);
  }

  async updatePageStatus(id: number, isAbled: number): Promise<void> {
    const page = await this.getEditablePage(id);
    if (isAbled === 1 && (!page.publishedSchema || !page.publishedVersionId)) {
      throw new ConflictException("页面尚未发布，不能上线");
    }
    page.isAbled = isAbled;
    page.status = isAbled === 1 ? "published" : "offline";
    await this.pageRepo.save(page);
  }

  async getPagePublishLogs(pageId: number): Promise<Record<string, unknown>[]> {
    const [logs, page] = await Promise.all([
      this.publishLogRepo.find({ where: { pageId }, order: { versionNo: "DESC" } }),
      this.getEditablePage(pageId),
    ]);
    return logs.map((log) => ({
      versionId: log.versionId,
      displayVersion: log.displayVersion,
      versionNo: log.versionNo,
      action: log.action,
      operator: log.operator,
      note: log.note,
      sourceVersionId: log.sourceVersionId,
      isCurrent: log.versionId === page.publishedVersionId,
      publishedAt: log.publishedAt.getTime(),
    }));
  }

  async rollbackPageVersion(pageId: number, versionId: string, actor: PublishActor): Promise<{ versionId: string; schema: Record<string, unknown> }> {
    return this.dataSource.transaction(async (manager) => {
      const page = await this.lockPage(manager, pageId);
      const source = await manager.getRepository(PublishLog).findOne({ where: { versionId, pageId } });
      if (!source) throw new NotFoundException("未找到该发布版本");
      const versionNo = await this.getNextVersionNo(manager, pageId);
      const nextVersionId = `${page.id}-${Date.now()}-${uuid().slice(0, 8)}`;
      const publishedAt = new Date();
      await manager.getRepository(PublishLog).save({
        versionId: nextVersionId,
        pageId,
        displayVersion: `v${versionNo}`,
        versionNo,
        action: "rollback",
        operatorUserId: actor.id,
        operator: actor.username,
        note: `回滚至 ${source.displayVersion}`,
        sourceVersionId: source.versionId,
        schemaSnapshot: source.schemaSnapshot,
        publishedAt,
      });
      Object.assign(page, { publishedSchema: source.schemaSnapshot, publishedVersionId: nextVersionId, publishedAt, status: "published", isAbled: 1 });
      await manager.getRepository(Page).save(page);
      return { versionId: nextVersionId, schema: source.schemaSnapshot as unknown as Record<string, unknown> };
    });
  }

  private async getEditablePage(id: number): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id, isDeleted: false } });
    if (!page) throw new NotFoundException("页面不存在");
    return page;
  }

  private async lockPage(manager: EntityManager, pageId: number): Promise<Page> {
    const page = await manager.getRepository(Page).createQueryBuilder("page")
      .setLock("pessimistic_write")
      .where("page.id = :pageId AND page.is_deleted = false", { pageId })
      .getOne();
    if (!page) throw new NotFoundException("页面不存在");
    return page;
  }

  private async getNextVersionNo(manager: EntityManager, pageId: number): Promise<number> {
    const result = await manager.getRepository(PublishLog).createQueryBuilder("log")
      .select("COALESCE(MAX(log.version_no), 0)", "maxVersion")
      .where("log.page_id = :pageId", { pageId })
      .getRawOne<{ maxVersion: string }>();
    return Number(result?.maxVersion ?? 0) + 1;
  }

  private toPageItem(page: Page): PageItem {
    return {
      id: page.id, name: page.name, isAbled: page.isAbled, status: page.status,
      publishedVersionId: page.publishedVersionId, publishedAt: page.publishedAt?.toISOString() ?? null,
      create_time: page.createTime?.toISOString() ?? "", update_time: page.updateTime?.toISOString() ?? "",
    };
  }

  private toDraftResponse(page: Page): Record<string, unknown> {
    return {
      ...this.toPageItem(page), schema: page.schema ?? {}, shareDesc: page.shareDesc ?? "", shareImage: page.shareImage ?? "",
      backgroundColor: page.backgroundColor ?? "", backgroundImage: page.backgroundImage ?? "",
      backgroundPosition: page.backgroundPosition ?? "top", cover: page.cover ?? "", componentList: page.componentList ?? [],
    };
  }
}

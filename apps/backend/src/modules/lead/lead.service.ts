import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { QueryFailedError, Repository } from "typeorm";
import { PublishLog } from "../page/entities/publish-log.entity";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { GetLeadListDto } from "./dto/get-lead-list.dto";
import { UpdateLeadStatusDto } from "./dto/update-lead-status.dto";
import { Lead, LeadStatus } from "./entities/lead.entity";
import { AuditLog } from "./entities/audit-log.entity";

interface LeadActor {
  id: string;
  username: string;
  role: "admin" | "editor" | "viewer";
}

export interface LeadRetentionPolicy {
  retentionDays: number;
  cutoffAt: string;
}

export interface LeadPurgeResult extends LeadRetentionPolicy {
  dryRun: boolean;
  matched: number;
  deleted: number;
}

/** 线索默认保留天数（合规口径未定时先按 180 天，可用 LEAD_RETENTION_DAYS 覆盖） */
const DEFAULT_RETENTION_DAYS = 180;

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(PublishLog)
    private readonly publishLogRepo: Repository<PublishLog>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {}

  async createLead(dto: CreateLeadDto): Promise<{ id: number; duplicated: boolean }> {
    if (!dto.consentAccepted) throw new ConflictException("提交线索前需要同意隐私政策");
    const existing = await this.leadRepo.findOne({ where: { requestId: dto.requestId } });
    if (existing) return { id: existing.id, duplicated: true };

    const version = await this.publishLogRepo.findOne({
      where: { versionId: dto.publishedVersionId, pageId: dto.pageId },
    });
    if (!version) throw new ConflictException("页面发布版本无效，请刷新后重试");

    try {
      const saved = await this.leadRepo.save(this.leadRepo.create({
        requestId: dto.requestId,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        remark: dto.remark ?? null,
        pageId: dto.pageId,
        publishedVersionId: dto.publishedVersionId,
        sessionId: dto.sessionId,
        status: "new",
        followUpRemark: null,
        followedBy: null,
        followedAt: null,
        utm: dto.utm ?? null,
        channel: dto.channel ?? null,
        consentAccepted: true,
        consentAt: new Date(),
      }));
      return { id: saved.id, duplicated: false };
    } catch (error) {
      if (this.isDuplicateRequestId(error)) {
        const duplicate = await this.leadRepo.findOne({ where: { requestId: dto.requestId } });
        if (duplicate) return { id: duplicate.id, duplicated: true };
      }
      throw error;
    }
  }

  async getLeadList(dto: GetLeadListDto, actor: LeadActor) {
    const pageNum = dto.pageNum ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const qb = this.leadRepo.createQueryBuilder("lead")
      .orderBy("lead.created_at", "DESC")
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);
    if (dto.pageId) qb.andWhere("lead.page_id = :pageId", { pageId: dto.pageId });
    if (dto.status) qb.andWhere("lead.status = :status", { status: dto.status });
    if (dto.channel) qb.andWhere("(lead.channel::text ILIKE :channel OR lead.utm::text ILIKE :channel)", { channel: `%${dto.channel}%` });
    const [rows, total] = await qb.getManyAndCount();
    await this.auditRepo.save(this.auditRepo.create({
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: "lead.view",
      resourceType: "lead_list",
      resourceId: String(dto.pageId ?? "all"),
      metadata: { status: dto.status ?? null, channel: dto.channel ?? null },
    }));
    return {
      list: rows.map((row) => actor.role === "admin" ? row : { ...row, phoneNumber: this.maskPhone(row.phoneNumber) }),
      total,
      pageNum,
      pageSize,
    };
  }

  async exportLeadCsv(dto: GetLeadListDto, actor: LeadActor): Promise<string> {
    if (actor.role !== "admin") throw new ConflictException("只有管理员可以导出线索");
    const rows = await this.getLeadRows(dto);
    await this.auditRepo.save(this.auditRepo.create({
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: "lead.export",
      resourceType: "lead_list",
      resourceId: String(dto.pageId ?? "all"),
      metadata: { count: rows.length },
    }));
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    return [
      ["ID", "姓名", "手机号", "状态", "页面ID", "提交时间", "渠道", "UTM", "跟进备注"].map(escape).join(","),
      ...rows.map((row) => [row.id, row.name, row.phoneNumber, row.status, row.pageId, row.createdAt.toISOString(), JSON.stringify(row.channel ?? {}), JSON.stringify(row.utm ?? {}), row.followUpRemark].map(escape).join(",")),
    ].join("\r\n");
  }

  /** 当前生效的数据保留策略（天数 + 截止时间线） */
  async getRetentionPolicy(): Promise<LeadRetentionPolicy> {
    const retentionDays = this.resolveRetentionDays();
    return {
      retentionDays,
      cutoffAt: this.resolveCutoff(retentionDays).toISOString(),
    };
  }

  /**
   * 清理超出保留期的线索。
   * - 仅管理员可执行；
   * - `dryRun` 只统计不删除，供前端二次确认；
   * - 无论预览还是执行都会写审计日志，保留期动作本身可追溯。
   */
  async purgeExpiredLeads(actor: LeadActor, dryRun = false): Promise<LeadPurgeResult> {
    if (actor.role !== "admin") throw new ConflictException("只有管理员可以清理超期线索");

    const retentionDays = this.resolveRetentionDays();
    const cutoff = this.resolveCutoff(retentionDays);
    const targets = await this.leadRepo
      .createQueryBuilder("lead")
      .where("lead.created_at < :cutoff", { cutoff })
      .getMany();

    const deleted = dryRun ? 0 : targets.length;
    if (!dryRun && targets.length > 0) {
      await this.leadRepo.remove(targets);
    }

    await this.auditRepo.save(this.auditRepo.create({
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: dryRun ? "lead.purge_preview" : "lead.purge",
      resourceType: "lead_list",
      resourceId: "expired",
      metadata: {
        retentionDays,
        cutoffAt: cutoff.toISOString(),
        matched: targets.length,
        deleted,
        dryRun,
      },
    }));

    return {
      retentionDays,
      cutoffAt: cutoff.toISOString(),
      dryRun,
      matched: targets.length,
      deleted,
    };
  }

  private resolveRetentionDays(): number {
    const raw = Number(this.configService.get<string>("LEAD_RETENTION_DAYS", String(DEFAULT_RETENTION_DAYS)));
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_RETENTION_DAYS;
  }

  private resolveCutoff(retentionDays: number): Date {
    return new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  }

  async updateLeadStatus(dto: UpdateLeadStatusDto, actor: LeadActor): Promise<Lead> {
    const lead = await this.leadRepo.findOne({ where: { id: dto.id } });
    if (!lead) throw new NotFoundException("线索不存在");
    lead.status = dto.status as LeadStatus;
    lead.followUpRemark = dto.followUpRemark?.trim() || null;
    lead.followedBy = actor.username;
    lead.followedAt = new Date();
    const saved = await this.leadRepo.save(lead);
    await this.auditRepo.save(this.auditRepo.create({
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: "lead.update",
      resourceType: "lead",
      resourceId: String(lead.id),
      metadata: { status: dto.status },
    }));
    return saved;
  }

  private async getLeadRows(dto: GetLeadListDto): Promise<Lead[]> {
    const qb = this.leadRepo.createQueryBuilder("lead").orderBy("lead.created_at", "DESC");
    if (dto.pageId) qb.andWhere("lead.page_id = :pageId", { pageId: dto.pageId });
    if (dto.status) qb.andWhere("lead.status = :status", { status: dto.status });
    if (dto.channel) qb.andWhere("(lead.channel::text ILIKE :channel OR lead.utm::text ILIKE :channel)", { channel: `%${dto.channel}%` });
    return qb.getMany();
  }

  private maskPhone(phone: string): string {
    return phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : "****";
  }

  private isDuplicateRequestId(error: unknown): boolean {
    return error instanceof QueryFailedError && (error.driverError as { code?: string }).code === "23505";
  }
}

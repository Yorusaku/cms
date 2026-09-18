import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { PublishLog } from "../page/entities/publish-log.entity";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { GetLeadListDto } from "./dto/get-lead-list.dto";
import { UpdateLeadStatusDto } from "./dto/update-lead-status.dto";
import { Lead, LeadStatus } from "./entities/lead.entity";

interface LeadActor {
  username: string;
}

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(PublishLog)
    private readonly publishLogRepo: Repository<PublishLog>,
  ) {}

  async createLead(dto: CreateLeadDto): Promise<{ id: number; duplicated: boolean }> {
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

  async getLeadList(dto: GetLeadListDto) {
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
    return { list: rows, total, pageNum, pageSize };
  }

  async updateLeadStatus(dto: UpdateLeadStatusDto, actor: LeadActor): Promise<Lead> {
    const lead = await this.leadRepo.findOne({ where: { id: dto.id } });
    if (!lead) throw new NotFoundException("线索不存在");
    lead.status = dto.status as LeadStatus;
    lead.followUpRemark = dto.followUpRemark?.trim() || null;
    lead.followedBy = actor.username;
    lead.followedAt = new Date();
    return this.leadRepo.save(lead);
  }

  private isDuplicateRequestId(error: unknown): boolean {
    return error instanceof QueryFailedError && (error.driverError as { code?: string }).code === "23505";
  }
}

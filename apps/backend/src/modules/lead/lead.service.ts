import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Lead } from "./entities/lead.entity";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { GetLeadListDto } from "./dto/get-lead-list.dto";

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  async createLead(dto: CreateLeadDto): Promise<{ id: number }> {
    const entity = this.leadRepo.create({
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      remark: dto.remark ?? null,
      pageId: dto.pageId ?? null,
      utm: dto.utm ?? null,
      channel: dto.channel ?? null,
    });

    const saved = await this.leadRepo.save(entity);
    return { id: saved.id };
  }

  async getLeadList(dto: GetLeadListDto) {
    const pageNum = dto.pageNum ?? 1;
    const pageSize = dto.pageSize ?? 20;

    const qb = this.leadRepo
      .createQueryBuilder("lead")
      .orderBy("lead.created_at", "DESC")
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    if (dto.pageId) {
      qb.andWhere("lead.page_id = :pageId", { pageId: dto.pageId });
    }

    const [rows, total] = await qb.getManyAndCount();
    return {
      list: rows,
      total,
      pageNum,
      pageSize,
    };
  }
}

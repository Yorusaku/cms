import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import type { Request } from "express";
import type { Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { GetLeadListDto } from "./dto/get-lead-list.dto";
import { PurgeLeadsDto } from "./dto/purge-leads.dto";
import { UpdateLeadStatusDto } from "./dto/update-lead-status.dto";
import { LeadService } from "./lead.service";

@Controller("atlas-cms")
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Public()
  @Post("submitLead")
  async submitLead(@Body() dto: CreateLeadDto): Promise<{ id: number; duplicated: boolean }> {
    return this.leadService.createLead(dto);
  }

  @Get("getLeadList")
  @Roles("admin", "editor")
  async getLeadList(@Query() dto: GetLeadListDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.leadService.getLeadList(dto, req.user);
  }

  @Get("exportLeadCsv")
  @Roles("admin")
  async exportLeadCsv(@Query() dto: GetLeadListDto, @Req() req: Request & { user: AuthenticatedUser }, @Res() res: Response) {
    const csv = await this.leadService.exportLeadCsv(dto, req.user);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/(\d{8})(\d{4})/, "$1-$2");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="leads-${stamp}.csv"`);
    res.send(`\uFEFF${csv}`);
  }

  @Get("getLeadRetentionPolicy")
  @Roles("admin", "editor")
  async getLeadRetentionPolicy() {
    return this.leadService.getRetentionPolicy();
  }

  @Post("purgeExpiredLeads")
  @Roles("admin")
  async purgeExpiredLeads(
    @Body() dto: PurgeLeadsDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.leadService.purgeExpiredLeads(req.user, dto.dryRun ?? false);
  }

  @Post("updateLeadStatus")
  @Roles("admin", "editor")
  async updateLeadStatus(@Body() dto: UpdateLeadStatusDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.leadService.updateLeadStatus(dto, req.user);
  }
}

import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { GetLeadListDto } from "./dto/get-lead-list.dto";
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
  async getLeadList(@Query() dto: GetLeadListDto) {
    return this.leadService.getLeadList(dto);
  }

  @Post("updateLeadStatus")
  @Roles("admin", "editor")
  async updateLeadStatus(@Body() dto: UpdateLeadStatusDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.leadService.updateLeadStatus(dto, req.user);
  }
}

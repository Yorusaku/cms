import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { GetLeadListDto } from "./dto/get-lead-list.dto";
import { LeadService } from "./lead.service";

@Controller("atlas-cms")
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Public()
  @Post("submitLead")
  async submitLead(@Body() dto: CreateLeadDto): Promise<{ id: number }> {
    return this.leadService.createLead(dto);
  }

  @Get("getLeadList")
  @Roles("admin", "editor")
  async getLeadList(@Query() dto: GetLeadListDto) {
    return this.leadService.getLeadList(dto);
  }
}

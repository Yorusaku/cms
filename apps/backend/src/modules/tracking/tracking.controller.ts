import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { CreateTrackingEventDto } from "./dto/create-tracking-event.dto";
import { GetPageFunnelSummaryDto } from "./dto/get-page-funnel-summary.dto";
import { GetTrackingEventsDto } from "./dto/get-tracking-events.dto";
import { TrackingService } from "./tracking.service";

@Controller("atlas-cms")
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Public()
  @Post("trackEvent")
  async trackEvent(@Body() dto: CreateTrackingEventDto): Promise<{ id: number }> {
    return this.trackingService.createEvent(dto);
  }

  @Get("getTrackingEvents")
  @Roles("admin", "editor")
  async getTrackingEvents(@Query() dto: GetTrackingEventsDto) {
    return this.trackingService.getEvents(dto);
  }

  /** 看板为只读统计，观察员也可查看；导出另受 admin 限制 */
  @Get("getPageFunnelSummary")
  @Roles("admin", "editor", "viewer")
  async getPageFunnelSummary(@Query() dto: GetPageFunnelSummaryDto) {
    return this.trackingService.getPageFunnelSummary(dto);
  }

  @Get("exportPageFunnelCsv")
  @Roles("admin")
  async exportPageFunnelCsv(
    @Query() dto: GetPageFunnelSummaryDto,
    @Res() res: Response,
  ) {
    const csv = await this.trackingService.exportPageFunnelCsv(dto);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/(\d{8})(\d{4})/, "$1-$2");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="page-funnel-${stamp}.csv"`);
    res.send(`\uFEFF${csv}`);
  }
}

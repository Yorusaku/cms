import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { CreateTrackingEventDto } from "./dto/create-tracking-event.dto";
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
}

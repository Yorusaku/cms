import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";

const TRACK_EVENT_TYPES = [
  "page_view",
  "component_click",
  "cta_click",
  "form_submit",
] as const;

export class GetTrackingEventsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId?: number;

  @IsOptional()
  @IsIn(TRACK_EVENT_TYPES)
  eventType?: (typeof TRACK_EVENT_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

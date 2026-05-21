import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

const TRACK_EVENT_TYPES = [
  "page_view",
  "component_click",
  "cta_click",
  "form_submit",
] as const;

export class CreateTrackingEventDto {
  @IsString()
  @IsIn(TRACK_EVENT_TYPES)
  eventType: (typeof TRACK_EVENT_TYPES)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  pageId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  componentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  componentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ctaText?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  utm?: Record<string, string>;

  @IsOptional()
  @IsObject()
  channel?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sessionId?: string;
}

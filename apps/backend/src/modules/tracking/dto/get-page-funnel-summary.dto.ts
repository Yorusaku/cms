import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class GetPageFunnelSummaryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  channel?: string;
}

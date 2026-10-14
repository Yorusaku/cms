import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class GetPageFunnelSummaryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId: number;

  /** 支持 YYYY-MM-DD 或完整时间；纯日期时结束日期补齐到当天 23:59:59.999 */
  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  publishedVersionId?: string;

  /**
   * 事件来源：crs 只统计访客行为（看板默认口径），
   * cms 只看后台操作，all 用于排查。
   */
  @IsOptional()
  @IsIn(["crs", "cms", "all"])
  source?: "crs" | "cms" | "all";
}

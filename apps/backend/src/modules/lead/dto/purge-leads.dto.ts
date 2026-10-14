import { IsBoolean, IsOptional } from "class-validator";

export class PurgeLeadsDto {
  /** true 时只统计符合条件的超期线索数量，不执行删除 */
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

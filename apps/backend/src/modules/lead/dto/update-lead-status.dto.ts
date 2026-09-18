import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import type { LeadStatus } from "../entities/lead.entity";

export class UpdateLeadStatusDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @IsIn(["new", "contacted", "converted", "invalid"])
  status: LeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  followUpRemark?: string;
}

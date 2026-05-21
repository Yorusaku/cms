import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class GetLeadListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

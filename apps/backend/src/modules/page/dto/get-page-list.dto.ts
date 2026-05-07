import { Type } from "class-transformer";
import { IsInt, Min, Max, IsOptional, IsString } from "class-validator";

export class GetPageListDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isAbled?: number;
}

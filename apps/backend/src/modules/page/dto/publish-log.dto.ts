import { Type } from "class-transformer";
import { IsInt, Min, IsOptional, IsString, IsNotEmpty, MaxLength } from "class-validator";

export class GetPublishLogsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId: number;
}

export class RollbackVersionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId: number;

  @IsString()
  @IsNotEmpty()
  versionId: string;
}

export class PublishPageDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

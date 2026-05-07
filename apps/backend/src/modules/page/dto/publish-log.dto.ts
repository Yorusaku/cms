import { Type } from "class-transformer";
import { IsInt, Min, IsString, IsNotEmpty } from "class-validator";

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

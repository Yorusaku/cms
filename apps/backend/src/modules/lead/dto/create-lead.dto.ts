import {
  IsInt,
  IsUUID,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class CreateLeadDto {
  @IsUUID()
  requestId: string;

  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: "手机号格式不正确" })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @IsInt()
  @Min(1)
  pageId: number;

  @IsString()
  @MaxLength(60)
  publishedVersionId: string;

  @IsString()
  @MaxLength(120)
  sessionId: string;

  @IsOptional()
  @IsObject()
  utm?: Record<string, string>;

  @IsOptional()
  @IsObject()
  channel?: Record<string, string>;
}

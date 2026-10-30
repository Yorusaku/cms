import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

const CONTENT_TARGET_TYPES = ["RichText", "Notice", "BusinessForm"] as const;

export class AiContentTargetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  componentId: string;

  @IsIn(CONTENT_TARGET_TYPES as unknown as string[])
  type: (typeof CONTENT_TARGET_TYPES)[number];

  /** RichText 当前正文（HTML） */
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;

  /** Notice 现有公告项文字（保持原顺序） */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  noticeTexts?: string[];

  /** BusinessForm 当前文字属性 */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  submitText?: string;
}

export class AiSuggestContentChangesDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  instruction: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AiContentTargetDto)
  targets: AiContentTargetDto[];
}

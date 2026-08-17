import { Type } from "class-transformer";
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class AiProductInputDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  price?: string | number;

  @IsOptional()
  originalPrice?: string | number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sellingPoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;
}

export class AiGeneratePageDto {
  @IsString()
  @MaxLength(80)
  pageName: string;

  @IsString()
  @MaxLength(40)
  activityType: string;

  @IsString()
  @MaxLength(120)
  audience: string;

  @IsString()
  @MaxLength(160)
  promotion: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiProductInputDto)
  products?: AiProductInputDto[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  leadGoal?: string;

  @IsString()
  @MaxLength(40)
  ctaText: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  styleTone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  extraPrompt?: string;
}

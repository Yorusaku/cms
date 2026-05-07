import { Type } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
} from "class-validator";

export class AddPageJsonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  schema: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  componentList?: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  shareDesc?: string;

  @IsOptional()
  @IsString()
  shareImage?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsString()
  backgroundPosition?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  /** 1 = publish, absent/0 = draft save */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  online?: number;
}

export class UpdatePageJsonDto extends AddPageJsonDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}

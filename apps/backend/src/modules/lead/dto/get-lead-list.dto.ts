import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import type { LeadStatus } from '../entities/lead.entity'

export class GetLeadListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number

  @IsOptional()
  @IsIn(['new', 'contacted', 'converted', 'invalid'])
  status?: LeadStatus

  @IsOptional()
  @IsString()
  @MaxLength(120)
  channel?: string
}

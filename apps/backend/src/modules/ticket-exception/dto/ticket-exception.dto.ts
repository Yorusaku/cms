import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'
import type { TicketExceptionStatus } from '../entities/ticket-exception.entity'

/**
 * 先 trim 再交给后续校验：`@MinLength(1)` 挡不住纯空格，
 * 而票据编号、说明这类字段必须是有内容的文本。
 */
const Trim = (): PropertyDecorator =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))

/** 登记票据异常：由已发布页面上的表单提交 */
export class CreateTicketExceptionDto {
  @IsUUID()
  requestId: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId: number

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  componentId: string

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  publishedVersionId: string

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  ticketNo: string

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  exceptionType: string

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>
}

export class GetTicketExceptionListDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ticketNo?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  exceptionType?: string

  @IsOptional()
  @IsIn(['pending', 'needs_supplement', 'resolved'])
  status?: TicketExceptionStatus

  @IsOptional()
  @IsString()
  @MaxLength(80)
  submitter?: string

  /**
   * 仅看我提交的：提交人从鉴权身份解析，不接受客户端指定的用户名。
   * query 参数是字符串，这里统一转成布尔。
   */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1)
  @IsBoolean()
  onlyMine?: boolean

  /** 按业务场景筛选（与 unassignedOnly 互斥，后端校验） */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  scenarioId?: string

  /** 按页面筛选（旧页面绑定回退查询用） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId?: number

  /** 仅历史未归属记录（与 scenarioId 互斥） */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1)
  @IsBoolean()
  unassignedOnly?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number
}

/** 提交补充：仅原提交人，仅 needs_supplement 状态 */
export class SupplementTicketExceptionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note: string

  /** 本次补充的扩展字段（增量，不覆盖原提交） */
  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>
}

/** 处理异常：要求补充 / 解决，都必须填说明 */
export class ProcessTicketExceptionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number

  @IsIn(['request_supplement', 'resolve'])
  action: 'request_supplement' | 'resolve'

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note: string
}

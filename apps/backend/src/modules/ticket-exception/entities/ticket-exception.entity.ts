import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import type { TicketExceptionStatus } from '@cms/types'

/** 异常处理状态：pending → needs_supplement → pending → resolved */
export type { TicketExceptionStatus } from '@cms/types'
export { TICKET_EXCEPTION_STATUSES } from '@cms/types'

/**
 * 票据异常主记录。
 *
 * - `fieldSnapshot` 保存创建时的字段定义快照：后续页面改版、下线或回滚，
 *   历史记录与补充操作都按当时的定义展示与校验；
 * - `extraFields` 按字段 key 存储，显示名只用于渲染，不作为存储键；
 * - 与线索表完全独立，不走 submitLead / remark。
 */
@Entity('ticket_exceptions')
export class TicketException {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id: number

  /** 幂等键：同一提交人重试返回原记录 */
  @Column({ type: 'uuid', name: 'request_id' })
  requestId: string

  @Index('idx_ticket_exceptions_ticket_no')
  /**
   * 业务场景 UUID（发布快照中的绑定）；历史未归属记录为 null。
   * 由服务端从发布快照写入，创建请求不接受客户端指定。
   */
  @Index('idx_ticket_exceptions_scenario')
  @Column({ type: 'uuid', nullable: true, name: 'business_scenario_id' })
  businessScenarioId: string | null

  @Column({ type: 'varchar', length: 120, name: 'ticket_no' })
  ticketNo: string

  @Column({ type: 'varchar', length: 80, name: 'business_category' })
  businessCategory: string

  @Column({ type: 'varchar', length: 80, name: 'exception_type' })
  exceptionType: string

  @Column({ type: 'text' })
  description: string

  /** 扩展字段值，key 为字段定义中的稳定 key */
  @Column({ type: 'jsonb', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, unknown> | null

  /** 创建时生效的字段定义快照（含固定字段与扩展字段） */
  @Column({ type: 'jsonb', name: 'field_snapshot' })
  fieldSnapshot: unknown

  @Index('idx_ticket_exceptions_status')
  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: TicketExceptionStatus

  @Column({ type: 'uuid', nullable: true, name: 'submitter_user_id' })
  submitterUserId: string | null

  @Index('idx_ticket_exceptions_submitter')
  @Column({ type: 'varchar', length: 80, name: 'submitter_username' })
  submitterUsername: string

  @Column({ type: 'integer', name: 'page_id' })
  pageId: number

  @Column({ type: 'varchar', length: 120, name: 'component_id' })
  componentId: string

  @Column({ type: 'varchar', length: 60, name: 'published_version_id' })
  publishedVersionId: string

  @Index('idx_ticket_exceptions_created_at')
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date
}

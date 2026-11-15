import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import type { TicketExceptionAction } from '@cms/types'

/**
 * 处理历史动作。
 * - created：登记异常
 * - supplement_requested：要求补充
 * - supplemented：提交补充（文字/字段/材料）
 * - resolved：解决
 */
export type { TicketExceptionAction } from '@cms/types'

/**
 * 处理历史。
 *
 * 每次状态变更写一条，补充内容放在 payload 里，
 * 不覆盖主记录的历史提交内容 —— 保证可追溯。
 */
@Entity('ticket_exception_events')
export class TicketExceptionEvent {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id: number

  @Index('idx_ticket_exception_events_exception')
  @Column({ type: 'integer', name: 'exception_id' })
  exceptionId: number

  @Column({ type: 'varchar', length: 40 })
  action: TicketExceptionAction

  @Column({ type: 'uuid', nullable: true, name: 'operator_user_id' })
  operatorUserId: string | null

  @Column({ type: 'varchar', length: 80, name: 'operator_username' })
  operatorUsername: string

  @Column({ type: 'text', nullable: true })
  note: string | null

  /** 本次操作附带的增量内容（补充的字段与材料等），不覆盖原提交 */
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date
}

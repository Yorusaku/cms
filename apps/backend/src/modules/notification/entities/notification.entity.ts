import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/** 站内提醒：只存接收人与来源，消息文案由前端按类型渲染（纯文本） */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id: number

  @Index('idx_notifications_recipient')
  @Column({ type: 'uuid', name: 'recipient_user_id' })
  recipientUserId: string

  @Column({ type: 'integer', name: 'source_event_id' })
  sourceEventId: number

  @Column({ type: 'integer', name: 'exception_id' })
  exceptionId: number

  /** 提醒类型：沿用业务动作名（supplement_requested / resolved） */
  @Column({ type: 'varchar', length: 40 })
  type: string

  @Column({ type: 'uuid', nullable: true, name: 'scenario_id' })
  scenarioId: string | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date | null
}

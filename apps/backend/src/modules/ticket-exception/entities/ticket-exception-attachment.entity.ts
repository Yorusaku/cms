import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 票据异常的私有材料（图片）。
 *
 * - `storageName` 是服务端生成的随机文件名，客户端只凭附件 ID 读取；
 * - 公开响应只返回 originalName / mimeType / sizeBytes 等展示信息；
 * - 文件本体放在私有目录，不注册任何静态资源路由。
 */
@Entity('ticket_exception_attachments')
export class TicketExceptionAttachment {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id: number

  @Index('idx_ticket_exception_attachments_exception')
  @Column({ type: 'integer', name: 'exception_id' })
  exceptionId: number

  @Column({ type: 'varchar', length: 160, name: 'storage_name' })
  storageName: string

  @Column({ type: 'varchar', length: 200, name: 'original_name' })
  originalName: string

  @Column({ type: 'varchar', length: 60, name: 'mime_type' })
  mimeType: string

  @Column({ type: 'integer', name: 'size_bytes' })
  sizeBytes: number

  @Column({ type: 'uuid', nullable: true, name: 'uploaded_by_user_id' })
  uploadedByUserId: string | null

  @Column({ type: 'varchar', length: 80, name: 'uploaded_by_username' })
  uploadedByUsername: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date
}

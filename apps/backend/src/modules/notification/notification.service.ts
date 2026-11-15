import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, IsNull, Repository } from 'typeorm'
import { User } from '../auth/entities/user.entity'
import { Notification } from './entities/notification.entity'

/** 提醒分页结果 */
export interface NotificationPage {
  items: Array<{
    id: number
    type: string
    exceptionId: number
    scenarioId: string | null
    read: boolean
    createdAt: string
  }>
  total: number
  unreadCount: number
  pageNum: number
  pageSize: number
}

/**
 * 轻量站内提醒：只服务「要求补充」「解决结果」两种事件，
 * 接收人从原记录确定，不接受客户端指定；接口只操作当前用户自己的提醒。
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  /**
   * 在业务事务内创建提醒。
   *
   * - 接收人优先取记录的 submitterUserId，票据表只有 username 时按现存账号解析；
   * - 账号不存在则跳过并记录内部日志，不阻断业务处理；
   * - 唯一约束（事件 ID + 接收人）冲突时忽略，保证并发/重试不重复提醒。
   */
  async createForEventIn(
    manager: EntityManager,
    input: {
      sourceEventId: number
      exceptionId: number
      type: string
      scenarioId: string | null
      submitterUserId?: string | null
      submitterUsername: string
    }
  ): Promise<void> {
    const recipient = await manager.getRepository(User).findOne({
      where: input.submitterUserId
        ? { id: input.submitterUserId }
        : { username: input.submitterUsername }
    })
    if (!recipient) {
      // 可定位的内部日志：账号可能已移除；不阻断业务处理
      this.logger.warn(
        `提醒未创建：提交人账号不存在 username=${input.submitterUsername} event=${input.sourceEventId}`
      )
      return
    }
    await manager
      .getRepository(Notification)
      .createQueryBuilder()
      .insert()
      .values({
        recipientUserId: recipient.id,
        sourceEventId: input.sourceEventId,
        exceptionId: input.exceptionId,
        type: input.type,
        scenarioId: input.scenarioId
      })
      // 在 SQL 层仅忽略幂等键冲突；捕获唯一异常会使 PostgreSQL 事务失效。
      .onConflict('("source_event_id", "recipient_user_id") DO NOTHING')
      .execute()
  }

  private toRead(at: Date | null): boolean {
    return at !== null
  }

  async list(
    userId: string,
    query: { onlyUnread?: boolean; scenarioId?: string; pageNum?: number; pageSize?: number }
  ): Promise<NotificationPage> {
    const pageNum = query.pageNum && query.pageNum > 0 ? query.pageNum : 1
    const pageSize = Math.min(query.pageSize && query.pageSize > 0 ? query.pageSize : 20, 100)
    const where: Record<string, unknown> = { recipientUserId: userId }
    if (query.onlyUnread) {
      where.readAt = IsNull()
    }
    if (query.scenarioId) {
      where.scenarioId = query.scenarioId
    }
    const [rows, total, unread] = await Promise.all([
      this.notificationRepo.find({
        where,
        order: { createdAt: 'DESC', id: 'DESC' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize
      }),
      this.notificationRepo.count({ where }),
      this.notificationRepo.count({
        where: {
          recipientUserId: userId,
          readAt: IsNull(),
          ...(query.scenarioId ? { scenarioId: query.scenarioId } : {})
        }
      })
    ])
    return {
      items: rows.map(row => ({
        id: row.id,
        type: row.type,
        exceptionId: row.exceptionId,
        scenarioId: row.scenarioId,
        read: this.toRead(row.readAt),
        createdAt: row.createdAt.toISOString()
      })),
      total,
      unreadCount: unread,
      pageNum,
      pageSize
    }
  }

  /**
   * 标记单条已读；重复调用保持成功（幂等）。
   *
   * 不用 update(criteria 带 null)：TypeORM 对 update 条件里的 null
   * 不保证生成 IS NULL，会静默不匹配——所以先读后存。
   */
  async markRead(userId: string, notificationId: number): Promise<void> {
    const row = await this.notificationRepo.findOne({
      where: { id: notificationId, recipientUserId: userId }
    })
    if (!row || row.readAt) {
      // 不存在 / 不是自己的 / 已读：都按成功处理
      return
    }
    row.readAt = new Date()
    await this.notificationRepo.save(row)
  }

  async unreadCount(userId: string, scenarioId?: string): Promise<number> {
    return this.notificationRepo.count({
      where: {
        recipientUserId: userId,
        readAt: IsNull(),
        ...(scenarioId ? { scenarioId } : {})
      }
    })
  }
}

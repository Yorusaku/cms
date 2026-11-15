import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common'
import type { NotificationPage } from './notification.service'
import { NotificationService } from './notification.service'
import { Roles } from '../../common/decorators/roles.decorator'
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy'

type AuthedRequest = { user: AuthenticatedUser }

@Controller('atlas-cms')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('getNotificationList')
  @Roles('admin', 'editor', 'viewer')
  async getNotificationList(
    @Query('onlyUnread') onlyUnread: string | undefined,
    @Query('scenarioId') scenarioId: string | undefined,
    @Query('pageNum') pageNum: string | undefined,
    @Query('pageSize') pageSize: string | undefined,
    @Req() req: AuthedRequest
  ): Promise<NotificationPage> {
    // 只返回当前登录用户自己的提醒，不接受用户 ID 参数
    return this.notificationService.list(req.user.id, {
      onlyUnread: onlyUnread === 'true' || onlyUnread === '1',
      scenarioId: scenarioId || undefined,
      pageNum: pageNum ? Number(pageNum) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    })
  }

  @Post('markNotificationRead/:id')
  @Roles('admin', 'editor', 'viewer')
  async markNotificationRead(
    @Param('id') id: string,
    @Req() req: AuthedRequest
  ): Promise<{ success: boolean }> {
    await this.notificationService.markRead(req.user.id, Number(id))
    return { success: true }
  }

  @Get('getNotificationUnreadCount')
  @Roles('admin', 'editor', 'viewer')
  async getNotificationUnreadCount(@Req() req: AuthedRequest): Promise<{ unreadCount: number }> {
    return {
      unreadCount: await this.notificationService.unreadCount(req.user.id)
    }
  }
}

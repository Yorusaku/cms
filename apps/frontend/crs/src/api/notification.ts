import http from '@/utils/http'
import type { ResponseData } from '@cms/utils'
import type { BusinessScenarioItem } from '@cms/types'

export const getBusinessScenarios = (): Promise<ResponseData<BusinessScenarioItem[]>> =>
  http.get('/atlas-cms/getBusinessScenarioList')

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

/** 站内提醒：只返回或修改当前登录用户自己的消息 */
export const getNotificationList = (params: {
  onlyUnread?: boolean
  scenarioId?: string
  pageNum?: number
  pageSize?: number
}): Promise<ResponseData<NotificationPage>> =>
  http.get<NotificationPage>('/atlas-cms/getNotificationList', {
    params: {
      onlyUnread: params.onlyUnread ? 'true' : undefined,
      scenarioId: params.scenarioId,
      pageNum: params.pageNum,
      pageSize: params.pageSize
    }
  })

export const markNotificationRead = (id: number): Promise<ResponseData<{ success: boolean }>> =>
  http.post(`/atlas-cms/markNotificationRead/${id}`, {})

export const getNotificationUnreadCount = (): Promise<ResponseData<{ unreadCount: number }>> =>
  http.get<{ unreadCount: number }>('/atlas-cms/getNotificationUnreadCount')

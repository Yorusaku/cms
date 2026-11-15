/**
 * 独立业务场景协议：CMS、CRS 与 NestJS 共用。
 *
 * 场景只组织记录与页面，不重复保存表单字段和异常类型；
 * 业务关联始终使用场景 UUID，改名不影响归属。
 */

export interface BusinessScenarioItem {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface CreateBusinessScenarioPayload {
  name: string
  description?: string
}

export interface UpdateBusinessScenarioPayload {
  id: string
  name: string
  description?: string
}

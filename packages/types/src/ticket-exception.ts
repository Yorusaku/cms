/**
 * 票据异常业务协议：CMS、CRS 与 NestJS 共用。
 *
 * 这里只放跨端需要的结构与枚举，不放数据库实体与 ORM 装饰器。
 * 后端实体、DTO 与前端页面都从这里取状态、字段与请求响应类型，
 * 避免三端各写一份字面量。
 */

/** 处理状态：待处理 →（要求补充）待补充 →（补充后）待处理 →（处理）已解决 */
export const TICKET_EXCEPTION_STATUSES = ['pending', 'needs_supplement', 'resolved'] as const

export type TicketExceptionStatus = (typeof TICKET_EXCEPTION_STATUSES)[number]

export const TICKET_EXCEPTION_STATUS_LABELS: Record<TicketExceptionStatus, string> = {
  pending: '待处理',
  needs_supplement: '待补充',
  resolved: '已解决'
}

export const TICKET_EXCEPTION_ACTIONS = [
  'created',
  'supplement_requested',
  'supplemented',
  'material_added',
  'resolved'
] as const

export type TicketExceptionAction = (typeof TICKET_EXCEPTION_ACTIONS)[number]

export const TICKET_EXCEPTION_ACTION_LABELS: Record<TicketExceptionAction, string> = {
  created: '登记异常',
  supplement_requested: '要求补充',
  supplemented: '提交补充',
  material_added: '上传材料',
  resolved: '已解决'
}

/** 扩展字段定义（快照里存的是这个结构） */
export interface TicketFieldDefinition {
  key: string
  label: string
  type: 'text' | 'date' | 'select'
  required?: boolean
  placeholder?: string
  options?: string[]
}

/** 字段定义快照：随记录保存，后续改版不影响历史展示 */
export interface TicketFieldSnapshot {
  businessCategory: string
  fixedFields: Array<{
    key: string
    label: string
    type: 'text'
    required: true
  }>
  extraFields: TicketFieldDefinition[]
}

export interface TicketExceptionItem {
  id: number
  /** 业务场景 UUID；历史未归属记录为 null */
  businessScenarioId: string | null
  ticketNo: string
  businessCategory: string
  exceptionType: string
  description: string
  status: TicketExceptionStatus
  submitterUsername: string
  createdAt: string
  updatedAt: string
}

export interface TicketExceptionEventItem {
  id: number
  action: TicketExceptionAction
  operatorUsername: string
  note: string | null
  payload: Record<string, unknown> | null
  createdAt: string
}

export interface TicketExceptionDetail extends TicketExceptionItem {
  extraFields: Record<string, unknown>
  fieldSnapshot: TicketFieldSnapshot
  pageId: number
  componentId: string
  publishedVersionId: string
  events: TicketExceptionEventItem[]
  attachments: TicketExceptionAttachment[]
}

/* ── 私有图片材料 ─────────────────────────────────────── */

/** 最多 3 张，每张不超过 5MB，仅 JPG/JPEG/PNG */
export const TICKET_ATTACHMENT_MAX_COUNT = 3
export const TICKET_ATTACHMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024
export const TICKET_ATTACHMENT_MIME_TYPES = ['image/jpeg', 'image/png'] as const

/** 附件摘要：不含磁盘路径或公开 URL，读取只能凭附件 ID */
export interface TicketExceptionAttachment {
  id: number
  originalName: string
  mimeType: string
  sizeBytes: number
  uploadedByUsername: string
  createdAt: string
}

/** 工作台摘要：计数来自数据库查询，不以当前页长度估算 */
export interface TicketExceptionWorkbenchSummary {
  /** 共享待处理池数量；viewer 无处理权限，返回 null（前端不展示入口） */
  pendingCount: number | null
  /** 待我补充（当前登录人为原提交人且 status=needs_supplement） */
  mineNeedsSupplementCount: number
  /** 我的提交总数（全部状态） */
  mineSubmittedCount: number
  /** 站内提醒未读数（提醒模块上线前为 0） */
  unreadCount: number
}

export interface TicketExceptionAttachmentUploadResult {
  attachment: TicketExceptionAttachment
  attachments: TicketExceptionAttachment[]
}

export interface TicketExceptionListQuery {
  ticketNo?: string
  exceptionType?: string
  status?: TicketExceptionStatus
  submitter?: string
  /** 按业务场景筛选（与 unassignedOnly 互斥） */
  scenarioId?: string
  /** 按页面筛选（场景绑定回退查询用） */
  pageId?: number
  /** 仅历史未归属记录（与 scenarioId 互斥） */
  unassignedOnly?: boolean
  pageNum?: number
  pageSize?: number
}

export interface TicketExceptionListResult {
  items: TicketExceptionItem[]
  total: number
  pageNum: number
  pageSize: number
}

export interface CreateTicketExceptionPayload {
  requestId: string
  pageId: number
  componentId: string
  publishedVersionId: string
  ticketNo: string
  exceptionType: string
  description: string
  extraFields?: Record<string, unknown>
}

export interface SupplementTicketExceptionPayload {
  id: number
  note: string
  extraFields?: Record<string, unknown>
}

export type ProcessTicketExceptionAction = 'request_supplement' | 'resolve'

export interface ProcessTicketExceptionPayload {
  id: number
  action: ProcessTicketExceptionAction
  note: string
}

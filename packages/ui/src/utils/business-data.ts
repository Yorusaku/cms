/**
 * 业务数据列表的运行时适配层。
 *
 * 为什么不用 props 传函数：列表渲染由 Schema 驱动，props 必须可序列化。
 * 运行端（CRS）通过 `provide(BUSINESS_DATA_ADAPTER_KEY, adapter)` 注入真实请求实现，
 * 共享物料只依赖这个接口，不 import 任何端内私有模块；
 * 没有注入时（编辑画布、独立预览）物料展示示例数据，不发起真实请求。
 */
import type { TicketExceptionListQuery, TicketExceptionListResult } from '@cms/types'

/** 列表查询：`onlyMine` 由后端按登录身份解析，前端不传用户名 */
export interface BusinessListQuery extends TicketExceptionListQuery {
  onlyMine?: boolean
}

export interface BusinessListPageResult extends TicketExceptionListResult {
  /** 预览/示例数据的标记，物料据此显示「示例数据」提示 */
  sample?: boolean
}

export type BusinessDataAdapter = (query: BusinessListQuery) => Promise<BusinessListPageResult>

/** 注入键：用 Symbol.for 保证跨包同一份引用 */
export const BUSINESS_DATA_ADAPTER_KEY = Symbol.for('cms.businessDataAdapter')

/** 行点击：由运行端决定打开哪个详情页，物料只上报记录 ID */
export type BusinessRowClickHandler = (row: {
  id?: number | string
  [key: string]: unknown
}) => void

export const BUSINESS_ROW_CLICK_KEY = Symbol.for('cms.businessRowClick')

/**
 * 预览用示例数据：只用于编辑画布与独立预览，不含真实业务记录。
 * 字段与 TicketExceptionItem 对齐，保证列配置在预览里也能看到效果。
 */
export const createSampleTicketRows = (): Array<Record<string, string | number>> => [
  {
    id: 9001,
    ticketNo: '示例-FP-0001',
    businessCategory: '报销票据',
    exceptionType: '票据信息缺失',
    description: '示例：缺少开票日期',
    status: 'pending',
    submitterUsername: '示例用户',
    createdAt: '2026-10-01T09:30:00.000Z'
  },
  {
    id: 9002,
    ticketNo: '示例-FP-0002',
    businessCategory: '报销票据',
    exceptionType: '质检信息不一致',
    description: '示例：金额与质检单不一致',
    status: 'needs_supplement',
    submitterUsername: '示例用户',
    createdAt: '2026-10-02T14:05:00.000Z'
  },
  {
    id: 9003,
    ticketNo: '示例-FP-0003',
    businessCategory: '报销票据',
    exceptionType: '票据信息缺失',
    description: '示例：票据编号重复',
    status: 'resolved',
    submitterUsername: '示例用户',
    createdAt: '2026-10-03T10:00:00.000Z'
  }
]

import http from '@/utils/http'
import type { RequestConfig, ResponseData } from '@cms/utils'
import {
  TICKET_EXCEPTION_ACTION_LABELS,
  TICKET_EXCEPTION_STATUS_LABELS,
  type CreateTicketExceptionPayload,
  type SupplementTicketExceptionPayload,
  type ProcessTicketExceptionPayload,
  type TicketExceptionAction,
  type TicketExceptionDetail,
  type TicketExceptionItem,
  type TicketExceptionListQuery,
  type TicketExceptionListResult,
  type TicketExceptionStatus,
  type TicketExceptionWorkbenchSummary
} from '@cms/types'

/**
 * 票据异常：CMS 管理端接口。
 *
 * 类型与文案统一来自 `@cms/types`（与 CRS、NestJS 共用），
 * 这里只保留 Element Plus 需要的标签颜色映射。
 */
export type {
  CreateTicketExceptionPayload,
  ProcessTicketExceptionPayload,
  SupplementTicketExceptionPayload,
  TicketExceptionAction,
  TicketExceptionDetail,
  TicketExceptionItem,
  TicketExceptionListQuery,
  TicketExceptionListResult,
  TicketExceptionStatus
}

const writeConfig: RequestConfig = { showError: true }

export const createTicketException = async (
  data: CreateTicketExceptionPayload
): Promise<ResponseData<{ id: number; duplicated: boolean }>> =>
  http.post('/atlas-cms/createTicketException', data, writeConfig)

export const getTicketExceptionList = async (
  params: TicketExceptionListQuery & { onlyMine?: boolean }
): Promise<ResponseData<TicketExceptionListResult>> =>
  http.get('/atlas-cms/getTicketExceptionList', { params })

export const getTicketExceptionSummary = (
  scenarioId?: string
): Promise<ResponseData<TicketExceptionWorkbenchSummary>> =>
  http.get('/atlas-cms/getTicketExceptionSummary', { params: { scenarioId } })

export const getTicketExceptionDetail = async (
  id: number
): Promise<ResponseData<TicketExceptionDetail>> =>
  http.get('/atlas-cms/getTicketExceptionDetail', { params: { id } })

export const supplementTicketException = async (
  data: SupplementTicketExceptionPayload
): Promise<ResponseData<TicketExceptionDetail>> =>
  http.post('/atlas-cms/supplementTicketException', data, writeConfig)

export const processTicketException = async (
  data: ProcessTicketExceptionPayload
): Promise<ResponseData<TicketExceptionDetail>> =>
  http.post('/atlas-cms/processTicketException', data, writeConfig)

/** 状态展示文案与颜色 */
/** 以 Blob 读取私有材料（鉴权请求，不用公开素材接口） */
export const fetchTicketAttachmentBlob = async (id: number): Promise<Blob> =>
  (await http.get('/atlas-cms/getTicketExceptionAttachment', {
    params: { id },
    responseType: 'blob',
    showError: false
  })) as unknown as Blob

export const TICKET_STATUS_META: Record<
  TicketExceptionStatus,
  { label: string; type: 'warning' | 'info' | 'success' }
> = {
  pending: { label: TICKET_EXCEPTION_STATUS_LABELS.pending, type: 'warning' },
  needs_supplement: {
    label: TICKET_EXCEPTION_STATUS_LABELS.needs_supplement,
    type: 'info'
  },
  resolved: { label: TICKET_EXCEPTION_STATUS_LABELS.resolved, type: 'success' }
}

export const TICKET_ACTION_LABELS: Record<TicketExceptionAction, string> =
  TICKET_EXCEPTION_ACTION_LABELS

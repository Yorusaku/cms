import http from '@/utils/http'
import type { ResponseData } from '@cms/utils'
import type {
  ProcessTicketExceptionPayload,
  TicketExceptionAttachmentUploadResult,
  SupplementTicketExceptionPayload,
  TicketExceptionDetail,
  TicketExceptionListQuery,
  TicketExceptionListResult
} from '@cms/types'

/**
 * CRS 端票据异常接口。
 *
 * 类型统一来自 `@cms/types`，不从后端私有 service 文件跨端引用。
 */
export const fetchTicketExceptionList = (
  query: TicketExceptionListQuery & { onlyMine?: boolean }
): Promise<ResponseData<TicketExceptionListResult>> =>
  http.get<TicketExceptionListResult>('/atlas-cms/getTicketExceptionList', {
    params: Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== '')
    ),
    showError: false
  })

export const fetchTicketExceptionDetail = (
  id: number
): Promise<ResponseData<TicketExceptionDetail>> =>
  http.get<TicketExceptionDetail>('/atlas-cms/getTicketExceptionDetail', {
    params: { id },
    showError: false
  })

export const supplementTicketException = (
  payload: SupplementTicketExceptionPayload
): Promise<ResponseData<TicketExceptionDetail>> =>
  http.post<TicketExceptionDetail>('/atlas-cms/supplementTicketException', payload, {
    showError: true
  })

/** 上传材料图片：multipart，后端按文件头校验并限制 3 张 / 5MB */
export const uploadTicketExceptionAttachment = (
  exceptionId: number,
  file: File
): Promise<{ data: TicketExceptionAttachmentUploadResult }> => {
  const formData = new FormData()
  formData.append('exceptionId', String(exceptionId))
  formData.append('file', file)
  return http.post<TicketExceptionAttachmentUploadResult>(
    '/atlas-cms/uploadTicketExceptionAttachment',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ) as never
}

/** 以 Blob 读取私有材料（携带 Authorization，不走公开素材接口） */
export const fetchTicketAttachmentBlob = async (attachmentId: number): Promise<Blob> => {
  const response = await http.get<Blob>(`/atlas-cms/getTicketExceptionAttachment`, {
    params: { id: attachmentId },
    responseType: 'blob',
    showError: false
  } as never)
  return response as unknown as Blob
}

export const processTicketException = (
  payload: ProcessTicketExceptionPayload
): Promise<ResponseData<TicketExceptionDetail>> =>
  http.post<TicketExceptionDetail>('/atlas-cms/processTicketException', payload, {
    showError: true
  })

import http from '@/utils/http'

export interface PageListParams {
  pageNum?: number
  pageSize?: number
  name?: string
  isAbled?: number
}

export interface PageListResponse {
  code: number
  message: string
  data: {
    list: PageItem[]
    total: number
    pageNum: number
    pageSize: number
  }
}

export interface PageItem {
  id: number
  name: string
  isAbled: number
  create_time: string
  update_time: string
  [key: string]: any
}

export interface SavePageParams {
  id?: number
  name: string
  schema: any
  [key: string]: any
}

export function getCmsPageList(data: PageListParams) {
  const params = new URLSearchParams()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value))
    }
  })
  return http.get<PageListResponse>(`/atlas-cms/getPageList?${params.toString()}`)
}

export function saveCmsPage(data: SavePageParams) {
  if (data.id) {
    return http.post('/atlas-cms/updateCmsJson', data)
  } else {
    return http.post('/atlas-cms/addPageJson', data)
  }
}

export function delCmsPageById(pageId: number) {
  return http.post('/atlas-cms/deletePage', { id: pageId })
}

export function getCmsPageById(pageId: number) {
  return http.get('/atlas-cms/getPageJson', { params: { id: pageId } })
}

export function updateStatus(data: { id: number; isAbled: number }) {
  return http.post('/atlas-cms/updatePageStatus', data)
}

export function deletePage(data: { id: number }) {
  return http.post('/atlas-cms/deletePage', data)
}

export function login(data: { username: string; password: string }) {
  return http.post<{ token: string }>('/atlas-cms/login', data)
}

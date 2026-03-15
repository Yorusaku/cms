import http from '@/utils/http'
import type { IPageSchemaV2 } from '@cms/types'

export interface PageDetailResponse {
  code: number
  message: string
  data: {
    id: number
    name: string
    schema: string // JSON 字符串
    isAbled: number
    create_time: string
    update_time: string
    [key: string]: unknown
  }
}

export type PageSchema = IPageSchemaV2

/**
 * 根据页面 ID 获取页面详情数据
 * @param pageId 页面 ID
 * @returns 页面详情响应
 */
export function getPageDataById(pageId: number) {
  return http.get<PageDetailResponse>('/atlas-cms/getPageJson', {
    params: { id: pageId }
  })
}

/**
 * 解析页面 Schema 数据
 * @param schemaData 原始 Schema 数据（可能是字符串或对象）
 * @returns 解析后的 Schema 对象
 */
export function parsePageSchema(schemaData: string | PageSchema): PageSchema {
  if (typeof schemaData === 'string') {
    try {
      return JSON.parse(schemaData) as PageSchema
    } catch (error) {
      console.error('解析 Schema 失败:', error)
      throw new Error('页面数据格式错误')
    }
  }
  return schemaData
}

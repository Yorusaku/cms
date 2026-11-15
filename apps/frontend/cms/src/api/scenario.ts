import http from '@/utils/http'
import type { ResponseData } from '@cms/utils'
import type {
  BusinessScenarioItem,
  CreateBusinessScenarioPayload,
  UpdateBusinessScenarioPayload
} from '@cms/types'

/** 场景管理：CMS 端接口（类型来自 @cms/types，不从后端私有文件取） */
export const getBusinessScenarioList = (): Promise<ResponseData<BusinessScenarioItem[]>> =>
  http.get<BusinessScenarioItem[]>('/atlas-cms/getBusinessScenarioList')

export const createBusinessScenario = (
  data: CreateBusinessScenarioPayload
): Promise<ResponseData<BusinessScenarioItem>> =>
  http.post('/atlas-cms/createBusinessScenario', data, { showError: true })

export const updateBusinessScenario = (
  data: UpdateBusinessScenarioPayload
): Promise<ResponseData<BusinessScenarioItem>> =>
  http.put(`/atlas-cms/updateBusinessScenario/${data.id}`, data, {
    showError: true
  })

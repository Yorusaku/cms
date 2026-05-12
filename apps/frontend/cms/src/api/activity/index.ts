import http from "@/utils/http";
import type { RequestConfig, ResponseData } from "@cms/utils";
import { PageListResponseSchema } from "@cms/types";

export interface PageListParams {
  pageNum?: number;
  pageSize?: number;
  name?: string;
  isAbled?: number;
}

export interface PageListData {
  list: PageItem[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface PageItem {
  id: number;
  name: string;
  isAbled: number;
  create_time: string;
  update_time: string;
  [key: string]: unknown;
}

export interface SavePageParams {
  id?: number;
  name: string;
  schema: unknown;
  [key: string]: unknown;
}

export interface PublishLogItem {
  versionId: string | number;
  displayVersion?: string;
  operator?: string;
  note?: string;
  publishedAt?: number | string;
}

/** 写操作默认配置：自动显示错误提示 */
const writeConfig: RequestConfig = { showError: true };

export async function getCmsPageList(
  data: PageListParams,
): Promise<ResponseData<PageListData>> {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const response = await http.get<PageListData>(
    `/atlas-cms/getPageList?${params.toString()}`,
  );
  // 运行时校验响应结构
  PageListResponseSchema.safeParse(response);
  return response;
}

export function saveCmsPage(
  data: SavePageParams,
): Promise<ResponseData<unknown>> {
  if (data.id) {
    return http.post("/atlas-cms/updateCmsJson", data, writeConfig);
  }
  return http.post("/atlas-cms/addPageJson", data, writeConfig);
}

export function delCmsPageById(
  pageId: number,
): Promise<ResponseData<unknown>> {
  return http.post("/atlas-cms/deletePage", { id: pageId }, writeConfig);
}

export function getCmsPageById(
  pageId: number,
): Promise<ResponseData<{ id: number; name: string; schema: unknown }>> {
  return http.get("/atlas-cms/getPageJson", { params: { id: pageId } });
}

export function updateStatus(
  data: { id: number; isAbled: number },
): Promise<ResponseData<unknown>> {
  return http.post("/atlas-cms/updatePageStatus", data, writeConfig);
}

export function deletePage(
  data: { id: number },
): Promise<ResponseData<unknown>> {
  return http.post("/atlas-cms/deletePage", data, writeConfig);
}

export function login(
  data: { username: string; password: string },
): Promise<ResponseData<{ token: string }>> {
  return http.post<{ token: string }>("/atlas-cms/login", data, writeConfig);
}

export function getPagePublishLogs(
  pageId: number,
): Promise<ResponseData<PublishLogItem[]>> {
  return http.get<PublishLogItem[]>("/atlas-cms/getPagePublishLogs", {
    params: { pageId },
  });
}

export function rollbackPageVersion(payload: {
  pageId: number;
  versionId: string | number;
}): Promise<ResponseData<unknown>> {
  return http.post("/atlas-cms/rollbackPageVersion", payload, writeConfig);
}
// ==================== 模板市场 API ====================

export interface TemplateItem {
  id: number;
  name: string;
  thumbnail: string | null;
  category: 'marketing' | 'ecommerce' | 'brand' | 'general';
  description: string | null;
  useCount: number;
  isActive: boolean;
  createTime: string;
  schema: unknown;
}

export function getTemplateList(category?: string): Promise<ResponseData<TemplateItem[]>> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  return http.get<TemplateItem[]>(`/atlas-cms/getTemplateList${params}`);
}

export function getTemplateById(id: number): Promise<ResponseData<TemplateItem>> {
  return http.get<TemplateItem>(`/atlas-cms/getTemplateById?id=${id}`);
}

export function createPageFromTemplate(
  data: { templateId: number; name: string },
): Promise<ResponseData<{ id: number }>> {
  return http.post('/atlas-cms/createPageFromTemplate', data, writeConfig);
}

// ==================== 用户管理 API ====================

export interface UserItem {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  nickname: string | null;
  createTime: string;
  updateTime: string;
}

export function getUserList(): Promise<ResponseData<UserItem[]>> {
  return http.get<UserItem[]>('/atlas-cms/getUserList');
}

export function createUser(
  data: { username: string; password: string; role: string; nickname?: string },
): Promise<ResponseData<UserItem>> {
  return http.post('/atlas-cms/createUser', data, writeConfig);
}

export function updateUser(
  data: { id: string; role?: string; nickname?: string },
): Promise<ResponseData<UserItem>> {
  return http.post('/atlas-cms/updateUser', data, writeConfig);
}

export function deleteUser(id: string): Promise<ResponseData<unknown>> {
  return http.post('/atlas-cms/deleteUser', { id }, writeConfig);
}
/** 统一 API 响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页数据结构 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

/** 业务错误码 */
export const ApiCode = {
  SUCCESS: 10000,
  AUTH_FAILED: -2,
  VALIDATION_ERROR: -1,
  SERVER_ERROR: -3,
} as const;

export type ApiCodeValue = (typeof ApiCode)[keyof typeof ApiCode];

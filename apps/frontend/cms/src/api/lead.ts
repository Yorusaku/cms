import http from "@/utils/http";
import type { ResponseData } from "@cms/utils";

export interface LeadItem {
  id: number;
  name: string;
  phoneNumber: string;
  remark: string | null;
  pageId: number | null;
  utm: Record<string, string> | null;
  channel: Record<string, string> | null;
  createdAt: string;
}

export interface GetLeadListParams {
  pageId?: number;
  pageNum?: number;
  pageSize?: number;
}

export interface LeadListData {
  list: LeadItem[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export const getLeadList = (
  params: GetLeadListParams = {},
): Promise<ResponseData<LeadListData>> => {
  return http.get<LeadListData>("/atlas-cms/getLeadList", {
    params,
  });
};

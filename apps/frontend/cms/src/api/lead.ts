import http from "@/utils/http";
import type { ResponseData } from "@cms/utils";

export interface LeadItem {
  id: number;
  name: string;
  phoneNumber: string;
  remark: string | null;
  pageId: number;
  publishedVersionId: string;
  sessionId: string;
  status: "new" | "contacted" | "converted" | "invalid";
  followUpRemark: string | null;
  followedBy: string | null;
  followedAt: string | null;
  utm: Record<string, string> | null;
  channel: Record<string, string> | null;
  createdAt: string;
}

export interface GetLeadListParams {
  pageId?: number;
  pageNum?: number;
  pageSize?: number;
  status?: LeadItem["status"];
  channel?: string;
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

export const updateLeadStatus = (
  data: Pick<LeadItem, "id" | "status"> & { followUpRemark?: string },
): Promise<ResponseData<LeadItem>> => {
  return http.post<LeadItem>("/atlas-cms/updateLeadStatus", data, {
    showError: true,
  });
};

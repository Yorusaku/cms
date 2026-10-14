import http from "@/utils/http";
import type { ResponseData } from "@cms/utils";
import { buildExportFilename, downloadFile, type DownloadFile } from "@/utils/download";

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

/** 导出结果：blob 为后端回的文件流，filename 为前端生成的落地文件名 */
export type LeadExportResult = DownloadFile;

/** 线索保留策略 */
export interface LeadRetentionPolicy {
  retentionDays: number;
  cutoffAt: string;
}

/** 超期线索清理结果 */
export interface LeadPurgeResult extends LeadRetentionPolicy {
  dryRun: boolean;
  matched: number;
  deleted: number;
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

export const exportLeadCsv = async (
  params: GetLeadListParams = {},
): Promise<DownloadFile> => {
  return downloadFile(
    "/atlas-cms/exportLeadCsv",
    params as Record<string, unknown>,
    buildExportFilename("线索导出"),
  );
};

export const getLeadRetentionPolicy = (): Promise<ResponseData<LeadRetentionPolicy>> => {
  return http.get<LeadRetentionPolicy>("/atlas-cms/getLeadRetentionPolicy");
};

export const purgeExpiredLeads = (
  dryRun: boolean,
): Promise<ResponseData<LeadPurgeResult>> => {
  return http.post<LeadPurgeResult>(
    "/atlas-cms/purgeExpiredLeads",
    { dryRun },
    { showError: true } as never,
  );
};

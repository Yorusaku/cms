import http from "@/utils/http";
import type { ResponseData } from "@cms/utils";
import { buildExportFilename, downloadFile, type DownloadFile } from "@/utils/download";

export interface FunnelMetrics {
  pageViews: number;
  /** 去重会话数（同一 sessionId 多次访问只计一次） */
  uniqueVisitors: number;
  ctaClicks: number;
  formSubmits: number;
  leads: number;
  ctaClickRate: number;
  leadConversionRate: number;
}

export interface FunnelChannel {
  channelKey: string;
  channelValue: string;
  metrics: FunnelMetrics;
}

export interface FunnelTrendPoint {
  /** YYYY-MM-DD */
  date: string;
  metrics: FunnelMetrics;
}

export interface PageFunnelSummary {
  pageId: number;
  metrics: FunnelMetrics;
  channels: FunnelChannel[];
  dailyTrend: FunnelTrendPoint[];
}

export interface FunnelQueryParams {
  pageId: number;
  startTime?: string;
  endTime?: string;
  channel?: string;
  publishedVersionId?: string;
  /** crs（默认，访客口径）/ cms / all */
  source?: "crs" | "cms" | "all";
}

export const getPageFunnelSummary = (
  params: FunnelQueryParams,
): Promise<ResponseData<PageFunnelSummary>> =>
  http.get<PageFunnelSummary>("/atlas-cms/getPageFunnelSummary", { params });

/** 导出看板数据（概览 + 渠道 + 趋势），仅管理员可用 */
export const exportPageFunnelCsv = (params: FunnelQueryParams): Promise<DownloadFile> =>
  downloadFile(
    "/atlas-cms/exportPageFunnelCsv",
    params as unknown as Record<string, unknown>,
    buildExportFilename("页面效果"),
  );

import { deepClone } from "@cms/utils";
import type { IPageSchemaV2 } from "@cms/types";
import {
  getPagePublishLogs,
  rollbackPageVersion,
} from "@/api/activity";

export type PageContentStatus = "draft" | "published";

export interface PublishLogRecord {
  pageId: number;
  versionId: string;
  displayVersion: string;
  operator: string;
  note: string;
  publishedAt: number;
  schema?: IPageSchemaV2;
}

const SYNC_SIGNAL_KEY = "cms-page-publish-sync-v1";

const emitPublishSyncSignal = () => {
  localStorage.setItem(SYNC_SIGNAL_KEY, String(Date.now()));
};

export const getPublishSyncSignalKey = () => SYNC_SIGNAL_KEY;

/** Fetch publish logs from server. Falls back to empty array on error. */
export const getLocalPublishLogs = async (
  pageId: number,
): Promise<PublishLogRecord[]> => {
  try {
    const resp = await getPagePublishLogs(pageId);
    if ((resp as { code?: number }).code !== 10000) {
      return [];
    }
    const data = (resp as unknown as { data?: PublishLogRecord[] }).data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

/** Mark page as published — server handles this during save (online: 1) */
export const markPagePublished = (payload: {
  pageId: number;
  schema: IPageSchemaV2;
  note?: string;
}): PublishLogRecord => {
  const now = Date.now();
  const log: PublishLogRecord = {
    pageId: payload.pageId,
    versionId: `${payload.pageId}-${now}`,
    displayVersion: buildDisplayVersion(now),
    operator: "当前用户",
    note: payload.note || "发布",
    publishedAt: now,
    schema: deepClone(payload.schema),
  };
  return log;
};

/** Mark page as draft — server handles status in save API */
export const markPageDraft = (_pageId: number) => {
  emitPublishSyncSignal();
};

/** Rollback — delegates to server API */
export const rollbackLocalPublishVersion = async (payload: {
  pageId: number;
  versionId: string | number;
}): Promise<{ schema?: IPageSchemaV2 } | null> => {
  try {
    const resp = await rollbackPageVersion({
      pageId: payload.pageId,
      versionId: String(payload.versionId),
    });
    if ((resp as { code?: number }).code !== 10000) {
      return null;
    }
    const data = (resp as { data?: { schema?: IPageSchemaV2 } }).data;
    return data || null;
  } catch {
    return null;
  }
};

/** Resolve page content status from isAbled */
export const resolvePageContentStatus = (
  isAbled: number | undefined,
  fallback: PageContentStatus = "draft",
): PageContentStatus => {
  return isAbled === 1 ? "published" : fallback;
};

const buildDisplayVersion = (publishedAt: number) => {
  const date = new Date(publishedAt);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `v${date.getFullYear()}${month}${day}-${hour}${minute}`;
};

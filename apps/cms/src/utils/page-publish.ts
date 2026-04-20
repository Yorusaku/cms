import { deepClone } from "@cms/utils";
import type { IPageSchemaV2 } from "@cms/types";

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

const LOG_STORAGE_PREFIX = "cms-page-publish-log-v1";
const STATUS_STORAGE_PREFIX = "cms-page-content-status-v1";
const SYNC_SIGNAL_KEY = "cms-page-publish-sync-v1";

const buildLogKey = (pageId: number) => `${LOG_STORAGE_PREFIX}:page:${pageId}`;
const buildStatusKey = (pageId: number) =>
  `${STATUS_STORAGE_PREFIX}:page:${pageId}`;

const buildDisplayVersion = (publishedAt: number) => {
  const date = new Date(publishedAt);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `v${date.getFullYear()}${month}${day}-${hour}${minute}`;
};

const parseLogList = (rawValue: string | null): PublishLogRecord[] => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as PublishLogRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.pageId === "number" &&
          typeof item.versionId === "string" &&
          typeof item.displayVersion === "string" &&
          typeof item.operator === "string" &&
          typeof item.note === "string" &&
          typeof item.publishedAt === "number",
      )
      .map((item) => ({
        ...item,
        schema:
          item.schema && typeof item.schema === "object"
            ? (item.schema as IPageSchemaV2)
            : undefined,
      }))
      .sort((a, b) => b.publishedAt - a.publishedAt);
  } catch {
    return [];
  }
};

const emitPublishSyncSignal = () => {
  localStorage.setItem(SYNC_SIGNAL_KEY, String(Date.now()));
};

export const getPublishSyncSignalKey = () => SYNC_SIGNAL_KEY;

export const getLocalPublishLogs = (pageId: number): PublishLogRecord[] => {
  return parseLogList(localStorage.getItem(buildLogKey(pageId)));
};

export const appendLocalPublishLog = (payload: {
  pageId: number;
  schema: IPageSchemaV2;
  note?: string;
  operator?: string;
}) => {
  const now = Date.now();
  const versionId = `${payload.pageId}-${now}`;
  const log: PublishLogRecord = {
    pageId: payload.pageId,
    versionId,
    displayVersion: buildDisplayVersion(now),
    operator:
      payload.operator ||
      localStorage.getItem("username") ||
      localStorage.getItem("userName") ||
      "当前用户",
    note: payload.note || "发布",
    publishedAt: now,
    schema: deepClone(payload.schema),
  };

  const current = getLocalPublishLogs(payload.pageId);
  const next = [log, ...current].slice(0, 50);
  localStorage.setItem(buildLogKey(payload.pageId), JSON.stringify(next));
  emitPublishSyncSignal();
  return log;
};

export const setPageContentStatus = (
  pageId: number,
  status: PageContentStatus,
) => {
  localStorage.setItem(buildStatusKey(pageId), status);
  emitPublishSyncSignal();
};

export const getPageContentStatus = (pageId: number): PageContentStatus | null => {
  const value = localStorage.getItem(buildStatusKey(pageId));
  if (value === "draft" || value === "published") {
    return value;
  }
  return null;
};

export const resolvePageContentStatus = (
  pageId: number,
  fallback: PageContentStatus = "draft",
) => {
  return getPageContentStatus(pageId) ?? fallback;
};

export const markPagePublished = (payload: {
  pageId: number;
  schema: IPageSchemaV2;
  note?: string;
}) => {
  const log = appendLocalPublishLog(payload);
  setPageContentStatus(payload.pageId, "published");
  return log;
};

export const markPageDraft = (pageId: number) => {
  setPageContentStatus(pageId, "draft");
};

export const rollbackLocalPublishVersion = (payload: {
  pageId: number;
  versionId: string | number;
}) => {
  const versionId = String(payload.versionId);
  const logs = getLocalPublishLogs(payload.pageId);
  const target = logs.find((item) => item.versionId === versionId);
  if (!target) {
    return null;
  }
  setPageContentStatus(payload.pageId, "draft");
  return target;
};


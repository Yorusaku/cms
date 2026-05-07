import { deepClone } from "@cms/utils";
import type { IPageSchemaV2 } from "@cms/types";

const DRAFT_STORAGE_PREFIX = "cms-page-draft-v1";

interface PageDraftRecord {
  savedAt: number;
  schema: IPageSchemaV2;
}

const buildDraftKey = (pageId?: number | null) => {
  if (pageId) {
    return `${DRAFT_STORAGE_PREFIX}:page:${pageId}`;
  }
  return `${DRAFT_STORAGE_PREFIX}:page:new`;
};

const parseDraft = (rawValue: string | null): PageDraftRecord | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as PageDraftRecord;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (!parsed.schema || typeof parsed.schema !== "object") {
      return null;
    }
    if (typeof parsed.savedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const savePageDraft = (pageId: number | null, schema: IPageSchemaV2) => {
  const key = buildDraftKey(pageId);
  const payload: PageDraftRecord = {
    savedAt: Date.now(),
    schema: deepClone(schema),
  };
  localStorage.setItem(key, JSON.stringify(payload));
};

export const loadPageDraft = (pageId: number | null): PageDraftRecord | null => {
  const key = buildDraftKey(pageId);
  return parseDraft(localStorage.getItem(key));
};

export const clearPageDraft = (pageId: number | null) => {
  const key = buildDraftKey(pageId);
  localStorage.removeItem(key);
};

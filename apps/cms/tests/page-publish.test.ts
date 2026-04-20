import { describe, expect, it } from "vitest";
import type { IPageSchemaV2 } from "@cms/types";
import {
  appendLocalPublishLog,
  getLocalPublishLogs,
  getPageContentStatus,
  markPageDraft,
  markPagePublished,
  rollbackLocalPublishVersion,
} from "../src/utils/page-publish";

const schema: IPageSchemaV2 = {
  version: "2.0.0",
  pageConfig: {
    name: "发布测试页",
    shareDesc: "",
    shareImage: "",
    backgroundColor: "",
    backgroundImage: "",
    backgroundPosition: "top",
    cover: "",
  },
  componentMap: {},
  rootIds: [],
  state: undefined,
};

describe("page publish", () => {
  it("marks page published and writes log", () => {
    const pageId = 2001;
    markPagePublished({ pageId, schema, note: "首次发布" });

    const logs = getLocalPublishLogs(pageId);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].note).toBe("首次发布");
    expect(getPageContentStatus(pageId)).toBe("published");
  });

  it("can mark page draft after publish", () => {
    const pageId = 2002;
    appendLocalPublishLog({ pageId, schema, note: "发布" });
    markPageDraft(pageId);
    expect(getPageContentStatus(pageId)).toBe("draft");
  });

  it("can rollback to a local published version", () => {
    const pageId = 2003;
    const log = appendLocalPublishLog({ pageId, schema, note: "回滚测试" });

    const rollbackHit = rollbackLocalPublishVersion({
      pageId,
      versionId: log.versionId,
    });

    expect(rollbackHit?.versionId).toBe(log.versionId);
    expect(getPageContentStatus(pageId)).toBe("draft");
  });
});

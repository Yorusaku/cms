import { describe, expect, it, vi, beforeEach } from "vitest";
import type { IPageSchemaV2 } from "@cms/types";
import {
  getLocalPublishLogs,
  getPublishSyncSignalKey,
  markPageDraft,
  markPagePublished,
  resolvePageContentStatus,
  rollbackLocalPublishVersion,
} from "../src/utils/page-publish";
import { getPagePublishLogs, rollbackPageVersion } from "@/api/activity";

/**
 * page-publish 是「服务端 API 调度」层：
 * 发布日志与回滚数据由服务端持有，本模块只负责请求与响应映射。
 * 用 mock 锁定各分支（成功 / 业务码失败 / 网络异常），不触碰真实请求。
 */
vi.mock("@/api/activity", () => ({
  getPagePublishLogs: vi.fn(),
  rollbackPageVersion: vi.fn(),
}));

const schema: IPageSchemaV2 = {
  version: "2.0.0",
  pageConfig: { name: "发布测试页" },
  componentMap: {},
  rootIds: [],
};

describe("page publish", () => {
  beforeEach(() => {
    vi.mocked(getPagePublishLogs).mockReset();
    vi.mocked(rollbackPageVersion).mockReset();
    localStorage.clear();
  });

  describe("getLocalPublishLogs", () => {
    it("returns server publish logs on success", async () => {
      vi.mocked(getPagePublishLogs).mockResolvedValue({
        code: 10000,
        message: "success",
        data: [
          {
            versionId: "2001-1",
            displayVersion: "v20261016-1200",
            operator: "admin",
            note: "首次发布",
            publishedAt: 1,
          },
        ],
      } as never);

      const logs = await getLocalPublishLogs(2001);

      expect(getPagePublishLogs).toHaveBeenCalledWith(2001);
      expect(logs).toHaveLength(1);
      expect(logs[0].note).toBe("首次发布");
    });

    it("returns empty array when business code is not 10000", async () => {
      vi.mocked(getPagePublishLogs).mockResolvedValue({
        code: 50000,
        message: "error",
      } as never);

      expect(await getLocalPublishLogs(2001)).toEqual([]);
    });

    it("returns empty array when request throws", async () => {
      vi.mocked(getPagePublishLogs).mockRejectedValue(new Error("network"));

      expect(await getLocalPublishLogs(2001)).toEqual([]);
    });
  });

  describe("markPagePublished", () => {
    it("builds a publish log with version, operator and schema snapshot", () => {
      const log = markPagePublished({ pageId: 2001, schema, note: "首次发布" });

      expect(log.pageId).toBe(2001);
      expect(String(log.versionId).startsWith("2001-")).toBe(true);
      expect(log.displayVersion).toMatch(/^v\d{8}-\d{4}$/);
      expect(log.operator).toBe("当前用户");
      expect(log.note).toBe("首次发布");
      expect(log.schema).toEqual(schema);

      // schema 为深拷贝：事后改动不会影响日志快照
      log.schema!.pageConfig.name = "changed";
      expect(schema.pageConfig.name).toBe("发布测试页");
    });

    it("falls back to a default note", () => {
      const log = markPagePublished({ pageId: 2001, schema });
      expect(log.note).toBe("发布");
    });
  });

  describe("markPageDraft", () => {
    it("emits sync signal for other views", () => {
      markPageDraft(2002);
      expect(localStorage.getItem(getPublishSyncSignalKey())).toBeTruthy();
    });
  });

  describe("rollbackLocalPublishVersion", () => {
    it("returns schema payload on success", async () => {
      vi.mocked(rollbackPageVersion).mockResolvedValue({
        code: 10000,
        message: "success",
        data: { schema },
      } as never);

      const hit = await rollbackLocalPublishVersion({
        pageId: 2003,
        versionId: "2003-1",
      });

      expect(hit?.schema).toEqual(schema);
      expect(rollbackPageVersion).toHaveBeenCalledWith({
        pageId: 2003,
        versionId: "2003-1",
      });
    });

    it("normalizes numeric versionId to string", async () => {
      vi.mocked(rollbackPageVersion).mockResolvedValue({
        code: 10000,
        message: "success",
        data: { schema },
      } as never);

      await rollbackLocalPublishVersion({ pageId: 2003, versionId: 42 });

      expect(rollbackPageVersion).toHaveBeenCalledWith({
        pageId: 2003,
        versionId: "42",
      });
    });

    it("returns null when business code is not 10000", async () => {
      vi.mocked(rollbackPageVersion).mockResolvedValue({
        code: 50000,
      } as never);

      expect(
        await rollbackLocalPublishVersion({ pageId: 2003, versionId: 1 }),
      ).toBeNull();
    });

    it("returns null when request throws", async () => {
      vi.mocked(rollbackPageVersion).mockRejectedValue(new Error("network"));

      expect(
        await rollbackLocalPublishVersion({ pageId: 2003, versionId: 1 }),
      ).toBeNull();
    });
  });

  describe("resolvePageContentStatus", () => {
    it("maps isAbled to content status", () => {
      expect(resolvePageContentStatus(1)).toBe("published");
      expect(resolvePageContentStatus(0)).toBe("draft");
      expect(resolvePageContentStatus(undefined)).toBe("draft");
    });

    it("uses the provided fallback when not published", () => {
      expect(resolvePageContentStatus(0, "pending_review")).toBe(
        "pending_review",
      );
    });
  });
});

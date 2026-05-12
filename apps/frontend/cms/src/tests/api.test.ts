import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the http module
vi.mock("@/utils/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import http from "@/utils/http";
import {
  getCmsPageList,
  saveCmsPage,
  delCmsPageById,
  getCmsPageById,
  updateStatus,
  login,
  getPagePublishLogs,
  rollbackPageVersion,
} from "@/api/activity/index";

describe("Activity API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCmsPageList", () => {
    it("构造正确的查询参数", async () => {
      const mockResponse = {
        code: 10000,
        message: "success",
        data: { list: [], total: 0, pageNum: 1, pageSize: 10 },
      };
      (http.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await getCmsPageList({ pageNum: 1, pageSize: 10 });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining("pageNum=1"),
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining("pageSize=10"),
      );
    });

    it("过滤 undefined 和空字符串参数", async () => {
      const mockResponse = {
        code: 10000,
        message: "success",
        data: { list: [], total: 0, pageNum: 1, pageSize: 10 },
      };
      (http.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await getCmsPageList({ pageNum: 1, pageSize: 10, name: undefined });

      const callArg = (http.get as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as string;
      expect(callArg).not.toContain("name");
    });
  });

  describe("saveCmsPage", () => {
    it("有 id 时调用 updateCmsJson", async () => {
      const mockResponse = { code: 10000, message: "success", data: null };
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await saveCmsPage({ id: 1, name: "test", schema: {} });

      expect(http.post).toHaveBeenCalledWith(
        "/atlas-cms/updateCmsJson",
        { id: 1, name: "test", schema: {} },
        expect.objectContaining({ showError: true }),
      );
    });

    it("无 id 时调用 addPageJson", async () => {
      const mockResponse = { code: 10000, message: "success", data: null };
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await saveCmsPage({ name: "new page", schema: {} });

      expect(http.post).toHaveBeenCalledWith(
        "/atlas-cms/addPageJson",
        { name: "new page", schema: {} },
        expect.objectContaining({ showError: true }),
      );
    });
  });

  describe("delCmsPageById", () => {
    it("传递正确的 pageId", async () => {
      const mockResponse = { code: 10000, message: "success", data: null };
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await delCmsPageById(42);

      expect(http.post).toHaveBeenCalledWith(
        "/atlas-cms/deletePage",
        { id: 42 },
        expect.objectContaining({ showError: true }),
      );
    });
  });

  describe("getCmsPageById", () => {
    it("传递正确的 params", async () => {
      const mockResponse = {
        code: 10000,
        message: "success",
        data: { id: 1, name: "test", schema: {} },
      };
      (http.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await getCmsPageById(1);

      expect(http.get).toHaveBeenCalledWith("/atlas-cms/getPageJson", {
        params: { id: 1 },
      });
    });
  });

  describe("updateStatus", () => {
    it("传递正确的状态数据", async () => {
      const mockResponse = { code: 10000, message: "success", data: null };
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await updateStatus({ id: 1, isAbled: 0 });

      expect(http.post).toHaveBeenCalledWith(
        "/atlas-cms/updatePageStatus",
        { id: 1, isAbled: 0 },
        expect.objectContaining({ showError: true }),
      );
    });
  });

  describe("login", () => {
    it("传递正确的登录凭证", async () => {
      const mockResponse = {
        code: 10000,
        message: "success",
        data: { token: "abc123" },
      };
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await login({ username: "admin", password: "123456" });

      expect(http.post).toHaveBeenCalledWith(
        "/atlas-cms/login",
        { username: "admin", password: "123456" },
        expect.objectContaining({ showError: true }),
      );
    });
  });

  describe("getPagePublishLogs", () => {
    it("传递正确的 pageId", async () => {
      const mockResponse = {
        code: 10000,
        message: "success",
        data: [],
      };
      (http.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await getPagePublishLogs(5);

      expect(http.get).toHaveBeenCalledWith(
        "/atlas-cms/getPagePublishLogs",
        { params: { pageId: 5 } },
      );
    });
  });

  describe("rollbackPageVersion", () => {
    it("传递正确的回滚参数", async () => {
      const mockResponse = { code: 10000, message: "success", data: null };
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await rollbackPageVersion({ pageId: 1, versionId: "v2" });

      expect(http.post).toHaveBeenCalledWith(
        "/atlas-cms/rollbackPageVersion",
        { pageId: 1, versionId: "v2" },
        expect.objectContaining({ showError: true }),
      );
    });
  });
});
export interface MockPage {
  id: number;
  name: string;
  schema: Record<string, unknown>;
  componentList: unknown[];
  isAbled: number;
  status: string;
  shareDesc: string;
  shareImage: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundPosition: string;
  cover: string;
  createTime: string;
  updateTime: string;
}

export interface MockPublishLog {
  versionId: string;
  pageId: number;
  displayVersion: string;
  operator: string;
  note: string;
  publishedAt: string;
}

export const mockToken = "mock-jwt-token-e2e-test";

export const successResponse = <T>(data: T) => ({
  code: 10000,
  message: "success",
  data,
});

export const authFailedResponse = () => ({
  code: -2,
  message: "登录失效，请重新登录",
  data: null,
});

export function mockLoginResponse() {
  return successResponse({ token: mockToken });
}

export function mockPageListResponse(): MockPage[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: i === 0 ? "首页活动页" : i === 1 ? "618大促专场" : `测试页面${i + 1}`,
    isAbled: i < 6 ? 1 : 0,
    status: i < 6 ? "published" : "draft",
    shareDesc: `分享描述-${i + 1}`,
    shareImage: "",
    backgroundColor: "#ffffff",
    backgroundImage: "",
    backgroundPosition: "top",
    cover: "",
    createTime: `2026-05-0${(i % 9) + 1}T10:00:00.000Z`,
    updateTime: `2026-05-0${(i % 9) + 1}T12:00:00.000Z`,
    schema: {
      version: "2.0.0",
      pageConfig: { backgroundColor: "#ffffff" },
      componentMap: {},
      rootIds: [],
    },
    componentList: [],
  }));
}

export function mockPageDetailResponse(pageId: number) {
  return {
    id: pageId,
    name: pageId === 1 ? "首页活动页" : `测试页面${pageId}`,
    schema: {
      version: "2.0.0",
      pageConfig: {
        backgroundColor: "#ffffff",
        shareDesc: "分享描述",
        shareImage: "",
        backgroundImage: "",
        backgroundPosition: "top",
      },
      componentMap: {
        "carousel-1": {
          id: "carousel-1",
          type: "Carousel",
          props: { interval: 3000, showIndicator: true },
          styles: {},
          children: [],
        },
        "richtext-1": {
          id: "richtext-1",
          type: "RichText",
          props: { content: "<p>Hello World</p>" },
          styles: {},
          children: [],
        },
        "notice-1": {
          id: "notice-1",
          type: "Notice",
          props: { text: "公告内容" },
          styles: {},
          children: [],
        },
        "product-1": {
          id: "product-1",
          type: "Product",
          props: { layout: "grid" },
          styles: {},
          children: [],
        },
        "button-1": {
          id: "button-1",
          type: "CmsButton",
          props: { text: "点击按钮", link: "" },
          styles: {},
          children: [],
        },
      },
      rootIds: ["carousel-1", "richtext-1", "notice-1", "product-1", "button-1"],
    },
    componentList: [],
    isAbled: 1,
    shareDesc: "分享描述",
    shareImage: "",
    backgroundColor: "#ffffff",
    backgroundImage: "",
    backgroundPosition: "top",
    cover: "",
    createTime: "2026-05-01T10:00:00.000Z",
    updateTime: "2026-05-01T12:00:00.000Z",
  };
}

export function mockPublishLogsResponse(pageId: number): MockPublishLog[] {
  return [
    {
      versionId: `${pageId}-1715000000003`,
      pageId,
      displayVersion: "v20260507-1500",
      operator: "admin",
      note: "第三次发布",
      publishedAt: "2026-05-07T07:00:00.000Z",
    },
    {
      versionId: `${pageId}-1715000000002`,
      pageId,
      displayVersion: "v20260506-1200",
      operator: "admin",
      note: "修复样式",
      publishedAt: "2026-05-06T04:00:00.000Z",
    },
    {
      versionId: `${pageId}-1715000000001`,
      pageId,
      displayVersion: "v20260505-0900",
      operator: "admin",
      note: "首次发布",
      publishedAt: "2026-05-05T01:00:00.000Z",
    },
  ];
}

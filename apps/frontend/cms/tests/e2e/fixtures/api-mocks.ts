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
  create_time: string;
  update_time: string;
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

export function mockTemplateListResponse() {
  return [
    {
      id: 101,
      name: "营销落地页模板",
      thumbnail: null,
      category: "marketing",
      description: "适用于活动投放页面",
      useCount: 50,
      isActive: true,
      createTime: "2026-05-01T10:00:00.000Z",
      schema: {
        version: "2.0.0",
        pageConfig: { backgroundColor: "#ffffff" },
        componentMap: {},
        rootIds: [],
      },
    },
  ];
}

export function mockLeadListResponse(pageId = 1) {
  return {
    list: [
      {
        id: 1,
        name: "张三",
        phoneNumber: "13800138000",
        remark: "高意向",
        pageId,
        utm: { utm_source: "douyin", utm_campaign: "520" },
        channel: { channel_id: "ad-001" },
        createdAt: "2026-05-20 10:00:00",
      },
    ],
    total: 1,
    pageNum: 1,
    pageSize: 20,
  };
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
    create_time: `2026-05-0${(i % 9) + 1} 10:00:00`,
    update_time: `2026-05-0${(i % 9) + 1} 12:00:00`,
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
  const pageName = pageId === 1 ? "首页活动页" : `测试页面${pageId}`;

  return {
    id: pageId,
    name: pageName,
    schema: {
      version: "2.0.0",
      pageConfig: {
        name: pageName,
        backgroundColor: "#ffffff",
        shareDesc: "分享描述",
        shareImage: "",
        backgroundImage: "",
        backgroundPosition: "top",
      },
      componentMap: {
        "richtext-1": {
          id: "richtext-1",
          type: "RichText",
          props: {
            content: "<p>这是 E2E 发布预览内容</p>",
            backgroundColor: "#ffffff",
            padding: "10px 10px 0",
          },
          styles: {},
          children: [],
        },
      },
      rootIds: ["richtext-1"],
    },
    componentList: [],
    isAbled: 1,
    shareDesc: "分享描述",
    shareImage: "",
    backgroundColor: "#ffffff",
    backgroundImage: "",
    backgroundPosition: "top",
    cover: "",
    create_time: "2026-05-01 10:00:00",
    update_time: "2026-05-01 12:00:00",
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

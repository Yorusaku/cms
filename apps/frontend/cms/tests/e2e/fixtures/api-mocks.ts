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

/**
 * 页面详情区组件数量：需 ≥ 5，与装修页画布断言（expectCanvasHasComponentsAtLeast(5)）对齐。
 * type 必须是 packages/ui materialRegistry 中的真实类型，否则画布只能渲染 FallbackComponent。
 * 另外 detail schema 必须「可通过 runPagePreflight」：发布/预览会先跑发布前校验，
 * 因此图片字段需为有效 URL、link 需为有效链接（空串会被判为「缺少图片/缺少有效链接」）。
 */
export const mockPageDetailComponentCount = 5;

/** 内联占位图（与后端 mock 生成器做法一致，避免依赖外网） */
export const mockPlaceholderImage =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect width='120' height='80' fill='%23e5e7eb'/%3E%3C/svg%3E";

const mockLink = () => ({ clickType: 1, data: { url: "https://example.com/e2e" } });

export function mockPageDetailResponse(pageId: number) {
  const pageName = pageId === 1 ? "首页活动页" : `测试页面${pageId}`;

  const components: Array<{ id: string; type: string; props: Record<string, unknown> }> = [
    {
      id: "carousel-1",
      type: "Carousel",
      props: {
        imageList: [
          { imageUrl: mockPlaceholderImage, text: pageName, link: mockLink() },
        ],
        autoplay: 3000,
        showIndicators: true,
        showArrows: true,
        height: "200px",
        backgroundColor: "#f5f7fa",
        imageFit: "cover",
        loop: true,
      },
    },
    {
      id: "imagenav-1",
      type: "ImageNav",
      props: {
        list: [
          { imageUrl: mockPlaceholderImage, text: "快捷入口", link: mockLink() },
          { imageUrl: mockPlaceholderImage, text: "活动专区", link: mockLink() },
        ],
        columnPadding: 20,
        rowPadding: 20,
        backgroundColor: "#FFFFFF",
        textColor: "#323233",
        borderRadius: 0,
        defaultImage: mockPlaceholderImage,
      },
    },
    {
      id: "richtext-1",
      type: "RichText",
      props: {
        content: "<p>这是 E2E 发布预览内容</p>",
        backgroundColor: "#ffffff",
        padding: "10px 10px 0",
      },
    },
    {
      id: "notice-1",
      type: "Notice",
      props: {
        noticeList: [{ text: "E2E 公告内容", link: mockLink() }],
        iconUrl: mockPlaceholderImage,
        imageUrl: mockPlaceholderImage,
        backgroundColor: "#FFF8E9",
        textColor: "#666666",
        speed: 20,
      },
    },
    {
      id: "product-1",
      type: "Product",
      props: {
        list: [
          {
            id: "product-e2e",
            imageUrl: mockPlaceholderImage,
            imgUrl: mockPlaceholderImage,
            brand: "E2E 商品",
            categoryNames: "测试分类",
            price: 99,
            link: mockLink(),
          },
        ],
        layoutType: "grid",
        listStyle: "grid",
        showPurchase: false,
        purchase: 0,
        priceColor: "#DD1A21",
        markingPrice: 0,
      },
    },
  ];

  const componentMap = Object.fromEntries(
    components.map((component) => [
      component.id,
      {
        id: component.id,
        type: component.type,
        parentId: null,
        props: component.props,
        styles: {},
        children: [],
      },
    ]),
  );

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
      componentMap,
      rootIds: components.map((component) => component.id),
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

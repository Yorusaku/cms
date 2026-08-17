import type { IPageSchemaV2 } from "@cms/types";
import { AiService } from "../src/modules/ai/ai.service";

const createService = ({
  providerDraft = null,
  pageSchema,
  funnel,
}: {
  providerDraft?: unknown;
  pageSchema?: IPageSchemaV2;
  funnel?: unknown;
} = {}) => {
  const pageService = {
    addPageJson: jest.fn().mockResolvedValue({ id: 88 }),
    getPageJson: jest.fn().mockResolvedValue({
      schema: pageSchema,
    }),
  };
  const providerService = {
    generatePageDraft: jest.fn().mockResolvedValue(providerDraft),
  };
  const trackingService = {
    getPageFunnelSummary: jest.fn().mockResolvedValue(funnel),
  };

  return {
    service: new AiService(
      pageService as never,
      providerService as never,
      trackingService as never,
    ),
    pageService,
    providerService,
    trackingService,
  };
};

const createMinimalSchema = (): IPageSchemaV2 => ({
  version: "2.0.0",
  pageConfig: {
    name: "测试页",
    backgroundColor: "#fff",
  },
  componentMap: {
    intro: {
      id: "intro",
      type: "RichText",
      props: {
        content: "短文案",
      },
      parentId: null,
      children: [],
    },
    lead: {
      id: "lead",
      type: "LeadForm",
      props: {
        title: "领取优惠",
      },
      parentId: null,
      children: [],
    },
  },
  rootIds: ["intro", "lead"],
});

describe("AiService", () => {
  it("无模型结果时生成 mock 页面并保存为草稿", async () => {
    const { service, pageService, providerService } = createService();

    const result = await service.generatePage({
      pageName: "618 爆款限时购",
      activityType: "电商大促",
      audience: "年轻白领",
      promotion: "满 299 减 80",
      products: [],
      ctaText: "立即领取优惠",
    });

    expect(providerService.generatePageDraft).toHaveBeenCalled();
    expect(pageService.addPageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "618 爆款限时购",
        online: 0,
        schema: expect.objectContaining({
          version: "2.0.0",
        }),
      }),
    );
    expect(result.pageId).toBe(88);
    expect(result.schema.rootIds).toContain("lead-form");
    expect(result.warnings).toContain("未填写商品信息，已使用 AI 默认示例商品。");
  });

  it("结合页面结构和漏斗数据输出优化建议", async () => {
    const { service } = createService({
      pageSchema: createMinimalSchema(),
      funnel: {
        pageId: 1,
        metrics: {
          pageViews: 20,
          ctaClicks: 0,
          formSubmits: 2,
          leads: 0,
          ctaClickRate: 0,
          leadConversionRate: 0,
        },
        channels: [],
      },
    });

    const result = await service.diagnosePage({ pageId: 1 });
    const categories = result.advice.map((item) => item.category);

    expect(result.summary).toContain("20 次访问");
    expect(categories).toContain("product");
    expect(categories).toContain("cta");
    expect(categories).toContain("form");
  });
});

import { PageSchemaV2Schema } from "@cms/types";
import { AiService } from "../src/modules/ai/ai.service";
import type { AiGeneratePageDto } from "../src/modules/ai/dto/ai-generate-page.dto";

/**
 * AI 建页的业务场景校准。
 *
 * 关注点：AI 生成的必须是「业务页面」而非营销 H5——
 * 三个业务场景各自落到对应物料，且结果能通过页面 Schema 与物料白名单校验。
 * 这里让 provider 返回 null（模拟未配置模型或模型不可用），验证 mock fallback 的行为。
 *
 * 说明：接口字段名沿用现有的 activityType / promotion / ctaText
 * （编辑端文案已业务化为「页面场景 / 页面需求 / 提交文案」，本次不改契约）。
 */
describe("AI 业务场景生成", () => {
  const BUSINESS_SCENES = ["内容展示", "信息登记", "数据查询"] as const;

  const ALLOWED_MATERIAL_TYPES = new Set([
    "Carousel",
    "Notice",
    "RichText",
    "Product",
    "LeadForm",
    "Dialog",
    "AssistLine",
    "FloatLayer",
    "BusinessForm",
    "BusinessList",
    "StatCard",
  ]);

  const addPageJson = jest.fn();
  const generatePageDraft = jest.fn();

  const createService = () =>
    new AiService(
      { addPageJson } as never,
      { generatePageDraft } as never,
      {} as never,
    );

  const baseDto: AiGeneratePageDto = {
    pageName: "客户信息登记",
    activityType: "信息登记",
    audience: "到店客户",
    promotion: "收集预约与联系方式",
    ctaText: "提交信息",
  };

  const rootTypes = (schema: {
    rootIds: string[];
    componentMap: Record<string, { type: string }>;
  }): string[] => schema.rootIds.map((id) => schema.componentMap[id].type);

  beforeEach(() => {
    addPageJson.mockReset().mockResolvedValue({ id: 42 });
    generatePageDraft.mockReset().mockResolvedValue(null);
  });

  it("信息登记场景生成 BusinessForm", async () => {
    const result = await createService().generatePage({
      ...baseDto,
      activityType: "信息登记",
    });

    expect(rootTypes(result.schema)).toContain("BusinessForm");
  });

  it("数据查询场景生成 BusinessList 与 StatCard", async () => {
    const result = await createService().generatePage({
      ...baseDto,
      activityType: "数据查询",
    });

    const types = rootTypes(result.schema);
    expect(types).toContain("BusinessList");
    expect(types).toContain("StatCard");
  });

  it("内容展示场景生成富文本模块", async () => {
    const result = await createService().generatePage({
      ...baseDto,
      activityType: "内容展示",
    });

    expect(rootTypes(result.schema)).toContain("RichText");
  });

  it("生成结果通过页面 Schema（Zod 4）校验", async () => {
    for (const scene of BUSINESS_SCENES) {
      const result = await createService().generatePage({
        ...baseDto,
        activityType: scene,
      });

      expect(PageSchemaV2Schema.safeParse(result.schema).success).toBe(true);
    }
  });

  it("生成结果只使用平台既有物料", async () => {
    for (const scene of BUSINESS_SCENES) {
      const result = await createService().generatePage({
        ...baseDto,
        activityType: scene,
      });
      const types = Object.values(result.schema.componentMap).map(
        (component) => component.type,
      );

      expect(types.every((type) => ALLOWED_MATERIAL_TYPES.has(type))).toBe(true);
    }
  });

  it("pageConfig.scene 与业务场景一一对应", async () => {
    const form = await createService().generatePage({
      ...baseDto,
      activityType: "信息登记",
    });
    expect(form.schema.pageConfig.scene).toBe("form");

    const list = await createService().generatePage({
      ...baseDto,
      activityType: "数据查询",
    });
    expect(list.schema.pageConfig.scene).toBe("list");

    const content = await createService().generatePage({
      ...baseDto,
      activityType: "内容展示",
    });
    expect(content.schema.pageConfig.scene).toBe("content");
  });

  it("生成的业务表单保留姓名与手机号字段", async () => {
    const result = await createService().generatePage({
      ...baseDto,
      activityType: "信息登记",
    });

    const formNode = Object.values(result.schema.componentMap).find(
      (component) => component.type === "BusinessForm",
    );
    const fields = formNode?.props.fields as Array<{ key: string }>;

    expect(fields.map((field) => field.key)).toContain("name");
    expect(fields.map((field) => field.key)).toContain("phone");
  });

  it("生成结果落库为草稿并返回 pageId 与提示", async () => {
    const result = await createService().generatePage({
      ...baseDto,
      activityType: "数据查询",
    });

    expect(addPageJson).toHaveBeenCalledTimes(1);
    expect(result.pageId).toBe(42);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

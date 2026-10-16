import {
  PageSchemaV2Schema,
  safeParsePageSchema,
} from "@cms/types/schemas";
import { AiGeneratePageResponseSchema } from "@cms/types/ai";

/**
 * Zod 3 → Zod 4 迁移的协议守卫。
 *
 * 目的：确认迁移没有改变平台协议的校验语义——页面 Schema、AI 响应、
 * 必填字段、组件字段类型以及业务物料 defaultProps 的可通过性。
 * 断言只校验 success / null / 关键字段，不绑定完整错误文案。
 */

const makeComponent = (
  type: string,
  props: Record<string, unknown> = {},
  overrides: Record<string, unknown> = {},
) => ({
  id: `${type.toLowerCase()}-1`,
  type,
  props,
  parentId: null,
  children: [],
  ...overrides,
});

const makePage = (
  componentMap: Record<string, unknown>,
  rootIds: string[],
) => ({
  version: "2.0.0",
  pageConfig: { name: "协议测试页" },
  componentMap,
  rootIds,
});

/** 复制一份页面对象并剔除指定字段，用于验证必填项缺失 */
const withoutField = (
  page: Record<string, unknown>,
  field: string,
): Record<string, unknown> => {
  const clone: Record<string, unknown> = { ...page };
  delete clone[field];
  return clone;
};

describe("页面 Schema 协议（Zod 4 迁移守卫）", () => {
  it("业务公告页 Schema 可以通过", () => {
    const page = makePage(
      {
        notice: makeComponent("Notice", { text: "系统维护通知" }),
        rich: makeComponent("RichText", { content: "<p>公告内容</p>" }),
      },
      ["notice", "rich"],
    );

    expect(PageSchemaV2Schema.safeParse(page).success).toBe(true);
  });

  it("信息登记页 Schema 可以通过", () => {
    const page = makePage(
      {
        form: makeComponent("BusinessForm", {
          title: "信息登记",
          subtitle: "请填写以下信息",
          submitText: "提交信息",
          fields: [
            { key: "name", label: "姓名", type: "text", required: true },
            { key: "phone", label: "联系电话", type: "text", required: true },
          ],
        }),
      },
      ["form"],
    );

    expect(PageSchemaV2Schema.safeParse(page).success).toBe(true);
  });

  it("业务查询页 Schema 可以通过", () => {
    const page = makePage(
      {
        list: makeComponent("BusinessList", {
          title: "业务数据",
          columns: [
            { key: "name", label: "名称" },
            { key: "status", label: "状态" },
          ],
          rows: [{ id: 1, name: "示例记录", status: "待处理" }],
          pageSize: 5,
        }),
        stat: makeComponent("StatCard", {
          title: "待处理事项",
          value: 12,
          description: "较昨日 +8%",
          icon: "数",
          accentColor: "#2563eb",
        }),
      },
      ["list", "stat"],
    );

    expect(PageSchemaV2Schema.safeParse(page).success).toBe(true);
  });

  it("AI 生成页面响应可以通过", () => {
    const page = makePage(
      { notice: makeComponent("Notice", { text: "AI 生成" }) },
      ["notice"],
    );

    const result = AiGeneratePageResponseSchema.safeParse({
      pageId: 1,
      schema: page,
      summary: "已生成业务公告页",
      warnings: [],
    });

    expect(result.success).toBe(true);
  });

  it("缺少 version 时校验失败", () => {
    const page = makePage(
      { rich: makeComponent("RichText") },
      ["rich"],
    ) as Record<string, unknown>;

    expect(
      PageSchemaV2Schema.safeParse(withoutField(page, "version")).success,
    ).toBe(false);
  });

  it("缺少 componentMap 时校验失败", () => {
    const page = makePage(
      { rich: makeComponent("RichText") },
      ["rich"],
    ) as Record<string, unknown>;

    expect(
      PageSchemaV2Schema.safeParse(withoutField(page, "componentMap")).success,
    ).toBe(false);
  });

  it("缺少 rootIds 时校验失败", () => {
    const page = makePage(
      { rich: makeComponent("RichText") },
      ["rich"],
    ) as Record<string, unknown>;

    expect(
      PageSchemaV2Schema.safeParse(withoutField(page, "rootIds")).success,
    ).toBe(false);
  });

  it("componentMap 中组件字段类型错误时校验失败", () => {
    const page = makePage(
      { c1: makeComponent("RichText", {}, { id: 123 }) },
      ["c1"],
    );

    expect(PageSchemaV2Schema.safeParse(page).success).toBe(false);
  });

  it("safeParsePageSchema 成功时返回解析结果，且扩展字段被保留", () => {
    const page = makePage(
      { rich: makeComponent("RichText", { content: "<p>hi</p>" }) },
      ["rich"],
    );
    // loose 语义：未知扩展字段必须保留，不能因迁移被 strip
    const withExtra = {
      ...page,
      pageConfig: { name: "扩展页", extraKey: "keep-me" },
    } as Record<string, unknown>;

    const parsed = safeParsePageSchema(withExtra);

    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe("2.0.0");
    expect(parsed?.pageConfig).toMatchObject({
      name: "扩展页",
      extraKey: "keep-me",
    });
  });

  it("safeParsePageSchema 失败时返回 null", () => {
    expect(safeParsePageSchema({ nope: true })).toBeNull();
    expect(safeParsePageSchema(null)).toBeNull();
  });

  it("业务查询页的联动规则能通过页面 Schema 校验", () => {
    const page = makePage(
      {
        stat: makeComponent("StatCard", { title: "匹配记录数", value: 6 }),
        list: makeComponent("BusinessList", { rows: [] }),
      },
      ["stat", "list"],
    );

    const withLinkage = {
      ...page,
      linkages: [
        {
          id: "linkage-filtered-count",
          sourceComponentId: "list",
          targetComponentId: "stat",
          sourceProperty: "filteredCount",
          targetProperty: "value",
          enabled: true,
        },
      ],
    };

    expect(PageSchemaV2Schema.safeParse(withLinkage).success).toBe(true);
  });

  it("联动规则缺少必填字段时校验失败", () => {
    const page = makePage({ stat: makeComponent("StatCard") }, ["stat"]);
    const withBrokenLinkage = {
      ...page,
      linkages: [
        {
          id: "broken",
          sourceComponentId: "list",
          targetProperty: "value",
          enabled: true,
        },
      ],
    };

    expect(PageSchemaV2Schema.safeParse(withBrokenLinkage).success).toBe(false);
  });

  it("现有业务物料的 defaultProps 仍能通过校验", () => {
    // 字段与 packages/ui/src/materials/definitions.ts 中 business 分组物料保持一致；
    // 该包为 ESM，Jest 无法直接加载其 src，故在此维护等价快照。
    const businessMaterialProps: Array<[string, Record<string, unknown>]> = [
      [
        "BusinessForm",
        {
          title: "信息登记",
          subtitle: "请填写以下信息",
          submitText: "提交信息",
          fields: [
            { key: "name", label: "姓名", type: "text", required: true },
            { key: "phone", label: "联系电话", type: "text", required: true },
          ],
        },
      ],
      [
        "BusinessList",
        {
          title: "业务数据",
          columns: [
            { key: "name", label: "名称" },
            { key: "status", label: "状态" },
          ],
          rows: [
            { id: 1, name: "示例记录", status: "待处理" },
            { id: 2, name: "第二条记录", status: "已完成" },
          ],
          pageSize: 5,
        },
      ],
      [
        "StatCard",
        {
          title: "待处理事项",
          value: 12,
          description: "较昨日 +8%",
          icon: "数",
          accentColor: "#2563eb",
        },
      ],
    ];
    expect(businessMaterialProps.length).toBeGreaterThan(0);

    for (const [type, props] of businessMaterialProps) {
      const nodeId = `${type.toLowerCase()}-1`;
      const page = makePage({ [nodeId]: makeComponent(type, props) }, [nodeId]);

      // 失败时 Jest 会打印整个 result，足以定位是哪个物料/哪个字段
      const result = PageSchemaV2Schema.safeParse(page);
      expect(result.success).toBe(true);
    }
  });
});

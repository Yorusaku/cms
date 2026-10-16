import { describe, expect, it } from "vitest";
import type { IPageSchemaV2 } from "@cms/types";
import { runPagePreflight } from "@/utils/page-preflight";

const makeSchema = (
  componentMap: IPageSchemaV2["componentMap"],
): IPageSchemaV2 => ({
  version: "2.0.0",
  pageConfig: { name: "测试页面" },
  componentMap,
  rootIds: Object.keys(componentMap),
});

const statCard = (props: Record<string, unknown>) => ({
  id: "stat-1",
  type: "StatCard",
  parentId: null,
  children: [],
  props,
  styles: {},
});

describe("PagePreflight", () => {
  it("数字值（如统计卡片默认指标值）不视为空", () => {
    const result = runPagePreflight(
      makeSchema({
        "stat-1": statCard({
          title: "待处理事项",
          value: 12,
          description: "本周新增",
          icon: "数",
        }),
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("空字符串字段仍被拦截", () => {
    const result = runPagePreflight(
      makeSchema({
        "stat-1": statCard({
          title: "",
          value: 12,
          description: "本周新增",
          icon: "数",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("指标标题"))).toBe(
      true,
    );
  });

  it("array 字段空数组仍被拦截（原有行为）", () => {
    const result = runPagePreflight(
      makeSchema({
        "notice-1": {
          id: "notice-1",
          type: "Notice",
          parentId: null,
          children: [],
          props: {
            noticeList: [],
          },
          styles: {},
        },
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("至少需要"))).toBe(
      true,
    );
  });
});

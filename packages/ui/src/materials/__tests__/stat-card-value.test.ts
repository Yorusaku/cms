import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import StatCardBlock from "../../components/StatCardBlock.vue";
import { normalizePageSchemaMaterials } from "../index";
import type { IPageSchemaV2 } from "@cms/types";

/**
 * StatCard 指标值归一化：调用真实的 normalizePageSchemaMaterials，
 * 不在测试里复制归一化算法。
 *
 * 背景：历史上 value 只接受字符串，程序化建页写入数字（如 36）会被
 * toStringValue 回落成默认值 12，0 也会被当成缺失。
 */
const makeSchema = (value: unknown): IPageSchemaV2 =>
  ({
    version: "2.0.0",
    pageConfig: { name: "stat-value" },
    componentMap: {
      "stat-1": {
        id: "stat-1",
        type: "StatCard",
        parentId: null,
        children: [],
        props: { title: "报名人数", value, description: "本期" },
        styles: {},
      },
    },
    rootIds: ["stat-1"],
  }) as unknown as IPageSchemaV2;

const normalizeValue = (value: unknown): string => {
  const normalized = normalizePageSchemaMaterials(makeSchema(value));
  return String(normalized.componentMap["stat-1"].props.value);
};

describe("StatCard 指标值归一化", () => {
  it("数字值原样保留，包含 0", () => {
    expect(normalizeValue(36)).toBe("36");
    expect(normalizeValue(0)).toBe("0");
    expect(normalizeValue(3.5)).toBe("3.5");
    expect(normalizeValue(-7)).toBe("-7");
  });

  it("历史字符串值保持不变", () => {
    expect(normalizeValue("36")).toBe("36");
    expect(normalizeValue("约 36 人")).toBe("约 36 人");
    // 空字符串沿用旧契约：原样保留，不回落默认值
    expect(normalizeValue("")).toBe("");
  });

  it("缺失与非法值回落默认值", () => {
    expect(normalizeValue(undefined)).toBe("12");
    expect(normalizeValue(null)).toBe("12");
    expect(normalizeValue(Number.NaN)).toBe("12");
    expect(normalizeValue(Number.POSITIVE_INFINITY)).toBe("12");
    expect(normalizeValue({})).toBe("12");
  });

  it("归一化结果在渲染层可见，0 不会被当成空值", () => {
    const wrapper = mount(StatCardBlock, {
      props: { title: "报名人数", value: normalizeValue(0), description: "本期" },
    });
    expect(wrapper.text()).toContain("0");
  });

  it("数字值经归一化后渲染与字符串值一致", () => {
    const fromNumber = mount(StatCardBlock, {
      props: { title: "报名人数", value: normalizeValue(36), description: "本期" },
    });
    const fromString = mount(StatCardBlock, {
      props: { title: "报名人数", value: "36", description: "本期" },
    });
    expect(fromNumber.text()).toBe(fromString.text());
  });
});

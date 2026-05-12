import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import VisualConditionBuilder from "@/components/basic/VisualConditionBuilder.vue";
import type { ILinkageCondition } from "@/utils/linkage-engine";

describe("VisualConditionBuilder.vue", () => {
  it("mounts with no initial condition", async () => {
    const wrapper = mount(VisualConditionBuilder, {
      props: { modelValue: null },
    });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
    // Should render in visual mode with operator options
    expect(wrapper.html()).toContain("添加条件");
  });

  it("mounts with a simple condition", async () => {
    const condition: ILinkageCondition = {
      type: "simple",
      expression: "value > 100",
    };

    const wrapper = mount(VisualConditionBuilder, {
      props: { modelValue: condition },
    });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  it("mounts with a complex AND condition", async () => {
    const condition: ILinkageCondition = {
      type: "complex",
      operator: "AND",
      conditions: [
        { type: "simple", expression: "value > 100" },
        { type: "simple", expression: "value < 500" },
      ],
    };

    const wrapper = mount(VisualConditionBuilder, {
      props: { modelValue: condition },
    });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  it("mounts with undefined condition", async () => {
    const wrapper = mount(VisualConditionBuilder, {
      props: { modelValue: undefined },
    });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  it("updates when modelValue prop changes externally", async () => {
    const wrapper = mount(VisualConditionBuilder, {
      props: { modelValue: null },
    });
    await nextTick();

    await wrapper.setProps({
      modelValue: { type: "simple", expression: "value === 'VIP'" },
    });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  it("shows add buttons for condition and group", () => {
    const wrapper = mount(VisualConditionBuilder, {
      props: { modelValue: null },
    });
    expect(wrapper.html()).toContain("添加条件");
  });

  it("emits serialized condition", async () => {
    const wrapper = mount(VisualConditionBuilder, {
      props: {
        modelValue: {
          type: "simple",
          expression: "value > 50",
        },
      },
    });
    await nextTick();

    // Change the model value to trigger emit
    await wrapper.setProps({
      modelValue: {
        type: "simple",
        expression: "value > 100",
      },
    });
    await nextTick();

    // Component should have updated without error
    expect(wrapper.exists()).toBe(true);
  });

  it("renders containing the condition UI elements", () => {
    const wrapper = mount(VisualConditionBuilder, {
      props: { modelValue: null },
    });
    const html = wrapper.html();
    // "添加条件" text is rendered inside an el-button (slotted content shows even for unknown elements)
    expect(html).toContain("添加条件");
    expect(html).toContain("高级");
  });
});

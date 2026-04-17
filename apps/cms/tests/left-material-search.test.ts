import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { createPinia, setActivePinia } from "pinia";
import LeftMaterial from "../src/views/Decorate/components/LeftMaterial.vue";

const ElInputStub = defineComponent({
  name: "ElInputStub",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h("input", {
        ...attrs,
        size: undefined,
        value: props.modelValue,
        onInput: (event: Event) => {
          const target = event.target as HTMLInputElement;
          emit("update:modelValue", target.value);
        },
      });
  },
});

const ElCollapseStub = defineComponent({
  name: "ElCollapseStub",
  setup(_, { slots }) {
    return () => h("div", { class: "el-collapse-stub" }, slots.default?.());
  },
});

const ElCollapseItemStub = defineComponent({
  name: "ElCollapseItemStub",
  setup(_, { slots }) {
    return () => h("div", { class: "el-collapse-item-stub" }, slots.default?.());
  },
});

describe("LeftMaterial search", () => {
  it("filters materials by keyword and shows empty state", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(LeftMaterial, {
      global: {
        plugins: [pinia],
        stubs: {
          "el-input": ElInputStub,
          "el-collapse": ElCollapseStub,
          "el-collapse-item": ElCollapseItemStub,
        },
      },
    });

    const input = wrapper.find("input");
    await input.setValue("carousel");

    const names = wrapper.findAll(".name").map((node) => node.text().toLowerCase());
    expect(names.some((name) => name.includes("轮播") || name.includes("carousel"))).toBe(true);

    await input.setValue("not-exist-material");
    expect(wrapper.text()).toContain("未找到匹配的物料");
  });
});

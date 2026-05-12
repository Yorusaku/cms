import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RichTextBlock from "../RichTextBlock.vue";

describe("RichTextBlock", () => {
  it("渲染 HTML 内容", () => {
    const wrapper = mount(RichTextBlock, {
      props: { content: "<p>Hello <strong>World</strong></p>" },
    });
    expect(wrapper.html()).toContain("Hello");
    expect(wrapper.html()).toContain("strong");
  });

  it("默认有占位内容", () => {
    const wrapper = mount(RichTextBlock);
    expect(wrapper.text().length).toBeGreaterThan(0);
  });

  it("自定义背景色和 padding", () => {
    const wrapper = mount(RichTextBlock, {
      props: { content: "<p>Test</p>", backgroundColor: "#f0f0f0", padding: 20 },
    });
    const el = wrapper.find(".crs-rich-text");
    expect(el.exists()).toBe(true);
  });

  it("空内容时不崩溃", () => {
    const wrapper = mount(RichTextBlock, {
      props: { content: "" },
    });
    expect(wrapper.find(".crs-rich-text").exists()).toBe(true);
  });
});
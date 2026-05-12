import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ImageNavBlock from "../ImageNavBlock.vue";

const mockList = [
  {
    imageUrl: "https://example.com/nav1.jpg",
    text: "导航1",
    link: "/page1",
  },
  {
    imageUrl: "https://example.com/nav2.jpg",
    text: "导航2",
    link: "/page2",
  },
];

describe("ImageNavBlock", () => {
  it("渲染导航列表", () => {
    const wrapper = mount(ImageNavBlock, {
      props: { list: mockList },
    });
    expect(wrapper.text()).toContain("导航1");
    expect(wrapper.text()).toContain("导航2");
  });

  it("渲染导航图片", () => {
    const wrapper = mount(ImageNavBlock, {
      props: { list: mockList },
    });
    const images = wrapper.findAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("空列表时不崩溃", () => {
    const wrapper = mount(ImageNavBlock, {
      props: { list: [] },
    });
    expect(wrapper.html().length).toBeGreaterThan(0);
  });

  it("自定义 background 和 textColor", () => {
    const wrapper = mount(ImageNavBlock, {
      props: { list: mockList, backgroundColor: "#333", textColor: "#fff" },
    });
    expect(wrapper.props("backgroundColor")).toBe("#333");
    expect(wrapper.props("textColor")).toBe("#fff");
  });
});
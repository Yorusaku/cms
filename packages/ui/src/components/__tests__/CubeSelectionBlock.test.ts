import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CubeSelectionBlock from "../CubeSelectionBlock.vue";

/**
 * mock 数据必须使用组件真实字段名 `imageUrl`（ICubeItem）。
 * 此前写成 `imgUrl`，组件读不到图片地址只能回落 defaultImg，
 * 而断言只校验「img 数量 ≥ 1」仍会通过，属于假绿。
 */
const mockItems = [
  { imageUrl: "https://example.com/cube1.jpg", link: "https://example.com/a" },
  { imageUrl: "https://example.com/cube2.jpg", link: "https://example.com/b" },
  { imageUrl: "https://example.com/cube3.jpg", link: "https://example.com/c" },
];

describe("CubeSelectionBlock", () => {
  it("渲染魔方选项列表并实际使用传入图片地址", () => {
    const wrapper = mount(CubeSelectionBlock, {
      props: { imageList: mockItems },
    });
    const images = wrapper.findAll("img");
    expect(images).toHaveLength(mockItems.length);
    expect(images[0].attributes("src")).toBe(mockItems[0].imageUrl);
    expect(images[2].attributes("src")).toBe(mockItems[2].imageUrl);
  });

  it("默认模板 oneLine2 渲染两列", () => {
    const wrapper = mount(CubeSelectionBlock, {
      props: { imageList: mockItems },
    });
    expect(wrapper.props("template")).toBe("oneLine2");
  });

  it("空列表时不崩溃", () => {
    const wrapper = mount(CubeSelectionBlock, {
      props: { imageList: [] },
    });
    expect(wrapper.html().length).toBeGreaterThan(0);
  });

  it("点击选项触发 click 事件", async () => {
    const wrapper = mount(CubeSelectionBlock, {
      props: { imageList: mockItems },
    });
    const firstImage = wrapper.find("img");
    await firstImage.trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });
});

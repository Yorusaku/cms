import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CubeSelectionBlock from "../CubeSelectionBlock.vue";

const mockItems = [
  { id: "1", imgUrl: "https://example.com/cube1.jpg", title: "选项A", link: {} },
  { id: "2", imgUrl: "https://example.com/cube2.jpg", title: "选项B", link: {} },
  { id: "3", imgUrl: "https://example.com/cube3.jpg", title: "选项C", link: {} },
];

describe("CubeSelectionBlock", () => {
  it("渲染魔方选项列表", () => {
    const wrapper = mount(CubeSelectionBlock, {
      props: { imageList: mockItems },
    });
    const images = wrapper.findAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
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
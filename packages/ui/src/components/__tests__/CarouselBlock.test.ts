import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CarouselBlock from "../CarouselBlock.vue";

const mockImages = [
  { id: "1", imageUrl: "https://example.com/img1.jpg", text: "图片1", link: {} },
  { id: "2", imageUrl: "https://example.com/img2.jpg", text: "图片2", link: {} },
  { id: "3", imageUrl: "https://example.com/img3.jpg", text: "图片3", link: {} },
];

describe("CarouselBlock", () => {
  it("渲染图片列表", () => {
    const wrapper = mount(CarouselBlock, {
      props: { imageList: mockImages },
    });
    const images = wrapper.findAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("空列表时不崩溃", () => {
    const wrapper = mount(CarouselBlock, {
      props: { imageList: [] },
    });
    expect(wrapper.find(".carousel-block").exists()).toBe(true);
  });

  it("显示指示器", () => {
    const wrapper = mount(CarouselBlock, {
      props: { imageList: mockImages, showIndicators: true },
    });
    const indicators = wrapper.findAll(".carousel-indicators, [class*='indicator']");
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  it("自定义 autoplay 参数", () => {
    const wrapper = mount(CarouselBlock, {
      props: { imageList: mockImages, autoplay: 5000 },
    });
    expect(wrapper.props("autoplay")).toBe(5000);
  });

  it("自定义 height 样式", () => {
    const wrapper = mount(CarouselBlock, {
      props: { imageList: mockImages, height: "300px" },
    });
    expect(wrapper.props("height")).toBe("300px");
  });
});
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import CarouselBlock from "@cms/ui/components/CarouselBlock.vue";
import type { ICarouselItem } from "@cms/ui/components/CarouselBlock.vue";

describe("CarouselBlock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render carousel block", () => {
    const wrapper = mount(CarouselBlock);
    expect(wrapper.find(".carousel-block").exists()).toBe(true);
  });

  it("should render single image without controls", () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    expect(wrapper.find("img").exists()).toBe(true);
    expect(wrapper.find(".carousel-indicators").exists()).toBe(false);
    expect(wrapper.find(".carousel-arrow").exists()).toBe(false);
  });

  it("should render multiple images with controls", () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
      { imageUrl: "https://example.com/image3.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    expect(wrapper.findAll("img")).toHaveLength(5);
    expect(wrapper.find(".carousel-indicators").exists()).toBe(true);
    expect(wrapper.findAll(".carousel-arrow")).toHaveLength(2);
  });

  it("should render placeholder when no image url", () => {
    const imageList: ICarouselItem[] = [{ imageUrl: "" }];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    expect(wrapper.find(".carousel-placeholder").exists()).toBe(true);
    expect(wrapper.text()).toContain("请上传图片");
  });

  it("should navigate to next slide", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    const nextButton = wrapper.find(".arrow-next");
    await nextButton.trigger("click");
    expect(wrapper.vm.currentIndex).toBe(1);
  });

  it("should navigate to previous slide", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    wrapper.vm.currentIndex = 1;
    const prevButton = wrapper.find(".arrow-prev");
    await prevButton.trigger("click");
    expect(wrapper.vm.currentIndex).toBe(0);
  });

  it("should go to specific slide via indicator", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
      { imageUrl: "https://example.com/image3.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    const indicators = wrapper.findAll(".indicator");
    await indicators[2].trigger("click");
    expect(wrapper.vm.currentIndex).toBe(2);
  });

  it("should apply container style", () => {
    const wrapper = mount(CarouselBlock, {
      props: {
        height: "300px",
        backgroundColor: "#ff0000",
      },
    });
    const container = wrapper.find(".carousel-block");
    expect(container.attributes("style")).toContain("height: 300px");
    expect(container.attributes("style")).toContain("background-color: rgb(255, 0, 0)");
  });

  it("should apply image fit style", () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList, imageFit: "contain" },
    });
    expect(wrapper.vm.imageFit).toBe("contain");
  });

  it("should hide indicators when showIndicators is false", () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList, showIndicators: false },
    });
    expect(wrapper.find(".carousel-indicators").exists()).toBe(false);
  });

  it("should hide arrows when showArrows is false", () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList, showArrows: false },
    });
    expect(wrapper.find(".carousel-arrow").exists()).toBe(false);
  });

  it("should loop to first slide when at end", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList, loop: true },
    });
    wrapper.vm.currentIndex = 1;
    const nextButton = wrapper.find(".arrow-next");
    await nextButton.trigger("click");
    expect(wrapper.vm.currentIndex).toBe(0);
  });

  it("should not loop when loop is false", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList, loop: false },
    });
    wrapper.vm.currentIndex = 1;
    const nextButton = wrapper.find(".arrow-next");
    await nextButton.trigger("click");
    expect(wrapper.vm.currentIndex).toBe(1);
  });

  it("should pause autoplay on mouse enter", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList, autoplay: 1000 },
    });
    await wrapper.find(".carousel-container").trigger("mouseenter");
    expect(wrapper.vm.isHovering).toBe(true);
  });

  it("should resume autoplay on mouse leave", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList, autoplay: 1000 },
    });
    await wrapper.find(".carousel-container").trigger("mouseenter");
    await wrapper.find(".carousel-container").trigger("mouseleave");
    expect(wrapper.vm.isHovering).toBe(false);
  });

  it("should render image alt text", () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg", text: "Image 1" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    expect(wrapper.find("img").attributes("alt")).toBe("Image 1");
  });

  it("should render default alt text when text not provided", () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    expect(wrapper.find("img").attributes("alt")).toContain("轮播图");
  });

  it("should apply active class to current indicator", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
      { imageUrl: "https://example.com/image2.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    const indicators = wrapper.findAll(".indicator");
    expect(indicators[0].classes()).toContain("active");
    expect(indicators[1].classes()).not.toContain("active");
  });

  it("should handle image load event", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    const img = wrapper.find("img");
    await img.trigger("load");
    expect(img.exists()).toBe(true);
  });

  it("should handle image error event", async () => {
    const imageList: ICarouselItem[] = [
      { imageUrl: "https://example.com/image1.jpg" },
    ];
    const wrapper = mount(CarouselBlock, {
      props: { imageList },
    });
    const img = wrapper.find("img");
    await img.trigger("error");
    expect(img.exists()).toBe(true);
  });
});

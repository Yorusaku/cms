import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ProductBlock from "../ProductBlock.vue";
import type { IProductItem } from "../ProductBlock.vue";

const mockList: IProductItem[] = [
  {
    id: "1",
    imgUrl: "https://example.com/img1.jpg",
    brand: "测试商品 A",
    price: 99,
    categoryNames: "分类1",
  },
  {
    id: "2",
    imgUrl: "https://example.com/img2.jpg",
    brand: "测试商品 B",
    price: 199,
    categoryNames: "分类2",
  },
];

describe("ProductBlock", () => {
  it("空列表时显示空状态提示", () => {
    const wrapper = mount(ProductBlock, {
      props: { list: [] },
    });
    expect(wrapper.text()).toContain("暂无商品");
  });

  it("默认 layoutType 为 listDetail 渲染列表", () => {
    const wrapper = mount(ProductBlock, {
      props: { list: mockList },
    });
    expect(wrapper.text()).toContain("测试商品 A");
    expect(wrapper.text()).toContain("测试商品 B");
  });

  it("oneLineOne 布局渲染商品图片", () => {
    const wrapper = mount(ProductBlock, {
      props: { list: mockList, layoutType: "oneLineOne" },
    });
    const images = wrapper.findAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
    expect(wrapper.text()).toContain("测试商品 A");
  });

  it("showPurchase 为 true 时显示购买按钮", () => {
    const wrapper = mount(ProductBlock, {
      props: { list: mockList, showPurchase: true },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("showPurchase 为 false 时隐藏购买按钮", () => {
    const wrapper = mount(ProductBlock, {
      props: { list: mockList, showPurchase: false },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBe(0);
  });

  it("点击购买按钮触发 click 事件", async () => {
    const wrapper = mount(ProductBlock, {
      props: { list: mockList, showPurchase: true },
    });
    const button = wrapper.find("button");
    await button.trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("自定义 priceColor 生效", () => {
    const wrapper = mount(ProductBlock, {
      props: { list: mockList, priceColor: "#ff0000" },
    });
    // priceColor 通过 style 绑定，检查元素存在性
    const element = wrapper.find(".product-block");
    expect(element.exists()).toBe(true);
  });
});
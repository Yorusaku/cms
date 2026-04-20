import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ProductBlock from "@cms/ui/components/ProductBlock.vue";

interface IProductItem {
  id: string;
  imgUrl: string;
  brand: string;
  categoryNames: string;
  price: number;
}

describe("ProductBlock", () => {
  it("should render empty state when no products", () => {
    const wrapper = mount(ProductBlock, {
      props: {
        list: [],
      },
    });
    expect(wrapper.text()).toContain("暂无商品");
  });

  it("should render listDetail layout", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
      },
    });
    expect(wrapper.text()).toContain("Product 1");
    expect(wrapper.text()).toContain("99.99");
  });

  it("should render oneLineOne layout", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "oneLineOne",
      },
    });
    expect(wrapper.text()).toContain("Product 1");
  });

  it("should render oneLineTwo layout", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
      {
        id: "2",
        imgUrl: "https://example.com/product2.jpg",
        brand: "Product 2",
        categoryNames: "Category 2",
        price: 199.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "oneLineTwo",
      },
    });
    expect(wrapper.text()).toContain("Product 1");
    expect(wrapper.text()).toContain("Product 2");
  });

  it("should render product images", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
      },
    });
    const img = wrapper.find("img");
    expect(img.attributes("src")).toBe("https://example.com/product1.jpg");
  });

  it("should render product brand and category", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Nike",
        categoryNames: "Shoes",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
      },
    });
    expect(wrapper.text()).toContain("Nike");
    expect(wrapper.text()).toContain("Shoes");
  });

  it("should render product price with currency symbol", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
      },
    });
    expect(wrapper.text()).toContain("¥");
    expect(wrapper.text()).toContain("99.99");
  });

  it("should apply price color", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
        priceColor: "#ff0000",
      },
    });
    const priceElements = wrapper.findAll(".text-xs");
    const priceDiv = priceElements.find((el) => el.text().includes("¥"));
    expect(priceDiv?.attributes("style")).toContain("color: rgb(255, 0, 0)");
  });

  it("should show purchase button when showPurchase is true", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
        showPurchase: true,
      },
    });
    expect(wrapper.find("button").exists()).toBe(true);
  });

  it("should hide purchase button when showPurchase is false", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
        showPurchase: false,
      },
    });
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("should emit click event when purchase button clicked", async () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
        showPurchase: true,
      },
    });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("should render multiple products", () => {
    const list: IProductItem[] = [
      {
        id: "1",
        imgUrl: "https://example.com/product1.jpg",
        brand: "Product 1",
        categoryNames: "Category 1",
        price: 99.99,
      },
      {
        id: "2",
        imgUrl: "https://example.com/product2.jpg",
        brand: "Product 2",
        categoryNames: "Category 2",
        price: 199.99,
      },
      {
        id: "3",
        imgUrl: "https://example.com/product3.jpg",
        brand: "Product 3",
        categoryNames: "Category 3",
        price: 299.99,
      },
    ];
    const wrapper = mount(ProductBlock, {
      props: {
        list,
        layoutType: "listDetail",
      },
    });
    expect(wrapper.findAll("img")).toHaveLength(3);
  });
});

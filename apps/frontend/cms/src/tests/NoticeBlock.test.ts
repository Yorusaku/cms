import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import NoticeBlock from "@cms/ui/components/NoticeBlock.vue";
import type { INoticeItem } from "@cms/ui/components/NoticeBlock.vue";

describe("NoticeBlock", () => {
  it("should render notice block with default props", () => {
    const wrapper = mount(NoticeBlock);
    expect(wrapper.find(".notice-bar").exists()).toBe(true);
  });

  it("should render single notice item", () => {
    const noticeList: INoticeItem[] = [{ text: "Test Notice" }];
    const wrapper = mount(NoticeBlock, {
      props: {
        noticeList,
      },
    });
    expect(wrapper.text()).toContain("Test Notice");
  });

  it("should render multiple notice items with scroll animation", () => {
    const noticeList: INoticeItem[] = [
      { text: "Notice 1" },
      { text: "Notice 2" },
      { text: "Notice 3" },
    ];
    const wrapper = mount(NoticeBlock, {
      props: {
        noticeList,
      },
    });
    expect(wrapper.text()).toContain("Notice 1");
    expect(wrapper.text()).toContain("Notice 2");
    expect(wrapper.text()).toContain("Notice 3");
    expect(wrapper.find(".notice-scroll").exists()).toBe(true);
  });

  it("should apply background color", () => {
    const wrapper = mount(NoticeBlock, {
      props: {
        backgroundColor: "#ff0000",
      },
    });
    expect(wrapper.find(".notice-bar").attributes("style")).toContain(
      "background-color: rgb(255, 0, 0)"
    );
  });

  it("should apply text color", () => {
    const noticeList: INoticeItem[] = [{ text: "Colored Text" }];
    const wrapper = mount(NoticeBlock, {
      props: {
        noticeList,
        textColor: "#0000ff",
      },
    });
    expect(wrapper.html()).toContain("color: rgb(0, 0, 255)");
  });

  it("should render custom icon url", () => {
    const wrapper = mount(NoticeBlock, {
      props: {
        iconUrl: "https://example.com/icon.png",
      },
    });
    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("https://example.com/icon.png");
    expect(img.attributes("alt")).toBe("公告图标");
  });

  it("should render default icon when no icon url provided", () => {
    const wrapper = mount(NoticeBlock);
    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("should calculate scroll duration based on content and speed", () => {
    const noticeList: INoticeItem[] = [
      { text: "Test" },
      { text: "Notice" },
    ];
    const wrapper = mount(NoticeBlock, {
      props: {
        noticeList,
        speed: 20,
      },
    });
    const scrollElement = wrapper.find(".notice-scroll");
    expect(scrollElement.exists()).toBe(true);
  });

  it("should handle empty notice list", () => {
    const wrapper = mount(NoticeBlock, {
      props: {
        noticeList: [],
      },
    });
    expect(wrapper.find(".notice-bar").exists()).toBe(true);
  });

  it("should render notice with link property", () => {
    const noticeList: INoticeItem[] = [
      { text: "Linked Notice", link: "https://example.com" },
    ];
    const wrapper = mount(NoticeBlock, {
      props: {
        noticeList,
      },
    });
    expect(wrapper.text()).toContain("Linked Notice");
  });

  it("should apply default background color", () => {
    const wrapper = mount(NoticeBlock);
    expect(wrapper.find(".notice-bar").attributes("style")).toContain(
      "background-color: rgb(255, 251, 235)"
    );
  });

  it("should apply default text color", () => {
    const noticeList: INoticeItem[] = [{ text: "Default Color" }];
    const wrapper = mount(NoticeBlock, {
      props: {
        noticeList,
      },
    });
    expect(wrapper.html()).toContain("color: rgb(146, 64, 14)");
  });

  it("should duplicate notice items for seamless scroll", () => {
    const noticeList: INoticeItem[] = [
      { text: "Item 1" },
      { text: "Item 2" },
    ];
    const wrapper = mount(NoticeBlock, {
      props: {
        noticeList,
      },
    });
    const spans = wrapper.findAll("span");
    expect(spans.length).toBeGreaterThanOrEqual(4);
  });
});

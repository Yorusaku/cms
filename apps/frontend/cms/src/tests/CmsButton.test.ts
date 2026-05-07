import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CmsButton from "@cms/ui/components/CmsButton.vue";

describe("CmsButton", () => {
  it("should render button with default type", () => {
    const wrapper = mount(CmsButton, {
      slots: {
        default: "Click me",
      },
    });
    expect(wrapper.find("button").exists()).toBe(true);
    expect(wrapper.text()).toBe("Click me");
    expect(wrapper.find("button").classes()).toContain("bg-white");
  });

  it("should render button with primary type", () => {
    const wrapper = mount(CmsButton, {
      props: {
        type: "primary",
      },
      slots: {
        default: "Primary",
      },
    });
    expect(wrapper.find("button").classes()).toContain("bg-primary");
    expect(wrapper.find("button").classes()).toContain("text-white");
  });

  it("should render button with danger type", () => {
    const wrapper = mount(CmsButton, {
      props: {
        type: "danger",
      },
      slots: {
        default: "Delete",
      },
    });
    expect(wrapper.find("button").classes()).toContain("bg-red-500");
    expect(wrapper.find("button").classes()).toContain("text-white");
  });

  it("should emit click event", async () => {
    const wrapper = mount(CmsButton, {
      slots: {
        default: "Click",
      },
    });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });

  it("should pass mouse event to click handler", async () => {
    const wrapper = mount(CmsButton, {
      slots: {
        default: "Click",
      },
    });
    await wrapper.find("button").trigger("click");
    const emitted = wrapper.emitted("click");
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toBeInstanceOf(MouseEvent);
  });

  it("should render slot content", () => {
    const wrapper = mount(CmsButton, {
      slots: {
        default: "<span>Custom Content</span>",
      },
    });
    expect(wrapper.html()).toContain("Custom Content");
  });

  it("should have correct button classes", () => {
    const wrapper = mount(CmsButton, {
      slots: {
        default: "Button",
      },
    });
    const button = wrapper.find("button");
    expect(button.classes()).toContain("px-4");
    expect(button.classes()).toContain("py-2");
    expect(button.classes()).toContain("border");
    expect(button.classes()).toContain("rounded-md");
    expect(button.classes()).toContain("cursor-pointer");
    expect(button.classes()).toContain("transition-all");
    expect(button.classes()).toContain("duration-300");
  });
});

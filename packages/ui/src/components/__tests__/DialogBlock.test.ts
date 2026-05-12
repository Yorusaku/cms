import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DialogBlock from "../DialogBlock.vue";

describe("DialogBlock", () => {
  it("visible 为 false 时不渲染弹窗", () => {
    const wrapper = mount(DialogBlock, {
      props: { visible: false },
    });
    expect(wrapper.find(".fixed").exists()).toBe(false);
  });

  it("visible 为 true 时渲染弹窗内容", () => {
    const wrapper = mount(DialogBlock, {
      props: { visible: true, title: "测试标题", content: "测试内容" },
    });
    expect(wrapper.text()).toContain("测试标题");
    expect(wrapper.text()).toContain("测试内容");
  });

  it("showActions 为 true 时显示操作按钮", () => {
    const wrapper = mount(DialogBlock, {
      props: { visible: true, showActions: true },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("showCancel 为 false 时不渲染取消按钮", () => {
    const wrapper = mount(DialogBlock, {
      props: { visible: true, showActions: true, showCancel: false },
    });
    expect(wrapper.text()).not.toContain("取消");
  });

  it("自定义 confirmText 和 cancelText", () => {
    const wrapper = mount(DialogBlock, {
      props: {
        visible: true,
        showActions: true,
        confirmText: "好的",
        cancelText: "算了",
      },
    });
    expect(wrapper.text()).toContain("好的");
    expect(wrapper.text()).toContain("算了");
  });

  it("确认按钮存在并可点击", async () => {
    const wrapper = mount(DialogBlock, {
      props: { visible: true, showActions: true, showCancel: false },
    });
    // showCancel=false 时只有 close 按钮和 confirm 按钮
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    // 点击确认按钮不应崩溃
    const lastBtn = buttons[buttons.length - 1];
    await lastBtn.trigger("click");
    expect(wrapper.html()).toContain("确定");
  });
});
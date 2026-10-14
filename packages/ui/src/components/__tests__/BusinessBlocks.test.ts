import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BusinessFormBlock from "../BusinessFormBlock.vue";
import BusinessListBlock from "../BusinessListBlock.vue";
import StatCardBlock from "../StatCardBlock.vue";

describe("business materials", () => {
  it("表单校验必填字段并提交数据", async () => {
    const wrapper = mount(BusinessFormBlock, {
      props: {
        fields: [{ key: "name", label: "姓名", type: "text", required: true }],
      },
    });

    await wrapper.find("form").trigger("submit");
    expect(wrapper.text()).toContain("请填写姓名");

    await wrapper.find("input").setValue("张三");
    await wrapper.find("form").trigger("submit");
    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({ name: "张三" });
    expect(wrapper.text()).toContain("提交成功");
  });

  it("列表支持关键词筛选和空态", async () => {
    const wrapper = mount(BusinessListBlock, {
      props: {
        columns: [{ key: "name", label: "名称" }],
        rows: [{ id: 1, name: "会议室预约" }],
      },
    });

    expect(wrapper.text()).toContain("会议室预约");
    await wrapper.find(".search-input").setValue("不存在");
    expect(wrapper.text()).toContain("暂无数据");
  });

  it("统计卡片展示指标内容", () => {
    const wrapper = mount(StatCardBlock, {
      props: { title: "待审核", value: 8, description: "本周新增" },
    });
    expect(wrapper.text()).toContain("待审核");
    expect(wrapper.text()).toContain("8");
    expect(wrapper.text()).toContain("本周新增");
  });
});

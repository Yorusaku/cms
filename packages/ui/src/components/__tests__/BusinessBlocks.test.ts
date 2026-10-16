import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import BusinessFormBlock, { type BusinessFormField } from "../BusinessFormBlock.vue";
import BusinessListBlock from "../BusinessListBlock.vue";
import StatCardBlock from "../StatCardBlock.vue";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

/** 提交链路必需的页面上下文 */
const pageContext = { pageId: 1001, publishedVersionId: "1001-v1" };

const textField = (
  key: string,
  label: string,
  required = false,
): BusinessFormField => ({ key, label, type: "text", required });

const baseFields: BusinessFormField[] = [
  textField("name", "姓名", true),
  textField("phone", "联系电话", true),
];

const okResponse = () => ({
  ok: true,
  json: async () => ({ code: 10000, data: { id: 1 } }),
});

const fillValid = async (
  wrapper: ReturnType<typeof mount>,
  fields = baseFields,
) => {
  const controls = wrapper.findAll(".field-control");
  await controls[0].setValue("张三");
  await controls[1].setValue("13800138000");
  if (fields.length > 2) {
    await controls[2].setValue("2026-10-20");
    if (fields.length > 3) {
      await controls[3].setValue("咨询");
    }
  }
  await wrapper.find('input[type="checkbox"]').setValue(true);
};

const controlValue = (
  wrapper: ReturnType<typeof mount>,
  index: number,
): string => {
  const element = wrapper.findAll(".field-control")[index].element as HTMLInputElement;
  return element.value;
};

describe("business materials", () => {
  it("表单校验必填字段", async () => {
    const wrapper = mount(BusinessFormBlock, {
      props: { fields: [textField("name", "姓名", true)] },
    });

    await wrapper.find("form").trigger("submit");
    expect(wrapper.text()).toContain("请填写姓名");
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

  it("列表筛选会广播 filter-change 运行时状态", async () => {
    const wrapper = mount(BusinessListBlock, {
      props: {
        columns: [{ key: "name", label: "名称" }],
        rows: [
          { id: 1, name: "服务申请" },
          { id: 2, name: "资料补交" },
          { id: 3, name: "服务评价" },
        ],
      },
    });

    // 初次渲染即广播一次，保证联动目标拿到初始值
    expect(wrapper.emitted("filter-change")?.[0]?.[0]).toEqual({
      filteredCount: 3,
    });

    await wrapper.find(".search-input").setValue("服务");

    const events = wrapper.emitted("filter-change");
    expect(events?.[events.length - 1]?.[0]).toEqual({
      filteredCount: 2,
    });
  });

  it("筛选无结果时广播 0 并展示空态", async () => {
    const wrapper = mount(BusinessListBlock, {
      props: {
        columns: [{ key: "name", label: "名称" }],
        rows: [{ id: 1, name: "服务申请" }],
      },
    });

    await wrapper.find(".search-input").setValue("不存在");

    const events = wrapper.emitted("filter-change");
    expect(events?.[events.length - 1]?.[0]).toEqual({
      filteredCount: 0,
    });
    expect(wrapper.text()).toContain("暂无数据");
  });

  it("筛选后页码重置回第一页", async () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: index < 6 ? `服务-${index + 1}` : `其他-${index + 1}`,
    }));
    const wrapper = mount(BusinessListBlock, {
      props: { columns: [{ key: "name", label: "名称" }], rows, pageSize: 5 },
    });

    await wrapper.findAll(".pagination button")[1].trigger("click");
    expect(wrapper.text()).toContain("2 / 3");

    await wrapper.find(".search-input").setValue("服务");
    expect(wrapper.text()).toContain("1 / 2");
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

describe("BusinessFormBlock 真实提交链路", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("1. 必填字段为空时不能提交", async () => {
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false },
    });

    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("请填写姓名");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("2. 手机号格式错误时不能提交", async () => {
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false },
    });

    await wrapper.findAll(".field-control")[0].setValue("张三");
    await wrapper.findAll(".field-control")[1].setValue("12345");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("请输入正确手机号");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("3. 未配置 name 字段时显示配置错误", async () => {
    const wrapper = mount(BusinessFormBlock, {
      props: {
        ...pageContext,
        trackingEnabled: false,
        fields: [textField("phone", "联系电话", true)],
      },
    });

    await wrapper.findAll(".field-control")[0].setValue("13800138000");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("表单配置错误：缺少姓名（name）字段");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("4. 未配置 phone/phoneNumber 字段时显示配置错误", async () => {
    const wrapper = mount(BusinessFormBlock, {
      props: {
        ...pageContext,
        trackingEnabled: false,
        fields: [textField("name", "姓名", true)],
      },
    });

    await wrapper.findAll(".field-control")[0].setValue("张三");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("表单配置错误：缺少手机号（phone）字段");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("5. privacyRequired 为 true 且未同意时不能提交", async () => {
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false },
    });

    await wrapper.findAll(".field-control")[0].setValue("张三");
    await wrapper.findAll(".field-control")[1].setValue("13800138000");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("请先同意隐私政策");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("6. 正确填写后调用 submitLead", async () => {
    fetchMock.mockResolvedValueOnce(okResponse());
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false },
    });

    await fillValid(wrapper);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/atlas-cms/submitLead");
  });

  it("7. requestId、pageId、publishedVersionId、sessionId 正确传递", async () => {
    fetchMock.mockResolvedValueOnce(okResponse());
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false },
    });

    await fillValid(wrapper);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.pageId).toBe(1001);
    expect(body.publishedVersionId).toBe("1001-v1");
    expect(body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(typeof body.sessionId).toBe("string");
    expect(body.sessionId.length).toBeGreaterThan(0);
    expect(body.consentAccepted).toBe(true);
  });

  it("8. 扩展字段正确序列化到 remark", async () => {
    fetchMock.mockResolvedValueOnce(okResponse());
    const fields: BusinessFormField[] = [
      textField("name", "姓名", true),
      textField("phone", "联系电话", true),
      { key: "date", label: "预约日期", type: "date" },
      { key: "bizType", label: "业务类型", type: "select", options: ["咨询", "办理"] },
    ];
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false, fields },
    });

    await fillValid(wrapper, fields);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(JSON.parse(body.remark)).toEqual({
      预约日期: "2026-10-20",
      业务类型: "咨询",
    });
  });

  it("9. remark 超过 500 字符时不提交", async () => {
    const fields: BusinessFormField[] = [
      textField("name", "姓名", true),
      textField("phone", "联系电话", true),
      textField("note", "备注"),
    ];
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false, fields },
    });

    await wrapper.findAll(".field-control")[0].setValue("张三");
    await wrapper.findAll(".field-control")[1].setValue("13800138000");
    await wrapper.findAll(".field-control")[2].setValue("x".repeat(600));
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("备注内容过长");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("10. 提交成功后显示成功信息并清空表单", async () => {
    fetchMock.mockResolvedValueOnce(okResponse());
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false },
    });

    await fillValid(wrapper);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("提交成功");
    expect(controlValue(wrapper, 0)).toBe("");
    expect(controlValue(wrapper, 1)).toBe("");
    const checkbox = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("11. 提交失败后显示失败信息并保留输入", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false },
    });

    await fillValid(wrapper);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("提交失败，请稍后重试");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(controlValue(wrapper, 0)).toBe("张三");
    expect(controlValue(wrapper, 1)).toBe("13800138000");
  });

  it("12. 埋点失败不影响提交成功状态", async () => {
    fetchMock
      .mockResolvedValueOnce(okResponse())
      .mockRejectedValueOnce(new Error("track failed"));
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext },
    });

    await fillValid(wrapper);
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("/atlas-cms/trackEvent");
    const trackBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(trackBody.eventType).toBe("form_submit");
    expect(trackBody.payload).toEqual({ formType: "business_form" });
    expect(wrapper.text()).toContain("提交成功");
  });

  it("privacyRequired 为 false 时不渲染勾选框且 consentAccepted 上报 true", async () => {
    fetchMock.mockResolvedValueOnce(okResponse());
    const wrapper = mount(BusinessFormBlock, {
      props: { ...pageContext, trackingEnabled: false, privacyRequired: false },
    });

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);

    await wrapper.findAll(".field-control")[0].setValue("张三");
    await wrapper.findAll(".field-control")[1].setValue("13800138000");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.consentAccepted).toBe(true);
    expect(wrapper.text()).toContain("提交成功");
  });
});

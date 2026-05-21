import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import LeadFormBlock from "../LeadFormBlock.vue";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("LeadFormBlock", () => {
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

  it("shows error when phone number is invalid", async () => {
    const wrapper = mount(LeadFormBlock, {
      props: {
        trackingEnabled: false,
      },
    });

    await wrapper.find('input[type="text"]').setValue("张三");
    await wrapper.find('input[type="tel"]').setValue("12345");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("请输入正确手机号");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits lead and tracks form_submit with Bearer token", async () => {
    localStorage.setItem("token", "jwt-token");
    window.history.replaceState(
      {},
      "",
      "/?utm_source=wechat&utm_campaign=launch&channel_id=ad100",
    );

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 10000, data: { id: 1 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 10000, data: { id: 2 } }),
      });

    const wrapper = mount(LeadFormBlock, {
      props: {
        pageId: 1001,
      },
    });

    await wrapper.find('input[type="text"]').setValue("张三");
    await wrapper.find('input[type="tel"]').setValue("13800138000");
    await wrapper.find("textarea").setValue("有采购意向");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [submitUrl, submitOptions] = fetchMock.mock.calls[0];
    const [trackUrl, trackOptions] = fetchMock.mock.calls[1];

    expect(submitUrl).toContain("/atlas-cms/submitLead");
    expect(trackUrl).toContain("/atlas-cms/trackEvent");

    expect(submitOptions.headers.Authorization).toBe("Bearer jwt-token");
    expect(trackOptions.headers.Authorization).toBe("Bearer jwt-token");

    const submitBody = JSON.parse(submitOptions.body as string);
    expect(submitBody).toMatchObject({
      name: "张三",
      phoneNumber: "13800138000",
      remark: "有采购意向",
      pageId: 1001,
      utm: {
        utm_source: "wechat",
        utm_campaign: "launch",
      },
      channel: {
        channel_id: "ad100",
      },
    });

    const trackBody = JSON.parse(trackOptions.body as string);
    expect(trackBody.eventType).toBe("form_submit");
    expect(trackBody.pageId).toBe(1001);
    expect(typeof trackBody.sessionId).toBe("string");

    expect(wrapper.text()).toContain("提交成功");
  });
});

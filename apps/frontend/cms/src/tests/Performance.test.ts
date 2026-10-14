import { mount } from "@vue/test-utils";
import { defineComponent, h, inject, provide } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Performance from "@/views/Performance.vue";

const mocks = vi.hoisted(() => ({
  getCmsPageList: vi.fn(),
  getPagePublishLogs: vi.fn(),
  getPageFunnelSummary: vi.fn(),
  exportPageFunnelCsv: vi.fn(),
  saveBlob: vi.fn(),
  messageSuccess: vi.fn(),
  messageError: vi.fn(),
}));

vi.mock("@/api/activity", () => ({
  getCmsPageList: mocks.getCmsPageList,
  getPagePublishLogs: mocks.getPagePublishLogs,
}));

vi.mock("@/api/tracking", () => ({
  getPageFunnelSummary: mocks.getPageFunnelSummary,
  exportPageFunnelCsv: mocks.exportPageFunnelCsv,
}));

vi.mock("@/utils/download", () => ({
  saveBlob: mocks.saveBlob,
  buildExportFilename: () => "页面效果-20260930-2200.csv",
  downloadFile: vi.fn(),
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: mocks.messageSuccess,
    error: mocks.messageError,
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const tableDataKey = Symbol("tableData");

const simpleWrap = (tag = "div") =>
  defineComponent({
    setup(_props, { slots }) {
      return () => h(tag, slots.default?.());
    },
  });

const ElButtonStub = defineComponent({
  props: { loading: Boolean },
  emits: ["click"],
  setup(_props, { emit, slots }) {
    return () =>
      h("button", { onClick: () => emit("click") }, slots.default?.());
  },
});

const ElSelectStub = defineComponent({
  props: {
    modelValue: { type: [String, Number], default: "" },
    placeholder: String,
    clearable: Boolean,
  },
  emits: ["update:modelValue", "change"],
  setup(props, { emit, slots }) {
    return () =>
      h(
        "select",
        {
          value: props.modelValue,
          onChange: (event: Event) => {
            const value = (event.target as HTMLSelectElement).value;
            emit("update:modelValue", value);
            emit("change", value);
          },
        },
        slots.default?.(),
      );
  },
});

const ElOptionStub = defineComponent({
  props: { label: String, value: { type: [String, Number], default: "" } },
  setup(props) {
    return () => h("option", { value: props.value }, props.label);
  },
});

const ElInputStub = defineComponent({
  props: { modelValue: { type: [String, Number], default: "" }, placeholder: String },
  emits: ["update:modelValue", "keyup"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        placeholder: props.placeholder,
        value: props.modelValue,
        onInput: (event: Event) =>
          emit("update:modelValue", (event.target as HTMLInputElement).value),
        // 透传事件对象：模板用了 @keyup.enter 修饰符，需要读取 event.key
        onKeyup: (event: KeyboardEvent) => emit("keyup", event),
      });
  },
});

const ElTableStub = defineComponent({
  props: { data: { type: Array, default: () => [] } },
  setup(props, { slots }) {
    provide(tableDataKey, () => props.data as Record<string, unknown>[]);
    return () => h("div", { "data-test": "table" }, slots.default?.());
  },
});

const ElTableColumnStub = defineComponent({
  props: { label: String, prop: String },
  setup(props, { slots }) {
    const getData = inject<() => Record<string, unknown>[]>(tableDataKey, () => []);
    return () =>
      h(
        "div",
        { "data-test": `col-${props.label ?? props.prop}` },
        getData().map((row) =>
          slots.default
            ? slots.default({ row })
            : String(row[props.prop ?? ""] ?? ""),
        ),
      );
  },
});

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const mountPerformance = async (role: "admin" | "editor" | "viewer" = "admin") => {
  localStorage.setItem("role", role);
  const wrapper = mount(Performance, {
    global: {
      stubs: {
        ElCard: simpleWrap(),
        ElButton: ElButtonStub,
        ElSelect: ElSelectStub,
        ElOption: ElOptionStub,
        ElInput: ElInputStub,
        ElDatePicker: simpleWrap(),
        ElTable: ElTableStub,
        ElTableColumn: ElTableColumnStub,
        ElEmpty: defineComponent({
          props: { description: String },
          setup(props) {
            return () => h("div", props.description);
          },
        }),
      },
      directives: { loading: {} },
    },
  });
  await flush();
  await flush();
  return wrapper;
};

const summaryFixture = {
  pageId: 7,
  metrics: {
    pageViews: 120,
    uniqueVisitors: 80,
    ctaClicks: 30,
    formSubmits: 12,
    leads: 6,
    ctaClickRate: 0.25,
    leadConversionRate: 0.05,
  },
  channels: [
    {
      channelKey: "channel.src",
      channelValue: "wechat",
      metrics: {
        pageViews: 80,
        uniqueVisitors: 55,
        ctaClicks: 20,
        formSubmits: 8,
        leads: 4,
        ctaClickRate: 0.25,
        leadConversionRate: 0.05,
      },
    },
  ],
  dailyTrend: [
    {
      date: "2026-09-22",
      metrics: {
        pageViews: 40,
        uniqueVisitors: 30,
        ctaClicks: 10,
        formSubmits: 4,
        leads: 2,
        ctaClickRate: 0.25,
        leadConversionRate: 0.05,
      },
    },
    {
      date: "2026-09-21",
      metrics: {
        pageViews: 80,
        uniqueVisitors: 50,
        ctaClicks: 20,
        formSubmits: 8,
        leads: 4,
        ctaClickRate: 0.25,
        leadConversionRate: 0.05,
      },
    },
  ],
};

describe("Performance 看板", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCmsPageList.mockResolvedValue({
      code: 10000,
      message: "success",
      data: {
        list: [{ id: 7, name: "夏季促销页", isAbled: 1, status: "published" }],
        total: 1,
        pageNum: 1,
        pageSize: 100,
      },
    });
    mocks.getPagePublishLogs.mockResolvedValue({
      code: 10000,
      message: "success",
      data: [{ versionId: "7-v1", displayVersion: "v1" }],
    });
    mocks.getPageFunnelSummary.mockResolvedValue({
      code: 10000,
      message: "success",
      data: summaryFixture,
    });
    mocks.exportPageFunnelCsv.mockResolvedValue({
      blob: new Blob(["a"], { type: "text/csv" }),
      filename: "页面效果-20260930-2200.csv",
    });
  });

  it("展示含独立访客的漏斗指标、渠道与每日趋势", async () => {
    const wrapper = await mountPerformance();

    expect(mocks.getPageFunnelSummary).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 7, source: "crs" }),
    );

    const text = wrapper.text();
    expect(text).toContain("独立访客");
    expect(text).toContain("120");
    expect(text).toContain("80");
    expect(text).toContain("25.00%");
    // 趋势按天渲染（后端已倒序）
    expect(text).toContain("2026-09-22");
    expect(text).toContain("2026-09-21");
    // 渠道表带独立访客列
    expect(wrapper.find('[data-test="col-独立访客"]').exists()).toBe(true);
    expect(text).toContain("wechat");
  });

  it("默认按访客口径（crs）请求，切换来源后带新参数重新查询", async () => {
    const wrapper = await mountPerformance();
    mocks.getPageFunnelSummary.mockClear();

    const sourceSelect = wrapper.findAll("select").find((el) => el.element.value === "crs");
    expect(sourceSelect, "应有默认 crs 的来源选择器").toBeTruthy();
    await sourceSelect!.setValue("all");
    await flush();

    expect(mocks.getPageFunnelSummary).toHaveBeenCalledWith(
      expect.objectContaining({ source: "all" }),
    );
  });

  it("渠道筛选变化后按渠道重新查询", async () => {
    const wrapper = await mountPerformance();
    mocks.getPageFunnelSummary.mockClear();

    const channelInput = wrapper.find('input[placeholder="渠道或 UTM 值"]');
    await channelInput.setValue("wechat");
    await channelInput.trigger("keyup", { key: "Enter" });
    await flush();

    expect(mocks.getPageFunnelSummary).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "wechat" }),
    );
  });

  it("管理员可导出看板数据并触发下载", async () => {
    const wrapper = await mountPerformance("admin");

    const exportButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("导出 CSV"));
    expect(exportButton, "管理员应看到导出按钮").toBeTruthy();

    await exportButton!.trigger("click");
    await flush();

    expect(mocks.exportPageFunnelCsv).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 7 }),
    );
    expect(mocks.saveBlob).toHaveBeenCalledWith(expect.any(Blob), "页面效果-20260930-2200.csv");
    expect(mocks.messageSuccess).toHaveBeenCalledWith("看板数据已导出");
  });

  it("观察员只读：看不到导出按钮", async () => {
    const wrapper = await mountPerformance("viewer");

    const exportButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("导出 CSV"));
    expect(exportButton).toBeUndefined();
  });

  it("导出失败时展示后端返回的原因", async () => {
    mocks.exportPageFunnelCsv.mockRejectedValue(new Error("只有管理员可以导出看板数据"));
    const wrapper = await mountPerformance("admin");

    const exportButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("导出 CSV"));
    await exportButton!.trigger("click");
    await flush();

    expect(mocks.messageError).toHaveBeenCalledWith("只有管理员可以导出看板数据");
    expect(mocks.saveBlob).not.toHaveBeenCalled();
  });
});

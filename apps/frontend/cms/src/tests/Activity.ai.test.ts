import { mount } from "@vue/test-utils";
import { defineComponent, h, inject, provide, type PropType } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Activity from "@/views/Activity.vue";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerResolve: vi.fn((route: { path: string; query?: Record<string, unknown> }) => ({
    href: `${route.path}?${new URLSearchParams(
      Object.entries(route.query ?? {}).map(([key, value]) => [key, String(value)]),
    ).toString()}`,
  })),
  getCmsPageList: vi.fn(),
  aiGeneratePage: vi.fn(),
  aiDiagnosePage: vi.fn(),
  getLeadList: vi.fn(),
  trackEvent: vi.fn(),
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  messageError: vi.fn(),
  messageInfo: vi.fn(),
  messageBoxConfirm: vi.fn(),
  setInitPageSchema: vi.fn(),
  updateLeadStatus: vi.fn(),
  messageBoxPrompt: vi.fn(),
  getPagePublishLogs: vi.fn(),
  rollbackPageVersion: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: mocks.routerPush,
    resolve: mocks.routerResolve,
  }),
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: mocks.messageSuccess,
    warning: mocks.messageWarning,
    error: mocks.messageError,
    info: mocks.messageInfo,
  },
  ElMessageBox: {
    confirm: mocks.messageBoxConfirm,
    prompt: mocks.messageBoxPrompt,
  },
}));

vi.mock("@/components/TemplatePicker.vue", () => ({
  default: defineComponent({
    name: "TemplatePicker",
    template: "<div />",
  }),
}));

vi.mock("../api/activity", () => ({
  getCmsPageList: mocks.getCmsPageList,
  getCmsPageById: vi.fn(),
  getPagePublishLogs: mocks.getPagePublishLogs,
  rollbackPageVersion: mocks.rollbackPageVersion,
  saveCmsPage: vi.fn(),
  updateStatus: vi.fn(),
  deletePage: vi.fn(),
}));

vi.mock("@/api/ai", () => ({
  aiGeneratePage: mocks.aiGeneratePage,
  aiDiagnosePage: mocks.aiDiagnosePage,
}));

vi.mock("@/api/lead", () => ({
  getLeadList: mocks.getLeadList,
  updateLeadStatus: mocks.updateLeadStatus,
}));

vi.mock("@/utils/tracking", () => ({
  trackEvent: mocks.trackEvent,
}));

vi.mock("@/utils/page-publish", () => ({
  getLocalPublishLogs: vi.fn(() => []),
  markPageDraft: vi.fn(),
  resolvePageContentStatus: vi.fn(() => "draft"),
  rollbackLocalPublishVersion: vi.fn(),
}));

vi.mock("../store/usePageStore", () => ({
  usePageStore: () => ({
    setInitPageSchema: mocks.setInitPageSchema,
  }),
}));

type RowData = Record<string, unknown>;

const tableDataKey = Symbol("tableData");

const simpleWrap = (tag = "div") =>
  defineComponent({
    props: ["modelValue", "title", "label", "description"],
    setup(_props, { slots }) {
      return () => h(tag, slots.default?.());
    },
  });

const ElButtonStub = defineComponent({
  props: {
    disabled: Boolean,
    loading: Boolean,
    type: String,
    size: String,
    text: Boolean,
  },
  emits: ["click"],
  setup(props, { emit, slots }) {
    return () =>
      h(
        "button",
        {
          disabled: props.disabled,
          onClick: () => emit("click"),
        },
        slots.default?.(),
      );
  },
});

const ElInputStub = defineComponent({
  props: {
    modelValue: {
      type: [String, Number],
      default: "",
    },
    placeholder: String,
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        placeholder: props.placeholder,
        value: props.modelValue,
        onInput: (event: Event) =>
          emit("update:modelValue", (event.target as HTMLInputElement).value),
      });
  },
});

const ElSelectStub = defineComponent({
  props: {
    modelValue: {
      type: [String, Number],
      default: "",
    },
    placeholder: String,
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
  props: {
    label: String,
    value: {
      type: [String, Number],
      default: "",
    },
  },
  setup(props) {
    return () => h("option", { value: props.value }, props.label);
  },
});

const ElDialogStub = defineComponent({
  props: {
    modelValue: Boolean,
    title: String,
  },
  setup(props, { slots }) {
    return () =>
      props.modelValue
        ? h("section", { "data-test": "dialog" }, [
            h("h2", props.title),
            slots.default?.(),
            h("footer", slots.footer?.()),
          ])
        : null;
  },
});

const ElDrawerStub = defineComponent({
  props: {
    modelValue: Boolean,
    title: String,
  },
  setup(props, { slots }) {
    return () =>
      props.modelValue
        ? h("aside", { "data-test": "drawer" }, [
            h("h2", props.title),
            slots.default?.(),
          ])
        : null;
  },
});

const ElTableStub = defineComponent({
  props: {
    data: {
      type: Array as PropType<RowData[]>,
      default: () => [],
    },
  },
  setup(props, { slots }) {
    provide(tableDataKey, () => props.data as RowData[]);
    return () => h("div", { "data-test": "table" }, slots.default?.());
  },
});

const ElTableColumnStub = defineComponent({
  props: {
    label: String,
  },
  setup(_props, { slots }) {
    const getData = inject<() => RowData[]>(tableDataKey, () => []);
    return () =>
      h(
        "div",
        getData().map((row) => h("div", slots.default?.({ row }))),
      );
  },
});

const mountActivity = async () => {
  const wrapper = mount(Activity, {
    global: {
      stubs: {
        ElButton: ElButtonStub,
        ElInput: ElInputStub,
        ElSelect: ElSelectStub,
        ElOption: ElOptionStub,
        ElDialog: ElDialogStub,
        ElDrawer: ElDrawerStub,
        ElTable: ElTableStub,
        ElTableColumn: ElTableColumnStub,
        ElCard: simpleWrap(),
        ElForm: simpleWrap("form"),
        ElFormItem: simpleWrap(),
        ElIcon: simpleWrap("span"),
        ElTag: simpleWrap("span"),
        ElPagination: simpleWrap(),
        ElEmpty: defineComponent({
          props: {
            description: String,
          },
          setup(props) {
            return () => h("div", props.description);
          },
        }),
        ElTimeline: simpleWrap(),
        ElTimelineItem: simpleWrap(),
        ElPopconfirm: defineComponent({
          setup(_props, { slots }) {
            return () => h("span", slots.reference?.());
          },
        }),
      },
      directives: {
        loading: {},
      },
    },
  });

  await flushPromises();
  return wrapper;
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const clickButtonByText = async (
  wrapper: ReturnType<typeof mount>,
  text: string,
) => {
  const button = wrapper
    .findAll("button")
    .find((item) => item.text().replace(/\s+/g, " ").trim() === text);

  expect(button, `找不到按钮：${text}`).toBeTruthy();
  await button!.trigger("click");
  await flushPromises();
};

describe("Activity AI 交互", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("role", "admin");

    mocks.getCmsPageList.mockResolvedValue({
      code: 10000,
      message: "success",
      data: {
        list: [
          {
            id: 7,
            name: "夏季促销页",
            isAbled: 0,
            create_time: "2026-08-18 00:00:00",
            update_time: "2026-08-18 00:00:00",
          },
        ],
        total: 1,
        pageNum: 1,
        pageSize: 10,
      },
    });
    mocks.getLeadList.mockResolvedValue({
      code: 10000,
      message: "success",
      data: { list: [], total: 0, pageNum: 1, pageSize: 20 },
    });
    mocks.trackEvent.mockResolvedValue(undefined);
  });

  it("打开 AI 新建弹窗并在必填项缺失时阻止提交", async () => {
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "AI 新建");
    await clickButtonByText(wrapper, "生成草稿");

    expect(mocks.aiGeneratePage).not.toHaveBeenCalled();
    expect(mocks.messageWarning).toHaveBeenCalledWith("请填写页面标题");
  });

  it("提交 AI 新建表单成功后跳转到装修页", async () => {
    mocks.aiGeneratePage.mockResolvedValue({
      code: 10000,
      message: "success",
      data: {
        pageId: 88,
        schema: {
          version: "2.0.0",
          pageConfig: {},
          componentMap: {},
          rootIds: [],
        },
        summary: "AI 页面草稿已生成",
        warnings: [],
      },
    });
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "AI 新建");
    await wrapper.find('input[placeholder="如：618 爆款限时购"]').setValue("618 爆款限时购");
    await wrapper.find('input[placeholder="如：25-35 岁新锐白领"]').setValue("年轻白领");
    await wrapper
      .find('input[placeholder="如：满 299 减 80，前 100 名加赠礼包"]')
      .setValue("满 299 减 80");
    await wrapper.find('input[placeholder="商品名"]').setValue("夏季套装");
    await wrapper.find('input[placeholder="现价"]').setValue("199");
    await wrapper.find('input[placeholder="原价"]').setValue("299");
    await wrapper.find('input[placeholder="卖点"]').setValue("清爽舒适");
    await clickButtonByText(wrapper, "生成草稿");

    expect(mocks.aiGeneratePage).toHaveBeenCalledWith(
      expect.objectContaining({
        pageName: "618 爆款限时购",
        activityType: "电商大促",
        audience: "年轻白领",
        promotion: "满 299 减 80",
        ctaText: "立即领取优惠",
        products: [
          {
            name: "夏季套装",
            price: "199",
            originalPrice: "299",
            sellingPoint: "清爽舒适",
          },
        ],
      }),
    );
    expect(mocks.messageSuccess).toHaveBeenCalledWith("AI 页面草稿已生成");
    expect(mocks.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "cta_click",
        pageId: 88,
        ctaText: "ai_generate_page",
      }),
    );
    expect(mocks.routerPush).toHaveBeenCalledWith({
      path: "/decorate",
      query: { id: 88 },
    });
  });

  it("打开 AI 优化抽屉并展示诊断建议", async () => {
    mocks.aiDiagnosePage.mockResolvedValue({
      code: 10000,
      message: "success",
      data: {
        pageId: 7,
        summary: "当前页面累计 120 次访问，线索转化率 1.00%。",
        advice: [
          {
            category: "cta",
            severity: "critical",
            targetComponentId: "lead-form",
            problem: "CTA 点击率低于建议阈值。",
            suggestion: "将按钮文案改为收益导向。",
            expectedImpact: "提升点击率。",
          },
        ],
      },
    });
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "AI 优化");

    expect(mocks.aiDiagnosePage).toHaveBeenCalledWith({ pageId: 7 });
    expect(wrapper.text()).toContain("AI 优化建议");
    expect(wrapper.text()).toContain("夏季促销页");
    expect(wrapper.text()).toContain("CTA 点击率低于建议阈值。");
    expect(wrapper.text()).toContain("将按钮文案改为收益导向。");
    expect(mocks.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "page_view",
        pageId: 7,
        payload: expect.objectContaining({
          source: "ai_diagnosis_drawer",
          adviceCount: 1,
        }),
      }),
    );
  });

  it("AI 优化接口失败时展示错误提示", async () => {
    mocks.aiDiagnosePage.mockResolvedValue({
      code: 50000,
      message: "诊断失败",
      data: null,
    });
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "AI 优化");

    expect(mocks.messageError).toHaveBeenCalledWith("诊断失败");
    expect(wrapper.text()).toContain("暂无优化建议");
  });
});

describe("Activity 线索跟进与发布记录", () => {
  beforeEach(() => {
    localStorage.setItem("role", "admin");

    mocks.getCmsPageList.mockResolvedValue({
      code: 10000,
      message: "success",
      data: {
        list: [
          {
            id: 7,
            name: "夏季促销页",
            isAbled: 0,
            create_time: "2026-08-18 00:00:00",
            update_time: "2026-08-18 00:00:00",
          },
        ],
        total: 1,
        pageNum: 1,
        pageSize: 10,
      },
    });
    mocks.getLeadList.mockResolvedValue({
      code: 10000,
      message: "success",
      data: {
        list: [
          {
            id: 1,
            name: "张三",
            phoneNumber: "13800138000",
            remark: "想了解套餐",
            pageId: 7,
            publishedVersionId: "7-v1",
            sessionId: "s1",
            status: "new",
            followUpRemark: null,
            followedBy: null,
            followedAt: null,
            utm: { utm_source: "wechat" },
            channel: { ch: "qr" },
            createdAt: "2026-09-18 10:00:00",
            updatedAt: "2026-09-18 10:00:00",
          },
        ],
        total: 1,
        pageNum: 1,
        pageSize: 20,
      },
    });
    mocks.trackEvent.mockResolvedValue(undefined);
    mocks.messageBoxConfirm.mockResolvedValue(undefined);
    mocks.messageBoxPrompt.mockResolvedValue({ value: "已电话联系，待确认预算" });
  });

  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  it("发布记录抽屉展示当前线上与回滚版本标签", async () => {
    mocks.getPagePublishLogs.mockResolvedValue({
      code: 10000,
      data: [
        {
          versionId: "7-v2",
          displayVersion: "v2",
          operator: "admin",
          note: "发布 v2",
          publishedAt: 1700000000000,
          action: "publish",
          isCurrent: true,
        },
        {
          versionId: "7-v1",
          displayVersion: "v1",
          operator: "editor",
          note: "回滚到 v1",
          publishedAt: 1600000000000,
          action: "rollback",
          isCurrent: false,
        },
      ],
    });
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "发布记录");
    await settle();

    expect(mocks.getPagePublishLogs).toHaveBeenCalledWith(7);
    expect(wrapper.text()).toContain("v2");
    expect(wrapper.text()).toContain("v1");
    expect(wrapper.text()).toContain("当前线上");
    expect(wrapper.text()).toContain("回滚版本");
  });

  it("回滚使用服务端接口且不覆盖草稿语义", async () => {
    mocks.getPagePublishLogs.mockResolvedValue({
      code: 10000,
      data: [
        {
          versionId: "7-v1",
          displayVersion: "v1",
          operator: "admin",
          note: "发布 v1",
          publishedAt: 1700000000000,
          action: "publish",
          isCurrent: true,
        },
      ],
    });
    mocks.rollbackPageVersion.mockResolvedValue({ code: 10000, message: "success", data: null });
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "发布记录");
    await clickButtonByText(wrapper, "回滚到此版本");
    await settle();

    expect(mocks.messageBoxConfirm).toHaveBeenCalledWith(
      "回滚会立即恢复线上页面到该历史版本，当前编辑草稿不会被覆盖，是否继续？",
      "确认回滚",
      expect.anything(),
    );
    expect(mocks.rollbackPageVersion).toHaveBeenCalledWith({ pageId: 7, versionId: "7-v1" });
    expect(mocks.messageSuccess).toHaveBeenCalledWith("线上页面已回滚，当前草稿未受影响");
    expect(mocks.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "cta_click",
        ctaText: "rollback_page_version",
        payload: { versionId: "7-v1" },
      }),
    );
  });

  it("线索抽屉按页面加载并展示版本与渠道信息", async () => {
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "线索");
    await settle();

    expect(mocks.getLeadList).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 7, pageNum: 1, pageSize: 20, status: undefined, channel: undefined }),
    );
    expect(wrapper.text()).toContain("线索列表");
    expect(wrapper.text()).toContain("ch=qr");
    expect(wrapper.text()).toContain("utm_source=wechat");
    expect(wrapper.text()).toContain("添加备注");
  });

  it("修改线索跟进状态调用 updateLeadStatus", async () => {
    mocks.updateLeadStatus.mockResolvedValue({ code: 10000, message: "success", data: null });
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "线索");
    await settle();

    const statusSelect = wrapper.findAll("select").find((el) => el.element.value === "new");
    expect(statusSelect, "应找到行内跟进状态下拉").toBeTruthy();
    await statusSelect!.setValue("contacted");
    await settle();

    expect(mocks.updateLeadStatus).toHaveBeenCalledWith({ id: 1, status: "contacted", followUpRemark: undefined });
    expect(mocks.messageSuccess).toHaveBeenCalledWith("线索状态已更新");
  });

  it("填写跟进备注并保存", async () => {
    mocks.updateLeadStatus.mockResolvedValue({ code: 10000, message: "success", data: null });
    const wrapper = await mountActivity();

    await clickButtonByText(wrapper, "线索");
    await clickButtonByText(wrapper, "添加备注");
    await settle();

    expect(mocks.messageBoxPrompt).toHaveBeenCalledWith("填写本次跟进备注", "线索跟进", expect.anything());
    expect(mocks.updateLeadStatus).toHaveBeenCalledWith({
      id: 1,
      status: "new",
      followUpRemark: "已电话联系，待确认预算",
    });
    expect(mocks.messageSuccess).toHaveBeenCalledWith("跟进备注已保存");
  });
});

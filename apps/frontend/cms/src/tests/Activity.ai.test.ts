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
  exportLeadCsv: vi.fn(),
  getLeadRetentionPolicy: vi.fn(),
  purgeExpiredLeads: vi.fn(),
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
  exportLeadCsv: mocks.exportLeadCsv,
  getLeadRetentionPolicy: mocks.getLeadRetentionPolicy,
  purgeExpiredLeads: mocks.purgeExpiredLeads,
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
        ElAlert: defineComponent({
          props: {
            title: String,
            type: String,
            closable: Boolean,
          },
          setup(props) {
            return () => h("div", { "data-test": "alert" }, props.title);
          },
        }),
        ElTooltip: defineComponent({
          props: {
            content: String,
            placement: String,
          },
          setup(props, { slots }) {
            // 把 content 落到 title 上，便于断言 tooltip 文案确实渲染
            return () =>
              h("span", { "data-test": "tooltip", title: props.content }, slots.default?.());
          },
        }),
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
    await wrapper.find('input[placeholder="如：员工服务办理中心"]').setValue("员工服务办理中心");
    await wrapper.find('input[placeholder="如：企业员工或客户"]').setValue("企业员工");
    await wrapper
      .find('input[placeholder="如：展示服务介绍、办理须知和常见问题"]')
      .setValue("展示办理须知和常见问题");
    await clickButtonByText(wrapper, "生成草稿");

    expect(mocks.aiGeneratePage).toHaveBeenCalledWith(
      expect.objectContaining({
        pageName: "员工服务办理中心",
        activityType: "内容展示",
        audience: "企业员工",
        promotion: "展示办理须知和常见问题",
        ctaText: "提交申请",
        products: [],
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
    // 清掉上一条用例的调用记录：本组有用例断言调用次数，否则会跨用例累积
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
    mocks.getLeadRetentionPolicy.mockResolvedValue({
      code: 10000,
      message: "success",
      data: { retentionDays: 180, cutoffAt: "2025-04-04T00:00:00.000Z" },
    });
    mocks.exportLeadCsv.mockResolvedValue({
      blob: new Blob(["id,name\r\n"], { type: "text/csv" }),
      filename: "线索导出-20260930-2119.csv",
    });
    mocks.purgeExpiredLeads.mockResolvedValue({
      code: 10000,
      message: "success",
      data: { retentionDays: 180, cutoffAt: "2025-04-04T00:00:00.000Z", dryRun: true, matched: 0, deleted: 0 },
    });
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

  it("admin 导出线索生成 CSV 并提示成功", async () => {
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    const wrapper = await mountActivity();
    await clickButtonByText(wrapper, "线索");
    await settle();
    await settle();
    await clickButtonByText(wrapper, "导出 CSV");
    await settle();

    expect(mocks.exportLeadCsv).toHaveBeenCalledWith({
      pageId: 7,
      status: undefined,
      channel: undefined,
    });
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
    expect(mocks.messageSuccess).toHaveBeenCalledWith("线索已导出");
  });

  it("导出失败时展示后端返回的原因", async () => {
    mocks.exportLeadCsv.mockRejectedValue(new Error("只有管理员可以导出线索"));

    const wrapper = await mountActivity();
    await clickButtonByText(wrapper, "线索");
    await settle();
    await settle();
    await clickButtonByText(wrapper, "导出 CSV");
    await settle();

    expect(mocks.messageError).toHaveBeenCalledWith("只有管理员可以导出线索");
  });

  it("展示保留策略，清理超期线索需先预览再确认", async () => {
    mocks.purgeExpiredLeads
      .mockResolvedValueOnce({
        code: 10000,
        message: "success",
        data: {
          retentionDays: 180,
          cutoffAt: "2025-04-04T00:00:00.000Z",
          dryRun: true,
          matched: 3,
          deleted: 0,
        },
      })
      .mockResolvedValueOnce({
        code: 10000,
        message: "success",
        data: {
          retentionDays: 180,
          cutoffAt: "2025-04-04T00:00:00.000Z",
          dryRun: false,
          matched: 3,
          deleted: 3,
        },
      });

    const wrapper = await mountActivity();
    await clickButtonByText(wrapper, "线索");
    await settle();
    await settle();

    expect(wrapper.text()).toContain("线索保留 180 天");

    await clickButtonByText(wrapper, "清理超期线索");
    await settle();

    expect(mocks.purgeExpiredLeads).toHaveBeenNthCalledWith(1, true);
    expect(mocks.messageBoxConfirm).toHaveBeenCalled();
    expect(mocks.purgeExpiredLeads).toHaveBeenNthCalledWith(2, false);
    expect(mocks.messageSuccess).toHaveBeenCalledWith("已清理 3 条超期线索");
  });

  it("没有超期线索时只提示，不执行删除", async () => {
    const wrapper = await mountActivity();
    await clickButtonByText(wrapper, "线索");
    await settle();
    await settle();
    await clickButtonByText(wrapper, "清理超期线索");
    await settle();

    expect(mocks.purgeExpiredLeads).toHaveBeenCalledTimes(1);
    expect(mocks.messageBoxConfirm).not.toHaveBeenCalled();
    expect(mocks.messageInfo).toHaveBeenCalledWith("没有超过 180 天的线索需要清理");
  });
});

describe("Activity 角色门禁", () => {
  const mockRow = (partial: RowData = {}) => ({
    id: 7,
    name: "夏季促销页",
    isAbled: 0,
    status: "draft",
    create_time: "2026-08-18 00:00:00",
    update_time: "2026-08-18 00:00:00",
    ...partial,
  });

  const setupRows = (rows: RowData[]) => {
    mocks.getCmsPageList.mockResolvedValue({
      code: 10000,
      message: "success",
      data: { list: rows, total: rows.length, pageNum: 1, pageSize: 10 },
    });
    mocks.getLeadList.mockResolvedValue({
      code: 10000,
      message: "success",
      data: { list: [], total: 0, pageNum: 1, pageSize: 20 },
    });
  };

  const mountAs = async (role: "admin" | "editor" | "viewer", rows: RowData[]) => {
    localStorage.setItem("role", role);
    setupRows(rows);
    return mountActivity();
  };

  /** 按钮文案集合：避免被筛选下拉选项、提示语里的同名词干扰 */
  const buttonTexts = (wrapper: ReturnType<typeof mount>) =>
    wrapper
      .findAll("button")
      .map((item) => item.text().replace(/\s+/g, " ").trim())
      .filter(Boolean);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("viewer 只读：不渲染任何写操作入口，并提示当前为观察员", async () => {
    const wrapper = await mountAs("viewer", [mockRow({ status: "published", isAbled: 1 })]);

    expect(wrapper.text()).toContain("观察员账号");
    const labels = buttonTexts(wrapper);
    // 写操作入口全部隐藏（含查看含手机号的线索）
    [
      "新增页面",
      "AI 新建",
      "装修",
      "复制",
      "删除",
      "提交审核",
      "通过审核",
      "驳回",
      "回滚到最新发布",
      "线索",
      "上线",
      "下线",
    ].forEach((label) => expect(labels).not.toContain(label));
    // 只读入口保留
    ["发布记录", "预览", "AI 优化"].forEach((label) =>
      expect(labels).toContain(label),
    );
  });

  it("editor 可建页与提交审核，但看不到审核、发布、回滚、删除入口", async () => {
    const wrapper = await mountAs("editor", [
      mockRow({ id: 11, status: "draft" }),
      mockRow({ id: 12, status: "pending_review" }),
      mockRow({ id: 13, status: "approved" }),
    ]);

    const labels = buttonTexts(wrapper);
    ["新增页面", "AI 新建", "装修", "复制", "提交审核", "线索"].forEach((label) =>
      expect(labels).toContain(label),
    );
    // 审核 / 发布 / 回滚 / 删除 / 上下线仍为管理员专属
    ["通过审核", "驳回", "发布", "回滚到最新发布", "删除", "上线"].forEach((label) =>
      expect(labels).not.toContain(label),
    );
  });

  it("admin 可见全部写操作入口", async () => {
    const wrapper = await mountAs("admin", [
      mockRow({ id: 21, status: "pending_review" }),
    ]);

    const labels = buttonTexts(wrapper);
    ["通过审核", "驳回", "回滚到最新发布", "删除"].forEach((label) =>
      expect(labels).toContain(label),
    );
  });

  it("本地角色缺失时按 viewer 最小权限处理", async () => {
    localStorage.removeItem("role");
    setupRows([mockRow({ status: "published", isAbled: 1 })]);
    const wrapper = await mountActivity();

    expect(wrapper.text()).toContain("观察员账号");
    expect(buttonTexts(wrapper)).not.toContain("新增页面");
  });

  it("已驳回页面展示审核备注", async () => {
    const wrapper = await mountAs("editor", [
      mockRow({ id: 31, status: "rejected", reviewNote: "首屏文案不合规，请调整" }),
    ]);

    expect(wrapper.text()).toContain("已驳回");
    expect(wrapper.html()).toContain("首屏文案不合规，请调整");
  });
});

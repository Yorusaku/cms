import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { AiContentChange, IPageSchemaV2 } from "@cms/types";
import { usePageStore } from "../store/usePageStore";

/**
 * AI 内容更新的 store 批量应用（applyContentChanges）。
 *
 * 关注点：只合并允许字段、保留 Notice 关联字段与表单配置、
 * 任一目标冲突则整批不应用、一次应用对应一次撤销、
 * 与延迟提交（debouncedCommit）的历史协调。
 */
const makeSchema = (): IPageSchemaV2 => ({
  version: "2.0.0",
  pageConfig: { name: "AI 内容更新测试页" },
  componentMap: {
    "rich-1": {
      id: "rich-1",
      type: "RichText",
      parentId: null,
      children: [],
      props: {
        content: "<p>旧正文</p>",
        backgroundColor: "#ffffff",
        padding: "10px",
      },
      styles: {},
    },
    "notice-1": {
      id: "notice-1",
      type: "Notice",
      parentId: null,
      children: [],
      props: {
        noticeList: [
          { text: "旧公告一", link: "/detail/a" },
          { text: "旧公告二", link: "/detail/b" },
        ],
        backgroundColor: "#fffbeb",
        speed: 20,
      },
      styles: {},
    },
    "form-1": {
      id: "form-1",
      type: "BusinessForm",
      parentId: null,
      children: [],
      props: {
        title: "培训登记",
        subtitle: "请填写以下信息",
        submitText: "提交信息",
        fields: [{ key: "name", label: "姓名", type: "text", required: true }],
        endpoint: "/atlas-cms/submitLead",
      },
      styles: {},
    },
  },
  rootIds: ["rich-1", "notice-1", "form-1"],
});

const fullChanges: AiContentChange[] = [
  {
    componentId: "rich-1",
    type: "RichText",
    blocks: [{ type: "paragraph", text: "新正文" }],
    html: "<p>新正文</p>",
  },
  {
    componentId: "notice-1",
    type: "Notice",
    noticeTexts: ["新公告一", "新公告二"],
  },
  {
    componentId: "form-1",
    type: "BusinessForm",
    title: "11 月培训登记",
    submitText: "立即报名",
  },
];

const snapshot = (store: ReturnType<typeof usePageStore>) =>
  JSON.parse(JSON.stringify(store.pageSchema.componentMap));

describe("AI 内容更新（applyContentChanges）", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("三类物料批量应用，只合并允许字段并保留关联信息", () => {
    const store = usePageStore();
    store.importPageSchema(makeSchema());
    const before = snapshot(store);

    const result = store.applyContentChanges(fullChanges);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.applied).toBe(3);
    }

    const after = snapshot(store);

    // RichText：只改 content，背景与内边距不变
    expect(after["rich-1"].props.content).toBe("<p>新正文</p>");
    expect(after["rich-1"].props.backgroundColor).toBe(
      before["rich-1"].props.backgroundColor,
    );
    expect(after["rich-1"].props.padding).toBe(before["rich-1"].props.padding);

    // Notice：数量顺序不变，只替换文字，link 保留
    const noticeList = after["notice-1"].props.noticeList as Array<{
      text: string;
      link?: string;
    }>;
    expect(noticeList).toHaveLength(2);
    expect(noticeList[0].text).toBe("新公告一");
    expect(noticeList[1].text).toBe("新公告二");
    // 链接（normalize 后的对象形态）与原公告保持完全一致
    const beforeNoticeList = before["notice-1"].props.noticeList as Array<{
      link?: unknown;
    }>;
    expect(noticeList[0].link).toEqual(beforeNoticeList[0].link);
    expect(noticeList[1].link).toEqual(beforeNoticeList[1].link);
    expect(after["notice-1"].props.speed).toBe(before["notice-1"].props.speed);

    // BusinessForm：只改返回的字段，字段配置与提交配置不变
    expect(after["form-1"].props.title).toBe("11 月培训登记");
    expect(after["form-1"].props.submitText).toBe("立即报名");
    expect(after["form-1"].props.subtitle).toBe(
      before["form-1"].props.subtitle,
    );
    expect(after["form-1"].props.fields).toEqual(before["form-1"].props.fields);
    expect(after["form-1"].props.endpoint).toBe(
      before["form-1"].props.endpoint,
    );
  });

  it("未知组件 / 类型不匹配 / 公告数量不符 → 整批不应用", () => {
    const store = usePageStore();
    store.importPageSchema(makeSchema());
    const before = snapshot(store);

    const unknownResult = store.applyContentChanges([
      { ...fullChanges[0], componentId: "not-exist" },
    ]);
    expect(unknownResult.ok).toBe(false);

    const mismatchResult = store.applyContentChanges([
      { componentId: "notice-1", type: "RichText", blocks: [], html: "<p>x</p>" },
    ]);
    expect(mismatchResult.ok).toBe(false);

    // 一个合法 + 一个数量不符：整批都不应写入
    const partialResult = store.applyContentChanges([
      fullChanges[0],
      { componentId: "notice-1", type: "Notice", noticeTexts: ["只剩一条"] },
    ]);
    expect(partialResult.ok).toBe(false);
    expect(snapshot(store)).toEqual(before);
  });

  it("空变更集不产生写入", () => {
    const store = usePageStore();
    store.importPageSchema(makeSchema());
    const before = snapshot(store);

    const result = store.applyContentChanges([]);

    expect(result.ok).toBe(false);
    expect(snapshot(store)).toEqual(before);
  });

  it("一次应用只产生一个撤销步骤：撤销整个恢复，重做再次应用", () => {
    const store = usePageStore();
    store.importPageSchema(makeSchema());
    const before = snapshot(store);

    store.applyContentChanges(fullChanges);
    const after = snapshot(store);

    store.undo();
    expect(snapshot(store)).toEqual(before);

    store.redo();
    expect(snapshot(store)).toEqual(after);
  });

  it("此前的人工编辑保留为独立历史点：先撤销 AI 修改，再撤销人工编辑", () => {
    const store = usePageStore();
    store.importPageSchema(makeSchema());
    const original = snapshot(store);

    // 人工编辑（走 updateComponentProps → 300ms 延迟提交）
    store.editComponent({
      id: "form-1",
      props: { subtitle: "人工修改后的说明" },
    });
    const afterManualEdit = snapshot(store);

    // 紧接着应用 AI 修改：应先落定人工编辑，再记录本次应用
    store.applyContentChanges(fullChanges);

    store.undo();
    expect(snapshot(store)).toEqual(afterManualEdit);
    expect(snapshot(store)["form-1"].props.subtitle).toBe(
      "人工修改后的说明",
    );

    store.undo();
    expect(snapshot(store)).toEqual(original);
  });

  it("待执行的延迟提交不会产生空历史步骤", () => {
    const store = usePageStore();
    store.importPageSchema(makeSchema());
    const imported = snapshot(store);

    store.editComponent({
      id: "form-1",
      props: { subtitle: "人工修改" },
    });
    store.applyContentChanges(fullChanges);

    // 推进超过防抖窗口：不应再追加一个与当前状态相同的空快照
    vi.advanceTimersByTime(500);

    // 撤销两次：AI 应用与人工编辑依次回退，回到导入时的内容
    //（若防抖产生了空快照，第一次撤销将不改变状态，这一断言即会失败）
    store.undo();
    store.undo();
    expect(snapshot(store)).toEqual(imported);

    // 继续撤销到底：每步都必须带来实际变化，不允许与上一状态相同
    let previous = snapshot(store);
    let emptySteps = 0;
    let guard = 0;
    while (store.canUndo && guard < 10) {
      store.undo();
      const current = snapshot(store);
      if (JSON.stringify(current) === JSON.stringify(previous)) {
        emptySteps += 1;
      }
      previous = current;
      guard += 1;
    }
    expect(emptySteps).toBe(0);
  });
});

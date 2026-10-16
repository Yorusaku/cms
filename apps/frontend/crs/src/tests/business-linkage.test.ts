import { describe, it, expect, beforeEach } from "vitest";
import { LinkageEngine, type IComponentLinkage } from "../utils/linkage-engine";

/**
 * 业务查询页联动链路（CRS 渲染端）。
 *
 * 完整链路：
 *   BusinessList 筛选 → emit filter-change → RenderNode 桥接
 *   → engine.triggerLinkage(listId, "filteredCount", n)
 *   → componentStates[statId] = { value: n } → RenderNode 注入 mergedProps。
 *
 * 这里覆盖引擎侧的状态流转（RenderNode 的桥接只是把事件转成下面这两次调用）；
 * 组件 emit 与端到端行为分别由 ui 单测和 mock E2E 覆盖。
 */
describe("业务查询页联动链路", () => {
  let engine: LinkageEngine;

  const LIST_ID = "list-1";
  const STAT_ID = "stat-1";
  const LINKAGE_ID = "linkage-filtered-count";

  /**
   * 每次返回全新对象：引擎的 setLinkageEnabled 会直接改写传入对象的 enabled 字段，
   * 复用同一个常量会让用例之间互相污染（改一条规则禁用会影响后续用例）。
   */
  const makeQueryLinkage = (): IComponentLinkage => ({
    id: LINKAGE_ID,
    sourceComponentId: LIST_ID,
    targetComponentId: STAT_ID,
    sourceProperty: "filteredCount",
    targetProperty: "value",
    enabled: true,
  });

  beforeEach(() => {
    engine = new LinkageEngine();
    engine.registerLinkage(makeQueryLinkage());
  });

  it("列表筛选数量会写入统计卡片的联动状态", () => {
    engine.triggerLinkage(LIST_ID, "filteredCount", 2);

    expect(engine.getComponentState(STAT_ID)).toMatchObject({ value: 2 });
  });

  it("连续筛选时统计状态跟随更新", () => {
    engine.triggerLinkage(LIST_ID, "filteredCount", 6);
    expect(engine.getComponentState(STAT_ID).value).toBe(6);

    engine.triggerLinkage(LIST_ID, "filteredCount", 1);
    expect(engine.getComponentState(STAT_ID).value).toBe(1);

    engine.triggerLinkage(LIST_ID, "filteredCount", 0);
    expect(engine.getComponentState(STAT_ID).value).toBe(0);
  });

  it("源组件的运行时状态也会被记录（keyword）", () => {
    engine.triggerLinkage(LIST_ID, "keyword", "服务");

    expect(engine.getComponentState(LIST_ID)).toMatchObject({ keyword: "服务" });
  });

  it("目标组件的订阅者能收到联动后的值", () => {
    const received: number[] = [];
    engine.subscribe(STAT_ID, (event) => received.push(event.value));

    engine.triggerLinkage(LIST_ID, "filteredCount", 3);

    expect(received).toEqual([3]);
  });

  it("规则被禁用后不再联动", () => {
    engine.setLinkageEnabled(LINKAGE_ID, false);
    engine.triggerLinkage(LIST_ID, "filteredCount", 5);

    expect(engine.getComponentState(STAT_ID).value).toBeUndefined();
  });

  it("未登记的来源属性不会影响统计卡片", () => {
    engine.triggerLinkage(LIST_ID, "pageSize", 20);

    expect(engine.getComponentState(STAT_ID).value).toBeUndefined();
  });

  it("转换函数可用于把数量换算成展示值", () => {
    const doubled = new LinkageEngine();
    doubled.registerLinkage({
      ...makeQueryLinkage(),
      id: "linkage-doubled",
      transformFn: (value: number) => value * 2,
    });

    doubled.triggerLinkage(LIST_ID, "filteredCount", 3);

    expect(doubled.getComponentState(STAT_ID).value).toBe(6);
  });
});

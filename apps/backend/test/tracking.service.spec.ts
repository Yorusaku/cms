import { TrackingService } from "../src/modules/tracking/tracking.service";

interface QueryCall {
  condition: string;
  params: Record<string, unknown>;
}

const createQueryBuilder = <T>(rows: T[]) => {
  const calls: QueryCall[] = [];
  const qb: Record<string, unknown> = {};
  Object.assign(qb, {
    calls,
    andWhere: jest.fn((condition: string, params?: Record<string, unknown>) => {
      calls.push({ condition, params: params ?? {} });
      return qb;
    }),
    getMany: jest.fn().mockResolvedValue(rows),
    orderBy: jest.fn(() => qb),
    where: jest.fn(() => qb),
  });
  return qb as typeof qb & { calls: QueryCall[] };
};

type EventRow = {
  eventType: string;
  source?: string;
  sessionId?: string | null;
  channel?: Record<string, string> | null;
  utm?: Record<string, string> | null;
  publishedVersionId?: string | null;
  createdAt: Date;
};

type LeadRow = {
  sessionId?: string | null;
  channel?: Record<string, string> | null;
  utm?: Record<string, string> | null;
  publishedVersionId?: string | null;
  createdAt: Date;
};

const makeEvent = (partial: Partial<EventRow> = {}): EventRow => ({
  eventType: "page_view",
  source: "crs",
  sessionId: "s-1",
  channel: null,
  utm: null,
  publishedVersionId: null,
  createdAt: new Date("2026-09-20T10:00:00.000Z"),
  ...partial,
});

const makeLead = (partial: Partial<LeadRow> = {}): LeadRow => ({
  sessionId: "s-1",
  channel: null,
  utm: null,
  publishedVersionId: null,
  createdAt: new Date("2026-09-20T11:00:00.000Z"),
  ...partial,
});

const createHarness = (events: EventRow[] = [], leads: LeadRow[] = []) => {
  const eventsQb = createQueryBuilder(events);
  const leadsQb = createQueryBuilder(leads);
  const service = new TrackingService(
    { createQueryBuilder: jest.fn().mockReturnValue(eventsQb) } as never,
    { createQueryBuilder: jest.fn().mockReturnValue(leadsQb) } as never,
    {} as never,
  );
  return { service, eventsQb, leadsQb };
};

describe("TrackingService.getPageFunnelSummary", () => {
  it("汇总漏斗指标、渠道分组与每日趋势（含独立访客去重）", async () => {
    const { service } = createHarness(
      [
        makeEvent({ eventType: "page_view", sessionId: "s-1", channel: { src: "wechat" } }),
        makeEvent({ eventType: "page_view", sessionId: "s-2", utm: { utm_source: "douyin" } }),
        makeEvent({ eventType: "cta_click", sessionId: "s-1", channel: { src: "wechat" } }),
        makeEvent({ eventType: "form_submit", sessionId: "s-1", channel: { src: "wechat" } }),
      ],
      [makeLead({ sessionId: "s-1", channel: { src: "wechat" } })],
    );

    const result = await service.getPageFunnelSummary({ pageId: 12 });

    expect(result.metrics).toEqual({
      pageViews: 2,
      uniqueVisitors: 2,
      ctaClicks: 1,
      formSubmits: 1,
      leads: 1,
      ctaClickRate: 0.5,
      leadConversionRate: 0.5,
    });
    expect(result.channels[0]).toEqual({
      channelKey: "channel.src",
      channelValue: "wechat",
      metrics: {
        pageViews: 1,
        uniqueVisitors: 1,
        ctaClicks: 1,
        formSubmits: 1,
        leads: 1,
        ctaClickRate: 1,
        leadConversionRate: 1,
      },
    });
    expect(result.dailyTrend).toHaveLength(1);
    expect(result.dailyTrend[0].metrics.pageViews).toBe(2);
  });

  it("支持按渠道值过滤漏斗数据", async () => {
    const { service } = createHarness(
      [
        makeEvent({ eventType: "page_view", channel: { src: "wechat" } }),
        makeEvent({ eventType: "page_view", utm: { utm_source: "douyin" }, sessionId: "s-2" }),
      ],
      [makeLead({ utm: { utm_source: "douyin" }, sessionId: "s-2" })],
    );

    const result = await service.getPageFunnelSummary({ pageId: 12, channel: "douyin" });

    expect(result.metrics.pageViews).toBe(1);
    expect(result.metrics.leads).toBe(1);
    expect(result.channels).toHaveLength(1);
    expect(result.channels[0].channelValue).toBe("douyin");
  });

  it("独立访客按 sessionId 去重，缺少 sessionId 的事件不计入", async () => {
    const { service } = createHarness([
      makeEvent({ sessionId: "s-1" }),
      makeEvent({ sessionId: "s-1" }),
      makeEvent({ sessionId: "s-2" }),
      makeEvent({ sessionId: null }),
    ]);

    const result = await service.getPageFunnelSummary({ pageId: 12 });

    expect(result.metrics.pageViews).toBe(4);
    expect(result.metrics.uniqueVisitors).toBe(2);
  });

  it("独立访客只由 page_view 决定：留资会话不计入，非访问事件也不计入", async () => {
    const { service } = createHarness(
      [
        makeEvent({ eventType: "page_view", sessionId: "s-visit" }),
        makeEvent({ eventType: "cta_click", sessionId: "s-click-only" }),
      ],
      [makeLead({ sessionId: "s-lead" })],
    );

    const result = await service.getPageFunnelSummary({ pageId: 12 });

    expect(result.metrics.pageViews).toBe(1);
    expect(result.metrics.uniqueVisitors).toBe(1);
    expect(result.metrics.leads).toBe(1);
    // 独立访客不会超过访问量
    expect(result.metrics.uniqueVisitors).toBeLessThanOrEqual(result.metrics.pageViews);
  });

  it("趋势按天分组并按日期倒序", async () => {
    const { service } = createHarness([
      makeEvent({ createdAt: new Date("2026-09-20T10:00:00.000Z"), sessionId: "s-1" }),
      makeEvent({ createdAt: new Date("2026-09-20T12:00:00.000Z"), sessionId: "s-1" }),
      makeEvent({ createdAt: new Date("2026-09-22T09:00:00.000Z"), sessionId: "s-2" }),
    ]);

    const result = await service.getPageFunnelSummary({ pageId: 12 });

    expect(result.dailyTrend.map((point) => point.date)).toEqual(["2026-09-22", "2026-09-20"]);
    const [latest, earlier] = result.dailyTrend;
    expect(latest.metrics.pageViews).toBe(1);
    expect(earlier.metrics.pageViews).toBe(2);
    expect(earlier.metrics.uniqueVisitors).toBe(1);
  });

  it("日期参数为纯日期时补齐整天边界，避免漏算结束日数据", async () => {
    const { service, eventsQb, leadsQb } = createHarness([], []);

    await service.getPageFunnelSummary({
      pageId: 12,
      startTime: "2026-09-01",
      endTime: "2026-09-30",
    });

    const startCall = eventsQb.calls.find((call) => call.condition.includes(">= :startDate"));
    const endCall = eventsQb.calls.find((call) => call.condition.includes("<= :endDate"));
    expect((startCall?.params.startDate as Date).getTime()).toBe(
      new Date("2026-09-01T00:00:00.000").getTime(),
    );
    expect((endCall?.params.endDate as Date).getTime()).toBe(
      new Date("2026-09-30T23:59:59.999").getTime(),
    );
    // 线索查询使用同一套边界
    expect(leadsQb.calls.some((call) => call.condition.includes("<= :endDate"))).toBe(true);
  });

  it("带时间的参数按原值解析，不做边界补齐", async () => {
    const { service, eventsQb } = createHarness([], []);

    await service.getPageFunnelSummary({
      pageId: 12,
      startTime: "2026-09-01T08:30:00.000Z",
      endTime: "2026-09-30T18:00:00.000Z",
    });

    const endCall = eventsQb.calls.find((call) => call.condition.includes("<= :endDate"));
    expect((endCall?.params.endDate as Date).toISOString()).toBe("2026-09-30T18:00:00.000Z");
  });

  it("默认只统计 crs 访客事件，可切换 cms / all 用于排查", async () => {
    const defaultHarness = createHarness([]);
    await defaultHarness.service.getPageFunnelSummary({ pageId: 12 });
    expect(
      defaultHarness.eventsQb.calls.some(
        (call) => call.condition.includes("event.source") && call.params.source === "crs",
      ),
    ).toBe(true);

    const cmsHarness = createHarness([]);
    await cmsHarness.service.getPageFunnelSummary({ pageId: 12, source: "cms" });
    expect(cmsHarness.eventsQb.calls.some((call) => call.params.source === "cms")).toBe(true);

    const allHarness = createHarness([]);
    await allHarness.service.getPageFunnelSummary({ pageId: 12, source: "all" });
    expect(allHarness.eventsQb.calls.some((call) => call.condition.includes("event.source"))).toBe(
      false,
    );
  });

  it("发布版本过滤同时作用于事件与线索", async () => {
    const { service, eventsQb, leadsQb } = createHarness([], []);

    await service.getPageFunnelSummary({ pageId: 12, publishedVersionId: "12-v1" });

    expect(
      eventsQb.calls.some(
        (call) =>
          call.condition.includes("event.published_version_id") &&
          call.params.publishedVersionId === "12-v1",
      ),
    ).toBe(true);
    expect(
      leadsQb.calls.some(
        (call) =>
          call.condition.includes("lead.published_version_id") &&
          call.params.publishedVersionId === "12-v1",
      ),
    ).toBe(true);
  });

  it("无数据时返回零值与空集合", async () => {
    const { service } = createHarness([], []);

    const result = await service.getPageFunnelSummary({ pageId: 99 });

    expect(result.metrics).toEqual({
      pageViews: 0,
      uniqueVisitors: 0,
      ctaClicks: 0,
      formSubmits: 0,
      leads: 0,
      ctaClickRate: 0,
      leadConversionRate: 0,
    });
    expect(result.channels).toEqual([]);
    expect(result.dailyTrend).toEqual([]);
  });
});

describe("TrackingService.exportPageFunnelCsv", () => {
  it("导出包含概览、渠道与趋势三类行", async () => {
    const { service } = createHarness(
      [makeEvent({ eventType: "page_view", channel: { src: "wechat" }, sessionId: "s-1" })],
      [makeLead({ channel: { src: "wechat" }, sessionId: "s-1" })],
    );

    const csv = await service.exportPageFunnelCsv({ pageId: 12 });
    const lines = csv.split("\r\n");

    expect(lines[0]).toContain('"维度"');
    expect(lines[0]).toContain('"独立访客"');
    expect(csv).toContain('"概览"');
    expect(csv).toContain('"渠道"');
    expect(csv).toContain('"趋势"');
  });
});

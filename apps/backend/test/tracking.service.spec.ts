import { TrackingService } from "../src/modules/tracking/tracking.service";

const createQueryBuilder = <T>(rows: T[]) => {
  const qb = {
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(rows),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };
  return qb;
};

describe("TrackingService", () => {
  it("按页面汇总基础漏斗指标和渠道分组", async () => {
    const eventsQb = createQueryBuilder([
      {
        eventType: "page_view",
        channel: { src: "wechat" },
        utm: null,
      },
      {
        eventType: "page_view",
        channel: null,
        utm: { utm_source: "douyin" },
      },
      {
        eventType: "cta_click",
        channel: { src: "wechat" },
        utm: null,
      },
      {
        eventType: "form_submit",
        channel: { src: "wechat" },
        utm: null,
      },
    ]);
    const leadsQb = createQueryBuilder([
      {
        channel: { src: "wechat" },
        utm: null,
      },
    ]);
    const trackingRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(eventsQb),
    };
    const leadRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(leadsQb),
    };
    const service = new TrackingService(trackingRepo as never, leadRepo as never);

    const result = await service.getPageFunnelSummary({ pageId: 12 });

    expect(result.metrics).toEqual({
      pageViews: 2,
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
        ctaClicks: 1,
        formSubmits: 1,
        leads: 1,
        ctaClickRate: 1,
        leadConversionRate: 1,
      },
    });
  });

  it("支持按渠道值过滤漏斗数据", async () => {
    const eventsQb = createQueryBuilder([
      {
        eventType: "page_view",
        channel: { src: "wechat" },
        utm: null,
      },
      {
        eventType: "page_view",
        channel: null,
        utm: { utm_source: "douyin" },
      },
    ]);
    const leadsQb = createQueryBuilder([
      {
        channel: null,
        utm: { utm_source: "douyin" },
      },
    ]);
    const service = new TrackingService(
      { createQueryBuilder: jest.fn().mockReturnValue(eventsQb) } as never,
      { createQueryBuilder: jest.fn().mockReturnValue(leadsQb) } as never,
    );

    const result = await service.getPageFunnelSummary({
      pageId: 12,
      channel: "douyin",
    });

    expect(result.metrics.pageViews).toBe(1);
    expect(result.metrics.leads).toBe(1);
    expect(result.channels).toHaveLength(1);
    expect(result.channels[0].channelValue).toBe("douyin");
  });
});

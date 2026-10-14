import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import type { FunnelMetrics, PageFunnelSummary } from "@cms/types";
import { Lead } from "../lead/entities/lead.entity";
import { PublishLog } from "../page/entities/publish-log.entity";
import { TrackingEvent } from "./entities/tracking-event.entity";
import { CreateTrackingEventDto } from "./dto/create-tracking-event.dto";
import { GetTrackingEventsDto } from "./dto/get-tracking-events.dto";
import { GetPageFunnelSummaryDto } from "./dto/get-page-funnel-summary.dto";

/** 分组桶：渠道维度和日期维度共用，sessions 用于计算独立访客 */
interface FunnelBucket {
  channelKey: string;
  channelValue: string;
  metrics: FunnelMetrics;
  sessions: Set<string>;
}

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingEvent)
    private readonly trackingRepo: Repository<TrackingEvent>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(PublishLog)
    private readonly publishLogRepo: Repository<PublishLog>,
  ) {}

  async createEvent(dto: CreateTrackingEventDto): Promise<{ id: number }> {
    if (dto.publishedVersionId) {
      const version = await this.publishLogRepo.findOne({
        where: { versionId: dto.publishedVersionId, ...(dto.pageId ? { pageId: dto.pageId } : {}) },
      });
      if (!version) throw new ConflictException("页面发布版本无效");
    }
    const entity = this.trackingRepo.create({
      eventType: dto.eventType,
      source: dto.source ?? "crs",
      pageId: dto.pageId ?? null,
      publishedVersionId: dto.publishedVersionId ?? null,
      componentId: dto.componentId ?? null,
      componentType: dto.componentType ?? null,
      ctaText: dto.ctaText ?? null,
      payload: dto.payload ?? null,
      utm: dto.utm ?? null,
      channel: dto.channel ?? null,
      sessionId: dto.sessionId ?? null,
    });

    const saved = await this.trackingRepo.save(entity);
    return { id: saved.id };
  }

  async getEvents(dto: GetTrackingEventsDto): Promise<TrackingEvent[]> {
    const qb = this.trackingRepo
      .createQueryBuilder("event")
      .orderBy("event.created_at", "DESC")
      .limit(dto.limit ?? 100);

    if (dto.pageId) {
      qb.andWhere("event.page_id = :pageId", { pageId: dto.pageId });
    }
    if (dto.eventType) {
      qb.andWhere("event.event_type = :eventType", { eventType: dto.eventType });
    }

    return qb.getMany();
  }

  async getPageFunnelSummary(
    dto: GetPageFunnelSummaryDto,
  ): Promise<PageFunnelSummary> {
    const source = dto.source ?? "crs";
    const eventsQb = this.trackingRepo
      .createQueryBuilder("event")
      .where("event.page_id = :pageId", { pageId: dto.pageId })
      .orderBy("event.created_at", "DESC");
    this.applyDateRange(eventsQb, "event", dto);
    if (source !== "all") {
      eventsQb.andWhere("event.source = :source", { source });
    }

    const leadsQb = this.leadRepo
      .createQueryBuilder("lead")
      .where("lead.page_id = :pageId", { pageId: dto.pageId })
      .orderBy("lead.created_at", "DESC");
    this.applyDateRange(leadsQb, "lead", dto);
    if (dto.publishedVersionId) {
      eventsQb.andWhere("event.published_version_id = :publishedVersionId", { publishedVersionId: dto.publishedVersionId });
      leadsQb.andWhere("lead.published_version_id = :publishedVersionId", { publishedVersionId: dto.publishedVersionId });
    }

    const [events, leads] = await Promise.all([
      eventsQb.getMany(),
      leadsQb.getMany(),
    ]);

    const metrics = this.createEmptyMetrics();
    const overallSessions = new Set<string>();
    const channelBuckets = new Map<string, FunnelBucket>();
    const dayBuckets = new Map<string, FunnelBucket>();

    events.forEach((event) => {
      if (!this.matchesChannelFilter(event.channel, event.utm, dto.channel)) {
        return;
      }
      this.applyEventMetric(metrics, event.eventType);
      this.collectSession(overallSessions, event.sessionId, event.eventType);

      const bucket = this.getChannelBucket(channelBuckets, event.channel, event.utm);
      this.applyEventMetric(bucket.metrics, event.eventType);
      this.collectSession(bucket.sessions, event.sessionId, event.eventType);

      const dayBucket = this.getDayBucket(dayBuckets, event.createdAt);
      this.applyEventMetric(dayBucket.metrics, event.eventType);
      this.collectSession(dayBucket.sessions, event.sessionId, event.eventType);
    });

    leads.forEach((lead) => {
      if (!this.matchesChannelFilter(lead.channel, lead.utm, dto.channel)) {
        return;
      }
      // 线索只计入 leads，不参与独立访客口径（留资会话可能来自另一个 session）
      metrics.leads += 1;
      const bucket = this.getChannelBucket(channelBuckets, lead.channel, lead.utm);
      bucket.metrics.leads += 1;
      const dayBucket = this.getDayBucket(dayBuckets, lead.createdAt);
      dayBucket.metrics.leads += 1;
    });

    this.finalizeRates(metrics, overallSessions);
    const channels = Array.from(channelBuckets.values())
      .map((bucket) => {
        this.finalizeRates(bucket.metrics, bucket.sessions);
        return { channelKey: bucket.channelKey, channelValue: bucket.channelValue, metrics: bucket.metrics };
      })
      .sort(
        (left, right) =>
          right.metrics.leads - left.metrics.leads ||
          right.metrics.pageViews - left.metrics.pageViews,
      )
      .slice(0, 20);

    const dailyTrend = Array.from(dayBuckets.entries())
      .map(([date, bucket]) => {
        this.finalizeRates(bucket.metrics, bucket.sessions);
        return { date, metrics: bucket.metrics };
      })
      .sort((left, right) => right.date.localeCompare(left.date));

    return {
      pageId: dto.pageId,
      metrics,
      channels,
      dailyTrend,
    };
  }

  /** 看板数据导出：概览 + 渠道 + 按天趋势，供运营离线复盘 */
  async exportPageFunnelCsv(dto: GetPageFunnelSummaryDto): Promise<string> {
    const summary = await this.getPageFunnelSummary(dto);
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const metricsColumns = (metrics: FunnelMetrics) => [
      metrics.pageViews,
      metrics.uniqueVisitors,
      metrics.ctaClicks,
      metrics.formSubmits,
      metrics.leads,
      metrics.ctaClickRate,
      metrics.leadConversionRate,
    ];

    const header = ["维度", "渠道字段", "渠道值", "日期", "访问量", "独立访客", "CTA 点击", "表单提交", "线索", "CTA 点击率", "线索转化率"];
    const rows: unknown[][] = [
      ["概览", "", "", "", ...metricsColumns(summary.metrics)],
      ...summary.channels.map((channel) => [
        "渠道",
        channel.channelKey,
        channel.channelValue,
        "",
        ...metricsColumns(channel.metrics),
      ]),
      ...summary.dailyTrend.map((point) => [
        "趋势",
        "",
        "",
        point.date,
        ...metricsColumns(point.metrics),
      ]),
    ];

    return [header.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\r\n");
  }

  private applyDateRange<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    dto: GetPageFunnelSummaryDto,
  ) {
    const startDate = this.parseDate(dto.startTime, "start");
    const endDate = this.parseDate(dto.endTime, "end");

    if (startDate) {
      qb.andWhere(`${alias}.created_at >= :startDate`, { startDate });
    }
    if (endDate) {
      qb.andWhere(`${alias}.created_at <= :endDate`, { endDate });
    }
  }

  /**
   * 解析时间参数。
   * 纯日期（YYYY-MM-DD）需要补齐边界：开始日补 00:00:00.000，结束日补 23:59:59.999，
   * 否则 `<= 2026-09-30` 实际只到当天零点，会漏算结束日当天的全部数据。
   */
  private parseDate(value: string | undefined, boundary: "start" | "end"): Date | null {
    if (!value) {
      return null;
    }

    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
    if (isDateOnly) {
      const suffix = boundary === "start" ? "T00:00:00.000" : "T23:59:59.999";
      const timestamp = Date.parse(`${value.trim()}${suffix}`);
      return Number.isFinite(timestamp) ? new Date(timestamp) : null;
    }

    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp) : null;
  }

  private createEmptyMetrics(): FunnelMetrics {
    return {
      pageViews: 0,
      uniqueVisitors: 0,
      ctaClicks: 0,
      formSubmits: 0,
      leads: 0,
      ctaClickRate: 0,
      leadConversionRate: 0,
    };
  }

  /**
   * 独立访客口径：只统计 `page_view` 事件的 sessionId。
   * 线索的会话可能来自另一次访问（例如短信回流），计入会让独立访客大于访问量，
   * 因此 leads 只影响线索数，不影响访客去重。
   */
  private collectSession(
    sessions: Set<string>,
    sessionId: string | null,
    eventType: string,
  ) {
    if (eventType === "page_view" && sessionId) {
      sessions.add(sessionId);
    }
  }

  /** 按天分桶的 key（服务器本地时区 YYYY-MM-DD） */
  private toDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private getDayBucket(buckets: Map<string, FunnelBucket>, createdAt: Date): FunnelBucket {
    const key = this.toDayKey(createdAt);
    const existing = buckets.get(key);
    if (existing) {
      return existing;
    }
    const bucket: FunnelBucket = {
      channelKey: "",
      channelValue: "",
      metrics: this.createEmptyMetrics(),
      sessions: new Set<string>(),
    };
    buckets.set(key, bucket);
    return bucket;
  }

  private applyEventMetric(metrics: FunnelMetrics, eventType: string) {
    if (eventType === "page_view") {
      metrics.pageViews += 1;
    }
    if (eventType === "cta_click") {
      metrics.ctaClicks += 1;
    }
    if (eventType === "form_submit") {
      metrics.formSubmits += 1;
    }
  }

  private finalizeRates(metrics: FunnelMetrics, sessions: Set<string>) {
    metrics.uniqueVisitors = sessions.size;
    metrics.ctaClickRate =
      metrics.pageViews > 0 ? this.roundRate(metrics.ctaClicks / metrics.pageViews) : 0;
    metrics.leadConversionRate =
      metrics.pageViews > 0 ? this.roundRate(metrics.leads / metrics.pageViews) : 0;
  }

  private roundRate(value: number): number {
    return Math.round(value * 10000) / 10000;
  }

  private getChannelBucket(
    buckets: Map<string, FunnelBucket>,
    channel: Record<string, string> | null,
    utm: Record<string, string> | null,
  ): FunnelBucket {
    const source = this.resolveChannelSource(channel, utm);
    const bucketKey = `${source.channelKey}:${source.channelValue}`;
    const existingBucket = buckets.get(bucketKey);
    if (existingBucket) {
      return existingBucket;
    }

    const bucket: FunnelBucket = {
      channelKey: source.channelKey,
      channelValue: source.channelValue,
      metrics: this.createEmptyMetrics(),
      sessions: new Set<string>(),
    };
    buckets.set(bucketKey, bucket);
    return bucket;
  }

  private matchesChannelFilter(
    channel: Record<string, string> | null,
    utm: Record<string, string> | null,
    filter?: string,
  ): boolean {
    if (!filter) {
      return true;
    }
    const source = this.resolveChannelSource(channel, utm);
    return source.channelValue === filter || `${source.channelKey}:${source.channelValue}` === filter;
  }

  private resolveChannelSource(
    channel: Record<string, string> | null,
    utm: Record<string, string> | null,
  ): { channelKey: string; channelValue: string } {
    const channelEntry = this.firstRecordEntry(channel);
    if (channelEntry) {
      return {
        channelKey: `channel.${channelEntry[0]}`,
        channelValue: channelEntry[1],
      };
    }

    if (utm?.utm_source) {
      return {
        channelKey: "utm.utm_source",
        channelValue: utm.utm_source,
      };
    }

    const utmEntry = this.firstRecordEntry(utm);
    if (utmEntry) {
      return {
        channelKey: `utm.${utmEntry[0]}`,
        channelValue: utmEntry[1],
      };
    }

    return {
      channelKey: "direct",
      channelValue: "直接访问",
    };
  }

  private firstRecordEntry(
    record: Record<string, string> | null,
  ): [string, string] | null {
    if (!record) {
      return null;
    }
    const entry = Object.entries(record).find(([, value]) => Boolean(value));
    return entry ?? null;
  }
}

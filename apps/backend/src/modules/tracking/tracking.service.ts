import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import type { FunnelMetrics, PageFunnelSummary } from "@cms/types";
import { Lead } from "../lead/entities/lead.entity";
import { TrackingEvent } from "./entities/tracking-event.entity";
import { CreateTrackingEventDto } from "./dto/create-tracking-event.dto";
import { GetTrackingEventsDto } from "./dto/get-tracking-events.dto";
import { GetPageFunnelSummaryDto } from "./dto/get-page-funnel-summary.dto";

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingEvent)
    private readonly trackingRepo: Repository<TrackingEvent>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  async createEvent(dto: CreateTrackingEventDto): Promise<{ id: number }> {
    const entity = this.trackingRepo.create({
      eventType: dto.eventType,
      pageId: dto.pageId ?? null,
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
    const eventsQb = this.trackingRepo
      .createQueryBuilder("event")
      .where("event.page_id = :pageId", { pageId: dto.pageId })
      .orderBy("event.created_at", "DESC");
    this.applyDateRange(eventsQb, "event", dto);

    const leadsQb = this.leadRepo
      .createQueryBuilder("lead")
      .where("lead.page_id = :pageId", { pageId: dto.pageId })
      .orderBy("lead.created_at", "DESC");
    this.applyDateRange(leadsQb, "lead", dto);

    const [events, leads] = await Promise.all([
      eventsQb.getMany(),
      leadsQb.getMany(),
    ]);

    const metrics = this.createEmptyMetrics();
    const channelBuckets = new Map<
      string,
      { channelKey: string; channelValue: string; metrics: FunnelMetrics }
    >();

    events.forEach((event) => {
      if (!this.matchesChannelFilter(event.channel, event.utm, dto.channel)) {
        return;
      }
      this.applyEventMetric(metrics, event.eventType);
      const bucket = this.getChannelBucket(
        channelBuckets,
        event.channel,
        event.utm,
      );
      this.applyEventMetric(bucket.metrics, event.eventType);
    });

    leads.forEach((lead) => {
      if (!this.matchesChannelFilter(lead.channel, lead.utm, dto.channel)) {
        return;
      }
      metrics.leads += 1;
      const bucket = this.getChannelBucket(
        channelBuckets,
        lead.channel,
        lead.utm,
      );
      bucket.metrics.leads += 1;
    });

    this.finalizeRates(metrics);
    const channels = Array.from(channelBuckets.values())
      .map((bucket) => {
        this.finalizeRates(bucket.metrics);
        return bucket;
      })
      .sort(
        (left, right) =>
          right.metrics.leads - left.metrics.leads ||
          right.metrics.pageViews - left.metrics.pageViews,
      )
      .slice(0, 20);

    return {
      pageId: dto.pageId,
      metrics,
      channels,
    };
  }

  private applyDateRange<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    dto: GetPageFunnelSummaryDto,
  ) {
    const startDate = this.parseDate(dto.startTime);
    const endDate = this.parseDate(dto.endTime);

    if (startDate) {
      qb.andWhere(`${alias}.created_at >= :startDate`, { startDate });
    }
    if (endDate) {
      qb.andWhere(`${alias}.created_at <= :endDate`, { endDate });
    }
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp) : null;
  }

  private createEmptyMetrics(): FunnelMetrics {
    return {
      pageViews: 0,
      ctaClicks: 0,
      formSubmits: 0,
      leads: 0,
      ctaClickRate: 0,
      leadConversionRate: 0,
    };
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

  private finalizeRates(metrics: FunnelMetrics) {
    metrics.ctaClickRate =
      metrics.pageViews > 0 ? this.roundRate(metrics.ctaClicks / metrics.pageViews) : 0;
    metrics.leadConversionRate =
      metrics.pageViews > 0 ? this.roundRate(metrics.leads / metrics.pageViews) : 0;
  }

  private roundRate(value: number): number {
    return Math.round(value * 10000) / 10000;
  }

  private getChannelBucket(
    buckets: Map<
      string,
      { channelKey: string; channelValue: string; metrics: FunnelMetrics }
    >,
    channel: Record<string, string> | null,
    utm: Record<string, string> | null,
  ) {
    const source = this.resolveChannelSource(channel, utm);
    const bucketKey = `${source.channelKey}:${source.channelValue}`;
    const existingBucket = buckets.get(bucketKey);
    if (existingBucket) {
      return existingBucket;
    }

    const bucket = {
      channelKey: source.channelKey,
      channelValue: source.channelValue,
      metrics: this.createEmptyMetrics(),
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

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TrackingEvent } from "./entities/tracking-event.entity";
import { CreateTrackingEventDto } from "./dto/create-tracking-event.dto";
import { GetTrackingEventsDto } from "./dto/get-tracking-events.dto";

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingEvent)
    private readonly trackingRepo: Repository<TrackingEvent>,
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
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("tracking_events")
export class TrackingEvent {
  @PrimaryGeneratedColumn("increment", { type: "integer" })
  id: number;

  @Column({ type: "varchar", length: 50, name: "event_type" })
  eventType: string;

  @Column({ type: "integer", name: "page_id", nullable: true })
  pageId: number | null;

  @Column({ type: "varchar", length: 120, name: "component_id", nullable: true })
  componentId: string | null;

  @Column({ type: "varchar", length: 80, name: "component_type", nullable: true })
  componentType: string | null;

  @Column({ type: "varchar", length: 120, name: "cta_text", nullable: true })
  ctaText: string | null;

  @Column({ type: "jsonb", nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true })
  utm: Record<string, string> | null;

  @Column({ type: "jsonb", nullable: true })
  channel: Record<string, string> | null;

  @Column({ type: "varchar", length: 120, name: "session_id", nullable: true })
  sessionId: string | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}

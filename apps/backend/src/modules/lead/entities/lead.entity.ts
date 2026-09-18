import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type LeadStatus = "new" | "contacted" | "converted" | "invalid";

@Entity("leads")
export class Lead {
  @PrimaryGeneratedColumn("increment", { type: "integer" })
  id: number;

  @Column({ type: "uuid", unique: true, name: "request_id" })
  requestId: string;

  @Column({ type: "varchar", length: 60 })
  name: string;

  @Column({ type: "varchar", length: 20, name: "phone_number" })
  phoneNumber: string;

  @Column({ type: "text", nullable: true })
  remark: string | null;

  @Column({ type: "integer", name: "page_id" })
  pageId: number;

  @Column({ type: "varchar", length: 60, name: "published_version_id" })
  publishedVersionId: string;

  @Column({ type: "varchar", length: 120, name: "session_id" })
  sessionId: string;

  @Column({ type: "varchar", length: 20, default: "new" })
  status: LeadStatus;

  @Column({ type: "text", nullable: true, name: "follow_up_remark" })
  followUpRemark: string | null;

  @Column({ type: "varchar", length: 50, nullable: true, name: "followed_by" })
  followedBy: string | null;

  @Column({ type: "timestamptz", nullable: true, name: "followed_at" })
  followedAt: Date | null;

  @Column({ type: "jsonb", nullable: true })
  utm: Record<string, string> | null;

  @Column({ type: "jsonb", nullable: true })
  channel: Record<string, string> | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}

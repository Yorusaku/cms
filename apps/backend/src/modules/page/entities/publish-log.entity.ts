import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { IPageSchemaV2 } from "@cms/types";
import { Page } from "./page.entity";

@Entity("publish_logs")
export class PublishLog {
  @PrimaryColumn({ type: "varchar", length: 60, name: "version_id" })
  versionId: string;

  @Column({ type: "integer", name: "page_id" })
  pageId: number;

  @Column({ type: "varchar", length: 50, name: "display_version" })
  displayVersion: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  operator: string;

  @Column({ type: "text", nullable: true })
  note: string;

  @Column({ type: "jsonb", name: "schema_snapshot" })
  schemaSnapshot: IPageSchemaV2;

  @CreateDateColumn({ name: "published_at", type: "timestamptz" })
  publishedAt: Date;

  @ManyToOne(() => Page)
  @JoinColumn({ name: "page_id" })
  page: Page;
}

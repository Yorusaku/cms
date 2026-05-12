import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";
import type { IPageSchemaV2 } from "@cms/types";

export type TemplateCategory = 'marketing' | 'ecommerce' | 'brand' | 'general';

@Entity("templates")
export class Template {
  @PrimaryGeneratedColumn("increment", { type: "integer" })
  id: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  thumbnail: string | null;

  @Column({ type: "varchar", length: 50 })
  category: TemplateCategory;

  @Column({ type: "jsonb" })
  schema: IPageSchemaV2;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "integer", name: "use_count", default: 0 })
  useCount: number;

  @Column({ type: "boolean", name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "create_time", type: "timestamptz" })
  createTime: Date;
}

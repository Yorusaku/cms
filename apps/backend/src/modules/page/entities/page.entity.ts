import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import type { IPageSchemaV2, IComponentSchemaV1 } from "@cms/types";

@Entity("pages")
export class Page {
  @PrimaryGeneratedColumn("increment", { type: "integer" })
  id: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "jsonb", nullable: true })
  schema: IPageSchemaV2;

  @Column({ type: "jsonb", nullable: true, name: "component_list" })
  componentList: IComponentSchemaV1[];

  @Column({ type: "text", nullable: true, name: "share_desc" })
  shareDesc: string;

  @Column({ type: "text", nullable: true, name: "share_image" })
  shareImage: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
    name: "background_color",
  })
  backgroundColor: string;

  @Column({ type: "text", nullable: true, name: "background_image" })
  backgroundImage: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
    name: "background_position",
    default: "top",
  })
  backgroundPosition: string;

  @Column({ type: "text", nullable: true })
  cover: string;

  @Column({ type: "smallint", name: "is_abled", default: 0 })
  isAbled: number;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status: string;

  @Column({ type: "boolean", name: "is_deleted", default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: "create_time", type: "timestamptz" })
  createTime: Date;

  @UpdateDateColumn({ name: "update_time", type: "timestamptz" })
  updateTime: Date;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("leads")
export class Lead {
  @PrimaryGeneratedColumn("increment", { type: "integer" })
  id: number;

  @Column({ type: "varchar", length: 60 })
  name: string;

  @Column({ type: "varchar", length: 20, name: "phone_number" })
  phoneNumber: string;

  @Column({ type: "text", nullable: true })
  remark: string | null;

  @Column({ type: "integer", name: "page_id", nullable: true })
  pageId: number | null;

  @Column({ type: "jsonb", nullable: true })
  utm: Record<string, string> | null;

  @Column({ type: "jsonb", nullable: true })
  channel: Record<string, string> | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}

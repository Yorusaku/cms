import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("increment", { type: "integer" })
  id: number;
  @Column({ type: "uuid", nullable: true, name: "actor_user_id" }) actorUserId: string | null;
  @Column({ type: "varchar", length: 80, name: "actor_username" }) actorUsername: string;
  @Column({ type: "varchar", length: 80 }) action: string;
  @Column({ type: "varchar", length: 80, name: "resource_type" }) resourceType: string;
  @Column({ type: "varchar", length: 120, name: "resource_id" }) resourceId: string;
  @Column({ type: "jsonb", nullable: true }) metadata: Record<string, unknown> | null;
  @CreateDateColumn({ type: "timestamptz", name: "created_at" }) createdAt: Date;
}

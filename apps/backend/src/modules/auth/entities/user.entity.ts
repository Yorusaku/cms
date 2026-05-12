import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type UserRole = 'admin' | 'editor' | 'viewer';

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  username: string;

  @Column({ type: "varchar", length: 255 })
  password: string;

  @Column({ type: "varchar", length: 20, default: 'editor' })
  role: UserRole;

  @Column({ type: "varchar", length: 50, nullable: true })
  nickname: string | null;

  @CreateDateColumn({ name: "create_time", type: "timestamptz" })
  createTime: Date;

  @UpdateDateColumn({ name: "update_time", type: "timestamptz" })
  updateTime: Date;
}

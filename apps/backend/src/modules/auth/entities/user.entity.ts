import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  username: string;

  @Column({ type: "varchar", length: 255 })
  password: string;

  @CreateDateColumn({ name: "create_time", type: "timestamptz" })
  createTime: Date;

  @UpdateDateColumn({ name: "update_time", type: "timestamptz" })
  updateTime: Date;
}

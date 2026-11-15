import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

/**
 * 独立业务场景。
 *
 * 只组织记录与页面，不重复保存表单字段与异常类型；
 * 收集配置由页面物料维护，历史展示用记录字段快照。
 */
@Entity('business_scenarios')
export class BusinessScenario {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 80 })
  name: string

  @Column({ type: 'varchar', length: 300, default: '' })
  description: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date
}

import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 轻量站内提醒。
 *
 * - 提醒与业务状态、历史事件同事务写入，不回填历史；
 * - 「来源事件 ID + 接收用户」唯一约束防重复提醒；
 * - 已读与业务完成相互独立，点击消息不完成待办。
 */
export class CreateNotification1790000008000 implements MigrationInterface {
  name = 'CreateNotification1790000008000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL PRIMARY KEY,
        "recipient_user_id" uuid NOT NULL
          REFERENCES "users" ("id") ON DELETE CASCADE,
        "source_event_id" integer NOT NULL
          REFERENCES "ticket_exception_events" ("id") ON DELETE CASCADE,
        "exception_id" integer NOT NULL,
        "type" varchar(40) NOT NULL,
        "scenario_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "read_at" timestamptz
      )
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_notifications_event_recipient"
        ON "notifications" ("source_event_id", "recipient_user_id")
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_recipient"
        ON "notifications" ("recipient_user_id", "created_at" DESC)
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_recipient"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_notifications_event_recipient"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`)
  }
}

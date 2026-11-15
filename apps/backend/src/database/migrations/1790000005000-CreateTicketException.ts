import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 票据异常：主记录 + 处理历史。
 *
 * 只新增本业务的两张表，不改线索表与既有页面数据，
 * 便于单独回退（down 只删这两张表）。
 */
export class CreateTicketException1790000005000 implements MigrationInterface {
  name = 'CreateTicketException1790000005000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ticket_exceptions" (
        "id" SERIAL PRIMARY KEY,
        "request_id" uuid NOT NULL,
        "ticket_no" varchar(120) NOT NULL,
        "business_category" varchar(80) NOT NULL,
        "exception_type" varchar(80) NOT NULL,
        "description" text NOT NULL,
        "extra_fields" jsonb,
        "field_snapshot" jsonb NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'pending',
        "submitter_user_id" uuid,
        "submitter_username" varchar(80) NOT NULL,
        "page_id" integer NOT NULL,
        "component_id" varchar(120) NOT NULL,
        "published_version_id" varchar(60) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_ticket_exceptions_request_submitter"
        ON "ticket_exceptions" ("request_id", "submitter_username")
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_ticket_exceptions_ticket_no"
        ON "ticket_exceptions" ("ticket_no")
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_ticket_exceptions_status"
        ON "ticket_exceptions" ("status")
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_ticket_exceptions_submitter"
        ON "ticket_exceptions" ("submitter_username")
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_ticket_exceptions_created_at"
        ON "ticket_exceptions" ("created_at" DESC)
    `)

    await queryRunner.query(`
      CREATE TABLE "ticket_exception_events" (
        "id" SERIAL PRIMARY KEY,
        "exception_id" integer NOT NULL
          REFERENCES "ticket_exceptions" ("id") ON DELETE CASCADE,
        "action" varchar(40) NOT NULL,
        "operator_user_id" uuid,
        "operator_username" varchar(80) NOT NULL,
        "note" text,
        "payload" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE INDEX "idx_ticket_exception_events_exception"
        ON "ticket_exception_events" ("exception_id", "created_at")
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_exception_events"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_exceptions"`)
  }
}

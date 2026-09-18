import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialResumeDatabase1790000000000 implements MigrationInterface {
  name = "InitialResumeDatabase1790000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "username" varchar(50) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "role" varchar(20) NOT NULL DEFAULT 'editor',
        "nickname" varchar(50),
        "create_time" timestamptz NOT NULL DEFAULT now(),
        "update_time" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "pages" (
        "id" serial PRIMARY KEY,
        "name" varchar(200) NOT NULL,
        "schema" jsonb,
        "published_schema" jsonb,
        "published_version_id" varchar(60),
        "published_at" timestamptz,
        "component_list" jsonb,
        "share_desc" text,
        "share_image" text,
        "background_color" varchar(20),
        "background_image" text,
        "background_position" varchar(20) DEFAULT 'top',
        "cover" text,
        "is_abled" smallint NOT NULL DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "is_deleted" boolean NOT NULL DEFAULT false,
        "create_time" timestamptz NOT NULL DEFAULT now(),
        "update_time" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_pages_status" CHECK ("status" IN ('draft', 'published', 'offline')),
        CONSTRAINT "CHK_pages_is_abled" CHECK ("is_abled" IN (0, 1))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "publish_logs" (
        "version_id" varchar(60) PRIMARY KEY,
        "page_id" integer NOT NULL,
        "display_version" varchar(50) NOT NULL,
        "version_no" integer NOT NULL,
        "action" varchar(20) NOT NULL DEFAULT 'publish',
        "operator_user_id" uuid,
        "operator" varchar(100),
        "note" text,
        "source_version_id" varchar(60),
        "schema_snapshot" jsonb NOT NULL,
        "published_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_publish_logs_page_version" UNIQUE ("page_id", "version_no"),
        CONSTRAINT "CHK_publish_logs_action" CHECK ("action" IN ('publish', 'rollback')),
        CONSTRAINT "FK_publish_logs_page" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_publish_logs_operator" FOREIGN KEY ("operator_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_publish_logs_source" FOREIGN KEY ("source_version_id") REFERENCES "publish_logs"("version_id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "templates" (
        "id" serial PRIMARY KEY,
        "name" varchar(200) NOT NULL,
        "thumbnail" varchar(500),
        "category" varchar(50) NOT NULL,
        "schema" jsonb NOT NULL,
        "description" text,
        "use_count" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "create_time" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" serial PRIMARY KEY,
        "request_id" uuid NOT NULL UNIQUE,
        "name" varchar(60) NOT NULL,
        "phone_number" varchar(20) NOT NULL,
        "remark" text,
        "page_id" integer NOT NULL,
        "published_version_id" varchar(60) NOT NULL,
        "session_id" varchar(120) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'new',
        "follow_up_remark" text,
        "followed_by" varchar(50),
        "followed_at" timestamptz,
        "utm" jsonb,
        "channel" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_leads_status" CHECK ("status" IN ('new', 'contacted', 'converted', 'invalid')),
        CONSTRAINT "FK_leads_page" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_leads_version" FOREIGN KEY ("published_version_id") REFERENCES "publish_logs"("version_id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "tracking_events" (
        "id" serial PRIMARY KEY,
        "event_type" varchar(50) NOT NULL,
        "page_id" integer,
        "published_version_id" varchar(60),
        "component_id" varchar(120),
        "component_type" varchar(80),
        "cta_text" varchar(120),
        "payload" jsonb,
        "utm" jsonb,
        "channel" jsonb,
        "session_id" varchar(120),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tracking_events_page" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tracking_events_version" FOREIGN KEY ("published_version_id") REFERENCES "publish_logs"("version_id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_pages_list" ON "pages" ("is_deleted", "is_abled", "update_time" DESC)');
    await queryRunner.query('CREATE INDEX "IDX_publish_logs_page_time" ON "publish_logs" ("page_id", "published_at" DESC)');
    await queryRunner.query('CREATE INDEX "IDX_leads_page_status_time" ON "leads" ("page_id", "status", "created_at" DESC)');
    await queryRunner.query('CREATE INDEX "IDX_leads_version_time" ON "leads" ("published_version_id", "created_at" DESC)');
    await queryRunner.query('CREATE INDEX "IDX_tracking_page_version_type_time" ON "tracking_events" ("page_id", "published_version_id", "event_type", "created_at" DESC)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "tracking_events"');
    await queryRunner.query('DROP TABLE "leads"');
    await queryRunner.query('DROP TABLE "templates"');
    await queryRunner.query('DROP TABLE "publish_logs"');
    await queryRunner.query('DROP TABLE "pages"');
    await queryRunner.query('DROP TABLE "users"');
  }
}

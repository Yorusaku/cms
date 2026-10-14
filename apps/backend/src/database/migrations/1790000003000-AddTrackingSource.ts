import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrackingSource1790000003000 implements MigrationInterface {
  name = "AddTrackingSource1790000003000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tracking_events" ADD COLUMN "source" varchar(10) NOT NULL DEFAULT 'crs'`);
    await queryRunner.query(`ALTER TABLE "tracking_events" ADD CONSTRAINT "CHK_tracking_events_source" CHECK ("source" IN ('crs', 'cms'))`);
    await queryRunner.query(`CREATE INDEX "IDX_tracking_page_source_time" ON "tracking_events" ("page_id", "source", "created_at" DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tracking_page_source_time"`);
    await queryRunner.query(`ALTER TABLE "tracking_events" DROP CONSTRAINT IF EXISTS "CHK_tracking_events_source"`);
    await queryRunner.query(`ALTER TABLE "tracking_events" DROP COLUMN "source"`);
  }
}

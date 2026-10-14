import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPageReviewWorkflow1790000001000 implements MigrationInterface {
  name = "AddPageReviewWorkflow1790000001000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pages"
        ADD COLUMN "review_note" text,
        ADD COLUMN "submitted_by" uuid,
        ADD COLUMN "reviewed_by" uuid,
        ADD COLUMN "reviewed_at" timestamptz
    `);
    await queryRunner.query(`ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "CHK_pages_status"`);
    await queryRunner.query(`
      ALTER TABLE "pages" ADD CONSTRAINT "CHK_pages_status"
      CHECK ("status" IN ('draft', 'pending_review', 'rejected', 'approved', 'published', 'offline'))
    `);
    await queryRunner.query(`ALTER TABLE "pages" ADD CONSTRAINT "FK_pages_submitted_by" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "pages" ADD CONSTRAINT "FK_pages_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_pages_review_status" ON "pages" ("status", "update_time" DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pages_review_status"`);
    await queryRunner.query(`ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "FK_pages_reviewed_by"`);
    await queryRunner.query(`ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "FK_pages_submitted_by"`);
    await queryRunner.query(`ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "CHK_pages_status"`);
    await queryRunner.query(`ALTER TABLE "pages" ADD CONSTRAINT "CHK_pages_status" CHECK ("status" IN ('draft', 'published', 'offline'))`);
    await queryRunner.query(`ALTER TABLE "pages" DROP COLUMN "reviewed_at", DROP COLUMN "reviewed_by", DROP COLUMN "submitted_by", DROP COLUMN "review_note"`);
  }
}

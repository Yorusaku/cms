import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublishLogActors1790000004000 implements MigrationInterface {
  name = "AddPublishLogActors1790000004000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "publish_logs"
        ADD COLUMN "reviewer_name" varchar(100),
        ADD COLUMN "publisher_name" varchar(100),
        ADD COLUMN "rollbacker_name" varchar(100)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "publish_logs"
        DROP COLUMN "rollbacker_name",
        DROP COLUMN "publisher_name",
        DROP COLUMN "reviewer_name"
    `);
  }
}
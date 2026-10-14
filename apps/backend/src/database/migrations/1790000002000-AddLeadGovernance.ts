import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLeadGovernance1790000002000 implements MigrationInterface {
  name = "AddLeadGovernance1790000002000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ADD COLUMN "consent_accepted" boolean NOT NULL DEFAULT false, ADD COLUMN "consent_at" timestamptz`);
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" serial PRIMARY KEY,
        "actor_user_id" uuid,
        "actor_username" varchar(80) NOT NULL,
        "action" varchar(80) NOT NULL,
        "resource_type" varchar(80) NOT NULL,
        "resource_id" varchar(120) NOT NULL,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_audit_logs_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_resource_time" ON "audit_logs" ("resource_type", "resource_id", "created_at" DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_resource_time"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "consent_at", DROP COLUMN "consent_accepted"`);
  }
}

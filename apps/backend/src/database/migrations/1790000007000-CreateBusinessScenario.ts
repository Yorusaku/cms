import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 独立业务场景 + 记录归属。
 *
 * - 场景以 UUID 为身份，名称可改，业务关联始终用 ID；
 * - 历史记录保留 NULL，不按名称/类别/模板猜测归属；
 * - 页面绑定存在 publishedSchema.pageConfig.businessScenarioId，本迁移不动页面数据。
 */
export class CreateBusinessScenario1790000007000 implements MigrationInterface {
  name = 'CreateBusinessScenario1790000007000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "business_scenarios" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(80) NOT NULL,
        "description" varchar(300) NOT NULL DEFAULT '',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query(`
      ALTER TABLE "ticket_exceptions"
        ADD COLUMN "business_scenario_id" uuid
        REFERENCES "business_scenarios" ("id") ON DELETE SET NULL
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_ticket_exceptions_scenario"
        ON "ticket_exceptions" ("business_scenario_id")
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_ticket_exceptions_scenario"`)
    await queryRunner.query(
      `ALTER TABLE "ticket_exceptions" DROP COLUMN IF EXISTS "business_scenario_id"`
    )
    await queryRunner.query(`DROP TABLE IF EXISTS "business_scenarios"`)
  }
}

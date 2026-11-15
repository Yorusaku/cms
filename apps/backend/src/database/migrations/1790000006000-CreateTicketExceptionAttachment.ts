import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 票据异常私有材料：附件元数据。
 *
 * 只存服务端文件名与展示信息，不存磁盘路径或公开 URL；
 * 读取接口按附件 ID 鉴权后从私有目录取文件。
 */
export class CreateTicketExceptionAttachment1790000006000 implements MigrationInterface {
  name = 'CreateTicketExceptionAttachment1790000006000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ticket_exception_attachments" (
        "id" SERIAL PRIMARY KEY,
        "exception_id" integer NOT NULL
          REFERENCES "ticket_exceptions" ("id") ON DELETE CASCADE,
        "storage_name" varchar(160) NOT NULL,
        "original_name" varchar(200) NOT NULL,
        "mime_type" varchar(60) NOT NULL,
        "size_bytes" integer NOT NULL,
        "uploaded_by_user_id" uuid,
        "uploaded_by_username" varchar(80) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_ticket_exception_attachments_exception"
        ON "ticket_exception_attachments" ("exception_id", "created_at")
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_exception_attachments"`)
  }
}

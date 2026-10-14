import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Lead } from "./entities/lead.entity";
import { AuditLog } from "./entities/audit-log.entity";
import { PublishLog } from "../page/entities/publish-log.entity";
import { LeadController } from "./lead.controller";
import { LeadService } from "./lead.service";

@Module({
  imports: [TypeOrmModule.forFeature([Lead, PublishLog, AuditLog]), ConfigModule],
  controllers: [LeadController],
  providers: [LeadService],
})
export class LeadModule {}

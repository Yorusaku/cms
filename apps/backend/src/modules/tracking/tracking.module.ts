import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lead } from "../lead/entities/lead.entity";
import { TrackingEvent } from "./entities/tracking-event.entity";
import { TrackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";

@Module({
  imports: [TypeOrmModule.forFeature([TrackingEvent, Lead])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}

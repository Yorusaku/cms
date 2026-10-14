import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { UploadModule } from "../../modules/upload/upload.module";

@Module({
  imports: [UploadModule],
  controllers: [HealthController],
})
export class HealthModule {}

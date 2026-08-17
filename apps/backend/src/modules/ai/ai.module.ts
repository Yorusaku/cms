import { Module } from "@nestjs/common";
import { PageModule } from "../page/page.module";
import { TrackingModule } from "../tracking/tracking.module";
import { AiController } from "./ai.controller";
import { AiProviderService } from "./ai-provider.service";
import { AiService } from "./ai.service";

@Module({
  imports: [PageModule, TrackingModule],
  controllers: [AiController],
  providers: [AiService, AiProviderService],
})
export class AiModule {}

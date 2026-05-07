import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PageController } from "./page.controller";
import { PageService } from "./page.service";
import { Page } from "./entities/page.entity";
import { PublishLog } from "./entities/publish-log.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Page, PublishLog])],
  controllers: [PageController],
  providers: [PageService],
})
export class PageModule {}

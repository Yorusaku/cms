import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PageController } from "./page.controller";
import { PageService } from "./page.service";
import { Page } from "./entities/page.entity";
import { PublishLog } from "./entities/publish-log.entity";
import { User } from "../auth/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Page, PublishLog, User])],
  controllers: [PageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}

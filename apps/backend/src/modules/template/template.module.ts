import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TemplateController } from "./template.controller";
import { TemplateService } from "./template.service";
import { Template } from "./entities/template.entity";
import { Page } from "../page/entities/page.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Template, Page])],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}

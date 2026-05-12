import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { TemplateService } from "./template.service";
import { Template } from "./entities/template.entity";

@Controller("atlas-cms")
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get("getTemplateList")
  async getTemplateList(
    @Query("category") category?: string,
  ): Promise<Template[]> {
    return this.templateService.getTemplateList(category);
  }

  @Get("getTemplateById")
  async getTemplateById(@Query("id") id: number): Promise<Template> {
    return this.templateService.getTemplateById(Number(id));
  }

  @Post("createPageFromTemplate")
  async createPageFromTemplate(
    @Body() body: { templateId: number; name: string },
  ): Promise<{ id: number }> {
    const page = await this.templateService.createPageFromTemplate(
      body.templateId,
      body.name,
    );
    return { id: page.id };
  }
}

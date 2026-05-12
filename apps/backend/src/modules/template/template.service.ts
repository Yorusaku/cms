import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Template } from "./entities/template.entity";
import { Page } from "../page/entities/page.entity";


@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
  ) {}

  async getTemplateList(category?: string): Promise<Template[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (category && category !== 'all') {
      where.category = category;
    }
    return this.templateRepo.find({
      where,
      order: { useCount: "DESC" },
    });
  }

  async getTemplateById(id: number): Promise<Template> {
    const template = await this.templateRepo.findOne({ where: { id, isActive: true } });
    if (!template) {
      throw new BadRequestException("模板不存在");
    }
    return template;
  }

  async createPageFromTemplate(templateId: number, pageName: string): Promise<Page> {
    const template = await this.getTemplateById(templateId);

    // 深拷贝模板 schema
    const schema = JSON.parse(JSON.stringify(template.schema));

    // 更新页面名称为用户指定名称
    schema.pageConfig = {
      ...schema.pageConfig,
      name: pageName,
    };

    const page = this.pageRepo.create({
      name: pageName,
      schema,
      componentList: [],
      shareDesc: schema.pageConfig?.shareDesc as string ?? "",
      shareImage: schema.pageConfig?.shareImage as string ?? "",
      backgroundColor: schema.pageConfig?.backgroundColor as string ?? "#ffffff",
      backgroundImage: schema.pageConfig?.backgroundImage as string ?? "",
      backgroundPosition: schema.pageConfig?.backgroundPosition as string ?? "top",
      cover: schema.pageConfig?.cover as string ?? "",
      isAbled: 0,
      status: "draft",
      isDeleted: false,
    });

    const saved = await this.pageRepo.save(page);

    // 增加模板使用次数
    await this.templateRepo.increment({ id: templateId }, "useCount", 1);

    return saved;
  }
}

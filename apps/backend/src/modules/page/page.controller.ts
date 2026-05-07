import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { PageService } from "./page.service";
import { GetPageListDto } from "./dto/get-page-list.dto";
import { GetPageJsonDto } from "./dto/get-page-json.dto";
import { AddPageJsonDto, UpdatePageJsonDto } from "./dto/save-page.dto";
import { DeletePageDto } from "./dto/delete-page.dto";
import { UpdatePageStatusDto } from "./dto/update-page-status.dto";
import { GetPublishLogsDto, RollbackVersionDto } from "./dto/publish-log.dto";

@Controller("atlas-cms")
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get("getPageList")
  async getPageList(@Query() dto: GetPageListDto) {
    return this.pageService.getPageList(dto);
  }

  @Get("getPageJson")
  async getPageJson(@Query() dto: GetPageJsonDto) {
    return this.pageService.getPageJson(dto.id);
  }

  @Post("addPageJson")
  async addPageJson(@Body() dto: AddPageJsonDto) {
    return this.pageService.addPageJson(dto);
  }

  @Post("updateCmsJson")
  async updateCmsJson(@Body() dto: UpdatePageJsonDto) {
    await this.pageService.updatePageJson(dto);
    return null;
  }

  @Post("deletePage")
  async deletePage(@Body() dto: DeletePageDto) {
    await this.pageService.deletePage(dto.id);
    return null;
  }

  @Post("updatePageStatus")
  async updatePageStatus(@Body() dto: UpdatePageStatusDto) {
    await this.pageService.updatePageStatus(dto.id, dto.isAbled);
    return null;
  }

  /** Publish logs — Phase 6 endpoints */
  @Get("getPagePublishLogs")
  async getPagePublishLogs(@Query() dto: GetPublishLogsDto) {
    return this.pageService.getPagePublishLogs(dto.pageId);
  }

  /** Rollback — Phase 6 endpoint */
  @Post("rollbackPageVersion")
  async rollbackPageVersion(@Body() dto: RollbackVersionDto) {
    return this.pageService.rollbackPageVersion(dto.pageId, dto.versionId);
  }
}

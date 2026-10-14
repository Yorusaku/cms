import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { PageService } from "./page.service";
import { GetPageListDto } from "./dto/get-page-list.dto";
import { GetPageJsonDto } from "./dto/get-page-json.dto";
import { AddPageJsonDto, UpdatePageJsonDto } from "./dto/save-page.dto";
import { DeletePageDto } from "./dto/delete-page.dto";
import { UpdatePageStatusDto } from "./dto/update-page-status.dto";
import { GetPublishLogsDto, PublishPageDto, RollbackVersionDto, ReviewPageDto, SubmitReviewDto } from "./dto/publish-log.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@Controller("atlas-cms")
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get("getPageList")
  @Roles("admin", "editor", "viewer")
  async getPageList(@Query() dto: GetPageListDto) {
    return this.pageService.getPageList(dto);
  }

  @Public()
  @Get("getPublishedPageList")
  async getPublishedPageList(@Query() dto: GetPageListDto) {
    return this.pageService.getPublishedPageList(dto);
  }

  @Get("getPageJson")
  @Roles("admin", "editor", "viewer")
  async getPageJson(@Query() dto: GetPageJsonDto) {
    return this.pageService.getPageJson(dto.id);
  }

  @Public()
  @Get("getPublishedPage")
  async getPublishedPage(@Query() dto: GetPageJsonDto) {
    return this.pageService.getPublishedPage(dto.id);
  }

  @Post("addPageJson")
  @Roles("admin", "editor")
  async addPageJson(@Body() dto: AddPageJsonDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.pageService.addPageJson(dto, req.user);
  }

  @Post("updateCmsJson")
  @Roles("admin", "editor")
  async updateCmsJson(@Body() dto: UpdatePageJsonDto, @Req() req: Request & { user: AuthenticatedUser }) {
    await this.pageService.updatePageJson(dto, req.user);
    return null;
  }

  @Post("publishPage")
  @Roles("admin")
  async publishPage(@Body() dto: PublishPageDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.pageService.publishPage(dto.pageId, req.user, dto.note);
  }

  @Post("deletePage")
  @Roles("admin")
  async deletePage(@Body() dto: DeletePageDto) {
    await this.pageService.deletePage(dto.id);
    return null;
  }

  @Post("updatePageStatus")
  @Roles("admin")
  async updatePageStatus(@Body() dto: UpdatePageStatusDto) {
    await this.pageService.updatePageStatus(dto.id, dto.isAbled);
    return null;
  }

  @Get("getPagePublishLogs")
  @Roles("admin", "editor", "viewer")
  async getPagePublishLogs(@Query() dto: GetPublishLogsDto) {
    return this.pageService.getPagePublishLogs(dto.pageId);
  }

  @Post("rollbackPageVersion")
  @Roles("admin")
  async rollbackPageVersion(@Body() dto: RollbackVersionDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.pageService.rollbackPageVersion(dto.pageId, dto.versionId, req.user);
  }

  @Post("submitPageReview")
  @Roles("admin", "editor")
  async submitPageReview(@Body() dto: SubmitReviewDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.pageService.submitForReview(dto.pageId, req.user, dto.note);
  }

  @Post("reviewPage")
  @Roles("admin")
  async reviewPage(@Body() dto: ReviewPageDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.pageService.reviewPage(dto.pageId, req.user, dto.decision, dto.note);
  }
}

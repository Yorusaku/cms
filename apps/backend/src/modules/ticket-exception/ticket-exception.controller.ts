import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import type { Request } from 'express'
import { Roles } from '../../common/decorators/roles.decorator'
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy'
import {
  CreateTicketExceptionDto,
  GetTicketExceptionListDto,
  ProcessTicketExceptionDto,
  SupplementTicketExceptionDto
} from './dto/ticket-exception.dto'
import {
  TicketExceptionService,
  type TicketExceptionAttachmentUploadResult,
  type TicketExceptionDetail,
  type TicketExceptionListResult,
  type TicketExceptionWorkbenchSummary
} from './ticket-exception.service'

type AuthedRequest = Request & { user: AuthenticatedUser }

/**
 * 票据异常业务接口。
 *
 * 与页面审核发布是两条独立流程：这里的 status 只表示异常处理状态
 * （pending / needs_supplement / resolved），不代表页面审核状态。
 */
@Controller('atlas-cms')
export class TicketExceptionController {
  constructor(private readonly ticketExceptionService: TicketExceptionService) {}

  @Post('createTicketException')
  @Roles('admin', 'editor')
  async createTicketException(
    @Body() dto: CreateTicketExceptionDto,
    @Req() req: AuthedRequest
  ): Promise<{ id: number; duplicated: boolean }> {
    return this.ticketExceptionService.create(dto, req.user)
  }

  @Get('getTicketExceptionList')
  @Roles('admin', 'editor', 'viewer')
  async getTicketExceptionList(
    @Query() dto: GetTicketExceptionListDto,
    @Req() req: AuthedRequest
  ): Promise<TicketExceptionListResult> {
    return this.ticketExceptionService.getList(dto, req.user)
  }

  @Get('getTicketExceptionDetail')
  @Roles('admin', 'editor', 'viewer')
  async getTicketExceptionDetail(
    @Query('id') id: string,
    @Req() req: AuthedRequest
  ): Promise<TicketExceptionDetail> {
    return this.ticketExceptionService.getDetail(Number(id), req.user)
  }

  @Post('supplementTicketException')
  @Roles('admin', 'editor')
  async supplementTicketException(
    @Body() dto: SupplementTicketExceptionDto,
    @Req() req: AuthedRequest
  ): Promise<TicketExceptionDetail> {
    return this.ticketExceptionService.supplement(dto, req.user)
  }

  @Get('getTicketExceptionSummary')
  @Roles('admin', 'editor', 'viewer')
  async getTicketExceptionSummary(
    @Query('scenarioId') scenarioId: string | undefined,
    @Req() req: AuthedRequest
  ): Promise<TicketExceptionWorkbenchSummary> {
    return this.ticketExceptionService.getWorkbenchSummary(
      { scenarioId: scenarioId || undefined },
      req.user
    )
  }

  @Post('uploadTicketExceptionAttachment')
  @Roles('admin', 'editor')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTicketExceptionAttachment(
    @Body('exceptionId') exceptionId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AuthedRequest
  ): Promise<TicketExceptionAttachmentUploadResult> {
    return this.ticketExceptionService.uploadAttachment(Number(exceptionId), file, req.user)
  }

  @Get('getTicketExceptionAttachment')
  @Roles('admin', 'editor', 'viewer')
  async getTicketExceptionAttachment(@Query('id') id: string, @Res() res: Response): Promise<void> {
    const file = await this.ticketExceptionService.readAttachment(Number(id))
    // 服务端确认的 MIME 与原文件名；绝不放公开可访问 URL，也不缓存
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`
    )
    res.setHeader('Cache-Control', 'private, no-store')
    res.end(file.buffer)
  }

  @Post('processTicketException')
  @Roles('admin', 'editor')
  async processTicketException(
    @Body() dto: ProcessTicketExceptionDto,
    @Req() req: AuthedRequest
  ): Promise<TicketExceptionDetail> {
    return this.ticketExceptionService.process(dto, req.user)
  }
}

import { Body, Controller, Post } from "@nestjs/common";
import type {
  AiDiagnosePageResponse,
  AiGeneratePageResponse,
  AiSuggestContentChangesResponse,
} from "@cms/types";
import { Roles } from "../../common/decorators/roles.decorator";
import { AiService } from "./ai.service";
import { AiDiagnosePageDto } from "./dto/ai-diagnose-page.dto";
import { AiGeneratePageDto } from "./dto/ai-generate-page.dto";
import { AiSuggestContentChangesDto } from "./dto/ai-suggest-content-changes.dto";

@Controller("atlas-cms")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("aiGeneratePage")
  @Roles("admin", "editor")
  async aiGeneratePage(
    @Body() dto: AiGeneratePageDto,
  ): Promise<AiGeneratePageResponse> {
    return this.aiService.generatePage(dto);
  }

  @Post("aiDiagnosePage")
  @Roles("admin", "editor")
  async aiDiagnosePage(
    @Body() dto: AiDiagnosePageDto,
  ): Promise<AiDiagnosePageResponse> {
    return this.aiService.diagnosePage(dto);
  }

  /**
   * AI 内容更新建议：只返回逐区块建议，不读写页面数据库。
   * 应用与撤销完全在前端完成（一次应用对应一次撤销）。
   */
  @Post("aiSuggestContentChanges")
  @Roles("admin", "editor")
  async aiSuggestContentChanges(
    @Body() dto: AiSuggestContentChangesDto,
  ): Promise<AiSuggestContentChangesResponse> {
    return this.aiService.suggestContentChanges(dto);
  }
}

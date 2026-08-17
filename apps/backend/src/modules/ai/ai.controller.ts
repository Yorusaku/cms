import { Body, Controller, Post } from "@nestjs/common";
import type {
  AiDiagnosePageResponse,
  AiGeneratePageResponse,
} from "@cms/types";
import { Roles } from "../../common/decorators/roles.decorator";
import { AiService } from "./ai.service";
import { AiDiagnosePageDto } from "./dto/ai-diagnose-page.dto";
import { AiGeneratePageDto } from "./dto/ai-generate-page.dto";

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
}

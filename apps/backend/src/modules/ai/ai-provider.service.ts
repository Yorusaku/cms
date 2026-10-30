import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AiGeneratePageRequest,
  AiSuggestContentChangesRequest,
} from "@cms/types";

export interface AiGeneratedPageDraft {
  schema: unknown;
  summary?: string;
  warnings?: string[];
}

export interface AiContentSuggestionDraft {
  /** 模型返回的原始 changes（未校验，交由 AiService 做协议与业务校验） */
  changes: unknown;
  warnings: string[];
}

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  constructor(private readonly configService: ConfigService) {}

  /** 是否显式开启强制 mock（AI_MOCK_ENABLED=true） */
  isMockMode(): boolean {
    return this.shouldForceMock();
  }

  async generatePageDraft(
    request: AiGeneratePageRequest,
    materialContract: string,
  ): Promise<AiGeneratedPageDraft | null> {
    if (this.shouldForceMock()) {
      return null;
    }

    const apiKey = this.configService.get<string>("AI_API_KEY");
    const model = this.configService.get<string>("AI_MODEL");
    const baseUrl = this.configService.get<string>("AI_BASE_URL");

    if (!apiKey || !model || !baseUrl) {
      return null;
    }

    try {
      const content = await this.callChat({
        apiKey,
        model,
        baseUrl,
        systemPrompt: this.createSystemPrompt(materialContract),
        userContent: JSON.stringify(request),
      });
      const parsed = this.parseJsonContent(content);
      return this.normalizeProviderResult(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.warn(`AI provider fallback to mock: ${message}`);
      return null;
    }
  }

  /**
   * 内容更新建议：沿用整页生成同一套模型配置、超时与 JSON 提取能力，
   * 但使用独立提示词（只改选定区块的文字，不生成页面结构）。
   * 返回 null 表示模型不可用（mock 模式、未配置或调用失败），由调用方决定回退或报错。
   */
  async suggestContentChanges(
    request: AiSuggestContentChangesRequest,
  ): Promise<AiContentSuggestionDraft | null> {
    if (this.shouldForceMock()) {
      return null;
    }

    const apiKey = this.configService.get<string>("AI_API_KEY");
    const model = this.configService.get<string>("AI_MODEL");
    const baseUrl = this.configService.get<string>("AI_BASE_URL");

    if (!apiKey || !model || !baseUrl) {
      return null;
    }

    try {
      const content = await this.callChat({
        apiKey,
        model,
        baseUrl,
        systemPrompt: this.createContentUpdateSystemPrompt(),
        userContent: JSON.stringify(request),
      });
      const parsed = this.parseJsonContent(content);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("provider content is not an object");
      }
      const record = parsed as Record<string, unknown>;
      return {
        changes: record.changes,
        warnings: Array.isArray(record.warnings)
          ? record.warnings.filter(
              (item): item is string => typeof item === "string",
            )
          : [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.warn(`AI content suggest unavailable: ${message}`);
      return null;
    }
  }

  private shouldForceMock(): boolean {
    return this.configService.get<string>("AI_MOCK_ENABLED") === "true";
  }

  private async callChat({
    apiKey,
    model,
    baseUrl,
    systemPrompt,
    userContent,
  }: {
    apiKey: string;
    model: string;
    baseUrl: string;
    systemPrompt: string;
    userContent: string;
  }): Promise<string> {
    const controller = new AbortController();
    const timeoutMs = this.getTimeoutMs();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.resolveChatCompletionsUrl(baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`provider http ${response.status}`);
      }

      const data = (await response.json()) as OpenAiChatResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("provider response missing content");
      }
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  private createSystemPrompt(materialContract: string): string {
    return [
      "你是一个营销 H5 低代码页面生成器，只能输出 JSON，不要输出 Markdown。",
      "目标是生成电商促销 + 线索收集页面，输出结构必须是：",
      '{"schema": IPageSchemaV2, "summary": "生成说明", "warnings": ["可选警告"]}',
      "schema.version 必须是 2.0.0，所有组件必须放在 componentMap，rootIds 按渲染顺序引用组件 id。",
      "只允许使用以下物料和字段，不要自造组件类型：",
      materialContract,
      "页面必须包含首屏价值主张、促销提示、商品区、线索表单和清晰 CTA。",
      "所有图片字段如果用户未提供，请使用非空 data:image/svg+xml 占位图。",
      "富文本只允许基础 HTML 标签，不允许 script、iframe、事件属性或 javascript: 链接。",
    ].join("\n");
  }

  /** 内容更新专用提示词：与整页生成的营销提示词完全分离 */
  private createContentUpdateSystemPrompt(): string {
    return [
      "你是内部运营平台的内容编辑助手，只负责按用户提供的新资料修改已有页面区块的文字内容，不生成页面结构。",
      "只能输出 JSON，不要输出 Markdown。输出结构：",
      '{"changes": [{"componentId": "组件ID", "type": "RichText|Notice|BusinessForm", "...": "该类型允许的字段"}], "warnings": ["可选说明"]}',
      "规则：",
      "1. 只处理输入 targets 中列出的组件；componentId 必须原样来自输入，不得新增、不得重复；",
      '2. RichText 只返回 blocks 数组（元素为 {"type":"heading"|"paragraph","text":"..."} 或 {"type":"list","ordered":true|false,"items":["..."]}），不要输出 HTML、标签、属性或链接；',
      "3. Notice 必须返回与输入 noticeTexts 相同数量、相同顺序的文字数组，不得增删公告项，不得修改或新增链接；",
      "4. BusinessForm 只允许修改 title、subtitle、submitText 三个文字属性，可只返回需要变化的字段；",
      "5. 严格依据用户提供的资料修改；资料中未要求修改的事实保持不变；",
      "6. 不得自行补充日期、费用、办理时限、联系方式或其他承诺，资料未提供就保持原文或不修改；",
      "7. 无法满足的要求写入 warnings 说明原因，不要编造；",
      "8. 某个目标不需要修改时不要返回该项。",
    ].join("\n");
  }

  private parseJsonContent(content: string): unknown {
    const trimmed = content.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fenced?.[1]) {
        return JSON.parse(fenced[1].trim());
      }

      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(trimmed.slice(start, end + 1));
      }

      throw new Error("provider content is not valid JSON");
    }
  }

  private normalizeProviderResult(value: unknown): AiGeneratedPageDraft {
    if (!value || typeof value !== "object") {
      throw new Error("provider JSON is not an object");
    }

    const record = value as Record<string, unknown>;
    return {
      schema: record.schema ?? value,
      summary:
        typeof record.summary === "string" ? record.summary : "AI 已生成页面草稿",
      warnings: Array.isArray(record.warnings)
        ? record.warnings.filter((item): item is string => typeof item === "string")
        : [],
    };
  }

  private resolveChatCompletionsUrl(baseUrl: string): string {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    if (normalizedBaseUrl.endsWith("/chat/completions")) {
      return normalizedBaseUrl;
    }
    if (normalizedBaseUrl.endsWith("/v1")) {
      return `${normalizedBaseUrl}/chat/completions`;
    }
    return `${normalizedBaseUrl}/v1/chat/completions`;
  }

  private getTimeoutMs(): number {
    const rawValue = this.configService.get<string>("AI_TIMEOUT_MS");
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 30000;
  }
}

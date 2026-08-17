import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AiGeneratePageRequest } from "@cms/types";

export interface AiGeneratedPageDraft {
  schema: unknown;
  summary?: string;
  warnings?: string[];
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
      const content = await this.callChatCompletions({
        apiKey,
        model,
        baseUrl,
        request,
        materialContract,
      });
      const parsed = this.parseJsonContent(content);
      return this.normalizeProviderResult(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.warn(`AI provider fallback to mock: ${message}`);
      return null;
    }
  }

  private shouldForceMock(): boolean {
    return this.configService.get<string>("AI_MOCK_ENABLED") === "true";
  }

  private async callChatCompletions({
    apiKey,
    model,
    baseUrl,
    request,
    materialContract,
  }: {
    apiKey: string;
    model: string;
    baseUrl: string;
    request: AiGeneratePageRequest;
    materialContract: string;
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
              content: this.createSystemPrompt(materialContract),
            },
            {
              role: "user",
              content: JSON.stringify(request),
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

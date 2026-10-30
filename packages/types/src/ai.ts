import { z } from "zod";
import { PageSchemaV2Schema } from "./schemas";

export const AiProductInputSchema = z.object({
  name: z.string(),
  price: z.union([z.string(), z.number()]).optional(),
  originalPrice: z.union([z.string(), z.number()]).optional(),
  sellingPoint: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const AiGeneratePageRequestSchema = z.object({
  pageName: z.string(),
  activityType: z.string(),
  audience: z.string(),
  promotion: z.string(),
  products: z.array(AiProductInputSchema).default([]),
  leadGoal: z.string().optional(),
  ctaText: z.string(),
  styleTone: z.string().optional(),
  extraPrompt: z.string().optional(),
});

export const AiGeneratePageResponseSchema = z.object({
  pageId: z.number(),
  schema: PageSchemaV2Schema,
  summary: z.string(),
  warnings: z.array(z.string()),
});

export const FunnelMetricsSchema = z.object({
  pageViews: z.number(),
  /** 去重会话数：同一 sessionId 多次访问只计一次 */
  uniqueVisitors: z.number(),
  ctaClicks: z.number(),
  formSubmits: z.number(),
  leads: z.number(),
  ctaClickRate: z.number(),
  leadConversionRate: z.number(),
});

export const FunnelChannelSummarySchema = z.object({
  channelKey: z.string(),
  channelValue: z.string(),
  metrics: FunnelMetricsSchema,
});

/** 按天聚合的趋势点（date 为 YYYY-MM-DD） */
export const FunnelTrendPointSchema = z.object({
  date: z.string(),
  metrics: FunnelMetricsSchema,
});

export const PageFunnelSummarySchema = z.object({
  pageId: z.number(),
  metrics: FunnelMetricsSchema,
  channels: z.array(FunnelChannelSummarySchema),
  /** 按天倒序的趋势序列（无数据区间不补零） */
  dailyTrend: z.array(FunnelTrendPointSchema),
});

export const AiDiagnosePageRequestSchema = z.object({
  pageId: z.number(),
});

export const AiAdviceSeveritySchema = z.enum(["info", "warning", "critical"]);
export const AiAdviceCategorySchema = z.enum([
  "structure",
  "copywriting",
  "cta",
  "form",
  "product",
  "tracking",
]);

export const AiPageAdviceSchema = z.object({
  category: AiAdviceCategorySchema,
  severity: AiAdviceSeveritySchema,
  targetComponentId: z.string().optional(),
  problem: z.string(),
  suggestion: z.string(),
  expectedImpact: z.string(),
});

export const AiDiagnosePageResponseSchema = z.object({
  pageId: z.number(),
  summary: z.string(),
  advice: z.array(AiPageAdviceSchema),
});

export type AiProductInput = z.infer<typeof AiProductInputSchema>;
export type AiGeneratePageRequest = z.infer<typeof AiGeneratePageRequestSchema>;
export type AiGeneratePageResponse = z.infer<typeof AiGeneratePageResponseSchema>;
export type FunnelMetrics = z.infer<typeof FunnelMetricsSchema>;
export type FunnelChannelSummary = z.infer<typeof FunnelChannelSummarySchema>;
export type FunnelTrendPoint = z.infer<typeof FunnelTrendPointSchema>;
export type PageFunnelSummary = z.infer<typeof PageFunnelSummarySchema>;
export type AiDiagnosePageRequest = z.infer<typeof AiDiagnosePageRequestSchema>;
export type AiAdviceSeverity = z.infer<typeof AiAdviceSeveritySchema>;
export type AiAdviceCategory = z.infer<typeof AiAdviceCategorySchema>;
export type AiPageAdvice = z.infer<typeof AiPageAdviceSchema>;
export type AiDiagnosePageResponse = z.infer<typeof AiDiagnosePageResponseSchema>;

/* ------------------------------------------------------------------ */
/* AI 内容更新（批量更新已有页面区块内容）                              */
/* ------------------------------------------------------------------ */

/** 支持 AI 内容更新的规范化物料类型 */
export const AiContentTargetTypeSchema = z.enum([
  "RichText",
  "Notice",
  "BusinessForm",
]);
export type AiContentTargetType = z.infer<typeof AiContentTargetTypeSchema>;

/** 各类型允许 AI 修改的字段（也是请求/变更项允许携带的字段） */
export const AI_CONTENT_ALLOWED_FIELDS: Record<
  AiContentTargetType,
  readonly string[]
> = {
  RichText: ["content"],
  Notice: ["noticeTexts"],
  BusinessForm: ["title", "subtitle", "submitText"],
};

/**
 * 富文本受控内容块：模型只返回结构化文本，
 * HTML 由服务端转义文本后按固定标签生成（不接受模型提供的标签/属性/URL）。
 */
export const AiRichTextContentBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    text: z.string().min(1).max(200),
  }),
  z.object({
    type: z.literal("paragraph"),
    text: z.string().min(1).max(2000),
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.string().min(1).max(500)).min(1).max(20),
  }),
]);
export type AiRichTextContentBlock = z.infer<
  typeof AiRichTextContentBlockSchema
>;

/** 内容更新的目标：组件 ID + 规范化类型 + 该类型允许读取的当前内容 */
export const AiContentTargetSchema = z
  .object({
    componentId: z.string().min(1).max(120),
    type: AiContentTargetTypeSchema,
    /** RichText 当前正文（HTML） */
    content: z.string().max(20000).optional(),
    /** Notice 现有公告项文字（保持原顺序） */
    noticeTexts: z.array(z.string().max(500)).min(1).max(20).optional(),
    /** BusinessForm 当前文字属性 */
    title: z.string().max(200).optional(),
    subtitle: z.string().max(500).optional(),
    submitText: z.string().max(60).optional(),
  })
  .superRefine((target, ctx) => {
    const present: Record<string, unknown> = {
      content: target.content,
      noticeTexts: target.noticeTexts,
      title: target.title,
      subtitle: target.subtitle,
      submitText: target.submitText,
    };
    const allowed = AI_CONTENT_ALLOWED_FIELDS[target.type];

    for (const [field, value] of Object.entries(present)) {
      if (value === undefined) continue;
      if (!allowed.includes(field)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${target.type} 不支持字段 ${field}`,
        });
      }
    }

    if (target.type === "RichText" && target.content === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "RichText 目标必须携带当前正文 content",
      });
    }
    if (target.type === "Notice" && !target.noticeTexts?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["noticeTexts"],
        message: "Notice 目标必须携带现有公告文字 noticeTexts",
      });
    }
    if (
      target.type === "BusinessForm" &&
      target.title === undefined &&
      target.subtitle === undefined &&
      target.submitText === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "BusinessForm 目标至少要携带一个当前文字属性",
      });
    }
  });
export type AiContentTarget = z.infer<typeof AiContentTargetSchema>;

export const AiSuggestContentChangesRequestSchema = z
  .object({
    instruction: z.string().min(1).max(2000),
    targets: z.array(AiContentTargetSchema).min(1).max(20),
  })
  .superRefine((request, ctx) => {
    const seen = new Set<string>();
    request.targets.forEach((target, index) => {
      if (seen.has(target.componentId)) {
        ctx.addIssue({
          code: "custom",
          path: ["targets", index, "componentId"],
          message: `目标 ${target.componentId} 重复`,
        });
      }
      seen.add(target.componentId);
    });
  });
export type AiSuggestContentChangesRequest = z.infer<
  typeof AiSuggestContentChangesRequestSchema
>;

/** 单个区块的建议结果；字段集合与目标类型严格一致 */
export const AiContentChangeSchema = z
  .object({
    componentId: z.string().min(1).max(120),
    type: AiContentTargetTypeSchema,
    /** RichText 建议内容（受控结构化块，用于对比展示） */
    blocks: z.array(AiRichTextContentBlockSchema).min(1).max(30).optional(),
    /** RichText 受控 HTML：仅由服务端转义文本后按固定标签生成，客户端传值会被覆盖 */
    html: z.string().max(30000).optional(),
    /** Notice 建议文字（数量与顺序必须与目标一致，由服务端校验） */
    noticeTexts: z.array(z.string().max(500)).min(1).max(20).optional(),
    /** BusinessForm 建议文字属性（可只返回需要变化的字段） */
    title: z.string().max(200).optional(),
    subtitle: z.string().max(500).optional(),
    submitText: z.string().max(60).optional(),
  })
  .superRefine((change, ctx) => {
    const present: Record<string, unknown> = {
      content: undefined, // 变更项不携带原 content
      blocks: change.blocks,
      html: change.html,
      noticeTexts: change.noticeTexts,
      title: change.title,
      subtitle: change.subtitle,
      submitText: change.submitText,
    };
    const allowed = new Set<string>(
      change.type === "RichText"
        ? ["blocks", "html"]
        : AI_CONTENT_ALLOWED_FIELDS[change.type],
    );

    for (const [field, value] of Object.entries(present)) {
      if (value === undefined) continue;
      if (!allowed.has(field)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${change.type} 变更不支持字段 ${field}`,
        });
      }
    }

    if (change.type === "RichText" && !change.blocks?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["blocks"],
        message: "RichText 变更必须返回 blocks",
      });
    }
    if (change.type === "Notice" && !change.noticeTexts?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["noticeTexts"],
        message: "Notice 变更必须返回 noticeTexts",
      });
    }
    if (
      change.type === "BusinessForm" &&
      change.title === undefined &&
      change.subtitle === undefined &&
      change.submitText === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "BusinessForm 变更至少要返回一个文字字段",
      });
    }
  });
export type AiContentChange = z.infer<typeof AiContentChangeSchema>;

export const AiSuggestContentChangesResponseSchema = z.object({
  /** model = 真实模型结果；mock = AI_MOCK_ENABLED=true 的示例结果 */
  source: z.enum(["model", "mock"]),
  changes: z.array(AiContentChangeSchema),
  warnings: z.array(z.string()),
});
export type AiSuggestContentChangesResponse = z.infer<
  typeof AiSuggestContentChangesResponseSchema
>;

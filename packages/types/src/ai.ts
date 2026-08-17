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

export const PageFunnelSummarySchema = z.object({
  pageId: z.number(),
  metrics: FunnelMetricsSchema,
  channels: z.array(FunnelChannelSummarySchema),
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
export type PageFunnelSummary = z.infer<typeof PageFunnelSummarySchema>;
export type AiDiagnosePageRequest = z.infer<typeof AiDiagnosePageRequestSchema>;
export type AiAdviceSeverity = z.infer<typeof AiAdviceSeveritySchema>;
export type AiAdviceCategory = z.infer<typeof AiAdviceCategorySchema>;
export type AiPageAdvice = z.infer<typeof AiPageAdviceSchema>;
export type AiDiagnosePageResponse = z.infer<typeof AiDiagnosePageResponseSchema>;

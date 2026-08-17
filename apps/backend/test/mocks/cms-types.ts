import { z } from "zod";

export const ApiCode = {
  SUCCESS: 10000,
  AUTH_FAILED: -2,
  VALIDATION_ERROR: -1,
  SERVER_ERROR: -3,
} as const;

export const AiGeneratePageRequestSchema = z.object({
  pageName: z.string(),
  activityType: z.string(),
  audience: z.string(),
  promotion: z.string(),
  products: z.array(z.record(z.unknown())).default([]),
  leadGoal: z.string().optional(),
  ctaText: z.string(),
  styleTone: z.string().optional(),
  extraPrompt: z.string().optional(),
});

export const PageSchemaV2Schema = z.object({
  version: z.literal("2.0.0"),
  pageConfig: z.record(z.unknown()),
  componentMap: z.record(
    z.object({
      id: z.string(),
      type: z.string(),
      props: z.record(z.unknown()),
      parentId: z.string().nullable(),
      children: z.array(z.string()),
      styles: z.record(z.string()).optional(),
      condition: z.union([z.boolean(), z.string()]).optional(),
    }).passthrough(),
  ),
  rootIds: z.array(z.string()),
  tracking: z
    .object({
      enabled: z.boolean().optional(),
      context: z.record(z.unknown()).optional(),
    })
    .optional(),
}).passthrough();

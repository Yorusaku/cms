import { z } from 'zod'

export const ApiCode = {
  SUCCESS: 10000,
  AUTH_FAILED: -2,
  VALIDATION_ERROR: -1,
  SERVER_ERROR: -3
} as const

export const AiGeneratePageRequestSchema = z.object({
  pageName: z.string(),
  activityType: z.string(),
  audience: z.string(),
  promotion: z.string(),
  products: z.array(z.record(z.string(), z.unknown())).default([]),
  leadGoal: z.string().optional(),
  ctaText: z.string(),
  styleTone: z.string().optional(),
  extraPrompt: z.string().optional()
})

export const PageSchemaV2Schema = z
  .object({
    version: z.literal('2.0.0'),
    pageConfig: z.record(z.string(), z.unknown()),
    componentMap: z.record(
      z.string(),
      z
        .object({
          id: z.string(),
          type: z.string(),
          props: z.record(z.string(), z.unknown()),
          parentId: z.string().nullable(),
          children: z.array(z.string()),
          styles: z.record(z.string(), z.string()).optional(),
          condition: z.union([z.boolean(), z.string()]).optional()
        })
        .loose()
    ),
    rootIds: z.array(z.string()),
    tracking: z
      .object({
        enabled: z.boolean().optional(),
        context: z.record(z.string(), z.unknown()).optional()
      })
      .optional()
  })
  .loose()

/*
 * AI 内容更新协议：直接复用 @cms/types 的 CJS 构建产物，
 * 避免在 mock 中手写副本与共享协议分叉（该组 schema 是本次新增，
 * 旧的手写 schema 保持不变以不影响既有测试）。
 */
export {
  AiContentTargetTypeSchema,
  AiRichTextContentBlockSchema,
  AiContentTargetSchema,
  AiSuggestContentChangesRequestSchema,
  AiContentChangeSchema,
  AiContentTargetWarningSchema,
  AiSuggestContentChangesResponseSchema
} from '../../../../packages/types/dist/cjs/ai'
export type {
  AiContentTargetType,
  AiRichTextContentBlock,
  AiContentTarget,
  AiSuggestContentChangesRequest,
  AiContentChange,
  AiContentTargetWarning,
  AiSuggestContentChangesResponse
} from '../../../../packages/types/dist/cjs/ai'

/*
 * 业务检查规则：同样复用 @cms/types 的 CJS 构建产物。
 * 后端提交审核/发布的校验必须与 CMS 编辑器使用同一份实现，
 * 不能在 mock 里手写副本。
 */
export {
  checkPageForSubmit,
  validateBusinessFormFields,
  findMissingBaseFields,
  readBusinessFormFields,
  readNoticeItemTexts,
  readTicketExceptionFormConfig,
  readPageScenarioBinding,
  pageNeedsScenarioBinding,
  isScenarioUuid,
  validateTicketExceptionFormConfig,
  validateTicketFormValues,
  isValidDateValue,
  TICKET_FIXED_FIELD_KEYS,
  TICKET_FIXED_FIELD_LABELS,
  isBaseFieldKey,
  isPhoneFieldKey,
  isBusinessFieldType,
  NAME_FIELD_KEY,
  PHONE_FIELD_KEYS,
  BASE_FIELD_KEYS,
  BASE_FIELD_DEFAULTS
} from '../../../../packages/types/dist/cjs/business-rules'
export type {
  BusinessCheckCode,
  BusinessCheckSeverity,
  BusinessCheckIssue,
  BusinessCheckResult,
  BusinessCheckSchemaLike,
  BusinessCheckComponentLike,
  BusinessFormFieldInput,
  BusinessFieldType,
  TicketExceptionFormConfig
} from '../../../../packages/types/dist/cjs/business-rules'

/*
 * 票据异常协议：同样复用 @cms/types 的 CJS 构建产物，
 * 附件上限等常量不在这份 mock 里手写副本。
 */
export {
  TICKET_EXCEPTION_STATUSES,
  TICKET_EXCEPTION_STATUS_LABELS,
  TICKET_EXCEPTION_ACTIONS,
  TICKET_EXCEPTION_ACTION_LABELS,
  TICKET_ATTACHMENT_MAX_COUNT,
  TICKET_ATTACHMENT_MAX_SIZE_BYTES,
  TICKET_ATTACHMENT_MIME_TYPES
} from '../../../../packages/types/dist/cjs/ticket-exception'
export type {
  TicketExceptionStatus,
  TicketExceptionAction,
  TicketFieldDefinition,
  TicketFieldSnapshot,
  TicketExceptionItem,
  TicketExceptionEventItem,
  TicketExceptionDetail,
  TicketExceptionListQuery,
  TicketExceptionListResult,
  CreateTicketExceptionPayload,
  SupplementTicketExceptionPayload,
  ProcessTicketExceptionPayload,
  ProcessTicketExceptionAction,
  TicketExceptionAttachment,
  TicketExceptionAttachmentUploadResult
} from '../../../../packages/types/dist/cjs/ticket-exception'

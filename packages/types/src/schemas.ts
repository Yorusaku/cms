import { z } from "zod";

// ==================== API 响应 Schema ====================

/** 分页数据 */
export const PaginatedDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z.array(itemSchema),
    total: z.number(),
    pageNum: z.number(),
    pageSize: z.number(),
  });

/** 统一 API 响应 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema,
  });

/** 页面列表项 */
export const PageItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  isAbled: z.number(),
  create_time: z.string(),
  update_time: z.string(),
}).passthrough();

/** 页面列表响应 */
export const PageListResponseSchema = ApiResponseSchema(
  PaginatedDataSchema(PageItemSchema)
);

/** 页面详情响应 */
export const PageDetailResponseSchema = ApiResponseSchema(
  z.object({
    id: z.number(),
    name: z.string(),
    schema: z.string(),
    isAbled: z.number(),
    create_time: z.string(),
    update_time: z.string(),
  }).passthrough()
);

/** 登录响应 */
export const LoginResponseSchema = ApiResponseSchema(
  z.object({
    token: z.string(),
  })
);

// ==================== Schema V2 核心协议 Schema ====================

/** 组件行为 */
export const ActionSchemaSchema = z.object({
  type: z.string(),
  config: z.record(z.unknown()),
  condition: z.union([z.boolean(), z.string()]).optional(),
}).passthrough();

/** 组件联动配置 */
export const ComponentLinkageSchema = z.object({
  id: z.string(),
  sourceComponentId: z.string(),
  targetComponentId: z.string(),
  sourceProperty: z.string(),
  targetProperty: z.string(),
  transformFn: z.string().optional(),
  condition: z
    .object({
      type: z.enum(["simple", "complex"]),
      expression: z.string().optional(),
      operator: z.enum(["AND", "OR"]).optional(),
    })
    .passthrough()
    .optional(),
  enabled: z.boolean(),
});

/** V2 组件 Schema */
export const ComponentSchemaV2Schema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.unknown()),
  parentId: z.string().nullable(),
  children: z.array(z.string()),
  styles: z.record(z.string()).optional(),
  events: z.record(z.array(ActionSchemaSchema)).optional(),
  condition: z.union([z.boolean(), z.string()]).optional(),
  track: z.record(z.unknown()).optional(),
  state: z.record(z.unknown()).optional(),
}).passthrough();

/** V2 页面 Schema */
export const PageSchemaV2Schema = z.object({
  version: z.literal("2.0.0"),
  pageConfig: z.record(z.unknown()),
  componentMap: z.record(ComponentSchemaV2Schema),
  rootIds: z.array(z.string()),
  state: z.record(z.unknown()).optional(),
  linkages: z.array(ComponentLinkageSchema).optional(),
  tracking: z
    .object({
      enabled: z.boolean().optional(),
      context: z.record(z.unknown()).optional(),
    })
    .optional(),
}).passthrough();

// ==================== 物料定义 Schema ====================

/** 可见性规则 */
export const MaterialVisibilityRuleSchema = z.object({
  field: z.string(),
  equals: z.unknown().optional(),
  notEquals: z.unknown().optional(),
  in: z.array(z.unknown()).optional(),
  truthy: z.boolean().optional(),
});

/** 字段选项 */
export const MaterialFieldOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

// 由于物料编辑器配置的联合类型比较复杂，使用宽松的 passthrough schema
export const MaterialEditorConfigSchema = z
  .object({
    mode: z.enum(["schema", "legacy"]),
  })
  .passthrough();

/** 物料定义（宽松校验） */
export const MaterialDefinitionSchema = z.object({
  type: z.string(),
  group: z.enum(["basic", "marketing"]),
  label: z.string(),
  icon: z.string(),
  maxCount: z.number(),
  defaultProps: z.record(z.unknown()),
}).passthrough();

// ==================== 辅助校验函数 ====================

/** 安全解析页面 Schema，失败时返回 null */
export function safeParsePageSchema(
  data: unknown
): z.infer<typeof PageSchemaV2Schema> | null {
  const result = PageSchemaV2Schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}

/** 安全解析 API 响应 */
export function safeParseApiResponse<T>(
  schema: z.ZodType<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}

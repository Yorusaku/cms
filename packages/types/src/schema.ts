// ==================== V1 基础类型 ====================
export interface IComponentSchemaBase {
  id: string
  type: string
  props: Record<string, unknown>
  styles?: Record<string, string>
}

export interface IPageSchemaBase {
  pageConfig: Record<string, unknown>
  components: IComponentSchemaBase[]
}

// V1 兼容类型
export interface IComponentSchemaV1 extends IComponentSchemaBase {}

export interface IPageSchemaV1 extends IPageSchemaBase {}

// ==================== V2 新类型定义 ====================

// 交互行为描述
export interface IActionSchema {
  type: string // 'navigate' | 'apiCall' | 'stateChange' | 'custom' | 'toast' | 'modal'
  config: Record<string, unknown> // 具体行为配置
  condition?: boolean | string // 执行条件（布尔值或表达式）
}

// V2 组件Schema
export interface IComponentSchemaV2 extends IComponentSchemaBase {
  // 层级关系字段
  parentId: string | null // 父组件ID，顶层为null
  children: string[] // 子组件ID数组
  
  // 扩展性预留字段
  events?: Record<string, IActionSchema[]> // 事件行为队列映射
  condition?: boolean | string // 条件渲染（布尔值或表达式）
  track?: Record<string, unknown> // 埋点追踪配置
  state?: Record<string, unknown> // 组件局部状态
}

// V2 页面Schema
export interface IPageSchemaV2 {
  version: '2.0.0'
  pageConfig: Record<string, unknown>
  state?: Record<string, unknown> // 页面全局状态
  componentMap: Record<string, IComponentSchemaV2> // 扁平化组件映射
  rootIds: string[] // 根节点ID数组
}

// ==================== 类型导出 ====================
// 默认导出V2类型作为主要类型
export type IComponentSchema = IComponentSchemaV2
export type IPageSchema = IPageSchemaV2

// V1兼容类型已在上方直接导出

export interface IMessagePayload<T = unknown> {
  type: string
  data: T
}

export const MESSAGE_TYPE = {
  SYNC_SCHEMA: 'SYNC_SCHEMA',
  SCHEMA_UPDATED: 'SCHEMA_UPDATED',
  ON_SELECT_BLOCK: 'ON_SELECT_BLOCK'
} as const

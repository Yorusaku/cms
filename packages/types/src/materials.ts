export type MaterialGroupKey = 'basic' | 'marketing' | 'business'

export interface MaterialVisibilityRule {
  field: string
  equals?: unknown
  notEquals?: unknown
  in?: unknown[]
  truthy?: boolean
}

export interface MaterialFieldOption {
  label: string
  value: string | number | boolean
}

interface MaterialSchemaBase {
  label?: string
  description?: string
  visibleWhen?: MaterialVisibilityRule
}

export interface MaterialSectionSchema extends MaterialSchemaBase {
  type: 'section'
  fields: MaterialFieldSchema[]
}

interface MaterialInputFieldSchema extends MaterialSchemaBase {
  path: string
  placeholder?: string
}

export interface MaterialTextFieldSchema extends MaterialInputFieldSchema {
  type: 'text' | 'textarea' | 'richText'
  rows?: number
}

export interface MaterialNumberFieldSchema extends MaterialInputFieldSchema {
  type: 'number'
  min?: number
  max?: number
  step?: number
}

export interface MaterialSwitchFieldSchema extends MaterialInputFieldSchema {
  type: 'switch'
}

export interface MaterialSelectFieldSchema extends MaterialInputFieldSchema {
  type: 'select'
  options: MaterialFieldOption[]
}

export interface MaterialColorFieldSchema extends MaterialInputFieldSchema {
  type: 'color'
}

export interface MaterialImageFieldSchema extends MaterialInputFieldSchema {
  type: 'image'
  uploadText?: string
}

export interface MaterialLinkFieldSchema extends MaterialInputFieldSchema {
  type: 'link'
}

export interface MaterialArrayItemSchema {
  key: string
  type: 'text' | 'image' | 'link' | 'number'
  label?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export interface MaterialArrayFieldSchema extends MaterialSchemaBase {
  type: 'array'
  path: string
  itemSchema: MaterialArrayItemSchema[]
  addText?: string
  limit?: number
  preset?: 'picList'
  showImage?: boolean
  showText?: boolean
}

/**
 * 业务表单字段编辑器。
 *
 * 只服务 BusinessForm 的字段列表，不扩展成通用嵌套表单设计器：
 * - 结构化编辑字段数组（名称 / 占位 / 必填 / 类型 / 下拉选项）；
 * - 通过 mirrorPath 原子同步 JSON 镜像属性（BusinessForm 的 fieldsJson 优先于
 *   fields，只写一个会出现「保存后配置回退」）；
 * - 历史页面可能只有 fields 而没有可用 fieldsJson，两者都要能读。
 */
export interface MaterialFormFieldsFieldSchema extends MaterialInputFieldSchema {
  type: 'formFields'
  /** 字段数组属性路径（如 fields） */
  path: string
  /** JSON 镜像属性路径（如 fieldsJson）；写入时与字段数组保持同步 */
  mirrorPath?: string
  /** 是否要求姓名/手机号基础字段（BusinessForm 需要，票据异常表单不需要） */
  requireBaseFields?: boolean
  /** 是否允许空列表（票据异常表单的扩展字段可以一个都没有） */
  allowEmpty?: boolean
  /** 保留 key：扩展字段不得占用（如票据异常的固定字段） */
  reservedKeys?: string[]
}

export type MaterialFieldSchema =
  | MaterialSectionSchema
  | MaterialTextFieldSchema
  | MaterialNumberFieldSchema
  | MaterialSwitchFieldSchema
  | MaterialSelectFieldSchema
  | MaterialColorFieldSchema
  | MaterialImageFieldSchema
  | MaterialLinkFieldSchema
  | MaterialArrayFieldSchema
  | MaterialFormFieldsFieldSchema

export interface MaterialEditorSchema {
  sections: MaterialSectionSchema[]
}

export type MaterialEditorConfig<TLegacyComponent = string> =
  | {
      mode: 'schema'
      schema: MaterialEditorSchema
    }
  | {
      mode: 'legacy'
      component: TLegacyComponent
    }

export interface MaterialDefinition<
  TRuntimeComponent = unknown,
  TLegacyComponent = string,
  TProps extends Record<string, unknown> = Record<string, unknown>
> {
  type: string
  aliases?: string[]
  group: MaterialGroupKey
  label: string
  icon: string
  maxCount: number
  defaultProps: TProps
  runtimeComponent: TRuntimeComponent
  editorConfig: MaterialEditorConfig<TLegacyComponent>
  /**
   * 受控的运行时事件属性：组件通过 emits 产出的、可供联动消费的属性名。
   *
   * 与 `defaultProps` 的区别：props 是静态配置（编辑端可改，存进 schema），
   * 这些是运行时状态（由组件在用户交互后 emit，只在渲染端存在）。
   * 联动配置面板会把它们与 props 分组展示，因此这里只登记明确支持的事件属性，
   * 不要为「以后可能用到」预先添加。
   */
  runtimeEventProperties?: string[]
  normalizeProps?: (props: Record<string, unknown>) => TProps
  toRuntimeProps?: (props: Record<string, unknown>) => Record<string, unknown>
}

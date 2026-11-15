/**
 * 业务规则：CMS 编辑器与 NestJS 后端共用的纯函数。
 *
 * 约束：
 * - 纯函数、无副作用，不依赖 Vue / Nest 运行时；
 * - 通过 `@cms/types` 的公开导出消费（ESM 与 CJS 双构建），
 *   后端不依赖 Vue 物料包；
 * - 返回中文提示，供编辑器与接口响应直接展示。
 */

export type BusinessFieldType = 'text' | 'date' | 'select'

/** 表单字段配置的最小结构（与 BusinessForm.fields 对齐） */
export interface BusinessFormFieldInput {
  key: string
  label: string
  type: BusinessFieldType
  required?: boolean
  placeholder?: string
  options?: string[]
}

/** 姓名固定 key */
export const NAME_FIELD_KEY = 'name'
/** 手机号固定 key；历史数据可能使用 phoneNumber，不做强制改名 */
export const PHONE_FIELD_KEYS = ['phone', 'phoneNumber'] as const
/** 由系统承载的基础字段 key（不可删除、不可改 key） */
export const BASE_FIELD_KEYS = [NAME_FIELD_KEY, ...PHONE_FIELD_KEYS] as const

export const isBaseFieldKey = (key: string): boolean =>
  (BASE_FIELD_KEYS as readonly string[]).includes(key.trim())

export const isPhoneFieldKey = (key: string): boolean =>
  (PHONE_FIELD_KEYS as readonly string[]).includes(key.trim())

const toText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const FIELD_TYPE_LABELS: Record<BusinessFieldType, string> = {
  text: '文本',
  date: '日期',
  select: '下拉选择'
}

export const isBusinessFieldType = (value: unknown): value is BusinessFieldType =>
  value === 'text' || value === 'date' || value === 'select'

/**
 * 校验表单字段配置。
 *
 * 规则（与属性面板的「通过校验才写入」保持一致）：
 * - 至少一个字段；
 * - 每个字段 key 非空且在表单内唯一；
 * - 每个字段名称非空；
 * - 扩展字段之间名称不重复（基础字段名称允许被改写，不参与该比较）；
 * - 下拉字段至少一个非空选项，且选项不重复；
 * - 必须包含姓名与手机号基础字段（手机号兼容 phone / phoneNumber）。
 *
 * 返回空数组表示通过。
 */
export interface BusinessFormFieldValidationOptions {
  /**
   * 是否要求姓名 / 手机号基础字段。
   * BusinessForm 需要（提交线索依赖这两个字段）；
   * TicketExceptionForm 用自己的固定字段，不套用该限制。
   */
  requireBaseFields?: boolean
}

export function validateBusinessFormFields(
  fields: BusinessFormFieldInput[],
  options: BusinessFormFieldValidationOptions = {}
): string[] {
  const requireBaseFields = options.requireBaseFields !== false
  const issues: string[] = []

  if (!Array.isArray(fields) || fields.length === 0) {
    return ['表单至少需要一个字段']
  }

  const seenKeys = new Set<string>()
  const extraLabels = new Set<string>()

  fields.forEach((field, index) => {
    const position = `第 ${index + 1} 个字段`
    const label = toText(field.label)
    const key = toText(field.key)
    const displayName = label || position

    if (!key) {
      issues.push(`${displayName}：key 不能为空`)
    } else if (seenKeys.has(key)) {
      issues.push(`${displayName}：key「${key}」与其他字段重复`)
    } else {
      seenKeys.add(key)
    }

    if (!label) {
      issues.push(`${position}：名称不能为空`)
    } else if (!isBaseFieldKey(key)) {
      // 只有扩展字段之间检查重名；基础字段名允许被运营改成更贴合业务的叫法
      if (extraLabels.has(label)) {
        issues.push(`${label}：扩展字段名称重复`)
      }
      extraLabels.add(label)
    }

    if (!isBusinessFieldType(field.type)) {
      issues.push(`${displayName}：类型必须是${Object.values(FIELD_TYPE_LABELS).join(' / ')}之一`)
      return
    }

    if (field.type === 'select') {
      const options = (field.options ?? []).map(option => toText(option)).filter(Boolean)
      if (options.length === 0) {
        issues.push(`${displayName}：下拉选项至少需要一个`)
      } else if (new Set(options).size !== options.length) {
        issues.push(`${displayName}：下拉选项存在重复项`)
      }
    }
  })

  if (requireBaseFields) {
    if (!fields.some(field => toText(field.key) === NAME_FIELD_KEY)) {
      issues.push('缺少姓名（name）基础字段')
    }
    if (!fields.some(field => isPhoneFieldKey(toText(field.key)))) {
      issues.push('缺少手机号（phone）基础字段')
    }
  }

  return issues
}

/** 表单缺少哪些基础字段（供编辑器展示补齐入口） */
export function findMissingBaseFields(
  fields: BusinessFormFieldInput[]
): Array<{ key: string; label: string }> {
  const keys = new Set(fields.map(field => toText(field.key)))
  const missing: Array<{ key: string; label: string }> = []
  if (!keys.has(NAME_FIELD_KEY)) {
    missing.push({ key: NAME_FIELD_KEY, label: '姓名' })
  }
  if (!PHONE_FIELD_KEYS.some(key => keys.has(key))) {
    missing.push({ key: 'phone', label: '联系电话' })
  }
  return missing
}

/** 基础字段的默认形态：类型固定文本、必填 */
export const BASE_FIELD_DEFAULTS: Record<
  string,
  Pick<BusinessFormFieldInput, 'label' | 'type' | 'required'>
> = {
  name: { label: '姓名', type: 'text', required: true },
  phone: { label: '联系电话', type: 'text', required: true }
}

/* ------------------------------------------------------------------ */
/* 票据异常登记表单                                                     */
/* ------------------------------------------------------------------ */

/**
 * 票据异常的固定字段：票据编号、异常类型、问题说明。
 * 扩展字段不得占用这些 key，避免和主记录列冲突。
 */
export const TICKET_FIXED_FIELD_KEYS = ['ticketNo', 'exceptionType', 'description'] as const

export const TICKET_FIXED_FIELD_LABELS: Record<string, string> = {
  ticketNo: '票据编号',
  exceptionType: '异常类型',
  description: '问题说明'
}

/** 票据异常表单的配置结构（来自发布快照里的 props） */
export interface TicketExceptionFormConfig {
  businessCategory: string
  allowedExceptionTypes: string[]
  extraFields: BusinessFormFieldInput[]
}

const splitTypeList = (value: unknown): string[] => {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,，\n]/)
      : []
  return list.map(item => toText(item)).filter(Boolean)
}

/**
 * 读取票据异常表单配置。
 *
 * `allowedExceptionTypes` 在物料归一化后可能是一行一个的字符串，
 * 也可能仍是数组，两种形态都要能读——后端只拿到发布快照，不能再归一化一遍。
 */
export function readTicketExceptionFormConfig(
  props: Record<string, unknown>
): TicketExceptionFormConfig {
  const rawExtra = props.extraFields
  const extraSource =
    typeof rawExtra === 'string'
      ? (() => {
          try {
            return JSON.parse(rawExtra)
          } catch {
            return []
          }
        })()
      : rawExtra

  const extraFields: BusinessFormFieldInput[] = (Array.isArray(extraSource) ? extraSource : []).map(
    item => {
      const record = toRecord(item)
      return {
        key: toText(record.key),
        label: toText(record.label),
        // 保留原始类型：非法类型交给校验报错，不在这里静默替换成 text
        type: toText(record.type) as BusinessFieldType,
        required: record.required === true,
        placeholder: typeof record.placeholder === 'string' ? record.placeholder : undefined,
        options: Array.isArray(record.options)
          ? record.options.map(option => toText(option)).filter(Boolean)
          : []
      }
    }
  )

  return {
    businessCategory: toText(props.businessCategory),
    allowedExceptionTypes: splitTypeList(props.allowedExceptionTypes),
    extraFields
  }
}

/**
 * 校验票据异常表单配置，返回中文问题列表（空数组表示通过）。
 *
 * 与 BusinessForm 的差异：
 * - 不要求姓名 / 手机号，固定字段由组件自己渲染；
 * - 允许没有扩展字段（只登记票据编号、类型与说明）。
 */
export function validateTicketExceptionFormConfig(config: TicketExceptionFormConfig): string[] {
  const issues: string[] = []

  if (!config.businessCategory) {
    issues.push('业务类别不能为空')
  }
  if (config.allowedExceptionTypes.length === 0) {
    issues.push('至少需要配置一个异常类型')
  } else if (new Set(config.allowedExceptionTypes).size !== config.allowedExceptionTypes.length) {
    issues.push('异常类型存在重复项')
  }

  const seenKeys = new Set<string>()
  const seenLabels = new Set<string>()

  config.extraFields.forEach((field, index) => {
    const position = `第 ${index + 1} 个扩展字段`
    const displayName = field.label || position

    if (!field.key) {
      issues.push(`${displayName}：key 不能为空`)
    } else if ((TICKET_FIXED_FIELD_KEYS as readonly string[]).includes(field.key)) {
      issues.push(
        `${displayName}：key「${field.key}」与固定字段（${TICKET_FIXED_FIELD_LABELS[field.key]}）冲突`
      )
    } else if (seenKeys.has(field.key)) {
      issues.push(`${displayName}：key「${field.key}」与其他字段重复`)
    } else {
      seenKeys.add(field.key)
    }

    if (!field.label) {
      issues.push(`${position}：名称不能为空`)
    } else if (seenLabels.has(field.label)) {
      issues.push(`${field.label}：扩展字段名称重复`)
    } else {
      seenLabels.add(field.label)
    }

    if (!isBusinessFieldType(field.type)) {
      issues.push(`${displayName}：类型必须是文本 / 日期 / 下拉选择之一`)
      return
    }

    if (field.type === 'select') {
      const options = (field.options ?? []).map(option => toText(option)).filter(Boolean)
      if (options.length === 0) {
        issues.push(`${displayName}：下拉选项至少需要一个`)
      } else if (new Set(options).size !== options.length) {
        issues.push(`${displayName}：下拉选项存在重复项`)
      }
    }
  })

  return issues
}

/** 日期字段只接受 YYYY-MM-DD，且必须是真实存在的日期 */
export function isValidDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

/**
 * 校验票据异常的提交值（创建与补充共用）。
 *
 * - 未知扩展 key 直接拒绝：客户端不能往记录里塞快照之外的数据；
 * - `partial=true` 用于补充：只校验本次带来的字段，不要求重填其他必填项；
 * - 空字符串视为「本次未提供」，不会清空已有值（本期不提供清空操作）。
 */
export function validateTicketFormValues(
  config: TicketExceptionFormConfig,
  values: Record<string, unknown>,
  options: { partial?: boolean } = {}
): string[] {
  const issues: string[] = []
  const definitions = new Map(config.extraFields.map(field => [field.key, field]))

  Object.keys(values).forEach(key => {
    if (!definitions.has(key)) {
      issues.push(`存在未定义的字段「${key}」，请刷新页面后重试`)
    }
  })

  config.extraFields.forEach(field => {
    const raw = values[field.key]
    if (raw === undefined || raw === null) {
      if (!options.partial && field.required) {
        issues.push(`请填写「${field.label}」`)
      }
      return
    }
    if (typeof raw !== 'string') {
      issues.push(`「${field.label}」的取值必须是文本`)
      return
    }
    const text = raw.trim()
    if (!text) {
      if (!options.partial && field.required) {
        issues.push(`请填写「${field.label}」`)
      }
      return
    }
    if (field.type === 'select') {
      const options2 = (field.options ?? []).map(option => toText(option)).filter(Boolean)
      if (options2.length > 0 && !options2.includes(text)) {
        issues.push(`「${field.label}」的取值不在可选范围内`)
      }
      return
    }
    if (field.type === 'date' && !isValidDateValue(text)) {
      issues.push(`「${field.label}」请填写 YYYY-MM-DD 格式的日期`)
    }
  })

  return issues
}

/* ------------------------------------------------------------------ */
/* 统一提交审核 / 发布检查                                              */
/* ------------------------------------------------------------------ */

export type BusinessCheckSeverity = 'error' | 'warning'

/** 规则码：前后端对同一 Schema 返回相同码，便于测试与定位 */
export type BusinessCheckCode =
  | 'SCENARIO_REQUIRED'
  | 'PAGE_TITLE_EMPTY'
  | 'PAGE_NO_COMPONENT'
  | 'COMPONENT_MISSING'
  | 'FORM_FIELDS_INVALID'
  | 'LINKAGE_TARGET_MISSING'
  | 'CONTENT_EMPTY'

export interface BusinessCheckIssue {
  code: BusinessCheckCode
  severity: BusinessCheckSeverity
  /** 关联组件；页面级问题不填 */
  componentId?: string
  /** Schema 内字段路径，供编辑器定位 */
  fieldPath?: string
  /** 中文提示，直接展示给运营 */
  message: string
}

export interface BusinessCheckResult {
  /** ok = 没有 error 级问题（warning 不影响提交） */
  ok: boolean
  issues: BusinessCheckIssue[]
}

/**
 * 检查所需的 Schema 最小结构。
 *
 * 用宽松结构而不是 IPageSchemaV2：后端从数据库取出的 Schema 需要先迁移，
 * 而检查只关心这几个字段，避免为了类型把迁移逻辑耦合进纯函数。
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** 页面是否为 UUID 形式的场景 ID（空串不算） */
export const isScenarioUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value.trim())

/**
 * 读取页面的场景绑定（businessScenarioId）。
 * 页面归属用 ID 表达，名称改名不影响绑定。
 */
export function readPageScenarioBinding(
  schema: Pick<BusinessCheckSchemaLike, 'pageConfig'>
): string {
  const pageConfig = toRecord(schema.pageConfig)
  const raw = pageConfig.businessScenarioId
  return typeof raw === 'string' ? raw.trim() : ''
}

/**
 * 页面是否包含需要场景归属的业务组件：
 * 票据异常表单，或数据源为票据异常记录的远程列表。
 */
export function pageNeedsScenarioBinding(schema: BusinessCheckSchemaLike): boolean {
  const componentMap = toRecord(schema.componentMap) as Record<string, BusinessCheckComponentLike>
  return Object.values(componentMap).some(component => {
    if (component?.type === 'TicketExceptionForm') {
      return true
    }
    if (component?.type === 'BusinessList') {
      return toRecord(component.props).dataSource === 'ticketExceptions'
    }
    return false
  })
}

export interface BusinessCheckComponentLike {
  id?: string
  type?: string
  parentId?: string | null
  children?: string[]
  props?: Record<string, unknown>
}

export interface BusinessCheckSchemaLike {
  rootIds?: string[]
  componentMap?: Record<string, BusinessCheckComponentLike>
  pageConfig?: Record<string, unknown>
  linkages?: Array<{
    id?: string
    sourceComponentId?: string
    targetComponentId?: string
    enabled?: boolean
  }>
}

const TYPE_LABELS: Record<string, string> = {
  RichText: '富文本',
  Notice: '公告',
  BusinessForm: '业务表单',
  TicketExceptionForm: '票据异常登记',
  BusinessList: '业务数据列表',
  StatCard: '统计卡片'
}

const labelOfType = (type: string): string => TYPE_LABELS[type] ?? type

/** 富文本是否为空：去掉标签与 &nbsp; 后判断（`<p></p>` 视为空） */
const isBlankRichText = (html: string): boolean =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim() === ''

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

/** 表单字段：fieldsJson 优先，回落 fields（与物料 normalizeProps 一致） */
export function readBusinessFormFields(props: Record<string, unknown>): BusinessFormFieldInput[] {
  let source: unknown
  const rawJson = props.fieldsJson
  if (typeof rawJson === 'string' && rawJson.trim()) {
    try {
      source = JSON.parse(rawJson)
    } catch {
      source = props.fields
    }
  } else {
    source = props.fields
  }

  if (!Array.isArray(source)) {
    return []
  }

  return source.map(item => {
    const record = toRecord(item)
    const type = record.type
    return {
      key: typeof record.key === 'string' ? record.key : '',
      label: typeof record.label === 'string' ? record.label : '',
      type: isBusinessFieldType(type) ? type : 'text',
      required: record.required === true,
      placeholder: typeof record.placeholder === 'string' ? record.placeholder : undefined,
      options: Array.isArray(record.options)
        ? record.options.map(option => (typeof option === 'string' ? option : '')).filter(Boolean)
        : undefined
    }
  })
}

/** 公告文字：兼容 noticeList / noticelist 两种历史别名 */
export function readNoticeItemTexts(props: Record<string, unknown>): string[] {
  const list = Array.isArray(props.noticeList)
    ? props.noticeList
    : Array.isArray(props.noticelist)
      ? props.noticelist
      : []
  return list.map(item => {
    const record = toRecord(item)
    return typeof record.text === 'string' ? record.text.trim() : ''
  })
}

/**
 * 页面提交 / 发布前的业务检查（CMS 编辑器、列表入口、后端共用）。
 *
 * 只做「能不能交付」的判断，不判断内容质量：
 * - 阻断：页面标题为空、没有组件、结构引用了不存在的组件、表单字段配置非法、
 *   启用的联动指向不存在的组件；
 * - 提醒：富文本正文为空、公告全部为空这类内容完整性问题。
 *
 * 检查范围为根节点可达的组件；不可达组件不参与检查。
 */
export function checkPageForSubmit(schema: BusinessCheckSchemaLike): BusinessCheckResult {
  const issues: BusinessCheckIssue[] = []
  const componentMap = toRecord(schema.componentMap) as Record<string, BusinessCheckComponentLike>
  const rootIds = Array.isArray(schema.rootIds) ? schema.rootIds : []

  const pageName = toText(toRecord(schema.pageConfig).name)
  if (!pageName) {
    issues.push({
      code: 'PAGE_TITLE_EMPTY',
      severity: 'error',
      fieldPath: 'pageConfig.name',
      message: '页面标题不能为空'
    })
  }

  if (rootIds.length === 0) {
    issues.push({
      code: 'PAGE_NO_COMPONENT',
      severity: 'error',
      fieldPath: 'rootIds',
      message: '页面至少需要 1 个组件'
    })
  }

  // 从根节点遍历，同时记录缺失引用
  const reachable: string[] = []
  const visited = new Set<string>()

  const walk = (ids: string[], parentId?: string): void => {
    for (const id of ids) {
      const component = componentMap[id]
      if (!component) {
        issues.push({
          code: 'COMPONENT_MISSING',
          severity: 'error',
          componentId: parentId,
          fieldPath: parentId ? 'children' : 'rootIds',
          message: parentId
            ? `组件引用了不存在的子组件「${id}」`
            : `页面引用了不存在的组件「${id}」`
        })
        continue
      }
      if (visited.has(id)) {
        continue
      }
      visited.add(id)
      reachable.push(id)
      const children = Array.isArray(component.children) ? component.children : []
      if (children.length > 0) {
        walk(children, id)
      }
    }
  }

  walk(rootIds)

  // 含票据表单 / 票据远程列表的页面必须绑定有效场景：
  // 这里只做格式检查（纯函数）；场景是否存在由后端在提交审核时查询校验
  if (pageNeedsScenarioBinding(schema)) {
    const binding = readPageScenarioBinding(schema)
    if (!binding) {
      issues.push({
        code: 'SCENARIO_REQUIRED',
        severity: 'error',
        fieldPath: 'pageConfig.businessScenarioId',
        message: '业务页面未绑定业务场景，请在页面设置中选择'
      })
    } else if (!isScenarioUuid(binding)) {
      issues.push({
        code: 'SCENARIO_REQUIRED',
        severity: 'error',
        fieldPath: 'pageConfig.businessScenarioId',
        message: '业务场景绑定无效，请重新在页面设置中选择'
      })
    }
  }

  for (const id of reachable) {
    const component = componentMap[id]
    const props = toRecord(component?.props)
    const type = typeof component?.type === 'string' ? component.type : ''
    const typeLabel = labelOfType(type)

    if (type === 'TicketExceptionForm') {
      // 票据异常表单不读 BusinessForm 的 fields/fieldsJson：
      // 它的配置在 businessCategory / allowedExceptionTypes / extraFields 上
      const ticketIssues = validateTicketExceptionFormConfig(readTicketExceptionFormConfig(props))
      if (ticketIssues.length > 0) {
        issues.push({
          code: 'FORM_FIELDS_INVALID',
          severity: 'error',
          componentId: id,
          fieldPath: 'extraFields',
          message: `${typeLabel}配置不合法：${ticketIssues.join('；')}`
        })
      }
      continue
    }

    if (type === 'BusinessForm') {
      const fieldIssues = validateBusinessFormFields(readBusinessFormFields(props), {
        requireBaseFields: true
      })
      if (fieldIssues.length > 0) {
        issues.push({
          code: 'FORM_FIELDS_INVALID',
          severity: 'error',
          componentId: id,
          fieldPath: 'fields',
          message: `${typeLabel}字段配置不合法：${fieldIssues.join('；')}`
        })
      }
      continue
    }

    if (type === 'RichText') {
      if (isBlankRichText(toText(props.content))) {
        issues.push({
          code: 'CONTENT_EMPTY',
          severity: 'warning',
          componentId: id,
          fieldPath: 'content',
          message: `${typeLabel}正文为空，建议补充后再提交`
        })
      }
      continue
    }

    if (type === 'Notice') {
      const texts = readNoticeItemTexts(props)
      if (texts.length === 0 || texts.every(text => !text)) {
        issues.push({
          code: 'CONTENT_EMPTY',
          severity: 'warning',
          componentId: id,
          fieldPath: 'noticeList',
          message: `${typeLabel}内容为空，建议补充后再提交`
        })
      }
    }
  }

  for (const linkage of schema.linkages ?? []) {
    if (!linkage || linkage.enabled !== true) {
      continue
    }
    const targetId = typeof linkage.targetComponentId === 'string' ? linkage.targetComponentId : ''
    if (targetId && !componentMap[targetId]) {
      issues.push({
        code: 'LINKAGE_TARGET_MISSING',
        severity: 'error',
        componentId:
          typeof linkage.sourceComponentId === 'string' ? linkage.sourceComponentId : undefined,
        fieldPath: 'linkage',
        message: `联动规则指向不存在的组件「${targetId}」`
      })
    }
  }

  return {
    ok: !issues.some(issue => issue.severity === 'error'),
    issues
  }
}

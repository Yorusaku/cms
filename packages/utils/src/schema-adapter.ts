import type {
  IPageSchemaV1,
  IPageSchemaV2,
  IComponentSchemaV1,
  IComponentSchemaV2,
  IActionSchema
} from '@cms/types'

/**
 * 数据结构迁移适配器
 * 将 V1 格式的页面 Schema 转换为 V2 格式
 * 支持零历史包袱的向下兼容
 */

/**
 * 判断是否为 V1 格式数据
 */
function isV1Schema(data: any): data is IPageSchemaV1 {
  return (
    data &&
    typeof data === 'object' &&
    !data.version && // V2 有 version 字段
    Array.isArray(data.components) // V1 使用 components 数组
  )
}

/**
 * 判断是否为 V2 格式数据
 */
function isV2Schema(data: any): data is IPageSchemaV2 {
  return (
    data &&
    typeof data === 'object' &&
    data.version === '2.0.0' &&
    typeof data.componentMap === 'object' &&
    Array.isArray(data.rootIds)
  )
}

/**
 * 将 V1 组件转换为 V2 组件
 */
function convertComponentV1ToV2(component: IComponentSchemaV1): IComponentSchemaV2 {
  return {
    // 基础字段直接继承
    id: component.id,
    type: component.type,
    props: component.props,
    styles: component.styles,

    // V2 新增字段
    parentId: null, // V1 数据扁平化，所有组件 parentId 为 null
    children: [], // V1 无嵌套关系，默认为空数组

    // 扩展性字段初始化
    events: undefined,
    condition: true, // 默认显示
    track: undefined,
    state: undefined
  }
}

/**
 * 创建默认的页面配置
 */
function createDefaultPageConfig(): Record<string, unknown> {
  return {
    name: '未命名页面',
    backgroundColor: '#ffffff',
    title: '新页面'
  }
}

/**
 * 主要的 Schema 迁移函数
 * @param rawSchema 原始数据（可能是 V1 或 V2 格式）
 * @returns V2 格式的页面 Schema
 */
export function migrateSchema(rawSchema: any): IPageSchemaV2 {
  // 如果已经是 V2 格式，直接返回
  if (isV2Schema(rawSchema)) {
    return rawSchema
  }

  // 如果是 V1 格式，进行转换
  if (isV1Schema(rawSchema)) {
    const v1Schema: IPageSchemaV1 = rawSchema

    // 转换组件数组为 Map 结构
    const componentMap: Record<string, IComponentSchemaV2> = {}
    const rootIds: string[] = []

    // 遍历并转换每个组件
    v1Schema.components.forEach((component: IComponentSchemaV1) => {
      const v2Component = convertComponentV1ToV2(component)
      componentMap[v2Component.id] = v2Component
      rootIds.push(v2Component.id) // V1 所有组件都是根节点
    })

    // 构造 V2 Schema
    const v2Schema: IPageSchemaV2 = {
      version: '2.0.0',
      pageConfig: v1Schema.pageConfig || createDefaultPageConfig(),
      componentMap,
      rootIds,
      state: undefined // V1 无页面状态概念
    }

    return v2Schema
  }

  // 如果是未知格式，创建空的 V2 结构
  console.warn('未知的 Schema 格式，创建默认 V2 结构')
  return {
    version: '2.0.0',
    pageConfig: createDefaultPageConfig(),
    componentMap: {},
    rootIds: [],
    state: undefined
  }
}

/**
 * 反向迁移：将 V2 Schema 转换为 V1 格式（用于向后兼容）
 */
export function migrateSchemaToV1(v2Schema: IPageSchemaV2): IPageSchemaV1 {
  // 将 componentMap 转换回数组
  const components: IComponentSchemaV1[] = v2Schema.rootIds
    .map((id: string) => v2Schema.componentMap[id])
    .filter(Boolean) // 过滤掉可能不存在的组件
    .map((component: IComponentSchemaV2) => ({
      id: component.id,
      type: component.type,
      props: component.props,
      styles: component.styles
    }))

  return {
    pageConfig: v2Schema.pageConfig,
    components
  }
}

/**
 * 工具函数：验证 Schema 版本
 */
export function getSchemaVersion(schema: any): 'v1' | 'v2' | 'unknown' {
  if (isV2Schema(schema)) return 'v2'
  if (isV1Schema(schema)) return 'v1'
  return 'unknown'
}

/**
 * 工具函数：创建空的 V2 Schema
 */
export function createEmptyV2Schema(): IPageSchemaV2 {
  return {
    version: '2.0.0',
    pageConfig: createDefaultPageConfig(),
    componentMap: {},
    rootIds: [],
    state: undefined
  }
}

// 导出类型供外部使用
export type { IPageSchemaV1, IPageSchemaV2, IComponentSchemaV1, IComponentSchemaV2, IActionSchema }

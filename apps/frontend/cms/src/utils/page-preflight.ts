import { checkPageForSubmit, type BusinessCheckIssue } from '@cms/types'
import type { IPageSchemaV2 } from '@cms/types'

/**
 * 编辑器侧的页面检查入口。
 *
 * 实际规则由 `@cms/types` 的 `checkPageForSubmit` 提供 —— 与后端提交审核 / 发布
 * 使用同一份实现，保证「前端拦下的问题后端也拦，前端放过的后端也放过」。
 *
 * 历史实现按属性面板的控件类型推断必填（text/textarea 全当必填），会把说明、
 * 辅助文案这类可选内容误判为错误。这里改为只检查明确的业务规则：
 * 页面标题、组件与引用完整性、表单字段配置、启用的联动目标。
 */
export type PreflightIssue = BusinessCheckIssue

export interface PreflightResult {
  /** 是否没有阻断级问题（warning 不影响） */
  ok: boolean
  issues: PreflightIssue[]
  errorCount: number
  warningCount: number
}

export const runPagePreflight = (schema: IPageSchemaV2): PreflightResult => {
  const { ok, issues } = checkPageForSubmit(schema)

  return {
    ok,
    issues,
    errorCount: issues.filter(issue => issue.severity === 'error').length,
    warningCount: issues.filter(issue => issue.severity === 'warning').length
  }
}

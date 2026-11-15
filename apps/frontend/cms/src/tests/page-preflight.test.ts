import { describe, expect, it } from 'vitest'
import type { IPageSchemaV2 } from '@cms/types'
import { runPagePreflight } from '@/utils/page-preflight'

/**
 * 编辑器侧页面检查。
 *
 * 规则由 @cms/types 的 checkPageForSubmit 提供（与后端同一份实现），
 * 这里验证编辑器入口的适配：结果形状、计数，以及「不再按控件类型推断必填」。
 */
const makeSchema = (
  componentMap: IPageSchemaV2['componentMap'],
  overrides: Partial<IPageSchemaV2> = {}
): IPageSchemaV2 => ({
  version: '2.0.0',
  pageConfig: { name: '测试页面' },
  componentMap,
  rootIds: Object.keys(componentMap),
  ...overrides
})

const statCard = (props: Record<string, unknown>) => ({
  id: 'stat-1',
  type: 'StatCard',
  parentId: null,
  children: [],
  props,
  styles: {}
})

const richText = (content: string) => ({
  id: 'rich-1',
  type: 'RichText',
  parentId: null,
  children: [],
  props: { content },
  styles: {}
})

describe('PagePreflight', () => {
  it('说明类文本为空不再拦截（不按控件类型推断必填）', () => {
    const result = runPagePreflight(
      makeSchema({
        'stat-1': statCard({
          title: '待处理事项',
          value: 12,
          description: '',
          icon: '数'
        })
      })
    )

    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('数字指标值不会被当成空字符串', () => {
    const result = runPagePreflight(
      makeSchema({
        'stat-1': statCard({ title: '待处理', value: 0, description: '本周' })
      })
    )

    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('页面标题为空时阻断，并给出 error 计数', () => {
    const result = runPagePreflight(
      makeSchema({ 'rich-1': richText('<p>正文</p>') }, { pageConfig: { name: '' } })
    )

    expect(result.ok).toBe(false)
    expect(result.errorCount).toBe(1)
    expect(result.issues[0].code).toBe('PAGE_TITLE_EMPTY')
    expect(result.issues[0].severity).toBe('error')
  })

  it('没有组件时阻断', () => {
    const result = runPagePreflight(makeSchema({}, { rootIds: [], componentMap: {} }))

    expect(result.ok).toBe(false)
    expect(result.issues.some(issue => issue.code === 'PAGE_NO_COMPONENT')).toBe(true)
  })

  it('表单字段配置非法时阻断，并带组件 id 供定位', () => {
    const result = runPagePreflight(
      makeSchema({
        'form-1': {
          id: 'form-1',
          type: 'BusinessForm',
          parentId: null,
          children: [],
          props: {
            fields: [{ key: 'name', label: '姓名', type: 'text', required: true }]
          },
          styles: {}
        }
      })
    )

    expect(result.ok).toBe(false)
    const issue = result.issues.find(item => item.code === 'FORM_FIELDS_INVALID')
    expect(issue?.componentId).toBe('form-1')
  })

  it('空正文只算 warning，不阻断', () => {
    const result = runPagePreflight(makeSchema({ 'rich-1': richText('<p></p>') }))

    expect(result.ok).toBe(true)
    expect(result.errorCount).toBe(0)
    expect(result.warningCount).toBe(1)
    expect(result.issues[0]).toMatchObject({
      code: 'CONTENT_EMPTY',
      severity: 'warning',
      componentId: 'rich-1'
    })
  })
})

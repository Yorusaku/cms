import { describe, expect, it } from 'vitest'
import { checkPageForSubmit, type BusinessCheckSchemaLike } from '@cms/types'

/**
 * 统一提交/发布检查（CMS 与后端共用同一实现）。
 *
 * 只判断「能不能交付」：
 * - error 阻断提交/发布；
 * - warning 只提醒，不影响 ok。
 */
const makeSchema = (overrides: Partial<BusinessCheckSchemaLike> = {}): BusinessCheckSchemaLike => ({
  pageConfig: { name: '业务页面' },
  rootIds: ['rich-1'],
  componentMap: {
    'rich-1': {
      id: 'rich-1',
      type: 'RichText',
      children: [],
      props: { content: '<p>正文</p>' }
    }
  },
  ...overrides
})

describe('checkPageForSubmit', () => {
  it('完整页面通过检查', () => {
    const result = checkPageForSubmit(makeSchema())
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('页面标题为空时阻断', () => {
    const result = checkPageForSubmit(makeSchema({ pageConfig: { name: '  ' } }))
    expect(result.ok).toBe(false)
    expect(result.issues[0]).toMatchObject({
      code: 'PAGE_TITLE_EMPTY',
      severity: 'error',
      fieldPath: 'pageConfig.name'
    })
  })

  it('没有组件时阻断', () => {
    const result = checkPageForSubmit(makeSchema({ rootIds: [], componentMap: {} }))
    expect(result.ok).toBe(false)
    expect(result.issues.some(issue => issue.code === 'PAGE_NO_COMPONENT')).toBe(true)
  })

  it('根节点或子节点引用不存在时阻断', () => {
    const missingRoot = checkPageForSubmit(makeSchema({ rootIds: ['rich-1', 'ghost'] }))
    expect(missingRoot.ok).toBe(false)
    expect(missingRoot.issues.some(issue => issue.code === 'COMPONENT_MISSING')).toBe(true)

    const missingChild = checkPageForSubmit(
      makeSchema({
        rootIds: ['section-1'],
        componentMap: {
          'section-1': {
            id: 'section-1',
            type: 'RichText',
            children: ['ghost-child'],
            props: { content: '<p>x</p>' }
          }
        }
      })
    )
    expect(missingChild.ok).toBe(false)
    expect(
      missingChild.issues.some(
        issue => issue.code === 'COMPONENT_MISSING' && issue.componentId === 'section-1'
      )
    ).toBe(true)
  })

  it('表单字段配置非法时阻断，复用字段校验规则', () => {
    const result = checkPageForSubmit(
      makeSchema({
        rootIds: ['form-1'],
        componentMap: {
          'form-1': {
            id: 'form-1',
            type: 'BusinessForm',
            children: [],
            props: {
              fields: [{ key: 'name', label: '姓名', type: 'text', required: true }]
            }
          }
        }
      })
    )

    expect(result.ok).toBe(false)
    const issue = result.issues.find(item => item.code === 'FORM_FIELDS_INVALID')
    expect(issue).toBeTruthy()
    expect(issue!.componentId).toBe('form-1')
    expect(issue!.message).toContain('手机号')
  })

  it('启用的联动指向不存在组件时阻断，未启用不报', () => {
    const enabled = checkPageForSubmit(
      makeSchema({
        linkages: [
          {
            id: 'l1',
            sourceComponentId: 'rich-1',
            targetComponentId: 'ghost',
            enabled: true
          }
        ]
      })
    )
    expect(enabled.ok).toBe(false)
    expect(enabled.issues.some(issue => issue.code === 'LINKAGE_TARGET_MISSING')).toBe(true)

    const disabled = checkPageForSubmit(
      makeSchema({
        linkages: [
          {
            id: 'l1',
            sourceComponentId: 'rich-1',
            targetComponentId: 'ghost',
            enabled: false
          }
        ]
      })
    )
    expect(disabled.ok).toBe(true)
  })

  it('空正文与空公告只是提醒，不阻断提交', () => {
    const result = checkPageForSubmit(
      makeSchema({
        rootIds: ['rich-1', 'notice-1'],
        componentMap: {
          'rich-1': {
            id: 'rich-1',
            type: 'RichText',
            children: [],
            props: { content: '<p></p>' }
          },
          'notice-1': {
            id: 'notice-1',
            type: 'Notice',
            children: [],
            props: { noticeList: [{ text: '' }, { text: '  ' }] }
          }
        }
      })
    )

    expect(result.ok).toBe(true)
    const warnings = result.issues.filter(issue => issue.severity === 'warning')
    expect(warnings).toHaveLength(2)
    expect(warnings.every(issue => issue.code === 'CONTENT_EMPTY')).toBe(true)
  })

  it('公告有一条非空即不提醒，兼容 noticelist 别名', () => {
    const result = checkPageForSubmit(
      makeSchema({
        rootIds: ['notice-1'],
        componentMap: {
          'notice-1': {
            id: 'notice-1',
            type: 'Notice',
            children: [],
            props: { noticelist: [{ text: '' }, { text: '有内容' }] }
          }
        }
      })
    )

    expect(result.issues).toEqual([])
  })

  it('只检查根节点可达的组件，不可达组件不参与', () => {
    const result = checkPageForSubmit(
      makeSchema({
        rootIds: ['rich-1'],
        componentMap: {
          'rich-1': {
            id: 'rich-1',
            type: 'RichText',
            children: [],
            props: { content: '<p>正文</p>' }
          },
          // 不可达的坏表单：不检查
          orphan: {
            id: 'orphan',
            type: 'BusinessForm',
            children: [],
            props: { fields: [] }
          }
        }
      })
    )

    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('表单字段优先读 fieldsJson，非法 JSON 时回落到 fields', () => {
    const fromJson = checkPageForSubmit(
      makeSchema({
        rootIds: ['form-1'],
        componentMap: {
          'form-1': {
            id: 'form-1',
            type: 'BusinessForm',
            children: [],
            props: {
              fields: [],
              fieldsJson: JSON.stringify([
                { key: 'name', label: '姓名', type: 'text', required: true },
                { key: 'phone', label: '电话', type: 'text', required: true }
              ])
            }
          }
        }
      })
    )
    expect(fromJson.ok).toBe(true)

    const brokenJson = checkPageForSubmit(
      makeSchema({
        rootIds: ['form-1'],
        componentMap: {
          'form-1': {
            id: 'form-1',
            type: 'BusinessForm',
            children: [],
            props: {
              fields: [
                { key: 'name', label: '姓名', type: 'text', required: true },
                { key: 'phone', label: '电话', type: 'text', required: true }
              ],
              fieldsJson: '{bad json'
            }
          }
        }
      })
    )
    expect(brokenJson.ok).toBe(true)
  })
})

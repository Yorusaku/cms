import { describe, expect, it } from 'vitest'
import type { IPageSchemaV2 } from '@cms/types'
import { getMaterialDefaults } from '@cms/ui'
import { runPagePreflight } from '../src/utils/page-preflight'

const createBaseSchema = (): IPageSchemaV2 => ({
  version: '2.0.0',
  pageConfig: {
    name: '测试页面',
    shareDesc: '',
    shareImage: '',
    backgroundColor: '',
    backgroundImage: '',
    backgroundPosition: 'top',
    cover: ''
  },
  componentMap: {},
  rootIds: [],
  state: undefined
})

describe('page preflight', () => {
  it('blocks empty page', () => {
    const schema = createBaseSchema()
    schema.pageConfig.name = ''

    const result = runPagePreflight(schema)
    expect(result.ok).toBe(false)
    expect(result.issues.some(issue => issue.message.includes('页面标题'))).toBe(true)
    expect(result.issues.some(issue => issue.message.includes('至少需要 1 个组件'))).toBe(true)
  })

  it('passes a valid rich text page', () => {
    const schema = createBaseSchema()
    schema.componentMap.rich_1 = {
      id: 'rich_1',
      type: 'RichText',
      props: getMaterialDefaults('RichText'),
      styles: {},
      parentId: null,
      children: [],
      condition: true
    }
    schema.rootIds = ['rich_1']

    const result = runPagePreflight(schema)
    expect(result.ok).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('不再按控件类型推断必填：轮播图片为空不阻断提交', () => {
    const schema = createBaseSchema()
    schema.componentMap.carousel_1 = {
      id: 'carousel_1',
      type: 'Carousel',
      props: {
        imageList: [
          {
            imageUrl: '',
            text: '',
            link: ''
          }
        ]
      },
      styles: {},
      parentId: null,
      children: [],
      condition: true
    }
    schema.rootIds = ['carousel_1']

    // 历史实现会把「属性面板里出现的文本框」一律当作必填，
    // 导致说明、辅助文案这类可选内容被误拦截。
    // 现在只拦明确的业务规则（标题 / 组件 / 引用 / 表单字段 / 联动目标），
    // 内容完整性以提醒形式呈现。
    const result = runPagePreflight(schema)
    expect(result.ok).toBe(true)
    expect(result.errorCount).toBe(0)
  })
})

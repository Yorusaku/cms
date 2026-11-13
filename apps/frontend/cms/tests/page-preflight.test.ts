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

  it('reports key field issues on invalid material props', () => {
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

    const result = runPagePreflight(schema)
    expect(result.ok).toBe(false)
    expect(result.issues.some(issue => issue.message.includes('缺少图片'))).toBe(true)
  })
})

describe('轮播图发布前的链接校验', () => {
  it.each([
    { label: '缺失链接', link: null, ok: false },
    { label: '字符串链接', link: '/activity', ok: true },
    { label: '空对象链接', link: { clickType: 1, data: { url: '' } }, ok: false },
    { label: '对象链接', link: { clickType: 1, data: { url: '/activity' } }, ok: true }
  ])('$label', ({ link, ok }) => {
    const schema = createBaseSchema()
    schema.componentMap.carousel = {
      id: 'carousel',
      type: 'Carousel',
      props: {
        ...getMaterialDefaults('Carousel'),
        imageList: [{ imageUrl: '/banner.png', text: '活动', link }]
      },
      styles: {},
      parentId: null,
      children: [],
      condition: true
    }
    schema.rootIds = ['carousel']
    const result = runPagePreflight(schema)
    expect(result.ok).toBe(ok)
    if (ok) expect(result.issues).toEqual([])
    else
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          fieldPath: 'imageList',
          message: expect.stringContaining('缺少有效链接')
        })
      )
  })
})

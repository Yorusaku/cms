import { describe, expect, it } from 'vitest'
import {
  getMaterialDefaults,
  resolveMaterialDefinition,
  resolveMaterialRuntimeProps
} from '../index'

describe('历史物料属性兼容', () => {
  it('轮播历史字段归一化，保留 0 和 false，链接转为编辑器结构', () => {
    const props = resolveMaterialDefinition('carousel')?.normalizeProps?.({
      piclist: [{ imageUrl: '/banner.png', text: '活动', link: '/activity' }],
      interval: 0,
      showIndicators: false,
      showArrows: false,
      loop: false,
      imageFit: ''
    })
    expect(props).toMatchObject({
      imageList: [
        {
          imageUrl: '/banner.png',
          text: '活动',
          link: { clickType: 1, data: { url: '/activity' } }
        }
      ],
      autoplay: 0,
      showIndicators: false,
      showArrows: false,
      loop: false,
      imageFit: 'cover'
    })
  })

  it('导航历史图片列表能归一化，并向运行时提供字符串链接', () => {
    const props = resolveMaterialDefinition('imagenav')?.normalizeProps?.({
      imageList: [{ imageUrl: '/icon.png', text: '入口', link: '/entry' }],
      columnPadding: 0
    })
    expect(props).toMatchObject({ columnPadding: 0, rowPadding: 20 })
    expect(resolveMaterialRuntimeProps('ImageNav', props ?? {})).toMatchObject({
      list: [{ imageUrl: '/icon.png', text: '入口', link: '/entry' }]
    })
    expect(
      resolveMaterialRuntimeProps('ImageNav', { list: [{ text: '旧链接', link: '/legacy' }] })
    ).toEqual({
      list: [{ text: '旧链接', link: '/legacy' }]
    })
  })

  it('商品兼容历史字段、数字字符串与购买开关，不改写输入', () => {
    const input = {
      productList: [
        { productId: 'sku-1', imgUrl: '/product.png', price: '12.50', link: '/product' }
      ],
      listStyle: 'grid',
      purchase: '1',
      exchangePriceColor: '#123456'
    }
    const before = structuredClone(input)
    const props = resolveMaterialDefinition('product')?.normalizeProps?.(input)
    expect(props).toMatchObject({ layoutType: 'grid', showPurchase: true, purchase: 1 })
    expect(resolveMaterialRuntimeProps('Product', props ?? {})).toEqual({
      list: [
        {
          id: 'sku-1',
          imageUrl: '/product.png',
          imgUrl: '/product.png',
          brand: '',
          categoryNames: '',
          price: 12.5,
          link: { clickType: 1, data: { url: '/product' } }
        }
      ],
      layoutType: 'grid',
      showPurchase: true,
      priceColor: '#123456'
    })
    expect(input).toEqual(before)
  })

  it('默认属性相互隔离，未知物料保持原属性', () => {
    const defaults = getMaterialDefaults('Carousel')
    expect(defaults).toHaveProperty('imageList.0.text', '轮播1')
    Reflect.set(defaults, 'imageList', [])
    expect(getMaterialDefaults('Carousel')).toHaveProperty('imageList.0.text', '轮播1')
    expect(getMaterialDefaults('unknown-material')).toEqual({})
    const props = { title: '自定义物料' }
    expect(resolveMaterialRuntimeProps('unknown-material', props)).toBe(props)
  })
})

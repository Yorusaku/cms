/*
 * 物料配置 - 静态配置抽离
 */
import { defineAsyncComponent } from 'vue'
import { NoticeDefaultConfig } from '@cms/ui'
import { componentGroups } from '../../../config/component-groups'

// 组件映射表
export const componentMap: Record<string, any> = {
  // 标准大写格式
  Carousel: defineAsyncComponent(() => import('@cms/ui').then(m => m.CarouselBlock)),
  Dialog: defineAsyncComponent(() => import('@cms/ui').then(m => m.DialogBlock)),
  ImageNav: defineAsyncComponent(() => import('@cms/ui').then(m => m.ImageNavBlock)),
  Notice: defineAsyncComponent(() => import('@cms/ui').then(m => m.NoticeBlock)),
  Product: defineAsyncComponent(() => import('@cms/ui').then(m => m.ProductBlock)),
  RichText: defineAsyncComponent(() => import('@cms/ui').then(m => m.RichTextBlock)),
  Slider: defineAsyncComponent(() => import('@cms/ui').then(m => m.SliderBlock)),
  AssistLine: defineAsyncComponent(() => import('@cms/ui').then(m => m.AssistLineBlock)),
  FloatLayer: defineAsyncComponent(() => import('@cms/ui').then(m => m.FloatLayerBlock)),
  OnlineService: defineAsyncComponent(() => import('@cms/ui').then(m => m.OnlineServiceBlock)),
  CubeSelection: defineAsyncComponent(() => import('@cms/ui').then(m => m.CubeSelectionBlock)),

  // 兼容旧版小写格式
  carousel: defineAsyncComponent(() => import('@cms/ui').then(m => m.CarouselBlock)),
  dialog: defineAsyncComponent(() => import('@cms/ui').then(m => m.DialogBlock)),
  imagenav: defineAsyncComponent(() => import('@cms/ui').then(m => m.ImageNavBlock)),
  notice: defineAsyncComponent(() => import('@cms/ui').then(m => m.NoticeBlock)),
  product: defineAsyncComponent(() => import('@cms/ui').then(m => m.ProductBlock)),
  richtext: defineAsyncComponent(() => import('@cms/ui').then(m => m.RichTextBlock)),
  slider: defineAsyncComponent(() => import('@cms/ui').then(m => m.SliderBlock)),
  assistline: defineAsyncComponent(() => import('@cms/ui').then(m => m.AssistLineBlock)),
  floatlayer: defineAsyncComponent(() => import('@cms/ui').then(m => m.FloatLayerBlock)),
  onlineservice: defineAsyncComponent(() => import('@cms/ui').then(m => m.OnlineServiceBlock)),
  cubeselection: defineAsyncComponent(() => import('@cms/ui').then(m => m.CubeSelectionBlock))
}

// 配置组件映射表
export const configMap: Record<string, any> = {
  // 标准大写格式
  Notice: defineAsyncComponent(() => import('../../../components/configs/NoticeConfig.vue')),
  Carousel: defineAsyncComponent(() => import('../../../components/configs/CarouselConfig.vue')),
  Dialog: defineAsyncComponent(() => import('../../../components/configs/DialogConfig.vue')),
  ImageNav: defineAsyncComponent(() => import('../../../components/configs/ImageNavConfig.vue')),
  Product: defineAsyncComponent(() => import('../../../components/configs/ProductConfig.vue')),
  RichText: defineAsyncComponent(() => import('../../../components/configs/RichTextConfig.vue')),
  Slider: defineAsyncComponent(() => import('../../../components/configs/SliderConfig.vue')),
  AssistLine: defineAsyncComponent(
    () => import('../../../components/configs/AssistLineConfig.vue')
  ),
  FloatLayer: defineAsyncComponent(
    () => import('../../../components/configs/FloatLayerConfig.vue')
  ),
  OnlineService: defineAsyncComponent(
    () => import('../../../components/configs/OnlineServiceConfig.vue')
  ),
  CubeSelection: defineAsyncComponent(
    () => import('../../../components/configs/CubeSelectionConfig.vue')
  ),

  // 兼容旧版小写格式
  notice: defineAsyncComponent(() => import('../../../components/configs/NoticeConfig.vue')),
  carousel: defineAsyncComponent(() => import('../../../components/configs/CarouselConfig.vue')),
  dialog: defineAsyncComponent(() => import('../../../components/configs/DialogConfig.vue')),
  imagenav: defineAsyncComponent(() => import('../../../components/configs/ImageNavConfig.vue')),
  product: defineAsyncComponent(() => import('../../../components/configs/ProductConfig.vue')),
  richtext: defineAsyncComponent(() => import('../../../components/configs/RichTextConfig.vue')),
  slider: defineAsyncComponent(() => import('../../../components/configs/SliderConfig.vue')),
  assistline: defineAsyncComponent(
    () => import('../../../components/configs/AssistLineConfig.vue')
  ),
  floatlayer: defineAsyncComponent(
    () => import('../../../components/configs/FloatLayerConfig.vue')
  ),
  onlineservice: defineAsyncComponent(
    () => import('../../../components/configs/OnlineServiceConfig.vue')
  ),
  cubeselection: defineAsyncComponent(
    () => import('../../../components/configs/CubeSelectionConfig.vue')
  )
}

// 组件默认配置
export const componentDefaultConfigs = {
  Notice: NoticeDefaultConfig.props,
  Carousel: {
    imageList: [],
    autoPlay: true,
    interval: 3000,
    showIndicators: true
  },
  Dialog: {
    visible: false,
    title: '提示',
    content: '这是一个对话框',
    showActions: true,
    showCancel: true,
    cancelText: '取消',
    confirmText: '确定',
    backgroundColor: '#ffffff',
    titleColor: '#1f2937',
    contentColor: '#6b7280',
    confirmColor: '#3b82f6'
  },
  ImageNav: {
    list: [],
    columnPadding: 0,
    rowPadding: 0,
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderRadius: 0,
    defaultImage: 'https://via.placeholder.com/44'
  },
  Product: {
    list: [],
    layoutType: 'listDetail',
    showPurchase: false,
    priceColor: '#DD1A21'
  },
  RichText: {
    content:
      '<p>你可以对文字进行<strong>加粗</strong>、<em>斜体</em>、<span style="text-decoration: underline;">下划线</span>、<span style="text-decoration: line-through;">删除线</span>、文字<span style="color: rgb(0, 176, 240);">颜色</span>、<span style="background-color: rgb(255, 192, 0); color: rgb(255, 255, 255);">背景色</span>、以及字号<span style="font-size: 20px;">大</span><span style="font-size: 14px;">小</span>等简单排版操作。</p>',
    backgroundColor: '#ffffff',
    padding: '10px 10px 0'
  },
  Slider: {
    list: [],
    backgroundColor: '#ffffff',
    padding: [15, 15],
    imageMargin: 15,
    imageWidth: 100,
    imageHeight: 80,
    borderRadius: 0,
    defaultImage: 'https://via.placeholder.com/100x80'
  },
  AssistLine: {
    backgroundColor: '#ffffff',
    defBackgroundColor: '#ffffff',
    height: 1,
    paddingVisible: false,
    borderColor: '#e5e5e5',
    defBorderColor: '#e5e5e5',
    type: 1,
    borderStyle: 'solid'
  },
  FloatLayer: {
    width: 56,
    bottom: 100,
    zIndex: 11,
    right: 24,
    imageUrl: '',
    defaultImage: 'https://via.placeholder.com/56',
    hideByPageScroll: false
  },
  OnlineService: {
    bottom: 24,
    right: 24,
    zIndex: 11,
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    serviceImage: 'https://image.fuchuang.com/prod/3d488567_icon_kf20201116164901.png',
    text: '客服'
  }
}

// 物料配置聚合
export const MATERIAL_CONFIG = {
  componentGroups,
  componentMap,
  configMap,
  componentDefaultConfigs
}

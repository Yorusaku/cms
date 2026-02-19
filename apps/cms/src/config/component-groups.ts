/*
 * 组件分组配置 - 用于Decorate页面左侧组件列表
 */

// 图标导入
import carouselIcon from '@/assets/img/list_ico/swiper.png'
import navigationIcon from '@/assets/img/list_ico/navigation.png'
import noticeIcon from '@/assets/img/list_ico/notice.png'
import magicIcon from '@/assets/img/list_ico/magic_layout.png'
import textIcon from '@/assets/img/list_ico/page_title.png'
import assistIcon from '@/assets/img/list_ico/assist_blank.png'
import floatIcon from '@/assets/img/list_ico/spike.png'
import serviceIcon from '@/assets/img/list_ico/product_search.png'
import sliderIcon from '@/assets/img/list_ico/time_limit_sale.png'
import dialogIcon from '@/assets/img/list_ico/pin-tuan.png'
import productIcon from '@/assets/img/list_ico/product_list.png'

export interface ComponentItem {
  type: string
  label: string
  icon: string
  max: number // 最大可添加数量
}

export interface ComponentGroup {
  title: string
  components: ComponentItem[]
}

// 组件分组配置
export const componentGroups: ComponentGroup[] = [
  {
    title: '基础组件',
    components: [
      {
        type: 'Carousel',
        label: '轮播图',
        icon: carouselIcon,
        max: 50
      },
      {
        type: 'ImageNav',
        label: '图文导航',
        icon: navigationIcon,
        max: 50
      },
      {
        type: 'Notice',
        label: '公告',
        icon: noticeIcon,
        max: 1 // 公告只能添加一个
      },
      {
        type: 'CubeSelection',
        label: '魔方',
        icon: magicIcon,
        max: 50
      },
      {
        type: 'RichText',
        label: '富文本',
        icon: textIcon,
        max: 50
      },
      {
        type: 'AssistLine',
        label: '辅助线',
        icon: assistIcon,
        max: 50
      }
    ]
  },
  {
    title: '营销组件',
    components: [
      {
        type: 'FloatLayer',
        label: '浮动层',
        icon: floatIcon,
        max: 1 // 浮动层只能添加一个
      },
      {
        type: 'OnlineService',
        label: '在线客服',
        icon: serviceIcon,
        max: 1 // 在线客服只能添加一个
      },
      {
        type: 'Slider',
        label: '横向滑动',
        icon: sliderIcon,
        max: 50
      },
      {
        type: 'Dialog',
        label: '弹窗',
        icon: dialogIcon,
        max: 1 // 弹窗只能添加一个
      },
      {
        type: 'Product',
        label: '商品',
        icon: productIcon,
        max: 50
      }
    ]
  }
]

// 扁平化的组件列表（用于兼容现有逻辑）
export const flatComponentList: ComponentItem[] = componentGroups.flatMap(group => group.components)

// 获取组件的最大数量限制
export const getComponentMaxCount = (type: string): number => {
  const component = flatComponentList.find(item => item.type === type)
  return component ? component.max : 50
}

// 检查是否可以继续添加组件
export const canAddComponent = (type: string, currentCount: number): boolean => {
  const maxCount = getComponentMaxCount(type)
  return currentCount < maxCount
}

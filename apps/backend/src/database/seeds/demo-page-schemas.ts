import type { IPageSchemaV2, IComponentSchemaV2 } from '@cms/types'

// 演示页组件配置：type 必须为 packages/ui materialRegistry 中真实类型
// （Carousel/ImageNav/RichText/Notice/CubeSelection/AssistLine/FloatLayer/OnlineService/Slider/Dialog/Product/LeadForm）。
// 不要使用模板 seed 中的 ComTitle/CmsButton/*Block 等非 registry 类型名，
// 否则 CRS RenderNode 会渲染 FallbackComponent（“未找到对应物料组件”）。

let _demoCompCounter = 0
const demoCid = (prefix: string) =>
  prefix + '-' + String(++_demoCompCounter) + '-' + Date.now().toString(36)

interface DemoComponentSeed {
  type: string
  props: Record<string, unknown>
}

const DEMO_PAGE_COMPONENTS: Record<string, DemoComponentSeed[]> = {
  '618 年中大促': [
    {
      type: 'Carousel',
      props: {
        imageList: [{ imageUrl: '', text: '618 年中大促', link: { clickType: 0, data: null } }],
        autoplay: 3000,
        showIndicators: true,
        showArrows: true,
        height: '200px',
        backgroundColor: '#f5f7fa',
        imageFit: 'cover',
        loop: true
      }
    },
    {
      type: 'RichText',
      props: {
        content:
          '<p><strong>年中大促，全场低至 5 折</strong></p><p>爆款好物限时抢购，先到先得！</p>',
        backgroundColor: '#ffffff',
        padding: '10px 10px 0'
      }
    },
    {
      type: 'Notice',
      props: {
        noticeList: [
          { text: '618 限时特惠，部分商品低至 5 折！', link: { clickType: 0, data: null } }
        ],
        iconUrl: '',
        imageUrl: '',
        backgroundColor: '#FFF8E9',
        textColor: '#666666',
        speed: 20
      }
    },
    {
      type: 'Product',
      props: {
        list: [
          {
            id: 'product-1',
            imageUrl: '',
            imgUrl: '',
            brand: '年中爆款',
            categoryNames: '限时特惠',
            price: 99,
            link: { clickType: 0, data: null }
          }
        ],
        layoutType: 'grid',
        listStyle: 'grid',
        showPurchase: false,
        purchase: 0,
        priceColor: '#DD1A21',
        markingPrice: 0
      }
    }
  ],
  新品首发活动页: [
    {
      type: 'ImageNav',
      props: {
        list: [
          { imageUrl: '', text: '新品首发', link: { clickType: 0, data: null } },
          { imageUrl: '', text: '限量发售', link: { clickType: 0, data: null } }
        ],
        columnPadding: 20,
        rowPadding: 20,
        backgroundColor: '#FFFFFF',
        textColor: '#323233',
        borderRadius: 0,
        defaultImage: 'https://via.placeholder.com/44'
      }
    },
    {
      type: 'RichText',
      props: {
        content: '<p><strong>新品震撼上市</strong></p><p>全新升级，颠覆体验，抢先体验。</p>',
        backgroundColor: '#ffffff',
        padding: '10px 10px 0'
      }
    },
    {
      type: 'Product',
      props: {
        list: [
          {
            id: 'product-new',
            imageUrl: '',
            imgUrl: '',
            brand: '首发新品',
            categoryNames: '新品上市',
            price: 199,
            link: { clickType: 0, data: null }
          }
        ],
        layoutType: 'grid',
        listStyle: 'grid',
        showPurchase: false,
        purchase: 0,
        priceColor: '#DD1A21',
        markingPrice: 0
      }
    }
  ],
  限时秒杀活动: [
    {
      type: 'Notice',
      props: {
        noticeList: [
          { text: '秒杀倒计时，先到先得，手慢无！', link: { clickType: 0, data: null } }
        ],
        iconUrl: '',
        imageUrl: '',
        backgroundColor: '#FFF8E9',
        textColor: '#e63946',
        speed: 20
      }
    },
    {
      type: 'Slider',
      props: {
        list: [
          { imageUrl: '', text: '秒杀专场 1', link: { clickType: 0, data: null } },
          { imageUrl: '', text: '秒杀专场 2', link: { clickType: 0, data: null } }
        ],
        isDefaultMargin: true,
        padding: [15, 15],
        imageMargin: 15,
        backgroundColor: '#FFF',
        borderRadius: 0,
        imageWidth: 100,
        imageHeight: 80,
        defaultImage: 'https://via.placeholder.com/100x80'
      }
    },
    {
      type: 'Product',
      props: {
        list: [
          {
            id: 'product-seckill',
            imageUrl: '',
            imgUrl: '',
            brand: '秒杀专区',
            categoryNames: '限量抢购',
            price: 59,
            link: { clickType: 0, data: null }
          }
        ],
        layoutType: 'grid',
        listStyle: 'grid',
        showPurchase: false,
        purchase: 0,
        priceColor: '#DD1A21',
        markingPrice: 0
      }
    }
  ],
  新用户注册有礼: [
    {
      type: 'RichText',
      props: {
        content: '<p><strong>新用户注册有礼</strong></p><p>填写信息，即可领取新人大礼包！</p>',
        backgroundColor: '#ffffff',
        padding: '10px 10px 0'
      }
    },
    {
      type: 'LeadForm',
      props: {
        title: '新用户注册',
        subtitle: '填写信息领取新人大礼包',
        submitText: '立即领取',
        namePlaceholder: '请输入姓名',
        phonePlaceholder: '请输入手机号',
        remarkPlaceholder: '备注（选填）',
        pageId: 0,
        trackingEnabled: true
      }
    },
    {
      type: 'FloatLayer',
      props: {
        imageUrl: '',
        defaultImage: 'https://via.placeholder.com/56',
        link: { clickType: 0, data: null },
        hideByPageScroll: true,
        width: 100,
        bottom: 100,
        right: 24,
        zIndex: 11
      }
    }
  ],
  会员日专属优惠: [
    {
      type: 'Carousel',
      props: {
        imageList: [{ imageUrl: '', text: '会员日专属优惠', link: { clickType: 0, data: null } }],
        autoplay: 3000,
        showIndicators: true,
        showArrows: true,
        height: '180px',
        backgroundColor: '#f5f7fa',
        imageFit: 'cover',
        loop: true
      }
    },
    {
      type: 'RichText',
      props: {
        content: '<p><strong>会员日专属福利</strong></p><p>会员专享好价，积分翻倍。</p>',
        backgroundColor: '#ffffff',
        padding: '10px 10px 0'
      }
    }
  ],
  品牌联合推广页: [
    {
      type: 'ImageNav',
      props: {
        list: [
          { imageUrl: '', text: '品牌 A', link: { clickType: 0, data: null } },
          { imageUrl: '', text: '品牌 B', link: { clickType: 0, data: null } }
        ],
        columnPadding: 20,
        rowPadding: 20,
        backgroundColor: '#FFFFFF',
        textColor: '#323233',
        borderRadius: 0,
        defaultImage: 'https://via.placeholder.com/44'
      }
    },
    {
      type: 'CubeSelection',
      props: {
        template: 'oneLine2',
        imageList: [
          { imageUrl: '', link: { clickType: 0, data: null } },
          { imageUrl: '', link: { clickType: 0, data: null } }
        ],
        pageMargin: 0,
        imgMargin: 4,
        radius: 4,
        defaultImg: ''
      }
    },
    {
      type: 'RichText',
      props: {
        content: '<p>多品牌联合推广，尽享跨界好礼。</p>',
        backgroundColor: '#ffffff',
        padding: '10px 10px 0'
      }
    }
  ],
  积分商城兑换页: [
    {
      type: 'Product',
      props: {
        list: [
          {
            id: 'product-points',
            imageUrl: '',
            imgUrl: '',
            brand: '积分好物',
            categoryNames: '积分兑换',
            price: 0,
            link: { clickType: 0, data: null }
          }
        ],
        layoutType: 'grid',
        listStyle: 'grid',
        showPurchase: false,
        purchase: 0,
        priceColor: '#DD1A21',
        markingPrice: 0
      }
    },
    {
      type: 'RichText',
      props: {
        content: '<p><strong>积分兑换专区</strong></p><p>积分当钱花，好物随心兑。</p>',
        backgroundColor: '#ffffff',
        padding: '10px 10px 0'
      }
    }
  ],
  直播间活动页: [
    {
      type: 'Notice',
      props: {
        noticeList: [{ text: '直播进行中，下单立减！', link: { clickType: 0, data: null } }],
        iconUrl: '',
        imageUrl: '',
        backgroundColor: '#FFF8E9',
        textColor: '#666666',
        speed: 20
      }
    },
    {
      type: 'Slider',
      props: {
        list: [
          { imageUrl: '', text: '直播好物 1', link: { clickType: 0, data: null } },
          { imageUrl: '', text: '直播好物 2', link: { clickType: 0, data: null } }
        ],
        isDefaultMargin: true,
        padding: [15, 15],
        imageMargin: 15,
        backgroundColor: '#FFF',
        borderRadius: 0,
        imageWidth: 100,
        imageHeight: 80,
        defaultImage: 'https://via.placeholder.com/100x80'
      }
    },
    {
      type: 'LeadForm',
      props: {
        title: '直播间预约',
        subtitle: '预约直播好物提醒',
        submitText: '立即预约',
        namePlaceholder: '请输入姓名',
        phonePlaceholder: '请输入手机号',
        remarkPlaceholder: '备注（选填）',
        pageId: 0,
        trackingEnabled: true
      }
    }
  ]
}

export const buildDemoPageSchema = (name: string): IPageSchemaV2 => {
  const components = DEMO_PAGE_COMPONENTS[name] ?? []
  const componentMap: Record<string, IComponentSchemaV2> = {}
  const rootIds: string[] = []
  for (const c of components) {
    const id = demoCid(c.type)
    componentMap[id] = {
      id,
      type: c.type,
      parentId: null,
      children: [],
      props: c.props,
      styles: {}
    }
    rootIds.push(id)
  }
  return {
    version: '2.0.0',
    pageConfig: {
      name,
      shareDesc: name + ' 分享描述',
      shareImage: '',
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundPosition: 'top',
      cover: ''
    },
    componentMap,
    rootIds
  }
}

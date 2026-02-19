/*
 * 页面可选组件列表
 */
const DEF_MAX_NUM = 50
const componentlist = [
  {
    title: '基础组件',
    components: [
      {
        name: '图片广告',
        iconClass: 'cms-icon-ad',
        maxNumForAdd: DEF_MAX_NUM,
        data: {
          component: 'Carousel',
          validTime: [],
          layout: 'swiper',
          imageList: [
            {
              link: null,
              imageUrl: '',
              text: '导航1'
            }
          ],
          imageMargin: 0,
          isDefaultMargin: 0,
          marginSize: [0, 0],
          isBorderRadius: 0,
          radius: 0,
          backgroundColor: '',
          piclist: []
        }
      },
      {
        name: '图文导航',
        maxNumForAdd: DEF_MAX_NUM,
        iconClass: 'cms-icon-nav',
        data: {
          component: 'ImageNav',
          validTime: [],
          layout: 'pic',
          text: '',
          backgroundColor: '#FFFFFF',
          textColor: '#323233',
          columnPadding: 20,
          rowPadding: 20,
          lineNumber: 4,
          borderRadius: 0,
          imageList: [
            {
              link: null,
              imageUrl: '',
              text: '导航1'
            },
            {
              link: null,
              imageUrl: '',
              text: '导航2'
            },
            {
              link: null,
              imageUrl: '',
              text: '导航3'
            },
            {
              link: null,
              imageUrl: '',
              text: '导航4'
            }
          ]
        }
      },
      {
        name: '公告',
        maxNumForAdd: 1,
        iconClass: 'cms-icon-notice',
        data: {
          component: 'Notice',
          validTime: [],
          imageUrl: '',
          noticelist: [
            {
              link: {},
              text: '请填写公告内容'
            }
          ],
          backgroundColor: '#FFF8E9',
          textColor: '#666666'
        }
      },
      {
        name: '魔方',
        iconClass: 'cms-icon-cube',
        maxNumForAdd: DEF_MAX_NUM,
        data: {
          component: 'CubeSelection',
          validTime: [],
          template: 'oneLine2',
          imageList: [],
          pageMargin: 0
        }
      },
      {
        name: '文本',
        iconClass: 'cms-icon-text',
        maxNumForAdd: DEF_MAX_NUM,
        data: {
          component: 'RichText',
          validTime: [],
          backgroundColor: '',
          content: ''
        }
      },
      {
        type: 'AssistLine',
        iconClass: 'cms-icon-line',
        maxNumForAdd: DEF_MAX_NUM,
        component: 'AssistLine',
        name: '辅助线',
        data: {
          component: 'AssistLine',
          validTime: [],
          type: 1,
          paddingVisible: false,
          defBorderColor: '#666',
          borderColor: '#666',
          borderStyle: 'solid',
          defBackgroundColor: '',
          backgroundColor: '',
          height: 10
        }
      },
      {
        name: '浮标',
        iconClass: 'cms-icon-float',
        maxNumForAdd: 1,
        data: {
          component: 'FloatLayer',
          validTime: [],
          imageUrl: '',
          link: null,
          hideByPageScroll: true,
          width: 100
        }
      },
      {
        name: '客服',
        iconClass: 'cms-icon-online',
        maxNumForAdd: 1,
        data: {
          component: 'OnlineService',
          validTime: [],
          text: '客服',
          hideByPageScroll: true
        }
      },
      {
        name: '横向滑动',
        iconClass: 'cms-icon-overflow',
        maxNumForAdd: DEF_MAX_NUM,
        data: {
          component: 'Slider',
          validTime: [],
          isDefaultMargin: true,
          padding: [15, 15],
          imageMargin: 15,
          backgroundColor: '#FFF',
          imageList: [
            {
              link: null,
              imageUrl: '',
              text: '图片1'
            },
            {
              link: null,
              imageUrl: '',
              text: '图片2'
            },
            {
              link: null,
              imageUrl: '',
              text: '图片3'
            }
          ]
        }
      },
      {
        name: '弹窗',
        iconClass: 'cms-icon-alert',
        maxNumForAdd: 1,
        data: {
          component: 'Dialog',
          validTime: [],
          timing: 'every',
          imageList: [
            {
              text: '',
              imageUrl: '',
              link: null
            }
          ]
        }
      },
      {
        name: '商品',
        iconClass: 'cms-icon-prod',
        maxNumForAdd: DEF_MAX_NUM,
        data: {
          component: 'product',
          validTime: [],
          marginTop: 0,
          exchangePriceColor: '#F5514B',
          productList: [],
          listStyle: 'oneLineOne',
          markingPrice: 0,
          purchase: 0
        }
      }
    ]
  }
]

export default componentlist

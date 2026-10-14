/**
 * 组件默认配置 - 从旧项目完整移植
 * 包含所有组件的完整默认数据结构
 */

const DEF_MAX_NUM = 50;

export interface ComponentDefaultConfig {
  component: string;
  validTime: Array<{ startTime: string; endTime: string }>;
  [key: string]: any;
}

export const componentDefaults: Record<string, ComponentDefaultConfig> = {
  Carousel: {
    component: "Carousel",
    validTime: [],
    layout: "swiper",
    imageList: [
      {
        link: null,
        imageUrl: "",
        text: "导航1",
      },
    ],
    imageMargin: 0,
    isDefaultMargin: 0,
    marginSize: [0, 0],
    marginTopBottom: 0,
    marginLeftRight: 0,
    isBorderRadius: 0,
    radius: 0,
    backgroundColor: "#FFFFFF",
    piclist: [],
  },

  ImageNav: {
    component: "ImageNav",
    validTime: [],
    layout: "pic",
    text: "",
    backgroundColor: "#FFFFFF",
    textColor: "#323233",
    columnPadding: 20,
    rowPadding: 20,
    lineNumber: 4,
    borderRadius: 0,
    imageList: [
      { link: null, imageUrl: "", text: "导航1" },
      { link: null, imageUrl: "", text: "导航2" },
      { link: null, imageUrl: "", text: "导航3" },
      { link: null, imageUrl: "", text: "导航4" },
    ],
  },

  Notice: {
    component: "Notice",
    validTime: [],
    imageUrl: "",
    noticelist: [
      {
        link: null,
        text: "请填写公告内容",
      },
    ],
    backgroundColor: "#FFF8E9",
    textColor: "#666666",
  },

  CubeSelection: {
    component: "CubeSelection",
    validTime: [],
    template: "oneLine2",
    imageList: [],
    pageMargin: 0,
  },

  RichText: {
    component: "RichText",
    validTime: [],
    backgroundColor: "",
    content: "",
  },

  AssistLine: {
    component: "AssistLine",
    validTime: [],
    type: 1,
    paddingVisible: false,
    defBorderColor: "#666",
    borderColor: "#666",
    borderStyle: "solid",
    defBackgroundColor: "",
    backgroundColor: "",
    height: 10,
  },

  FloatLayer: {
    component: "FloatLayer",
    validTime: [],
    imageUrl: "",
    link: null,
    hideByPageScroll: true,
    width: 100,
  },

  OnlineService: {
    component: "OnlineService",
    validTime: [],
    text: "客服",
    hideByPageScroll: true,
  },

  Slider: {
    component: "Slider",
    validTime: [],
    isDefaultMargin: true,
    padding: [15, 15],
    imageMargin: 15,
    backgroundColor: "#FFF",
    imageList: [
      { link: null, imageUrl: "", text: "图片1" },
      { link: null, imageUrl: "", text: "图片2" },
      { link: null, imageUrl: "", text: "图片3" },
    ],
  },

  Dialog: {
    component: "Dialog",
    validTime: [],
    timing: "every",
    imageList: [
      {
        text: "",
        imageUrl: "",
        link: null,
      },
    ],
  },

  product: {
    component: "product",
    validTime: [],
    marginTop: 0,
    exchangePriceColor: "#F5514B",
    productList: [],
    listStyle: "oneLineOne",
    markingPrice: 0,
    purchase: 0,
  },

  BusinessForm: {
    component: "BusinessForm",
    validTime: [],
    title: "信息登记",
    subtitle: "请填写以下信息",
    submitText: "提交信息",
    fields: [
      { key: "name", label: "姓名", type: "text", required: true },
      { key: "phone", label: "联系电话", type: "text", required: true },
    ],
  },

  BusinessList: {
    component: "BusinessList",
    validTime: [],
    title: "业务数据",
    columns: [
      { key: "name", label: "名称" },
      { key: "status", label: "状态" },
    ],
    rows: [
      { id: 1, name: "示例记录", status: "待处理" },
      { id: 2, name: "第二条记录", status: "已完成" },
    ],
    pageSize: 5,
  },

  StatCard: {
    component: "StatCard",
    validTime: [],
    title: "待处理事项",
    value: 12,
    description: "较昨日 +8%",
    icon: "数",
    accentColor: "#2563eb",
  },
};

export const getComponentDefault = (type: string): ComponentDefaultConfig => {
  const config = componentDefaults[type];
  if (!config) {
    console.warn(`未找到组件 ${type} 的默认配置，使用空配置`);
    return {
      component: type,
      validTime: [],
    };
  }
  return JSON.parse(JSON.stringify(config));
};

export const maxNumConfig: Record<string, number> = {
  Carousel: DEF_MAX_NUM,
  ImageNav: DEF_MAX_NUM,
  Notice: 1,
  CubeSelection: DEF_MAX_NUM,
  RichText: DEF_MAX_NUM,
  AssistLine: DEF_MAX_NUM,
  FloatLayer: 1,
  OnlineService: 1,
  Slider: DEF_MAX_NUM,
  Dialog: 1,
  product: DEF_MAX_NUM,
  BusinessForm: 10,
  BusinessList: 10,
  StatCard: 20,
};

export const getComponentMaxNum = (type: string): number => {
  return maxNumConfig[type] || DEF_MAX_NUM;
};

import type { MaterialDefinition, MaterialEditorSchema } from "@cms/types";
import type { Component } from "vue";
import {
  normalizeLinkValue,
  toArrayValue,
  toBooleanValue,
  toNumberValue,
  toRecord,
  toStringValue,
} from "./helpers";

export type MaterialRuntimeLoader = () => Promise<Component | { default: Component }>;
export type MaterialRegistryItem = MaterialDefinition<MaterialRuntimeLoader, string>;

const toFiniteNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }
  return fallback;
};

const toFlexibleBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    if (value === "true" || value === "1") {
      return true;
    }
    if (value === "false" || value === "0") {
      return false;
    }
  }
  return fallback;
};

const toRuntimeLinkString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const data = toRecord(toRecord(value).data);
    return toStringValue(data.url);
  }

  return "";
};

const carouselEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "轮播内容",
      fields: [
        {
          type: "array",
          path: "imageList",
          label: "轮播项",
          addText: "添加轮播图",
          limit: 10,
          preset: "picList",
          showImage: true,
          showText: true,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "图片" },
            { key: "text", type: "text", label: "标题" },
            { key: "link", type: "link", label: "链接" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "展示设置",
      fields: [
        {
          type: "number",
          path: "autoplay",
          label: "自动播放间隔(ms)",
          min: 1000,
          max: 10000,
          step: 500,
        },
        {
          type: "switch",
          path: "showIndicators",
          label: "显示指示器",
        },
        {
          type: "switch",
          path: "showArrows",
          label: "显示切换箭头",
        },
        {
          type: "switch",
          path: "loop",
          label: "循环播放",
        },
        {
          type: "text",
          path: "height",
          label: "轮播高度",
          placeholder: "200px",
        },
        {
          type: "select",
          path: "imageFit",
          label: "图片填充模式",
          options: [
            { label: "裁切填充", value: "cover" },
            { label: "完整显示", value: "contain" },
            { label: "拉伸铺满", value: "fill" },
          ],
        },
        {
          type: "color",
          path: "backgroundColor",
          label: "背景颜色",
        },
      ],
    },
  ],
};

const imageNavEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "导航内容",
      fields: [
        {
          type: "array",
          path: "list",
          label: "导航项",
          addText: "添加导航项",
          limit: 10,
          preset: "picList",
          showImage: true,
          showText: true,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "图片" },
            { key: "text", type: "text", label: "标题" },
            { key: "link", type: "link", label: "链接" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "样式设置",
      fields: [
        {
          type: "number",
          path: "columnPadding",
          label: "上下间距",
          min: 0,
          max: 50,
        },
        {
          type: "number",
          path: "rowPadding",
          label: "左右间距",
          min: 0,
          max: 50,
        },
        {
          type: "color",
          path: "backgroundColor",
          label: "背景颜色",
        },
        {
          type: "color",
          path: "textColor",
          label: "文字颜色",
        },
        {
          type: "number",
          path: "borderRadius",
          label: "圆角",
          min: 0,
          max: 20,
        },
        {
          type: "image",
          path: "defaultImage",
          label: "默认图片",
          uploadText: "上传默认图片",
        },
      ],
    },
  ],
};

const richTextEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "内容配置",
      fields: [
        {
          type: "richText",
          path: "content",
          label: "富文本内容",
          rows: 8,
          placeholder: "请输入 HTML 内容",
        },
      ],
    },
    {
      type: "section",
      label: "样式设置",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "背景颜色",
        },
        {
          type: "text",
          path: "padding",
          label: "内边距",
          placeholder: "10px 10px 0",
        },
      ],
    },
  ],
};

const noticeEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "公告内容",
      fields: [
        {
          type: "array",
          path: "noticeList",
          label: "公告列表",
          addText: "添加公告",
          limit: 10,
          preset: "picList",
          showImage: false,
          showText: false,
          itemSchema: [
            { key: "text", type: "text", label: "文案" },
            { key: "link", type: "link", label: "链接" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "展示设置",
      fields: [
        {
          type: "image",
          path: "iconUrl",
          label: "图标",
          uploadText: "上传图标",
        },
        {
          type: "color",
          path: "backgroundColor",
          label: "背景颜色",
        },
        {
          type: "color",
          path: "textColor",
          label: "文字颜色",
        },
        {
          type: "number",
          path: "speed",
          label: "滚动速度",
          min: 5,
          max: 100,
          step: 1,
        },
      ],
    },
  ],
};

const dialogEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "基础设置",
      fields: [
        {
          type: "switch",
          path: "visible",
          label: "默认显示",
        },
        {
          type: "text",
          path: "title",
          label: "标题",
          placeholder: "请输入标题",
        },
        {
          type: "textarea",
          path: "content",
          label: "内容",
          placeholder: "请输入内容",
          rows: 3,
        },
      ],
    },
    {
      type: "section",
      label: "按钮设置",
      fields: [
        {
          type: "switch",
          path: "showClose",
          label: "显示关闭按钮",
        },
        {
          type: "switch",
          path: "showActions",
          label: "显示底部按钮",
        },
        {
          type: "switch",
          path: "showCancel",
          label: "显示取消按钮",
          visibleWhen: {
            field: "showActions",
            equals: true,
          },
        },
        {
          type: "text",
          path: "cancelText",
          label: "取消文案",
          visibleWhen: {
            field: "showCancel",
            equals: true,
          },
        },
        {
          type: "text",
          path: "confirmText",
          label: "确认文案",
          visibleWhen: {
            field: "showActions",
            equals: true,
          },
        },
      ],
    },
    {
      type: "section",
      label: "样式设置",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "背景颜色",
        },
        {
          type: "color",
          path: "titleColor",
          label: "标题颜色",
        },
        {
          type: "color",
          path: "contentColor",
          label: "内容颜色",
        },
        {
          type: "color",
          path: "confirmColor",
          label: "确认按钮颜色",
        },
      ],
    },
  ],
};

const productEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "商品列表",
      fields: [
        {
          type: "array",
          path: "list",
          label: "商品项",
          addText: "添加商品",
          limit: 50,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "商品图片" },
            { key: "brand", type: "text", label: "商品标题", placeholder: "请输入标题" },
            { key: "categoryNames", type: "text", label: "副标题", placeholder: "请输入副标题" },
            { key: "price", type: "number", label: "价格", min: 0, step: 0.01 },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "展示设置",
      fields: [
        {
          type: "select",
          path: "layoutType",
          label: "布局样式",
          options: [
            { label: "详情列表", value: "listDetail" },
            { label: "一行一个", value: "oneLineOne" },
            { label: "一行两个", value: "oneLineTwo" },
          ],
        },
        {
          type: "switch",
          path: "showPurchase",
          label: "显示购买按钮",
        },
        {
          type: "color",
          path: "priceColor",
          label: "价格颜色",
        },
      ],
    },
  ],
};

const cubeSelectionEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "内容配置",
      fields: [
        {
          type: "select",
          path: "template",
          label: "模板样式",
          options: [
            { label: "单行2列", value: "oneLine2" },
            { label: "单行3列", value: "oneLine3" },
            { label: "双行2列", value: "twoLine2" },
            { label: "双行3列", value: "twoLine3" },
          ],
        },
        {
          type: "array",
          path: "imageList",
          label: "图片列表",
          addText: "添加图片",
          limit: 12,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "图片" },
            { key: "link", type: "link", label: "链接" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "样式设置",
      fields: [
        {
          type: "number",
          path: "pageMargin",
          label: "页面边距",
          min: 0,
          max: 100,
        },
        {
          type: "number",
          path: "imgMargin",
          label: "图片间距",
          min: 0,
          max: 50,
        },
        {
          type: "number",
          path: "radius",
          label: "圆角半径",
          min: 0,
          max: 50,
        },
        {
          type: "image",
          path: "defaultImg",
          label: "默认图片",
          uploadText: "上传默认图片",
        },
      ],
    },
  ],
};

const assistLineEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "基础配置",
      fields: [
        {
          type: "number",
          path: "height",
          label: "线条高度",
          min: 1,
          max: 20,
          step: 1,
        },
        {
          type: "switch",
          path: "paddingVisible",
          label: "显示内边距",
        },
        {
          type: "select",
          path: "type",
          label: "线条类型",
          options: [
            { label: "实线", value: 1 },
            { label: "无边框", value: 0 },
          ],
        },
        {
          type: "select",
          path: "borderStyle",
          label: "边框样式",
          options: [
            { label: "实线", value: "solid" },
            { label: "虚线", value: "dashed" },
            { label: "点线", value: "dotted" },
            { label: "双线", value: "double" },
          ],
          visibleWhen: {
            field: "type",
            equals: 1,
          },
        },
      ],
    },
    {
      type: "section",
      label: "颜色配置",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "背景颜色",
        },
        {
          type: "color",
          path: "borderColor",
          label: "线条颜色",
        },
      ],
    },
  ],
};

const floatLayerEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "定位配置",
      fields: [
        {
          type: "number",
          path: "width",
          label: "宽度",
          min: 20,
          max: 200,
        },
        {
          type: "number",
          path: "bottom",
          label: "距离底部",
          min: 0,
          max: 500,
        },
        {
          type: "number",
          path: "right",
          label: "距离右侧",
          min: 0,
          max: 500,
        },
        {
          type: "number",
          path: "zIndex",
          label: "层级(z-index)",
          min: 1,
          max: 999,
        },
        {
          type: "switch",
          path: "hideByPageScroll",
          label: "滚动时隐藏",
        },
      ],
    },
    {
      type: "section",
      label: "内容配置",
      fields: [
        {
          type: "image",
          path: "imageUrl",
          label: "浮层图片",
          uploadText: "上传浮层图片",
        },
        {
          type: "image",
          path: "defaultImage",
          label: "默认图片",
          uploadText: "上传默认图片",
        },
        {
          type: "link",
          path: "link",
          label: "点击跳转",
        },
      ],
    },
  ],
};

const onlineServiceEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "定位配置",
      fields: [
        {
          type: "number",
          path: "width",
          label: "宽度",
          min: 20,
          max: 100,
        },
        {
          type: "number",
          path: "height",
          label: "高度",
          min: 20,
          max: 100,
        },
        {
          type: "number",
          path: "bottom",
          label: "距离底部",
          min: 0,
          max: 500,
        },
        {
          type: "number",
          path: "right",
          label: "距离右侧",
          min: 0,
          max: 500,
        },
        {
          type: "number",
          path: "zIndex",
          label: "层级(z-index)",
          min: 1,
          max: 999,
        },
        {
          type: "switch",
          path: "hideByPageScroll",
          label: "滚动时隐藏",
        },
      ],
    },
    {
      type: "section",
      label: "样式配置",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "背景颜色",
        },
        {
          type: "image",
          path: "serviceImage",
          label: "客服图片",
          uploadText: "上传客服图片",
        },
        {
          type: "text",
          path: "text",
          label: "显示文本",
          placeholder: "客服",
        },
      ],
    },
  ],
};

const sliderEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "滑块图片",
      fields: [
        {
          type: "array",
          path: "list",
          label: "图片列表",
          addText: "添加图片",
          limit: 20,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "图片" },
            { key: "link", type: "link", label: "链接" },
            { key: "text", type: "text", label: "文案" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "样式配置",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "背景颜色",
        },
        {
          type: "number",
          path: "padding.0",
          label: "内边距(上/下)",
          min: 0,
          max: 50,
        },
        {
          type: "number",
          path: "padding.1",
          label: "内边距(左/右)",
          min: 0,
          max: 50,
        },
        {
          type: "number",
          path: "imageMargin",
          label: "图片间距",
          min: 0,
          max: 30,
        },
        {
          type: "number",
          path: "borderRadius",
          label: "圆角半径",
          min: 0,
          max: 20,
        },
        {
          type: "number",
          path: "imageWidth",
          label: "图片宽度",
          min: 50,
          max: 300,
        },
        {
          type: "number",
          path: "imageHeight",
          label: "图片高度",
          min: 50,
          max: 300,
        },
        {
          type: "image",
          path: "defaultImage",
          label: "默认图片",
          uploadText: "上传默认图片",
        },
      ],
    },
  ],
};

const carouselDefaultProps = {
  imageList: [
    {
      imageUrl: "",
      text: "轮播1",
      link: {
        clickType: 0,
        data: null,
      },
    },
  ],
  autoplay: 3000,
  showIndicators: true,
  showArrows: true,
  height: "200px",
  backgroundColor: "#f5f7fa",
  imageFit: "cover",
  loop: true,
};

const imageNavDefaultProps = {
  list: [
    { imageUrl: "", text: "导航1", link: { clickType: 0, data: null } },
    { imageUrl: "", text: "导航2", link: { clickType: 0, data: null } },
    { imageUrl: "", text: "导航3", link: { clickType: 0, data: null } },
    { imageUrl: "", text: "导航4", link: { clickType: 0, data: null } },
  ],
  columnPadding: 20,
  rowPadding: 20,
  backgroundColor: "#FFFFFF",
  textColor: "#323233",
  borderRadius: 0,
  defaultImage: "https://via.placeholder.com/44",
};

const richTextDefaultProps = {
  content:
    "<p>可以在这里编辑富文本内容，支持加粗、斜体、下划线等基础能力。</p>",
  backgroundColor: "#ffffff",
  padding: "10px 10px 0",
};

const noticeDefaultProps = {
  component: "Notice",
  validTime: [],
  noticeList: [{ text: "请填写公告内容", link: { clickType: 0, data: null } }],
  noticelist: [{ text: "请填写公告内容", link: { clickType: 0, data: null } }],
  iconUrl: "",
  imageUrl: "",
  backgroundColor: "#FFF8E9",
  textColor: "#666666",
  speed: 20,
};

const dialogDefaultProps = {
  component: "Dialog",
  validTime: [],
  timing: "every",
  imageList: [{ text: "", imageUrl: "", link: null }],
  visible: false,
  title: "活动提示",
  content: "请确认是否继续操作",
  showClose: true,
  showActions: true,
  showCancel: true,
  cancelText: "取消",
  confirmText: "确定",
  backgroundColor: "#ffffff",
  titleColor: "#1f2937",
  contentColor: "#6b7280",
  confirmColor: "#3b82f6",
};

const normalizeProductList = (value: unknown) =>
  toArrayValue(value, (item, index) => {
    const record = toRecord(item);
    return {
      id:
        toStringValue(record.id) ||
        toStringValue(record.productId) ||
        `product-${index + 1}`,
      imageUrl: toStringValue(record.imageUrl ?? record.imgUrl),
      imgUrl: toStringValue(record.imgUrl ?? record.imageUrl),
      brand: toStringValue(record.brand),
      categoryNames: toStringValue(record.categoryNames),
      price: toFiniteNumber(record.price, 0),
      link: normalizeLinkValue(record.link),
    };
  });

const productDefaultList = [
  {
    id: "product-1",
    imageUrl: "",
    imgUrl: "",
    brand: "商品标题",
    categoryNames: "商品副标题",
    price: 99,
    link: { clickType: 0, data: null },
  },
];

const productDefaultProps = {
  component: "Product",
  validTime: [],
  marginTop: 0,
  list: productDefaultList,
  productList: productDefaultList,
  layoutType: "listDetail",
  listStyle: "listDetail",
  showPurchase: false,
  purchase: 0,
  priceColor: "#DD1A21",
  exchangePriceColor: "#DD1A21",
  markingPrice: 0,
  sortType: "customsort",
  priceSortType: "order",
  outOfStock: "show",
  beOverdue: 1,
};

const cubeSelectionDefaultProps = {
  component: "CubeSelection",
  validTime: [],
  template: "oneLine2",
  imageList: [
    {
      imageUrl: "",
      link: { clickType: 0, data: null },
    },
    {
      imageUrl: "",
      link: { clickType: 0, data: null },
    },
  ],
  pageMargin: 0,
  imgMargin: 4,
  radius: 4,
  defaultImg: "",
};

const assistLineDefaultProps = {
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
};

const floatLayerDefaultProps = {
  component: "FloatLayer",
  validTime: [],
  imageUrl: "",
  defaultImage: "https://via.placeholder.com/56",
  link: { clickType: 0, data: null },
  hideByPageScroll: true,
  width: 100,
  bottom: 100,
  right: 24,
  zIndex: 11,
};

const onlineServiceDefaultProps = {
  component: "OnlineService",
  validTime: [],
  text: "客服",
  hideByPageScroll: true,
  width: 48,
  height: 48,
  bottom: 24,
  right: 24,
  zIndex: 11,
  backgroundColor: "#ffffff",
  serviceImage: "https://image.fuchuang.com/prod/3d488567_icon_kf20201116164901.png",
};

const sliderDefaultList = [
  { imageUrl: "", text: "图片1", link: { clickType: 0, data: null } },
  { imageUrl: "", text: "图片2", link: { clickType: 0, data: null } },
  { imageUrl: "", text: "图片3", link: { clickType: 0, data: null } },
];

const sliderDefaultProps = {
  component: "Slider",
  validTime: [],
  isDefaultMargin: true,
  padding: [15, 15],
  imageMargin: 15,
  backgroundColor: "#FFF",
  list: sliderDefaultList,
  imageList: sliderDefaultList,
  borderRadius: 0,
  imageWidth: 100,
  imageHeight: 80,
  defaultImage: "https://via.placeholder.com/100x80",
};

export const materialRegistry: MaterialRegistryItem[] = [
  {
    type: "Carousel",
    aliases: ["carousel"],
    group: "basic",
    label: "轮播图",
    icon: "播",
    maxCount: 50,
    defaultProps: carouselDefaultProps,
    runtimeComponent: () => import("../components/CarouselBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: carouselEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        imageList: toArrayValue(
          normalizedProps.imageList ?? normalizedProps.piclist,
          (item) => {
            const record = toRecord(item);
            return {
              imageUrl: toStringValue(record.imageUrl),
              text: toStringValue(record.text),
              link: normalizeLinkValue(record.link),
            };
          },
        ),
        autoplay: toNumberValue(
          normalizedProps.autoplay ?? normalizedProps.interval,
          3000,
        ),
        showIndicators: toBooleanValue(normalizedProps.showIndicators, true),
        showArrows: toBooleanValue(normalizedProps.showArrows, true),
        height: toStringValue(normalizedProps.height, "200px"),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#f5f7fa"),
        imageFit: toStringValue(normalizedProps.imageFit, "cover") || "cover",
        loop: toBooleanValue(normalizedProps.loop, true),
      };
    },
  },
  {
    type: "ImageNav",
    aliases: ["imagenav"],
    group: "basic",
    label: "图文导航",
    icon: "导",
    maxCount: 50,
    defaultProps: imageNavDefaultProps,
    runtimeComponent: () => import("../components/ImageNavBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: imageNavEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        list: toArrayValue(
          normalizedProps.list ?? normalizedProps.imageList,
          (item) => {
            const record = toRecord(item);
            return {
              imageUrl: toStringValue(record.imageUrl),
              text: toStringValue(record.text),
              link: normalizeLinkValue(record.link),
            };
          },
        ),
        columnPadding: toNumberValue(normalizedProps.columnPadding, 20),
        rowPadding: toNumberValue(normalizedProps.rowPadding, 20),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#FFFFFF"),
        textColor: toStringValue(normalizedProps.textColor, "#323233"),
        borderRadius: toNumberValue(normalizedProps.borderRadius, 0),
        defaultImage: toStringValue(
          normalizedProps.defaultImage,
          "https://via.placeholder.com/44",
        ),
      };
    },
    toRuntimeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        ...normalizedProps,
        list: toArrayValue(normalizedProps.list, (item) => {
          const record = toRecord(item);
          const link = record.link;
          if (
            link &&
            typeof link === "object" &&
            "data" in link &&
            typeof toRecord(link).data === "object"
          ) {
            return {
              ...record,
              link: toStringValue(toRecord(toRecord(link).data).url),
            };
          }
          return record;
        }),
      };
    },
  },
  {
    type: "RichText",
    aliases: ["richtext"],
    group: "basic",
    label: "富文本",
    icon: "文",
    maxCount: 50,
    defaultProps: richTextDefaultProps,
    runtimeComponent: () => import("../components/RichTextBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: richTextEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        content: toStringValue(normalizedProps.content, richTextDefaultProps.content),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#ffffff"),
        padding: toStringValue(normalizedProps.padding, "10px 10px 0"),
      };
    },
  },
  {
    type: "Notice",
    aliases: ["notice"],
    group: "basic",
    label: "公告",
    icon: "告",
    maxCount: 1,
    defaultProps: noticeDefaultProps,
    runtimeComponent: () => import("../components/NoticeBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: noticeEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      const noticeList = toArrayValue(
        normalizedProps.noticeList ?? normalizedProps.noticelist,
        (item) => {
          const record = toRecord(item);
          return {
            text: toStringValue(record.text),
            link: normalizeLinkValue(record.link),
          };
        },
      );
      const iconUrl = toStringValue(
        normalizedProps.iconUrl ?? normalizedProps.imageUrl,
      );

      return {
        component: "Notice",
        validTime: toArrayValue(normalizedProps.validTime, (item) => item),
        noticeList,
        noticelist: noticeList,
        iconUrl,
        imageUrl: iconUrl,
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#FFF8E9"),
        textColor: toStringValue(normalizedProps.textColor, "#666666"),
        speed: toFiniteNumber(normalizedProps.speed, 20),
      };
    },
    toRuntimeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        noticeList: toArrayValue(
          normalizedProps.noticeList ?? normalizedProps.noticelist,
          (item) => {
            const record = toRecord(item);
            const linkValue = record.link;
            let link = "";
            if (typeof linkValue === "string") {
              link = linkValue;
            } else if (linkValue && typeof linkValue === "object") {
              const data = toRecord(toRecord(linkValue).data);
              link = toStringValue(data.url);
            }

            return {
              text: toStringValue(record.text),
              link,
            };
          },
        ),
        iconUrl: toStringValue(normalizedProps.iconUrl ?? normalizedProps.imageUrl),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#FFF8E9"),
        textColor: toStringValue(normalizedProps.textColor, "#666666"),
        speed: toFiniteNumber(normalizedProps.speed, 20),
      };
    },
  },
  {
    type: "CubeSelection",
    aliases: ["cubeselection"],
    group: "basic",
    label: "魔方",
    icon: "格",
    maxCount: 50,
    defaultProps: cubeSelectionDefaultProps,
    runtimeComponent: () => import("../components/CubeSelectionBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: cubeSelectionEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      const imageList = toArrayValue(normalizedProps.imageList, (item) => {
        const record = toRecord(item);
        return {
          imageUrl: toStringValue(record.imageUrl),
          link: normalizeLinkValue(record.link),
        };
      });

      return {
        component: "CubeSelection",
        validTime: toArrayValue(normalizedProps.validTime, (item) => item),
        template: toStringValue(normalizedProps.template, "oneLine2") || "oneLine2",
        imageList,
        pageMargin: toFiniteNumber(normalizedProps.pageMargin, 0),
        imgMargin: toFiniteNumber(normalizedProps.imgMargin, 4),
        radius: toFiniteNumber(normalizedProps.radius, 4),
        defaultImg: toStringValue(normalizedProps.defaultImg),
      };
    },
    toRuntimeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        template: toStringValue(normalizedProps.template, "oneLine2") || "oneLine2",
        imageList: toArrayValue(normalizedProps.imageList, (item) => {
          const record = toRecord(item);
          return {
            imageUrl: toStringValue(record.imageUrl),
            link: toRuntimeLinkString(record.link),
          };
        }),
        pageMargin: toFiniteNumber(normalizedProps.pageMargin, 0),
        imgMargin: toFiniteNumber(normalizedProps.imgMargin, 4),
        radius: toFiniteNumber(normalizedProps.radius, 4),
        defaultImg: toStringValue(normalizedProps.defaultImg),
      };
    },
  },
  {
    type: "AssistLine",
    aliases: ["assistline"],
    group: "basic",
    label: "辅助线",
    icon: "线",
    maxCount: 50,
    defaultProps: assistLineDefaultProps,
    runtimeComponent: () => import("../components/AssistLineBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: assistLineEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      const typeValue = toFiniteNumber(normalizedProps.type, 1);
      const normalizedType = typeValue === 0 ? 0 : 1;
      const defBorderColor = toStringValue(normalizedProps.defBorderColor, "#666");
      const defBackgroundColor = toStringValue(normalizedProps.defBackgroundColor, "");

      return {
        component: "AssistLine",
        validTime: toArrayValue(normalizedProps.validTime, (item) => item),
        type: normalizedType,
        paddingVisible: toFlexibleBoolean(normalizedProps.paddingVisible, false),
        defBorderColor,
        borderColor: toStringValue(normalizedProps.borderColor, defBorderColor),
        borderStyle: toStringValue(normalizedProps.borderStyle, "solid") || "solid",
        defBackgroundColor,
        backgroundColor: toStringValue(
          normalizedProps.backgroundColor,
          defBackgroundColor,
        ),
        height: toFiniteNumber(normalizedProps.height, 10),
      };
    },
  },
  {
    type: "FloatLayer",
    aliases: ["floatlayer"],
    group: "marketing",
    label: "浮层",
    icon: "浮",
    maxCount: 1,
    defaultProps: floatLayerDefaultProps,
    runtimeComponent: () => import("../components/FloatLayerBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: floatLayerEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        component: "FloatLayer",
        validTime: toArrayValue(normalizedProps.validTime, (item) => item),
        imageUrl: toStringValue(normalizedProps.imageUrl),
        defaultImage: toStringValue(
          normalizedProps.defaultImage,
          "https://via.placeholder.com/56",
        ),
        link: normalizeLinkValue(normalizedProps.link),
        hideByPageScroll: toFlexibleBoolean(normalizedProps.hideByPageScroll, true),
        width: toFiniteNumber(normalizedProps.width, 100),
        bottom: toFiniteNumber(normalizedProps.bottom, 100),
        right: toFiniteNumber(normalizedProps.right, 24),
        zIndex: toFiniteNumber(normalizedProps.zIndex, 11),
      };
    },
    toRuntimeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        imageUrl: toStringValue(normalizedProps.imageUrl),
        defaultImage: toStringValue(
          normalizedProps.defaultImage,
          "https://via.placeholder.com/56",
        ),
        hideByPageScroll: toFlexibleBoolean(normalizedProps.hideByPageScroll, true),
        width: toFiniteNumber(normalizedProps.width, 100),
        bottom: toFiniteNumber(normalizedProps.bottom, 100),
        right: toFiniteNumber(normalizedProps.right, 24),
        zIndex: toFiniteNumber(normalizedProps.zIndex, 11),
      };
    },
  },
  {
    type: "OnlineService",
    aliases: ["onlineservice"],
    group: "marketing",
    label: "在线客服",
    icon: "客",
    maxCount: 1,
    defaultProps: onlineServiceDefaultProps,
    runtimeComponent: () => import("../components/OnlineServiceBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: onlineServiceEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        component: "OnlineService",
        validTime: toArrayValue(normalizedProps.validTime, (item) => item),
        text: toStringValue(normalizedProps.text, "客服") || "客服",
        hideByPageScroll: toFlexibleBoolean(normalizedProps.hideByPageScroll, true),
        width: toFiniteNumber(normalizedProps.width, 48),
        height: toFiniteNumber(normalizedProps.height, 48),
        bottom: toFiniteNumber(normalizedProps.bottom, 24),
        right: toFiniteNumber(normalizedProps.right, 24),
        zIndex: toFiniteNumber(normalizedProps.zIndex, 11),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#ffffff"),
        serviceImage: toStringValue(
          normalizedProps.serviceImage,
          "https://image.fuchuang.com/prod/3d488567_icon_kf20201116164901.png",
        ),
      };
    },
    toRuntimeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        text: toStringValue(normalizedProps.text, "客服") || "客服",
        width: toFiniteNumber(normalizedProps.width, 48),
        height: toFiniteNumber(normalizedProps.height, 48),
        bottom: toFiniteNumber(normalizedProps.bottom, 24),
        right: toFiniteNumber(normalizedProps.right, 24),
        zIndex: toFiniteNumber(normalizedProps.zIndex, 11),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#ffffff"),
        serviceImage: toStringValue(
          normalizedProps.serviceImage,
          "https://image.fuchuang.com/prod/3d488567_icon_kf20201116164901.png",
        ),
      };
    },
  },
  {
    type: "Slider",
    aliases: ["slider"],
    group: "marketing",
    label: "横向滑动",
    icon: "滑",
    maxCount: 50,
    defaultProps: sliderDefaultProps,
    runtimeComponent: () => import("../components/SliderBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: sliderEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      const list = toArrayValue(
        normalizedProps.list ?? normalizedProps.imageList,
        (item) => {
          const record = toRecord(item);
          return {
            imageUrl: toStringValue(record.imageUrl),
            text: toStringValue(record.text),
            link: normalizeLinkValue(record.link),
          };
        },
      );
      const normalizedPadding = toArrayValue(normalizedProps.padding, (item) =>
        toFiniteNumber(item, 15),
      );
      const verticalPadding = normalizedPadding[0] ?? 15;
      const horizontalPadding = normalizedPadding[1] ?? verticalPadding;
      const padding = [verticalPadding, horizontalPadding];

      return {
        component: "Slider",
        validTime: toArrayValue(normalizedProps.validTime, (item) => item),
        isDefaultMargin: toFlexibleBoolean(normalizedProps.isDefaultMargin, true),
        padding,
        imageMargin: toFiniteNumber(normalizedProps.imageMargin, 15),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#FFF"),
        list,
        imageList: list,
        borderRadius: toFiniteNumber(normalizedProps.borderRadius, 0),
        imageWidth: toFiniteNumber(normalizedProps.imageWidth, 100),
        imageHeight: toFiniteNumber(normalizedProps.imageHeight, 80),
        defaultImage: toStringValue(
          normalizedProps.defaultImage,
          "https://via.placeholder.com/100x80",
        ),
      };
    },
    toRuntimeProps: (props) => {
      const normalizedProps = toRecord(props);
      const normalizedPadding = toArrayValue(normalizedProps.padding, (item) =>
        toFiniteNumber(item, 15),
      );
      const verticalPadding = normalizedPadding[0] ?? 15;
      const horizontalPadding = normalizedPadding[1] ?? verticalPadding;

      return {
        list: toArrayValue(
          normalizedProps.list ?? normalizedProps.imageList,
          (item) => {
            const record = toRecord(item);
            return {
              imageUrl: toStringValue(record.imageUrl),
              link: toRuntimeLinkString(record.link),
            };
          },
        ),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#FFF"),
        padding: [verticalPadding, horizontalPadding],
        imageMargin: toFiniteNumber(normalizedProps.imageMargin, 15),
        imageWidth: toFiniteNumber(normalizedProps.imageWidth, 100),
        imageHeight: toFiniteNumber(normalizedProps.imageHeight, 80),
        borderRadius: toFiniteNumber(normalizedProps.borderRadius, 0),
        defaultImage: toStringValue(
          normalizedProps.defaultImage,
          "https://via.placeholder.com/100x80",
        ),
      };
    },
  },
  {
    type: "Dialog",
    aliases: ["dialog"],
    group: "marketing",
    label: "弹窗",
    icon: "弹",
    maxCount: 1,
    defaultProps: dialogDefaultProps,
    runtimeComponent: () => import("../components/DialogBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: dialogEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      return {
        component: "Dialog",
        validTime: toArrayValue(normalizedProps.validTime, (item) => item),
        timing: toStringValue(normalizedProps.timing, "every"),
        imageList: toArrayValue(normalizedProps.imageList, (item) => {
          const record = toRecord(item);
          return {
            text: toStringValue(record.text),
            imageUrl: toStringValue(record.imageUrl),
            link: normalizeLinkValue(record.link),
          };
        }),
        visible: toFlexibleBoolean(normalizedProps.visible, false),
        title: toStringValue(normalizedProps.title, "活动提示"),
        content: toStringValue(normalizedProps.content, "请确认是否继续操作"),
        showClose: toFlexibleBoolean(normalizedProps.showClose, true),
        showActions: toFlexibleBoolean(normalizedProps.showActions, true),
        showCancel: toFlexibleBoolean(normalizedProps.showCancel, true),
        cancelText: toStringValue(normalizedProps.cancelText, "取消"),
        confirmText: toStringValue(normalizedProps.confirmText, "确定"),
        backgroundColor: toStringValue(normalizedProps.backgroundColor, "#ffffff"),
        titleColor: toStringValue(normalizedProps.titleColor, "#1f2937"),
        contentColor: toStringValue(normalizedProps.contentColor, "#6b7280"),
        confirmColor: toStringValue(normalizedProps.confirmColor, "#3b82f6"),
      };
    },
  },
  {
    type: "Product",
    aliases: ["product"],
    group: "marketing",
    label: "商品",
    icon: "货",
    maxCount: 50,
    defaultProps: productDefaultProps,
    runtimeComponent: () => import("../components/ProductBlock.vue"),
    editorConfig: {
      mode: "schema",
      schema: productEditorSchema,
    },
    normalizeProps: (props) => {
      const normalizedProps = toRecord(props);
      const list = normalizeProductList(
        normalizedProps.list ?? normalizedProps.productList,
      );
      const layoutType =
        toStringValue(normalizedProps.layoutType ?? normalizedProps.listStyle, "listDetail") ||
        "listDetail";
      const showPurchase = toFlexibleBoolean(
        normalizedProps.showPurchase ?? normalizedProps.purchase,
        false,
      );
      const priceColor =
        toStringValue(
          normalizedProps.priceColor ?? normalizedProps.exchangePriceColor,
          "#DD1A21",
        ) || "#DD1A21";

      return {
        component: "Product",
        validTime: toArrayValue(normalizedProps.validTime, (item) => item),
        marginTop: toFiniteNumber(normalizedProps.marginTop, 0),
        list,
        productList: list,
        layoutType,
        listStyle: layoutType,
        showPurchase,
        purchase: showPurchase ? 1 : 0,
        priceColor,
        exchangePriceColor: priceColor,
        markingPrice: toFiniteNumber(normalizedProps.markingPrice, 0),
        sortType: toStringValue(normalizedProps.sortType, "customsort"),
        priceSortType: toStringValue(normalizedProps.priceSortType, "order"),
        outOfStock: toStringValue(normalizedProps.outOfStock, "show"),
        beOverdue: toFiniteNumber(normalizedProps.beOverdue, 1),
      };
    },
    toRuntimeProps: (props) => {
      const normalizedProps = toRecord(props);
      const list = normalizeProductList(
        normalizedProps.list ?? normalizedProps.productList,
      );
      return {
        list,
        layoutType:
          toStringValue(
            normalizedProps.layoutType ?? normalizedProps.listStyle,
            "listDetail",
          ) || "listDetail",
        showPurchase: toFlexibleBoolean(
          normalizedProps.showPurchase ?? normalizedProps.purchase,
          false,
        ),
        priceColor:
          toStringValue(
            normalizedProps.priceColor ?? normalizedProps.exchangePriceColor,
            "#DD1A21",
          ) || "#DD1A21",
      };
    },
  },
];

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
// MATERIALS_AUTO_IMPORTS_START
// MATERIALS_AUTO_IMPORTS_END

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
      label: "杞挱鍐呭",
      fields: [
        {
          type: "array",
          path: "imageList",
          label: "杞挱椤?,
          addText: "娣诲姞杞挱鍥?,
          limit: 10,
          preset: "picList",
          showImage: true,
          showText: true,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "鍥剧墖" },
            { key: "text", type: "text", label: "鏍囬" },
            { key: "link", type: "link", label: "閾炬帴" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "灞曠ず璁剧疆",
      fields: [
        {
          type: "number",
          path: "autoplay",
          label: "鑷姩鎾斁闂撮殧(ms)",
          min: 1000,
          max: 10000,
          step: 500,
        },
        {
          type: "switch",
          path: "showIndicators",
          label: "鏄剧ず鎸囩ず鍣?,
        },
        {
          type: "switch",
          path: "showArrows",
          label: "鏄剧ず鍒囨崲绠ご",
        },
        {
          type: "switch",
          path: "loop",
          label: "寰幆鎾斁",
        },
        {
          type: "text",
          path: "height",
          label: "杞挱楂樺害",
          placeholder: "200px",
        },
        {
          type: "select",
          path: "imageFit",
          label: "鍥剧墖濉厖妯″紡",
          options: [
            { label: "瑁佸垏濉厖", value: "cover" },
            { label: "瀹屾暣鏄剧ず", value: "contain" },
            { label: "鎷変几閾烘弧", value: "fill" },
          ],
        },
        {
          type: "color",
          path: "backgroundColor",
          label: "鑳屾櫙棰滆壊",
        },
      ],
    },
  ],
};

const imageNavEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "瀵艰埅鍐呭",
      fields: [
        {
          type: "array",
          path: "list",
          label: "瀵艰埅椤?,
          addText: "娣诲姞瀵艰埅椤?,
          limit: 10,
          preset: "picList",
          showImage: true,
          showText: true,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "鍥剧墖" },
            { key: "text", type: "text", label: "鏍囬" },
            { key: "link", type: "link", label: "閾炬帴" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "鏍峰紡璁剧疆",
      fields: [
        {
          type: "number",
          path: "columnPadding",
          label: "涓婁笅闂磋窛",
          min: 0,
          max: 50,
        },
        {
          type: "number",
          path: "rowPadding",
          label: "宸﹀彸闂磋窛",
          min: 0,
          max: 50,
        },
        {
          type: "color",
          path: "backgroundColor",
          label: "鑳屾櫙棰滆壊",
        },
        {
          type: "color",
          path: "textColor",
          label: "鏂囧瓧棰滆壊",
        },
        {
          type: "number",
          path: "borderRadius",
          label: "鍦嗚",
          min: 0,
          max: 20,
        },
        {
          type: "image",
          path: "defaultImage",
          label: "榛樿鍥剧墖",
          uploadText: "涓婁紶榛樿鍥剧墖",
        },
      ],
    },
  ],
};

const richTextEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "鍐呭閰嶇疆",
      fields: [
        {
          type: "richText",
          path: "content",
          label: "瀵屾枃鏈唴瀹?,
          rows: 8,
          placeholder: "璇疯緭鍏?HTML 鍐呭",
        },
      ],
    },
    {
      type: "section",
      label: "鏍峰紡璁剧疆",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "鑳屾櫙棰滆壊",
        },
        {
          type: "text",
          path: "padding",
          label: "鍐呰竟璺?,
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
      label: "鍏憡鍐呭",
      fields: [
        {
          type: "array",
          path: "noticeList",
          label: "鍏憡鍒楄〃",
          addText: "娣诲姞鍏憡",
          limit: 10,
          preset: "picList",
          showImage: false,
          showText: false,
          itemSchema: [
            { key: "text", type: "text", label: "鏂囨" },
            { key: "link", type: "link", label: "閾炬帴" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "灞曠ず璁剧疆",
      fields: [
        {
          type: "image",
          path: "iconUrl",
          label: "鍥炬爣",
          uploadText: "涓婁紶鍥炬爣",
        },
        {
          type: "color",
          path: "backgroundColor",
          label: "鑳屾櫙棰滆壊",
        },
        {
          type: "color",
          path: "textColor",
          label: "鏂囧瓧棰滆壊",
        },
        {
          type: "number",
          path: "speed",
          label: "婊氬姩閫熷害",
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
      label: "鍩虹璁剧疆",
      fields: [
        {
          type: "switch",
          path: "visible",
          label: "榛樿鏄剧ず",
        },
        {
          type: "text",
          path: "title",
          label: "鏍囬",
          placeholder: "璇疯緭鍏ユ爣棰?,
        },
        {
          type: "textarea",
          path: "content",
          label: "鍐呭",
          placeholder: "璇疯緭鍏ュ唴瀹?,
          rows: 3,
        },
      ],
    },
    {
      type: "section",
      label: "鎸夐挳璁剧疆",
      fields: [
        {
          type: "switch",
          path: "showClose",
          label: "鏄剧ず鍏抽棴鎸夐挳",
        },
        {
          type: "switch",
          path: "showActions",
          label: "鏄剧ず搴曢儴鎸夐挳",
        },
        {
          type: "switch",
          path: "showCancel",
          label: "鏄剧ず鍙栨秷鎸夐挳",
          visibleWhen: {
            field: "showActions",
            equals: true,
          },
        },
        {
          type: "text",
          path: "cancelText",
          label: "鍙栨秷鏂囨",
          visibleWhen: {
            field: "showCancel",
            equals: true,
          },
        },
        {
          type: "text",
          path: "confirmText",
          label: "纭鏂囨",
          visibleWhen: {
            field: "showActions",
            equals: true,
          },
        },
      ],
    },
    {
      type: "section",
      label: "鏍峰紡璁剧疆",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "鑳屾櫙棰滆壊",
        },
        {
          type: "color",
          path: "titleColor",
          label: "鏍囬棰滆壊",
        },
        {
          type: "color",
          path: "contentColor",
          label: "鍐呭棰滆壊",
        },
        {
          type: "color",
          path: "confirmColor",
          label: "纭鎸夐挳棰滆壊",
        },
      ],
    },
  ],
};

const productEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "鍟嗗搧鍒楄〃",
      fields: [
        {
          type: "array",
          path: "list",
          label: "鍟嗗搧椤?,
          addText: "娣诲姞鍟嗗搧",
          limit: 50,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "鍟嗗搧鍥剧墖" },
            { key: "brand", type: "text", label: "鍟嗗搧鏍囬", placeholder: "璇疯緭鍏ユ爣棰? },
            { key: "categoryNames", type: "text", label: "鍓爣棰?, placeholder: "璇疯緭鍏ュ壇鏍囬" },
            { key: "price", type: "number", label: "浠锋牸", min: 0, step: 0.01 },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "灞曠ず璁剧疆",
      fields: [
        {
          type: "select",
          path: "layoutType",
          label: "甯冨眬鏍峰紡",
          options: [
            { label: "璇︽儏鍒楄〃", value: "listDetail" },
            { label: "涓€琛屼竴涓?, value: "oneLineOne" },
            { label: "涓€琛屼袱涓?, value: "oneLineTwo" },
          ],
        },
        {
          type: "switch",
          path: "showPurchase",
          label: "鏄剧ず璐拱鎸夐挳",
        },
        {
          type: "color",
          path: "priceColor",
          label: "浠锋牸棰滆壊",
        },
      ],
    },
  ],
};

const cubeSelectionEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "鍐呭閰嶇疆",
      fields: [
        {
          type: "select",
          path: "template",
          label: "妯℃澘鏍峰紡",
          options: [
            { label: "鍗曡2鍒?, value: "oneLine2" },
            { label: "鍗曡3鍒?, value: "oneLine3" },
            { label: "鍙岃2鍒?, value: "twoLine2" },
            { label: "鍙岃3鍒?, value: "twoLine3" },
          ],
        },
        {
          type: "array",
          path: "imageList",
          label: "鍥剧墖鍒楄〃",
          addText: "娣诲姞鍥剧墖",
          limit: 12,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "鍥剧墖" },
            { key: "link", type: "link", label: "閾炬帴" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "鏍峰紡璁剧疆",
      fields: [
        {
          type: "number",
          path: "pageMargin",
          label: "椤甸潰杈硅窛",
          min: 0,
          max: 100,
        },
        {
          type: "number",
          path: "imgMargin",
          label: "鍥剧墖闂磋窛",
          min: 0,
          max: 50,
        },
        {
          type: "number",
          path: "radius",
          label: "鍦嗚鍗婂緞",
          min: 0,
          max: 50,
        },
        {
          type: "image",
          path: "defaultImg",
          label: "榛樿鍥剧墖",
          uploadText: "涓婁紶榛樿鍥剧墖",
        },
      ],
    },
  ],
};

const assistLineEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "鍩虹閰嶇疆",
      fields: [
        {
          type: "number",
          path: "height",
          label: "绾挎潯楂樺害",
          min: 1,
          max: 20,
          step: 1,
        },
        {
          type: "switch",
          path: "paddingVisible",
          label: "鏄剧ず鍐呰竟璺?,
        },
        {
          type: "select",
          path: "type",
          label: "绾挎潯绫诲瀷",
          options: [
            { label: "瀹炵嚎", value: 1 },
            { label: "鏃犺竟妗?, value: 0 },
          ],
        },
        {
          type: "select",
          path: "borderStyle",
          label: "杈规鏍峰紡",
          options: [
            { label: "瀹炵嚎", value: "solid" },
            { label: "铏氱嚎", value: "dashed" },
            { label: "鐐圭嚎", value: "dotted" },
            { label: "鍙岀嚎", value: "double" },
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
      label: "棰滆壊閰嶇疆",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "鑳屾櫙棰滆壊",
        },
        {
          type: "color",
          path: "borderColor",
          label: "绾挎潯棰滆壊",
        },
      ],
    },
  ],
};

const floatLayerEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "瀹氫綅閰嶇疆",
      fields: [
        {
          type: "number",
          path: "width",
          label: "瀹藉害",
          min: 20,
          max: 200,
        },
        {
          type: "number",
          path: "bottom",
          label: "璺濈搴曢儴",
          min: 0,
          max: 500,
        },
        {
          type: "number",
          path: "right",
          label: "璺濈鍙充晶",
          min: 0,
          max: 500,
        },
        {
          type: "number",
          path: "zIndex",
          label: "灞傜骇(z-index)",
          min: 1,
          max: 999,
        },
        {
          type: "switch",
          path: "hideByPageScroll",
          label: "婊氬姩鏃堕殣钘?,
        },
      ],
    },
    {
      type: "section",
      label: "鍐呭閰嶇疆",
      fields: [
        {
          type: "image",
          path: "imageUrl",
          label: "娴眰鍥剧墖",
          uploadText: "涓婁紶娴眰鍥剧墖",
        },
        {
          type: "image",
          path: "defaultImage",
          label: "榛樿鍥剧墖",
          uploadText: "涓婁紶榛樿鍥剧墖",
        },
        {
          type: "link",
          path: "link",
          label: "鐐瑰嚮璺宠浆",
        },
      ],
    },
  ],
};

const onlineServiceEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "瀹氫綅閰嶇疆",
      fields: [
        {
          type: "number",
          path: "width",
          label: "瀹藉害",
          min: 20,
          max: 100,
        },
        {
          type: "number",
          path: "height",
          label: "楂樺害",
          min: 20,
          max: 100,
        },
        {
          type: "number",
          path: "bottom",
          label: "璺濈搴曢儴",
          min: 0,
          max: 500,
        },
        {
          type: "number",
          path: "right",
          label: "璺濈鍙充晶",
          min: 0,
          max: 500,
        },
        {
          type: "number",
          path: "zIndex",
          label: "灞傜骇(z-index)",
          min: 1,
          max: 999,
        },
        {
          type: "switch",
          path: "hideByPageScroll",
          label: "婊氬姩鏃堕殣钘?,
        },
      ],
    },
    {
      type: "section",
      label: "鏍峰紡閰嶇疆",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "鑳屾櫙棰滆壊",
        },
        {
          type: "image",
          path: "serviceImage",
          label: "瀹㈡湇鍥剧墖",
          uploadText: "涓婁紶瀹㈡湇鍥剧墖",
        },
        {
          type: "text",
          path: "text",
          label: "鏄剧ず鏂囨湰",
          placeholder: "瀹㈡湇",
        },
      ],
    },
  ],
};

const sliderEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "婊戝潡鍥剧墖",
      fields: [
        {
          type: "array",
          path: "list",
          label: "鍥剧墖鍒楄〃",
          addText: "娣诲姞鍥剧墖",
          limit: 20,
          itemSchema: [
            { key: "imageUrl", type: "image", label: "鍥剧墖" },
            { key: "link", type: "link", label: "閾炬帴" },
            { key: "text", type: "text", label: "鏂囨" },
          ],
        },
      ],
    },
    {
      type: "section",
      label: "鏍峰紡閰嶇疆",
      fields: [
        {
          type: "color",
          path: "backgroundColor",
          label: "鑳屾櫙棰滆壊",
        },
        {
          type: "number",
          path: "padding.0",
          label: "鍐呰竟璺?涓?涓?",
          min: 0,
          max: 50,
        },
        {
          type: "number",
          path: "padding.1",
          label: "鍐呰竟璺?宸?鍙?",
          min: 0,
          max: 50,
        },
        {
          type: "number",
          path: "imageMargin",
          label: "鍥剧墖闂磋窛",
          min: 0,
          max: 30,
        },
        {
          type: "number",
          path: "borderRadius",
          label: "鍦嗚鍗婂緞",
          min: 0,
          max: 20,
        },
        {
          type: "number",
          path: "imageWidth",
          label: "鍥剧墖瀹藉害",
          min: 50,
          max: 300,
        },
        {
          type: "number",
          path: "imageHeight",
          label: "鍥剧墖楂樺害",
          min: 50,
          max: 300,
        },
        {
          type: "image",
          path: "defaultImage",
          label: "榛樿鍥剧墖",
          uploadText: "涓婁紶榛樿鍥剧墖",
        },
      ],
    },
  ],
};

const carouselDefaultProps = {
  imageList: [
    {
      imageUrl: "",
      text: "杞挱1",
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
    { imageUrl: "", text: "瀵艰埅1", link: { clickType: 0, data: null } },
    { imageUrl: "", text: "瀵艰埅2", link: { clickType: 0, data: null } },
    { imageUrl: "", text: "瀵艰埅3", link: { clickType: 0, data: null } },
    { imageUrl: "", text: "瀵艰埅4", link: { clickType: 0, data: null } },
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
    "<p>鍙互鍦ㄨ繖閲岀紪杈戝瘜鏂囨湰鍐呭锛屾敮鎸佸姞绮椼€佹枩浣撱€佷笅鍒掔嚎绛夊熀纭€鑳藉姏銆?/p>",
  backgroundColor: "#ffffff",
  padding: "10px 10px 0",
};

const noticeDefaultProps = {
  component: "Notice",
  validTime: [],
  noticeList: [{ text: "璇峰～鍐欏叕鍛婂唴瀹?, link: { clickType: 0, data: null } }],
  noticelist: [{ text: "璇峰～鍐欏叕鍛婂唴瀹?, link: { clickType: 0, data: null } }],
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
  title: "娲诲姩鎻愮ず",
  content: "璇风‘璁ゆ槸鍚︾户缁搷浣?,
  showClose: true,
  showActions: true,
  showCancel: true,
  cancelText: "鍙栨秷",
  confirmText: "纭畾",
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
    brand: "鍟嗗搧鏍囬",
    categoryNames: "鍟嗗搧鍓爣棰?,
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
  text: "瀹㈡湇",
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
  { imageUrl: "", text: "鍥剧墖1", link: { clickType: 0, data: null } },
  { imageUrl: "", text: "鍥剧墖2", link: { clickType: 0, data: null } },
  { imageUrl: "", text: "鍥剧墖3", link: { clickType: 0, data: null } },
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

// MATERIALS_AUTO_SCHEMAS_START
// MATERIALS_AUTO_SCHEMAS_END

export const materialRegistry: MaterialRegistryItem[] = [
  {
    type: "Carousel",
    aliases: ["carousel"],
    group: "basic",
    label: "杞挱鍥?,
    icon: "鎾?,
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
    label: "鍥炬枃瀵艰埅",
    icon: "瀵?,
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
    label: "瀵屾枃鏈?,
    icon: "鏂?,
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
    label: "鍏憡",
    icon: "鍛?,
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
    label: "榄旀柟",
    icon: "鏍?,
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
    label: "杈呭姪绾?,
    icon: "绾?,
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
    label: "娴眰",
    icon: "娴?,
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
    label: "鍦ㄧ嚎瀹㈡湇",
    icon: "瀹?,
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
        text: toStringValue(normalizedProps.text, "瀹㈡湇") || "瀹㈡湇",
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
        text: toStringValue(normalizedProps.text, "瀹㈡湇") || "瀹㈡湇",
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
    label: "妯悜婊戝姩",
    icon: "婊?,
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
    label: "寮圭獥",
    icon: "寮?,
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
        title: toStringValue(normalizedProps.title, "娲诲姩鎻愮ず"),
        content: toStringValue(normalizedProps.content, "璇风‘璁ゆ槸鍚︾户缁搷浣?),
        showClose: toFlexibleBoolean(normalizedProps.showClose, true),
        showActions: toFlexibleBoolean(normalizedProps.showActions, true),
        showCancel: toFlexibleBoolean(normalizedProps.showCancel, true),
        cancelText: toStringValue(normalizedProps.cancelText, "鍙栨秷"),
        confirmText: toStringValue(normalizedProps.confirmText, "纭畾"),
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
    label: "鍟嗗搧",
    icon: "璐?,
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
  // MATERIALS_AUTO_REGISTRY_START
  // MATERIALS_AUTO_REGISTRY_END
];


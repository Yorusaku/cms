import type { IPageSchemaV2 } from "@cms/types";
import type { TemplateCategory } from "../../modules/template/entities/template.entity";

export interface TemplateSeed {
  name: string;
  thumbnail: string | null;
  category: TemplateCategory;
  schema: IPageSchemaV2;
  description: string;
}

// 辅助：生成唯一组件ID
let _compCounter = 0;
const cid = (prefix: string) => `${prefix}-${++_compCounter}-${Date.now().toString(36)}`;

// 通用 props
const makeButtonProps = (text: string, color = "#1677ff") => ({
  text, type: "primary", size: "medium", block: false, color, link: "" });

const makeTitleProps = (title: string, align: string = "center") => ({
  title, align, fontSize: 18, color: "#333" });

const makeImageProps = (label: string, imgUrl: string = "") => ({ label, imgUrl, link: "" });

// 模板列表
export const TEMPLATE_SEEDS: TemplateSeed[] = [
  // ============ 营销 (4个) ============
  {
    name: "大促活动页",
    thumbnail: null,
    category: "marketing",
    description: "适合618、双11等大促场景，含轮播头图、商品展示、倒计时区域",
    schema: (() => {
      const banner = cid("CarouselBlock");
      const title1 = cid("ComTitle");
      const p1 = cid("ProductBlock");
      const btn = cid("CmsButton");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "大促活动页", shareDesc: "超值优惠等你来", shareImage: "", backgroundColor: "#ff4444", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [banner]: { id: banner, type: "CarouselBlock", parentId: null, children: [], props: { images: [], autoplay: true, interval: 3000, indicator: true, height: 200 }, styles: {} },
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("🔥 爆款商品"), styles: {} },
          [p1]: { id: p1, type: "ProductBlock", parentId: null, children: [], props: { title: "精选好物", products: [], layoutType: "grid", columns: 2 }, styles: {} },
          [btn]: { id: btn, type: "CmsButton", parentId: null, children: [], props: makeButtonProps("立即抢购", "#ff4d4f"), styles: {} },
        },
        rootIds: [banner, title1, p1, btn],
      };
    })(),
  },
  {
    name: "新品首发",
    thumbnail: null,
    category: "marketing",
    description: "适合新品发布，突出产品亮点与首发优惠",
    schema: (() => {
      const banner = cid("ImageNavBlock");
      const title1 = cid("ComTitle");
      const richtext = cid("RichTextBlock");
      const p1 = cid("ProductBlock");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "新品首发", shareDesc: "新品震撼上市", shareImage: "", backgroundColor: "#1a1a2e", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [banner]: { id: banner, type: "ImageNavBlock", parentId: null, children: [], props: { images: [], columns: 1, gap: 0 }, styles: {} },
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("✨ 重磅新品"), styles: {} },
          [richtext]: { id: richtext, type: "RichTextBlock", parentId: null, children: [], props: { html: "<p>全新升级，颠覆体验...</p>" }, styles: {} },
          [p1]: { id: p1, type: "ProductBlock", parentId: null, children: [], props: { title: "立即探索", products: [], layoutType: "list" }, styles: {} },
        },
        rootIds: [banner, title1, richtext, p1],
      };
    })(),
  },
  {
    name: "限时秒杀",
    thumbnail: null,
    category: "marketing",
    description: "秒杀场景专用，含倒计时、商品网格、抢购按钮",
    schema: (() => {
      const title1 = cid("ComTitle");
      const notice = cid("NoticeBlock");
      const p1 = cid("ProductBlock");
      const btn = cid("CmsButton");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "限时秒杀", shareDesc: "限时特惠，手慢无", shareImage: "", backgroundColor: "#ff6600", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("⏰ 限时秒杀"), styles: {} },
          [notice]: { id: notice, type: "NoticeBlock", parentId: null, children: [], props: { text: "距离结束还有 02:30:15", color: "#fff", bgColor: "#e63946" }, styles: {} },
          [p1]: { id: p1, type: "ProductBlock", parentId: null, children: [], props: { title: "秒杀专区", products: [], layoutType: "grid", columns: 2 }, styles: {} },
          [btn]: { id: btn, type: "CmsButton", parentId: null, children: [], props: makeButtonProps("疯狂抢购", "#ff0000"), styles: {} },
        },
        rootIds: [title1, notice, p1, btn],
      };
    })(),
  },
  {
    name: "会员日",
    thumbnail: null,
    category: "marketing",
    description: "会员专属活动页，突出权益展示和专属商品",
    schema: (() => {
      const banner = cid("CarouselBlock");
      const title1 = cid("ComTitle");
      const cube = cid("CubeSelectionBlock");
      const p1 = cid("ProductBlock");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "会员日", shareDesc: "会员专属福利", shareImage: "", backgroundColor: "#722ed1", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [banner]: { id: banner, type: "CarouselBlock", parentId: null, children: [], props: { images: [], autoplay: true, interval: 3000, indicator: true, height: 180 }, styles: {} },
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("👑 会员专属"), styles: {} },
          [cube]: { id: cube, type: "CubeSelectionBlock", parentId: null, children: [], props: { items: [], columns: 3, gap: 8 }, styles: {} },
          [p1]: { id: p1, type: "ProductBlock", parentId: null, children: [], props: { title: "会员价商品", products: [], layoutType: "grid", columns: 2 }, styles: {} },
        },
        rootIds: [banner, title1, cube, p1],
      };
    })(),
  },

  // ============ 电商 (2个) ============
  {
    name: "商品列表",
    thumbnail: null,
    category: "ecommerce",
    description: "通用商品列表页，支持网格/列表切换",
    schema: (() => {
      const title1 = cid("ComTitle");
      const p1 = cid("ProductBlock");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "商品列表", shareDesc: "精选好物推荐", shareImage: "", backgroundColor: "#f5f5f5", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("全部商品"), styles: {} },
          [p1]: { id: p1, type: "ProductBlock", parentId: null, children: [], props: { title: "", products: [], layoutType: "grid", columns: 2 }, styles: {} },
        },
        rootIds: [title1, p1],
      };
    })(),
  },
  {
    name: "积分兑换",
    thumbnail: null,
    category: "ecommerce",
    description: "积分商城兑换页，突出积分商品和兑换按钮",
    schema: (() => {
      const title1 = cid("ComTitle");
      const cube = cid("CubeSelectionBlock");
      const notice = cid("NoticeBlock");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "积分兑换", shareDesc: "积分当钱花", shareImage: "", backgroundColor: "#ffd700", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("积分商城"), styles: {} },
          [notice]: { id: notice, type: "NoticeBlock", parentId: null, children: [], props: { text: "你的积分: 1280", color: "#333", bgColor: "#fff3cd" }, styles: {} },
          [cube]: { id: cube, type: "CubeSelectionBlock", parentId: null, children: [], props: { items: [], columns: 2, gap: 10 }, styles: {} },
        },
        rootIds: [title1, notice, cube],
      };
    })(),
  },

  // ============ 品牌 (2个) ============
  {
    name: "品牌故事",
    thumbnail: null,
    category: "brand",
    description: "讲述品牌历史与理念的叙事型页面",
    schema: (() => {
      const banner = cid("ImageNavBlock");
      const title1 = cid("ComTitle");
      const richtext = cid("RichTextBlock");
      const cube = cid("CubeSelectionBlock");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "品牌故事", shareDesc: "了解我们的故事", shareImage: "", backgroundColor: "#ffffff", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [banner]: { id: banner, type: "ImageNavBlock", parentId: null, children: [], props: { images: [], columns: 1, gap: 0 }, styles: {} },
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("我们的故事"), styles: {} },
          [richtext]: { id: richtext, type: "RichTextBlock", parentId: null, children: [], props: { html: "<p>品牌自创立以来...</p>" }, styles: {} },
          [cube]: { id: cube, type: "CubeSelectionBlock", parentId: null, children: [], props: { items: [], columns: 2, gap: 10 }, styles: {} },
        },
        rootIds: [banner, title1, richtext, cube],
      };
    })(),
  },
  {
    name: "关于我们",
    thumbnail: null,
    category: "brand",
    description: "企业介绍页，展示公司信息、联系方式和品牌理念",
    schema: (() => {
      const title1 = cid("ComTitle");
      const richtext = cid("RichTextBlock");
      const btn = cid("CmsButton");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "关于我们", shareDesc: "了解更多", shareImage: "", backgroundColor: "#f8f9fa", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("关于我们"), styles: {} },
          [richtext]: { id: richtext, type: "RichTextBlock", parentId: null, children: [], props: { html: "<p>我们是一家专注于...</p>" }, styles: {} },
          [btn]: { id: btn, type: "CmsButton", parentId: null, children: [], props: makeButtonProps("联系我们"), styles: {} },
        },
        rootIds: [title1, richtext, btn],
      };
    })(),
  },

  // ============ 通用 (2个) ============
  {
    name: "通用布局 A",
    thumbnail: null,
    category: "general",
    description: "单栏基础布局，适合快速搭建简单落地页",
    schema: (() => {
      const title1 = cid("ComTitle");
      const p1 = cid("ProductBlock");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "通用布局 A", shareDesc: "", shareImage: "", backgroundColor: "#ffffff", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("页面标题"), styles: {} },
          [p1]: { id: p1, type: "ProductBlock", parentId: null, children: [], props: { title: "内容区域", products: [], layoutType: "list" }, styles: {} },
        },
        rootIds: [title1, p1],
      };
    })(),
  },
  {
    name: "通用布局 B",
    thumbnail: null,
    category: "general",
    description: "多区块布局骨架，含轮播、图文、按钮等常用模块",
    schema: (() => {
      const banner = cid("CarouselBlock");
      const title1 = cid("ComTitle");
      const richtext = cid("RichTextBlock");
      const cube = cid("CubeSelectionBlock");
      const btn = cid("CmsButton");
      return {
        version: "2.0.0" as const,
        pageConfig: { name: "通用布局 B", shareDesc: "", shareImage: "", backgroundColor: "#f0f2f5", backgroundImage: "", backgroundPosition: "top", cover: "" },
        componentMap: {
          [banner]: { id: banner, type: "CarouselBlock", parentId: null, children: [], props: { images: [], autoplay: true, interval: 3000, indicator: true, height: 180 }, styles: {} },
          [title1]: { id: title1, type: "ComTitle", parentId: null, children: [], props: makeTitleProps("欢迎使用 CMS 搭建"), styles: {} },
          [richtext]: { id: richtext, type: "RichTextBlock", parentId: null, children: [], props: { html: "<p>从这里开始构建你的页面</p>" }, styles: {} },
          [cube]: { id: cube, type: "CubeSelectionBlock", parentId: null, children: [], props: { items: [], columns: 3, gap: 8 }, styles: {} },
          [btn]: { id: btn, type: "CmsButton", parentId: null, children: [], props: makeButtonProps("开始探索"), styles: {} },
        },
        rootIds: [banner, title1, richtext, cube, btn],
      };
    })(),
  },
];

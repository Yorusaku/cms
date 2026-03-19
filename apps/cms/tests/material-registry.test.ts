import { describe, expect, it } from "vitest";
import type { IComponentSchemaV2, IPageSchemaV2 } from "@cms/types";
import {
  CarouselBlock,
  NoticeBlock,
  getMaterialAsyncComponent,
  getMaterialDefaults,
  materialRegistry,
  normalizeMaterialType,
  normalizePageSchemaMaterials,
  resolveMaterialDefinition,
} from "@cms/ui";

const createComponent = (
  id: string,
  type: string,
  props: Record<string, unknown>,
): IComponentSchemaV2 => ({
  id,
  type,
  props,
  styles: {},
  parentId: null,
  children: [],
  condition: true,
});

const createPageSchema = (): IPageSchemaV2 => ({
  version: "2.0.0",
  pageConfig: {
    name: "测试页面",
    shareDesc: "",
    shareImage: "",
    backgroundColor: "",
    backgroundImage: "",
    backgroundPosition: "top",
    cover: "",
  },
  componentMap: {},
  rootIds: [],
  state: undefined,
});

describe("material registry", () => {
  it("should keep legacy named component exports available", () => {
    expect(CarouselBlock).toBeTruthy();
    expect(NoticeBlock).toBeTruthy();
  });

  it("should expose unique canonical types and non-conflicting aliases", () => {
    const canonicalTypes = new Set<string>();
    const aliasOwners = new Map<string, string>();

    for (const material of materialRegistry) {
      expect(canonicalTypes.has(material.type)).toBe(false);
      canonicalTypes.add(material.type);

      expect(material.type).toMatch(/^[A-Z][A-Za-z0-9]*$/);
      expect(typeof material.runtimeComponent).toBe("function");
      expect(getMaterialAsyncComponent(material.type)).toBeTruthy();
      expect(typeof material.defaultProps).toBe("object");
      expect(material.editorConfig.mode).toBe("schema");

      for (const alias of [material.type, ...(material.aliases ?? [])]) {
        const normalizedAlias = alias.toLowerCase();
        const owner = aliasOwners.get(normalizedAlias);

        if (owner) {
          expect(owner).toBe(material.type);
        }
        aliasOwners.set(normalizedAlias, material.type);
      }
    }
  });

  it("should normalize aliases and keep defaults immutable", () => {
    expect(normalizeMaterialType("carousel")).toBe("Carousel");
    expect(normalizeMaterialType("imagenav")).toBe("ImageNav");
    expect(normalizeMaterialType("richtext")).toBe("RichText");
    expect(normalizeMaterialType("notice")).toBe("Notice");
    expect(normalizeMaterialType("dialog")).toBe("Dialog");
    expect(normalizeMaterialType("product")).toBe("Product");
    expect(normalizeMaterialType("cubeselection")).toBe("CubeSelection");
    expect(normalizeMaterialType("assistline")).toBe("AssistLine");
    expect(normalizeMaterialType("floatlayer")).toBe("FloatLayer");
    expect(normalizeMaterialType("onlineservice")).toBe("OnlineService");
    expect(normalizeMaterialType("slider")).toBe("Slider");
    expect(normalizeMaterialType("unknown-material")).toBe("unknown-material");

    expect(resolveMaterialDefinition("carousel")?.type).toBe("Carousel");
    expect(resolveMaterialDefinition("ImageNav")?.type).toBe("ImageNav");
    expect(resolveMaterialDefinition("missing")).toBeUndefined();

    const defaults = getMaterialDefaults("Carousel");
    defaults.height = "480px";

    expect(getMaterialDefaults("carousel").height).toBe("200px");
  });

  it("should normalize legacy schema data for notice, dialog and product", () => {
    const schema = createPageSchema();
    schema.componentMap = {
      notice_1: createComponent("notice_1", "notice", {
        imageUrl: "https://cdn.test/icon.png",
        noticelist: [
          {
            text: "历史公告",
            link: "https://example.com/notice",
          },
        ],
      }),
      dialog_1: createComponent("dialog_1", "dialog", {
        title: "历史弹窗",
        showActions: 1,
        showCancel: 0,
      }),
      product_1: createComponent("product_1", "product", {
        productList: [
          {
            id: "sku-1",
            imgUrl: "https://cdn.test/product.png",
            brand: "历史商品",
            categoryNames: "分类A",
            price: "88",
          },
        ],
        listStyle: "oneLineTwo",
        purchase: 1,
        exchangePriceColor: "#FF0000",
      }),
    };
    schema.rootIds = ["notice_1", "dialog_1", "product_1"];

    const normalizedSchema = normalizePageSchemaMaterials(schema);

    expect(normalizedSchema.componentMap.notice_1.type).toBe("Notice");
    expect(normalizedSchema.componentMap.notice_1.props).toMatchObject({
      iconUrl: "https://cdn.test/icon.png",
      noticeList: [
        {
          text: "历史公告",
          link: {
            clickType: 1,
            data: {
              url: "https://example.com/notice",
            },
          },
        },
      ],
    });

    expect(normalizedSchema.componentMap.dialog_1.type).toBe("Dialog");
    expect(normalizedSchema.componentMap.dialog_1.props).toMatchObject({
      title: "历史弹窗",
      showActions: true,
      showCancel: false,
    });

    expect(normalizedSchema.componentMap.product_1.type).toBe("Product");
    expect(normalizedSchema.componentMap.product_1.props).toMatchObject({
      layoutType: "oneLineTwo",
      showPurchase: true,
      priceColor: "#FF0000",
      list: [
        {
          id: "sku-1",
          imageUrl: "https://cdn.test/product.png",
          imgUrl: "https://cdn.test/product.png",
          brand: "历史商品",
          categoryNames: "分类A",
          price: 88,
        },
      ],
    });
  });

  it("should normalize legacy schema data for cube, assist line, float layer, online service and slider", () => {
    const schema = createPageSchema();
    schema.componentMap = {
      cube_1: createComponent("cube_1", "cubeselection", {
        template: "twoLine2",
        imageList: [
          {
            imageUrl: "https://cdn.test/cube.png",
            link: "https://example.com/cube",
          },
        ],
        pageMargin: 12,
        imgMargin: 8,
        radius: 6,
      }),
      assist_1: createComponent("assist_1", "assistline", {
        type: 0,
        paddingVisible: 1,
        height: "14",
        borderColor: "#111111",
      }),
      float_1: createComponent("float_1", "floatlayer", {
        imageUrl: "https://cdn.test/float.png",
        link: "https://example.com/float",
        bottom: 66,
        right: 18,
        zIndex: 99,
      }),
      online_1: createComponent("online_1", "onlineservice", {
        text: "咨询",
        width: 60,
        height: 60,
        backgroundColor: "#000000",
      }),
      slider_1: createComponent("slider_1", "slider", {
        imageList: [
          {
            imageUrl: "https://cdn.test/slide.png",
            link: "https://example.com/slide",
          },
        ],
        padding: [20, 12],
        imageMargin: 10,
      }),
    };
    schema.rootIds = ["cube_1", "assist_1", "float_1", "online_1", "slider_1"];

    const normalizedSchema = normalizePageSchemaMaterials(schema);

    expect(normalizedSchema.componentMap.cube_1.type).toBe("CubeSelection");
    expect(normalizedSchema.componentMap.cube_1.props).toMatchObject({
      template: "twoLine2",
      pageMargin: 12,
      imgMargin: 8,
      radius: 6,
      imageList: [
        {
          imageUrl: "https://cdn.test/cube.png",
          link: {
            clickType: 1,
            data: {
              url: "https://example.com/cube",
            },
          },
        },
      ],
    });

    expect(normalizedSchema.componentMap.assist_1.type).toBe("AssistLine");
    expect(normalizedSchema.componentMap.assist_1.props).toMatchObject({
      type: 0,
      paddingVisible: true,
      height: 14,
      borderColor: "#111111",
    });

    expect(normalizedSchema.componentMap.float_1.type).toBe("FloatLayer");
    expect(normalizedSchema.componentMap.float_1.props).toMatchObject({
      imageUrl: "https://cdn.test/float.png",
      link: {
        clickType: 1,
        data: {
          url: "https://example.com/float",
        },
      },
      bottom: 66,
      right: 18,
      zIndex: 99,
    });

    expect(normalizedSchema.componentMap.online_1.type).toBe("OnlineService");
    expect(normalizedSchema.componentMap.online_1.props).toMatchObject({
      text: "咨询",
      width: 60,
      height: 60,
      backgroundColor: "#000000",
    });

    expect(normalizedSchema.componentMap.slider_1.type).toBe("Slider");
    expect(normalizedSchema.componentMap.slider_1.props).toMatchObject({
      padding: [20, 12],
      imageMargin: 10,
      list: [
        {
          imageUrl: "https://cdn.test/slide.png",
          link: {
            clickType: 1,
            data: {
              url: "https://example.com/slide",
            },
          },
        },
      ],
    });
  });

  it("should normalize legacy schema data for migrated materials", () => {
    const schema = createPageSchema();
    schema.componentMap = {
      carousel_1: createComponent("carousel_1", "carousel", {
        piclist: [
          {
            imageUrl: "https://cdn.test/banner.png",
            text: "首屏轮播",
            link: "https://example.com/banner",
          },
        ],
        interval: 5000,
      }),
      nav_1: createComponent("nav_1", "imagenav", {
        imageList: [
          {
            imageUrl: "https://cdn.test/nav.png",
            text: "导航一",
            link: "https://example.com/nav",
          },
        ],
        rowPadding: 12,
      }),
      rich_1: createComponent("rich_1", "richtext", {
        padding: 24,
      }),
      unknown_1: createComponent("unknown_1", "UnknownMaterial", {
        foo: "bar",
      }),
    };
    schema.rootIds = ["carousel_1", "missing", "nav_1", "rich_1", "unknown_1"];

    const normalizedSchema = normalizePageSchemaMaterials(schema);

    expect(schema.componentMap.carousel_1.type).toBe("carousel");
    expect(normalizedSchema.rootIds).toEqual([
      "carousel_1",
      "nav_1",
      "rich_1",
      "unknown_1",
    ]);

    expect(normalizedSchema.componentMap.carousel_1.type).toBe("Carousel");
    expect(normalizedSchema.componentMap.carousel_1.props).toMatchObject({
      autoplay: 5000,
      showIndicators: true,
      imageFit: "cover",
      imageList: [
        {
          imageUrl: "https://cdn.test/banner.png",
          text: "首屏轮播",
          link: {
            clickType: 1,
            data: {
              url: "https://example.com/banner",
            },
          },
        },
      ],
    });

    expect(normalizedSchema.componentMap.nav_1.type).toBe("ImageNav");
    expect(normalizedSchema.componentMap.nav_1.props).toMatchObject({
      rowPadding: 12,
      columnPadding: 20,
      list: [
        {
          imageUrl: "https://cdn.test/nav.png",
          text: "导航一",
          link: {
            clickType: 1,
            data: {
              url: "https://example.com/nav",
            },
          },
        },
      ],
    });

    expect(normalizedSchema.componentMap.rich_1.type).toBe("RichText");
    expect(normalizedSchema.componentMap.rich_1.props).toMatchObject({
      backgroundColor: "#ffffff",
      padding: "10px 10px 0",
    });
    expect(typeof normalizedSchema.componentMap.rich_1.props.content).toBe("string");

    expect(normalizedSchema.componentMap.unknown_1.type).toBe("UnknownMaterial");
    expect(normalizedSchema.componentMap.unknown_1.props).toEqual({ foo: "bar" });
  });
});

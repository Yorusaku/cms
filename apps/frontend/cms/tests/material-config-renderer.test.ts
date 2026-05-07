import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, type PropType } from "vue";
import { getMaterialDefaults } from "@cms/ui";
import type { MaterialFieldSchema, MaterialSectionSchema } from "@cms/types";
import MaterialConfigRenderer from "../src/views/Decorate/components/MaterialConfigRenderer.vue";

type MaterialRenderableField = Exclude<MaterialFieldSchema, MaterialSectionSchema>;

const MaterialFieldRendererStub = defineComponent({
  name: "MaterialFieldRenderer",
  props: {
    field: {
      type: Object as PropType<MaterialRenderableField>,
      required: true,
    },
    modelValue: {
      type: null as unknown as PropType<unknown>,
      default: undefined,
    },
  },
  emits: ["update"],
  setup(props, { emit }) {
    const getNextValue = () => {
      switch (props.field.path) {
        case "imageList":
          return [
            {
              imageUrl: "https://cdn.test/next-banner.png",
              text: "新轮播",
              link: { clickType: 1, data: { url: "https://example.com/banner" } },
            },
          ];
        case "list":
          return [
            {
              imageUrl: "https://cdn.test/next-list.png",
              imgUrl: "https://cdn.test/next-list.png",
              brand: "新商品",
              categoryNames: "商品分类",
              price: 199,
              link: { clickType: 1, data: { url: "https://example.com/list" } },
            },
          ];
        case "noticeList":
          return [
            {
              text: "新公告",
              link: { clickType: 1, data: { url: "https://example.com/notice" } },
            },
          ];
        case "content":
          return "<p>更新后的富文本</p>";
        case "title":
          return "更新后的弹窗标题";
        case "template":
          return "twoLine3";
        case "height":
          return 16;
        case "imageUrl":
          return "https://cdn.test/next-float.png";
        case "serviceImage":
          return "https://cdn.test/next-service.png";
        case "imageWidth":
          return 188;
        default:
          return props.modelValue;
      }
    };

    return () =>
      h(
        "button",
        {
          type: "button",
          class: "material-field-stub",
          onClick: () => emit("update", getNextValue()),
        },
        props.field.path,
      );
  },
});

describe("MaterialConfigRenderer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it.each([
    {
      materialType: "Carousel",
      expectedSections: 2,
      expectedFields: 8,
      triggerPath: "imageList",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.height).toBe("200px");
        expect(payload.imageList).toEqual([
          {
            imageUrl: "https://cdn.test/next-banner.png",
            text: "新轮播",
            link: { clickType: 1, data: { url: "https://example.com/banner" } },
          },
        ]);
      },
    },
    {
      materialType: "ImageNav",
      expectedSections: 2,
      expectedFields: 7,
      triggerPath: "list",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.backgroundColor).toBe("#FFFFFF");
        expect(payload.list).toEqual([
          {
            imageUrl: "https://cdn.test/next-list.png",
            imgUrl: "https://cdn.test/next-list.png",
            brand: "新商品",
            categoryNames: "商品分类",
            price: 199,
            link: { clickType: 1, data: { url: "https://example.com/list" } },
          },
        ]);
      },
    },
    {
      materialType: "RichText",
      expectedSections: 2,
      expectedFields: 3,
      triggerPath: "content",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.backgroundColor).toBe("#ffffff");
        expect(payload.content).toBe("<p>更新后的富文本</p>");
      },
    },
    {
      materialType: "Notice",
      expectedSections: 2,
      expectedFields: 5,
      triggerPath: "noticeList",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.backgroundColor).toBe("#FFF8E9");
        expect(payload.noticeList).toEqual([
          {
            text: "新公告",
            link: { clickType: 1, data: { url: "https://example.com/notice" } },
          },
        ]);
      },
    },
    {
      materialType: "Dialog",
      expectedSections: 3,
      expectedFields: 12,
      triggerPath: "title",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.confirmText).toBe("确定");
        expect(payload.title).toBe("更新后的弹窗标题");
      },
    },
    {
      materialType: "Product",
      expectedSections: 2,
      expectedFields: 4,
      triggerPath: "list",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.layoutType).toBe("listDetail");
        expect(payload.list).toEqual([
          {
            imageUrl: "https://cdn.test/next-list.png",
            imgUrl: "https://cdn.test/next-list.png",
            brand: "新商品",
            categoryNames: "商品分类",
            price: 199,
            link: { clickType: 1, data: { url: "https://example.com/list" } },
          },
        ]);
      },
    },
    {
      materialType: "CubeSelection",
      expectedSections: 2,
      expectedFields: 6,
      triggerPath: "template",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.pageMargin).toBe(0);
        expect(payload.template).toBe("twoLine3");
      },
    },
    {
      materialType: "AssistLine",
      expectedSections: 2,
      expectedFields: 6,
      triggerPath: "height",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.type).toBe(1);
        expect(payload.height).toBe(16);
      },
    },
    {
      materialType: "FloatLayer",
      expectedSections: 2,
      expectedFields: 8,
      triggerPath: "imageUrl",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.width).toBe(100);
        expect(payload.imageUrl).toBe("https://cdn.test/next-float.png");
      },
    },
    {
      materialType: "OnlineService",
      expectedSections: 2,
      expectedFields: 9,
      triggerPath: "serviceImage",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.text).toBe("客服");
        expect(payload.serviceImage).toBe("https://cdn.test/next-service.png");
      },
    },
    {
      materialType: "Slider",
      expectedSections: 2,
      expectedFields: 9,
      triggerPath: "imageWidth",
      assertPayload: (payload: Record<string, unknown>) => {
        expect(payload.padding).toEqual([15, 15]);
        expect(payload.imageWidth).toBe(188);
      },
    },
  ])(
    "should render schema fields and emit merged props for $materialType",
    async ({ materialType, expectedSections, expectedFields, triggerPath, assertPayload }) => {
      const wrapper = mount(MaterialConfigRenderer, {
        props: {
          materialType,
          componentProps: getMaterialDefaults(materialType),
        },
        global: {
          stubs: {
            MaterialFieldRenderer: MaterialFieldRendererStub,
          },
        },
      });

      expect(wrapper.findAll(".config-section")).toHaveLength(expectedSections);
      expect(wrapper.findAll(".field-item")).toHaveLength(expectedFields);

      const targetField = wrapper
        .findAll(".material-field-stub")
        .find((item) => item.text() === triggerPath);

      expect(targetField).toBeDefined();

      await targetField!.trigger("click");
      vi.advanceTimersByTime(250);
      await nextTick();

      const updateEvents = wrapper.emitted("update");
      expect(updateEvents).toHaveLength(1);

      assertPayload(updateEvents![0][0] as Record<string, unknown>);
    },
  );
});

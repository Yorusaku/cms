import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { IPageSchemaV2 } from "@cms/types";
import {
  getMaterialDefaults,
  normalizeMaterialType,
  resolveMaterialRuntimeProps,
} from "@cms/ui";
import { usePageStore } from "../src/store/usePageStore";

const createLegacySchema = (): IPageSchemaV2 => ({
  version: "2.0.0",
  pageConfig: {
    name: "regression-page",
    shareDesc: "",
    shareImage: "",
    backgroundColor: "",
    backgroundImage: "",
    backgroundPosition: "top",
    cover: "",
  },
  componentMap: {
    notice_1: {
      id: "notice_1",
      type: "notice",
      props: {
        imageUrl: "https://cdn.test/notice-icon.png",
        noticelist: [
          {
            text: "legacy notice",
            link: "https://example.com/legacy-notice",
          },
        ],
      },
      styles: {},
      parentId: null,
      children: [],
      condition: true,
    },
    slider_1: {
      id: "slider_1",
      type: "slider",
      props: {
        imageList: [
          {
            imageUrl: "https://cdn.test/legacy-slider.png",
            link: "https://example.com/legacy-slider",
          },
        ],
        padding: [20, 12],
      },
      styles: {},
      parentId: null,
      children: [],
      condition: true,
    },
  },
  rootIds: ["notice_1", "slider_1"],
  state: undefined,
});

describe("material flow integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should normalize import, support config edits, and keep canonical types after export/import", () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = usePageStore(pinia);

    store.importPageSchema(createLegacySchema());

    const notice = store.pageSchema.componentMap.notice_1;
    const slider = store.pageSchema.componentMap.slider_1;

    expect(notice.type).toBe("Notice");
    expect(slider.type).toBe("Slider");
    expect((notice.props.noticeList as Array<{ link: unknown }>)[0].link).toEqual({
      clickType: 1,
      data: { url: "https://example.com/legacy-notice" },
    });
    expect((slider.props.list as Array<{ link: unknown }>)[0].link).toEqual({
      clickType: 1,
      data: { url: "https://example.com/legacy-slider" },
    });

    store.editComponent({
      id: "notice_1",
      props: {
        noticeList: [
          {
            text: "new notice",
            link: {
              clickType: 1,
              data: { url: "https://example.com/new-notice" },
            },
          },
        ],
      },
    });
    store.editComponent({
      id: "slider_1",
      props: {
        list: [
          {
            imageUrl: "https://cdn.test/new-slider.png",
            link: {
              clickType: 1,
              data: { url: "https://example.com/new-slider" },
            },
          },
        ],
      },
    });
    vi.advanceTimersByTime(350);

    const noticeRuntimeProps = resolveMaterialRuntimeProps("notice", notice.props);
    const sliderRuntimeProps = resolveMaterialRuntimeProps("slider", slider.props);

    expect(
      (noticeRuntimeProps.noticeList as Array<{ link: unknown }>)[0].link,
    ).toBe("https://example.com/new-notice");
    expect((sliderRuntimeProps.list as Array<{ link: unknown }>)[0].link).toBe(
      "https://example.com/new-slider",
    );

    store.addComponent({
      index: store.pageSchema.rootIds.length,
      type: "richtext",
      props: getMaterialDefaults("richtext"),
    });

    const richTextId = store.pageSchema.rootIds[store.pageSchema.rootIds.length - 1];
    const richText = store.pageSchema.componentMap[richTextId];

    expect(richText.type).toBe("RichText");
    expect(richText.props.backgroundColor).toBe("#ffffff");

    store.editComponent({
      id: richTextId,
      props: {
        content: "<p>updated rich text</p>",
      },
    });
    vi.advanceTimersByTime(350);

    const exportedSchema = store.exportPageSchema();
    expect(
      Object.values(exportedSchema.componentMap).every(
        (component) => component.type === normalizeMaterialType(component.type),
      ),
    ).toBe(true);

    const pinia2 = createPinia();
    setActivePinia(pinia2);
    const store2 = usePageStore(pinia2);
    store2.importPageSchema(exportedSchema);

    expect(store2.pageSchema.rootIds).toEqual(exportedSchema.rootIds);
    expect(store2.pageSchema.componentMap.notice_1.type).toBe("Notice");
    expect(store2.pageSchema.componentMap.slider_1.type).toBe("Slider");
    expect(
      (store2.pageSchema.componentMap.notice_1.props.noticeList as Array<{
        text: string;
      }>)[0].text,
    ).toBe("new notice");
    expect(
      (store2.pageSchema.componentMap[richTextId].props.content as string).includes(
        "updated rich text",
      ),
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, h } from "vue";
import { getMaterialDefaults } from "@cms/ui";
import { usePageStore } from "../src/store/usePageStore";
import RightConfig from "../src/views/Decorate/components/RightConfig.vue";

const MaterialConfigRendererStub = defineComponent({
  name: "MaterialConfigRenderer",
  props: {
    materialType: {
      type: String,
      required: true,
    },
  },
  emits: ["update"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        {
          type: "button",
          class: "material-config-renderer-stub",
          onClick: () => emit("update", { height: "360px" }),
        },
        props.materialType,
      );
  },
});

describe("RightConfig", () => {
  it("should update active component props through the shared config renderer", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const pageStore = usePageStore(pinia);
    pageStore.addComponent({
      index: 0,
      type: "carousel",
      props: getMaterialDefaults("Carousel"),
    });

    const activeId = pageStore.activeComponentId;
    expect(activeId).toBeTruthy();

    const wrapper = mount(RightConfig, {
      global: {
        plugins: [pinia],
        stubs: {
          MaterialConfigRenderer: MaterialConfigRendererStub,
          SetPageInfo: true,
        },
      },
    });

    await wrapper.find(".material-config-renderer-stub").trigger("click");

    expect(pageStore.pageSchema.componentMap[activeId!].type).toBe("Carousel");
    expect(pageStore.pageSchema.componentMap[activeId!].props).toMatchObject({
      height: "360px",
    });
  });
});

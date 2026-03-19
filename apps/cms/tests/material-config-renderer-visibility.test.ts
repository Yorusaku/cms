import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, type PropType } from "vue";
import type {
  MaterialDefinition,
  MaterialFieldSchema,
  MaterialSectionSchema,
} from "@cms/types";

vi.mock("@cms/ui", () => ({
  resolveMaterialDefinition: vi.fn(),
}));

import { resolveMaterialDefinition } from "@cms/ui";
import MaterialConfigRenderer from "../src/views/Decorate/components/MaterialConfigRenderer.vue";

type MaterialRenderableField = Exclude<MaterialFieldSchema, MaterialSectionSchema>;

const mockedResolveMaterialDefinition = vi.mocked(resolveMaterialDefinition);

const MaterialFieldRendererStub = defineComponent({
  name: "MaterialFieldRenderer",
  props: {
    field: {
      type: Object as PropType<MaterialRenderableField>,
      required: true,
    },
  },
  emits: ["update"],
  setup(props, { emit }) {
    const getNextValue = () => (props.field.path === "enabled" ? true : "显示后的标题");

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

const mockMaterialDefinition: MaterialDefinition = {
  type: "MockMaterial",
  aliases: ["mockmaterial"],
  group: "basic",
  label: "测试物料",
  icon: "测",
  maxCount: 1,
  defaultProps: {
    enabled: false,
    title: "",
  },
  runtimeComponent: async () => ({}) as never,
  editorConfig: {
    mode: "schema",
    schema: {
      sections: [
        {
          type: "section",
          label: "基础设置",
          fields: [
            {
              type: "switch",
              path: "enabled",
              label: "启用标题",
            },
            {
              type: "text",
              path: "title",
              label: "标题文案",
              visibleWhen: {
                field: "enabled",
                equals: true,
              },
            },
          ],
        },
      ],
    },
  },
};

describe("MaterialConfigRenderer visibility", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedResolveMaterialDefinition.mockReturnValue(mockMaterialDefinition);
  });

  afterEach(() => {
    mockedResolveMaterialDefinition.mockReset();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("should toggle conditional fields from draft props and emit updated values", async () => {
    const wrapper = mount(MaterialConfigRenderer, {
      attachTo: document.body,
      props: {
        materialType: "MockMaterial",
        componentProps: {
          enabled: false,
          title: "",
        },
      },
      global: {
        stubs: {
          MaterialFieldRenderer: MaterialFieldRendererStub,
        },
      },
    });

    const fieldItems = wrapper.findAll(".field-item");
    expect(fieldItems).toHaveLength(2);
    expect(fieldItems[1].isVisible()).toBe(false);

    await wrapper.findAll(".material-field-stub")[0].trigger("click");
    await nextTick();

    expect(wrapper.findAll(".field-item")[1].isVisible()).toBe(true);

    vi.advanceTimersByTime(250);
    await nextTick();

    const updateEvents = wrapper.emitted("update");
    expect(updateEvents).toHaveLength(1);
    expect(updateEvents![0][0]).toMatchObject({
      enabled: true,
      title: "",
    });
  });
});

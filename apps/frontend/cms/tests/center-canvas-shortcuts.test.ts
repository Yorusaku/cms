import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { getMaterialDefaults } from "@cms/ui";
import { usePageStore } from "../src/store/usePageStore";
import CenterCanvas from "../src/views/Decorate/components/CenterCanvas.vue";

describe("CenterCanvas shortcuts", () => {
  it("does not trigger global shortcuts when focus is in input", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = usePageStore(pinia);

    store.addComponent({
      index: 0,
      type: "RichText",
      props: getMaterialDefaults("RichText"),
    });

    const wrapper = mount(CenterCanvas, {
      props: { pageStore: store },
      attachTo: document.body,
      global: {
        plugins: [pinia],
      },
    });

    const deleteSpy = vi.spyOn(store, "deleteActiveComponent");
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Delete",
        bubbles: true,
      }),
    );

    expect(deleteSpy).not.toHaveBeenCalled();

    wrapper.unmount();
    document.body.removeChild(input);
  });
});

import { describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePageStore } from "../src/store/usePageStore";
import { getMaterialDefaults } from "@cms/ui";

const createStore = () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  return usePageStore(pinia);
};

describe("page store enhancements", () => {
  it("supports reorder and duplicate operations", () => {
    const store = createStore();

    store.addComponent({
      index: 0,
      type: "RichText",
      props: getMaterialDefaults("RichText"),
    });
    store.addComponent({
      index: 1,
      type: "Notice",
      props: getMaterialDefaults("Notice"),
    });

    const [firstId, secondId] = store.pageSchema.rootIds;
    store.reorderRootIds([secondId, firstId]);
    expect(store.pageSchema.rootIds).toEqual([secondId, firstId]);

    store.duplicateComponent({ id: secondId });
    expect(store.pageSchema.rootIds).toHaveLength(3);
    expect(store.pageSchema.rootIds[0]).toBe(secondId);
    expect(store.pageSchema.rootIds[1]).not.toBe(secondId);

    const duplicatedId = store.pageSchema.rootIds[1];
    expect(store.pageSchema.componentMap[duplicatedId].type).toBe(
      store.pageSchema.componentMap[secondId].type,
    );
  });

  it("deletes active component with keyboard-friendly action", () => {
    const store = createStore();

    store.addComponent({
      index: 0,
      type: "RichText",
      props: getMaterialDefaults("RichText"),
    });

    const [componentId] = store.pageSchema.rootIds;
    store.setActiveId(componentId);
    store.deleteActiveComponent();

    expect(store.pageSchema.rootIds).toHaveLength(0);
    expect(store.activeComponentId).toBeNull();
  });

  it("supports multi-selection and batch edit for same-type components", () => {
    const store = createStore();

    store.addComponent({
      index: 0,
      type: "RichText",
      props: getMaterialDefaults("RichText"),
    });
    store.addComponent({
      index: 1,
      type: "RichText",
      props: getMaterialDefaults("RichText"),
    });

    const [firstId, secondId] = store.pageSchema.rootIds;
    store.setComponentSelection([firstId, secondId]);
    expect(store.selectedComponentIds).toEqual([firstId, secondId]);

    store.batchEditComponents({
      ids: store.selectedComponentIds,
      props: {
        backgroundColor: "#000000",
      },
      condition: false,
    });

    expect(store.pageSchema.componentMap[firstId].props).toMatchObject({
      backgroundColor: "#000000",
    });
    expect(store.pageSchema.componentMap[secondId].props).toMatchObject({
      backgroundColor: "#000000",
    });
    expect(store.pageSchema.componentMap[firstId].condition).toBe(false);
    expect(store.pageSchema.componentMap[secondId].condition).toBe(false);
  });
});

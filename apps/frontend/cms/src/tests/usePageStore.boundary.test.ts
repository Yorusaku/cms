import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePageStore } from "../store/usePageStore";

describe("usePageStore - Boundary Coverage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("deleteComponent edge cases", () => {
    it("should ignore negative index", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      store.deleteComponent({ index: -1 });
      expect(store.pageSchema.rootIds).toHaveLength(2);
    });

    it("should ignore out-of-bounds index", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.deleteComponent({ index: 99 });
      expect(store.pageSchema.rootIds).toHaveLength(1);
    });
  });

  describe("deleteActiveComponent", () => {
    it("should delete the currently active component", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      const firstId = store.pageSchema.rootIds[0];
      store.setActiveId(firstId);
      store.deleteActiveComponent();
      expect(store.pageSchema.rootIds).toHaveLength(1);
      expect(store.activeComponentId).not.toBe(firstId);
      expect(store.pageSchema.componentMap[firstId]).toBeUndefined();
    });

    it("should be a no-op when no component is active", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.setActiveId(null);
      store.deleteActiveComponent();
      expect(store.pageSchema.rootIds).toHaveLength(1);
    });
  });

  describe("editComponent styles", () => {
    it("should apply styles without props", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      const id = store.pageSchema.rootIds[0];
      store.editComponent({ id, styles: { color: "red", fontSize: "14px" } });
      expect(store.pageSchema.componentMap[id].styles).toEqual({ color: "red", fontSize: "14px" });
    });
  });

  describe("batchEditComponents condition", () => {
    it("should set condition on multiple components", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      const [id1, id2] = store.pageSchema.rootIds;
      store.batchEditComponents({ ids: [id1, id2], condition: true });
      expect(store.pageSchema.componentMap[id1].condition).toBe(true);
      expect(store.pageSchema.componentMap[id2].condition).toBe(true);
    });
  });
});
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePageStore } from "../store/usePageStore";
import type { IPageSchemaV2, IComponentSchemaV2 } from "@cms/types";

describe("usePageStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("Initialization", () => {
    it("should initialize with empty page schema", () => {
      const store = usePageStore();
      expect(store.pageSchema.componentMap).toEqual({});
      expect(store.pageSchema.rootIds).toEqual([]);
      expect(store.pageSchema.version).toBe("2.0.0");
    });

    it("should initialize with default state values", () => {
      const store = usePageStore();
      expect(store.setType).toBe(1);
      expect(store.dialogImageVisible).toBe(false);
      expect(store.upLoadImgSuccess).toBeNull();
      expect(store.activeComponentId).toBeNull();
      expect(store.selectedComponentIds).toEqual([]);
      expect(store.dragActive).toBe(false);
      expect(store.addComponentIndex).toBeNull();
    });

    it("should initialize undo/redo history", () => {
      const store = usePageStore();
      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);
      expect(store.history).toHaveLength(1);
    });
  });

  describe("Page Configuration", () => {
    it("should set page config", () => {
      const store = usePageStore();
      store.setPageConfig({ name: "New Page" });
      expect(store.pageSchema.pageConfig.name).toBe("New Page");
    });

    it("should merge page config without overwriting other properties", () => {
      const store = usePageStore();
      store.setPageConfig({ name: "Page 1" });
      store.setPageConfig({ shareDesc: "Description" });
      expect(store.pageSchema.pageConfig.name).toBe("Page 1");
      expect(store.pageSchema.pageConfig.shareDesc).toBe("Description");
    });

    it("should update multiple page config properties at once", () => {
      const store = usePageStore();
      store.setPageConfig({
        name: "Test Page",
        backgroundColor: "#fff",
        backgroundImage: "url(image.jpg)",
      });
      expect(store.pageSchema.pageConfig.name).toBe("Test Page");
      expect(store.pageSchema.pageConfig.backgroundColor).toBe("#fff");
      expect(store.pageSchema.pageConfig.backgroundImage).toBe("url(image.jpg)");
    });
  });

  describe("Component Selection", () => {
    beforeEach(() => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      store.addComponent({ index: 2, type: "Image" });
    });

    it("should set active component id", () => {
      const store = usePageStore();
      const componentId = store.pageSchema.rootIds[0];
      store.setActiveId(componentId);
      expect(store.activeComponentId).toBe(componentId);
      expect(store.selectedComponentIds).toEqual([componentId]);
    });

    it("should clear active component when setting null", () => {
      const store = usePageStore();
      const componentId = store.pageSchema.rootIds[0];
      store.setActiveId(componentId);
      store.setActiveId(null);
      expect(store.activeComponentId).toBeNull();
      expect(store.selectedComponentIds).toEqual([]);
    });

    it("should set multiple component selection", () => {
      const store = usePageStore();
      const ids = store.pageSchema.rootIds.slice(0, 2);
      store.setComponentSelection(ids);
      expect(store.selectedComponentIds).toEqual(ids);
      expect(store.activeComponentId).toBe(ids[0]);
    });

    it("should filter invalid component ids in selection", () => {
      const store = usePageStore();
      const validIds = store.pageSchema.rootIds.slice(0, 2);
      store.setComponentSelection([...validIds, "invalid-id"]);
      expect(store.selectedComponentIds).toEqual(validIds);
    });

    it("should toggle component selection", () => {
      const store = usePageStore();
      const id1 = store.pageSchema.rootIds[0];
      const id2 = store.pageSchema.rootIds[1];

      store.setActiveId(id1);
      store.toggleComponentSelection(id2);
      expect(store.selectedComponentIds).toContain(id1);
      expect(store.selectedComponentIds).toContain(id2);

      store.toggleComponentSelection(id1);
      expect(store.selectedComponentIds).not.toContain(id1);
      expect(store.activeComponentId).toBe(id2);
    });

    it("should not toggle invalid component", () => {
      const store = usePageStore();
      const id1 = store.pageSchema.rootIds[0];
      store.setActiveId(id1);
      store.toggleComponentSelection("invalid-id");
      expect(store.selectedComponentIds).toEqual([id1]);
    });

    it("should clear component selection", () => {
      const store = usePageStore();
      const ids = store.pageSchema.rootIds.slice(0, 2);
      store.setComponentSelection(ids);
      store.clearComponentSelection();
      expect(store.selectedComponentIds).toEqual([]);
      expect(store.activeComponentId).toBeNull();
    });
  });

  describe("Component Operations", () => {
    it("should add component at specified index", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button", props: { text: "Click" } });
      expect(store.pageSchema.rootIds).toHaveLength(1);
      expect(store.activeComponentId).toBe(store.pageSchema.rootIds[0]);
      const component = store.pageSchema.componentMap[store.pageSchema.rootIds[0]];
      expect(component.type).toBe("Button");
      expect(component.props.text).toBe("Click");
    });

    it("should add component with styles", () => {
      const store = usePageStore();
      store.addComponent({
        index: 0,
        type: "Text",
        styles: { color: "red", fontSize: "16px" },
      });
      const component = store.pageSchema.componentMap[store.pageSchema.rootIds[0]];
      expect(component.styles.color).toBe("red");
      expect(component.styles.fontSize).toBe("16px");
    });

    it("should add multiple components in order", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      store.addComponent({ index: 2, type: "Image" });
      expect(store.pageSchema.rootIds).toHaveLength(3);
    });

    it("should clamp component index to valid range", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 100, type: "Text" });
      expect(store.pageSchema.rootIds).toHaveLength(2);
      expect(store.pageSchema.rootIds[1]).toBe(store.activeComponentId);
    });

    it("should warn when adding component without type", () => {
      const store = usePageStore();
      const warnSpy = vi.spyOn(console, "warn");
      store.addComponent({ index: 0, type: "" });
      expect(warnSpy).toHaveBeenCalled();
      expect(store.pageSchema.rootIds).toHaveLength(0);
      warnSpy.mockRestore();
    });

    it("should delete component by index", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      const firstId = store.pageSchema.rootIds[0];
      store.deleteComponent({ index: 0 });
      expect(store.pageSchema.rootIds).toHaveLength(1);
      expect(store.pageSchema.componentMap[firstId]).toBeUndefined();
    });

    it("should delete all components", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      store.deleteComponent({ index: "all" });
      expect(store.pageSchema.rootIds).toHaveLength(0);
      expect(store.pageSchema.componentMap).toEqual({});
      expect(store.activeComponentId).toBeNull();
    });

    it("should delete active component", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      const activeId = store.activeComponentId;
      store.deleteActiveComponent();
      expect(store.pageSchema.componentMap[activeId]).toBeUndefined();
    });

    it("should not delete when no active component", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.activeComponentId = null;
      store.deleteActiveComponent();
      expect(store.pageSchema.rootIds).toHaveLength(1);
    });

    it("should duplicate component", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button", props: { text: "Original" } });
      const originalId = store.pageSchema.rootIds[0];
      store.duplicateComponent({ id: originalId });
      expect(store.pageSchema.rootIds).toHaveLength(2);
      const duplicatedId = store.pageSchema.rootIds[1];
      const duplicated = store.pageSchema.componentMap[duplicatedId];
      expect(duplicated.type).toBe("Button");
      expect(duplicated.props.text).toBe("Original");
      expect(duplicated.id).not.toBe(originalId);
    });

    it("should not duplicate non-existent component", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.duplicateComponent({ id: "non-existent" });
      expect(store.pageSchema.rootIds).toHaveLength(1);
    });
  });

  describe("Component Editing", () => {
    beforeEach(() => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button", props: { text: "Click" } });
    });

    it("should edit component props", () => {
      const store = usePageStore();
      const componentId = store.pageSchema.rootIds[0];
      store.editComponent({ id: componentId, props: { text: "Updated" } });
      const component = store.pageSchema.componentMap[componentId];
      expect(component.props.text).toBe("Updated");
    });

    it("should edit component styles", () => {
      const store = usePageStore();
      const componentId = store.pageSchema.rootIds[0];
      store.editComponent({ id: componentId, styles: { color: "blue" } });
      const component = store.pageSchema.componentMap[componentId];
      expect(component.styles.color).toBe("blue");
    });

    it("should edit both props and styles", () => {
      const store = usePageStore();
      const componentId = store.pageSchema.rootIds[0];
      store.editComponent({
        id: componentId,
        props: { text: "New" },
        styles: { fontSize: "20px" },
      });
      const component = store.pageSchema.componentMap[componentId];
      expect(component.props.text).toBe("New");
      expect(component.styles.fontSize).toBe("20px");
    });

    it("should not edit non-existent component", () => {
      const store = usePageStore();
      store.editComponent({ id: "non-existent", props: { text: "Test" } });
      expect(store.pageSchema.rootIds).toHaveLength(1);
    });

    it("should batch edit multiple components", () => {
      const store = usePageStore();
      store.addComponent({ index: 1, type: "Text" });
      const ids = store.pageSchema.rootIds;
      store.batchEditComponents({
        ids,
        props: { disabled: true },
        styles: { opacity: "0.5" },
      });
      ids.forEach((id) => {
        const component = store.pageSchema.componentMap[id];
        expect(component.props.disabled).toBe(true);
        expect(component.styles.opacity).toBe("0.5");
      });
    });

    it("should batch edit component condition", () => {
      const store = usePageStore();
      store.addComponent({ index: 1, type: "Text" });
      const ids = store.pageSchema.rootIds;
      store.batchEditComponents({ ids, condition: false });
      ids.forEach((id) => {
        const component = store.pageSchema.componentMap[id];
        expect(component.condition).toBe(false);
      });
    });

    it("should filter invalid ids in batch edit", () => {
      const store = usePageStore();
      const validId = store.pageSchema.rootIds[0];
      store.batchEditComponents({
        ids: [validId, "invalid-id"],
        props: { test: true },
      });
      const component = store.pageSchema.componentMap[validId];
      expect(component.props.test).toBe(true);
    });
  });

  describe("Component Reordering", () => {
    beforeEach(() => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      store.addComponent({ index: 2, type: "Image" });
    });

    it("should reorder root ids", () => {
      const store = usePageStore();
      const [id1, id2, id3] = store.pageSchema.rootIds;
      store.reorderRootIds([id3, id1, id2]);
      expect(store.pageSchema.rootIds).toEqual([id3, id1, id2]);
    });

    it("should filter invalid ids in reorder", () => {
      const store = usePageStore();
      const [id1, id2] = store.pageSchema.rootIds;
      store.setComponentSelection([id1, id2]);
      store.reorderRootIds([id1, "invalid", id2]);
      expect(store.pageSchema.rootIds).toEqual([id1, id2]);
    });

    it("should clear active component when reordering removes it", () => {
      const store = usePageStore();
      const [id1, id2, id3] = store.pageSchema.rootIds;
      store.setActiveId(id1);
      store.reorderRootIds([id2, id3]);
      expect(store.activeComponentId).toBeNull();
      expect(store.selectedComponentIds).toEqual([]);
    });

    it("should move component from one position to another", () => {
      const store = usePageStore();
      const originalOrder = [...store.pageSchema.rootIds];
      store.moveComponent({ from: 0, to: 2 });
      expect(store.pageSchema.rootIds[0]).toBe(originalOrder[1]);
      expect(store.pageSchema.rootIds[1]).toBe(originalOrder[2]);
      expect(store.pageSchema.rootIds[2]).toBe(originalOrder[0]);
    });

    it("should not move with invalid indices", () => {
      const store = usePageStore();
      const originalOrder = [...store.pageSchema.rootIds];
      store.moveComponent({ from: -1, to: 1 });
      expect(store.pageSchema.rootIds).toEqual(originalOrder);
      store.moveComponent({ from: 0, to: 100 });
      expect(store.pageSchema.rootIds).toEqual(originalOrder);
    });

    it("should not move when from equals to", () => {
      const store = usePageStore();
      const originalOrder = [...store.pageSchema.rootIds];
      store.moveComponent({ from: 1, to: 1 });
      expect(store.pageSchema.rootIds).toEqual(originalOrder);
    });
  });

  describe("Page Schema Import/Export", () => {
    it("should export page schema", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      const exported = store.exportPageSchema();
      expect(exported.version).toBe("2.0.0");
      expect(exported.rootIds).toHaveLength(1);
      expect(exported.componentMap).toHaveProperty(exported.rootIds[0]);
    });

    it("should export deep clone of schema", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      const exported = store.exportPageSchema();
      exported.rootIds = [];
      expect(store.pageSchema.rootIds).toHaveLength(1);
    });

    it("should import page schema", () => {
      const store = usePageStore();
      const schema: IPageSchemaV2 = {
        version: "2.0.0",
        pageConfig: { name: "Imported" },
        componentMap: {},
        rootIds: [],
      };
      store.importPageSchema(schema);
      expect(store.pageSchema.pageConfig.name).toBe("Imported");
      expect(store.activeComponentId).toBeNull();
      expect(store.selectedComponentIds).toEqual([]);
    });

    it("should reset selection on import", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      const schema: IPageSchemaV2 = {
        version: "2.0.0",
        pageConfig: {},
        componentMap: {},
        rootIds: [],
      };
      store.importPageSchema(schema);
      expect(store.activeComponentId).toBeNull();
      expect(store.selectedComponentIds).toEqual([]);
    });
  });

  describe("Drag and Drop", () => {
    it("should set drag active state", () => {
      const store = usePageStore();
      store.setDragActive(true);
      expect(store.dragActive).toBe(true);
      store.setDragActive(false);
      expect(store.dragActive).toBe(false);
    });

    it("should set drag component", () => {
      const store = usePageStore();
      const component: Partial<IComponentSchemaV2> = { type: "Button" };
      store.setDragComponent(component);
      expect(store.dragComponent).toEqual(component);
    });

    it("should set drag index", () => {
      const store = usePageStore();
      store.setDragIndex(5);
      expect(store.addComponentIndex).toBe(5);
      store.setDragIndex(null);
      expect(store.addComponentIndex).toBeNull();
    });
  });

  describe("Dialog and Image Upload", () => {
    it("should set dialog image visible", () => {
      const store = usePageStore();
      store.setDialogImageVisible(true);
      expect(store.dialogImageVisible).toBe(true);
      store.setDialogImageVisible(false);
      expect(store.dialogImageVisible).toBe(false);
    });

    it("should set upload image success callback", () => {
      const store = usePageStore();
      const callback = vi.fn();
      store.setUpLoadImgSuccess(callback);
      expect(store.upLoadImgSuccess).toBe(callback);
      store.setUpLoadImgSuccess(null);
      expect(store.upLoadImgSuccess).toBeNull();
    });
  });

  describe("Page Height and Layout", () => {
    it("should update page height and components top list", () => {
      const store = usePageStore();
      const height = "1000px";
      const list = [0, 100, 200, 300];
      store.updatePageHeight({ height, list });
      expect(store.previewHeight).toBe(height);
      expect(store.componentsTopList).toEqual(list);
    });
  });

  describe("Set Type", () => {
    it("should set type", () => {
      const store = usePageStore();
      store.setSetType(2);
      expect(store.setType).toBe(2);
      store.setSetType(3);
      expect(store.setType).toBe(3);
    });
  });

  describe("Undo/Redo", () => {
    it("should undo component addition", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      expect(store.pageSchema.rootIds).toHaveLength(1);
      store.undo();
      expect(store.pageSchema.rootIds).toHaveLength(0);
    });

    it("should redo component addition", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.undo();
      store.redo();
      expect(store.pageSchema.rootIds).toHaveLength(1);
    });

    it("should track undo/redo availability", () => {
      const store = usePageStore();
      expect(store.canUndo).toBe(false);
      store.addComponent({ index: 0, type: "Button" });
      expect(store.canUndo).toBe(true);
      store.undo();
      expect(store.canRedo).toBe(true);
    });

    it("should maintain history capacity", () => {
      const store = usePageStore();
      for (let i = 0; i < 60; i++) {
        store.addComponent({ index: i, type: "Button" });
      }
      expect(store.history.length).toBeLessThanOrEqual(51);
    });
  });

  describe("Init Page Schema", () => {
    it("should reset page to initial state", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.setActiveId(store.pageSchema.rootIds[0]);
      store.setInitPageSchema();
      expect(store.pageSchema.rootIds).toHaveLength(0);
      expect(store.activeComponentId).toBeNull();
      expect(store.selectedComponentIds).toEqual([]);
    });
  });

  describe("Update Page Schema", () => {
    it("should update page schema with partial data", () => {
      const store = usePageStore();
      const newPageConfig = { name: "Updated Page" };
      store.updatePageSchema({ data: { pageConfig: newPageConfig } });
      expect(store.pageSchema.pageConfig.name).toBe("Updated Page");
    });

    it("should not update when data is undefined", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      const originalLength = store.pageSchema.rootIds.length;
      store.updatePageSchema({ data: undefined });
      expect(store.pageSchema.rootIds.length).toBe(originalLength);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple operations in sequence", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      store.addComponent({ index: 2, type: "Image" });
      const ids = store.pageSchema.rootIds;
      store.setComponentSelection([ids[0], ids[1]]);
      store.batchEditComponents({ ids: [ids[0], ids[1]], props: { disabled: true } });
      store.moveComponent({ from: 0, to: 2 });
      expect(store.pageSchema.rootIds).toHaveLength(3);
      expect(store.pageSchema.componentMap[ids[0]].props.disabled).toBe(true);
    });

    it("should maintain consistency after undo/redo with complex operations", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      const id1 = store.pageSchema.rootIds[0];
      store.batchEditComponents({ ids: [id1], props: { text: "Updated" } });
      expect(store.pageSchema.componentMap[id1].props.text).toBe("Updated");
      store.undo();
      expect(store.pageSchema.componentMap[id1].props.text).toBeUndefined();
      store.redo();
      expect(store.pageSchema.componentMap[id1].props.text).toBe("Updated");
    });

    it("should handle selection updates during component operations", () => {
      const store = usePageStore();
      store.addComponent({ index: 0, type: "Button" });
      store.addComponent({ index: 1, type: "Text" });
      const id1 = store.pageSchema.rootIds[0];
      const id2 = store.pageSchema.rootIds[1];
      store.setComponentSelection([id1, id2]);
      store.deleteComponent({ index: 0 });
      expect(store.selectedComponentIds).toContain(id2);
      expect(store.selectedComponentIds).not.toContain(id1);
    });
  });
});

import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { useRefHistory, useDebounceFn } from "@vueuse/core";
import { deepClone, migrateSchema } from "@cms/utils";
import type { IPageSchemaV2, IComponentSchemaV2 } from "@cms/types";
import { normalizeMaterialType, normalizePageSchemaMaterials } from "@cms/ui";

const generateId = (type: string): string => {
  return `${type}-${Math.random().toString(36).substr(2, 9)}`;
};

const emptyPageSchema: IPageSchemaV2 = {
  version: "2.0.0",
  pageConfig: {
    name: "页面标题",
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
};

export const usePageStore = defineStore("page", () => {
  const setType = ref(1);
  const dialogImageVisible = ref(false);
  const upLoadImgSuccess = shallowRef<((...args: unknown[]) => void) | null>(
    null,
  );
  const pageSchema = ref<IPageSchemaV2>(deepClone(emptyPageSchema));
  const activeComponentId = ref<string | null>(null);
  const dragActive = ref(false);
  const dragComponent = shallowRef<Partial<IComponentSchemaV2>>({});
  const addComponentIndex = ref<number | null>(null);
  const previewHeight = ref("");
  const componentsTopList = ref<number[]>([]);

  const { history, undo, redo, canUndo, canRedo, commit } = useRefHistory(
    pageSchema,
    {
      capacity: 50,
      deep: true,
      dump: (value) => deepClone(value),
      parse: (value) => deepClone(value),
      flush: "post",
    },
  );

  const debouncedCommit = useDebounceFn(commit, 300);

  const setInitPageSchema = () => {
    pageSchema.value = deepClone(emptyPageSchema);
    activeComponentId.value = null;
    commit();
  };

  const setSetType = (value: number) => {
    setType.value = value;
  };

  const setPageConfig = (config: Record<string, unknown>) => {
    pageSchema.value.pageConfig = { ...pageSchema.value.pageConfig, ...config };
    commit();
  };

  const setDialogImageVisible = (value: boolean) => {
    dialogImageVisible.value = value;
  };

  const setUpLoadImgSuccess = (
    value: ((...args: unknown[]) => void) | null,
  ) => {
    upLoadImgSuccess.value = value;
  };

  const setDragActive = (value: boolean) => {
    dragActive.value = value;
  };

  const setDragComponent = (value: Partial<IComponentSchemaV2>) => {
    dragComponent.value = value;
  };

  const setDragIndex = (value: number | null) => {
    addComponentIndex.value = value;
  };

  const setActiveId = (value: string | null) => {
    activeComponentId.value = value;
  };

  const addComponent = ({
    index,
    type,
    props = {},
    styles = {},
  }: {
    index: number;
    type: string;
    props?: Record<string, unknown>;
    styles?: Record<string, string>;
  }) => {
    if (!type) {
      console.warn("addComponent: 组件类型不能为空");
      return;
    }

    const normalizedType = normalizeMaterialType(type);
    const componentId = generateId(normalizedType);
    const component: IComponentSchemaV2 = {
      id: componentId,
      type: normalizedType,
      props: deepClone(props),
      styles: deepClone(styles),
      parentId: null,
      children: [],
      condition: true,
    };

    pageSchema.value.componentMap[componentId] = component;

    const insertIndex = Math.max(
      0,
      Math.min(index, pageSchema.value.rootIds.length),
    );
    pageSchema.value.rootIds.splice(insertIndex, 0, componentId);

    activeComponentId.value = componentId;
    setType.value = 2;
    addComponentIndex.value = null;
    commit();
  };

  const deleteComponent = ({ index }: { index: number | "all" }) => {
    if (index === "all") {
      pageSchema.value.componentMap = {};
      pageSchema.value.rootIds = [];
      activeComponentId.value = null;
    } else if (
      typeof index === "number" &&
      index >= 0 &&
      index < pageSchema.value.rootIds.length
    ) {
      const componentId = pageSchema.value.rootIds[index];
      delete pageSchema.value.componentMap[componentId];
      pageSchema.value.rootIds.splice(index, 1);

      if (activeComponentId.value === componentId) {
        activeComponentId.value = null;
      }
    }

    commit();
  };

  const editComponent = ({
    id,
    props,
    styles,
  }: {
    id: string;
    props?: Record<string, unknown>;
    styles?: Record<string, string>;
  }) => {
    const component = pageSchema.value.componentMap[id];
    if (!component) {
      return;
    }

    let hasChanges = false;

    if (props) {
      const oldProps = component.props;
      component.props = { ...oldProps, ...props };
      hasChanges =
        hasChanges ||
        JSON.stringify(oldProps) !== JSON.stringify(component.props);
    }

    if (styles) {
      const oldStyles = component.styles || {};
      component.styles = { ...oldStyles, ...styles };
      hasChanges =
        hasChanges ||
        JSON.stringify(oldStyles) !== JSON.stringify(component.styles);
    }

    if (hasChanges) {
      debouncedCommit();
    }
  };

  const updatePageSchema = ({ data }: { data?: Partial<IPageSchemaV2> }) => {
    if (!data) {
      return;
    }

    pageSchema.value = { ...pageSchema.value, ...data };
    commit();
  };

  const updatePageHeight = ({
    height,
    list,
  }: {
    height: string;
    list: number[];
  }) => {
    previewHeight.value = height;
    componentsTopList.value = list;
  };

  const exportPageSchema = (): IPageSchemaV2 => {
    return deepClone(pageSchema.value);
  };

  const importPageSchema = (schema: unknown) => {
    const migratedSchema = normalizePageSchemaMaterials(migrateSchema(schema));
    pageSchema.value = deepClone(migratedSchema);
    activeComponentId.value = null;
    commit();
  };

  return {
    setType,
    dialogImageVisible,
    upLoadImgSuccess,
    pageSchema,
    activeComponentId,
    dragActive,
    dragComponent,
    addComponentIndex,
    previewHeight,
    componentsTopList,
    history,
    undo,
    redo,
    canUndo,
    canRedo,
    setInitPageSchema,
    setSetType,
    setPageConfig,
    setDialogImageVisible,
    setUpLoadImgSuccess,
    setDragActive,
    setDragComponent,
    setDragIndex,
    setActiveId,
    addComponent,
    deleteComponent,
    editComponent,
    updatePageSchema,
    updatePageHeight,
    exportPageSchema,
    importPageSchema,
  };
});

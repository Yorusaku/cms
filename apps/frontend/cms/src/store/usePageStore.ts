import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { useRefHistory, useDebounceFn } from "@vueuse/core";
import { deepClone, migrateSchema } from "@cms/utils";
import type { IPageSchemaV2, IComponentSchemaV2, IComponentLinkage } from "@cms/types";
import { normalizeMaterialType, normalizePageSchemaMaterials } from "@cms/ui";
import { LinkageEngine } from "@/utils/linkage-engine";

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
  const selectedComponentIds = ref<string[]>([]);
  const dragActive = ref(false);
  const dragComponent = shallowRef<Partial<IComponentSchemaV2>>({});
  const addComponentIndex = ref<number | null>(null);
  const previewHeight = ref("");
  const componentsTopList = ref<number[]>([]);

  // 联动相关状态
  const linkages = ref<IComponentLinkage[]>([]);
  const linkageEngine = new LinkageEngine();

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
    selectedComponentIds.value = [];
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
    selectedComponentIds.value = value ? [value] : [];
  };

  const setComponentSelection = (ids: string[]) => {
    const uniqueIds = Array.from(
      new Set(ids.filter((id) => Boolean(pageSchema.value.componentMap[id]))),
    );
    selectedComponentIds.value = uniqueIds;
    activeComponentId.value = uniqueIds[0] ?? null;
  };

  const toggleComponentSelection = (id: string) => {
    if (!pageSchema.value.componentMap[id]) {
      return;
    }

    if (selectedComponentIds.value.includes(id)) {
      const nextIds = selectedComponentIds.value.filter((item) => item !== id);
      selectedComponentIds.value = nextIds;
      activeComponentId.value = nextIds[0] ?? null;
      return;
    }

    selectedComponentIds.value = [...selectedComponentIds.value, id];
    activeComponentId.value = selectedComponentIds.value[0] ?? id;
  };

  const clearComponentSelection = () => {
    selectedComponentIds.value = [];
    activeComponentId.value = null;
  };

  const reorderRootIds = (orderedIds: string[]) => {
    const validOrderedIds = orderedIds.filter((id) =>
      Boolean(pageSchema.value.componentMap[id]),
    );

    pageSchema.value.rootIds = validOrderedIds;
    selectedComponentIds.value = selectedComponentIds.value.filter((id) =>
      validOrderedIds.includes(id),
    );

    if (
      activeComponentId.value &&
      !pageSchema.value.rootIds.includes(activeComponentId.value)
    ) {
      activeComponentId.value = null;
    }

    commit();
  };

  const moveComponent = ({ from, to }: { from: number; to: number }) => {
    if (
      from < 0 ||
      to < 0 ||
      from >= pageSchema.value.rootIds.length ||
      to >= pageSchema.value.rootIds.length ||
      from === to
    ) {
      return;
    }

    const nextRootIds = [...pageSchema.value.rootIds];
    const [moved] = nextRootIds.splice(from, 1);
    nextRootIds.splice(to, 0, moved);
    pageSchema.value.rootIds = nextRootIds;
    commit();
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
      selectedComponentIds.value = [];
    } else if (
      typeof index === "number" &&
      index >= 0 &&
      index < pageSchema.value.rootIds.length
    ) {
      const componentId = pageSchema.value.rootIds[index];
      delete pageSchema.value.componentMap[componentId];
      pageSchema.value.rootIds.splice(index, 1);
      selectedComponentIds.value = selectedComponentIds.value.filter(
        (id) => id !== componentId,
      );

      if (activeComponentId.value === componentId) {
        activeComponentId.value = selectedComponentIds.value[0] ?? null;
      }
    }

    commit();
  };

  const deleteActiveComponent = () => {
    if (!activeComponentId.value) {
      return;
    }

    const componentIndex = pageSchema.value.rootIds.findIndex(
      (componentId) => componentId === activeComponentId.value,
    );

    if (componentIndex === -1) {
      activeComponentId.value = null;
      return;
    }

    deleteComponent({ index: componentIndex });
  };

  const duplicateComponent = ({ id }: { id: string }) => {
    const sourceComponent = pageSchema.value.componentMap[id];
    const sourceIndex = pageSchema.value.rootIds.findIndex(
      (componentId) => componentId === id,
    );

    if (!sourceComponent || sourceIndex === -1) {
      return;
    }

    const normalizedType = normalizeMaterialType(sourceComponent.type);
    const componentId = generateId(normalizedType);
    const duplicatedComponent: IComponentSchemaV2 = {
      ...deepClone(sourceComponent),
      id: componentId,
      type: normalizedType,
      parentId: null,
      children: [],
    };

    pageSchema.value.componentMap[componentId] = duplicatedComponent;
    pageSchema.value.rootIds.splice(sourceIndex + 1, 0, componentId);
    activeComponentId.value = componentId;
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

  const batchEditComponents = ({
    ids,
    props,
    styles,
    condition,
  }: {
    ids: string[];
    props?: Record<string, unknown>;
    styles?: Record<string, string>;
    condition?: boolean;
  }) => {
    const validIds = ids.filter((id) => Boolean(pageSchema.value.componentMap[id]));
    if (validIds.length === 0) {
      return;
    }

    validIds.forEach((id) => {
      const component = pageSchema.value.componentMap[id];
      if (!component) {
        return;
      }

      if (props) {
        component.props = {
          ...component.props,
          ...props,
        };
      }

      if (styles) {
        component.styles = {
          ...(component.styles ?? {}),
          ...styles,
        };
      }

      if (typeof condition === "boolean") {
        component.condition = condition;
      }
    });

    commit();
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

  // 联动相关方法
  const addLinkage = (linkage: IComponentLinkage) => {
    linkages.value.push(linkage);
    // 转换为运行时格式并注册
    const runtimeLinkage = convertToRuntimeLinkage(linkage);
    linkageEngine.registerLinkage(runtimeLinkage);
    commit();
  };

  const updateLinkage = (id: string, updates: Partial<IComponentLinkage>) => {
    const index = linkages.value.findIndex((l: IComponentLinkage) => l.id === id);
    if (index !== -1) {
      linkages.value[index] = { ...linkages.value[index], ...updates };
      linkageEngine.unregisterLinkage(id);
      const runtimeLinkage = convertToRuntimeLinkage(linkages.value[index]);
      linkageEngine.registerLinkage(runtimeLinkage);
      commit();
    }
  };

  const deleteLinkage = (id: string) => {
    linkages.value = linkages.value.filter((l: IComponentLinkage) => l.id !== id);
    linkageEngine.unregisterLinkage(id);
    commit();
  };

  const toggleLinkage = (id: string) => {
    const linkage = linkages.value.find((l: IComponentLinkage) => l.id === id);
    if (linkage) {
      linkage.enabled = !linkage.enabled;
      linkageEngine.setLinkageEnabled(id, linkage.enabled);
      commit();
    }
  };

  const getLinkagesForComponent = (componentId: string) => {
    return linkageEngine.getLinkagesForComponent(componentId);
  };

  // 将 Schema 中的联动配置转换为运行时格式
  const convertToRuntimeLinkage = (linkage: IComponentLinkage): any => {
    const runtime: any = { ...linkage };

    // 将字符串形式的 transformFn 转换为函数
    if (linkage.transformFn && typeof linkage.transformFn === 'string') {
      try {
        // eslint-disable-next-line no-new-func
        runtime.transformFn = new Function('value', `return ${linkage.transformFn.replace(/^\(value\)\s*=>\s*/, '')}`);
      } catch (error) {
        console.error('Failed to parse transformFn:', error);
        runtime.transformFn = undefined;
      }
    }

    return runtime;
  };

  const exportPageSchema = (): IPageSchemaV2 => {
    return {
      ...deepClone(pageSchema.value),
      linkages: linkages.value.length > 0 ? deepClone(linkages.value) : undefined,
    };
  };

  const importPageSchema = (schema: unknown) => {
    const migratedSchema = normalizePageSchemaMaterials(migrateSchema(schema));
    pageSchema.value = deepClone(migratedSchema);
    activeComponentId.value = null;
    selectedComponentIds.value = [];

    // 加载联动配置
    if (migratedSchema.linkages) {
      linkages.value = deepClone(migratedSchema.linkages);
      linkages.value.forEach((linkage: IComponentLinkage) => {
        const runtimeLinkage = convertToRuntimeLinkage(linkage);
        linkageEngine.registerLinkage(runtimeLinkage);
      });
    } else {
      linkages.value = [];
    }

    commit();
  };

  return {
    setType,
    dialogImageVisible,
    upLoadImgSuccess,
    pageSchema,
    activeComponentId,
    selectedComponentIds,
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
    setComponentSelection,
    toggleComponentSelection,
    clearComponentSelection,
    reorderRootIds,
    moveComponent,
    addComponent,
    deleteComponent,
    deleteActiveComponent,
    duplicateComponent,
    editComponent,
    batchEditComponents,
    updatePageSchema,
    updatePageHeight,
    exportPageSchema,
    importPageSchema,
    // 联动相关
    linkages,
    linkageEngine,
    addLinkage,
    updateLinkage,
    deleteLinkage,
    toggleLinkage,
    getLinkagesForComponent,
  };
});

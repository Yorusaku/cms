import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { useRefHistory } from "@vueuse/core";
import { deepClone } from "@cms/utils";
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

  const setInitPageSchema = () => {
    pageSchema.value = deepClone(emptyPageSchema);
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
    const component: IComponentSchemaV2 = {
      id: generateId(normalizedType),
      type: normalizedType,
      props: deepClone(props),
      styles: deepClone(styles),
      parentId: null,
      children: [],
    };

    pageSchema.value.componentMap[component.id] = component;

    if (
      pageSchema.value.rootIds.length === 0 ||
      index >= pageSchema.value.rootIds.length
    ) {
      pageSchema.value.rootIds.push(component.id);
    } else {
      pageSchema.value.rootIds.splice(index, 0, component.id);
    }

    activeComponentId.value = component.id;
    setType.value = 2;
    addComponentIndex.value = null;
    commit();
  };

  const deleteComponent = ({ index }: { index: number | "all" }) => {
    if (index === "all") {
      pageSchema.value.componentMap = {};
      pageSchema.value.rootIds = [];
    } else if (
      typeof index === "number" &&
      index >= 0 &&
      index < pageSchema.value.rootIds.length
    ) {
      const componentId = pageSchema.value.rootIds[index];
      delete pageSchema.value.componentMap[componentId];
      pageSchema.value.rootIds.splice(index, 1);
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
    if (component) {
      if (props) component.props = { ...component.props, ...props };
      if (styles) component.styles = { ...component.styles, ...styles };
      commit();
    }
  };

  const updatePageSchema = ({ data }: { data?: Partial<IPageSchemaV2> }) => {
    if (data) {
      pageSchema.value = { ...pageSchema.value, ...data };
      commit();
    }
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

  const importPageSchema = (schema: IPageSchemaV2) => {
    if (!schema || !schema.componentMap || !schema.rootIds) {
      console.warn("importPageSchema: 无效的页面 Schema");
      return;
    }

    pageSchema.value = deepClone(normalizePageSchemaMaterials(schema));

    // 加载联动配置
    linkageEngine.clearAllLinkages();
    if (schema.linkages) {
      linkages.value = deepClone(schema.linkages);
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
    // 联动相关
    linkages,
    linkageEngine,
  };
});

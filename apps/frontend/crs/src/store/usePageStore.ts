import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { useDebounceFn, useRefHistory } from "@vueuse/core";
import { deepClone } from "@cms/utils";
import type {
  IComponentLinkage,
  IComponentSchemaV2,
  IPageSchemaV2,
} from "@cms/types";
import { normalizeMaterialType, normalizePageSchemaMaterials } from "@cms/ui";
import { LinkageEngine } from "@/utils/linkage-engine";
import type { IComponentLinkage as RuntimeLinkage } from "@/utils/linkage-engine";

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

  const linkages = ref<IComponentLinkage[]>([]);
  const linkageEngine = new LinkageEngine();

  const { history, undo, redo, canUndo, canRedo, commit } = useRefHistory(
    pageSchema as any,
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

  const setUpLoadImgSuccess = (value: ((...args: unknown[]) => void) | null) => {
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
    if (!component) {
      return;
    }

    let changed = false;
    if (props) {
      const nextProps = { ...component.props, ...props };
      changed = changed || JSON.stringify(nextProps) !== JSON.stringify(component.props);
      component.props = nextProps;
    }
    if (styles) {
      const nextStyles = { ...(component.styles || {}), ...styles };
      changed =
        changed || JSON.stringify(nextStyles) !== JSON.stringify(component.styles || {});
      component.styles = nextStyles;
    }

    if (changed) {
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

  const updatePageHeight = ({ height, list }: { height: string; list: number[] }) => {
    previewHeight.value = height;
    componentsTopList.value = list;
  };

  const convertToRuntimeLinkage = (linkage: IComponentLinkage): RuntimeLinkage => {
    const runtime: RuntimeLinkage = {
      ...linkage,
      transformFn: undefined,
    };

    if (linkage.transformFn && typeof linkage.transformFn === "string") {
      try {
        runtime.transformFn = new Function(
          "value",
          `return ${linkage.transformFn.replace(/^\(value\)\s*=>\s*/, "")}`,
        ) as (value: unknown) => unknown;
      } catch {
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
      return;
    }

    pageSchema.value = deepClone(normalizePageSchemaMaterials(schema));
    linkageEngine.clearAllLinkages();

    if (schema.linkages) {
      linkages.value = deepClone(schema.linkages);
      linkages.value.forEach((linkage) => {
        linkageEngine.registerLinkage(convertToRuntimeLinkage(linkage));
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
    linkages,
    linkageEngine,
  };
});

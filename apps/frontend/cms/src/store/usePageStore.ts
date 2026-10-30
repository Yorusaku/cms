import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { useRefHistory } from "@vueuse/core";
import { deepClone, migrateSchema } from "@cms/utils";
import type {
  AiContentChange,
  IPageSchemaV2,
  IComponentSchemaV2,
  IComponentLinkage,
} from "@cms/types";
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
    pageSchema as any,
    {
      capacity: 50,
      deep: true,
      dump: (value) => deepClone(value),
      parse: (value) => deepClone(value),
      flush: "post",
    },
  );

  /*
   * 延迟提交（300ms 防抖）。用自管理定时器而非 useDebounceFn，
   * 以便「应用 AI 修改前 flush」「页面切换时 cancel」两个场景可控——
   * 待执行的 commit 若晚于下一次显式提交，会产生与最新快照相同的空历史步骤。
   */
  let pendingCommitTimer: ReturnType<typeof setTimeout> | null = null;

  const debouncedCommit = () => {
    if (pendingCommitTimer !== null) {
      clearTimeout(pendingCommitTimer);
    }
    pendingCommitTimer = setTimeout(() => {
      pendingCommitTimer = null;
      commit();
    }, 300);
  };

  /** 立即执行待提交的延迟 commit：让此前的人工编辑形成独立历史点 */
  const flushPendingCommit = () => {
    if (pendingCommitTimer !== null) {
      clearTimeout(pendingCommitTimer);
      pendingCommitTimer = null;
      commit();
    }
  };

  /** 丢弃待提交的延迟 commit：页面整体切换时避免污染新页面的历史 */
  const cancelPendingCommit = () => {
    if (pendingCommitTimer !== null) {
      clearTimeout(pendingCommitTimer);
      pendingCommitTimer = null;
    }
  };

  const setInitPageSchema = () => {
    cancelPendingCommit();
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

  /**
   * 应用 AI 内容更新（不同组件、不同内容类型的批量更新）。
   * 先准备完整变更再一次性写入，只合并允许字段；任一项校验失败则整批不应用。
   * 一次应用只产生一次历史：先落定待提交的人工编辑，再提交本次变更。
   */
  const applyContentChanges = (
    changes: AiContentChange[],
  ): { ok: true; applied: number } | { ok: false; reason: string } => {
    if (!Array.isArray(changes) || changes.length === 0) {
      return { ok: false, reason: "没有可应用的修改" };
    }

    const prepared: Array<{
      component: IComponentSchemaV2;
      nextProps: Record<string, unknown>;
    }> = [];

    for (const change of changes) {
      const component = pageSchema.value.componentMap[change.componentId];
      if (!component) {
        return { ok: false, reason: "目标区块已不存在，请重新生成" };
      }
      if (component.type !== change.type) {
        return { ok: false, reason: "目标区块类型已变化，请重新生成" };
      }

      const nextProps: Record<string, unknown> = { ...component.props };

      if (change.type === "RichText") {
        if (typeof change.html !== "string") {
          return { ok: false, reason: "富文本建议缺少受控内容" };
        }
        nextProps.content = change.html;
      } else if (change.type === "Notice") {
        const props = component.props;
        const key = Array.isArray(props.noticeList)
          ? "noticeList"
          : Array.isArray(props.noticelist)
            ? "noticelist"
            : "noticeList";
        const current = Array.isArray(props[key])
          ? (props[key] as Array<Record<string, unknown>>)
          : [];
        const texts = change.noticeTexts ?? [];
        if (texts.length !== current.length) {
          return { ok: false, reason: "公告项数量已变化，请重新生成" };
        }

        // 保留每项 link 等关联字段，只替换文字
        const nextList = current.map((item, index) => ({
          ...item,
          text: texts[index],
        }));
        nextProps[key] = nextList;
        // 两个字段别名同时存在时保持同步（渲染端读取 noticeList 优先）
        if (key === "noticeList" && Array.isArray(props.noticelist)) {
          nextProps.noticelist = nextList;
        }
        if (key === "noticelist" && Array.isArray(props.noticeList)) {
          nextProps.noticeList = nextList;
        }
      } else {
        if (change.title !== undefined) {
          nextProps.title = change.title;
        }
        if (change.subtitle !== undefined) {
          nextProps.subtitle = change.subtitle;
        }
        if (change.submitText !== undefined) {
          nextProps.submitText = change.submitText;
        }
      }

      prepared.push({ component, nextProps });
    }

    // 先把待提交的人工编辑落定为独立历史点（此时 schema 仍是人工编辑后的状态），
    // 再一次性写入 AI 变更并提交 → 一次应用只多一个撤销步骤
    flushPendingCommit();

    prepared.forEach(({ component, nextProps }) => {
      component.props = nextProps;
    });

    commit();

    return { ok: true, applied: prepared.length };
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
    cancelPendingCommit();
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
    applyContentChanges,
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

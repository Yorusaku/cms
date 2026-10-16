<script setup lang="ts">
import { computed, defineComponent, h, inject, onMounted, onUnmounted, ref, watch } from "vue";
import type { IComponentSchemaV2 } from "@cms/types";
import { getMaterialAsyncComponent, resolveMaterialRuntimeProps } from "@cms/ui";
import { usePageStore } from "@/store/usePageStore";
import { trackEvent } from "@/utils/tracking";

const FallbackComponent = defineComponent({
  name: "CrsMaterialFallback",
  setup() {
    return () =>
      h(
        "div",
        {
          class: "material-fallback",
        },
        "未找到对应物料组件",
      );
  },
});

interface Props {
  nodeId: string;
  componentMap: Record<string, IComponentSchemaV2>;
  pageId?: number;
  publishedVersionId?: string;
  /** 祖先组件链（自顶向下，格式 `type:id`），供埋点携带上下文 */
  ancestorPath?: string[];
}

const props = defineProps<Props>();
const pageStore = usePageStore();
const sendSelectEvent = inject<(componentId: string) => Promise<void> | void>(
  "sendSelectEvent",
  () => {},
);

const currentNode = computed(() => props.componentMap[props.nodeId]);

/** 子节点继承的祖先链：当前节点追加到父链尾部 */
const childAncestorPath = computed(() => {
  const node = currentNode.value;
  return node ? [...(props.ancestorPath ?? []), `${node.type}:${node.id}`] : props.ancestorPath ?? [];
});

const resolveComponent = (type: string) => {
  return getMaterialAsyncComponent(type) || FallbackComponent;
};

/**
 * 需要页面上下文才能完成提交的物料：线索表单与业务表单。
 * 发布页/预览页都必须拿到真实 pageId 与 publishedVersionId。
 */
const FORM_MATERIAL_TYPES = ["LeadForm", "BusinessForm"];

const shouldRender = computed(() => {
  if (!currentNode.value) return false;
  if (typeof currentNode.value.condition === "boolean") {
    return currentNode.value.condition;
  }
  return true;
});

const mergedProps = ref<Record<string, unknown>>({});

const updateMergedProps = () => {
  if (!currentNode.value) return;

  const baseProps = resolveMaterialRuntimeProps(
    currentNode.value.type,
    currentNode.value.props,
  );
  const linkageState = pageStore.linkageEngine.getComponentState(props.nodeId);

  mergedProps.value = {
    ...baseProps,
    ...linkageState,
    ...(FORM_MATERIAL_TYPES.includes(currentNode.value.type)
      ? {
          pageId: props.pageId,
          publishedVersionId: props.publishedVersionId,
        }
      : {}),
  };
};

const handleClick = async () => {
  if (currentNode.value && props.pageId) {
    const isCta = ["Button", "LeadForm", "FloatLayer"].includes(currentNode.value.type);
    void trackEvent({
      eventType: isCta ? "cta_click" : "component_click",
      pageId: props.pageId,
      publishedVersionId: props.publishedVersionId,
      componentId: currentNode.value.id,
      componentType: currentNode.value.type,
      ctaText: isCta ? String(currentNode.value.props?.text ?? currentNode.value.props?.title ?? currentNode.value.type) : undefined,
      payload: {
        source: "crs_component",
        // 递归埋点上下文：带上祖先链，便于区分「哪个容器里的按钮被点」
        ancestorPath: props.ancestorPath ?? [],
      },
    });
  }
  if (sendSelectEvent) {
    await sendSelectEvent(props.nodeId);
  }
};

/**
 * 列表类物料的运行时事件桥接：组件 emit 的运行时状态 → 联动引擎，
 * 再由页面 schema 里的 linkages 决定流向哪个目标组件。
 * 只桥接物料定义中登记的受控事件（runtimeEventProperties），不设计通用事件编排。
 */
const handleFilterChange = (payload: {
  keyword: string;
  filteredCount: number;
}) => {
  if (!currentNode.value) return;
  const engine = pageStore.linkageEngine;
  engine.triggerLinkage(
    currentNode.value.id,
    "filteredCount",
    payload.filteredCount,
  );
  engine.triggerLinkage(currentNode.value.id, "keyword", payload.keyword);
};

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  updateMergedProps();
  unsubscribe = pageStore.linkageEngine.subscribe(props.nodeId, () => {
    updateMergedProps();
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

watch(
  () => currentNode.value?.props,
  (newProps, oldProps) => {
    if (!newProps || !oldProps) return;
    Object.keys(newProps).forEach((key) => {
      if (newProps[key] !== oldProps[key]) {
        pageStore.linkageEngine.triggerLinkage(props.nodeId, key, newProps[key]);
      }
    });
  },
  { deep: true },
);
</script>

<template>
  <Suspense v-if="shouldRender && currentNode">
    <component
      :is="resolveComponent(currentNode.type)"
      :key="currentNode.id"
      v-bind="mergedProps"
      :styles="currentNode.styles"
      @click.stop="handleClick"
      @filter-change="handleFilterChange"
    >
      <template v-for="childId in currentNode.children" :key="childId">
        <RenderNode
          :node-id="childId"
          :component-map="componentMap"
          :page-id="pageId"
          :published-version-id="publishedVersionId"
          :ancestor-path="childAncestorPath"
        />
      </template>
    </component>

    <template #fallback>
      <div class="component-loading">
        <div class="loading-spinner"></div>
        <span>组件加载中...</span>
      </div>
    </template>
  </Suspense>
</template>

<style scoped>
.component-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 100px;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

.material-fallback {
  padding: 16px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 12px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

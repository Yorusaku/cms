<script setup lang="ts">
import { computed, defineComponent, h, inject, onMounted, onUnmounted, ref, watch } from "vue";
import type { IComponentSchemaV2 } from "@cms/types";
import { getMaterialAsyncComponent, resolveMaterialRuntimeProps } from "@cms/ui";
import { usePageStore } from "@/store/usePageStore";

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
}

const props = defineProps<Props>();
const pageStore = usePageStore();
const sendSelectEvent = inject<(componentId: string) => Promise<void> | void>(
  "sendSelectEvent",
  () => {},
);

const currentNode = computed(() => props.componentMap[props.nodeId]);

const resolveComponent = (type: string) => {
  return getMaterialAsyncComponent(type) || FallbackComponent;
};

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
  };
};

const handleClick = async () => {
  if (sendSelectEvent) {
    await sendSelectEvent(props.nodeId);
  }
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
    >
      <template v-for="childId in currentNode.children" :key="childId">
        <RenderNode :node-id="childId" :component-map="componentMap" />
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

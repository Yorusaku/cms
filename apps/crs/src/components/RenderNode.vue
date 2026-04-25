<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, watch, ref } from "vue";
import type { IComponentSchemaV2 } from "@cms/types";
import {
  getMaterialAsyncComponent,
  resolveMaterialRuntimeProps,
} from "@cms/ui";
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
        "未找到对应物料",
      );
  },
});

interface Props {
  nodeId: string;
  componentMap: Record<string, IComponentSchemaV2>;
}

const props = defineProps<Props>();
const pageStore = usePageStore();

const currentNode = computed(() => {
  return props.componentMap[props.nodeId];
});

const resolveComponent = (type: string) => {
  return getMaterialAsyncComponent(type) || FallbackComponent;
};

const shouldRender = computed(() => {
  if (!currentNode.value) return false;

  const condition = currentNode.value.condition;
  if (typeof condition === "boolean") {
    return condition;
  }

  return true;
});

// 联动相关：合并组件 props 和联动状态
const mergedProps = ref<Record<string, any>>({});

const updateMergedProps = () => {
  if (!currentNode.value) return;

  const baseProps = resolveMaterialRuntimeProps(
    currentNode.value.type,
    currentNode.value.props
  );

  // 获取联动引擎中的组件状态
  const linkageState = pageStore.linkageEngine.getComponentState(props.nodeId);

  // 合并 props 和联动状态
  mergedProps.value = {
    ...baseProps,
    ...linkageState,
  };
};

// 订阅联动事件
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  updateMergedProps();

  // 订阅联动事件，当该组件作为目标组件时更新 props
  unsubscribe = pageStore.linkageEngine.subscribe(props.nodeId, () => {
    updateMergedProps();
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

// 监听组件 props 变化，触发联动
watch(
  () => currentNode.value?.props,
  (newProps, oldProps) => {
    if (!newProps || !oldProps) return;

    // 检测哪些属性发生了变化
    Object.keys(newProps).forEach((key) => {
      if (newProps[key] !== oldProps[key]) {
        // 触发联动
        pageStore.linkageEngine.triggerLinkage(
          props.nodeId,
          key,
          newProps[key]
        );
      }
    });
  },
  { deep: true }
);
</script>

<template>
  <Suspense v-if="shouldRender && currentNode">
    <component
      :is="resolveComponent(currentNode.type)"
      :key="currentNode.id"
      v-bind="mergedProps"
      :styles="currentNode.styles"
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

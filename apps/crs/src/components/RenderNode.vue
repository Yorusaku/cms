<script setup lang="ts">
import { computed, defineComponent, h } from "vue";
import type { IComponentSchemaV2 } from "@cms/types";
import {
  getMaterialAsyncComponent,
  resolveMaterialRuntimeProps,
} from "@cms/ui";

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
</script>

<template>
  <Suspense v-if="shouldRender && currentNode">
    <component
      :is="resolveComponent(currentNode.type)"
      :key="currentNode.id"
      v-bind="resolveMaterialRuntimeProps(currentNode.type, currentNode.props)"
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

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { IComponentSchemaV2 } from '@cms/types'

// 异步组件加载映射
const componentAsyncMap = {
  Notice: defineAsyncComponent(() => import('@cms/ui').then((m) => m.NoticeBlock)),
  Carousel: defineAsyncComponent(() => import('@cms/ui').then((m) => m.CarouselBlock)),
  ImageNav: defineAsyncComponent(() => import('@cms/ui').then((m) => m.ImageNavBlock)),
  Product: defineAsyncComponent(() => import('@cms/ui').then((m) => m.ProductBlock)),
  RichText: defineAsyncComponent(() => import('@cms/ui').then((m) => m.RichTextBlock)),
  Slider: defineAsyncComponent(() => import('@cms/ui').then((m) => m.SliderBlock)),
  Dialog: defineAsyncComponent(() => import('@cms/ui').then((m) => m.DialogBlock)),
  AssistLine: defineAsyncComponent(() => import('@cms/ui').then((m) => m.AssistLineBlock)),
  FloatLayer: defineAsyncComponent(() => import('@cms/ui').then((m) => m.FloatLayerBlock)),
  OnlineService: defineAsyncComponent(() => import('@cms/ui').then((m) => m.OnlineServiceBlock)),
  CubeSelection: defineAsyncComponent(() => import('@cms/ui').then((m) => m.CubeSelectionBlock))
}

interface Props {
  nodeId: string
  componentMap: Record<string, IComponentSchemaV2>
}

const props = defineProps<Props>()

// 获取当前节点数据
const currentNode = computed(() => {
  return props.componentMap[props.nodeId]
})

// 解析组件类型（使用异步组件）
const resolveComponent = (type: string) => {
  const AsyncComponent = componentAsyncMap[type as keyof typeof componentAsyncMap]
  if (!AsyncComponent) {
    console.warn(`未找到组件类型：${type}`)
    return null
  }
  return AsyncComponent
}

// 条件渲染判断
const shouldRender = computed(() => {
  if (!currentNode.value) return false

  const condition = currentNode.value.condition
  // boolean 类型直接返回
  if (typeof condition === 'boolean') {
    return condition
  }
  // string 类型或其他情况默认显示
  return true
})
</script>

<template>
  <Suspense v-if="shouldRender && currentNode">
    <component
      :is="resolveComponent(currentNode.type)"
      :key="currentNode.id"
      v-bind="currentNode.props"
      :styles="currentNode.styles"
    >
      <!-- 递归渲染子节点 -->
      <template v-for="childId in currentNode.children" :key="childId">
        <RenderNode
          :node-id="childId"
          :component-map="componentMap"
        />
      </template>
    </component>

    <!-- 加载状态 -->
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

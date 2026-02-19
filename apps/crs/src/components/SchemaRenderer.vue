<template>
  <div class="schema-renderer">
    <div v-if="!props.pageSchema || !props.pageSchema.components" class="empty-state">暂无组件数据</div>
    <div v-else class="components-list">
      <div
        v-for="component in props.pageSchema.components"
        :key="component.id"
        class="component-wrapper"
        @click.stop="handleComponentClick(component.id)"
      >
        <component
          :is="resolveComponent(component.type)"
          v-bind="component.props"
          :style="component.styles"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, markRaw } from 'vue'
import { MESSAGE_TYPE } from '@cms/types'
import type { IPageSchema, IMessagePayload } from '@cms/types'

interface Props {
  pageSchema: IPageSchema | null
}

const props = defineProps<Props>()

const componentMap = markRaw<Record<string, ReturnType<typeof defineAsyncComponent>>>({
  Carousel: defineAsyncComponent(() => import('./Carousel.vue')),
  Dialog: defineAsyncComponent(() => import('./Dialog.vue')),
  ImageNav: defineAsyncComponent(() => import('./ImageNav.vue')),
  Notice: defineAsyncComponent(() => import('./Notice.vue')),
  Product: defineAsyncComponent(() => import('./Product.vue')),
  RichText: defineAsyncComponent(() => import('./RichText.vue')),
  Slider: defineAsyncComponent(() => import('./Slider.vue')),
  AssistLine: defineAsyncComponent(() => import('./AssistLine.vue')),
  FloatLayer: defineAsyncComponent(() => import('./FloatLayer.vue')),
  OnlineService: defineAsyncComponent(() => import('./OnlineService.vue')),
  CubeSelection: defineAsyncComponent(() => import('./CubeSelection.vue'))
})

const resolveComponent = (type: string) => {
  return componentMap[type] || FallbackComponent
}

const FallbackComponent = defineAsyncComponent(() => import('./FallbackComponent.vue'))

const handleComponentClick = (id: string) => {
  if (window.parent && window.parent !== window) {
    const payload: IMessagePayload<{ id: string }> = {
      type: MESSAGE_TYPE.ON_SELECT_BLOCK,
      data: { id }
    }
    window.parent.postMessage(payload, '*')
  }
}
</script>

<style scoped>
.schema-renderer {
  width: 100%;
  min-height: 100vh;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #999;
  font-size: 14px;
}

.components-list {
  width: 100%;
}
</style>

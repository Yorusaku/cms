<script setup lang="ts">
import { computed } from 'vue'
import type { IPageSchemaV2 } from '@cms/types'
import RenderNode from './RenderNode.vue'

interface Props {
  pageSchema: IPageSchemaV2
}

const props = defineProps<Props>()

// V2架构下不再需要组件映射，由RenderNode处理

// 计算页面背景样式
const pageBackgroundStyle = computed(() => {
  const config = props.pageSchema.pageConfig || {}
  const styles: Record<string, string> = {}
  
  // 背景颜色
  if (config.backgroundColor && typeof config.backgroundColor === 'string') {
    styles.backgroundColor = config.backgroundColor
  }
  
  // 背景图片
  if (config.backgroundImage && typeof config.backgroundImage === 'string') {
    styles.backgroundImage = `url(${config.backgroundImage})`
    styles.backgroundRepeat = 'no-repeat'
    styles.backgroundSize = 'cover'
    
    // 背景位置
    if (config.backgroundPosition && typeof config.backgroundPosition === 'string') {
      styles.backgroundPosition = config.backgroundPosition
    } else {
      styles.backgroundPosition = 'center top'
    }
  }
  
  return styles
})
</script>

<template>
  <div 
    class="schema-renderer min-h-screen w-full"
    :style="pageBackgroundStyle"
  >
    <!-- 渲染页面组件 -->
    <div class="page-components">
      <template v-for="nodeId in pageSchema.rootIds" :key="nodeId">
        <RenderNode 
          :node-id="nodeId" 
          :component-map="pageSchema.componentMap" 
        />
      </template>
    </div>
    
    <!-- 空状态提示 -->
    <div 
      v-if="pageSchema.rootIds.length === 0" 
      class="empty-state flex items-center justify-center min-h-screen"
    >
      <div class="text-center text-gray-500">
        <div class="text-6xl mb-4">📱</div>
        <p class="text-xl">页面内容为空</p>
        <p class="text-sm mt-2">请在CMS后台添加组件</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式已在Tailwind类中定义 */

.page-components {
  /* 组件容器样式 */
  width: 100%;
}

.empty-state {
  /* 空状态样式 */
  padding: 2rem;
}
</style>
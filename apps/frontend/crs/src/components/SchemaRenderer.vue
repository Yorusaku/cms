<script setup lang="ts">
import { computed } from 'vue'
import type { IPageSchemaV2 } from '@cms/types'
import RenderNode from './RenderNode.vue'

interface Props {
  pageSchema: IPageSchemaV2
  pageId?: number
  publishedVersionId?: string
  /** 预览模式：预览页禁用表单写入，正式发布页不传 */
  previewMode?: boolean
}

const props = defineProps<Props>()

/**
 * 业务布局：字号按 375 设计稿固定，内容居中限宽。
 * 缺省仍是 mobile（旧营销页），不改变现有表现。
 */
const isBusinessLayout = computed(() => props.pageSchema.pageConfig?.layoutMode === 'business')

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
    :class="{ 'layout-business': isBusinessLayout }"
    :style="pageBackgroundStyle"
  >
    <!-- 渲染页面组件 -->
    <div class="page-components">
      <template v-for="nodeId in pageSchema.rootIds" :key="nodeId">
        <RenderNode
          :node-id="nodeId"
          :component-map="pageSchema.componentMap"
          :page-id="pageId"
          :published-version-id="publishedVersionId"
          :preview-mode="previewMode"
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

/* 默认底色由页面配置覆盖；编辑器的辅助边界不属于运行时页面样式。 */
.schema-renderer {
  background-color: var(--color-bg-card);
}

.page-components {
  width: 100%;
}

/*
 * business 布局：
 * --design-vw 把设计稿换算基准限制在 375，字号不随浏览器宽度放大；
 * 宽度靠 max-width + 居中控制，列表占满内容宽度，表单单独限宽。
 */
.layout-business {
  --design-vw: calc(min(100vw, 375px) / 100);
  background-color: var(--color-bg-page, #f5f7fa);
}

.layout-business .page-components {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 16px 32px;
  box-sizing: border-box;
}

.layout-business :deep(.ticket-exception-form),
.layout-business :deep(.business-form-block) {
  width: 100%;
  max-width: 720px;
  margin-right: auto;
  margin-left: auto;
}

.layout-business :deep(.ticket-exception-form h3),
.layout-business :deep(.business-list-block h3) {
  font-size: 22px;
}

/* 正文与说明统一 14px：业务页在小屏与桌面下字号一致 */
.layout-business :deep(.ticket-exception-form .field-label),
.layout-business :deep(.business-list-block .list-header p),
.layout-business :deep(.business-list-block .list-header h3 + p) {
  font-size: 14px;
}

.empty-state {
  /* 空状态样式 */
  padding: 2rem;
}
</style>

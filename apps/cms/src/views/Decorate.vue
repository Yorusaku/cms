<template>
  <div class="decorate-container">
    <div class="decorate-header">
      <h1>页面搭建</h1>
      <div class="header-actions">
        <el-button :disabled="!pageStore.canUndo" @click="pageStore.undo">撤销</el-button>
        <el-button :disabled="!pageStore.canRedo" @click="pageStore.redo">重做</el-button>
        <el-button type="primary" @click="handleExport">导出 Schema</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="decorate-content">
      <div class="component-sidebar">
        <h3>组件列表</h3>
        <div class="component-list">
          <div
            v-for="component in availableComponents"
            :key="component.type"
            class="component-item"
            draggable="true"
            @dragstart="handleDragStart($event, component)"
          >
            {{ component.label }}
          </div>
        </div>
      </div>

      <div class="canvas-area">
        <div class="canvas" @dragover.prevent @drop="handleDrop">
          <div v-if="pageStore.pageSchema.components.length === 0" class="empty-canvas">
            拖拽组件到这里
          </div>
          <div
            v-for="(component, index) in pageStore.pageSchema.components"
            :key="component.id"
            class="canvas-component"
            :class="{ active: pageStore.activeComponentId === component.id }"
            @click="handleSelectComponent(component.id)"
          >
            <component
              :is="resolveComponent(component.type)"
              v-bind="component.props"
              :style="component.styles"
            />
            <div class="component-actions">
              <el-button size="small" @click.stop="handleDeleteComponent(index)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="preview-area">
        <h3>实时预览</h3>
        <div class="preview-container">
          <PreviewIframe :preview-url="crsPreviewUrl" />
        </div>
      </div>

      <div class="config-panel">
        <h3>组件配置</h3>
        <div
          v-if="activeComponent && resolveConfigComponent(activeComponent.type)"
          class="config-content"
        >
          <component
            :is="resolveConfigComponent(activeComponent.type)"
            :component-props="activeComponent.props"
            @update="handleConfigUpdate"
          />
        </div>
        <div v-else-if="activeComponent" class="config-content">
          <p class="text-gray-500 text-sm">暂无 {{ activeComponent.type }} 的配置面板</p>
        </div>
        <div v-else class="config-empty">请在画布中选择组件</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, markRaw } from 'vue'
import { usePageStore } from '../store/usePageStore'
import { ElMessage } from 'element-plus'
import PreviewIframe from '../components/PreviewIframe.vue'
import { NoticeDefaultConfig } from '@cms/ui'

const pageStore = usePageStore()

const crsPreviewUrl = computed(() => {
  return import.meta.env.VITE_CRS_PREVIEW_URL || 'http://localhost:3003/page-preview'
})

const availableComponents = markRaw([
  { type: 'Carousel', label: '轮播图' },
  { type: 'Dialog', label: '弹窗' },
  { type: 'ImageNav', label: '图片导航' },
  { type: 'Notice', label: '公告' },
  { type: 'Product', label: '商品' },
  { type: 'RichText', label: '富文本' },
  { type: 'Slider', label: '滑块' },
  { type: 'AssistLine', label: '辅助线' },
  { type: 'FloatLayer', label: '浮动层' },
  { type: 'OnlineService', label: '在线客服' },
  { type: 'CubeSelection', label: '魔方选择' }
])

const componentDefaultConfigs = markRaw<Record<string, unknown>>({
  Notice: NoticeDefaultConfig.props
})

const componentMap = markRaw<Record<string, ReturnType<typeof defineAsyncComponent>>>({
  Carousel: defineAsyncComponent(() => import('../components/Carousel.vue')),
  Dialog: defineAsyncComponent(() => import('../components/Dialog.vue')),
  ImageNav: defineAsyncComponent(() => import('../components/ImageNav.vue')),
  Notice: defineAsyncComponent(() => import('../components/Notice.vue')),
  Product: defineAsyncComponent(() => import('../components/Product.vue')),
  RichText: defineAsyncComponent(() => import('../components/RichText.vue')),
  Slider: defineAsyncComponent(() => import('../components/Slider.vue')),
  AssistLine: defineAsyncComponent(() => import('../components/AssistLine.vue')),
  FloatLayer: defineAsyncComponent(() => import('../components/FloatLayer.vue')),
  OnlineService: defineAsyncComponent(() => import('../components/OnlineService.vue')),
  CubeSelection: defineAsyncComponent(() => import('../components/CubeSelection.vue'))
})

const configMap = markRaw<Record<string, ReturnType<typeof defineAsyncComponent>>>({
  Notice: defineAsyncComponent(() => import('../components/NoticeConfig.vue'))
})

const activeComponent = computed(() => {
  return pageStore.pageSchema.components.find(c => c.id === pageStore.activeComponentId) || null
})

const resolveComponent = (type: string) => {
  return componentMap[type] || FallbackComponent
}

const resolveConfigComponent = (type: string) => {
  return configMap[type] || null
}

const FallbackComponent = defineAsyncComponent(() => import('../components/FallbackComponent.vue'))

const handleConfigUpdate = (props: unknown) => {
  if (activeComponent.value) {
    pageStore.editComponent({
      id: activeComponent.value.id,
      props: props as Record<string, unknown>
    })
  }
}

const handleDragStart = (_event: DragEvent, component: { type: string; label: string }) => {
  pageStore.setDragActive(true)
  pageStore.setDragComponent({ type: component.type })
}

const handleDrop = (_event: DragEvent) => {
  const dragComponent = pageStore.dragComponent
  if (dragComponent && dragComponent.type) {
    const index = pageStore.pageSchema.components.length
    const defaultProps = componentDefaultConfigs[dragComponent.type] || {}
    pageStore.addComponent({
      index,
      type: dragComponent.type,
      props: defaultProps as Record<string, unknown>,
      styles: {}
    })
  }
  pageStore.setDragActive(false)
  pageStore.setDragComponent({})
}

const handleSelectComponent = (id: string) => {
  pageStore.setActiveId(id)
}

const handleDeleteComponent = (index: number) => {
  pageStore.deleteComponent({ index })
}

const handleExport = () => {
  const schema = pageStore.exportPageSchema()
  console.log('导出的 Schema:', schema)
  ElMessage.success('Schema 已导出到控制台')
}

const handleReset = () => {
  pageStore.setInitPageSchema()
  ElMessage.success('页面已重置')
}
</script>

<style scoped>
.decorate-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.decorate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.decorate-header h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.decorate-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.component-sidebar {
  width: 240px;
  padding: 16px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.component-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-item {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  cursor: move;
  transition: all 0.2s;
}

.component-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.canvas-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.canvas {
  max-width: 375px;
  margin: 0 auto;
  min-height: 600px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.empty-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #909399;
  font-size: 14px;
}

.canvas-component {
  position: relative;
  margin-bottom: 16px;
  border: 2px solid transparent;
  border-radius: 4px;
  transition: all 0.2s;
}

.canvas-component:hover {
  border-color: #409eff;
}

.canvas-component.active {
  border-color: #409eff;
}

.component-actions {
  position: absolute;
  top: -32px;
  right: 0;
  display: none;
}

.canvas-component:hover .component-actions,
.canvas-component.active .component-actions {
  display: block;
}

.preview-area {
  width: 400px;
  padding: 16px;
  background-color: #fff;
  border-left: 1px solid #e4e7ed;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.preview-area h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.preview-container {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.config-panel {
  width: 280px;
  padding: 16px;
  background-color: #fff;
  overflow-y: auto;
}

.config-panel h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.config-content {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.config-empty {
  padding: 16px;
  color: #909399;
  text-align: center;
}
</style>

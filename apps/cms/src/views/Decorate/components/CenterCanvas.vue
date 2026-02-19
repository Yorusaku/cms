<template>
  <div class="canvas-area">
    <div class="canvas-wrapper">
      <div class="canvas-header">
        <h3>页面画布</h3>
        <div class="canvas-actions">
          <el-button
            :disabled="pageStore.pageSchema.components.length === 0"
            @click="handlePreview"
          >
            预览页面
          </el-button>
        </div>
      </div>
      <div class="canvas-container">
        <div
          class="canvas-dropzone"
          @dragover="dragDrop.handleDragOver"
          @drop="dragDrop.handleDrop"
        >
          <div v-if="pageStore.pageSchema.components.length === 0" class="empty-canvas">
            <div class="empty-icon">📁</div>
            <p>从左侧拖拽组件到此处</p>
            <p class="empty-tip">支持排序和配置</p>
          </div>
          <div
            v-for="(component, index) in pageStore.pageSchema.components"
            :key="component.id"
            class="canvas-component"
            :class="{ active: pageStore.activeComponentId === component.id }"
            @click="handleSelectComponent(component.id)"
          >
            <div class="component-drag-handle">⋮⋮</div>
            <div class="component-content">
              <component
                :is="resolveComponent(component.type)"
                v-bind="component.props"
                :style="component.styles"
              />
            </div>
            <div class="component-actions">
              <el-button size="small" type="danger" @click.stop="handleDeleteComponent(index)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { ElMessage } from 'element-plus'
import { usePageStore } from '../../../store/usePageStore'
import type { MaterialConfig } from '../types'
import { useDragDrop } from '../hooks/useDragDrop'

interface Props {
  pageStore: ReturnType<typeof usePageStore>
  materialConfig: MaterialConfig
}

const props = defineProps<Props>()

const dragDrop = useDragDrop()

const _activeComponent = computed(() => {
  return (
    props.pageStore.pageSchema.components.find(
      (c: any) => c.id === props.pageStore.activeComponentId
    ) || null
  )
})

const resolveComponent = (type: string) => {
  return props.materialConfig.componentMap[type] || FallbackComponent
}

const FallbackComponent = defineAsyncComponent(
  () => import('../../../components/FallbackComponent.vue')
)

const handleSelectComponent = (id: string) => {
  props.pageStore.setActiveId(id)
}

const handleDeleteComponent = (index: number) => {
  props.pageStore.deleteComponent({ index })
}

const handlePreview = () => {
  ElMessage.success('预览功能待实现')
}
</script>

<style scoped>
.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #f5f7fa;
  overflow: hidden;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.canvas-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.canvas-actions {
  display: flex;
  gap: 8px;
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.canvas-dropzone {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 500px;
}

.empty-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #909399;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-canvas p {
  margin: 8px 0;
  font-size: 14px;
}

.empty-tip {
  font-size: 12px !important;
  color: #c0c4cc !important;
}

.canvas-component {
  position: relative;
  margin-bottom: 16px;
  border: 2px solid transparent;
  border-radius: 6px;
  transition: all 0.3s ease;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.canvas-component:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.canvas-component.active {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
}

.component-drag-handle {
  position: absolute;
  left: -32px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background-color: #409eff;
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: move;
  opacity: 0;
  transition: opacity 0.2s;
}

.canvas-component:hover .component-drag-handle {
  opacity: 1;
}

.component-content {
  padding: 16px;
}

.component-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: none;
  z-index: 10;
}

.canvas-component:hover .component-actions,
.canvas-component.active .component-actions {
  display: block;
}
</style>

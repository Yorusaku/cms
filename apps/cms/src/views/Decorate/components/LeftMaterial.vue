<template>
  <div class="component-sidebar">
    <h3>组件列表</h3>
    <el-collapse v-model="activeNames">
      <el-collapse-item
        v-for="(group, index) in materialConfig.componentGroups"
        :key="index"
        :title="group.title"
        :name="index + 1"
      >
        <ul class="component-list">
          <li
            v-for="component in group.components"
            :key="component.type"
            :class="isDraggable(component) ? 'drag-enabled' : 'drag-disabled'"
            :draggable="isDraggable(component)"
            @dragstart="onDragstart(component, $event)"
            @dragend="onDragend($event)"
          >
            <img :src="component.icon" :alt="component.label" class="component-icon" />
            <p class="name">
              {{ component.label }}
            </p>
            <p class="num">
              {{ `${getComponentCount(component.type) || 0}/${component.max}` }}
            </p>
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MaterialConfig } from '../types'
import type { ComponentItem } from '@/config/component-groups'
import { usePageStore } from '@/store/usePageStore'
import { getComponentDefault, getComponentMaxNum } from '@/config/component-defaults'

interface Props {
  materialConfig: MaterialConfig
}

withDefaults(defineProps<Props>(), {})

const pageStore = usePageStore()

const activeNames = ref([1, 2])

const getComponentCount = (type: string): number => {
  const components = pageStore.pageSchema?.components || []
  return components.filter(comp => comp.type === type).length
}

const isDraggable = (component: ComponentItem): boolean => {
  const currentCount = getComponentCount(component.type)
  const maxCount = getComponentMaxNum(component.type)
  return currentCount < maxCount
}

const onDragstart = (component: ComponentItem, _event: DragEvent) => {
  pageStore.setDragActive(true)

  const defaultProps = getComponentDefault(component.type)

  const dragComponent = {
    ...component,
    props: defaultProps
  }

  pageStore.setDragComponent(dragComponent)
}

const onDragend = (_event: DragEvent) => {
  pageStore.setDragActive(false)
  const addIndex = pageStore.addComponentIndex

  if (addIndex != null) {
    const dragComponent = pageStore.dragComponent
    if (dragComponent && (dragComponent as Record<string, unknown>).type) {
      const componentType = (dragComponent as Record<string, unknown>).type as string
      const defaultProps = getComponentDefault(componentType)

      pageStore.addComponent({
        index: addIndex,
        type: componentType,
        props: defaultProps
      })

      pageStore.setDragIndex(null)
    }
  }
}
</script>

<style scoped>
.component-sidebar {
  position: absolute;
  top: 56px;
  left: 0;
  width: 186px;
  overflow-x: hidden;
  overflow-y: auto;
  bottom: 0;
  background: #fff;
  user-select: none;
}

.component-sidebar h3 {
  margin: 16px 0 8px 20px;
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

.component-list {
  overflow: hidden;
  list-style: none;
  padding: 0;
  margin: 0;
}

.component-list li {
  float: left;
  width: 50%;
  font-size: 12px;
  padding-bottom: 8px;
  text-align: center;
}

.component-list li.drag-enabled {
  cursor: move;
}

.component-list li.drag-disabled {
  cursor: not-allowed;
}

.component-list li.drag-enabled:hover {
  background: #ecf5ff;
  color: #fff;
  border-radius: 2px;
}

.component-list li.drag-enabled:hover .name,
.component-list li.drag-enabled:hover .num {
  color: #ffffff !important;
}

.component-icon {
  display: inline-block;
  margin-top: 8px;
  height: 32px;
  width: 32px;
}

.name {
  line-height: 16px;
  margin-top: -4px;
  color: #606266;
}

.num {
  line-height: 16px;
  font-size: 12px;
  color: #999999;
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  border: none;
  height: 30px;
  line-height: 30px;
  padding: 0 20px;
}

:deep(.el-collapse-item__wrap) {
  border: none;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
</style>

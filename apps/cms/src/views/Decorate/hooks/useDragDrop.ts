/*
 * 拖拽逻辑 Hook - 抽离拖拽相关功能
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { usePageStore } from '@/store/usePageStore'
import { canAddComponent } from '@/config/component-groups'
import type { ComponentItem } from '../../../config/component-groups'
import type { DragComponent } from '../types'

interface UseDragDropReturn {
  isDraggable: boolean
  handleDragStart: (event: DragEvent, component: ComponentItem) => boolean
  handleDragEnd: () => void
  handleDragOver: (event: DragEvent) => void
  handleDragLeave: () => void
  handleDrop: (event: DragEvent) => void
  isComponentDisabled: (type: string) => boolean
  getComponentCount: (type: string) => number
}

export function useDragDrop(): UseDragDropReturn {
  const pageStore = usePageStore()
  const isDraggable = ref(true)

  // 获取当前已添加的组件数量
  const getComponentCount = (type: string): number => {
    return Object.values(pageStore.pageSchema.componentMap)
      .filter((c: any) => c.type === type).length
  }

  // 检查组件是否可以添加
  const isComponentDisabled = (type: string): boolean => {
    const currentCount = getComponentCount(type)
    return !canAddComponent(type, currentCount)
  }

  // 处理拖拽开始
  const handleDragStart = (event: DragEvent, component: ComponentItem): boolean => {
    // 检查是否可以添加该组件
    if (isComponentDisabled(component.type)) {
      event.preventDefault()
      ElMessage.warning(`${component.label}已达最大添加数量`)
      return false
    }

    // 设置拖拽数据
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('text/plain', component.type)
    }

    pageStore.setDragActive(true)
    pageStore.setDragComponent({ type: component.type } as DragComponent)

    return true
  }

  // 处理拖拽结束
  const handleDragEnd = (): void => {
    pageStore.setDragActive(false)
    pageStore.setDragComponent({})
  }

  // 处理拖拽经过
  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  // 处理拖拽离开
  const handleDragLeave = (): void => {
    // 可以在这里添加视觉反馈逻辑
  }

  // 处理放置
  const handleDrop = (event: DragEvent): void => {
    event.preventDefault()

    const dragComponent = pageStore.dragComponent
    if (dragComponent && dragComponent.type) {
      const index = pageStore.pageSchema.rootIds.length
      // 注意：这里需要从外部传入默认配置或使用全局配置
      const defaultProps = {} // 将在组件中处理

      pageStore.addComponent({
        index,
        type: dragComponent.type,
        props: defaultProps,
        styles: {}
      })
    }

    handleDragEnd()
  }

  return {
    isDraggable: isDraggable.value,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isComponentDisabled,
    getComponentCount
  }
}

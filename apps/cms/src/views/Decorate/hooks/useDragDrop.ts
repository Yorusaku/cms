/*
 * 拖拽逻辑 Hook
 */
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { usePageStore } from "@/store/usePageStore";
import { getMaterialDefaults, resolveMaterialDefinition } from "@cms/ui";
import type { DragComponent } from "../types";

interface UseDragDropReturn {
  isDraggable: boolean;
  handleDragStart: (
    event: DragEvent,
    component: { type: string; label: string },
  ) => boolean;
  handleDragEnd: () => void;
  handleDragOver: (event: DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (event: DragEvent) => void;
  isComponentDisabled: (type: string) => boolean;
  getComponentCount: (type: string) => number;
}

export function useDragDrop(): UseDragDropReturn {
  const pageStore = usePageStore();
  const isDraggable = ref(true);

  const getComponentCount = (type: string): number => {
    return Object.values(pageStore.pageSchema.componentMap).filter(
      (component) => component.type === type,
    ).length;
  };

  const isComponentDisabled = (type: string): boolean => {
    const currentCount = getComponentCount(type);
    const definition = resolveMaterialDefinition(type);
    if (!definition) {
      return true;
    }

    return currentCount >= definition.maxCount;
  };

  const handleDragStart = (
    event: DragEvent,
    component: { type: string; label: string },
  ): boolean => {
    if (isComponentDisabled(component.type)) {
      event.preventDefault();
      ElMessage.warning(`${component.label}已达到最大添加数量`);
      return false;
    }

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", component.type);
    }

    pageStore.setDragActive(true);
    pageStore.setDragComponent({
      type: component.type,
      props: getMaterialDefaults(component.type),
    } as DragComponent);

    return true;
  };

  const handleDragEnd = (): void => {
    pageStore.setDragActive(false);
    pageStore.setDragComponent({});
  };

  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDragLeave = (): void => {
    // 预留视觉反馈
  };

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault();

    const dragComponent = pageStore.dragComponent;
    if (dragComponent && dragComponent.type) {
      const index = pageStore.pageSchema.rootIds.length;
      pageStore.addComponent({
        index,
        type: dragComponent.type,
        props:
          (dragComponent.props as Record<string, unknown>) ??
          getMaterialDefaults(dragComponent.type),
        styles: {},
      });
    }

    handleDragEnd();
  };

  return {
    isDraggable: isDraggable.value,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isComponentDisabled,
    getComponentCount,
  };
}

<template>
  <div class="canvas-area">
    <div class="canvas-wrapper">
      <div class="canvas-header">
        <h3>页面画布</h3>
        <div class="canvas-actions">
          <el-button :disabled="sortableComponents.length === 0" @click="handlePreview">
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
          <div v-if="sortableComponents.length === 0" class="empty-canvas">
            <div class="empty-icon">画</div>
            <p>从左侧拖拽物料到此处</p>
            <p class="empty-tip">支持配置与预览同步</p>
          </div>
          <VueDraggable
            v-else
            v-model="sortableComponents"
            item-key="id"
            handle=".component-drag-handle"
            :animation="220"
            ghost-class="sortable-ghost"
            chosen-class="sortable-chosen"
            class="sortable-list"
          >
            <template #item="{ element: component, index }">
              <div
                class="canvas-component"
                :class="{
                  active: pageStore.activeComponentId === component.id,
                  selected: pageStore.selectedComponentIds.includes(component.id),
                }"
                @click="handleSelectComponent(component.id, $event)"
              >
                <div class="component-drag-handle">拖</div>
                <div class="component-content">
                  <component
                    :is="resolveComponent(component.type)"
                    v-bind="resolveRuntimeProps(component.type, component.props)"
                    :style="component.styles"
                  />
                </div>
                <div class="component-actions">
                  <el-button size="small" @click.stop="handleDuplicateComponent(component.id)">
                    复制
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click.stop="handleDeleteComponent(index)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </template>
          </VueDraggable>
          <div v-if="pageStore.activeComponentId" class="keyboard-hint">
            支持 Delete 删除、Ctrl/Cmd+C 复制、Ctrl/Cmd+Z 撤销、Ctrl/Cmd+Y 重做、Alt+↑/↓ 调整顺序
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useEventListener } from "@vueuse/core";
import { ElMessage } from "element-plus";
import { VueDraggable } from "vue-draggable-plus";
import { usePageStore } from "../../../store/usePageStore";
import { useDragDrop } from "../hooks/useDragDrop";
import {
  getMaterialAsyncComponent,
  getOrderedComponents,
  resolveMaterialRuntimeProps,
} from "@cms/ui";

interface Props {
  pageStore: ReturnType<typeof usePageStore>;
}

const props = defineProps<Props>();

const dragDrop = useDragDrop();
const orderedComponents = computed(() =>
  getOrderedComponents(props.pageStore.pageSchema),
);
const sortableComponents = computed({
  get: () => orderedComponents.value,
  set: (components) => {
    props.pageStore.reorderRootIds(components.map((component) => component.id));
  },
});

const FallbackComponent = defineAsyncComponent(
  () => import("../../../components/FallbackComponent.vue"),
);

const resolveComponent = (type: string) => {
  return getMaterialAsyncComponent(type) || FallbackComponent;
};

const resolveRuntimeProps = (
  type: string,
  componentProps: Record<string, unknown>,
) => {
  return resolveMaterialRuntimeProps(type, componentProps);
};

const handleSelectComponent = (id: string, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    props.pageStore.toggleComponentSelection(id);
    return;
  }

  props.pageStore.setActiveId(id);
};

const handleDeleteComponent = (index: number) => {
  props.pageStore.deleteComponent({ index });
};

const handleDuplicateComponent = (id: string) => {
  props.pageStore.duplicateComponent({ id });
};

const handlePreview = () => {
  ElMessage.success("请使用顶部操作栏预览页面");
};

const isInputLikeTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
};

const moveSelectedComponent = (direction: "up" | "down") => {
  const currentId = props.pageStore.activeComponentId;
  if (!currentId) {
    return;
  }

  const currentIndex = props.pageStore.pageSchema.rootIds.findIndex(
    (id) => id === currentId,
  );
  if (currentIndex < 0) {
    return;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  props.pageStore.moveComponent({ from: currentIndex, to: targetIndex });
};

useEventListener(window, "keydown", (event: KeyboardEvent) => {
  if (isInputLikeTarget(event.target)) {
    return;
  }

  const activeId = props.pageStore.activeComponentId;
  const withMeta = event.ctrlKey || event.metaKey;

  if ((event.key === "Delete" || event.key === "Backspace") && activeId) {
    event.preventDefault();
    props.pageStore.deleteActiveComponent();
    return;
  }

  if (withMeta && event.key.toLowerCase() === "c" && activeId) {
    event.preventDefault();
    props.pageStore.duplicateComponent({ id: activeId });
    return;
  }

  if (withMeta && event.key.toLowerCase() === "z" && !event.shiftKey) {
    event.preventDefault();
    if (props.pageStore.canUndo) {
      props.pageStore.undo();
    }
    return;
  }

  if (
    withMeta &&
    ((event.key.toLowerCase() === "z" && event.shiftKey) ||
      event.key.toLowerCase() === "y")
  ) {
    event.preventDefault();
    if (props.pageStore.canRedo) {
      props.pageStore.redo();
    }
    return;
  }

  if (event.altKey && event.key === "ArrowUp") {
    event.preventDefault();
    moveSelectedComponent("up");
    return;
  }

  if (event.altKey && event.key === "ArrowDown") {
    event.preventDefault();
    moveSelectedComponent("down");
  }
});
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

.sortable-list {
  display: flex;
  flex-direction: column;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 28px;
  font-weight: 700;
}

.empty-canvas p {
  margin: 8px 0;
  font-size: 14px;
}

.empty-tip {
  font-size: 12px;
  color: #c0c4cc;
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

.canvas-component.selected {
  border-color: #67c23a;
}

.canvas-component.sortable-ghost {
  opacity: 0.45;
}

.canvas-component.sortable-chosen {
  border-color: #67c23a;
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
  gap: 8px;
}

.canvas-component:hover .component-actions,
.canvas-component.active .component-actions {
  display: flex;
}

.keyboard-hint {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}
</style>

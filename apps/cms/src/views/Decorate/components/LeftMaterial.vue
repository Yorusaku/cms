<template>
  <div class="component-sidebar">
    <h3>组件列表</h3>
    <el-collapse v-model="activeNames" class="material-collapse">
      <el-collapse-item
        v-for="(group, index) in materialGroups"
        :key="group.key"
        :title="group.label"
        :name="index + 1"
        class="material-collapse-item"
      >
        <ul class="component-list">
          <li
            v-for="material in group.materials"
            :key="material.type"
            :class="
              isDraggable(material.type, material.maxCount)
                ? 'drag-enabled'
                : 'drag-disabled'
            "
            :draggable="isDraggable(material.type, material.maxCount)"
            @dragstart="onDragstart(material.type, $event)"
            @dragend="onDragend"
          >
            <div class="component-icon">
              {{ material.icon }}
            </div>
            <p class="name">
              {{ material.label }}
            </p>
            <p class="num">
              {{ `${getComponentCount(material.type)}/${material.maxCount}` }}
            </p>
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { usePageStore } from "@/store/usePageStore";
import { getMaterialDefaults, getMaterialGroups } from "@cms/ui";

const pageStore = usePageStore();

const activeNames = ref([1, 2]);
const materialGroups = getMaterialGroups();

const getComponentCount = (type: string): number => {
  return Object.values(pageStore.pageSchema.componentMap).filter(
    (component) => component.type === type,
  ).length;
};

const isDraggable = (type: string, maxCount: number): boolean => {
  const currentCount = getComponentCount(type);
  return currentCount < maxCount;
};

const onDragstart = (type: string, _event: DragEvent) => {
  pageStore.setDragActive(true);
  pageStore.setDragComponent({
    type,
    props: getMaterialDefaults(type),
  });
};

const onDragend = () => {
  pageStore.setDragActive(false);
  pageStore.setDragComponent({});
};
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
  color: #ffffff;
}

.component-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  height: 32px;
  width: 32px;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
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
</style>

<style>
.component-sidebar .material-collapse {
  border: none;
  --el-collapse-border-color: transparent;
  --el-collapse-header-height: 30px;
}

.component-sidebar .material-collapse-item [class*="__header"] {
  border: none;
  height: 30px;
  line-height: 30px;
  padding: 0 20px;
}

.component-sidebar .material-collapse-item [class*="__wrap"] {
  border: none;
}

.component-sidebar .material-collapse-item [class*="__content"] {
  padding-bottom: 0;
}
</style>

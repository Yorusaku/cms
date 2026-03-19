<template>
  <div class="page-right">
    <div class="config-panel">
      <div class="config-header">
        <h3 class="config-title">
          <span v-if="activeComponent">
            {{ activeDefinition?.label || activeComponent.type }} 配置
          </span>
          <span v-else>页面配置</span>
        </h3>
      </div>

      <div class="config-body">
        <div
          v-if="activeComponent && activeDefinition?.editorConfig.mode === 'schema'"
          class="config-content"
        >
          <MaterialConfigRenderer
            :material-type="activeComponent.type"
            :component-props="activeComponent.props"
            @update="handleConfigUpdate"
          />
        </div>

        <div v-else-if="activeComponent" class="config-placeholder">
          <div class="placeholder-icon">配</div>
          <p class="placeholder-text">
            暂无 {{ activeComponent.type }} 的配置面板
          </p>
        </div>

        <div v-else class="config-content">
          <SetPageInfo />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePageStore } from "@/store/usePageStore";
import { resolveMaterialDefinition } from "@cms/ui";
import MaterialConfigRenderer from "./MaterialConfigRenderer.vue";
import SetPageInfo from "./SetPageInfo.vue";

const pageStore = usePageStore();

const activeComponent = computed(() => {
  if (!pageStore.activeComponentId) {
    return null;
  }

  return pageStore.pageSchema.componentMap[pageStore.activeComponentId] ?? null;
});

const activeDefinition = computed(() => {
  if (!activeComponent.value) {
    return null;
  }

  return resolveMaterialDefinition(activeComponent.value.type) ?? null;
});

const handleConfigUpdate = (newProps: Record<string, unknown>) => {
  if (!activeComponent.value) {
    return;
  }

  pageStore.editComponent({
    id: activeComponent.value.id,
    props: newProps,
  });
};
</script>

<style scoped>
.page-right {
  position: absolute;
  top: 56px;
  right: 0;
  bottom: 0;
  width: 376px;
  padding-bottom: 50px;
  overflow-x: hidden;
  overflow-y: auto;
  background: #fff;
}

.config-panel {
  width: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.config-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

.config-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.config-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-content {
  background-color: #fff;
}

.config-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.placeholder-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 22px;
  font-weight: 700;
}

.placeholder-text {
  margin: 0;
  font-size: 16px;
  color: #606266;
}
</style>

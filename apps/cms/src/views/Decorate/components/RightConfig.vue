<template>
  <div class="page-right">
    <div class="config-panel">
      <div class="config-header">
        <h3 class="config-title">
          <span v-if="isBatchMode">
            批量配置（{{ selectedTypeLabel }}）
          </span>
          <span v-else-if="activeComponent">
            {{ activeDefinition?.label || activeComponent.type }} 配置
          </span>
          <span v-else>页面配置</span>
        </h3>
      </div>

      <div class="config-body">
        <div v-if="isBatchMode" class="config-content">
          <el-alert
            type="info"
            show-icon
            :closable="false"
            title="当前为同类型组件批量配置模式（仅通用字段）"
            class="batch-tip"
          />

          <div class="batch-fields">
            <el-form label-width="96px" size="small">
              <el-form-item label="背景色">
                <el-color-picker v-model="batchState.backgroundColor" />
              </el-form-item>
              <el-form-item label="上边距">
                <el-input-number v-model="batchState.marginTop" :min="0" :max="200" />
              </el-form-item>
              <el-form-item label="内边距">
                <el-input v-model="batchState.padding" placeholder="如 12px 16px" />
              </el-form-item>
              <el-form-item label="显示">
                <el-switch v-model="batchState.visible" />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <div
          v-else-if="hasMultiSelectionButTypeMismatch"
          class="config-placeholder"
        >
          <div class="placeholder-icon">提</div>
          <p class="placeholder-text">
            多选组件类型不一致，暂不支持跨类型批量配置
          </p>
        </div>

        <div
          v-else-if="activeComponent && activeDefinition?.editorConfig.mode === 'schema'"
          class="config-content"
        >
          <MaterialConfigRenderer
            :material-type="activeComponent.type"
            :component-props="activeComponent.props"
            :batch-mode="false"
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
import { computed, reactive, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
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

const selectedComponents = computed(() =>
  pageStore.selectedComponentIds
    .map((id) => pageStore.pageSchema.componentMap[id])
    .filter(Boolean),
);

const selectedTypes = computed(() =>
  Array.from(new Set(selectedComponents.value.map((component) => component.type))),
);

const isBatchMode = computed(
  () => selectedComponents.value.length > 1 && selectedTypes.value.length === 1,
);

const hasMultiSelectionButTypeMismatch = computed(
  () => selectedComponents.value.length > 1 && selectedTypes.value.length > 1,
);

const selectedTypeLabel = computed(() => {
  const type = selectedTypes.value[0];
  if (!type) {
    return "";
  }

  const definition = resolveMaterialDefinition(type);
  return definition?.label ?? type;
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

const batchState = reactive({
  backgroundColor: "",
  marginTop: 0,
  padding: "",
  visible: true,
});

watch(
  isBatchMode,
  (enabled) => {
    if (!enabled) {
      return;
    }

    const first = selectedComponents.value[0];
    if (!first) {
      return;
    }

    const firstProps = first.props as Record<string, unknown>;
    batchState.backgroundColor = String(firstProps.backgroundColor ?? "");
    batchState.marginTop = Number(firstProps.marginTop ?? 0);
    batchState.padding = String(firstProps.padding ?? "");
    batchState.visible = first.condition !== false;
  },
  { immediate: true },
);

const debouncedBatchApply = useDebounceFn(() => {
  if (!isBatchMode.value) {
    return;
  }

  pageStore.batchEditComponents({
    ids: pageStore.selectedComponentIds,
    props: {
      backgroundColor: batchState.backgroundColor,
      marginTop: batchState.marginTop,
      padding: batchState.padding,
    },
    condition: batchState.visible,
  });
}, 260);

watch(batchState, () => {
  debouncedBatchApply();
});
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

.batch-tip {
  margin-bottom: 12px;
}

.batch-fields {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
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

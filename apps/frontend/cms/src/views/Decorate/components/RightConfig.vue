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

      <div class="ai-update-entry">
        <el-button
          size="small"
          :disabled="aiTargetIds.length === 0"
          @click="openAiUpdate"
        >
          <el-icon><MagicStick /></el-icon>
          <span>AI 更新内容</span>
        </el-button>
        <span class="ai-update-hint">
          {{ aiEntryHint }}
        </span>
      </div>

      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="基础配置" name="basic">
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
    </el-tab-pane>

    <el-tab-pane label="联动配置" name="linkage">
      <LinkageConfig />
    </el-tab-pane>

    <el-tab-pane label="联动调试" name="debug">
      <LinkageDebugPanel />
    </el-tab-pane>
  </el-tabs>
    </div>

    <AiContentUpdateDialog
      v-model="aiUpdateVisible"
      :target-ids="aiTargetIds"
      :page-id="currentPageId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch, ref } from "vue";
import { useRoute } from "vue-router";
import { useDebounceFn } from "@vueuse/core";
import { usePageStore } from "@/store/usePageStore";
import { resolveMaterialDefinition } from "@cms/ui";
import MaterialConfigRenderer from "./MaterialConfigRenderer.vue";
import SetPageInfo from "./SetPageInfo.vue";
import LinkageConfig from "./LinkageConfig.vue";
import LinkageDebugPanel from "./LinkageDebugPanel.vue";
import AiContentUpdateDialog from "@/components/AiContentUpdateDialog.vue";
import { MagicStick } from "@element-plus/icons-vue";

const pageStore = usePageStore();
const route = useRoute();
const activeTab = ref('basic');

/** 当前装修页 ID：变化时 AI 弹窗会自动关闭 */
const currentPageId = computed(() => {
  const id = Number(route.query.id);
  return Number.isFinite(id) && id > 0 ? id : null;
});

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

// ── AI 更新内容入口：多选（跨类型）优先，其次当前选中组件 ──
const aiUpdateVisible = ref(false);

const aiTargetIds = computed(() =>
  pageStore.selectedComponentIds.length > 0
    ? [...pageStore.selectedComponentIds]
    : pageStore.activeComponentId
      ? [pageStore.activeComponentId]
      : [],
);

const aiEntryHint = computed(() => {
  const count = aiTargetIds.value.length;
  if (count === 0) {
    return "先在画布选择内容区块";
  }
  return `已选 ${count} 个区块，支持富文本 / 公告 / 业务表单`;
});

const openAiUpdate = () => {
  if (aiTargetIds.value.length === 0) {
    return;
  }
  aiUpdateVisible.value = true;
};

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
  /* 相对 .decorate-content 定位（该容器已让位顶部工具栏 56px） */
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
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

.ai-update-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  background: var(--color-bg-card, #fff);
}

.ai-update-hint {
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<template>
  <el-dialog
    v-model="visible"
    title="AI 更新内容"
    width="720px"
    :close-on-click-modal="false"
    class="ai-content-update-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="ai-dialog-header">
        <span class="ai-dialog-title">AI 更新内容</span>
        <el-tag size="small" type="info">仅修改文字内容</el-tag>
      </div>
    </template>

    <!-- 处理对象 -->
    <section class="ai-section">
      <p class="ai-section-title">处理对象（{{ supportedCount }} 个可更新）</p>
      <div v-if="targets.length" class="ai-target-list">
        <div
          v-for="target in targets"
          :key="target.componentId"
          class="ai-target-item"
          :class="{ 'is-disabled': !target.supported }"
        >
          <span class="ai-target-label">{{ target.materialLabel }}</span>
          <el-tag v-if="!target.supported" size="small" type="info">
            不参与更新
          </el-tag>
        </div>
      </div>
      <p v-else class="ai-empty-tip">当前没有选中的区块，请先在画布中选择内容区块。</p>
    </section>

    <!-- 资料输入 -->
    <section class="ai-section">
      <p class="ai-section-title">业务资料与修改要求</p>
      <el-input
        v-model="instruction"
        type="textarea"
        :rows="4"
        maxlength="2000"
        show-word-limit
        placeholder="粘贴新的业务资料，并说明要修改哪些内容。例如：本期培训班改为 11 月 3 日开班，地点改为市民中心 3 楼，公告和办理说明同步更新。"
      />
      <p class="ai-input-hint">
        只修改选中区块的文字，不会调整布局、样式、链接或字段配置；资料未提到的内容保持不变。
      </p>
    </section>

    <!-- 示例结果提示 -->
    <el-alert
      v-if="source === 'mock'"
      type="warning"
      show-icon
      :closable="false"
      title="示例结果"
      description="当前未接入真实模型（AI_MOCK_ENABLED=true），以下内容仅用于演示流程，请勿直接作为正式内容。"
      class="ai-alert"
    />

    <!-- 警告 -->
    <el-alert
      v-for="(warning, index) in warnings"
      :key="`warn-${index}`"
      type="info"
      show-icon
      :closable="false"
      :title="warning"
      class="ai-alert"
    />

    <!-- 建议对比 -->
    <section v-if="suggestions.length" class="ai-section">
      <p class="ai-section-title">
        建议修改（{{ suggestions.length }} 个，已选 {{ accepted.size }} 个）
      </p>
      <div class="ai-suggestion-list">
        <div
          v-for="item in suggestions"
          :key="item.change.componentId"
          class="ai-suggestion"
          :class="{ 'is-unchecked': !accepted.has(item.change.componentId) }"
        >
          <el-checkbox
            :model-value="accepted.has(item.change.componentId)"
            @change="toggleAccepted(item.change.componentId)"
          >
            <span class="ai-suggestion-label">{{ item.label }}</span>
          </el-checkbox>
          <div class="ai-diff">
            <div class="ai-diff-col">
              <p class="ai-diff-title">原内容</p>
              <pre class="ai-diff-text">{{ item.before }}</pre>
            </div>
            <div class="ai-diff-col">
              <p class="ai-diff-title">建议内容</p>
              <pre class="ai-diff-text is-after">{{ item.after }}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <el-empty
      v-else-if="generated && !loading"
      description="无需修改：AI 未给出与当前内容不同的建议"
      :image-size="72"
    />

    <template #footer>
      <div class="ai-dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button :loading="loading" :disabled="!canGenerate" @click="generate">
          {{ suggestions.length ? "重新生成" : "生成建议" }}
        </el-button>
        <el-button
          type="primary"
          :disabled="accepted.size === 0 || loading"
          @click="applySelected"
        >
          应用选中修改（{{ accepted.size }}）
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { AiContentChange, AiContentTarget } from "@cms/types";
import { aiSuggestContentChanges } from "@/api/ai";
import { usePageStore } from "@/store/usePageStore";
import {
  buildContentTargetSnapshot,
  formatChangePreview,
  formatSnapshotPreview,
  isTargetUnchanged,
  snapshotToRequestTarget,
  type AiContentTargetSnapshot,
} from "@/utils/ai-content";

const props = defineProps<{
  modelValue: boolean;
  /** 打开弹窗时选中的组件 ID 快照（不随之后画布选择变化） */
  targetIds: string[];
  /** 当前装修页的页面 ID：变化（切换页面）时弹窗自动关闭 */
  pageId: number | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const pageStore = usePageStore();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

interface SuggestionItem {
  change: AiContentChange;
  label: string;
  before: string;
  after: string;
}

const loading = ref(false);
const instruction = ref("");
const snapshots = ref<AiContentTargetSnapshot[]>([]);
const suggestions = ref<SuggestionItem[]>([]);
const accepted = ref<Set<string>>(new Set());
const generated = ref(false);
const source = ref<"model" | "mock" | null>(null);
const warnings = ref<string[]>([]);

/** 当前弹窗会话代号：关闭/重新生成/切换页面后，旧响应一律丢弃 */
let requestToken = 0;
let openedPageId: number | null = null;
let openedTargetIds: string[] = [];

const targets = computed(() =>
  snapshots.value.map((snapshot) => ({
    componentId: snapshot.componentId,
    materialLabel: snapshot.materialLabel,
    supported: snapshot.supported,
  })),
);

const supportedCount = computed(
  () => snapshots.value.filter((item) => item.supported).length,
);

const canGenerate = computed(
  () => supportedCount.value > 0 && instruction.value.trim().length > 0,
);

const currentPageId = (): number | null => props.pageId;

/** 固定圈定对象，每次生成重新读取这些组件的内容与基线。 */
const rebuildTargets = () => {
  snapshots.value = openedTargetIds
    .map((id) => pageStore.pageSchema.componentMap[id])
    .filter((component): component is NonNullable<typeof component> =>
      Boolean(component),
    )
    .map((component) => buildContentTargetSnapshot(component));
};

const resetSuggestions = () => {
  suggestions.value = [];
  accepted.value = new Set();
  generated.value = false;
  source.value = null;
  warnings.value = [];
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      openedPageId = currentPageId();
      openedTargetIds = [...props.targetIds];
      rebuildTargets();
      instruction.value = "";
      resetSuggestions();
    } else {
      // 关闭后不再接收在途请求的结果
      requestToken += 1;
      loading.value = false;
    }
  },
  { immediate: true },
);

// 页面切换（装修页换了 id）时关闭弹窗，避免把结果应用到另一页
watch(
  () => props.pageId,
  () => {
    if (props.modelValue) {
      visible.value = false;
    }
  },
);

const handleClosed = () => {
  requestToken += 1;
  loading.value = false;
};

const toggleAccepted = (componentId: string) => {
  const next = new Set(accepted.value);
  if (next.has(componentId)) {
    next.delete(componentId);
  } else {
    next.add(componentId);
  }
  accepted.value = next;
};

const generate = async () => {
  if (!canGenerate.value || loading.value) {
    return;
  }

  resetSuggestions();
  rebuildTargets();
  const requestTargets = snapshots.value
    .map(snapshotToRequestTarget)
    .filter((target): target is AiContentTarget => Boolean(target));

  if (requestTargets.length === 0) {
    ElMessage.warning("没有可参与更新的内容区块");
    return;
  }

  const token = ++requestToken;
  loading.value = true;

  try {
    const response = await aiSuggestContentChanges({
      instruction: instruction.value.trim(),
      targets: requestTargets,
    });

    // 关闭弹窗、重新生成或页面切换后，丢弃迟到响应
    if (token !== requestToken) {
      return;
    }
    if (response.code !== 10000 || !response.data) {
      return;
    }

    const data = response.data;
    source.value = data.source;
    warnings.value = data.warnings ?? [];

    const snapshotById = new Map(
      snapshots.value.map((snapshot) => [snapshot.componentId, snapshot]),
    );
    const items: SuggestionItem[] = [];
    for (const change of data.changes ?? []) {
      const snapshot = snapshotById.get(change.componentId);
      if (!snapshot) {
        continue;
      }
      items.push({
        change,
        label: snapshot.materialLabel,
        before: formatSnapshotPreview(snapshot),
        after: formatChangePreview(change),
      });
    }

    suggestions.value = items;
    accepted.value = new Set(items.map((item) => item.change.componentId));
    generated.value = true;

    if (items.length === 0) {
      ElMessage.info("AI 未给出与当前内容不同的建议（无需修改）");
    }
  } catch (error: unknown) {
    if (token !== requestToken) {
      return;
    }
    const message =
      error !== null &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "生成建议失败，请稍后重试";
    ElMessage.error(message);
  } finally {
    if (token === requestToken) {
      loading.value = false;
    }
  }
};

const applySelected = () => {
  if (accepted.value.size === 0) {
    return;
  }

  // 页面切换检查
  if (currentPageId() !== openedPageId) {
    ElMessage.error("页面已切换，请重新生成建议");
    return;
  }

  const selectedSuggestions = suggestions.value.filter((item) =>
    accepted.value.has(item.change.componentId),
  );

  // 只检查本次接受的区块；未勾选的建议不会写入，也不应阻断其他修改。
  const hasConflict = selectedSuggestions.some((item) => {
    const snapshot = snapshots.value.find(
      (entry) => entry.componentId === item.change.componentId,
    );
    if (!snapshot) {
      return true;
    }
    return !isTargetUnchanged(
      snapshot,
      pageStore.pageSchema.componentMap[item.change.componentId],
    );
  });
  if (hasConflict) {
    ElMessage.error("页面内容已变化，请重新生成建议后再应用");
    return;
  }

  const changes = selectedSuggestions.map((item) => item.change);

  const result = pageStore.applyContentChanges(changes);
  if (!result.ok) {
    ElMessage.error(result.reason);
    return;
  }

  ElMessage.success(`已应用 ${result.applied} 个区块的内容更新`);
  visible.value = false;
};
</script>

<style scoped>
.ai-dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.ai-section {
  margin-bottom: 16px;
}

.ai-section-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.ai-target-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-target-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: 8px;
  background: var(--color-bg-card, #fff);
}

.ai-target-item.is-disabled {
  opacity: 0.6;
}

.ai-target-label {
  font-size: 13px;
  color: var(--color-text-primary, #1f2937);
}

.ai-empty-tip {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-tertiary, #9ca3af);
}

.ai-input-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
}

.ai-alert {
  margin-bottom: 12px;
}

.ai-suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-suggestion {
  padding: 12px;
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: 10px;
  transition: opacity 0.2s ease;
}

.ai-suggestion.is-unchecked {
  opacity: 0.5;
}

.ai-suggestion-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.ai-diff {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.ai-diff-col {
  min-width: 0;
}

.ai-diff-title {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
}

.ai-diff-text {
  margin: 0;
  max-height: 140px;
  overflow: auto;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--color-bg-page, #f5f7fa);
  font-family: inherit;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text-secondary, #4b5563);
}

.ai-diff-text.is-after {
  background: var(--color-primary-light, #ecf5ff);
  color: var(--color-text-primary, #1f2937);
}

.ai-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

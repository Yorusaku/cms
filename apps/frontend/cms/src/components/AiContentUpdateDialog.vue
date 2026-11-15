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

    <!-- 处理对象：生成后同时展示每个目标的处理结果 -->
    <section class="ai-section">
      <p class="ai-section-title">处理对象（{{ supportedCount }} 个可更新）</p>
      <div v-if="targetRows.length" class="ai-target-list">
        <div
          v-for="row in targetRows"
          :key="row.componentId"
          class="ai-target-item"
          :class="{ 'is-disabled': !row.supported }"
        >
          <span class="ai-target-label">{{ row.materialLabel }}</span>
          <el-tag v-if="!row.supported" size="small" type="info"> 不参与更新 </el-tag>
          <template v-else-if="generated">
            <el-tag v-if="row.kind === 'changed'" size="small" type="success"> 有修改建议 </el-tag>
            <el-tag v-else-if="row.kind === 'unchanged'" size="small" type="info">
              未返回修改建议
            </el-tag>
          </template>
          <el-tag v-if="row.warnings.length" size="small" type="warning"> 需人工确认 </el-tag>
        </div>
      </div>
      <p v-else class="ai-empty-tip">当前没有选中的区块，请先在画布中选择内容区块。</p>
      <p v-if="generated && unsupportedCount > 0" class="ai-input-hint">
        「不参与更新」的区块不在本次处理范围内，内容保持不变。
      </p>
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

    <!-- 整体警告 -->
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
          <div class="ai-suggestion-head">
            <el-checkbox
              :model-value="accepted.has(item.change.componentId)"
              @change="toggleAccepted(item.change.componentId)"
            >
              <span class="ai-suggestion-label">{{ item.status.materialLabel }}</span>
            </el-checkbox>
            <el-tag v-if="!accepted.has(item.change.componentId)" size="small" type="info">
              本次不应用
            </el-tag>
            <el-tag v-if="item.status.warnings.length" size="small" type="warning">
              需人工确认
            </el-tag>
          </div>

          <p
            v-for="warning in item.status.warnings"
            :key="`tw-${warning}`"
            class="ai-target-warning"
          >
            {{ warning }}
          </p>

          <!-- 表单：逐字段对比，未修改的字段也列出并标记 -->
          <div v-if="item.status.fields" class="ai-field-diff">
            <div v-for="field in item.status.fields" :key="field.key" class="ai-field-row">
              <span class="ai-field-name">{{ field.label }}</span>
              <span class="ai-field-before">{{ field.before || '（空）' }}</span>
              <span class="ai-field-arrow">→</span>
              <span class="ai-field-after" :class="{ 'is-unchanged': !field.changed }">
                {{ field.changed ? field.after : '未修改' }}
              </span>
            </div>
          </div>

          <!-- 其他物料：原/建议对比 -->
          <div v-else class="ai-diff">
            <div class="ai-diff-col">
              <p class="ai-diff-title">原内容</p>
              <pre class="ai-diff-text">{{ item.status.before || '（空）' }}</pre>
            </div>
            <div class="ai-diff-col">
              <p class="ai-diff-title">建议内容</p>
              <pre class="ai-diff-text is-after">{{ item.status.after }}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 未返回建议：可展开核对原内容 -->
    <section v-if="unchangedStatuses.length" class="ai-section">
      <p class="ai-section-title">
        未返回修改建议（{{ unchangedStatuses.length }} 个，可展开核对原内容）
      </p>
      <el-collapse class="ai-unchanged">
        <el-collapse-item
          v-for="status in unchangedStatuses"
          :key="status.componentId"
          :name="status.componentId"
        >
          <template #title>
            <span class="ai-unchanged-title">
              {{ status.materialLabel }}
              <el-tag v-if="status.warnings.length" size="small" type="warning">
                需人工确认
              </el-tag>
            </span>
          </template>
          <p v-for="warning in status.warnings" :key="`uw-${warning}`" class="ai-target-warning">
            {{ warning }}
          </p>
          <p class="ai-diff-title">原内容</p>
          <pre class="ai-diff-text">{{ status.before || '（空）' }}</pre>
        </el-collapse-item>
      </el-collapse>
    </section>

    <!-- 空结果：不能表述为「无需修改」或已验证正确 -->
    <el-empty
      v-if="generated && !loading && !suggestions.length"
      class="ai-empty-result"
      :image-size="72"
    >
      <template #description>
        <p class="ai-empty-title">未生成修改建议，请核对原内容与提示</p>
        <p class="ai-empty-note">这不代表模型已确认内容正确，只说明本次没有返回可应用的修改。</p>
      </template>
    </el-empty>

    <template #footer>
      <div class="ai-dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button :loading="loading" :disabled="!canGenerate" @click="generate">
          {{ suggestions.length ? '重新生成' : '生成建议' }}
        </el-button>
        <el-button type="primary" :disabled="accepted.size === 0 || loading" @click="applySelected">
          应用选中修改（{{ accepted.size }}）
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { AiContentChange, AiContentTarget } from '@cms/types'
import { aiSuggestContentChanges } from '@/api/ai'
import { usePageStore } from '@/store/usePageStore'
import {
  buildContentTargetSnapshot,
  buildTargetStatuses,
  isTargetUnchanged,
  snapshotToRequestTarget,
  type AiContentTargetSnapshot,
  type AiTargetStatus
} from '@/utils/ai-content'

const props = defineProps<{
  modelValue: boolean
  /** 打开弹窗时选中的组件 ID 快照（不随之后画布选择变化） */
  targetIds: string[]
  /** 当前装修页的页面 ID：变化（切换页面）时弹窗自动关闭 */
  pageId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const pageStore = usePageStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const loading = ref(false)
const instruction = ref('')
const snapshots = ref<AiContentTargetSnapshot[]>([])
/** 每个目标的处理结果（有建议 / 未返回建议 / 不参与更新） */
const targetStatuses = ref<AiTargetStatus[]>([])
const changeById = ref<Map<string, AiContentChange>>(new Map())
const accepted = ref<Set<string>>(new Set())
const generated = ref(false)
const source = ref<'model' | 'mock' | null>(null)
const warnings = ref<string[]>([])

/** 当前弹窗会话代号：关闭/重新生成/切换页面后，旧响应一律丢弃 */
let requestToken = 0
let openedPageId: number | null = null
let openedTargetIds: string[] = []

/** 处理对象列表：生成前只有名称，生成后附带处理结果 */
const targetRows = computed(() =>
  snapshots.value.map(snapshot => {
    const status = targetStatuses.value.find(item => item.componentId === snapshot.componentId)
    return {
      componentId: snapshot.componentId,
      materialLabel: snapshot.materialLabel,
      supported: snapshot.supported,
      kind: status?.kind,
      warnings: status?.warnings ?? []
    }
  })
)

/** 有建议的区块（勾选与应用的唯一来源） */
const suggestions = computed(() =>
  targetStatuses.value
    .filter(status => status.kind === 'changed')
    .flatMap(status => {
      const change = changeById.value.get(status.componentId)
      return change ? [{ status, change }] : []
    })
)

/** 未返回建议的区块：可展开核对原内容 */
const unchangedStatuses = computed(() =>
  targetStatuses.value.filter(status => status.kind === 'unchanged')
)

const unsupportedCount = computed(
  () => targetStatuses.value.filter(status => status.kind === 'unsupported').length
)

const supportedCount = computed(() => snapshots.value.filter(item => item.supported).length)

const canGenerate = computed(() => supportedCount.value > 0 && instruction.value.trim().length > 0)

const currentPageId = (): number | null => props.pageId

/** 固定圈定对象，每次生成重新读取这些组件的内容与基线。 */
const rebuildTargets = () => {
  snapshots.value = openedTargetIds
    .map(id => pageStore.pageSchema.componentMap[id])
    .filter((component): component is NonNullable<typeof component> => Boolean(component))
    .map(component => buildContentTargetSnapshot(component))
}

const resetSuggestions = () => {
  targetStatuses.value = []
  changeById.value = new Map()
  accepted.value = new Set()
  generated.value = false
  source.value = null
  warnings.value = []
}

watch(
  () => props.modelValue,
  open => {
    if (open) {
      openedPageId = currentPageId()
      openedTargetIds = [...props.targetIds]
      rebuildTargets()
      instruction.value = ''
      resetSuggestions()
    } else {
      // 关闭后不再接收在途请求的结果
      requestToken += 1
      loading.value = false
    }
  },
  { immediate: true }
)

// 页面切换（装修页换了 id）时关闭弹窗，避免把结果应用到另一页
watch(
  () => props.pageId,
  () => {
    if (props.modelValue) {
      visible.value = false
    }
  }
)

const handleClosed = () => {
  requestToken += 1
  loading.value = false
}

const toggleAccepted = (componentId: string) => {
  const next = new Set(accepted.value)
  if (next.has(componentId)) {
    next.delete(componentId)
  } else {
    next.add(componentId)
  }
  accepted.value = next
}

const generate = async () => {
  if (!canGenerate.value || loading.value) {
    return
  }

  resetSuggestions()
  rebuildTargets()
  const requestTargets = snapshots.value
    .map(snapshotToRequestTarget)
    .filter((target): target is AiContentTarget => Boolean(target))

  if (requestTargets.length === 0) {
    ElMessage.warning('没有可参与更新的内容区块')
    return
  }

  const token = ++requestToken
  loading.value = true

  try {
    const response = await aiSuggestContentChanges({
      instruction: instruction.value.trim(),
      targets: requestTargets
    })

    // 关闭弹窗、重新生成或页面切换后，丢弃迟到响应
    if (token !== requestToken) {
      return
    }
    if (response.code !== 10000 || !response.data) {
      return
    }

    const data = response.data
    source.value = data.source
    warnings.value = data.warnings ?? []

    // 只采纳属于本次目标的变更；后端已校验，这里再兜一层防止旧响应/异常数据
    const knownIds = new Set(
      snapshots.value.filter(snapshot => snapshot.supported).map(snapshot => snapshot.componentId)
    )
    const changes = (data.changes ?? []).filter(change => knownIds.has(change.componentId))
    changeById.value = new Map(changes.map(change => [change.componentId, change]))
    targetStatuses.value = buildTargetStatuses(snapshots.value, changes, data.targetWarnings ?? [])
    accepted.value = new Set(
      targetStatuses.value
        .filter(status => status.kind === 'changed')
        .map(status => status.componentId)
    )
    generated.value = true

    if (changes.length === 0) {
      ElMessage.info('未生成修改建议，请核对原内容与提示')
    }
  } catch (error: unknown) {
    if (token !== requestToken) {
      return
    }
    const message =
      error !== null &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : '生成建议失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    if (token === requestToken) {
      loading.value = false
    }
  }
}

const applySelected = () => {
  if (accepted.value.size === 0) {
    return
  }

  // 页面切换检查
  if (currentPageId() !== openedPageId) {
    ElMessage.error('页面已切换，请重新生成建议')
    return
  }

  const selectedSuggestions = suggestions.value.filter(item =>
    accepted.value.has(item.change.componentId)
  )

  // 只检查本次接受的区块；未勾选的建议不会写入，也不应阻断其他修改。
  const hasConflict = selectedSuggestions.some(item => {
    const snapshot = snapshots.value.find(entry => entry.componentId === item.change.componentId)
    if (!snapshot) {
      return true
    }
    return !isTargetUnchanged(snapshot, pageStore.pageSchema.componentMap[item.change.componentId])
  })
  if (hasConflict) {
    ElMessage.error('页面内容已变化，请重新生成建议后再应用')
    return
  }

  const changes = selectedSuggestions.map(item => item.change)

  const result = pageStore.applyContentChanges(changes)
  if (!result.ok) {
    ElMessage.error(result.reason)
    return
  }

  ElMessage.success(`已应用 ${result.applied} 个区块的内容更新`)
  visible.value = false
}
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

/* 建议卡片头部：勾选 + 状态标签 */
.ai-suggestion-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

/* 区块级提醒：纯文本展示，不使用 v-html */
.ai-target-warning {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-left: 3px solid var(--color-warning, #e6a23c);
  border-radius: 4px;
  background: var(--color-warning-light, #fdf6ec);
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-regular, #606266);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 表单字段级对比 */
.ai-field-diff {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-field-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 14px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--color-bg-page, #f5f7fa);
  font-size: 12px;
  line-height: 1.6;
}

.ai-field-name {
  color: var(--color-text-secondary, #4b5563);
  font-weight: 600;
}

.ai-field-before {
  color: var(--color-text-secondary, #4b5563);
  word-break: break-word;
}

.ai-field-arrow {
  color: var(--color-text-tertiary, #9ca3af);
  text-align: center;
}

.ai-field-after {
  color: var(--color-text-primary, #1f2937);
  word-break: break-word;
}

.ai-field-after.is-unchanged {
  color: var(--color-text-tertiary, #9ca3af);
}

/* 未返回建议的区块 */
.ai-unchanged {
  border-top: none;
}

.ai-unchanged-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-primary, #1f2937);
}

/* 空结果说明 */
.ai-empty-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.ai-empty-note {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-tertiary, #9ca3af);
}
</style>

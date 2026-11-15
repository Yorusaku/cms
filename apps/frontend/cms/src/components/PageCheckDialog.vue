<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="560px"
    :close-on-click-modal="false"
    class="page-check-dialog"
  >
    <p class="pc-description">{{ description }}</p>

    <ul v-if="issues.length" class="pc-list">
      <li
        v-for="(issue, index) in issues"
        :key="`${issue.code}-${issue.componentId ?? 'page'}-${index}`"
        class="pc-item"
        :class="[`is-${issue.severity}`, { 'is-clickable': Boolean(issue.componentId) }]"
        @click="handleLocate(issue)"
      >
        <span class="pc-badge" :class="`is-${issue.severity}`">
          {{ issue.severity === 'error' ? '必须修复' : '建议修改' }}
        </span>
        <span class="pc-message">{{ issue.message }}</span>
        <span v-if="issue.componentId" class="pc-jump">定位</span>
      </li>
    </ul>

    <p v-else class="pc-empty">没有需要处理的问题。</p>

    <template #footer>
      <div class="pc-footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button v-if="mode === 'preview'" type="primary" @click="handleContinue">
          仍然预览
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BusinessCheckIssue } from '@cms/types'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** preview：提醒后可继续；submit：阻断 */
    mode: 'preview' | 'submit'
    issues: BusinessCheckIssue[]
    errorCount: number
    warningCount: number
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'locate', componentId: string): void
  (e: 'continue'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const title = computed(() => (props.mode === 'submit' ? '提交已拦截' : '页面存在需要确认的问题'))

const description = computed(() => {
  const parts: string[] = []
  if (props.errorCount > 0) {
    parts.push(`${props.errorCount} 项必须修复`)
  }
  if (props.warningCount > 0) {
    parts.push(`${props.warningCount} 项建议修改`)
  }
  const summary = parts.length ? parts.join('，') : '没有需要处理的问题'

  return props.mode === 'submit'
    ? `${summary}。修复后可以再次提交审核。`
    : `${summary}。${
        props.errorCount > 0 ? '存在必须修复的问题，仍要预览吗？' : '可以先预览确认效果。'
      }`
})

const cancelText = computed(() => (props.mode === 'submit' ? '我知道了' : '返回修改'))

const handleLocate = (issue: BusinessCheckIssue) => {
  if (!issue.componentId) {
    return
  }
  emit('locate', issue.componentId)
  visible.value = false
}

const handleCancel = () => {
  visible.value = false
}

const handleContinue = () => {
  visible.value = false
  emit('continue')
}
</script>

<style scoped>
.pc-description {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary, #4b5563);
}

.pc-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}

.pc-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.pc-item.is-error {
  border-color: #fde2e2;
  background: #fef0f0;
}

.pc-item.is-warning {
  border-color: #faecd8;
  background: #fdf6ec;
}

.pc-item.is-clickable {
  cursor: pointer;
}

.pc-item.is-clickable:hover {
  border-color: var(--color-primary, #409eff);
}

.pc-badge {
  flex: none;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.pc-badge.is-error {
  background: #f56c6c;
  color: #fff;
}

.pc-badge.is-warning {
  background: #e6a23c;
  color: #fff;
}

.pc-message {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  color: var(--color-text-primary, #1f2937);
}

.pc-jump {
  flex: none;
  font-size: 12px;
  color: var(--color-primary, #409eff);
}

.pc-empty {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-tertiary, #9ca3af);
}

.pc-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

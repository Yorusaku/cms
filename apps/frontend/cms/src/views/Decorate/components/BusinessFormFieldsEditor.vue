<template>
  <div class="bf-fields-editor">
    <!-- 非法 JSON：显式提示并保留原文，不静默换成默认字段 -->
    <el-alert v-if="jsonInvalid" type="error" :closable="false" show-icon class="bf-alert">
      <template #title>字段配置 JSON 无法解析</template>
      <p class="bf-alert-text">
        已保留原始内容不被覆盖。下面的字段列表来自当前可用配置，修改并点击「用下方字段覆盖
        JSON」后才会写回。
      </p>
      <pre class="bf-json-raw">{{ rawJson }}</pre>
      <el-button size="small" @click="overwriteInvalidJson"> 用下方字段覆盖 JSON </el-button>
    </el-alert>

    <!-- 缺少基础字段：提供明确的补齐入口 -->
    <el-alert
      v-if="missingBaseFields.length"
      type="warning"
      :closable="false"
      show-icon
      class="bf-alert"
    >
      <template #title>
        缺少基础字段：{{ missingBaseFields.map(item => item.label).join('、') }}
      </template>
      <p class="bf-alert-text">提交链路依赖姓名与手机号，缺失时表单无法提交。</p>
      <el-button size="small" @click="addMissingBaseFields">补齐基础字段</el-button>
    </el-alert>

    <div class="bf-field-list">
      <div v-for="(field, index) in draft" :key="field.uid" class="bf-field-row">
        <div class="bf-field-head">
          <span class="bf-field-index">#{{ index + 1 }}</span>
          <span class="bf-field-name">{{ field.label || '未命名字段' }}</span>
          <el-tag v-if="isBaseFieldKey(field.key)" size="small" type="info"> 基础字段 </el-tag>
          <div class="bf-field-actions">
            <el-button link size="small" :disabled="index === 0" @click="moveField(index, -1)">
              上移
            </el-button>
            <el-button
              link
              size="small"
              :disabled="index === draft.length - 1"
              @click="moveField(index, 1)"
            >
              下移
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              :disabled="isBaseFieldKey(field.key)"
              @click="removeField(index)"
            >
              删除
            </el-button>
          </div>
        </div>

        <div class="bf-field-body">
          <label class="bf-control">
            <span class="bf-control-label">名称</span>
            <el-input v-model="field.label" placeholder="显示给访客的字段名称" />
          </label>

          <label class="bf-control">
            <span class="bf-control-label">占位提示</span>
            <el-input v-model="field.placeholder" placeholder="输入框提示文字" />
          </label>

          <label class="bf-control bf-control-key">
            <span class="bf-control-label">key</span>
            <el-input
              v-model="field.key"
              :disabled="isBaseFieldKey(field.key)"
              placeholder="英文标识，如 visitDate"
            />
          </label>

          <label class="bf-control bf-control-type">
            <span class="bf-control-label">类型</span>
            <el-select v-model="field.type" :disabled="isBaseFieldKey(field.key)">
              <el-option label="文本" value="text" />
              <el-option label="日期" value="date" />
              <el-option label="下拉选择" value="select" />
            </el-select>
          </label>

          <label class="bf-control bf-control-required">
            <el-checkbox v-model="field.required" :disabled="isBaseFieldKey(field.key)">
              必填
            </el-checkbox>
          </label>
        </div>

        <div v-if="field.type === 'select'" class="bf-field-options">
          <p class="bf-options-title">下拉选项</p>
          <div
            v-for="(_, optionIndex) in field.options"
            :key="`${field.uid}-opt-${optionIndex}`"
            class="bf-option-row"
          >
            <el-input v-model="field.options[optionIndex]" placeholder="选项文字" />
            <el-button link type="danger" size="small" @click="removeOption(index, optionIndex)">
              删除
            </el-button>
          </div>
          <el-button link size="small" @click="addOption(index)"> + 添加选项 </el-button>
        </div>
      </div>
    </div>

    <el-button class="bf-add-field" @click="addField">+ 添加字段</el-button>

    <!-- 校验未通过：明确说明修改尚未写入页面 -->
    <div v-if="errors.length" class="bf-errors">
      <p class="bf-errors-title">
        字段配置未通过校验，以下修改尚未写入页面（{{ errors.length }} 项）
      </p>
      <p v-for="error in errors" :key="error" class="bf-errors-item">· {{ error }}</p>
    </div>

    <el-collapse class="bf-json-preview">
      <el-collapse-item title="查看字段 JSON（只读）" name="json">
        <pre class="bf-json">{{ jsonPreview }}</pre>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  findMissingBaseFields,
  isBaseFieldKey,
  validateBusinessFormFields,
  type BusinessFormFieldInput
} from '@cms/types'

interface DraftField extends Omit<BusinessFormFieldInput, 'options'> {
  /** 草稿内始终是数组，便于直接 v-model 编辑选项 */
  options: string[]
  /** 仅用于列表渲染的稳定 key，不写入 Schema */
  uid: number
}

const props = withDefaults(
  defineProps<{
    modelValue: BusinessFormFieldInput[]
    /** fieldsJson 原文：用于检测非法 JSON 与只读展示 */
    rawJson?: string
    /** 是否要求姓名/手机号基础字段（BusinessForm 需要，票据异常表单不需要） */
    requireBaseFields?: boolean
    /** 是否允许空列表（票据异常表单的扩展字段可以一个都没有） */
    allowEmpty?: boolean
    /** 保留 key：扩展字段不得占用（票据异常的固定字段） */
    reservedKeys?: string[]
  }>(),
  { requireBaseFields: true, allowEmpty: false, reservedKeys: () => [] }
)

const emit = defineEmits<{
  (e: 'update', fields: BusinessFormFieldInput[]): void
}>()

let uidSeed = 0
/** 标记本次变更由自身 emit 引起，避免父组件回传时重置草稿导致光标跳动 */
let syncing = false

const toDraft = (fields: BusinessFormFieldInput[]): DraftField[] =>
  (Array.isArray(fields) ? fields : []).map(field => ({
    key: typeof field.key === 'string' ? field.key : '',
    label: typeof field.label === 'string' ? field.label : '',
    type: field.type ?? 'text',
    required: Boolean(field.required),
    placeholder: typeof field.placeholder === 'string' ? field.placeholder : '',
    options: Array.isArray(field.options) ? field.options.map(option => String(option ?? '')) : [],
    uid: ++uidSeed
  }))

/** 比较用：去掉 uid 与无关差异，避免回传时反复重置 */
const comparable = (fields: Array<Partial<DraftField>>): string =>
  JSON.stringify(
    fields.map(field => ({
      key: field.key ?? '',
      label: field.label ?? '',
      type: field.type ?? 'text',
      required: Boolean(field.required),
      placeholder: field.placeholder ?? '',
      options: field.type === 'select' ? (field.options ?? []) : []
    }))
  )

const toSchemaFields = (fields: DraftField[]): BusinessFormFieldInput[] =>
  fields.map(({ uid: _uid, ...rest }) => {
    const base: BusinessFormFieldInput = {
      key: rest.key.trim(),
      label: rest.label.trim(),
      type: rest.type,
      required: Boolean(rest.required)
    }
    if (rest.placeholder?.trim()) {
      base.placeholder = rest.placeholder.trim()
    }
    if (rest.type === 'select') {
      base.options = (rest.options ?? []).map(option => option.trim()).filter(Boolean)
    }
    return base
  })

const draft = ref<DraftField[]>(toDraft(props.modelValue))

watch(
  () => props.modelValue,
  value => {
    if (syncing) {
      syncing = false
      return
    }
    if (comparable(toDraft(value)) === comparable(draft.value)) {
      return
    }
    draft.value = toDraft(value)
  },
  { immediate: true, deep: true }
)

const jsonInvalid = computed(() => {
  const raw = props.rawJson
  if (typeof raw !== 'string' || !raw.trim()) {
    return false
  }
  try {
    JSON.parse(raw)
    return false
  } catch {
    return true
  }
})

const missingBaseFields = computed(() =>
  props.requireBaseFields ? findMissingBaseFields(draft.value) : []
)

const errors = computed(() => {
  const issues = validateBusinessFormFields(
    draft.value.map(({ uid: _uid, ...rest }) => rest as BusinessFormFieldInput),
    { requireBaseFields: props.requireBaseFields }
  )
  // 允许空列表时，「至少需要一个字段」不再阻断（票据异常表单可以没有扩展字段）
  const filtered =
    props.allowEmpty && draft.value.length === 0
      ? issues.filter(item => item !== '表单至少需要一个字段')
      : issues

  const reserved = props.reservedKeys ?? []
  const conflicts = draft.value
    .filter(field => reserved.includes(field.key.trim()))
    .map(field => `${field.label || field.key}：key「${field.key.trim()}」是固定字段，请换一个`)

  return [...filtered, ...conflicts]
})

const jsonPreview = computed(() => JSON.stringify(toSchemaFields(draft.value), null, 2))

/** 通过校验才写回；未通过时保留草稿并展示原因 */
const commit = () => {
  if (errors.value.length > 0) {
    return
  }
  syncing = true
  emit('update', toSchemaFields(draft.value))
}

const addField = () => {
  draft.value = [
    ...draft.value,
    {
      key: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
      uid: ++uidSeed
    }
  ]
}

const removeField = (index: number) => {
  const target = draft.value[index]
  if (!target || isBaseFieldKey(target.key)) {
    return
  }
  draft.value = draft.value.filter((_, itemIndex) => itemIndex !== index)
}

const moveField = (index: number, offset: number) => {
  const nextIndex = index + offset
  if (nextIndex < 0 || nextIndex >= draft.value.length) {
    return
  }
  const next = [...draft.value]
  const [moved] = next.splice(index, 1)
  next.splice(nextIndex, 0, moved)
  draft.value = next
}

const addOption = (fieldIndex: number) => {
  const field = draft.value[fieldIndex]
  if (!field) {
    return
  }
  field.options = [...(field.options ?? []), '']
}

const removeOption = (fieldIndex: number, optionIndex: number) => {
  const field = draft.value[fieldIndex]
  if (!field) {
    return
  }
  field.options = (field.options ?? []).filter((_, index) => index !== optionIndex)
}

const addMissingBaseFields = () => {
  const missing = missingBaseFields.value
  if (!missing.length) {
    return
  }
  const next = [...draft.value]
  missing.forEach(item => {
    next.push({
      key: item.key,
      label: item.label,
      type: 'text',
      required: true,
      placeholder: '',
      options: [],
      uid: ++uidSeed
    })
  })
  draft.value = next
}

/** 用户明确选择用当前字段覆盖原始 JSON */
const overwriteInvalidJson = () => {
  if (errors.value.length > 0) {
    return
  }
  syncing = true
  emit('update', toSchemaFields(draft.value))
}

/** 草稿变化后按校验结果决定是否写回 */
watch(draft, commit, { deep: true })
</script>

<style scoped>
.bf-fields-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bf-alert {
  margin-bottom: 4px;
}

.bf-alert-text {
  margin: 4px 0 8px;
  font-size: 12px;
  line-height: 1.6;
}

.bf-json-raw {
  margin: 0 0 8px;
  max-height: 120px;
  overflow: auto;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.bf-field-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bf-field-row {
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}

.bf-field-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.bf-field-index {
  font-size: 12px;
  color: #909399;
}

.bf-field-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.bf-field-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.bf-field-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.bf-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.bf-control-label {
  font-size: 12px;
  color: #606266;
}

.bf-control-required {
  justify-content: flex-end;
}

.bf-field-options {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}

.bf-options-title {
  margin: 0 0 6px;
  font-size: 12px;
  color: #606266;
}

.bf-option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.bf-add-field {
  align-self: flex-start;
}

.bf-errors {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #fde2e2;
  background: #fef0f0;
}

.bf-errors-title {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #c45656;
}

.bf-errors-item {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #c45656;
}

.bf-json-preview {
  border-top: none;
}

.bf-json {
  margin: 0;
  max-height: 220px;
  overflow: auto;
  padding: 10px;
  border-radius: 6px;
  background: #f5f7fa;
  font-size: 11px;
  line-height: 1.6;
}
</style>

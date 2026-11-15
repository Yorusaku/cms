<template>
  <section class="ticket-exception-form" :style="styles">
    <header v-if="title || subtitle" class="form-header">
      <h3 v-if="title">{{ title }}</h3>
      <p v-if="subtitle">{{ subtitle }}</p>
      <p v-if="businessCategory" class="form-category">业务类别：{{ businessCategory }}</p>
    </header>

    <form class="ticket-form" @submit.prevent="handleSubmit">
      <label class="form-field">
        <span class="field-label">票据编号<b>*</b></span>
        <input
          v-model="form.ticketNo"
          class="field-control"
          type="text"
          placeholder="请输入票据编号"
          maxlength="120"
          data-testid="ticket-no"
        />
      </label>

      <label class="form-field">
        <span class="field-label">异常类型<b>*</b></span>
        <select v-model="form.exceptionType" class="field-control" data-testid="ticket-type">
          <option value="">请选择异常类型</option>
          <option v-for="type in exceptionTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </label>

      <label class="form-field">
        <span class="field-label">问题说明<b>*</b></span>
        <textarea
          v-model="form.description"
          class="field-control field-textarea"
          rows="3"
          maxlength="2000"
          placeholder="请描述具体问题，例如缺少开票日期、金额与质检单不一致"
          data-testid="ticket-description"
        />
      </label>

      <label v-for="field in normalizedExtraFields" :key="field.key" class="form-field">
        <span class="field-label"> {{ field.label }}<b v-if="field.required">*</b> </span>
        <select
          v-if="field.type === 'select'"
          v-model="extraForm[field.key]"
          class="field-control"
          :data-testid="`ticket-extra-${field.key}`"
        >
          <option value="">{{ field.placeholder || '请选择' }}</option>
          <option v-for="option in field.options" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <input
          v-else
          v-model="extraForm[field.key]"
          class="field-control"
          :type="field.type"
          :placeholder="field.placeholder || `请输入${field.label}`"
          :data-testid="`ticket-extra-${field.key}`"
        />
      </label>

      <button
        class="submit-button"
        type="submit"
        :disabled="submitting"
        data-testid="ticket-submit"
      >
        {{ submitting ? submittingText : submitText }}
      </button>
    </form>

    <p v-if="message" class="form-message" :class="messageType">
      {{ message }}
      <button
        v-if="createdId"
        type="button"
        class="result-link"
        data-testid="ticket-view-result"
        @click="emitViewResult"
      >
        查看登记结果
      </button>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createRequestId,
  isUnauthorizedError,
  submitTicketExceptionRequest
} from '../utils/form-submit'

export interface TicketExtraField {
  key: string
  label: string
  type: 'text' | 'date' | 'select'
  required?: boolean
  placeholder?: string
  options?: string[]
}

interface Props {
  title?: string
  subtitle?: string
  submitText?: string
  submittingText?: string
  successText?: string
  errorText?: string
  businessCategory?: string
  /** 允许的异常类型：数组或一行一个的字符串（物料归一化后是字符串） */
  allowedExceptionTypes?: string[] | string
  extraFields?: TicketExtraField[]
  pageId?: number
  /** 组件 ID：由渲染层注入，创建请求用于定位表单 */
  componentId?: string
  publishedVersionId?: string
  endpoint?: string
  /** 详情页 hash 路径：成功后「查看登记结果」跳转，由调用端按端内路由传入 */
  detailPath?: string
  /** 预览模式：编辑画布 / 独立预览 / iframe 预览显式传入，禁止真实写入 */
  previewMode?: boolean
  styles?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  title: '票据异常登记',
  subtitle: '请填写票据信息与异常情况',
  submitText: '提交登记',
  submittingText: '提交中...',
  successText: '已登记，工作人员会尽快处理',
  errorText: '提交失败，请稍后重试',
  businessCategory: '报销票据',
  allowedExceptionTypes: () => [],
  extraFields: () => [],
  pageId: 0,
  componentId: '',
  publishedVersionId: '',
  endpoint: '/atlas-cms/createTicketException',
  detailPath: '/ticketException',
  previewMode: false,
  styles: () => ({})
})

const emit = defineEmits<{
  submit: [Record<string, unknown>]
  /** 需要登录：由页面端弹出登录，组件本身不跳转 */
  'require-login': []
  /** 查看登记结果：由页面端用路由打开详情（组件不碰路由） */
  'view-result': [number]
}>()

const form = reactive({ ticketNo: '', exceptionType: '', description: '' })
const extraForm = reactive<Record<string, string>>({})
const submitting = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
/** 创建成功后的记录 ID：提供「查看登记结果」入口 */
const createdId = ref<number>(0)

/** 同一轮提交复用 requestId，重试时后端按幂等返回原记录 */
const pendingRequestId = ref<string | null>(null)

const exceptionTypes = computed(() => {
  const raw = props.allowedExceptionTypes as unknown
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,，\n]/) : []
  return list.map(item => String(item ?? '').trim()).filter(Boolean)
})

const normalizedExtraFields = computed(() =>
  (props.extraFields ?? []).filter(field => field.key && field.label)
)

const setMessage = (type: 'success' | 'error', text: string) => {
  messageType.value = type
  message.value = text
}

/** 草稿：登录跳转会重新加载页面，未提交内容需要留在 sessionStorage 里 */
const draftKey = computed(() => `ticket-exception-draft:${props.pageId}:${props.componentId}`)

interface TicketDraft {
  ticketNo?: string
  exceptionType?: string
  description?: string
  extra?: Record<string, string>
}

const saveDraft = () => {
  try {
    sessionStorage.setItem(
      draftKey.value,
      JSON.stringify({
        ticketNo: form.ticketNo,
        exceptionType: form.exceptionType,
        description: form.description,
        extra: { ...extraForm }
      } satisfies TicketDraft)
    )
  } catch {
    // 隐私模式 / 存储满：草稿留不住不影响提交本身
  }
}

const clearDraft = () => {
  try {
    sessionStorage.removeItem(draftKey.value)
  } catch {
    // 忽略
  }
}

const restoreDraft = () => {
  try {
    const raw = sessionStorage.getItem(draftKey.value)
    if (!raw) {
      return
    }
    const draft = JSON.parse(raw) as TicketDraft
    form.ticketNo = typeof draft.ticketNo === 'string' ? draft.ticketNo : ''
    form.exceptionType = typeof draft.exceptionType === 'string' ? draft.exceptionType : ''
    form.description = typeof draft.description === 'string' ? draft.description : ''
    Object.entries(draft.extra ?? {}).forEach(([key, value]) => {
      if (typeof value === 'string') {
        extraForm[key] = value
      }
    })
  } catch {
    // 草稿损坏时按空表单处理
  }
}

/** 未登录 / 登录过期：保留填写内容，交给页面端拉起登录 */
const requireLogin = () => {
  saveDraft()
  setMessage('error', '请先登录后再提交，当前填写内容已保留')
  emit('require-login')
}

const emitViewResult = () => {
  if (createdId.value) {
    emit('view-result', createdId.value)
  }
}

const handleSubmit = async () => {
  message.value = ''

  // 预览/编辑画布不产生真实业务写入：显式标记与缺少上下文都拒绝
  if (props.previewMode || !props.pageId || !props.publishedVersionId || !props.componentId) {
    setMessage('error', '当前为预览环境，不支持提交；请在已发布页面操作')
    return
  }

  // 未登录先提示登录并保留内容：避免填完所有字段后才发现要登录
  if (typeof localStorage !== 'undefined' && !localStorage.getItem('token')) {
    requireLogin()
    return
  }

  if (!form.ticketNo.trim()) {
    setMessage('error', '请填写票据编号')
    return
  }
  if (!form.exceptionType) {
    setMessage('error', '请选择异常类型')
    return
  }
  if (!form.description.trim()) {
    setMessage('error', '请填写问题说明')
    return
  }

  const missing = normalizedExtraFields.value.find(
    field => field.required && !(extraForm[field.key] ?? '').trim()
  )
  if (missing) {
    setMessage('error', `请填写${missing.label}`)
    return
  }

  const extraFields: Record<string, string> = {}
  normalizedExtraFields.value.forEach(field => {
    const value = (extraForm[field.key] ?? '').trim()
    if (value) {
      extraFields[field.key] = value
    }
  })

  const payload = {
    requestId: (pendingRequestId.value ??= createRequestId()),
    pageId: props.pageId,
    componentId: props.componentId,
    publishedVersionId: props.publishedVersionId,
    ticketNo: form.ticketNo.trim(),
    exceptionType: form.exceptionType,
    description: form.description.trim(),
    extraFields
  }

  submitting.value = true
  try {
    const result = await submitTicketExceptionRequest(payload, props.endpoint)
    createdId.value = result.id
    emit('submit', { ...payload, id: result.id, duplicated: result.duplicated })
    setMessage('success', result.duplicated ? '该登记已提交成功，无需重复提交' : props.successText)
    form.ticketNo = ''
    form.exceptionType = ''
    form.description = ''
    Object.keys(extraForm).forEach(key => delete extraForm[key])
    pendingRequestId.value = null
    clearDraft()
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) {
      // 登录过期：不清空表单，重新登录后可继续提交
      requireLogin()
      return
    }
    setMessage(
      'error',
      error instanceof Error && error.message
        ? `${props.errorText}（${error.message}）`
        : props.errorText
    )
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  restoreDraft()
})
</script>

<style scoped>
.ticket-exception-form {
  padding: 20px;
  background: var(--color-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
}

.form-header h3 {
  margin: 0;
  color: var(--color-text-primary, #1f2937);
  font-size: 18px;
}

.form-header p {
  margin: 6px 0 0;
  color: var(--color-text-secondary, #4b5563);
  font-size: 13px;
}

.form-category {
  color: var(--color-text-tertiary, #9ca3af) !important;
  font-size: 12px !important;
}

.ticket-form {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.form-field {
  display: grid;
  gap: 6px;
}

.field-label {
  color: var(--color-text-regular, #606266);
  font-size: 13px;
}

.field-label b {
  color: var(--color-danger, #f56c6c);
  margin-left: 3px;
}

.field-control {
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: var(--radius-sm, 4px);
  font: inherit;
  background: #fff;
}

.field-textarea {
  padding: 8px 10px;
  min-height: 84px;
  resize: vertical;
}

.submit-button {
  min-height: 40px;
  border: 0;
  border-radius: var(--radius-sm, 4px);
  background: var(--color-primary, #409eff);
  color: #fff;
  cursor: pointer;
}

.submit-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.form-message {
  margin: 12px 0 0;
  font-size: 13px;
}

.form-message.success {
  color: var(--color-success, #67c23a);
}

.form-message.error {
  color: var(--color-danger, #f56c6c);
}

.result-link {
  margin-left: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary, #409eff);
  font: inherit;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
}
</style>

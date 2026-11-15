<template>
  <div class="ticket-detail-page layout-business">
    <header class="detail-nav">
      <button type="button" class="nav-back" @click="goBack">返回</button>
      <strong>异常详情</strong>
    </header>

    <div v-if="!loggedIn" class="state-block">
      <p class="state-text">请先登录后查看记录</p>
      <button type="button" class="primary-button" @click="goLogin">去登录</button>
    </div>

    <div v-else-if="loading" class="state-block">
      <p class="state-text">加载中...</p>
    </div>

    <div v-else-if="loadError" class="state-block">
      <p class="state-text">{{ loadError }}</p>
      <button type="button" class="plain-button" @click="loadDetail">重试</button>
    </div>

    <template v-else-if="detail">
      <section class="block">
        <h2 class="block-title">
          {{ detail.ticketNo }}
          <span class="status-tag" :class="`status-${detail.status}`">
            {{ statusLabel }}
          </span>
        </h2>
        <dl class="info-list">
          <div class="info-row">
            <dt>业务类别</dt>
            <dd>{{ detail.businessCategory }}</dd>
          </div>
          <div class="info-row">
            <dt>异常类型</dt>
            <dd>{{ detail.exceptionType }}</dd>
          </div>
          <div class="info-row">
            <dt>提交人</dt>
            <dd>{{ detail.submitterUsername }}</dd>
          </div>
          <div class="info-row">
            <dt>提交时间</dt>
            <dd>{{ formatTime(detail.createdAt) }}</dd>
          </div>
        </dl>
        <p class="description">{{ detail.description }}</p>
      </section>

      <section v-if="fieldDefinitions.length" class="block">
        <h3 class="block-subtitle">字段信息</h3>
        <dl class="info-list">
          <div v-for="field in fieldDefinitions" :key="field.key" class="info-row">
            <dt>{{ field.label }}</dt>
            <dd>{{ displayValue(field.key) }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="canSupplement" class="block">
        <h3 class="block-subtitle">补充信息</h3>
        <p class="block-tip">只提交本次修改过的字段，未修改的保持不变</p>
        <label v-for="field in fieldDefinitions" :key="`edit-${field.key}`" class="edit-field">
          <span class="edit-label">{{ field.label }}</span>
          <select v-if="field.type === 'select'" v-model="draft[field.key]" class="edit-control">
            <option value="">请选择</option>
            <option v-for="option in field.options ?? []" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
          <input
            v-else
            v-model="draft[field.key]"
            class="edit-control"
            :type="field.type === 'date' ? 'date' : 'text'"
          />
        </label>
        <label class="edit-field">
          <span class="edit-label">补充说明</span>
          <textarea
            v-model="note"
            class="edit-control edit-textarea"
            rows="3"
            maxlength="1000"
            placeholder="说明本次补充了什么"
          />
        </label>
        <p v-if="actionError" class="action-error">{{ actionError }}</p>
        <button
          type="button"
          class="primary-button is-block"
          :disabled="submitting"
          data-testid="supplement-submit"
          @click="submitSupplement"
        >
          {{ submitting ? '提交中...' : '提交补充' }}
        </button>
      </section>

      <section v-if="canProcess" class="block">
        <h3 class="block-subtitle">处理记录</h3>
        <label class="edit-field">
          <span class="edit-label">处理说明</span>
          <textarea
            v-model="note"
            class="edit-control edit-textarea"
            rows="3"
            maxlength="1000"
            placeholder="说明要求补充的原因或处理结果"
          />
        </label>
        <p v-if="actionError" class="action-error">{{ actionError }}</p>
        <div class="action-row">
          <button
            type="button"
            class="plain-button"
            :disabled="submitting"
            data-testid="request-supplement"
            @click="submitProcess('request_supplement')"
          >
            要求补充
          </button>
          <button
            type="button"
            class="primary-button"
            :disabled="submitting"
            data-testid="resolve-ticket"
            @click="submitProcess('resolve')"
          >
            标记已解决
          </button>
        </div>
      </section>

      <section class="block">
        <h3 class="block-subtitle">
          图片材料
          <span class="material-count">{{ attachments.length }} / 3</span>
        </h3>
        <p v-if="materialError" class="action-error" data-testid="material-error">
          {{ materialError }}
        </p>
        <p v-if="attachments.length === 0 && !canUpload" class="block-tip">暂无图片材料</p>
        <div v-if="attachments.length" class="material-list">
          <button
            v-for="item in attachments"
            :key="item.id"
            type="button"
            class="material-thumb"
            :data-testid="`material-thumb-${item.id}`"
            @click="previewAttachment(item.id)"
          >
            <img v-if="thumbUrls[item.id]" :src="thumbUrls[item.id]" alt="" />
            <span v-else class="material-loading">加载中…</span>
            <span class="material-name">{{ item.originalName }}</span>
          </button>
        </div>
        <label v-if="canUpload" class="upload-row">
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png"
            data-testid="material-file"
            @change="handleFileChange"
          />
          <button
            type="button"
            class="plain-button"
            :disabled="uploading || !pendingFile"
            data-testid="material-upload"
            @click="submitUpload"
          >
            {{ uploading ? '上传中...' : '上传材料' }}
          </button>
          <span class="block-tip">最多 3 张，每张不超过 5MB（JPG/PNG）</span>
        </label>
      </section>

      <section class="block">
        <h3 class="block-subtitle">处理历史</h3>
        <ol class="timeline">
          <li v-for="event in detail.events" :key="event.id" class="timeline-item">
            <div class="timeline-head">
              <span class="timeline-action">{{ actionLabel(event.action) }}</span>
              <span class="timeline-time">{{ formatTime(event.createdAt) }}</span>
            </div>
            <p class="timeline-meta">{{ event.operatorUsername }}</p>
            <p v-if="event.note" class="timeline-note">{{ event.note }}</p>
            <p v-if="payloadText(event.payload)" class="timeline-payload">
              本次补充：{{ payloadText(event.payload) }}
            </p>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  TICKET_EXCEPTION_ACTION_LABELS,
  TICKET_EXCEPTION_STATUS_LABELS,
  type ProcessTicketExceptionAction,
  type TicketExceptionAction,
  type TicketExceptionDetail,
  type TicketExceptionStatus
} from '@cms/types'
import {
  fetchTicketAttachmentBlob,
  fetchTicketExceptionDetail,
  processTicketException,
  supplementTicketException,
  uploadTicketExceptionAttachment
} from '@/api/ticket-exception'
import { TICKET_ATTACHMENT_MAX_COUNT } from '@cms/types'
import { currentPath, isLoggedIn, parseTokenUser } from '@/utils/auth'

defineOptions({ name: 'CrsTicketExceptionDetailView' })

const route = useRoute()
const router = useRouter()

const detail = ref<TicketExceptionDetail | null>(null)
const loading = ref(false)
const loadError = ref('')
const actionError = ref('')
const submitting = ref(false)
const loggedIn = ref(isLoggedIn())
const user = parseTokenUser()
const note = ref('')
const draft = reactive<Record<string, string>>({})

const recordId = computed(() => {
  const id = Number(route.query.id)
  return Number.isFinite(id) && id > 0 ? id : 0
})

/** 材料缩略图与预览的 Blob URL：组件销毁时统一释放 */
const thumbUrls = reactive<Record<number, string>>({})
const previewUrl = ref('')
const pendingFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const materialError = ref('')
const attachments = computed(() => detail.value?.attachments ?? [])

/** 上传条件：原提交人 + admin/editor + 记录未解决（后端仍会独立校验） */
const canUpload = computed(
  () =>
    Boolean(detail.value) &&
    detail.value?.submitterUsername === user?.username &&
    ['admin', 'editor'].includes(user?.role ?? '') &&
    detail.value?.status !== 'resolved' &&
    attachments.value.length < TICKET_ATTACHMENT_MAX_COUNT
)

const loadThumb = async (id: number) => {
  if (thumbUrls[id]) return
  try {
    const blob = await fetchTicketAttachmentBlob(id)
    thumbUrls[id] = URL.createObjectURL(blob)
  } catch {
    // 加载失败留空，点击重试
  }
}

const previewAttachment = async (id: number) => {
  try {
    const blob = await fetchTicketAttachmentBlob(id)
    previewUrl.value = URL.createObjectURL(blob)
  } catch {
    materialError.value = '材料读取失败，请重试'
  }
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  pendingFile.value = input.files?.[0] ?? null
  materialError.value = ''
}

const submitUpload = async () => {
  materialError.value = ''
  if (!pendingFile.value || !recordId.value) {
    materialError.value = '请先选择图片'
    return
  }
  uploading.value = true
  try {
    const response = await uploadTicketExceptionAttachment(recordId.value, pendingFile.value)
    if (response.data?.attachments) {
      // 重新拉取详情：材料列表与时间线一起刷新
      await loadDetail()
    }
    pendingFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (err: unknown) {
    // 失败时记录仍保留，用户可换图重试
    materialError.value = err instanceof Error && err.message ? err.message : '上传失败，请重试'
  } finally {
    uploading.value = false
  }
}

onUnmounted(() => {
  Object.values(thumbUrls).forEach(url => URL.revokeObjectURL(url))
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

const statusLabel = computed(() =>
  detail.value
    ? (TICKET_EXCEPTION_STATUS_LABELS[detail.value.status as TicketExceptionStatus] ??
      detail.value.status)
    : ''
)

const fieldDefinitions = computed(() => detail.value?.fieldSnapshot?.extraFields ?? [])

/** 只有原提交人、且状态为「待补充」时可以补充 */
const canSupplement = computed(
  () =>
    Boolean(detail.value) &&
    Boolean(user?.username) &&
    detail.value?.submitterUsername === user?.username &&
    detail.value?.status === 'needs_supplement'
)

/** admin / editor 在「待处理」时可以要求补充或解决 */
const canProcess = computed(
  () =>
    Boolean(detail.value) &&
    ['admin', 'editor'].includes(user?.role ?? '') &&
    detail.value?.status === 'pending'
)

const displayValue = (key: string): string => {
  const value = detail.value?.extraFields?.[key]
  return value === undefined || value === null || value === '' ? '-' : String(value)
}

const formatTime = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const actionLabel = (action: TicketExceptionAction): string =>
  TICKET_EXCEPTION_ACTION_LABELS[action] ?? action

const payloadText = (payload: Record<string, unknown> | null): string => {
  if (!payload) {
    return ''
  }
  const definitions = fieldDefinitions.value
  return Object.entries(payload)
    .map(([key, value]) => {
      const label = definitions.find(field => field.key === key)?.label ?? key
      return `${label}：${String(value)}`
    })
    .join('；')
}

const loadDetail = async () => {
  if (!recordId.value) {
    loadError.value = '缺少记录 ID，请从列表进入'
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const response = await fetchTicketExceptionDetail(recordId.value)
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || '记录加载失败')
    }
    detail.value = response.data
    // 预填当前值：补充时只提交改动过的字段
    Object.keys(draft).forEach(key => delete draft[key])
    fieldDefinitions.value.forEach(field => {
      draft[field.key] = String(detail.value?.extraFields?.[field.key] ?? '')
    })
    attachments.value.forEach(item => void loadThumb(item.id))
  } catch (err: unknown) {
    loadError.value =
      err instanceof Error && /401|登录/.test(err.message)
        ? '登录已过期，请重新登录'
        : err instanceof Error && err.message
          ? err.message
          : '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

/** 只回传真正改动过的字段；空值不清空已有内容 */
const changedFields = (): Record<string, string> => {
  const result: Record<string, string> = {}
  fieldDefinitions.value.forEach(field => {
    const current = String(detail.value?.extraFields?.[field.key] ?? '').trim()
    const next = String(draft[field.key] ?? '').trim()
    if (next && next !== current) {
      result[field.key] = next
    }
  })
  return result
}

const submitSupplement = async () => {
  actionError.value = ''
  if (!note.value.trim()) {
    actionError.value = '请填写补充说明'
    return
  }
  const extraFields = changedFields()
  submitting.value = true
  try {
    const response = await supplementTicketException({
      id: recordId.value,
      note: note.value.trim(),
      extraFields: Object.keys(extraFields).length ? extraFields : undefined
    })
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || '补充失败')
    }
    detail.value = response.data
    note.value = ''
    Object.keys(draft).forEach(key => delete draft[key])
    fieldDefinitions.value.forEach(field => {
      draft[field.key] = String(detail.value?.extraFields?.[field.key] ?? '')
    })
  } catch (err: unknown) {
    actionError.value = err instanceof Error && err.message ? err.message : '补充失败，请重试'
  } finally {
    submitting.value = false
  }
}

const submitProcess = async (action: ProcessTicketExceptionAction) => {
  actionError.value = ''
  if (!note.value.trim()) {
    actionError.value = '请填写处理说明'
    return
  }
  submitting.value = true
  try {
    const response = await processTicketException({
      id: recordId.value,
      action,
      note: note.value.trim()
    })
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || '处理失败')
    }
    detail.value = response.data
    note.value = ''
  } catch (err: unknown) {
    actionError.value = err instanceof Error && err.message ? err.message : '处理失败，请重试'
  } finally {
    submitting.value = false
  }
}

const goLogin = () => {
  window.location.replace(
    `${window.location.pathname}#/login?redirect=${encodeURIComponent(currentPath())}`
  )
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.replace('/')
}

onMounted(() => {
  loggedIn.value = isLoggedIn()
  if (loggedIn.value) {
    void loadDetail()
  }
})
</script>

<style scoped>
.layout-business {
  /* 业务布局：字号按 375 设计稿固定，不随浏览器宽度放大 */
  --design-vw: calc(min(100vw, 375px) / 100);
}

.ticket-detail-page {
  min-height: 100vh;
  padding-bottom: 24px;
  background: var(--color-bg-page, #f5f7fa);
  box-sizing: border-box;
}

/* 桌面宽度：内容居中，正文 14px、标题 20px，不再随视口放大 */
@media (min-width: 768px) {
  .ticket-detail-page {
    padding: 0 16px 32px;
  }

  .layout-business .detail-nav {
    max-width: 1120px;
    margin: 0 auto;
    border-radius: 0 0 12px 12px;
  }

  .layout-business .block {
    max-width: 1120px;
    margin: 16px auto 0;
    padding: 24px 28px;
  }

  .block-title {
    font-size: 20px;
  }

  .block-subtitle {
    font-size: 16px;
  }

  .info-row,
  .description,
  .timeline-head {
    font-size: 14px;
  }
}

.detail-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid var(--color-border-lighter, #ebeef5);
  color: var(--color-text-primary, #1f2937);
  font-size: 16px;
}

.nav-back {
  border: 0;
  background: transparent;
  color: var(--color-primary, #409eff);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.primary-button {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary, #409eff);
  color: #fff;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.primary-button.is-block {
  width: 100%;
  margin-top: 8px;
}

.primary-button:disabled,
.plain-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.plain-button {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 8px;
  background: #fff;
  color: var(--color-text-regular, #4b5563);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.state-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 48px 16px;
}

.state-text {
  margin: 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 14px;
}

.block {
  margin: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
}

.block-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 12px;
  color: var(--color-text-primary, #1f2937);
  font-size: 17px;
}

.block-subtitle {
  margin: 0 0 10px;
  color: var(--color-text-primary, #1f2937);
  font-size: 15px;
}

.block-tip {
  margin: 0 0 10px;
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.status-pending {
  background: #fff4e5;
  color: #b45309;
}

.status-needs_supplement {
  background: #fef2f2;
  color: #b91c1c;
}

.status-resolved {
  background: #ecfdf5;
  color: #047857;
}

.info-list {
  margin: 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
}

.info-row dt {
  color: var(--color-text-secondary, #6b7280);
}

.info-row dd {
  margin: 0;
  color: var(--color-text-primary, #1f2937);
  text-align: right;
  word-break: break-all;
}

.description {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-lighter, #ebeef5);
  color: var(--color-text-regular, #4b5563);
  font-size: 13px;
  line-height: 1.6;
}

.edit-field {
  display: block;
  margin-bottom: 12px;
}

.edit-label {
  display: block;
  margin-bottom: 6px;
  color: var(--color-text-regular, #4b5563);
  font-size: 13px;
}

.edit-control {
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-size: 13px;
}

.edit-textarea {
  padding: 8px 10px;
  min-height: 80px;
  resize: vertical;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.action-error {
  margin: 8px 0;
  color: var(--color-danger, #ee0a24);
  font-size: 12px;
}

.material-count {
  margin-left: 8px;
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
}

.material-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.material-thumb {
  position: relative;
  width: 120px;
  height: 90px;
  padding: 0;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 8px;
  background: #fff;
  cursor: zoom-in;
  overflow: hidden;
}

.material-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-loading {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--color-text-placeholder, #9ca3af);
  font-size: 12px;
}

.material-name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2px 6px;
  background: rgba(15, 23, 42, 0.55);
  color: #fff;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}

.preview-mask {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.7);
  cursor: zoom-out;
}

.preview-mask img {
  max-width: 92vw;
  max-height: 92vh;
}

.timeline {
  margin: 0;
  padding: 0 0 0 14px;
  list-style: none;
  border-left: 1px solid var(--color-border-lighter, #ebeef5);
}

.timeline-item {
  position: relative;
  padding: 0 0 14px 12px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  top: 4px;
  left: -5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary, #409eff);
}

.timeline-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.timeline-action {
  color: var(--color-text-primary, #1f2937);
  font-weight: 600;
}

.timeline-time {
  color: var(--color-text-placeholder, #9ca3af);
  font-size: 12px;
}

.timeline-meta {
  margin: 4px 0 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
}

.timeline-note {
  margin: 4px 0 0;
  color: var(--color-text-regular, #4b5563);
  font-size: 12px;
  line-height: 1.5;
}

.timeline-payload {
  margin: 4px 0 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
}
</style>

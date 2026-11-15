<template>
  <div class="ticket-page">
    <header class="ticket-header">
      <div>
        <h1 class="ticket-title">票据异常</h1>
        <p class="ticket-subtitle">登记票据异常、跟进处理进度。与页面审核发布是两条独立流程。</p>
      </div>
      <el-button :loading="loading" @click="loadList">刷新</el-button>
    </header>

    <el-tabs v-model="activeView" @tab-change="handleSearch">
      <el-tab-pane label="全部记录" name="all" />
      <el-tab-pane v-if="role !== 'viewer'" label="待处理" name="pending" />
      <el-tab-pane label="待我补充" name="mineNeedsSupplement" />
      <el-tab-pane label="我的提交" name="mineSubmitted" />
    </el-tabs>
    <p v-if="summary && !unassignedOnly" class="workbench-summary" data-testid="workbench-summary">
      <span v-if="summary.pendingCount !== null">待处理 {{ summary.pendingCount }} · </span>
      待我补充 {{ summary.mineNeedsSupplementCount }} · 我的提交 {{ summary.mineSubmittedCount }} ·
      <router-link
        :to="{ path: '/notifications', query: { scenarioId: query.scenarioId || undefined } }"
      >
        未读消息 {{ summary.unreadCount }}
      </router-link>
    </p>

    <el-form :model="query" inline class="ticket-filter" @submit.prevent>
      <el-form-item label="票据编号">
        <el-input
          v-model="query.ticketNo"
          class="ticket-filter-control"
          placeholder="按票据编号搜索"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="异常类型">
        <el-input
          v-model="query.exceptionType"
          class="ticket-filter-control"
          placeholder="精确匹配异常类型"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="query.status"
          class="ticket-filter-control"
          placeholder="全部状态"
          clearable
        >
          <el-option
            v-for="(meta, value) in TICKET_STATUS_META"
            :key="value"
            :label="meta.label"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="提交人">
        <el-input
          v-model="query.submitter"
          class="ticket-filter-control"
          placeholder="按提交人筛选"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="业务场景">
        <el-select
          v-model="query.scenarioId"
          class="ticket-filter-control"
          placeholder="全部场景"
          clearable
          filterable
          :disabled="unassignedOnly"
        >
          <el-option
            v-for="scenario in scenarios"
            :key="scenario.id"
            :label="scenario.name"
            :value="scenario.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="历史未归属">
        <el-switch v-model="unassignedOnly" @change="handleUnassignedChange" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="items" border stripe class="ticket-table">
      <el-table-column prop="ticketNo" label="票据编号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="businessCategory" label="业务类别" width="120" />
      <el-table-column
        prop="exceptionType"
        label="异常类型"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="TICKET_STATUS_META[row.status as TicketExceptionStatus].type" size="small">
            {{ TICKET_STATUS_META[row.status as TicketExceptionStatus].label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submitterUsername" label="提交人" width="120" />
      <el-table-column label="提交时间" width="170">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="110" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="ticket-pager">
      <el-pagination
        :current-page="query.pageNum"
        :page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-drawer
      v-model="detailVisible"
      :title="detail ? `异常 ${detail.ticketNo}` : '异常详情'"
      size="620px"
      class="ticket-detail-drawer"
    >
      <div v-if="detail" class="ticket-detail">
        <section class="detail-section">
          <div class="detail-head">
            <span class="detail-ticket-no">{{ detail.ticketNo }}</span>
            <el-tag :type="TICKET_STATUS_META[detail.status].type" size="small">
              {{ TICKET_STATUS_META[detail.status].label }}
            </el-tag>
          </div>
          <dl class="detail-grid">
            <div>
              <dt>业务类别</dt>
              <dd>{{ detail.businessCategory }}</dd>
            </div>
            <div>
              <dt>异常类型</dt>
              <dd>{{ detail.exceptionType }}</dd>
            </div>
            <div>
              <dt>提交人</dt>
              <dd>{{ detail.submitterUsername }}</dd>
            </div>
            <div>
              <dt>提交时间</dt>
              <dd>{{ formatDateTime(detail.createdAt) }}</dd>
            </div>
            <div class="is-wide">
              <dt>问题说明</dt>
              <dd>{{ detail.description }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="detailFields.length" class="detail-section">
          <h3 class="detail-section-title">扩展信息</h3>
          <dl class="detail-grid">
            <div v-for="field in detailFields" :key="field.key">
              <dt>{{ field.label }}</dt>
              <dd>{{ field.value || '—' }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-section">
          <h3 class="detail-section-title">
            图片材料
            <span class="material-count">{{ detail.attachments.length }} / 3</span>
          </h3>
          <p v-if="!detail.attachments.length" class="detail-hint">暂无图片材料</p>
          <div v-else class="material-list">
            <div v-for="item in detail.attachments" :key="item.id" class="material-thumb">
              <img v-if="materialUrls[item.id]" :src="materialUrls[item.id]" alt="" />
              <span v-else class="material-loading">加载中…</span>
              <span class="material-name">{{ item.originalName }}</span>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h3 class="detail-section-title">处理记录</h3>
          <ol class="timeline">
            <li v-for="event in detail.events" :key="event.id" class="timeline-item">
              <div class="timeline-head">
                <span class="timeline-action">{{ TICKET_ACTION_LABELS[event.action] }}</span>
                <span class="timeline-meta">
                  {{ event.operatorUsername }} · {{ formatDateTime(event.createdAt) }}
                </span>
              </div>
              <p v-if="event.note" class="timeline-note">{{ event.note }}</p>
              <p v-if="event.payload" class="timeline-payload">
                {{ formatPayload(event.payload) }}
              </p>
            </li>
          </ol>
        </section>

        <section v-if="canProcess" class="detail-section detail-actions">
          <h3 class="detail-section-title">处理</h3>
          <el-input
            v-model="actionNote"
            type="textarea"
            :rows="3"
            maxlength="1000"
            show-word-limit
            placeholder="处理说明必填：说明原因或处理结果"
          />
          <div class="detail-action-row">
            <el-button :disabled="actionLoading" @click="submitAction('request_supplement')">
              要求补充
            </el-button>
            <el-button type="primary" :disabled="actionLoading" @click="submitAction('resolve')">
              标记解决
            </el-button>
          </div>
          <p class="detail-hint">
            标记解决后本期不支持重新打开；需要补充时提交人会收到待补充状态。
          </p>
        </section>

        <section v-if="canSupplement" class="detail-section detail-actions">
          <h3 class="detail-section-title">提交补充</h3>
          <p class="detail-hint">{{ supplementHint }}</p>
          <div v-if="supplementFields.length" class="supplement-fields">
            <label
              v-for="field in supplementFields"
              :key="`supplement-${field.key}`"
              class="supplement-field"
            >
              <span class="supplement-label">
                {{ field.label }}
                <em v-if="field.required">*</em>
              </span>
              <el-select
                v-if="field.type === 'select'"
                v-model="supplementDraft[field.key]"
                class="supplement-control"
                placeholder="请选择"
                clearable
              >
                <el-option
                  v-for="option in field.options ?? []"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
              <el-date-picker
                v-else-if="field.type === 'date'"
                v-model="supplementDraft[field.key]"
                class="supplement-control"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择日期"
              />
              <el-input
                v-else
                v-model="supplementDraft[field.key]"
                class="supplement-control"
                placeholder="请输入"
              />
              <span class="supplement-current">
                当前：{{ currentFieldValue(field.key) || '—' }}
              </span>
            </label>
          </div>
          <el-input
            v-model="supplementNote"
            type="textarea"
            :rows="3"
            maxlength="1000"
            show-word-limit
            placeholder="补充说明必填"
          />
          <div class="detail-action-row">
            <el-button type="primary" :disabled="actionLoading" @click="submitSupplement">
              提交补充
            </el-button>
          </div>
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  fetchTicketAttachmentBlob,
  getTicketExceptionDetail,
  getTicketExceptionList,
  getTicketExceptionSummary,
  processTicketException,
  supplementTicketException,
  TICKET_ACTION_LABELS,
  TICKET_STATUS_META,
  type TicketExceptionDetail,
  type TicketExceptionItem,
  type TicketExceptionStatus
} from '@/api/ticket-exception'
import type { BusinessScenarioItem, TicketExceptionWorkbenchSummary } from '@cms/types'
import { getEffectiveRole, getUsername } from '@/utils/auth'
import { getBusinessScenarioList } from '@/api/scenario'

const route = useRoute()
const loading = ref(false)
const items = ref<TicketExceptionItem[]>([])
const total = ref(0)
const activeView = ref('all')
const summary = ref<TicketExceptionWorkbenchSummary | null>(null)
let listRequest = 0

const query = reactive({
  ticketNo: '',
  exceptionType: '',
  status: '' as TicketExceptionStatus | '',
  submitter: '',
  scenarioId: '',
  pageNum: 1,
  pageSize: 20
})
const unassignedOnly = ref(false)

/** 场景下拉（业务查询条件） */
const scenarios = ref<BusinessScenarioItem[]>([])
onMounted(() => {
  void getBusinessScenarioList()
    .then(response => {
      if (response.code === 10000) {
        scenarios.value = response.data ?? []
      }
    })
    .catch(() => ElMessage.error('场景列表加载失败，请刷新重试'))
})

const detailVisible = ref(false)
const detail = ref<TicketExceptionDetail | null>(null)
const actionNote = ref('')
const supplementNote = ref('')
const supplementDraft = reactive<Record<string, string>>({})
const actionLoading = ref(false)

const role = computed(() => getEffectiveRole())
const currentUsername = computed(() => getUsername())

/** 处理权限：admin / editor；viewer 只读 */
const canProcess = computed(
  () => detail.value?.status === 'pending' && ['admin', 'editor'].includes(role.value)
)

/** 补充权限：仅原提交人，且状态为待补充 */
const canSupplement = computed(
  () =>
    detail.value?.status === 'needs_supplement' &&
    role.value !== 'viewer' &&
    detail.value?.submitterUsername === currentUsername.value
)

const supplementHint = computed(() => {
  if (detail.value?.status !== 'needs_supplement') {
    return '该记录当前不需要补充'
  }
  return '补充内容会追加到处理记录，不会覆盖原提交'
})

/** 补充时只能编辑当前快照里的扩展字段，固定字段不在补充范围 */
const supplementFields = computed(() =>
  (detail.value?.fieldSnapshot?.extraFields ?? []).filter(field => field.key && field.label)
)

const currentFieldValue = (key: string): string => String(detail.value?.extraFields?.[key] ?? '')

/** 预填当前值：只提交改动过的字段，空值不代表清空 */
const resetSupplementDraft = () => {
  Object.keys(supplementDraft).forEach(key => delete supplementDraft[key])
  supplementFields.value.forEach(field => {
    supplementDraft[field.key] = String(detail.value?.extraFields?.[field.key] ?? '')
  })
}

const collectSupplementFields = (): Record<string, string> => {
  const result: Record<string, string> = {}
  supplementFields.value.forEach(field => {
    const current = String(detail.value?.extraFields?.[field.key] ?? '').trim()
    const next = String(supplementDraft[field.key] ?? '').trim()
    if (next && next !== current) {
      result[field.key] = next
    }
  })
  return result
}

const detailFields = computed(() => {
  const snapshot = detail.value?.fieldSnapshot
  if (!snapshot) {
    return []
  }
  const values = detail.value?.extraFields ?? {}
  return (snapshot.extraFields ?? []).map(field => ({
    key: field.key,
    label: field.label,
    // 显示名来自创建时快照，改版不影响历史记录的字段标题
    value: String(values[field.key] ?? '')
  }))
})

/** 材料缩略图：Blob URL 随抽屉关闭统一释放 */
const materialUrls = reactive<Record<number, string>>({})
const loadMaterial = async (id: number) => {
  if (materialUrls[id]) return
  try {
    const blob = await fetchTicketAttachmentBlob(id)
    materialUrls[id] = URL.createObjectURL(blob)
  } catch {
    // 读取失败留空
  }
}

onUnmounted(() => {
  Object.values(materialUrls).forEach(url => URL.revokeObjectURL(url))
})

const formatDateTime = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

const formatPayload = (payload: Record<string, unknown>): string => {
  const definitions = detail.value?.fieldSnapshot?.extraFields ?? []
  return Object.entries(payload)
    .map(([key, value]) => {
      // 展示快照里的字段名，历史记录不随模板改版改变
      const label = definitions.find(field => field.key === key)?.label ?? key
      return `${label}：${String(value)}`
    })
    .join('；')
}

const loadList = async () => {
  const request = ++listRequest
  loading.value = true
  try {
    const [response, counts] = await Promise.all([
      getTicketExceptionList({
        ticketNo: query.ticketNo || undefined,
        exceptionType: query.exceptionType || undefined,
        status:
          activeView.value === 'pending'
            ? 'pending'
            : activeView.value === 'mineNeedsSupplement'
              ? 'needs_supplement'
              : query.status || undefined,
        onlyMine: activeView.value.startsWith('mine') || undefined,
        submitter: activeView.value.startsWith('mine') ? undefined : query.submitter || undefined,
        scenarioId: query.scenarioId || undefined,
        unassignedOnly: unassignedOnly.value || undefined,
        pageNum: query.pageNum,
        pageSize: query.pageSize
      }),
      getTicketExceptionSummary(query.scenarioId || undefined)
    ])
    if (request !== listRequest) return
    if (response.code !== 10000) {
      throw new Error(response.message || '加载失败')
    }
    items.value = response.data?.items ?? []
    total.value = response.data?.total ?? 0
    summary.value = counts.code === 10000 ? (counts.data ?? null) : null
  } catch (error: unknown) {
    if (request !== listRequest) return
    items.value = []
    total.value = 0
    summary.value = null
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    if (request === listRequest) loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  void loadList()
}

const handleUnassignedChange = () => {
  if (unassignedOnly.value) query.scenarioId = ''
  handleSearch()
}

const handleReset = () => {
  query.ticketNo = ''
  query.exceptionType = ''
  query.status = ''
  query.submitter = ''
  query.scenarioId = ''
  unassignedOnly.value = false
  query.pageNum = 1
  void loadList()
}

const handlePageChange = (page: number) => {
  query.pageNum = page
  void loadList()
}

const handleSizeChange = (size: number) => {
  query.pageSize = size
  query.pageNum = 1
  void loadList()
}

const openDetail = async (id: number) => {
  detailVisible.value = true
  actionNote.value = ''
  supplementNote.value = ''
  try {
    const response = await getTicketExceptionDetail(id)
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || '加载详情失败')
    }
    detail.value = response.data
    // 预填当前值，补充时只提交改动过的字段
    resetSupplementDraft()
    detail.value.attachments.forEach(item => void loadMaterial(item.id))
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '加载详情失败')
  }
}

const submitAction = async (action: 'request_supplement' | 'resolve') => {
  if (!detail.value) {
    return
  }
  if (!actionNote.value.trim()) {
    ElMessage.warning('请填写处理说明')
    return
  }
  actionLoading.value = true
  try {
    const response = await processTicketException({
      id: detail.value.id,
      action,
      note: actionNote.value.trim()
    })
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || '处理失败')
    }
    detail.value = response.data
    actionNote.value = ''
    ElMessage.success(action === 'resolve' ? '已标记解决' : '已要求补充')
    await loadList()
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '处理失败')
  } finally {
    actionLoading.value = false
  }
}

const submitSupplement = async () => {
  if (!detail.value) {
    return
  }
  if (!supplementNote.value.trim()) {
    ElMessage.warning('请填写补充说明')
    return
  }
  actionLoading.value = true
  try {
    const extraFields = collectSupplementFields()
    const response = await supplementTicketException({
      id: detail.value.id,
      note: supplementNote.value.trim(),
      extraFields: Object.keys(extraFields).length ? extraFields : undefined
    })
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || '补充失败')
    }
    detail.value = response.data
    supplementNote.value = ''
    resetSupplementDraft()
    ElMessage.success('补充已提交')
    await loadList()
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '补充失败')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  void loadList()
  // 从站内提醒跳转：直接打开对应记录的详情抽屉
  const recordId = Number(route.query.recordId)
  if (Number.isFinite(recordId) && recordId > 0) {
    void openDetail(recordId)
  }
})
</script>

<style scoped>
.ticket-page {
  padding: 24px;
  min-height: 100vh;
  background: var(--color-bg-page, #f5f7fa);
}

.ticket-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.ticket-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.ticket-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary, #6b7280);
}

.ticket-filter {
  padding: 16px 16px 0;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #fff;
}

.ticket-filter-control {
  width: 200px;
}

.ticket-table {
  background: #fff;
}

.ticket-pager {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.ticket-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-light, #ebeef5);
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.detail-ticket-no {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.detail-section-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 0;
}

.detail-grid > div {
  min-width: 0;
}

.detail-grid > div.is-wide {
  grid-column: 1 / -1;
}

.detail-grid dt {
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
}

.detail-grid dd {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-primary, #1f2937);
  word-break: break-word;
}

.timeline {
  margin: 0;
  padding: 0 0 0 16px;
  list-style: none;
  border-left: 2px solid var(--color-border-light, #ebeef5);
}

.timeline-item {
  position: relative;
  padding: 0 0 14px 12px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -21px;
  top: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary, #409eff);
}

.timeline-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.timeline-action {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.timeline-meta {
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
}

.timeline-note {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary, #4b5563);
  white-space: pre-wrap;
  word-break: break-word;
}

.timeline-payload {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
}

.detail-actions .detail-action-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.detail-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-tertiary, #9ca3af);
}

.material-count {
  margin-left: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
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
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
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
  font-size: 12px;
  color: var(--color-text-placeholder, #9ca3af);
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

.supplement-fields {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.supplement-field {
  display: grid;
  gap: 6px;
}

.supplement-label {
  font-size: 13px;
  color: var(--color-text-regular, #606266);
}

.supplement-label em {
  margin-left: 3px;
  color: var(--color-danger, #f56c6c);
  font-style: normal;
}

.supplement-control {
  width: 100%;
}

.supplement-current {
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
}
</style>

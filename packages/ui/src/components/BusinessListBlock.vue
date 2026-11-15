<template>
  <section class="business-list-block" :style="styles">
    <header class="list-header">
      <div>
        <h3>{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <input
        v-if="!isRemote"
        v-model.trim="keyword"
        class="search-input"
        :placeholder="searchPlaceholder"
      />
      <span v-else-if="!hasAdapter" class="sample-badge">示例数据</span>
    </header>

    <div v-if="isRemote" class="filter-bar">
      <input
        v-model.trim="keyword"
        class="filter-control"
        :placeholder="searchPlaceholder"
        data-testid="list-keyword"
      />
      <select
        v-if="typeOptions.length"
        v-model="exceptionType"
        class="filter-control"
        data-testid="list-exception-type"
      >
        <option value="">全部异常类型</option>
        <option v-for="item in typeOptions" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
      <select
        v-if="statusOptions.length"
        v-model="status"
        class="filter-control"
        data-testid="list-status"
      >
        <option value="">全部状态</option>
        <option v-for="item in statusOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
      <label v-if="enableOnlyMine" class="filter-check">
        <input v-model="onlyMine" type="checkbox" data-testid="list-only-mine" />
        仅看我提交的
      </label>
      <button v-if="error" class="retry-button" type="button" @click="loadRemote">重试</button>
    </div>

    <p v-if="loading" class="list-state">加载中...</p>
    <p v-else-if="error" class="list-state list-error">{{ error }}</p>

    <div v-else-if="displayRows.length" class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in displayRows"
            :key="String(row.id ?? index)"
            :class="{ 'row-clickable': isRemote }"
            :data-testid="`ticket-row-${String(row.id ?? index)}`"
            @click="handleRowClick(row)"
          >
            <td v-for="column in columns" :key="column.key">
              {{ formatCell(row, column) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty-state">{{ emptyText }}</p>

    <footer v-if="pageCount > 1" class="pagination">
      <button :disabled="page === 1" @click="page -= 1">上一页</button>
      <span data-testid="list-page-indicator">{{ page }} / {{ pageCount }}</span>
      <button :disabled="page === pageCount" data-testid="list-next-page" @click="page += 1">
        下一页
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { TICKET_EXCEPTION_STATUS_LABELS, type TicketExceptionStatus } from '@cms/types'
import {
  BUSINESS_DATA_ADAPTER_KEY,
  BUSINESS_ROW_CLICK_KEY,
  createSampleTicketRows,
  type BusinessDataAdapter,
  type BusinessListPageResult,
  type BusinessRowClickHandler
} from '../utils/business-data'

export interface BusinessListColumn {
  key: string
  label: string
}

export type BusinessListRow = Record<string, string | number | null | undefined>

export type BusinessListDataSource = 'static' | 'ticketExceptions'

interface Props {
  title?: string
  subtitle?: string
  columns?: BusinessListColumn[]
  rows?: BusinessListRow[]
  pageSize?: number
  searchPlaceholder?: string
  emptyText?: string
  styles?: Record<string, string>
  /** 数据模式：static 用 rows，ticketExceptions 走运行端适配器 */
  dataSource?: BusinessListDataSource
  /** 远程模式下可筛选的异常类型：数组或一行一个的字符串（归一化后是字符串） */
  exceptionTypeOptions?: string[] | string
  /** 是否显示「仅看我提交的」（身份由后端解析） */
  enableOnlyMine?: boolean
}

const STATUS_OPTIONS = (Object.keys(TICKET_EXCEPTION_STATUS_LABELS) as TicketExceptionStatus[]).map(
  value => ({ value, label: TICKET_EXCEPTION_STATUS_LABELS[value] })
)

const props = withDefaults(defineProps<Props>(), {
  title: '业务数据',
  subtitle: '',
  columns: () => [
    { key: 'name', label: '名称' },
    { key: 'status', label: '状态' }
  ],
  rows: () => [
    { id: 1, name: '示例记录', status: '待处理' },
    { id: 2, name: '第二条记录', status: '已完成' }
  ],
  pageSize: 5,
  searchPlaceholder: '输入关键词筛选',
  emptyText: '暂无数据',
  styles: () => ({}),
  dataSource: 'static',
  exceptionTypeOptions: () => [],
  enableOnlyMine: false
})

/** 对外暴露的运行时状态，供联动规则消费（见物料定义的 runtimeEventProperties） */
const emit = defineEmits<{
  'filter-change': [payload: { filteredCount: number }]
  'row-click': [row: BusinessListRow]
}>()

const adapter = inject<BusinessDataAdapter | null>(BUSINESS_DATA_ADAPTER_KEY, null)
const rowClickHandler = inject<BusinessRowClickHandler | null>(BUSINESS_ROW_CLICK_KEY, null)

const isRemote = computed(() => props.dataSource === 'ticketExceptions')
const hasAdapter = computed(() => typeof adapter === 'function')

const keyword = ref('')
const exceptionType = ref('')
const status = ref('')
const onlyMine = ref(false)
const page = ref(1)

/** 远程状态 */
const remoteRows = ref<BusinessListRow[]>([])
const remoteTotal = ref(0)
const loading = ref(false)
const error = ref('')
/** 请求序号：迟到的响应不能覆盖最新筛选结果 */
let requestSeq = 0

const typeOptions = computed(() => {
  const raw = props.exceptionTypeOptions as unknown
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,，\n]/) : []
  return list.map(item => String(item ?? '').trim()).filter(Boolean)
})
const statusOptions = computed(() => (isRemote.value ? STATUS_OPTIONS : []))

const filteredRows = computed(() => {
  if (isRemote.value) {
    return remoteRows.value
  }
  if (!keyword.value) return props.rows
  const value = keyword.value.toLowerCase()
  return props.rows.filter(row =>
    Object.values(row).some(item =>
      String(item ?? '')
        .toLowerCase()
        .includes(value)
    )
  )
})

const pageCount = computed(() => {
  const total = isRemote.value ? remoteTotal.value : filteredRows.value.length
  return Math.max(1, Math.ceil(total / Math.max(1, props.pageSize)))
})

const displayRows = computed(() => {
  if (isRemote.value) {
    return remoteRows.value
  }
  return filteredRows.value.slice((page.value - 1) * props.pageSize, page.value * props.pageSize)
})

const formatDateTime = (value: unknown): string => {
  if (typeof value !== 'string' || !value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatCell = (row: BusinessListRow, column: BusinessListColumn) => {
  const value = row[column.key]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (column.key === 'status') {
    return TICKET_EXCEPTION_STATUS_LABELS[value as TicketExceptionStatus] ?? String(value)
  }
  if (column.key === 'createdAt' || column.key === 'updatedAt') {
    return formatDateTime(value)
  }
  return value
}

const emitFilterChange = () => {
  emit('filter-change', {
    filteredCount: isRemote.value ? remoteTotal.value : filteredRows.value.length
  })
}

/** 预览态没有适配器：用示例数据演示列与筛选，不发真实请求 */
const loadSample = () => {
  const sample = createSampleTicketRows()
  const matched = sample.filter(row => {
    if (keyword.value && !String(row.ticketNo).includes(keyword.value)) {
      return false
    }
    if (exceptionType.value && row.exceptionType !== exceptionType.value) {
      return false
    }
    if (status.value && row.status !== status.value) {
      return false
    }
    return true
  })
  remoteRows.value = matched.slice((page.value - 1) * props.pageSize, page.value * props.pageSize)
  remoteTotal.value = matched.length
  emitFilterChange()
}

const loadRemote = async () => {
  if (!adapter) {
    loadSample()
    return
  }
  const seq = ++requestSeq
  loading.value = true
  error.value = ''
  try {
    const result: BusinessListPageResult = await adapter({
      ticketNo: keyword.value || undefined,
      exceptionType: exceptionType.value || undefined,
      status: (status.value || undefined) as TicketExceptionStatus | undefined,
      onlyMine: onlyMine.value || undefined,
      pageNum: page.value,
      pageSize: props.pageSize
    })
    if (seq !== requestSeq) {
      return
    }
    remoteRows.value = result.items as unknown as BusinessListRow[]
    remoteTotal.value = result.total
    emitFilterChange()
  } catch (err: unknown) {
    if (seq !== requestSeq) {
      return
    }
    // 未登录时不展示业务记录，也不提示具体错误内容
    const message = err instanceof Error ? err.message : ''
    error.value = /401|登录/.test(message) ? '请先登录后查看业务记录' : '加载失败，请稍后重试'
    remoteRows.value = []
    remoteTotal.value = 0
    emitFilterChange()
  } finally {
    if (seq === requestSeq) {
      loading.value = false
    }
  }
}

const handleRowClick = (row: BusinessListRow) => {
  if (!isRemote.value) {
    return
  }
  emit('row-click', row)
  rowClickHandler?.(row as { id?: number | string })
}

/** 筛选变化回到第一页，并重新请求 */
watch([keyword, exceptionType, status, onlyMine], () => {
  if (!isRemote.value) {
    page.value = 1
    emitFilterChange()
    return
  }
  if (page.value === 1) {
    void loadRemote()
  } else {
    page.value = 1
  }
})

watch(page, () => {
  if (isRemote.value) {
    void loadRemote()
  }
})

watch(pageCount, value => {
  if (page.value > value) {
    page.value = value
  }
})

onMounted(() => {
  if (isRemote.value) {
    void loadRemote()
    return
  }
  emitFilterChange()
})
</script>

<style scoped>
.business-list-block {
  padding: 20px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}
.list-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}
.list-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 18px;
}
.list-header p {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.search-input {
  width: 180px;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: 13px;
}
.sample-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-bg-page);
  color: var(--color-text-secondary);
  font-size: 12px;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.filter-control {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  font: inherit;
  font-size: 13px;
}
.filter-check {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: var(--color-text-regular);
  font-size: 13px;
}
.retry-button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  cursor: pointer;
}
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-lighter);
  text-align: left;
  white-space: nowrap;
}
th {
  color: var(--color-text-regular);
  background: var(--color-bg-page);
}
.row-clickable {
  cursor: pointer;
}
.list-state {
  padding: 20px 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.list-error {
  color: var(--color-danger);
}
.empty-state {
  padding: 28px 0;
  text-align: center;
  color: var(--color-text-placeholder);
}
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: 13px;
}
.pagination button {
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  cursor: pointer;
}
.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>

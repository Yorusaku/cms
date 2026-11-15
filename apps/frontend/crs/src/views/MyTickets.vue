<template>
  <div class="my-tickets-page">
    <header class="my-tickets-nav">
      <button type="button" class="nav-back" @click="goHome">返回</button>
      <strong>我的记录</strong>
      <button type="button" class="nav-back" @click="router.push('/notifications')">消息</button>
      <button type="button" class="nav-back" @click="loadList">刷新</button>
    </header>

    <div class="view-tabs">
      <button
        v-for="view in VIEWS"
        :key="view.key"
        type="button"
        class="view-tab"
        :class="{ active: activeView === view.key }"
        :data-testid="`my-view-${view.key}`"
        @click="switchView(view.key)"
      >
        {{ view.label }}
      </button>
    </div>

    <select v-model="scenarioId" aria-label="业务场景" class="scenario-filter" @change="resetPage">
      <option value="">全部场景</option>
      <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">
        {{ scenario.name }}
      </option>
    </select>

    <div class="ticket-list">
      <p v-if="loading" class="state-text">加载中...</p>
      <p v-else-if="error" class="state-text">
        {{ error }}
        <button type="button" class="plain-button" @click="loadList">重试</button>
      </p>
      <p v-else-if="items.length === 0" class="state-text empty">暂无记录</p>
      <button
        v-for="item in items"
        v-else
        :key="item.id"
        type="button"
        class="ticket-row"
        :data-testid="`my-ticket-${item.id}`"
        @click="openDetail(item.id)"
      >
        <span class="ticket-no">{{ item.ticketNo }}</span>
        <span class="ticket-type">{{ item.exceptionType }}</span>
        <span class="ticket-status" :class="`status-${item.status}`">
          {{ TICKET_EXCEPTION_STATUS_LABELS[item.status] ?? item.status }}
        </span>
      </button>
    </div>
    <nav v-if="total > 0" class="ticket-pager" aria-label="记录分页">
      <button type="button" :disabled="loading || pageNum === 1" @click="changePage(-1)">
        上一页
      </button>
      <span
        >{{ pageNum }} / {{ Math.max(1, Math.ceil(total / pageSize)) }} · 共 {{ total }} 条</span
      >
      <button
        type="button"
        :disabled="loading || pageNum * pageSize >= total"
        @click="changePage(1)"
      >
        下一页
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  TICKET_EXCEPTION_STATUS_LABELS,
  type BusinessScenarioItem,
  type TicketExceptionItem,
  type TicketExceptionStatus
} from '@cms/types'
import { getBusinessScenarios } from '@/api/notification'
import { fetchTicketExceptionList } from '@/api/ticket-exception'
import { isLoggedIn } from '@/utils/auth'

defineOptions({ name: 'CrsMyTicketsView' })

/**
 * 个人待办与提交历史：待办来自业务状态（不新增任务表），
 * 「我的」身份由后端按登录态解析，页面不传用户名。
 */
const VIEWS = [
  { key: 'mineNeedsSupplement', label: '待我补充' },
  { key: 'mineSubmitted', label: '我的提交' }
] as const

type ViewKey = (typeof VIEWS)[number]['key']

const router = useRouter()
const activeView = ref<ViewKey>('mineNeedsSupplement')
const items = ref<TicketExceptionItem[]>([])
const loading = ref(false)
const error = ref('')
const scenarioId = ref('')
const scenarios = ref<BusinessScenarioItem[]>([])
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)
let requestSeq = 0

const loadList = async () => {
  const request = ++requestSeq
  if (!isLoggedIn()) {
    error.value = '请先登录后查看记录'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const response = await fetchTicketExceptionList({
      onlyMine: true,
      scenarioId: scenarioId.value || undefined,
      status:
        activeView.value === 'mineNeedsSupplement'
          ? ('needs_supplement' as TicketExceptionStatus)
          : undefined,
      pageNum: pageNum.value,
      pageSize
    })
    if (request !== requestSeq) return
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || '加载失败')
    }
    items.value = response.data.items
    total.value = response.data.total
  } catch (err: unknown) {
    if (request !== requestSeq) return
    error.value =
      err instanceof Error && /401|登录/.test(err.message)
        ? '登录已过期，请重新登录'
        : err instanceof Error && err.message
          ? err.message
          : '加载失败，请稍后重试'
    items.value = []
    total.value = 0
  } finally {
    if (request === requestSeq) loading.value = false
  }
}

const switchView = (key: ViewKey) => {
  activeView.value = key
  resetPage()
}

const resetPage = () => {
  pageNum.value = 1
  void loadList()
}

const changePage = (delta: number) => {
  pageNum.value += delta
  void loadList()
}

const openDetail = (id: number) => {
  void router.push({ path: '/ticketException', query: { id } })
}

const goHome = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.replace('/')
}

onMounted(() => {
  if (isLoggedIn()) {
    void getBusinessScenarios()
      .then(response => {
        if (response.code === 10000) scenarios.value = response.data ?? []
      })
      .catch(() => {
        error.value = '场景列表加载失败，请刷新重试'
      })
  }
  void loadList()
})
</script>

<style scoped>
.my-tickets-page {
  --design-vw: calc(min(100vw, 375px) / 100);
  min-height: 100vh;
  background: var(--color-bg-page, #f5f7fa);
  padding: 0 16px 24px;
  box-sizing: border-box;
}

.my-tickets-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 -16px 16px;
  padding: 12px 16px;
  background: #fff;
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

.view-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.view-tab {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text-regular, #4b5563);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.view-tab.active {
  border-color: var(--color-primary, #409eff);
  color: var(--color-primary, #409eff);
}

.ticket-row {
  display: flex;
  width: 100%;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-lighter, #ebeef5);
  border-radius: 10px;
  background: #fff;
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.ticket-no,
.ticket-type {
  min-width: 0;
  overflow-wrap: anywhere;
}
.ticket-status {
  flex-shrink: 0;
}
.scenario-filter {
  width: 100%;
  min-height: 36px;
  margin-bottom: 12px;
  font-size: 14px;
}
.ticket-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}
.ticket-pager button {
  padding: 8px;
}

.ticket-no {
  color: var(--color-text-primary, #1f2937);
  font-weight: 600;
}

.ticket-type {
  flex: 1;
  color: var(--color-text-secondary, #6b7280);
  font-size: 13px;
}

.ticket-status {
  font-size: 12px;
}

.status-pending {
  color: #b45309;
}

.status-needs_supplement {
  color: #b91c1c;
}

.status-resolved {
  color: #047857;
}

.state-text {
  padding: 32px 0;
  text-align: center;
  color: var(--color-text-secondary, #6b7280);
  font-size: 14px;
}

.empty {
  color: var(--color-text-placeholder, #9ca3af);
}

.plain-button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
</style>

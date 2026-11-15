<template>
  <div class="notifications-page">
    <header class="notifications-nav">
      <button type="button" class="nav-back" @click="goBack">返回</button>
      <strong>消息</strong>
      <button type="button" class="refresh-button" @click="loadList">刷新</button>
    </header>

    <div class="view-tabs">
      <button
        type="button"
        class="view-tab"
        :class="{ active: !onlyUnread }"
        @click="switchFilter(false)"
      >
        全部
      </button>
      <button
        type="button"
        class="view-tab"
        :class="{ active: onlyUnread }"
        data-testid="notifications-unread"
        @click="switchFilter(true)"
      >
        未读{{ unreadCount > 0 ? ` (${unreadCount})` : '' }}
      </button>
    </div>

    <select v-model="scenarioId" aria-label="业务场景" class="scenario-filter" @change="resetPage">
      <option value="">全部场景</option>
      <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">
        {{ scenario.name }}
      </option>
    </select>

    <p v-if="loading" class="state-text">加载中...</p>
    <p v-else-if="error" class="state-text">
      {{ error }}
      <button type="button" class="plain-button" @click="loadList">重试</button>
    </p>
    <p v-else-if="items.length === 0" class="state-text empty">暂无消息</p>

    <button
      v-for="item in items"
      v-else
      :key="item.id"
      type="button"
      class="notification-row"
      :class="{ unread: !item.read }"
      :data-testid="`notification-${item.id}`"
      @click="openTicket(item)"
    >
      <span class="notification-text">{{ renderText(item.type) }}</span>
      <span class="notification-time">{{ formatTime(item.createdAt) }}</span>
    </button>
    <nav v-if="total > 0" class="notification-pager" aria-label="消息分页">
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
  getNotificationList,
  getBusinessScenarios,
  markNotificationRead,
  type NotificationPage
} from '@/api/notification'
import type { BusinessScenarioItem } from '@cms/types'
import { isLoggedIn } from '@/utils/auth'

defineOptions({ name: 'CrsNotificationsView' })

const renderText = (type: string): string =>
  type === 'supplement_requested'
    ? '你的登记被要求补充，点此查看补充要求'
    : type === 'resolved'
      ? '你的登记已处理完成，点此查看处理结果'
      : `业务提醒（${type}）`

const router = useRouter()
const loading = ref(false)
const items = ref<NotificationPage['items']>([])
const unreadCount = ref(0)
const onlyUnread = ref(false)
const error = ref('')
const scenarios = ref<BusinessScenarioItem[]>([])
const scenarioId = ref('')
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)
let requestSeq = 0

const formatTime = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')} ${String(
        date.getHours()
      ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadList = async () => {
  const request = ++requestSeq
  if (!isLoggedIn()) {
    error.value = '请先登录后查看消息'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const response = await getNotificationList({
      onlyUnread: onlyUnread.value,
      scenarioId: scenarioId.value || undefined,
      pageNum: pageNum.value,
      pageSize
    })
    if (request !== requestSeq) return
    if (response.code !== 10000) {
      throw new Error(response.message || '加载失败')
    }
    items.value = response.data?.items ?? []
    unreadCount.value = response.data?.unreadCount ?? 0
    total.value = response.data?.total ?? 0
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

const switchFilter = (unread: boolean) => {
  onlyUnread.value = unread
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

/** 点击消息：标已读并进入本端记录详情；记录过时只显示当前状态 */
const openTicket = async (item: NotificationPage['items'][number]) => {
  if (!item.read) {
    await markNotificationRead(item.id)
  }
  await router.push({ path: '/ticketException', query: { id: item.exceptionId } })
}

const goBack = () => {
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
.notifications-page {
  --design-vw: calc(min(100vw, 375px) / 100);
  min-height: 100vh;
  background: var(--color-bg-page, #f5f7fa);
  padding: 0 16px 24px;
  box-sizing: border-box;
}

.scenario-filter {
  width: 100%;
  min-height: 36px;
  margin-bottom: 12px;
  font-size: 14px;
}
.notification-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}
.notification-pager button {
  padding: 8px;
}
.notification-text {
  overflow-wrap: anywhere;
}

.notifications-nav {
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

.refresh-button {
  margin-left: auto;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 12px;
  padding: 4px 10px;
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
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.view-tab.active {
  border-color: var(--color-primary, #409eff);
  color: var(--color-primary, #409eff);
}

.notification-row {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-lighter, #ebeef5);
  border-radius: 10px;
  background: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.notification-row.unread {
  border-left: 3px solid var(--color-primary, #409eff);
}

.notification-text {
  display: block;
  color: var(--color-text-primary, #1f2937);
  font-size: 14px;
}

.notification-row.unread .notification-text {
  font-weight: 600;
}

.notification-time {
  display: block;
  margin-top: 4px;
  color: var(--color-text-placeholder, #9ca3af);
  font-size: 12px;
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

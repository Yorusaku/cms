<template>
  <div class="notification-page">
    <header class="notification-header">
      <div>
        <h1 class="notification-title">站内提醒</h1>
        <p class="notification-subtitle">点击消息进入对应记录详情；已读不影响业务状态。</p>
      </div>
      <div class="header-actions">
        <el-select
          v-model="scenarioId"
          placeholder="全部场景"
          clearable
          filterable
          style="width: 180px"
          @change="handleFilterChange"
        >
          <el-option
            v-for="scenario in scenarios"
            :key="scenario.id"
            :label="scenario.name"
            :value="scenario.id"
          />
        </el-select>
        <el-switch v-model="onlyUnread" active-text="仅未读" @change="handleFilterChange" />
        <el-button :loading="loading" @click="loadList">刷新</el-button>
      </div>
    </header>

    <el-table v-loading="loading" :data="items" border stripe>
      <el-table-column label="内容" min-width="240">
        <template #default="{ row }">
          <span :class="{ unread: !row.read }">{{ renderText(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录 ID" width="90" align="center" prop="exceptionId" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.read ? 'info' : 'warning'" size="small">
            {{ row.read ? '已读' : '未读' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="190" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openTicket(row)">查看记录</el-button>
          <el-button v-if="!row.read" link @click="markRead(row)">标为已读</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="notification-pager">
      <el-pagination
        :current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { BusinessScenarioItem } from '@cms/types'
import { getBusinessScenarioList } from '@/api/scenario'
import { ElMessage } from 'element-plus'
import {
  getNotificationList,
  markNotificationRead,
  type NotificationPage
} from '@/api/notification'

/** 消息内容按类型渲染为纯文本，不暗示站外通知 */
const renderText = (type: string): string =>
  type === 'supplement_requested'
    ? '你的登记被要求补充，请查看补充要求'
    : type === 'resolved'
      ? '你的登记已处理完成，请查看处理结果'
      : `业务提醒（${type}）`

const router = useRouter()
const loading = ref(false)
const items = ref<NotificationPage['items']>([])
const total = ref(0)
const unreadCount = ref(0)
const onlyUnread = ref(false)
const pageNum = ref(1)
const pageSize = 20
const route = useRoute()
const scenarioId = ref(typeof route.query.scenarioId === 'string' ? route.query.scenarioId : '')
const scenarios = ref<BusinessScenarioItem[]>([])
let requestSeq = 0

const formatDateTime = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
        date.getMinutes()
      ).padStart(2, '0')}`
}

const loadList = async () => {
  const request = ++requestSeq
  loading.value = true
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
    total.value = response.data?.total ?? 0
    unreadCount.value = response.data?.unreadCount ?? 0
  } catch (error: unknown) {
    if (request !== requestSeq) return
    items.value = []
    total.value = 0
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    if (request === requestSeq) loading.value = false
  }
}

const handleFilterChange = () => {
  pageNum.value = 1
  void loadList()
}

const handlePageChange = (page: number) => {
  pageNum.value = page
  void loadList()
}

const markRead = async (row: NotificationPage['items'][number]) => {
  const response = await markNotificationRead(row.id)
  if (response.code === 10000) {
    await loadList()
  } else {
    ElMessage.error(response.message || '操作失败')
  }
}

/** 点击消息进入记录详情抽屉；记录过时只显示当前状态 */
const openTicket = async (row: NotificationPage['items'][number]) => {
  if (!row.read) {
    await markNotificationRead(row.id)
  }
  await router.push({ path: '/ticket-exception', query: { recordId: row.exceptionId } })
}

onMounted(() => {
  void getBusinessScenarioList()
    .then(response => {
      if (response.code === 10000) scenarios.value = response.data ?? []
    })
    .catch(() => ElMessage.error('场景列表加载失败，请刷新重试'))
  void loadList()
})
</script>

<style scoped>
.notification-page {
  padding: 24px;
  min-height: 100vh;
  background: var(--color-bg-page, #f5f7fa);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.notification-title {
  margin: 0;
  font-size: 20px;
  color: var(--color-text-primary, #1f2937);
}

.notification-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary, #6b7280);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 1280px) {
  .notification-header {
    flex-wrap: wrap;
    gap: 12px;
  }
}

.notification-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.unread {
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}
</style>

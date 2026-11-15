<template>
  <div class="page-container">
    <div
      v-if="loading"
      class="loading-overlay flex items-center justify-center min-h-screen bg-white"
    >
      <div class="text-center">
        <Loading type="spinner" color="#1989fa" size="40px" class="mb-4" />
        <p class="text-gray-600 text-lg">页面加载中...</p>
        <p class="text-gray-400 text-sm mt-2">正在获取页面数据</p>
      </div>
    </div>

    <div
      v-else-if="error"
      class="error-overlay flex items-center justify-center min-h-screen bg-gray-50"
    >
      <Empty :description="errorMessage" image="error" class="w-full max-w-md px-4">
        <template #bottom>
          <Button class="mt-4" type="primary" @click="retryLoad"> 重新加载 </Button>
        </template>
      </Empty>
    </div>

    <div v-else class="page-content" :style="{ backgroundColor: pageBackgroundColor }">
      <!-- 轻量业务导航：不覆盖表单，不做悬浮工具栏 -->
      <nav
        class="business-nav"
        :class="{ 'layout-business': pageStore.pageSchema.pageConfig?.layoutMode === 'business' }"
      >
        <button type="button" data-testid="nav-my-tickets" @click="router.push('/myTickets')">
          我的记录
        </button>
        <button
          type="button"
          data-testid="nav-notifications"
          @click="router.push('/notifications')"
        >
          消息
        </button>
      </nav>
      <SchemaRenderer
        :page-schema="pageStore.pageSchema"
        :page-id="pageId ?? undefined"
        :published-version-id="publishedVersionId"
      />
    </div>

    <!-- 内嵌登录：不切换路由，页面与已填内容都保留 -->
    <div v-if="showLogin" class="login-overlay layout-business" data-testid="inline-login">
      <div class="login-panel">
        <div class="login-panel-head">
          <strong>登录后继续提交</strong>
          <button type="button" class="login-close" @click="showLogin = false">关闭</button>
        </div>
        <p class="login-panel-tip">登录只改变身份，已填写的内容不会丢失，也不会自动提交。</p>
        <LoginForm @success="handleLoginSuccess" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, Empty, Button } from 'vant'
import { migrateSchema } from '@cms/utils'
import { normalizePageSchemaMaterials } from '@cms/ui'
import { getPageDataById, parsePageSchema, type PageSchema } from '@/api/page'
import { fetchTicketExceptionList } from '@/api/ticket-exception'
import { isLoggedIn } from '@/utils/auth'
import { BUSINESS_DATA_ADAPTER_KEY, BUSINESS_ROW_CLICK_KEY } from '@cms/ui'
import SchemaRenderer from '@/components/SchemaRenderer.vue'
import LoginForm from '@/components/LoginForm.vue'
import { usePageStore } from '@/store/usePageStore'
import { getMarketingContext, trackEvent } from '@/utils/tracking'

defineOptions({
  name: 'CrsPageView'
})

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()

/**
 * 业务列表的运行时适配器：只有正式发布页才注入真实请求，
 * 预览页不注入，物料回落示例数据（预览不能读业务记录）。
 */
provide(BUSINESS_DATA_ADAPTER_KEY, async (query: Record<string, unknown>) => {
  // 未登录不发请求：避免 401 触发全局跳登录，把整个页面踢走
  if (!isLoggedIn()) {
    throw new Error('未登录，无法查看业务记录')
  }
  // 场景范围由发布快照决定，不信任用户可编辑的查询输入：
  // 有绑定按场景查询；旧快照未绑定回退为当前页面维度
  const binding =
    typeof pageStore.pageSchema.pageConfig?.businessScenarioId === 'string'
      ? pageStore.pageSchema.pageConfig.businessScenarioId
      : ''
  const scopedQuery = {
    ...query,
    scenarioId: binding || undefined,
    pageId: binding ? undefined : (pageId.value ?? undefined)
  }
  const response = await fetchTicketExceptionList(scopedQuery as never)
  if (response.code !== 10000 || !response.data) {
    throw new Error(response.message || '加载失败')
  }
  return response.data
})

provide(BUSINESS_ROW_CLICK_KEY, (row: { id?: number | string }) => {
  const id = Number(row.id)
  if (Number.isFinite(id) && id > 0) {
    void router.push({ path: '/ticketException', query: { id } })
  }
})

/**
 * 表单未登录：在当前页内嵌登录，不切路由（页面渲染层在 Suspense 内，
 * 同页卸载异步组件会触发 Vue 的 vnode 断言错误）。
 * 登录只改变身份，页面与已填内容都保留，用户可继续提交。
 */
const showLogin = ref(false)
provide('businessRequireLogin', () => {
  showLogin.value = true
})

provide('businessOpenRecord', (id: number) => {
  void router.push({ path: '/ticketException', query: { id } })
})

provide('businessOpenRecord', (id: number) => {
  void router.push({ path: '/ticketException', query: { id } })
})

const handleLoginSuccess = () => {
  showLogin.value = false
}

const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const publishedVersionId = ref('')

const pageId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})

const pageBackgroundColor = computed(() => {
  const bgColor = pageStore.pageSchema.pageConfig?.backgroundColor
  return typeof bgColor === 'string' ? bgColor : '#ffffff'
})

let pageRequest = 0
const loadPageData = async () => {
  const request = ++pageRequest
  const id = pageId.value
  showLogin.value = false
  if (!id) {
    error.value = true
    errorMessage.value = '页面ID不存在，请检查URL参数'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = false
    errorMessage.value = ''

    const response = await getPageDataById(id)
    if (request !== pageRequest) return

    if (response.code !== 10000) {
      throw new Error(response.message || `获取页面数据失败 (code: ${response.code})`)
    }

    if (!response.data) {
      throw new Error('页面数据为空')
    }

    const pageData = response.data as unknown as {
      schema: string | Record<string, unknown>
      publishedVersionId: string
      [key: string]: unknown
    }
    const rawSchema = pageData.schema
      ? parsePageSchema(pageData.schema as string | PageSchema)
      : pageData
    const schema = normalizePageSchemaMaterials(migrateSchema(rawSchema))
    publishedVersionId.value = pageData.publishedVersionId

    pageStore.importPageSchema(schema)

    const pageTitle =
      typeof schema.pageConfig?.name === 'string' ? schema.pageConfig.name : '移动端页面'
    document.title = pageTitle

    const marketing = getMarketingContext()
    await trackEvent({
      eventType: 'page_view',
      pageId: id,
      publishedVersionId: publishedVersionId.value,
      payload: {
        source: 'crs_page',
        title: pageTitle
      },
      utm: marketing.utm,
      channel: marketing.channel
    })
  } catch (err: unknown) {
    if (request !== pageRequest) return
    error.value = true
    const errorObj = err as Error
    errorMessage.value = errorObj.message || '页面加载失败，请稍后重试'
  } finally {
    if (request === pageRequest) loading.value = false
  }
}

const retryLoad = () => {
  loadPageData()
}

watch(
  pageId,
  () => {
    void loadPageData()
  },
  { immediate: true }
)
</script>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: white;
}

.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: #f5f5f5;
}

.page-content {
  width: 100%;
  min-height: 100vh;
}

.business-nav {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 10px 16px 0;
  max-width: 1120px;
  margin: 0 auto;
}

.business-nav button {
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text-regular, #4b5563);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  background: rgba(15, 23, 42, 0.45);
  overflow: auto;
}

.layout-business.business-nav {
  --design-vw: calc(min(100vw, 375px) / 100);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 10px 16px 0;
  max-width: 1120px;
  margin: 0 auto;
}

.business-nav button {
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text-regular, #4b5563);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.login-overlay {
  /* 弹窗在页面容器之外，同样要固定字号基准，避免桌面上被放大 */
  --design-vw: calc(min(100vw, 375px) / 100);
}

.login-panel {
  width: 100%;
  max-width: 420px;
  padding: 20px 16px;
  border-radius: 12px;
  background: #fff;
}

.login-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-primary, #1f2937);
  font-size: 16px;
}

.login-close {
  border: 0;
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.login-panel-tip {
  margin: 8px 0 16px;
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
  line-height: 1.5;
}
</style>

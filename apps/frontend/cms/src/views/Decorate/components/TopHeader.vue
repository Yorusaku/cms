<template>
  <div class="page-head">
    <a class="go-back" @click="backToList">
      <img class="logo" src="@/assets/img/layout/logo.png" />
      返回页面列表
    </a>
    <div class="page-operate">
      <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
        <el-button
          size="default"
          aria-label="撤销"
          :disabled="!canEdit || !pageStore.canUndo"
          @click="handleUndo"
        >
          <el-icon><RefreshLeft /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="重做 (Ctrl+Y)" placement="bottom">
        <el-button
          size="default"
          aria-label="重做"
          :disabled="!canEdit || !pageStore.canRedo"
          @click="handleRedo"
        >
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </el-tooltip>
      <el-divider direction="vertical" />
      <el-button
        v-if="canEdit"
        type="default"
        size="default"
        :loading="saveLoading"
        @click="saveDraft"
      >
        保存草稿
      </el-button>
      <el-button
        v-if="canEdit"
        type="primary"
        size="default"
        :loading="publishLoading"
        @click="submitReview"
      >
        提交审核
      </el-button>
      <el-button size="default" :loading="previewLoading" @click="saveAndPreview">预览</el-button>
      <el-button size="default" @click="openPublishLogs">发布记录</el-button>
    </div>

    <!-- 结构化问题面板：替代此前的 HTML 字符串拼装 -->
    <PageCheckDialog
      v-model="checkDialogVisible"
      :mode="checkMode"
      :issues="checkIssues"
      :error-count="checkErrorCount"
      :warning-count="checkWarningCount"
      @locate="locateIssue"
      @continue="handleCheckContinue"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { RefreshLeft, RefreshRight } from '@element-plus/icons-vue'
import { useEventListener } from '@vueuse/core'
import { usePageStore } from '@/store/usePageStore'
import PageCheckDialog from '@/components/PageCheckDialog.vue'
import { saveCmsPage, submitPageReview, type SavePageParams } from '@/api/activity'
import { migrateSchemaToV1 } from '@cms/utils'
import { runPagePreflight, type PreflightIssue } from '@/utils/page-preflight'
import { clearPageDraft } from '@/utils/page-draft'
import { markPageDraft } from '@/utils/page-publish'
import { trackEvent } from '@/utils/tracking'
import { getEffectiveRole } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()

/** 装修页写操作（撤销/重做/保存草稿/提交审核）限管理员与编辑员；观察员只读 */
const canEdit = computed(() => ['admin', 'editor'].includes(getEffectiveRole()))

const saveLoading = ref(false)
const previewLoading = ref(false)
const publishLoading = ref(false)

/**
 * 页面检查的三种模式（规则来自 @cms/types，与后端一致）：
 * - draft：保存草稿不拦截（不调用本函数）；
 * - preview：有问题只提醒，用户确认后仍可预览；
 * - submit：有阻断级问题即停止提交（warning 不阻断）。
 */
const checkDialogVisible = ref(false)
const checkMode = ref<'preview' | 'submit'>('submit')
const checkIssues = ref<PreflightIssue[]>([])
const checkErrorCount = ref(0)
const checkWarningCount = ref(0)
let checkResolver: ((value: boolean) => void) | null = null

const runPreflight = (mode: 'preview' | 'submit'): Promise<boolean> => {
  const result = runPagePreflight(pageStore.exportPageSchema())

  // 完全干净：直接通过
  if (result.issues.length === 0) {
    return Promise.resolve(true)
  }
  // 提交审核只在有 error 时阻断；warning 属建议，不拦提交流程
  if (mode === 'submit' && result.ok) {
    return Promise.resolve(true)
  }

  checkMode.value = mode
  checkIssues.value = result.issues
  checkErrorCount.value = result.errorCount
  checkWarningCount.value = result.warningCount
  checkDialogVisible.value = true

  return new Promise<boolean>(resolve => {
    checkResolver = value => {
      // 提交模式：面板只能关闭，视为未通过；预览模式：用户选择「仍然预览」才继续
      resolve(mode === 'submit' ? false : value)
    }
  })
}

/** 定位到问题组件：选中并滚动到画布对应位置 */
const locateIssue = async (componentId: string) => {
  pageStore.setActiveId(componentId)
  await nextTick()
  const target = document.querySelector(`[data-component-id="${CSS.escape(componentId)}"]`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const handleCheckContinue = () => {
  const resolve = checkResolver
  checkResolver = null
  resolve?.(true)
}

// 面板被关闭（右上角 / 取消按钮 / 遮罩外）：按未通过处理
watch(checkDialogVisible, visible => {
  if (visible || !checkResolver) {
    return
  }
  const resolve = checkResolver
  checkResolver = null
  resolve(false)
})

const handleUndo = () => {
  if (pageStore.canUndo) {
    pageStore.undo()
  }
}

const handleRedo = () => {
  if (pageStore.canRedo) {
    pageStore.redo()
  }
}

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    handleRedo()
  }
})

interface SavePageResponse {
  data?: {
    id?: string | number
  }
}

const getCurrentPageId = (response?: SavePageResponse) => {
  const id = Number(response?.data?.id || route.query.id || 0)
  return Number.isFinite(id) && id > 0 ? id : null
}

const saveAndPreview = async () => {
  previewLoading.value = true
  try {
    const preflightPassed = await runPreflight('preview')
    if (!preflightPassed) {
      return
    }

    const response = (await savePage()) as SavePageResponse
    const pageId = getCurrentPageId(response)
    if (pageId) {
      openPreview(pageId)
    }
    ElMessage.success('草稿已保存并打开预览')
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    ElMessage.warning(`预览失败: ${errorMessage}`)
  } finally {
    previewLoading.value = false
  }
}

const submitReview = async () => {
  publishLoading.value = true
  try {
    const preflightPassed = await runPreflight('submit')
    if (!preflightPassed) {
      return
    }

    const response = (await savePage()) as SavePageResponse
    const pageId = getCurrentPageId(response)
    if (pageId) {
      await submitPageReview({ pageId })
    }
    ElMessage.success('已提交审核')
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    ElMessage.warning(`提交审核失败: ${errorMessage}`)
  } finally {
    publishLoading.value = false
  }
}

const saveDraft = async () => {
  saveLoading.value = true
  try {
    const response = (await savePage()) as SavePageResponse
    const pageId = getCurrentPageId(response)
    if (pageId) {
      markPageDraft(pageId)
      await trackEvent({
        eventType: 'cta_click',
        pageId,
        ctaText: 'save_draft'
      })
    }
    ElMessage.success('草稿保存成功')
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    ElMessage.warning(`保存失败: ${errorMessage}`)
  } finally {
    saveLoading.value = false
  }
}

const openPublishLogs = () => {
  const pageId = Number(route.query.id || 0)
  if (!Number.isFinite(pageId) || pageId <= 0) {
    ElMessage.info('请先保存页面后再查看发布记录')
    return
  }
  router.push({ path: '/activity', query: { publishLogsPageId: pageId } })
}

const openPreview = (id: number) => {
  const urlObj = router.resolve({
    path: '/preview',
    query: { id }
  })
  window.open(urlObj.href, '_blank')
}

const backToList = () => {
  try {
    const isParentActivityPage = window.opener && window.opener.location.hash === '#/activity'
    if (isParentActivityPage) {
      window.opener.close()
    }
    router.push('/activity')
  } catch {
    router.push('/activity')
  }
}

const savePage = async () => {
  const pageSchema = pageStore.exportPageSchema()
  const legacyComponentList = migrateSchemaToV1(pageSchema).components.map((component, index) => ({
    id: component.id,
    sort: index,
    data: {
      component: component.type,
      ...(component.props as Record<string, unknown>)
    },
    styles: component.styles ?? {}
  }))

  const pageData: SavePageParams = {
    name: ((pageSchema.pageConfig as Record<string, unknown>)?.name as string) || '',
    schema: pageSchema,
    ...(pageSchema.pageConfig as Record<string, unknown>),
    componentList: legacyComponentList
  }

  if (route.query.id) {
    pageData.id = Number(route.query.id)
  }

  const resp = await saveCmsPage(pageData)

  const createdId = (resp as SavePageResponse)?.data?.id
  if (createdId) {
    setIdForAddSave(createdId)
  }

  const currentId = Number(createdId || route.query.id || 0)
  clearPageDraft(null)
  if (Number.isFinite(currentId) && currentId > 0) {
    clearPageDraft(currentId)
  }

  return resp
}

const setIdForAddSave = (id: string | number) => {
  router.push(`/decorate?id=${id}`)
  pageStore.setPageConfig({ id })
}
</script>

<style scoped>
.page-head {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
}

.go-back {
  float: left;
  line-height: 55px;
  font-size: 14px;
  color: #4f4f4f;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.go-back .logo {
  display: inline-block;
  vertical-align: middle;
  margin: -2px 4px 0 0;
  max-width: 30px;
  max-height: 30px;
}

.page-operate {
  display: flex;
  gap: 12px;
}
</style>

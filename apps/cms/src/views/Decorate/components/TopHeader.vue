<template>
  <div class="page-head">
    <a class="go-back" @click="backToList">
      <img class="logo" src="@/assets/img/layout/logo.png" />
      返回频道列表页面
    </a>
    <div class="page-operate">
      <el-button type="primary" size="default" :loading="saveLoading" @click="saveAndContinue">
        保存
      </el-button>
      <el-button size="default" :loading="previewLoading" @click="saveAndView"> 预览 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePageStore } from '@/store/usePageStore'
import { saveCmsPage, type SavePageParams } from '@/api/activity'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()

const saveLoading = ref(false)
const previewLoading = ref(false)

interface SavePageResponse {
  data?: {
    id?: string | number
  }
}

const saveAndView = async () => {
  previewLoading.value = true
  try {
    const res = await savePage({ online: 1 })
    ElMessage.success('上架成功')
    let id = (res as SavePageResponse)?.data?.id || ''
    if (!id) {
      id = route.query.id as string
    }
    goToView(id)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    ElMessage.warning(`上架并预览失败: ${errorMessage}`)
  } finally {
    previewLoading.value = false
  }
}

const goToView = (id: string | number) => {
  const urlObj = router.resolve({
    path: '/preview',
    query: { id }
  })
  window.open(urlObj.href, '_blank')
}

const saveAndContinue = async () => {
  saveLoading.value = true
  try {
    await savePage()
    ElMessage.success('保存成功')
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    ElMessage.warning(`保存失败: ${errorMessage}`)
  } finally {
    saveLoading.value = false
  }
}

const backToList = () => {
  try {
    const isParentActivityPage = window.opener && window.opener.location.hash === '#/activity'
    if (isParentActivityPage) {
      window.opener.close()
    }
    router.push('/activity')
  } catch (e) {
    router.push('/activity')
  }
}

const savePage = async (params?: Record<string, unknown>) => {
  const pageSchema = pageStore.exportPageSchema()
  const pageData: SavePageParams = {
    name: ((pageSchema.pageConfig as Record<string, unknown>)?.name as string) || '',
    schema: pageSchema,
    ...(pageSchema.pageConfig as Record<string, unknown>),
    componentList: pageSchema.components,
    ...params
  }

  if (route.query.id) {
    pageData.id = Number(route.query.id)
  }

  ;(pageData.componentList as Array<Record<string, unknown>>)?.forEach((item, index: number) => {
    item.sort = index
  })

  const resp = await saveCmsPage(pageData)

  if ((resp as SavePageResponse)?.data?.id) {
    setIdForAddSave((resp as SavePageResponse).data!.id!)
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

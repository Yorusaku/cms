<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">活动页面管理</h1>
        <p class="text-gray-600 mt-1">管理您的活动页面内容</p>
      </div>

      <!-- 搜索区域 -->
      <el-card class="mb-6 shadow-none border border-gray-200">
        <el-form :model="searchForm" inline class="w-full">
          <el-form-item label="页面标题">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入页面标题"
              clearable
              class="w-64"
            />
          </el-form-item>
          <el-form-item label="页面状态">
            <el-select
              v-model="searchForm.isAbled"
              placeholder="请选择页面状态"
              clearable
              class="w-32"
            >
              <el-option label="下线" :value="0" />
              <el-option label="上线" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 操作按钮区域 -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增页面
          </el-button>
        </div>
        <div class="text-sm text-gray-500">共 {{ pagination.total }} 条记录</div>
      </div>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="tableData" border stripe class="w-full">
        <el-table-column prop="id" label="页面ID" width="100" align="center" />
        <el-table-column prop="name" label="页面标题" min-width="200" />
        <el-table-column prop="status" label="页面状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isAbled === 1 ? 'success' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" align="center" />
        <el-table-column prop="update_time" label="更新时间" width="180" align="center" />
        <el-table-column label="操作" fixed="right" width="280" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row.id)"> 装修 </el-button>
            <el-button
              type="success"
              size="small"
              :loading="row.loading"
              @click="handleToggleActivity(row)"
            >
              {{ row.isAbled === 0 ? '上线' : '下线' }}
            </el-button>
            <el-button type="info" size="small" @click="handlePreview(row.id)"> 预览 </el-button>
            <el-popconfirm title="确定要删除这个页面吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" size="small"> 删除 </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="mt-6 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getCmsPageList, updateStatus, deletePage } from '../api/activity'
import { usePageStore } from '../store/usePageStore'

const router = useRouter()
const pageStore = usePageStore()

// 搜索表单
const searchForm = reactive({
  name: '',
  isAbled: undefined as number | undefined
})

// 表格数据
const tableData = ref<any[]>([])
const loading = ref(false)

// 分页配置
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 获取表格数据
const getTableData = async () => {
  loading.value = true
  try {
    const params = {
      name: searchForm.name || undefined,
      isAbled:
        searchForm.isAbled !== null && searchForm.isAbled !== undefined
          ? searchForm.isAbled
          : undefined,
      pageNum: Number(pagination.current),
      pageSize: Number(pagination.size)
    }

    const res: any = await getCmsPageList(params)

    console.log('=== API调用调试信息 ===')
    console.log('请求参数:', params)
    console.log('API响应原始数据:', res)
    console.log('响应类型:', typeof res)
    console.log('响应结构:', Object.keys(res || {}))

    if (res && res.data) {
      console.log('data字段类型:', typeof res.data)
      console.log('data字段结构:', Object.keys(res.data))
      console.log('data是否为数组:', Array.isArray(res.data))
      if (!Array.isArray(res.data) && res.data.data) {
        console.log('data.data类型:', typeof res.data.data)
        console.log('data.data是否为数组:', Array.isArray(res.data.data))
      }
    }

    // 处理API响应数据结构 - 根据实际数据结构调整
    let list: any[] = []
    let total = 0

    if (res) {
      console.log('解析响应数据结构...')

      // 实际情况: { code: 10000, data: { list: [...], total: 208 } }
      if (res.code === 10000 && res.data && Array.isArray(res.data.list)) {
        list = res.data.list
        total = res.data.total || res.data.list.length
        console.log('✅ 匹配成功 - code=10000包装结构:', { listLength: list.length, total })
      }
      // 备用情况1: { code: 0, data: [...] }
      else if (res.code === 0 && Array.isArray(res.data)) {
        list = res.data
        total = res.total || res.data.length
        console.log('✅ 匹配备用1 - code=0数组:', { listLength: list.length, total })
      }
      // 备用情况2: { data: [...] }
      else if (res.data && Array.isArray(res.data)) {
        list = res.data
        total = res.total || res.data.length
        console.log('✅ 匹配备用2 - data数组:', { listLength: list.length, total })
      }
      // 备用情况3: { data: { data: [...], total: 10 } }
      else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        list = res.data.data
        total = res.data.total || res.data.data.length
        console.log('✅ 匹配备用3 - 嵌套data:', { listLength: list.length, total })
      }
      // 备用情况4: 直接数组
      else if (Array.isArray(res)) {
        list = res
        total = res.length
        console.log('✅ 匹配备用4 - 直接数组:', { listLength: list.length, total })
      } else {
        console.warn('❌ 无法识别的数据结构:')
        console.warn('响应类型:', typeof res)
        console.warn('响应内容:', JSON.stringify(res, null, 2))
        if (res && res.data) {
          console.warn('data类型:', typeof res.data)
          console.warn('data结构:', Object.keys(res.data))
        }
        list = []
        total = 0
      }
    }

    console.log('最终处理结果:', { list, total, pagination: pagination.total })

    pagination.total = total
    const processedList = list.map((item: any) => ({
      ...item,
      status: item.isAbled === 1 ? '上线' : '下线',
      loading: false
    }))
    tableData.value = processedList
    console.log('表格数据更新:', processedList)
  } catch (error: any) {
    console.error('获取列表数据失败:', error)
    // 更好的错误处理
    let errorMessage = '获取列表数据失败'
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    ElMessage.error(errorMessage)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  getTableData()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.isAbled = undefined
  pagination.current = 1
  getTableData()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  getTableData()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.current = page
  getTableData()
}

// 编辑/装修页面
const handleEdit = (id: number) => {
  // 在新标签页中打开装修页面，保留当前活动列表页面
  const routeData = router.resolve({ path: '/decorate', query: { id } })
  window.open(routeData.href, '_blank')
}

// 上线下线操作
const handleToggleActivity = async (row: any) => {
  const isAbled = row.isAbled === 0 ? 1 : 0
  const action = isAbled === 1 ? '上线' : '下线'
  const actionText = isAbled === 1 ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确定要${actionText}页面【${row.name}】吗？`, '操作确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    row.loading = true
    const updateResult: any = await updateStatus({ id: row.id, isAbled })
    console.log('=== 更新状态接口调试 ===')
    console.log('更新响应:', updateResult)
    ElMessage.success(`${action}成功`)
    await getTableData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(`${action}失败:`, error)
      ElMessage.error(error?.message || `${action}失败`)
    }
  } finally {
    row.loading = false
  }
}

// 删除页面
const handleDelete = async (id: number) => {
  try {
    const deleteResult: any = await deletePage({ id })
    console.log('=== 删除接口调试 ===')
    console.log('删除响应:', deleteResult)
    ElMessage.success('删除成功')
    await getTableData()
  } catch (error: any) {
    console.error('删除失败:', error)
    ElMessage.error(error?.message || '删除失败')
  }
}

// 新增页面
const handleAdd = () => {
  pageStore.setInitPageSchema()
  router.push('/decorate')
}

// 预览页面
const handlePreview = (id: number) => {
  const url = router.resolve({
    path: '/preview',
    query: { id }
  })
  window.open(url.href, '_blank')
}

// 页面加载时获取数据
onMounted(() => {
  getTableData()
})
</script>

<style scoped>
/* 使用Tailwind CSS原子类，无需额外样式 */
</style>

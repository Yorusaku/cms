<template>
  <div class="min-h-screen bg-gray-100 p-5">
    <div class="bg-white rounded-lg p-5 mb-5 flex justify-between items-start">
      <el-form :inline="true" :model="searchForm" class="m-0">
        <el-form-item label="页面标题">
          <el-input v-model="searchForm.name" placeholder="请输入页面标题" clearable />
        </el-form-item>
        <el-form-item label="页面状态">
          <el-select v-model="searchForm.isAbled" placeholder="请选择" clearable>
            <el-option label="下线" :value="0" />
            <el-option label="上线" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="flex gap-2">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增页面
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-lg p-5">
      <el-table v-loading="loading" :data="tableData.list" style="width: 100%">
        <el-table-column prop="id" label="页面ID" width="100" />
        <el-table-column prop="name" label="页面标题" min-width="200" />
        <el-table-column prop="status" label="页面状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isAbled === 1 ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column prop="update_time" label="更新时间" width="180" />
        <el-table-column label="操作" fixed="right" width="400">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row.id)">装修</el-button>
            <el-button
              :type="row.isAbled === 0 ? 'success' : 'warning'"
              link
              size="small"
              @click="handleToggleActivity(row)"
            >
              {{ row.isAbled === 0 ? '上线' : '下线' }}
            </el-button>
            <el-button type="info" link size="small" @click="handlePreview(row.id)">预览</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-5 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
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
import { Plus } from '@element-plus/icons-vue'
import { usePageStore } from '../store/usePageStore'

const router = useRouter()
const pageStore = usePageStore()
const loading = ref(false)

const searchForm = reactive({
  name: '',
  isAbled: ''
})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

interface TableItem {
  id: number
  name: string
  isAbled: number
  status: string
  create_time: string
  update_time: string
}

const tableData = ref({
  list: [] as TableItem[]
})

const mockData = [
  {
    id: 1,
    name: '双十一活动页',
    isAbled: 1,
    status: '上线',
    create_time: '2024-01-01 10:00:00',
    update_time: '2024-01-15 14:30:00'
  },
  {
    id: 2,
    name: '新年特惠活动',
    isAbled: 0,
    status: '下线',
    create_time: '2024-01-20 09:00:00',
    update_time: '2024-02-01 16:00:00'
  }
]

const getTableData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value.list = mockData.map(item => ({
      ...item,
      status: item.isAbled === 1 ? '上线' : '下线'
    }))
    pagination.total = mockData.length
    loading.value = false
  }, 500)
}

const handleSearch = () => {
  pagination.current = 1
  getTableData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.isAbled = ''
  handleSearch()
}

const handleAdd = () => {
  pageStore.setInitPageSchema()
  router.push('/decorate')
}

const handleEdit = (id: number) => {
  router.push({ path: '/decorate', query: { id } })
}

const handleToggleActivity = (row: any) => {
  const action = row.isAbled === 0 ? '上线' : '下线'
  ElMessageBox.confirm(`是否确定${action}活动【${row.name}】?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      row.isAbled = row.isAbled === 0 ? 1 : 0
      row.status = row.isAbled === 1 ? '上线' : '下线'
      ElMessage.success(`${action}成功`)
    })
    .catch(() => {})
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm('是否确定删除?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = tableData.value.list.findIndex((item: any) => item.id === id)
      if (index > -1) {
        tableData.value.list.splice(index, 1)
        pagination.total--
      }
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

const handlePreview = (id: number) => {
  window.open(`/preview?id=${id}`, '_blank')
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  getTableData()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  getTableData()
}

onMounted(() => {
  getTableData()
})
</script>

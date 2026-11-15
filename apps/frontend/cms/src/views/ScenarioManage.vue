<template>
  <div class="scenario-page">
    <header class="scenario-header">
      <div>
        <h1 class="scenario-title">业务场景</h1>
        <p class="scenario-subtitle">场景组织票据异常记录与页面；改名不影响已登记记录的归属。</p>
      </div>
      <el-button v-if="canEdit" type="primary" @click="openCreate">新建场景</el-button>
    </header>

    <el-table v-loading="loading" :data="items" border stripe>
      <el-table-column prop="name" label="场景名称" min-width="160" />
      <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column v-if="canEdit" label="操作" width="90" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑场景' : '新建场景'" width="420px">
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="80" placeholder="场景名称" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="300" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { BusinessScenarioItem } from '@cms/types'
import { hasAnyRole } from '@/utils/auth'
import {
  createBusinessScenario,
  getBusinessScenarioList,
  updateBusinessScenario
} from '@/api/scenario'

const loading = ref(false)
const canEdit = hasAnyRole(['admin', 'editor'])
const items = ref<BusinessScenarioItem[]>([])
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', description: '' })

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
  loading.value = true
  try {
    const response = await getBusinessScenarioList()
    if (response.code !== 10000) {
      throw new Error(response.message || '加载失败')
    }
    items.value = response.data ?? []
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

const openEdit = (row: BusinessScenarioItem) => {
  editingId.value = row.id
  form.name = row.name
  form.description = row.description
  dialogVisible.value = true
}

const submit = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('请填写场景名称')
    return
  }
  saving.value = true
  try {
    const response = editingId.value
      ? await updateBusinessScenario({
          id: editingId.value,
          name: form.name.trim(),
          description: form.description.trim()
        })
      : await createBusinessScenario({
          name: form.name.trim(),
          description: form.description.trim()
        })
    if (response.code !== 10000) {
      throw new Error(response.message || '保存失败')
    }
    ElMessage.success('已保存')
    dialogVisible.value = false
    await loadList()
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadList()
})
</script>

<style scoped>
.scenario-page {
  padding: 24px;
  min-height: 100vh;
  background: var(--color-bg-page, #f5f7fa);
}

.scenario-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.scenario-title {
  margin: 0;
  font-size: 20px;
  color: var(--color-text-primary, #1f2937);
}

.scenario-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary, #6b7280);
}
</style>

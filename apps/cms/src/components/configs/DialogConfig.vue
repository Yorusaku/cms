<template>
  <div class="dialog-config space-y-6 p-4">
    <!-- 基础配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        基础配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="标题" class="mb-0">
          <el-input
            v-model="draftProps.title"
            placeholder="请输入对话框标题"
            clearable
            @change="handleUpdate"
          />
        </el-form-item>

        <el-form-item label="内容" class="mb-0">
          <el-input
            v-model="draftProps.content"
            type="textarea"
            :rows="3"
            placeholder="请输入对话框内容"
            @change="handleUpdate"
          />
        </el-form-item>

        <el-form-item label="显示状态" class="mb-0">
          <el-switch
            v-model="draftProps.visible"
            active-text="显示"
            inactive-text="隐藏"
            @change="handleUpdate"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- 按钮配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        按钮配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="显示操作按钮" class="mb-0">
          <el-switch
            v-model="draftProps.showActions"
            active-text="显示"
            inactive-text="隐藏"
            @change="handleUpdate"
          />
        </el-form-item>

        <el-form-item v-if="draftProps.showActions" label="显示取消按钮" class="mb-0">
          <el-switch
            v-model="draftProps.showCancel"
            active-text="显示"
            inactive-text="隐藏"
            @change="handleUpdate"
          />
        </el-form-item>

        <el-form-item
          v-if="draftProps.showActions && draftProps.showCancel"
          label="取消按钮文本"
          class="mb-0"
        >
          <el-input
            v-model="draftProps.cancelText"
            placeholder="取消按钮文本"
            @change="handleUpdate"
          />
        </el-form-item>

        <el-form-item v-if="draftProps.showActions" label="确认按钮文本" class="mb-0">
          <el-input
            v-model="draftProps.confirmText"
            placeholder="确认按钮文本"
            @change="handleUpdate"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- 样式配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        样式配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="背景颜色" class="mb-0">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="draftProps.backgroundColor" @change="handleUpdate" />
            <span class="text-sm text-gray-500">
              {{ draftProps.backgroundColor || '未设置' }}
            </span>
          </div>
        </el-form-item>

        <el-form-item label="标题颜色" class="mb-0">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="draftProps.titleColor" @change="handleUpdate" />
            <span class="text-sm text-gray-500">
              {{ draftProps.titleColor || '未设置' }}
            </span>
          </div>
        </el-form-item>

        <el-form-item label="内容颜色" class="mb-0">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="draftProps.contentColor" @change="handleUpdate" />
            <span class="text-sm text-gray-500">
              {{ draftProps.contentColor || '未设置' }}
            </span>
          </div>
        </el-form-item>

        <el-form-item label="确认按钮颜色" class="mb-0">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="draftProps.confirmColor" @change="handleUpdate" />
            <span class="text-sm text-gray-500">
              {{ draftProps.confirmColor || '未设置' }}
            </span>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { deepClone, debounce } from '@cms/utils'

// Props定义
interface Props {
  componentProps: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update', props: any): void
}>()

// 草稿状态管理
const draftProps = reactive<any>(deepClone(props.componentProps))
const isSyncing = ref(false)

// 防抖更新函数
const debouncedUpdate = debounce(() => {
  emit('update', deepClone(draftProps))
}, 300)

// 监听外部props变化
watch(
  () => props.componentProps,
  newProps => {
    if (!isSyncing.value) {
      isSyncing.value = true
      try {
        Object.assign(draftProps, deepClone(newProps))
      } finally {
        isSyncing.value = false
      }
    }
  },
  { deep: true }
)

// 更新触发器
const handleUpdate = () => {
  debouncedUpdate()
}
</script>

<style scoped>
.dialog-config {
  min-height: 400px;
}

.config-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.config-section:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
  line-height: 1.5;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
}
</style>

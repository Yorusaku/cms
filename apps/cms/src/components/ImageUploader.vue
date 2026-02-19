<template>
  <div class="image-uploader w-full">
    <!-- 上传区域 -->
    <el-upload
      ref="uploadRef"
      :action="uploadAction"
      :headers="uploadHeaders"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :before-upload="beforeUpload"
      :on-progress="handleProgress"
      :show-file-list="false"
      :auto-upload="true"
      :accept="accept"
      :limit="1"
      drag
      class="w-full"
    >
      <!-- 自定义上传触发器 -->
      <div
        class="upload-trigger flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
      >
        <el-icon class="text-2xl text-gray-400 mb-2">
          <Upload />
        </el-icon>
        <div class="text-sm text-gray-600">
          <span v-if="!uploading">点击上传或拖拽图片到此处</span>
          <span v-else>上传中...</span>
        </div>
        <div class="text-xs text-gray-400 mt-1">支持 JPG/PNG/GIF 格式，最大 {{ maxSize }}MB</div>
      </div>
    </el-upload>

    <!-- 上传进度条 -->
    <div v-if="uploading" class="mt-3">
      <el-progress :percentage="uploadProgress" :stroke-width="6" status="success" />
    </div>

    <!-- 预览区域 -->
    <div v-if="previewUrl" class="mt-3 relative">
      <div class="relative inline-block">
        <img
          :src="previewUrl"
          :alt="fileName"
          class="max-w-full max-h-32 rounded border border-gray-200"
          @error="handleImageError"
        />
        <el-button
          v-if="!uploading"
          type="danger"
          size="small"
          circle
          class="absolute -top-2 -right-2"
          @click="clearImage"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
      <div class="text-xs text-gray-500 mt-1 truncate">
        {{ fileName }}
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="mt-2">
      <el-alert :title="errorMessage" type="error" show-icon closable @close="errorMessage = ''" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Upload, Delete } from '@element-plus/icons-vue'
import type { UploadInstance, UploadProps } from 'element-plus'

interface Props {
  modelValue?: string
  maxSize?: number // MB
  accept?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  maxSize: 2,
  accept: 'image/*',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'success', url: string): void
  (e: 'error', error: string): void
}>()

// refs
const uploadRef = ref<UploadInstance>()

// 状态管理
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')
const fileName = ref('')

// 计算属性
const previewUrl = computed(() => props.modelValue)
const uploadAction = computed(() => '/api/upload/image') // 实际项目中应配置正确的上传接口
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
}))

// 方法
const beforeUpload: UploadProps['beforeUpload'] = file => {
  // 文件类型检查
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    errorMessage.value = '只能上传图片文件!'
    return false
  }

  // 文件大小检查
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    errorMessage.value = `图片大小不能超过 ${props.maxSize}MB!`
    return false
  }

  // 重置状态
  errorMessage.value = ''
  fileName.value = file.name
  uploadProgress.value = 0
  uploading.value = true

  return true
}

const handleProgress: UploadProps['onProgress'] = event => {
  uploadProgress.value = Math.round(event.percent || 0)
}

const handleUploadSuccess: UploadProps['onSuccess'] = (response, _uploadFile) => {
  uploading.value = false
  uploadProgress.value = 100

  // 这里应该根据实际API响应结构调整
  const imageUrl = response?.data?.url || response?.url || ''

  if (imageUrl) {
    emit('update:modelValue', imageUrl)
    emit('change', imageUrl)
    emit('success', imageUrl)
    errorMessage.value = ''
  } else {
    errorMessage.value = '上传成功但未返回有效URL'
    emit('error', '上传成功但未返回有效URL')
  }
}

const handleUploadError: UploadProps['onError'] = error => {
  uploading.value = false
  uploadProgress.value = 0
  errorMessage.value = error.message || '上传失败，请重试'
  emit('error', error.message || '上传失败')
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+5Zu+54mH5Lqk5rWBPC90ZXh0Pjwvc3ZnPg=='
}

const clearImage = () => {
  emit('update:modelValue', '')
  emit('change', '')
  fileName.value = ''
  errorMessage.value = ''
}

// const triggerUpload = () => {
//   if (props.disabled) return
//   uploadRef.value?.submit()
// }

// 监听外部值变化
watch(
  () => props.modelValue,
  newVal => {
    if (newVal && !fileName.value) {
      fileName.value = newVal.split('/').pop() || '已上传图片'
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.upload-trigger {
  min-height: 120px;
}

.upload-trigger:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

:deep(.el-upload-dragger) {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}
</style>

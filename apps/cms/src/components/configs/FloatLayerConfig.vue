<template>
  <div class="floatlayer-config space-y-6 p-4">
    <!-- 定位配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        定位配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="宽度" class="mb-0">
            <el-input-number
              v-model="draftProps.width"
              controls-position="right"
              :min="20"
              :max="200"
              @change="handleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="层级(z-index)" class="mb-0">
            <el-input-number
              v-model="draftProps.zIndex"
              controls-position="right"
              :min="1"
              :max="999"
              @change="handleUpdate"
            />
          </el-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="距离底部" class="mb-0">
            <el-input-number
              v-model="draftProps.bottom"
              controls-position="right"
              :min="0"
              :max="500"
              @change="handleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="距离右侧" class="mb-0">
            <el-input-number
              v-model="draftProps.right"
              controls-position="right"
              :min="0"
              :max="500"
              @change="handleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>
        </div>

        <el-form-item label="滚动时隐藏" class="mb-0">
          <el-switch
            v-model="draftProps.hideByPageScroll"
            active-text="启用"
            inactive-text="禁用"
            @change="handleUpdate"
          />
          <div class="text-xs text-gray-500 mt-1">页面滚动时是否自动隐藏浮动层</div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 图片配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        图片配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="浮动层图片" class="mb-0">
          <ImageUploader
            v-model="draftProps.imageUrl"
            :max-size="1"
            accept="image/*"
            @change="handleUpdate"
          />
          <div class="text-xs text-gray-500 mt-1">支持jpg、png、gif等常见图片格式</div>
        </el-form-item>

        <el-form-item label="默认图片" class="mb-0">
          <ImageUploader
            v-model="draftProps.defaultImage"
            :max-size="1"
            accept="image/*"
            @change="handleUpdate"
          />
          <div class="text-xs text-gray-500 mt-1">当未设置图片时显示的默认图片</div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 预览区域 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        效果预览
      </h3>
      <div class="preview-container relative bg-gray-100 rounded-lg min-h-[200px] overflow-hidden">
        <!-- 模拟手机屏幕 -->
        <div class="absolute inset-0 border border-gray-300 rounded-lg m-2">
          <div class="absolute bottom-4 right-4">
            <img
              v-if="draftProps.imageUrl || draftProps.defaultImage"
              :src="draftProps.imageUrl || draftProps.defaultImage"
              :width="draftProps.width"
              :style="{
                opacity: 1,
                transition: 'opacity 0.3s'
              }"
              alt="预览"
              class="cursor-pointer"
              @error="handleImageError"
            />
            <div
              v-else
              class="bg-gray-300 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500"
              :style="{
                width: `${draftProps.width}px`,
                height: `${draftProps.width}px`
              }"
            >
              <span class="text-xs">无图片</span>
            </div>
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-3 text-center">
          浮动层位置和大小预览（模拟移动端效果）
        </div>
      </div>
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

// 图片上传处理（已由ImageUploader组件处理）
// const handleImageUpload = () => {
//   // 这里可以集成实际的图片上传逻辑
//   console.log('打开图片上传对话框')
// }

// 图片加载错误处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = draftProps.defaultImage || 'https://via.placeholder.com/56'
}
</script>

<style scoped>
.floatlayer-config {
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

:deep(.el-input-group__append) {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.preview-container {
  min-height: 250px;
}
</style>

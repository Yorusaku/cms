<template>
  <div class="assistline-config space-y-6 p-4">
    <!-- 基础配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        基础配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="线条高度" class="mb-0">
          <el-slider
            v-model="draftProps.height"
            :min="1"
            :max="20"
            :step="1"
            show-input
            @change="handleUpdate"
          />
          <div class="text-xs text-gray-500 mt-1">线条的垂直高度（像素）</div>
        </el-form-item>

        <el-form-item label="显示内边距" class="mb-0">
          <el-switch
            v-model="draftProps.paddingVisible"
            active-text="显示"
            inactive-text="隐藏"
            @change="handleUpdate"
          />
          <div class="text-xs text-gray-500 mt-1">是否在线条上下显示16px内边距</div>
        </el-form-item>

        <el-form-item label="线条类型" class="mb-0">
          <el-select v-model="draftProps.type" placeholder="请选择线条类型" @change="handleUpdate">
            <el-option :value="1" label="实线" />
            <el-option :value="0" label="无边框" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="draftProps.type === 1" label="边框样式" class="mb-0">
          <el-select
            v-model="draftProps.borderStyle"
            placeholder="请选择边框样式"
            @change="handleUpdate"
          >
            <el-option value="solid" label="实线" />
            <el-option value="dashed" label="虚线" />
            <el-option value="dotted" label="点线" />
            <el-option value="double" label="双线" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 颜色配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        颜色配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="背景颜色" class="mb-0">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="draftProps.backgroundColor" @change="handleUpdate" />
            <span class="text-sm text-gray-500">
              {{ draftProps.backgroundColor || draftProps.defBackgroundColor || '未设置' }}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-1">线条容器的背景颜色</div>
        </el-form-item>

        <el-form-item label="线条颜色" class="mb-0">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="draftProps.borderColor" @change="handleUpdate" />
            <span class="text-sm text-gray-500">
              {{ draftProps.borderColor || draftProps.defBorderColor || '未设置' }}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-1">线条本身的边框颜色</div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 预览区域 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        效果预览
      </h3>
      <div class="preview-container p-4 bg-gray-50 rounded-lg">
        <div
          class="preview-line"
          :style="{
            backgroundColor: draftProps.backgroundColor || draftProps.defBackgroundColor,
            height: `${draftProps.height}px`,
            padding: draftProps.paddingVisible ? '16px 0' : '0'
          }"
        >
          <div
            :style="{
              borderBottom: draftProps.type
                ? `1px ${draftProps.borderStyle || 'solid'} ${draftProps.borderColor || draftProps.defBorderColor}`
                : 'none',
              height: '100%',
              position: 'relative',
              top: '50%',
              transform: 'translateY(-50%)'
            }"
          />
        </div>
        <div class="text-xs text-gray-500 mt-3 text-center">当前配置效果预览</div>
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
</script>

<style scoped>
.assistline-config {
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

:deep(.el-slider__input) {
  width: 80px;
}

.preview-container {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.preview-line {
  width: 100%;
  border-radius: 2px;
}
</style>

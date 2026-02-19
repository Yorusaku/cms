<template>
  <div class="richtext-config space-y-6 p-4">
    <!-- 内容配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        内容配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="富文本内容" class="mb-0">
          <el-input
            v-model="draftProps.content"
            type="textarea"
            :rows="6"
            placeholder="请输入HTML格式的富文本内容"
            @change="handleUpdate"
          />
          <div class="text-xs text-gray-500 mt-2">
            支持HTML标签，可进行加粗、斜体、颜色等排版操作
          </div>
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

        <el-form-item label="内边距" class="mb-0">
          <div class="grid grid-cols-2 gap-3">
            <el-input-number
              v-model="paddingTop"
              controls-position="right"
              :min="0"
              :max="100"
              @change="handlePaddingUpdate"
            >
              <template #append>上</template>
            </el-input-number>
            <el-input-number
              v-model="paddingRight"
              controls-position="right"
              :min="0"
              :max="100"
              @change="handlePaddingUpdate"
            >
              <template #append>右</template>
            </el-input-number>
            <el-input-number
              v-model="paddingBottom"
              controls-position="right"
              :min="0"
              :max="100"
              @change="handlePaddingUpdate"
            >
              <template #append>下</template>
            </el-input-number>
            <el-input-number
              v-model="paddingLeft"
              controls-position="right"
              :min="0"
              :max="100"
              @change="handlePaddingUpdate"
            >
              <template #append>左</template>
            </el-input-number>
          </div>
          <div class="text-xs text-gray-500 mt-2">设置内容区域的内边距（像素）</div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 预览区域 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        内容预览
      </h3>
      <div
        class="preview-container p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[100px]"
        :style="{
          backgroundColor: draftProps.backgroundColor,
          padding:
            typeof draftProps.padding === 'number' ? `${draftProps.padding}px` : draftProps.padding
        }"
      >
        <div class="ql-editor" v-html="draftProps.content || defaultContent"></div>
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

// 默认内容
const defaultContent =
  '<p>你可以对文字进行<strong>加粗</strong>、<em>斜体</em>、<span style="text-decoration: underline;">下划线</span>、<span style="text-decoration: line-through;">删除线</span>、文字<span style="color: rgb(0, 176, 240);">颜色</span>、<span style="background-color: rgb(255, 192, 0); color: rgb(255, 255, 255);">背景色</span>、以及字号<span style="font-size: 20px;">大</span><span style="font-size: 14px;">小</span>等简单排版操作。</p>'

// 草稿状态管理
const draftProps = reactive<any>(deepClone(props.componentProps))
const isSyncing = ref(false)

// 内边距计算属性
const paddingTop = ref(10)
const paddingRight = ref(10)
const paddingBottom = ref(0)
const paddingLeft = ref(10)

// 解析padding值
const parsePadding = () => {
  const padding = draftProps.padding || '10px 10px 0'
  if (typeof padding === 'number') {
    paddingTop.value = paddingRight.value = paddingBottom.value = paddingLeft.value = padding
  } else {
    const values = padding.split(' ').map((v: string) => parseInt(v) || 0)
    if (values.length === 1) {
      paddingTop.value = paddingRight.value = paddingBottom.value = paddingLeft.value = values[0]
    } else if (values.length === 2) {
      paddingTop.value = paddingBottom.value = values[0]
      paddingRight.value = paddingLeft.value = values[1]
    } else if (values.length === 3) {
      paddingTop.value = values[0]
      paddingRight.value = paddingLeft.value = values[1]
      paddingBottom.value = values[2]
    } else if (values.length === 4) {
      paddingTop.value = values[0]
      paddingRight.value = values[1]
      paddingBottom.value = values[2]
      paddingLeft.value = values[3]
    }
  }
}

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
        parsePadding()
      } finally {
        isSyncing.value = false
      }
    }
  },
  { deep: true, immediate: true }
)

// 更新触发器
const handleUpdate = () => {
  debouncedUpdate()
}

// 内边距更新处理
const handlePaddingUpdate = () => {
  draftProps.padding = `${paddingTop.value}px ${paddingRight.value}px ${paddingBottom.value}px ${paddingLeft.value}px`
  debouncedUpdate()
}
</script>

<style scoped>
.richtext-config {
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
  font-family: monospace;
  font-size: 12px;
}

.preview-container :deep(.ql-editor) {
  min-height: 80px;
  outline: none;
}

.preview-container :deep(p) {
  margin: 0 0 1em 0;
}

.preview-container :deep(strong) {
  font-weight: bold;
}

.preview-container :deep(em) {
  font-style: italic;
}
</style>

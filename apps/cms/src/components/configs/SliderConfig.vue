<template>
  <div class="slider-config space-y-6 p-4">
    <!-- 滑块图片列表 -->
    <div class="config-section">
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h3 class="text-base font-semibold text-gray-800">滑块图片</h3>
        <el-button type="primary" size="small" @click="addItem">
          <el-icon><Plus /></el-icon>
          添加图片
        </el-button>
      </div>

      <!-- 空状态 -->
      <div v-if="draftItems.length === 0" class="text-center py-8 text-gray-500">
        <div class="text-4xl mb-2">🖼️</div>
        <p class="mb-1">暂无滑块图片</p>
        <p class="text-sm">点击上方按钮添加第一张图片</p>
      </div>

      <!-- 图片列表 -->
      <div v-else class="space-y-3">
        <div
          v-for="(item, index) in draftItems"
          :key="item.id"
          class="slider-item-card bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-all duration-200"
        >
          <div class="flex justify-between items-start mb-3">
            <h4 class="font-medium text-gray-700">图片 #{{ index + 1 }}</h4>
            <el-button type="danger" size="small" circle @click="removeItem(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>

          <el-form label-position="top" size="small" class="space-y-3">
            <el-form-item label="图片地址" class="mb-0">
              <ImageUploader
                v-model="item.imageUrl"
                :max-size="2"
                accept="image/*"
                @change="triggerUpdate"
              />
            </el-form-item>

            <el-form-item label="跳转链接" class="mb-0">
              <el-input
                v-model="item.link"
                placeholder="请输入点击跳转的链接地址（可选）"
                clearable
                @change="triggerUpdate"
              >
                <template #prepend>
                  <span class="text-gray-500">🔗</span>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 样式配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        样式配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="背景颜色" class="mb-0">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="localBackgroundColor" @change="handleStyleUpdate" />
            <span class="text-sm text-gray-500">
              {{ localBackgroundColor || '未设置' }}
            </span>
          </div>
        </el-form-item>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="内边距(上)" class="mb-0">
            <el-input-number
              v-model="localPaddingTop"
              controls-position="right"
              :min="0"
              :max="50"
              @change="handleStyleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="内边距(右)" class="mb-0">
            <el-input-number
              v-model="localPaddingRight"
              controls-position="right"
              :min="0"
              :max="50"
              @change="handleStyleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="内边距(下)" class="mb-0">
            <el-input-number
              v-model="localPaddingBottom"
              controls-position="right"
              :min="0"
              :max="50"
              @change="handleStyleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="内边距(左)" class="mb-0">
            <el-input-number
              v-model="localPaddingLeft"
              controls-position="right"
              :min="0"
              :max="50"
              @change="handleStyleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="图片间距" class="mb-0">
            <el-input-number
              v-model="localImageMargin"
              controls-position="right"
              :min="0"
              :max="30"
              @change="handleStyleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="圆角半径" class="mb-0">
            <el-input-number
              v-model="localBorderRadius"
              controls-position="right"
              :min="0"
              :max="20"
              @change="handleStyleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="图片宽度" class="mb-0">
            <el-input-number
              v-model="localImageWidth"
              controls-position="right"
              :min="50"
              :max="300"
              @change="handleStyleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="图片高度" class="mb-0">
            <el-input-number
              v-model="localImageHeight"
              controls-position="right"
              :min="50"
              :max="300"
              @change="handleStyleUpdate"
            >
              <template #append>px</template>
            </el-input-number>
          </el-form-item>
        </div>

        <el-form-item label="默认图片" class="mb-0">
          <el-input
            v-model="localDefaultImage"
            placeholder="默认图片URL"
            clearable
            @change="handleStyleUpdate"
          />
          <div class="text-xs text-gray-500 mt-1">当滑块项未设置图片时显示的默认图片</div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { deepClone, debounce, createRandomId } from '@cms/utils'

// 滑块项类型定义
interface SliderItem {
  id: string
  imageUrl?: string
  link?: string
}

// Props定义
interface Props {
  componentProps: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update', props: any): void
}>()

// 草稿状态管理
const draftItems = ref<SliderItem[]>([])
const isSyncing = ref(false)

// 样式配置的本地状态
const localBackgroundColor = ref<string>('#ffffff')
const localPaddingTop = ref<number>(15)
const localPaddingRight = ref<number>(15)
const localPaddingBottom = ref<number>(15)
const localPaddingLeft = ref<number>(15)
const localImageMargin = ref<number>(15)
const localBorderRadius = ref<number>(0)
const localImageWidth = ref<number>(100)
const localImageHeight = ref<number>(80)
const localDefaultImage = ref<string>('https://via.placeholder.com/100x80')

// 同步items数据从props
const syncItemsFromProps = () => {
  const list = props.componentProps.list || []
  draftItems.value = list.map((item: any) => ({
    id: createRandomId(),
    imageUrl: item.imageUrl || '',
    link: item.link || ''
  }))

  // 同步样式配置
  localBackgroundColor.value = props.componentProps.backgroundColor || '#ffffff'
  const padding = props.componentProps.padding || [15, 15]
  localPaddingTop.value = Array.isArray(padding) ? padding[0] : 15
  localPaddingRight.value = Array.isArray(padding) ? padding[1] : 15
  localPaddingBottom.value = Array.isArray(padding) ? padding[0] : 15
  localPaddingLeft.value = Array.isArray(padding) ? padding[1] : 15
  localImageMargin.value = props.componentProps.imageMargin ?? 15
  localBorderRadius.value = props.componentProps.borderRadius ?? 0
  localImageWidth.value = props.componentProps.imageWidth ?? 100
  localImageHeight.value = props.componentProps.imageHeight ?? 80
  localDefaultImage.value =
    props.componentProps.defaultImage || 'https://via.placeholder.com/100x80'
}

// 防抖更新函数
const triggerUpdate = debounce(() => {
  // 构造滑块数据
  const list: any[] = draftItems.value.map(item => ({
    imageUrl: item.imageUrl,
    link: item.link
  }))

  const updatedProps: any = {
    ...deepClone(props.componentProps),
    list,
    backgroundColor: localBackgroundColor.value,
    padding: [localPaddingTop.value, localPaddingRight.value],
    imageMargin: localImageMargin.value,
    borderRadius: localBorderRadius.value,
    imageWidth: localImageWidth.value,
    imageHeight: localImageHeight.value,
    defaultImage: localDefaultImage.value
  }

  emit('update', updatedProps)
}, 300)

// 数组操作方法
const addItem = () => {
  const newItem: SliderItem = {
    id: createRandomId(),
    imageUrl: '',
    link: ''
  }
  draftItems.value.push(newItem)
  triggerUpdate()
}

const removeItem = (index: number) => {
  draftItems.value.splice(index, 1)
  triggerUpdate()
}

// 样式更新处理
const handleStyleUpdate = () => {
  triggerUpdate()
}

// 监听外部props变化
watch(
  () => props.componentProps,
  _newProps => {
    if (!isSyncing.value) {
      isSyncing.value = true
      try {
        syncItemsFromProps()
      } finally {
        isSyncing.value = false
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.slider-config {
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

.slider-item-card {
  position: relative;
}

.slider-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
  line-height: 1.5;
}

:deep(.el-input-group__append),
:deep(.el-input-group__prepend) {
  background-color: #f9fafb;
  border-color: #d1d5db;
}
</style>

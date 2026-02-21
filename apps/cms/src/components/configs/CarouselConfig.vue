<template>
  <div class="carousel-config">
    <ComGroup title="选择模板">
      <template #default>
        <div class="layout-list">
          <div
            v-for="item in layoutList"
            :key="item.id"
            class="layout-item"
            :class="{ active: configData.layout === item.id }"
            @click="configData.layout = item.id"
          >
            <el-icon :size="24">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </template>
    </ComGroup>

    <ComDivider />

    <ComGroup
      title="添加图片"
      :tips="`最多添加${selectLimitSize}个广告，鼠标拖拽调整广告顺序，建议宽度750像素`"
      name-black
    />

    <ComGroup bg-gray content-block>
      <PicList
        :image-list="configData.imageList"
        :limit-size="selectLimitSize"
        :show-name="false"
        :show-add="true"
        input-place-holder="建议10个字以内，可不填"
        @update:image-list="updateImageList"
      />
    </ComGroup>

    <ComGroup title="是否设置边距">
      <el-radio-group v-model="configData.isDefaultMargin">
        <el-radio :value="1">是</el-radio>
        <el-radio :value="0">否</el-radio>
      </el-radio-group>
    </ComGroup>

    <ComGroup v-show="!!configData.isDefaultMargin" title="图片上下边距">
      <el-slider
        v-model="configData.marginTopBottom"
        :max="30"
        show-input
        :show-input-controls="false"
        size="small"
      />
    </ComGroup>

    <ComGroup v-show="!!configData.isDefaultMargin" title="图片左右边距">
      <el-slider
        v-model="configData.marginLeftRight"
        :max="30"
        show-input
        :show-input-controls="false"
        size="small"
      />
    </ComGroup>

    <ComGroup
      v-show="!!configData.isDefaultMargin && configData.layout === 'single'"
      title="图片边距"
    >
      <el-slider
        v-model="configData.imageMargin"
        :max="30"
        show-input
        :show-input-controls="false"
        size="small"
      />
    </ComGroup>

    <ComGroup title="是否设置圆角">
      <el-radio-group v-model="configData.isBorderRadius">
        <el-radio :value="1">是</el-radio>
        <el-radio :value="0">否</el-radio>
      </el-radio-group>
    </ComGroup>

    <ComGroup v-show="!!configData.isBorderRadius" title="圆角">
      <el-slider
        v-model="configData.radius"
        :max="30"
        show-input
        :show-input-controls="false"
        size="small"
      />
    </ComGroup>

    <ComGroup title="背景颜色">
      <el-button type="primary" link @click="configData.backgroundColor = initBgColor">
        重置
      </el-button>
      <el-color-picker v-model="configData.backgroundColor" size="small" />
    </ComGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { debounce } from '@cms/utils'
import ComGroup from '@/components/basic/ComGroup.vue'
import ComDivider from '@/components/basic/ComDivider.vue'
import PicList from '@/components/basic/PicList.vue'
import { PictureFilled, Grid } from '@element-plus/icons-vue'

interface ValidTimeItem {
  startTime: string
  endTime: string
}

interface LinkConfig {
  type?: string
  value?: string
}

interface ImageItem {
  imageUrl: string
  text?: string
  link?: LinkConfig | null
}

interface CarouselConfig {
  component: string
  validTime: ValidTimeItem[]
  layout: string
  imageList: ImageItem[]
  imageMargin: number
  isDefaultMargin: number
  marginSize: number[]
  marginTopBottom: number
  marginLeftRight: number
  isBorderRadius: number
  radius: number
  backgroundColor: string
  piclist: ImageItem[]
}

const props = defineProps<{
  parmes: CarouselConfig
}>()

const emit = defineEmits<{
  (e: 'editComponent', data: CarouselConfig): void
}>()

const initBgColor = '#FFFFFF'

const configData = ref<CarouselConfig>(JSON.parse(JSON.stringify(props.parmes)))

const layoutList = [
  {
    name: '轮播广告',
    id: 'swiper',
    icon: PictureFilled,
    limitSize: 10
  },
  {
    name: '1行1个',
    id: 'single',
    icon: Grid,
    limitSize: 10
  }
]

const selectLimitSize = computed(() => {
  const item = layoutList.find(item => item.id === configData.value.layout)
  return item ? item.limitSize : 10
})

const updateImageList = (list: ImageItem[]) => {
  configData.value.imageList = list
}

watch(
  configData,
  debounce(newVal => {
    const { marginTopBottom, marginLeftRight } = newVal
    const marginSize = [marginTopBottom || 0, marginLeftRight || 0]
    const emitData = {
      ...newVal,
      marginSize
    }
    emit('editComponent', emitData)
  }, 300),
  { deep: true }
)

watch(
  () => props.parmes,
  newVal => {
    configData.value = JSON.parse(JSON.stringify(newVal))
    const { marginSize } = configData.value
    if (marginSize && marginSize.length >= 2) {
      configData.value.marginTopBottom = marginSize[0]
      configData.value.marginLeftRight = marginSize[1]
    }
  },
  { deep: true }
)
</script>

<style scoped>
.carousel-config {
  padding: 0 0 50px;
}

.layout-list {
  display: flex;
  gap: 12px;
  width: 100%;
}

.layout-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
  min-width: 80px;
  transition: all 0.2s;
}

.layout-item:hover {
  border-color: #409eff;
}

.layout-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.layout-item span {
  font-size: 12px;
  margin-top: 4px;
  color: #323233;
}

:deep(.el-slider) {
  width: 100%;
}

:deep(.el-slider__runway) {
  margin-right: 80px;
}

:deep(.el-slider__input) {
  width: 60px;
}
</style>

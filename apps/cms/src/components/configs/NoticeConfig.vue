<template>
  <div class="notice-config">
    <ComGroup
      title="添加内容"
      tips="最多添加10条内容，多条将会滚动展示，拖动选中的内容可对其排序"
      name-black
    />

    <ComGroup bg-gray content-block>
      <PicList
        :image-list="configData.noticelist"
        add-place-holder="添加内容"
        :show-pic="false"
        :show-name="false"
        @update:image-list="updateNoticeList"
      />
    </ComGroup>

    <ComGroup title="配置图标">
      <el-button type="primary" link @click="configData.imageUrl = ''">重置</el-button>
      <UpLoadBox :img-url="configData.imageUrl" @update:img-url="updateImageUrl" />
    </ComGroup>

    <ComGroup title="背景颜色">
      <el-button type="primary" link @click="configData.backgroundColor = initBgColor">
        重置
      </el-button>
      <el-color-picker v-model="configData.backgroundColor" size="small" />
    </ComGroup>

    <ComGroup title="文字颜色">
      <el-button type="primary" link @click="configData.textColor = initTxtColor"> 重置 </el-button>
      <el-color-picker v-model="configData.textColor" size="small" />
    </ComGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ComGroup from '@/components/basic/ComGroup.vue'
import PicList from '@/components/basic/PicList.vue'
import UpLoadBox from '@/components/basic/UpLoadBox.vue'

interface NoticeItem {
  text: string
  link?: any
}

interface NoticeConfig {
  component: string
  validTime: any[]
  imageUrl: string
  noticelist: NoticeItem[]
  backgroundColor: string
  textColor: string
}

const props = defineProps<{
  parmes: NoticeConfig
}>()

const emit = defineEmits<{
  (e: 'editComponent', data: NoticeConfig): void
}>()

const initBgColor = '#FFF8E9'
const initTxtColor = '#666666'

const configData = ref<NoticeConfig>(JSON.parse(JSON.stringify(props.parmes)))

const updateNoticeList = (list: NoticeItem[]) => {
  configData.value.noticelist = list
}

const updateImageUrl = (url: string) => {
  configData.value.imageUrl = url
}

watch(
  configData,
  newVal => {
    emit('editComponent', newVal)
  },
  { deep: true }
)

watch(
  () => props.parmes,
  newVal => {
    configData.value = JSON.parse(JSON.stringify(newVal))
  },
  { deep: true }
)
</script>

<style scoped>
.notice-config {
  padding: 0 0 50px;
}
</style>

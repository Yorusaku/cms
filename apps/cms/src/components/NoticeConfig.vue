<template>
  <div class="notice-config">
    <div class="config-section mb-4">
      <h4 class="text-sm font-medium mb-2 text-gray-700">公告内容</h4>
      <el-form label-width="80px" size="small">
        <el-form-item label="公告文本">
          <el-input v-model="noticeText" type="textarea" :rows="3" @change="handleUpdate" />
        </el-form-item>
        <el-form-item label="图标地址">
          <el-input v-model="draftProps.iconUrl" placeholder="可选" @change="handleUpdate" />
        </el-form-item>
      </el-form>
    </div>
    <div class="config-section mb-4">
      <h4 class="text-sm font-medium mb-2 text-gray-700">颜色样式</h4>
      <el-form label-width="80px" size="small">
        <el-form-item label="背景颜色">
          <div class="flex items-center gap-2">
            <el-color-picker v-model="draftProps.backgroundColor" @change="handleUpdate" />
            <span class="text-xs text-gray-500">{{ draftProps.backgroundColor }}</span>
          </div>
        </el-form-item>
        <el-form-item label="文字颜色">
          <div class="flex items-center gap-2">
            <el-color-picker v-model="draftProps.textColor" @change="handleUpdate" />
            <span class="text-xs text-gray-500">{{ draftProps.textColor }}</span>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <div class="config-section">
      <h4 class="text-sm font-medium mb-2 text-gray-700">滚动设置</h4>
      <el-form label-width="80px" size="small">
        <el-form-item label="滚动速度">
          <el-slider v-model="draftProps.speed" :min="5" :max="100" @change="handleUpdate" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watchEffect, computed } from 'vue'
import { deepClone } from '@cms/utils'
import type { INoticeProps } from '@cms/ui'

interface Props {
  componentProps: INoticeProps
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update', props: INoticeProps): void
}>()

const draftProps = reactive<INoticeProps>(deepClone(props.componentProps))

const noticeText = computed({
  get: () => draftProps.noticeList?.[0]?.text || '',
  set: value => {
    if (!draftProps.noticeList) {
      draftProps.noticeList = []
    }
    if (draftProps.noticeList.length === 0) {
      draftProps.noticeList.push({ text: value })
    } else {
      draftProps.noticeList[0].text = value
    }
  }
})

let isSyncing = false

watchEffect(() => {
  if (!isSyncing) {
    isSyncing = true
    Object.assign(draftProps, deepClone(props.componentProps))
    isSyncing = false
  }
})

const handleUpdate = () => {
  emit('update', deepClone(draftProps))
}
</script>

<style scoped>
.notice-config {
  padding: 8px 0;
}

.config-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.config-section:last-child {
  border-bottom: none;
}
</style>

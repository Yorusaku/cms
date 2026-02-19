<template>
  <div class="cube-selection-config">
    <el-form :model="form" label-width="120px" size="small">
      <!-- 模板选择 -->
      <el-form-item label="模板样式">
        <el-radio-group v-model="form.template" @change="handleTemplateChange">
          <el-radio-button label="oneLine2">单行2列</el-radio-button>
          <el-radio-button label="oneLine3">单行3列</el-radio-button>
          <el-radio-button label="twoLine2">双行2列</el-radio-button>
          <el-radio-button label="twoLine3">双行3列</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 图片列表 -->
      <el-form-item label="图片列表">
        <el-table :data="form.imageList" border stripe size="small">
          <el-table-column prop="imageUrl" label="图片URL" width="200">
            <template #default="{ row }">
              <el-input v-model="row.imageUrl" placeholder="图片URL" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="link" label="跳转链接" width="200">
            <template #default="{ row }">
              <el-input v-model="row.link" placeholder="链接地址" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ $index }">
              <el-button type="text" size="small" @click="removeImage($index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" size="small" style="margin-top: 10px" @click="addImage">
          <el-icon><Plus /></el-icon> 添加图片
        </el-button>
      </el-form-item>

      <!-- 间距设置 -->
      <el-form-item label="页面边距">
        <el-input-number v-model="form.pageMargin" :min="0" :max="100" size="small" />
      </el-form-item>

      <el-form-item label="图片间距">
        <el-input-number v-model="form.imgMargin" :min="0" :max="50" size="small" />
      </el-form-item>

      <el-form-item label="圆角半径">
        <el-input-number v-model="form.radius" :min="0" :max="50" size="small" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'

interface ImageItem {
  imageUrl: string
  link: string
}

interface Form {
  template: string
  imageList: ImageItem[]
  pageMargin: number
  imgMargin: number
  radius: number
}

const props = defineProps<{
  modelValue: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const form = ref<Form>({
  template: 'oneLine2',
  imageList: [
    { imageUrl: '', link: '' },
    { imageUrl: '', link: '' }
  ],
  pageMargin: 0,
  imgMargin: 0,
  radius: 0
})

// 初始化表单数据
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      form.value = {
        template: newVal.template || 'oneLine2',
        imageList: newVal.imageList || [
          { imageUrl: '', link: '' },
          { imageUrl: '', link: '' }
        ],
        pageMargin: newVal.pageMargin || 0,
        imgMargin: newVal.imgMargin || 0,
        radius: newVal.radius || 0
      }
    }
  },
  { immediate: true }
)

// 监听表单变化
watch(
  form,
  newForm => {
    emit('update:modelValue', newForm)
  },
  { deep: true }
)

const handleTemplateChange = (value: string) => {
  // 根据模板调整图片数量
  if (value === 'oneLine2' || value === 'oneLine3') {
    if (form.value.imageList.length < 2) {
      form.value.imageList.push({ imageUrl: '', link: '' })
    }
  } else if (value === 'twoLine2' || value === 'twoLine3') {
    if (form.value.imageList.length < 4) {
      while (form.value.imageList.length < 4) {
        form.value.imageList.push({ imageUrl: '', link: '' })
      }
    }
  }
}

const addImage = () => {
  form.value.imageList.push({ imageUrl: '', link: '' })
}

const removeImage = (index: number) => {
  if (form.value.imageList.length > 1) {
    form.value.imageList.splice(index, 1)
  }
}
</script>

<style scoped>
.cube-selection-config {
  padding: 16px;
}
</style>

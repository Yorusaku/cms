<template>
  <div class="upload-box">
    <template v-if="uploading">
      <div class="upload-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>上传中</span>
      </div>
    </template>
    <template v-else>
      <template v-if="url">
        <img :src="url" class="preview-img" />
        <p class="pic-tips" @click="editImg">更换图片</p>
      </template>
      <template v-else>
        <div class="not-pic" @click="editImg">
          <el-icon><Plus /></el-icon>
          <p v-if="addPlaceHolder">{{ addPlaceHolder }}</p>
        </div>
      </template>
    </template>

    <el-upload
      v-show="false"
      ref="uploadRef"
      :headers="headers"
      :action="actionUrl"
      :multiple="false"
      list-type="picture"
      :show-file-list="false"
      :on-success="doSuccess"
      :on-error="doError"
      :before-upload="beforeAvatarUpload"
    >
      <el-button size="small" type="primary">上传图片</el-button>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage, ElUpload } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    imgUrl?: string
    addPlaceHolder?: string
    uploadFile?: boolean
  }>(),
  {
    imgUrl: '',
    addPlaceHolder: '添加图片',
    uploadFile: true
  }
)

const emit = defineEmits<{
  (e: 'update:imgUrl', value: string): void
  (e: 'editImg'): void
}>()

const url = ref(props.imgUrl)
const uploading = ref(false)
const uploadRef = ref<InstanceType<typeof ElUpload>>()

const actionUrl = computed(() => {
  return import.meta.env.VITE_API_BASE_URL + '/atlas-cms/upload'
})

const headers = computed(() => {
  try {
    const token = localStorage.getItem('token')
    return {
      'X-token': token || ''
    }
  } catch {
    return {
      'X-token': ''
    }
  }
})

watch(
  () => props.imgUrl,
  newVal => {
    url.value = newVal
  },
  { immediate: true }
)

const editImg = () => {
  if (props.uploadFile && uploadRef.value) {
    const uploadEl = uploadRef.value.$el
    if (uploadEl) {
      const button = uploadEl.querySelector('button')
      if (button) {
        button.click()
        return
      }
    }
  }
  emit('editImg')
}

const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }

  uploading.value = true
  return true
}

interface UploadResponse {
  data?: string
}

const doSuccess = (response: UploadResponse) => {
  uploading.value = false
  if (response && response.data) {
    emit('update:imgUrl', response.data)
  }
}

const doError = () => {
  ElMessage.error('上传失败，请稍后重试')
  uploading.value = false
}
</script>

<style scoped>
.upload-box {
  position: relative;
  width: 60px;
  height: 60px;
  border: 1px solid #e5e5e5;
  background: #fff;
  text-align: center;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pic-tips {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  margin: 0;
}

.not-pic {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  color: #409eff;
  cursor: pointer;
}

.not-pic .el-icon {
  font-size: 20px;
}

.not-pic p {
  margin: 4px 0 0;
  font-size: 12px;
}

.upload-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 12px;
}

.upload-loading .el-icon {
  font-size: 20px;
  margin-bottom: 4px;
}
</style>

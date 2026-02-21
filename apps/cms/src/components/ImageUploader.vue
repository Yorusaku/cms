<template>
  <!-- 上传图片盒子 -->
  <div class="up-pic-box">
    <template v-if="uploading">
      <div
        v-loading="uploading"
        element-loading-text="上传中"
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(0, 0, 0, 0.3)"
      />
    </template>
    <template v-else>
      <template v-if="url">
        <img :src="url" alt="上传的图片" />
        <p class="pic-tips" @click="editImg">更换图片</p>
      </template>
      <template v-else>
        <div class="not-pic" @click="editImg">
          <i class="el-icon-plus" />
          <p v-if="addPlaceHolder">
            {{ addPlaceHolder }}
          </p>
        </div>
      </template>
    </template>
    <el-upload
      v-show="false"
      :headers="headers"
      ref="upload"
      :action="actionUrl"
      :multiple="false"
      list-type="picture"
      :show-file-list="false"
      :on-success="doSuccess"
      :on-error="doError"
      :before-upload="beforeAvatarUpload"
    >
      <el-button size="small" type="primary" :loading="uploading"> +&nbsp;上传图片 </el-button>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  imgUrl?: string
  addPlaceHolder?: string
  uploadFile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  imgUrl: '',
  addPlaceHolder: '添加图片',
  uploadFile: true
})

const emit = defineEmits<{
  'update:imgUrl': [value: string]
  editImg: []
}>()

const url = ref<string>('')
const uploading = ref(false)
const upload = ref<any>(null)

// 上传图片接口地址（需要根据实际项目配置）
const actionUrl = '/api/atlas-cms/uploadImage'

const headers = {
  'X-token': localStorage.getItem('token') || ''
}

watch(
  () => props.imgUrl,
  (val) => {
    url.value = val
  },
  { immediate: true }
)

const editImg = () => {
  if (props.uploadFile) {
    upload.value?.$el?.querySelector('button')?.click()
  } else {
    emit('editImg')
  }
}

// 上传图片前的验证方法
const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt500 = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
  }
  if (!isLt500) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }
  if (isJPG && isLt500) {
    uploading.value = true
    return true
  } else {
    return false
  }
}

// 上传图片成功的方法
const doSuccess = (response: any) => {
  uploading.value = false
  if (response.data) {
    url.value = response.data
    emit('update:imgUrl', response.data)
  } else {
    ElMessage.error('上传失败，返回数据为空')
  }
}

// 上传图片失败的方法
const doError = () => {
  ElMessage.error('上传失败，请稍后重试')
  uploading.value = false
}
</script>

<style scoped>
/* 上传图片模块样式 */
.up-pic-box {
  position: relative;
  width: 60px;
  height: 60px;
  border: 1px solid #e5e5e5;
  background: #fff;
  text-align: center;
}

.up-pic-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.up-pic-box .pic-tips {
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

.up-pic-box .not-pic {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  color: #909399;
  cursor: pointer;
}

.up-pic-box .not-pic i {
  font-size: 20px;
  font-style: normal;
}

.up-pic-box .not-pic p {
  margin-top: 4px;
  font-size: 12px;
}

.up-pic-box :deep(.el-loading-parent--relative) {
  width: 100%;
  height: 100%;
  display: inline-block;
}

.up-pic-box :deep(.el-loading-text) {
  font-size: 12px !important;
}
</style>

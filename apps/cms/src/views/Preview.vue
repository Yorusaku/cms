<template>
  <div class="preview-box">
    <div class="preview-page">
      <div class="preview-header" />
      <div class="preview-body">
        <iframe
          id="previewIframe"
          class="preview-iframe"
          :src="previewSrc"
          title="页面预览"
          frameborder="0"
          allowfullscreen
          width="100%"
          height="100%"
        />
      </div>
      <div class="preview-bottom" />
    </div>
    <div class="share-box">
      <div class="code-box">
        <p class="title">手机扫码访问</p>
        <p class="desc">微信"扫一扫"分享到朋友圈</p>
        <div class="pic">
          <div class="qr-placeholder">
            <el-icon><Picture /></el-icon>
            <p>二维码区域</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'

const route = useRoute()
const previewSrc = ref('')
const shareSrc = ref('')

onMounted(() => {
  const id = route.query.id
  shareSrc.value = `http://localhost:5174/page-preview?id=${id}`
  previewSrc.value = shareSrc.value
})
</script>

<style scoped>
.preview-box {
  height: 100%;
  padding: 20px 0;
  box-sizing: border-box;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 80px;
}

.preview-page {
  display: flex;
  flex-direction: column;
  width: 375px;
  height: 800px;
  border: 5px solid #ddd;
  border-radius: 20px;
  overflow: hidden;
  background-color: #fff;
}

.preview-header {
  height: 20px;
  background: #ddd;
  position: relative;
}

.preview-header:before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  margin-left: -20px;
}

.preview-header:after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 50px;
  height: 8px;
  background: #fff;
  border-radius: 10px;
  transform: translate(-50%, -50%);
  margin-left: 20px;
}

.preview-body {
  flex: 1;
  overflow: hidden;
}

.preview-iframe {
  border: none;
}

.preview-bottom {
  height: 30px;
  background: #ddd;
  position: relative;
}

.preview-bottom:after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 15px;
  height: 15px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.share-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.code-box {
  border: 1px solid #e4e4e4;
  border-radius: 8px;
  background-color: #fff;
  text-align: center;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0 0 10px 0;
  padding-bottom: 10px;
  font-size: 14px;
  color: #666;
  border-bottom: 1px dashed #ccc;
  line-height: 1.6;
}

.desc {
  font-size: 12px;
  color: #666;
  margin: 0 0 20px 0;
}

.pic {
  width: 180px;
  height: 180px;
  margin: 0 auto;
  overflow: hidden;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
}

.qr-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}
</style>

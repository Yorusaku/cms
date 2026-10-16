<template>
  <div class="preview-box">
    <div class="preview-panel">
      <div class="preview-toolbar">
        <el-form inline>
          <el-form-item label="设备">
            <el-select v-model="deviceKey" class="toolbar-select">
              <el-option
                v-for="device in deviceOptions"
                :key="device.key"
                :label="device.label"
                :value="device.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :loading="loading" @click="reloadPreview">刷新预览</el-button>
          </el-form-item>
        </el-form>
        <p class="preview-meta">
          <span v-if="lastLoadedAt">最后同步：{{ lastLoadedAt }}</span>
          <span v-else>等待首次加载</span>
        </p>
      </div>
      <div class="preview-page" :style="frameStyle">
        <div class="preview-header" />
        <div class="preview-body">
          <iframe
            :key="iframeKey"
            id="previewIframe"
            ref="iframeRef"
            class="preview-iframe"
            :src="previewSrc"
            title="页面预览"
            allowfullscreen
            width="100%"
            height="100%"
            @load="handleLoad"
            @error="handleError"
          />
          <div v-if="loading" class="iframe-overlay">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>预览加载中...</span>
          </div>
          <div v-if="loadError" class="iframe-overlay error-overlay">
            <span>预览加载失败，请重试</span>
            <el-button size="small" @click="reloadPreview">重试</el-button>
          </div>
        </div>
        <div class="preview-bottom" />
      </div>
    </div>
    <div class="share-box">
      <div class="code-box">
        <p class="title">手机扫码访问</p>
        <p class="desc">微信"扫一扫"分享到朋友圈</p>
        <div class="pic">
          <div class="qr-placeholder">
            <el-icon class="qr-placeholder-icon"><Picture /></el-icon>
            <p>二维码区域</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import { Loading, Picture } from '@element-plus/icons-vue'
import { MESSAGE_TYPE } from '@cms/types'
import {
  MessageSequenceTracker,
  createSecureMessage,
  migrateSchema,
  verifySecureMessage,
  validateOrigin,
  type SecureMessagePayload,
} from '@cms/utils'
import { normalizePageSchemaMaterials } from '@cms/ui'
import { getCmsPageById } from '@/api/activity'
import { adaptPageData } from '@/utils/data-adapter'

const route = useRoute()

interface PageDetailResponse {
  code: number
  message?: string
  data?: Record<string, unknown>
}

const deviceOptions = [
  { key: 'iphone-se', label: 'iPhone SE', width: 320, height: 568 },
  { key: 'iphone-12', label: 'iPhone 12', width: 390, height: 844 },
  { key: 'iphone-14-pro-max', label: 'iPhone 14 Pro Max', width: 430, height: 932 }
]

const deviceKey = ref(deviceOptions[1].key)
const loading = ref(true)
const loadError = ref(false)
const iframeKey = ref(0)
const lastLoadedAt = ref('')
const previewSrc = ref('')

const activeDevice = computed(
  () => deviceOptions.find(device => device.key === deviceKey.value) ?? deviceOptions[1]
)

const frameStyle = computed(() => ({
  width: `${activeDevice.value.width}px`,
  height: `${Math.min(activeDevice.value.height, 800)}px`
}))

const buildPreviewUrl = () => {
  const id = route.query.id
  const previewUrl =
    import.meta.env.VITE_CRS_PREVIEW_URL || 'http://127.0.0.1:3010/crs/#/pagePreview'
  return `${previewUrl}?id=${id ?? ''}`
}

const iframeRef = ref<HTMLIFrameElement | null>(null)
const outgoingSequenceTracker = new MessageSequenceTracker()
const incomingSequenceTracker = new MessageSequenceTracker()

const getCrsOrigin = (): string => {
  const configured = import.meta.env.VITE_CRS_PREVIEW_ORIGIN
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured
  }
  return 'http://127.0.0.1:3010'
}

/**
 * 把服务端草稿经签名的 postMessage 推送给预览 iframe。
 * CRS 的 PagePreview 只接受 SYNC_SCHEMA 消息（本页此前未发送任何消息，
 * 导致 iframe 永远停在空态）；数据来源与装修页一致：getCmsPageById + migrate。
 */
const sendSchemaToIframe = async () => {
  const id = Number(route.query.id)
  const contentWindow = iframeRef.value?.contentWindow
  if (!Number.isFinite(id) || id <= 0 || !contentWindow) {
    return
  }

  try {
    const response = (await getCmsPageById(id)) as PageDetailResponse
    if (response.code !== 10000 || !response.data) {
      return
    }

    const pageData = response.data
    let rawSchema: unknown = pageData
    if (pageData.schema) {
      rawSchema =
        typeof pageData.schema === 'string'
          ? JSON.parse(pageData.schema)
          : pageData.schema
    } else {
      rawSchema = adaptPageData(pageData)
    }

    const schema = normalizePageSchemaMaterials(migrateSchema(rawSchema))
    const payload = await createSecureMessage(
      MESSAGE_TYPE.SYNC_SCHEMA,
      JSON.parse(JSON.stringify(schema)),
      outgoingSequenceTracker
    )
    contentWindow.postMessage(payload, getCrsOrigin())
  } catch (error) {
    console.warn('发送 Schema 到预览 iframe 失败:', error)
  }
}

// READY 超时兜底：两端密钥不一致或 CRS 异常时给出可见失败，避免永久停在空态
let readyTimeout: ReturnType<typeof setTimeout> | null = null

const clearReadyTimeout = () => {
  if (readyTimeout !== null) {
    clearTimeout(readyTimeout)
    readyTimeout = null
  }
}

const startReadyTimeout = () => {
  clearReadyTimeout()
  readyTimeout = setTimeout(() => {
    loading.value = false
    loadError.value = true
  }, 8000)
}

/**
 * 推送时机由 CRS 的 PREVIEW_READY 触发（见下方 message 监听）：
 * 子应用为异步 chunk，iframe load 后立即推送可能早于其监听器注册而丢失。
 * CRS→CMS 方向无竞态（本页监听器早已注册），READY 到达即代表对端就绪。
 */
useEventListener(window, 'message', async (event: MessageEvent) => {
  if (!validateOrigin(event.origin)) {
    return
  }

  try {
    const payload = event.data as SecureMessagePayload
    const verification = await verifySecureMessage(payload, incomingSequenceTracker)
    if (!verification.valid) {
      return
    }
    if (payload.type === MESSAGE_TYPE.PREVIEW_READY) {
      clearReadyTimeout()
      void sendSchemaToIframe()
    }
  } catch {
    // 非本项目消息格式，忽略
  }
})

const handleLoad = () => {
  loading.value = false
  loadError.value = false
  lastLoadedAt.value = new Date().toLocaleString('zh-CN', { hour12: false })
  // 等待子应用就绪（PREVIEW_READY），超时则显示失败提示
  startReadyTimeout()
}

const handleError = () => {
  loading.value = false
  loadError.value = true
}

const reloadPreview = () => {
  loading.value = true
  loadError.value = false
  iframeKey.value += 1
}

onMounted(() => {
  previewSrc.value = buildPreviewUrl()
})
</script>

<style scoped>
.preview-box {
  min-height: 100%;
  padding: 20px 0;
  box-sizing: border-box;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 56px;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-toolbar {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 12px 16px;
}

.toolbar-select {
  width: 180px;
}

.preview-meta {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.preview-page {
  display: flex;
  flex-direction: column;
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
  position: relative;
}

.preview-iframe {
  border: none;
}

.iframe-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.88);
  color: #4b5563;
}

.error-overlay {
  color: #b91c1c;
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

.qr-placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
}
</style>

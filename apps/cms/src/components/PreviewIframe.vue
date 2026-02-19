<template>
  <div class="preview-iframe-container">
    <iframe
      ref="iframeRef"
      :src="previewUrl"
      class="preview-iframe"
      @load="handleIframeLoad"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEventListener, useDebounceFn } from '@vueuse/core'
import { usePageStore } from '../store/usePageStore'
import { MESSAGE_TYPE } from '@cms/types'
import type { IMessagePayload, IPageSchema } from '@cms/types'

const props = defineProps<{
  previewUrl: string
}>()

const pageStore = usePageStore()
const iframeRef = ref<HTMLIFrameElement | null>(null)
const iframeLoaded = ref(false)

const getTargetOrigin = (): string => {
  return import.meta.env.DEV ? '*' : window.location.origin
}

const sendSchemaToIframe = (schema: IPageSchema) => {
  if (!iframeRef.value?.contentWindow || !iframeLoaded.value) {
    return
  }

  try {
    const clonedSchema = JSON.parse(JSON.stringify(schema))
    const payload: IMessagePayload<IPageSchema> = {
      type: MESSAGE_TYPE.SYNC_SCHEMA,
      data: clonedSchema
    }
    iframeRef.value.contentWindow.postMessage(payload, getTargetOrigin())
  } catch (error) {
    console.warn('发送 Schema 到 iframe 失败:', error)
  }
}

const debouncedSendSchema = useDebounceFn((schema: IPageSchema) => {
  sendSchemaToIframe(schema)
}, 100)

const handleIframeLoad = () => {
  iframeLoaded.value = true
  sendSchemaToIframe(pageStore.pageSchema)
}

useEventListener(window, 'message', (event: MessageEvent) => {
  const { type, data } = event.data as IMessagePayload
  if (type === MESSAGE_TYPE.ON_SELECT_BLOCK && data && typeof data === 'object' && 'id' in data) {
    pageStore.setActiveId(data.id as string)
  }
})

watch(
  () => pageStore.pageSchema,
  schema => {
    debouncedSendSchema(schema)
  },
  { deep: true }
)
</script>

<style scoped>
.preview-iframe-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>

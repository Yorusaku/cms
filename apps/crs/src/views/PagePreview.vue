<template>
  <div class="page-preview-container">
    <SchemaRenderer :page-schema="pageStore.pageSchema" />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import SchemaRenderer from '../components/SchemaRenderer.vue'
import { usePageStore } from '../store/usePageStore'
import { MESSAGE_TYPE } from '@cms/types'
import type { IPageSchemaV2 } from '@cms/types'
import {
  MessageSequenceTracker,
  createSecureMessage,
  verifySecureMessage,
  validateOrigin,
  type SecureMessagePayload,
} from '@cms/utils'

const pageStore = usePageStore()

// 消息序列追踪器
const outgoingSequenceTracker = new MessageSequenceTracker()
const incomingSequenceTracker = new MessageSequenceTracker()

useEventListener(window, 'message', async (event: MessageEvent) => {
  // 验证来源
  if (!validateOrigin(event.origin)) {
    console.warn('拒绝来自未授权源的消息:', event.origin)
    return
  }

  try {
    const payload = event.data as SecureMessagePayload<IPageSchemaV2>

    // 验证安全消息
    const verification = await verifySecureMessage(payload, incomingSequenceTracker)

    if (!verification.valid) {
      console.warn('消息验证失败:', verification.error)
      return
    }

    // 处理验证通过的消息
    if (payload.type === MESSAGE_TYPE.SYNC_SCHEMA && verification.data) {
      pageStore.importPageSchema(verification.data)
    }
  } catch (error) {
    console.warn('处理消息失败:', error)
  }
})

// 发送选中事件到父窗口
const sendSelectEvent = async (componentId: string) => {
  if (!window.parent) return

  try {
    const securePayload = await createSecureMessage(
      MESSAGE_TYPE.ON_SELECT_BLOCK,
      { id: componentId },
      outgoingSequenceTracker
    )

    window.parent.postMessage(securePayload, '*')
  } catch (error) {
    console.warn('发送选中事件失败:', error)
  }
}
</script>

<style scoped>
.page-preview-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>

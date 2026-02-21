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
import type { IMessagePayload, IPageSchemaV2 } from '@cms/types'

const pageStore = usePageStore()

useEventListener(window, 'message', (event: MessageEvent) => {
  const payload = event.data as IMessagePayload<IPageSchemaV2>
  if (payload.type === MESSAGE_TYPE.SYNC_SCHEMA) {
    pageStore.importPageSchema(payload.data)
  }
})
</script>

<style scoped>
.page-preview-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>

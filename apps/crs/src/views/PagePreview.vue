<template>
  <div class="page-preview-container">
    <SchemaRenderer :page-schema="pageSchema" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SchemaRenderer from '../components/SchemaRenderer.vue'
import { MESSAGE_TYPE } from '@cms/types'
import type { IMessagePayload, IPageSchema } from '@cms/types'

const emptyPageSchema: IPageSchema = {
  pageConfig: {
    name: '页面标题',
    shareDesc: '',
    shareImage: '',
    backgroundColor: '',
    backgroundImage: '',
    backgroundPosition: 'top',
    cover: ''
  },
  components: []
}

const pageSchema = ref<IPageSchema>(emptyPageSchema)

const handleMessage = (event: MessageEvent) => {
  const payload = event.data as IMessagePayload<IPageSchema>
  if (payload.type === MESSAGE_TYPE.SYNC_SCHEMA) {
    pageSchema.value = payload.data
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<style scoped>
.page-preview-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IPageSchema } from '@cms/types'

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

export const usePageStore = defineStore('page', () => {
  const pageSchema = ref<IPageSchema>(emptyPageSchema)
  const previewId = ref<string | null>(null)

  const updateSchema = (schema: IPageSchema) => {
    pageSchema.value = schema
  }

  const setActiveId = (id: string) => {
    previewId.value = id
  }

  return {
    pageSchema,
    previewId,
    updateSchema,
    setActiveId
  }
})

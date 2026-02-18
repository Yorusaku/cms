import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { useRefHistory } from '@vueuse/core'
import { deepClone } from '@cms/utils'
import type { IPageSchema, IComponentSchema } from '@cms/types'

const generateId = (type: string): string => {
  return `${type}-${Math.random().toString(36).substr(2, 9)}`
}

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
  const setType = ref(1)
  const dialogImageVisible = ref(false)
  const upLoadImgSuccess = shallowRef<((...args: unknown[]) => void) | null>(null)
  const pageSchema = ref<IPageSchema>(deepClone(emptyPageSchema))
  const activeComponentId = ref<string | null>(null)
  const dragActive = ref(false)
  const dragComponent = shallowRef<Partial<IComponentSchema>>({})
  const addComponentIndex = ref<number | null>(null)
  const previewHeight = ref('')
  const componentsTopList = ref<number[]>([])

  const { history, undo, redo, canUndo, canRedo, commit } = useRefHistory(pageSchema, {
    capacity: 50,
    deep: true,
    dump: value => deepClone(value),
    parse: value => deepClone(value),
    flush: 'post'
  })

  const setInitPageSchema = () => {
    pageSchema.value = deepClone(emptyPageSchema)
    commit()
  }

  const setSetType = (value: number) => {
    setType.value = value
  }

  const setPageConfig = (config: Record<string, unknown>) => {
    pageSchema.value.pageConfig = { ...pageSchema.value.pageConfig, ...config }
    commit()
  }

  const setDialogImageVisible = (value: boolean) => {
    dialogImageVisible.value = value
  }

  const setUpLoadImgSuccess = (value: ((...args: unknown[]) => void) | null) => {
    upLoadImgSuccess.value = value
  }

  const setDragActive = (value: boolean) => {
    dragActive.value = value
  }

  const setDragComponent = (value: Partial<IComponentSchema>) => {
    dragComponent.value = value
  }

  const setDragIndex = (value: number | null) => {
    addComponentIndex.value = value
  }

  const setActiveId = (value: string | null) => {
    activeComponentId.value = value
  }

  const addComponent = ({
    index,
    type,
    props = {},
    styles = {}
  }: {
    index: number
    type: string
    props?: Record<string, unknown>
    styles?: Record<string, string>
  }) => {
    if (!type) {
      console.warn('addComponent: 组件类型不能为空')
      return
    }

    const component: IComponentSchema = {
      id: generateId(type),
      type,
      props: deepClone(props),
      styles: deepClone(styles)
    }

    const insertIndex = Math.max(0, Math.min(index, pageSchema.value.components.length))
    pageSchema.value.components.splice(insertIndex, 0, component)
    activeComponentId.value = component.id
    setType.value = 2
    addComponentIndex.value = null
    commit()
  }

  const deleteComponent = ({ index }: { index: number | 'all' }) => {
    if (index === 'all') {
      pageSchema.value.components = []
    } else if (
      typeof index === 'number' &&
      index >= 0 &&
      index < pageSchema.value.components.length
    ) {
      pageSchema.value.components.splice(index, 1)
    }
    commit()
  }

  const editComponent = ({
    id,
    props,
    styles
  }: {
    id: string
    props?: Record<string, unknown>
    styles?: Record<string, string>
  }) => {
    const component = pageSchema.value.components.find(item => item.id === id)
    if (component) {
      if (props) component.props = { ...component.props, ...props }
      if (styles) component.styles = { ...component.styles, ...styles }
      commit()
    }
  }

  const updatePageSchema = ({ data }: { data?: Partial<IPageSchema> }) => {
    if (data) {
      pageSchema.value = { ...pageSchema.value, ...data }
      commit()
    }
  }

  const updatePageHeight = ({ height, list }: { height: string; list: number[] }) => {
    previewHeight.value = height
    componentsTopList.value = list
  }

  const exportPageSchema = (): IPageSchema => {
    return deepClone(pageSchema.value)
  }

  const importPageSchema = (schema: IPageSchema) => {
    if (!schema || !Array.isArray(schema.components)) {
      console.warn('importPageSchema: 无效的页面 Schema')
      return
    }
    pageSchema.value = deepClone(schema)
    commit()
  }

  return {
    setType,
    dialogImageVisible,
    upLoadImgSuccess,
    pageSchema,
    activeComponentId,
    dragActive,
    dragComponent,
    addComponentIndex,
    previewHeight,
    componentsTopList,
    history,
    undo,
    redo,
    canUndo,
    canRedo,
    setInitPageSchema,
    setSetType,
    setPageConfig,
    setDialogImageVisible,
    setUpLoadImgSuccess,
    setDragActive,
    setDragComponent,
    setDragIndex,
    setActiveId,
    addComponent,
    deleteComponent,
    editComponent,
    updatePageSchema,
    updatePageHeight,
    exportPageSchema,
    importPageSchema
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Component {
  id?: string
  data: any
}

interface PageData {
  componentList: Component[]
}

export const usePageStore = defineStore('page', () => {
  const pageData = ref<PageData>({
    componentList: []
  })
  const previewId = ref<string | null>(null)
  const previewHeight = ref(0)
  const componentsTopList = ref<number[]>([])

  const addComponent = (com: any) => {
    pageData.value.componentList.push(com)
  }

  const deleteComponent = (id: string) => {
    const index = pageData.value.componentList.findIndex(item => item.id === id)
    pageData.value.componentList.splice(index, 1)
  }

  const changeSelected = (id: string) => {
    previewId.value = id
  }

  const changeComponent = ({ value }: { disabledRestHeight?: boolean; value: PageData }) => {
    pageData.value = value
  }

  const changeComponentPosition = (_data: any) => {}

  const setComponent = (data: any[]) => {
    pageData.value.componentList = data
  }

  const setPreview = (index: number) => {
    deletePreview()
    const previewComponent = {
      data: {
        component: 'blank'
      }
    }
    pageData.value.componentList.splice(index, 0, previewComponent)
  }

  const deletePreview = () => {
    pageData.value.componentList = pageData.value.componentList.filter(
      item => item.data.component !== 'blank'
    )
  }

  const setActiveId = (id: string) => {
    previewId.value = id
  }

  const getComponentsTop = () => {
    setTimeout(() => {
      const elements = document.getElementsByClassName('components')
      componentsTopList.value = []
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement
        componentsTopList.value.push(el.offsetTop + el.offsetHeight)
      }
      const wrap = document.getElementById('wrap')
      previewHeight.value = wrap ? wrap.offsetHeight : 0
    })
  }

  return {
    pageData,
    previewId,
    previewHeight,
    componentsTopList,
    addComponent,
    deleteComponent,
    changeSelected,
    changeComponent,
    changeComponentPosition,
    setComponent,
    setPreview,
    deletePreview,
    setActiveId,
    getComponentsTop
  }
})

export function adaptPageData(rawData: any) {
  if (rawData.pageConfig && Array.isArray(rawData.components)) {
    return rawData
  }

  if (rawData.componentList && Array.isArray(rawData.componentList)) {
    const processedData = JSON.parse(JSON.stringify(rawData))

    processedData.componentList.forEach((item: any) => {
      if (item.data && item.data.validTime && typeof item.data.validTime === 'string') {
        try {
          item.data.validTime = JSON.parse(item.data.validTime)
        } catch (e) {
          console.warn('解析 validTime 失败:', e)
          item.data.validTime = []
        }
      }
    })

    return {
      pageConfig: {
        id: processedData.id,
        name: processedData.name || '未命名页面',
        cover: processedData.cover || '',
        shareDesc: processedData.shareDesc || '',
        shareImage: processedData.shareImage || '',
        backgroundColor: processedData.backgroundColor || '',
        backgroundImage: processedData.backgroundImage || ''
      },
      components: processedData.componentList.map((item: any, index: number) => ({
        id: item.id?.toString() || `comp-${Date.now()}-${index}`,
        type: item.data?.component || 'Unknown',
        props: item.data || {},
        styles: {}
      }))
    }
  }

  console.warn('无法识别的数据格式，返回空Schema', rawData)
  return {
    pageConfig: { name: '未命名页面' },
    components: []
  }
}

export function adaptComponentData(componentData: any) {
  if (componentData.id && componentData.type && componentData.props) {
    return componentData
  }

  let componentType = componentData.data?.component || componentData.component || 'Unknown'

  const typeMap: Record<string, string> = {
    carousel: 'Carousel',
    dialog: 'Dialog',
    imagenav: 'ImageNav',
    notice: 'Notice',
    product: 'Product',
    richtext: 'RichText',
    slider: 'Slider',
    assistline: 'AssistLine',
    floatlayer: 'FloatLayer',
    onlineservice: 'OnlineService',
    cubeselection: 'CubeSelection'
  }

  if (typeMap[componentType.toLowerCase()]) {
    componentType = typeMap[componentType.toLowerCase()]
  }

  return {
    id: componentData.id?.toString() || `comp-${Date.now()}`,
    type: componentType,
    props: componentData.data || componentData || {},
    styles: {}
  }
}

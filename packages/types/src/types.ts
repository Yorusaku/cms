export interface ComponentConfig {
  id: string
  name: string
  data: Record<string, unknown>
  textColor?: string
  radius?: number
  marginTop?: number
}

export interface PageData {
  id: string
  name: string
  shareDesc: string
  shareImage: string
  backgroundColor: string
  backgroundImage: string
  backgroundPosition: string
  cover: string
  componentList: ComponentConfig[]
}

export interface MessageData {
  type: string
  value: unknown
}

export interface PostMessageType {
  pageHeightChange: 'pageHeightChange'
  pageChange: 'pageChange'
  setActive: 'setActive'
  deleteComponent: 'deleteComponent'
}

import type { ComponentItem } from '@/config/component-groups'

export interface MaterialConfig {
  componentGroups: Array<{
    title: string
    components: ComponentItem[]
  }>
  componentMap: Record<string, any>
  configMap: Record<string, any>
  componentDefaultConfigs: Record<string, unknown>
}

export interface DragComponent {
  type?: string
  [key: string]: unknown
}

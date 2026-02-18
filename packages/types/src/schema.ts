export interface IComponentSchema {
  id: string
  type: string
  props: Record<string, unknown>
  styles?: Record<string, string>
}

export interface IPageSchema {
  pageConfig: Record<string, unknown>
  components: IComponentSchema[]
}

export interface IMessagePayload<T = unknown> {
  type: string
  data: T
}

export const MESSAGE_TYPE = {
  SYNC_SCHEMA: 'SYNC_SCHEMA',
  SCHEMA_UPDATED: 'SCHEMA_UPDATED',
  ON_SELECT_BLOCK: 'ON_SELECT_BLOCK'
} as const

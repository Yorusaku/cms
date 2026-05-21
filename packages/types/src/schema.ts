// ==================== V1 基础类型 ====================
export interface IComponentSchemaBase {
  id: string;
  type: string;
  props: Record<string, unknown>;
  styles?: Record<string, string>;
}

export interface IPageSchemaBase {
  pageConfig: Record<string, unknown>;
  components: IComponentSchemaBase[];
}

export interface IComponentSchemaV1 extends IComponentSchemaBase {}
export interface IPageSchemaV1 extends IPageSchemaBase {}

// ==================== V2 类型定义 ====================
export interface IActionSchema {
  type: string;
  config: Record<string, unknown>;
  condition?: boolean | string;
}

export interface IComponentSchemaV2 extends IComponentSchemaBase {
  parentId: string | null;
  children: string[];
  events?: Record<string, IActionSchema[]>;
  condition?: boolean | string;
  track?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

export interface ILinkageConditionSchema {
  type: "simple" | "complex";
  expression?: string;
  operator?: "AND" | "OR";
  conditions?: ILinkageConditionSchema[];
}

export interface IComponentLinkage {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  sourceProperty: string;
  targetProperty: string;
  transformFn?: string;
  condition?: ILinkageConditionSchema;
  enabled: boolean;
}

export interface IPageSchemaV2 {
  version: "2.0.0";
  pageConfig: Record<string, unknown>;
  state?: Record<string, unknown>;
  componentMap: Record<string, IComponentSchemaV2>;
  rootIds: string[];
  linkages?: IComponentLinkage[];
  tracking?: {
    enabled?: boolean;
    context?: Record<string, unknown>;
  };
}

export type IComponentSchema = IComponentSchemaV2;
export type IPageSchema = IPageSchemaV2;

export interface IMessagePayload<T = unknown> {
  type: string;
  data: T;
}

export const MESSAGE_TYPE = {
  SYNC_SCHEMA: "SYNC_SCHEMA",
  SCHEMA_UPDATED: "SCHEMA_UPDATED",
  ON_SELECT_BLOCK: "ON_SELECT_BLOCK",
} as const;

export type MarketingTrackEventType =
  | "page_view"
  | "component_click"
  | "cta_click"
  | "form_submit";

export interface MarketingTrackEvent {
  eventType: MarketingTrackEventType;
  pageId?: number;
  componentId?: string;
  componentType?: string;
  ctaText?: string;
  payload?: Record<string, unknown>;
  utm?: Record<string, string>;
  channel?: Record<string, string>;
  timestamp?: number;
}

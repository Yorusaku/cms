export type MaterialGroupKey = "basic" | "marketing" | "business";

export interface MaterialVisibilityRule {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
  truthy?: boolean;
}

export interface MaterialFieldOption {
  label: string;
  value: string | number | boolean;
}

interface MaterialSchemaBase {
  label?: string;
  description?: string;
  visibleWhen?: MaterialVisibilityRule;
}

export interface MaterialSectionSchema extends MaterialSchemaBase {
  type: "section";
  fields: MaterialFieldSchema[];
}

interface MaterialInputFieldSchema extends MaterialSchemaBase {
  path: string;
  placeholder?: string;
}

export interface MaterialTextFieldSchema extends MaterialInputFieldSchema {
  type: "text" | "textarea" | "richText";
  rows?: number;
}

export interface MaterialNumberFieldSchema extends MaterialInputFieldSchema {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

export interface MaterialSwitchFieldSchema extends MaterialInputFieldSchema {
  type: "switch";
}

export interface MaterialSelectFieldSchema extends MaterialInputFieldSchema {
  type: "select";
  options: MaterialFieldOption[];
}

export interface MaterialColorFieldSchema extends MaterialInputFieldSchema {
  type: "color";
}

export interface MaterialImageFieldSchema extends MaterialInputFieldSchema {
  type: "image";
  uploadText?: string;
}

export interface MaterialLinkFieldSchema extends MaterialInputFieldSchema {
  type: "link";
}

export interface MaterialArrayItemSchema {
  key: string;
  type: "text" | "image" | "link" | "number";
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface MaterialArrayFieldSchema extends MaterialSchemaBase {
  type: "array";
  path: string;
  itemSchema: MaterialArrayItemSchema[];
  addText?: string;
  limit?: number;
  preset?: "picList";
  showImage?: boolean;
  showText?: boolean;
}

export type MaterialFieldSchema =
  | MaterialSectionSchema
  | MaterialTextFieldSchema
  | MaterialNumberFieldSchema
  | MaterialSwitchFieldSchema
  | MaterialSelectFieldSchema
  | MaterialColorFieldSchema
  | MaterialImageFieldSchema
  | MaterialLinkFieldSchema
  | MaterialArrayFieldSchema;

export interface MaterialEditorSchema {
  sections: MaterialSectionSchema[];
}

export type MaterialEditorConfig<TLegacyComponent = string> =
  | {
      mode: "schema";
      schema: MaterialEditorSchema;
    }
  | {
      mode: "legacy";
      component: TLegacyComponent;
    };

export interface MaterialDefinition<
  TRuntimeComponent = unknown,
  TLegacyComponent = string,
  TProps extends Record<string, unknown> = Record<string, unknown>,
> {
  type: string;
  aliases?: string[];
  group: MaterialGroupKey;
  label: string;
  icon: string;
  maxCount: number;
  defaultProps: TProps;
  runtimeComponent: TRuntimeComponent;
  editorConfig: MaterialEditorConfig<TLegacyComponent>;
  /**
   * 受控的运行时事件属性：组件通过 emits 产出的、可供联动消费的属性名。
   *
   * 与 `defaultProps` 的区别：props 是静态配置（编辑端可改，存进 schema），
   * 这些是运行时状态（由组件在用户交互后 emit，只在渲染端存在）。
   * 联动配置面板会把它们与 props 分组展示，因此这里只登记明确支持的事件属性，
   * 不要为「以后可能用到」预先添加。
   */
  runtimeEventProperties?: string[];
  normalizeProps?: (props: Record<string, unknown>) => TProps;
  toRuntimeProps?: (
    props: Record<string, unknown>,
  ) => Record<string, unknown>;
}

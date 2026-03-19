export type MaterialGroupKey = "basic" | "marketing";

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
  normalizeProps?: (props: Record<string, unknown>) => TProps;
  toRuntimeProps?: (
    props: Record<string, unknown>,
  ) => Record<string, unknown>;
}

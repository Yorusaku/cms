import type {
  IPageSchemaV2,
  MaterialFieldSchema,
  MaterialVisibilityRule,
} from "@cms/types";
import { resolveMaterialDefinition } from "@cms/ui";

export interface PreflightIssue {
  componentId?: string;
  materialType?: string;
  fieldPath?: string;
  message: string;
}

export interface PreflightResult {
  ok: boolean;
  issues: PreflightIssue[];
}

const isBlankString = (value: unknown) =>
  typeof value !== "string" || value.trim() === "";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const getPathValue = (target: Record<string, unknown>, path: string): unknown =>
  path.split(".").reduce<unknown>((currentValue, segment) => {
    if (!currentValue || typeof currentValue !== "object") {
      return undefined;
    }
    return (currentValue as Record<string, unknown>)[segment];
  }, target);

const hasValidLink = (value: unknown): boolean => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  const data = toRecord(toRecord(value).data);
  const url = data.url;
  return typeof url === "string" && url.trim().length > 0;
};

const isVisible = (
  componentProps: Record<string, unknown>,
  rule?: MaterialVisibilityRule,
) => {
  if (!rule) {
    return true;
  }

  const currentValue = getPathValue(componentProps, rule.field);

  if (rule.truthy) {
    return Boolean(currentValue);
  }

  if (rule.in) {
    return rule.in.includes(currentValue);
  }

  if (rule.notEquals !== undefined) {
    return currentValue !== rule.notEquals;
  }

  if (rule.equals !== undefined) {
    return currentValue === rule.equals;
  }

  return true;
};

const validateField = (
  field: Exclude<MaterialFieldSchema, { type: "section" }>,
  componentProps: Record<string, unknown>,
): string | null => {
  if (!isVisible(componentProps, field.visibleWhen)) {
    return null;
  }

  const value = getPathValue(componentProps, field.path);
  const label = field.label || field.path;

  if (
    field.type === "text" ||
    field.type === "textarea" ||
    field.type === "richText"
  ) {
    if (isBlankString(value)) {
      return `字段「${label}」不能为空`;
    }
    return null;
  }

  if (field.type === "image") {
    if (isBlankString(value)) {
      return `字段「${label}」缺少图片`;
    }
    return null;
  }

  if (field.type === "link") {
    if (!hasValidLink(value)) {
      return `字段「${label}」缺少有效链接`;
    }
    return null;
  }

  if (field.type === "array") {
    const list = Array.isArray(value) ? value : [];
    const hasKeyField = field.itemSchema.some(
      (item) =>
        item.type === "text" || item.type === "image" || item.type === "link",
    );

    if (hasKeyField && list.length === 0) {
      return `字段「${label}」至少需要 1 条数据`;
    }

    for (let index = 0; index < list.length; index += 1) {
      const item = toRecord(list[index]);
      for (const schema of field.itemSchema) {
        const itemValue = item[schema.key];
        if (schema.type === "text" && isBlankString(itemValue)) {
          return `字段「${label}」第 ${index + 1} 项文本不能为空`;
        }
        if (schema.type === "image" && isBlankString(itemValue)) {
          return `字段「${label}」第 ${index + 1} 项缺少图片`;
        }
        if (schema.type === "link" && !hasValidLink(itemValue)) {
          return `字段「${label}」第 ${index + 1} 项缺少有效链接`;
        }
      }
    }
  }

  return null;
};

const getRenderableFields = (
  fields: MaterialFieldSchema[],
): Array<Exclude<MaterialFieldSchema, { type: "section" }>> => {
  return fields.filter((field) => field.type !== "section");
};

export const runPagePreflight = (schema: IPageSchemaV2): PreflightResult => {
  const issues: PreflightIssue[] = [];
  const pageName = schema.pageConfig?.name;

  if (isBlankString(pageName)) {
    issues.push({
      fieldPath: "pageConfig.name",
      message: "页面标题不能为空",
    });
  }

  if (!schema.rootIds.length) {
    issues.push({
      fieldPath: "rootIds",
      message: "页面至少需要 1 个组件",
    });
  }

  for (const componentId of schema.rootIds) {
    const component = schema.componentMap[componentId];
    if (!component) {
      continue;
    }

    const definition = resolveMaterialDefinition(component.type);
    if (!definition) {
      issues.push({
        componentId,
        materialType: component.type,
        message: `组件「${component.type}」未找到对应物料定义`,
      });
      continue;
    }

    if (definition.editorConfig.mode !== "schema") {
      continue;
    }

    const materialName = definition.label || definition.type;
    const componentProps = toRecord(component.props);
    for (const section of definition.editorConfig.schema.sections) {
      for (const field of getRenderableFields(section.fields)) {
        const errorMessage = validateField(field, componentProps);
        if (!errorMessage) {
          continue;
        }

        issues.push({
          componentId,
          materialType: definition.type,
          fieldPath: field.path,
          message: `组件「${materialName}」${errorMessage}`,
        });
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};

import { defineAsyncComponent, markRaw } from "vue";
import type { Component } from "vue";
import type {
  IComponentSchemaV2,
  IPageSchemaV2,
  MaterialGroupKey,
} from "@cms/types";
import { deepClone } from "@cms/utils";
import { materialRegistry, type MaterialRegistryItem } from "./definitions";
import { isVueModule, toRecord } from "./helpers";

const materialDefinitionMap = new Map<string, MaterialRegistryItem>();
const materialAliasMap = new Map<string, string>();
const asyncComponentCache = new Map<
  string,
  Component | ReturnType<typeof defineAsyncComponent>
>();

const materialGroupLabels: Record<MaterialGroupKey, string> = {
  basic: "基础组件",
  marketing: "营销组件",
};

for (const material of materialRegistry) {
  materialDefinitionMap.set(material.type, material);
  materialAliasMap.set(material.type.toLowerCase(), material.type);

  for (const alias of material.aliases ?? []) {
    materialAliasMap.set(alias.toLowerCase(), material.type);
  }
}

export function normalizeMaterialType(type: string): string {
  const normalizedType = materialAliasMap.get(type.toLowerCase());
  return normalizedType ?? type;
}

export function resolveMaterialDefinition(
  type: string,
): MaterialRegistryItem | undefined {
  return materialDefinitionMap.get(normalizeMaterialType(type));
}

export function getMaterialDefaults(type: string): Record<string, unknown> {
  const definition = resolveMaterialDefinition(type);
  return deepClone(definition?.defaultProps ?? {});
}

export function resolveMaterialRuntimeProps(
  type: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const definition = resolveMaterialDefinition(type);
  if (!definition?.toRuntimeProps) {
    return props;
  }

  return definition.toRuntimeProps(props);
}

export function getMaterialAsyncComponent(type: string) {
  const normalizedType = normalizeMaterialType(type);
  const cached = asyncComponentCache.get(normalizedType);
  if (cached) {
    return cached;
  }

  const definition = resolveMaterialDefinition(normalizedType);
  if (!definition) {
    return null;
  }

  const asyncComponent = markRaw(
    defineAsyncComponent(async () => {
      const component = await definition.runtimeComponent();
      return isVueModule(component) ? component.default : component;
    }),
  );

  asyncComponentCache.set(normalizedType, asyncComponent);
  return asyncComponent;
}

export function getMaterialGroups() {
  const groups: Array<{
    key: MaterialGroupKey;
    label: string;
    materials: MaterialRegistryItem[];
  }> = [];

  (Object.keys(materialGroupLabels) as MaterialGroupKey[]).forEach((groupKey) => {
    groups.push({
      key: groupKey,
      label: materialGroupLabels[groupKey],
      materials: materialRegistry.filter((material) => material.group === groupKey),
    });
  });

  return groups;
}

export function normalizePageSchemaMaterials(
  schema: IPageSchemaV2,
): IPageSchemaV2 {
  const normalizedSchema = deepClone(schema);

  Object.keys(normalizedSchema.componentMap).forEach((componentId) => {
    const component = normalizedSchema.componentMap[componentId];
    const definition = resolveMaterialDefinition(component.type);
    if (!definition) {
      return;
    }

    component.type = definition.type;

    if (definition.normalizeProps) {
      component.props = definition.normalizeProps(toRecord(component.props));
    }
  });

  normalizedSchema.rootIds = normalizedSchema.rootIds.filter((componentId) =>
    Boolean(normalizedSchema.componentMap[componentId]),
  );

  return normalizedSchema;
}

export function getOrderedComponents(schema: IPageSchemaV2): IComponentSchemaV2[] {
  return schema.rootIds
    .map((componentId) => schema.componentMap[componentId])
    .filter(Boolean);
}

export { materialRegistry };

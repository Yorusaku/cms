<template>
  <div class="material-config-renderer">
    <section
      v-for="section in visibleSections"
      :key="section.label"
      class="config-section"
    >
      <header class="section-header" @click="toggleSection(section.label)">
        <h4 class="section-title">{{ section.label }}</h4>
        <p v-if="section.description" class="section-description">
          {{ section.description }}
        </p>
      </header>

      <div v-if="isSectionExpanded(section.label)" class="section-fields">
        <div
          v-for="field in getRenderableFields(section.fields)"
          :key="`${field.type}-${field.path}`"
          v-show="isVisible(field.visibleWhen)"
          class="field-item"
          :class="{ 'field-item-array': field.type === 'array' }"
        >
          <div class="field-header">
            <span class="field-label">{{ field.label }}</span>
            <span v-if="field.description" class="field-description">
              {{ field.description }}
            </span>
          </div>

          <MaterialFieldRenderer
            :field="field"
            :model-value="getValue(field.path)"
            @update="handleFieldUpdate(field.path, $event)"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import type {
  MaterialFieldSchema,
  MaterialSectionSchema,
  MaterialVisibilityRule,
} from "@cms/types";
import { deepClone } from "@cms/utils";
import { resolveMaterialDefinition } from "@cms/ui";
import MaterialFieldRenderer from "./MaterialFieldRenderer.vue";

type MaterialRenderableField = Exclude<MaterialFieldSchema, MaterialSectionSchema>;

const props = withDefaults(
  defineProps<{
    materialType: string;
    componentProps: Record<string, unknown>;
    batchMode?: boolean;
  }>(),
  {
    batchMode: false,
  },
);

const emit = defineEmits<{
  (e: "update", props: Record<string, unknown>): void;
}>();

const draftProps = ref<Record<string, unknown>>(deepClone(props.componentProps));
const expandedSections = ref<Set<string>>(new Set());

const materialDefinition = computed(() =>
  resolveMaterialDefinition(props.materialType),
);

const materialSchema = computed(() => {
  if (materialDefinition.value?.editorConfig.mode !== "schema") {
    return null;
  }

  return materialDefinition.value.editorConfig.schema;
});

function isVisible(rule?: MaterialVisibilityRule) {
  if (!rule) {
    return true;
  }

  const currentValue = getValue(rule.field);

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
}

const visibleSections = computed(
  () =>
    materialSchema.value?.sections.filter((section) =>
      isVisible(section.visibleWhen),
    ) ?? [],
);

watch(
  () => props.componentProps,
  (value) => {
    draftProps.value = deepClone(value);
  },
  { deep: true },
);

watch(
  visibleSections,
  (sections) => {
    if (expandedSections.value.size === 0 && sections.length > 0) {
      expandedSections.value = new Set(sections.map((section) => section.label));
    }
  },
  { immediate: true },
);

const debouncedEmit = useDebounceFn(() => {
  emit("update", deepClone(draftProps.value));
}, 200);

const throttledEmitForBatch = useDebounceFn(() => {
  emit("update", deepClone(draftProps.value));
}, 300);

const getRenderableFields = (
  fields: MaterialFieldSchema[],
): MaterialRenderableField[] => {
  return fields.filter(
    (field): field is MaterialRenderableField => field.type !== "section",
  );
};

const getValue = (path: string) =>
  path.split(".").reduce<unknown>((currentValue, segment) => {
    if (!currentValue || typeof currentValue !== "object") {
      return undefined;
    }

    return (currentValue as Record<string, unknown>)[segment];
  }, draftProps.value);

const setValue = (path: string, value: unknown) => {
  const segments = path.split(".");
  let currentValue: Record<string, unknown> = draftProps.value;

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      currentValue[segment] = value;
      return;
    }

    const nextValue = currentValue[segment];
    if (!nextValue || typeof nextValue !== "object") {
      currentValue[segment] = {};
    }

    currentValue = currentValue[segment] as Record<string, unknown>;
  });
};

const handleFieldUpdate = (path: string, value: unknown) => {
  setValue(path, value);
  if (props.batchMode) {
    throttledEmitForBatch();
    return;
  }

  debouncedEmit();
};

const isSectionExpanded = (label: string) => expandedSections.value.has(label);

const toggleSection = (label: string) => {
  const next = new Set(expandedSections.value);
  if (next.has(label)) {
    next.delete(label);
  } else {
    next.add(label);
  }
  expandedSections.value = next;
};
</script>

<style scoped>
.material-config-renderer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  padding: 16px;
  border-bottom: 1px solid #f2f3f5;
  background: #fafafa;
  cursor: pointer;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.section-description {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}

.section-fields {
  display: flex;
  flex-direction: column;
}

.field-item {
  padding: 16px;
  border-top: 1px solid #f5f7fa;
}

.field-item:first-child {
  border-top: none;
}

.field-item-array {
  background: #f7f8fa;
}

.field-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.field-description {
  font-size: 12px;
  color: #909399;
}
</style>

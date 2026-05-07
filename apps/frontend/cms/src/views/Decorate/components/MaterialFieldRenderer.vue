<template>
  <el-input
    v-if="field.type === 'text'"
    :model-value="stringValue"
    :placeholder="field.placeholder"
    @update:model-value="emitUpdate"
  />

  <el-input
    v-else-if="field.type === 'textarea' || field.type === 'richText'"
    :model-value="stringValue"
    type="textarea"
    :rows="field.rows ?? (field.type === 'richText' ? 8 : 4)"
    :placeholder="field.placeholder"
    :input-style="
      field.type === 'richText'
        ? { fontFamily: 'monospace', fontSize: '12px' }
        : undefined
    "
    @update:model-value="emitUpdate"
  />

  <el-input-number
    v-else-if="field.type === 'number'"
    :model-value="numberValue"
    controls-position="right"
    :min="field.min"
    :max="field.max"
    :step="field.step"
    @update:model-value="emitUpdate"
  />

  <el-switch
    v-else-if="field.type === 'switch'"
    :model-value="booleanValue"
    @update:model-value="emitUpdate"
  />

  <el-select
    v-else-if="field.type === 'select'"
    :model-value="modelValue"
    class="w-full"
    @update:model-value="emitUpdate"
  >
    <el-option
      v-for="option in field.options"
      :key="String(option.value)"
      :label="option.label"
      :value="option.value"
    />
  </el-select>

  <div v-else-if="field.type === 'color'" class="field-inline">
    <el-color-picker
      :model-value="stringValue"
      @update:model-value="emitUpdate"
    />
    <span class="field-value">{{ stringValue || "未设置" }}</span>
  </div>

  <UpLoadBox
    v-else-if="field.type === 'image'"
    :img-url="stringValue"
    :add-place-holder="field.uploadText || '上传图片'"
    @update:img-url="emitUpdate"
  />

  <ConfigLink
    v-else-if="field.type === 'link'"
    :link-obj="linkValue"
    @update:link-obj="emitUpdate"
  />

  <PicList
    v-else-if="field.type === 'array' && field.preset === 'picList'"
    :image-list="arrayValue"
    :show-pic="field.showImage ?? true"
    :show-name="field.showText ?? true"
    :show-add="true"
    :limit-size="field.limit ?? 10"
    :add-place-holder="field.addText || '添加项'"
    @update:image-list="emitUpdate"
  />

  <div v-else-if="field.type === 'array'" class="array-editor">
    <div
      v-for="(item, index) in arrayObjectValue"
      :key="`${index}-${item.id ?? index}`"
      class="array-item"
    >
      <div class="array-item-header">
        <span class="array-item-title">#{{ index + 1 }}</span>
        <el-button
          type="danger"
          link
          size="small"
          @click="removeArrayItem(index)"
        >
          删除
        </el-button>
      </div>

      <div class="array-item-fields">
        <div
          v-for="itemField in field.itemSchema"
          :key="`${index}-${itemField.key}`"
          class="array-item-field"
        >
          <span class="array-item-label">
            {{ itemField.label || itemField.key }}
          </span>

          <el-input
            v-if="itemField.type === 'text'"
            :model-value="toStringValue(item[itemField.key])"
            :placeholder="itemField.placeholder"
            @update:model-value="
              updateArrayItemField(index, itemField.key, $event)
            "
          />

          <el-input-number
            v-else-if="itemField.type === 'number'"
            :model-value="toNumberValue(item[itemField.key])"
            controls-position="right"
            :min="itemField.min"
            :max="itemField.max"
            :step="itemField.step"
            @update:model-value="
              updateArrayItemField(index, itemField.key, $event)
            "
          />

          <UpLoadBox
            v-else-if="itemField.type === 'image'"
            :img-url="toStringValue(item[itemField.key])"
            :add-place-holder="itemField.placeholder || '上传图片'"
            @update:img-url="
              updateArrayItemField(index, itemField.key, $event)
            "
          />

          <ConfigLink
            v-else-if="itemField.type === 'link'"
            :link-obj="toLinkValue(item[itemField.key])"
            @update:link-obj="
              updateArrayItemField(index, itemField.key, $event)
            "
          />

          <div v-else class="field-unsupported">
            暂不支持 {{ itemField.type }} 字段
          </div>
        </div>
      </div>
    </div>

    <el-button
      type="primary"
      plain
      class="array-add-btn"
      @click="addArrayItem(field)"
    >
      {{ field.addText || "添加项" }}
    </el-button>
  </div>

  <div v-else class="field-unsupported">
    暂不支持 {{ field.type }} 字段
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  MaterialArrayFieldSchema,
  MaterialArrayItemSchema,
  MaterialFieldSchema,
  MaterialSectionSchema,
} from "@cms/types";
import ConfigLink from "@/components/basic/ConfigLink.vue";
import PicList from "@/components/basic/PicList.vue";
import UpLoadBox from "@/components/basic/UpLoadBox.vue";

type MaterialRenderableField = Exclude<MaterialFieldSchema, MaterialSectionSchema>;

const props = defineProps<{
  field: MaterialRenderableField;
  modelValue: unknown;
}>();

const emit = defineEmits<{
  (e: "update", value: unknown): void;
}>();

const stringValue = computed(() =>
  typeof props.modelValue === "string" ? props.modelValue : "",
);

const numberValue = computed(() => {
  if (typeof props.modelValue === "number" && Number.isFinite(props.modelValue)) {
    return props.modelValue;
  }
  return 0;
});

const booleanValue = computed(() => props.modelValue === true);

const arrayValue = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
);

const arrayObjectValue = computed(() =>
  arrayValue.value.map((item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? (item as Record<string, unknown>)
      : {},
  ),
);

const linkValue = computed(() => {
  return toLinkValue(props.modelValue);
});

const emitUpdate = (value: unknown) => {
  emit("update", value);
};

const toStringValue = (value: unknown) => {
  return typeof value === "string" ? value : "";
};

const toNumberValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }
  return 0;
};

const toLinkValue = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "clickType" in (value as Record<string, unknown>)
  ) {
    return value as { clickType: number; data: unknown };
  }
  return {
    clickType: 0,
    data: null,
  };
};

const createDefaultArrayItem = (schema: MaterialArrayItemSchema[]) => {
  const nextItem: Record<string, unknown> = {};
  schema.forEach((itemField) => {
    if (itemField.type === "link") {
      nextItem[itemField.key] = { clickType: 0, data: null };
      return;
    }
    if (itemField.type === "number") {
      nextItem[itemField.key] = 0;
      return;
    }
    nextItem[itemField.key] = "";
  });
  return nextItem;
};

const updateArrayItemField = (index: number, key: string, value: unknown) => {
  const nextArray = arrayObjectValue.value.map((item) => ({ ...item }));
  const targetItem = nextArray[index] ?? {};
  targetItem[key] = value;
  nextArray[index] = targetItem;
  emitUpdate(nextArray);
};

const removeArrayItem = (index: number) => {
  const nextArray = arrayObjectValue.value.filter((_, itemIndex) => itemIndex !== index);
  emitUpdate(nextArray);
};

const addArrayItem = (field: MaterialArrayFieldSchema) => {
  const nextArray = arrayObjectValue.value.map((item) => ({ ...item }));
  if (field.limit && nextArray.length >= field.limit) {
    return;
  }
  nextArray.push(createDefaultArrayItem(field.itemSchema));
  emitUpdate(nextArray);
};
</script>

<style scoped>
.field-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-value {
  font-size: 12px;
  color: #606266;
}

.field-unsupported {
  font-size: 12px;
  color: #909399;
}

.array-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.array-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.array-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.array-item-title {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}

.array-item-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.array-item-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.array-item-label {
  font-size: 12px;
  color: #606266;
}

.array-add-btn {
  align-self: flex-start;
}
</style>

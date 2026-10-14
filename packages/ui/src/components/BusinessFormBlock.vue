<template>
  <section class="business-form-block" :style="styles">
    <header v-if="title || subtitle" class="form-header">
      <h3 v-if="title">{{ title }}</h3>
      <p v-if="subtitle">{{ subtitle }}</p>
    </header>

    <form class="business-form" @submit.prevent="handleSubmit">
      <label v-for="field in normalizedFields" :key="field.key" class="form-field">
        <span class="field-label">
          {{ field.label }}<b v-if="field.required">*</b>
        </span>
        <select
          v-if="field.type === 'select'"
          v-model="form[field.key]"
          class="field-control"
        >
          <option value="">{{ field.placeholder || "请选择" }}</option>
          <option v-for="option in field.options" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <input
          v-else
          v-model="form[field.key]"
          class="field-control"
          :type="field.type"
          :placeholder="field.placeholder || `请输入${field.label}`"
        />
      </label>

      <button class="submit-button" type="submit" :disabled="submitting">
        {{ submitting ? "提交中..." : submitText }}
      </button>
    </form>

    <p v-if="message" class="form-message" :class="messageType">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";

export interface BusinessFormField {
  key: string;
  label: string;
  type: "text" | "date" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface Props {
  title?: string;
  subtitle?: string;
  submitText?: string;
  fields?: BusinessFormField[];
  styles?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  title: "信息登记",
  subtitle: "请填写以下信息",
  submitText: "提交信息",
  fields: () => [
    { key: "name", label: "姓名", type: "text", required: true },
    { key: "phone", label: "联系电话", type: "text", required: true },
  ],
  styles: () => ({}),
});

const emit = defineEmits<{ submit: [Record<string, string>] }>();
const form = reactive<Record<string, string>>({});
const submitting = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");

const normalizedFields = computed(() => props.fields.filter((field) => field.key && field.label));

const resetForm = () => {
  Object.keys(form).forEach((key) => delete form[key]);
  normalizedFields.value.forEach((field) => {
    form[field.key] = "";
  });
};

watch(normalizedFields, resetForm, { immediate: true });

const handleSubmit = async () => {
  const missing = normalizedFields.value.find((field) => field.required && !form[field.key]?.trim());
  if (missing) {
    messageType.value = "error";
    message.value = `请填写${missing.label}`;
    return;
  }

  submitting.value = true;
  message.value = "";
  try {
    emit("submit", { ...form });
    messageType.value = "success";
    message.value = "提交成功，我们会尽快处理";
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.business-form-block { padding: 20px; background: #fff; border-radius: 10px; }
.form-header h3 { margin: 0; color: #1f2937; font-size: 18px; }
.form-header p { margin: 6px 0 16px; color: #6b7280; font-size: 13px; }
.business-form { display: grid; gap: 14px; }
.form-field { display: grid; gap: 6px; }
.field-label { color: #374151; font-size: 13px; }
.field-label b { color: #ef4444; margin-left: 3px; }
.field-control { min-height: 38px; padding: 0 10px; border: 1px solid #d1d5db; border-radius: 6px; font: inherit; }
.submit-button { min-height: 40px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; cursor: pointer; }
.submit-button:disabled { cursor: wait; opacity: .7; }
.form-message { margin: 12px 0 0; font-size: 13px; }
.form-message.success { color: #16a34a; }
.form-message.error { color: #dc2626; }
</style>

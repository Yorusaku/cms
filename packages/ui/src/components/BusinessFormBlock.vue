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

      <label v-if="privacyRequired" class="form-consent">
        <input v-model="consentAccepted" type="checkbox" />
        <span>我已阅读并同意隐私政策</span>
      </label>

      <button class="submit-button" type="submit" :disabled="submitting">
        {{ submitting ? submittingText : submitText }}
      </button>
    </form>

    <p v-if="message" class="form-message" :class="messageType">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  PHONE_NUMBER_REG,
  REMARK_MAX_LENGTH,
  createRequestId,
  getMarketingParams,
  getTrackingSessionId,
  submitLeadRequest,
  trackFormSubmitRequest,
} from "../utils/form-submit";

export interface BusinessFormField {
  key: string;
  label: string;
  type: "text" | "date" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

/** 映射到线索姓名/手机号的字段 key，其余字段进 remark */
const NAME_FIELD_KEY = "name";
const PHONE_FIELD_KEYS = ["phone", "phoneNumber"];

interface Props {
  title?: string;
  subtitle?: string;
  submitText?: string;
  submittingText?: string;
  successText?: string;
  errorText?: string;
  fields?: BusinessFormField[];
  pageId?: number;
  publishedVersionId?: string;
  endpoint?: string;
  trackingEndpoint?: string;
  trackingEnabled?: boolean;
  privacyRequired?: boolean;
  styles?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  title: "信息登记",
  subtitle: "请填写以下信息",
  submitText: "提交信息",
  submittingText: "提交中...",
  successText: "提交成功，我们会尽快处理",
  errorText: "提交失败，请稍后重试",
  fields: () => [
    { key: "name", label: "姓名", type: "text", required: true },
    { key: "phone", label: "联系电话", type: "text", required: true },
  ],
  pageId: 0,
  publishedVersionId: "",
  endpoint: "/atlas-cms/submitLead",
  trackingEndpoint: "/atlas-cms/trackEvent",
  trackingEnabled: true,
  privacyRequired: true,
  styles: () => ({}),
});

const emit = defineEmits<{ submit: [Record<string, string>] }>();
const form = reactive<Record<string, string>>({});
const submitting = ref(false);
const consentAccepted = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");

/** 同一轮提交内复用 requestId，重试时保持幂等 */
const pendingRequestId = ref<string | null>(null);

const normalizedFields = computed(() => props.fields.filter((field) => field.key && field.label));

const nameField = computed(() =>
  normalizedFields.value.find((field) => field.key === NAME_FIELD_KEY),
);

const phoneField = computed(() =>
  normalizedFields.value.find((field) => PHONE_FIELD_KEYS.includes(field.key)),
);

const resetForm = () => {
  Object.keys(form).forEach((key) => delete form[key]);
  normalizedFields.value.forEach((field) => {
    form[field.key] = "";
  });
};

watch(normalizedFields, resetForm, { immediate: true });

const readPhoneValue = (): string => {
  const field = phoneField.value;
  return field ? (form[field.key] ?? "").trim() : "";
};

/**
 * 扩展字段序列化为 remark（JSON 字符串），例如 {"预约日期":"2026-10-20","业务类型":"咨询"}。
 * 只收集非空的扩展字段，姓名/手机号已由 DTO 专属字段承载。
 */
const buildRemark = (): string | undefined => {
  const reservedKeys = [NAME_FIELD_KEY, ...PHONE_FIELD_KEYS];
  const extra: Record<string, string> = {};

  normalizedFields.value.forEach((field) => {
    if (reservedKeys.includes(field.key)) return;
    const value = (form[field.key] ?? "").trim();
    if (value) extra[field.label] = value;
  });

  return Object.keys(extra).length > 0 ? JSON.stringify(extra) : undefined;
};

const handleSubmit = async () => {
  message.value = "";

  const missing = normalizedFields.value.find((field) => field.required && !form[field.key]?.trim());
  if (missing) {
    messageType.value = "error";
    message.value = `请填写${missing.label}`;
    return;
  }

  // 配置校验：提交链路依赖 name 与 phone 字段，缺失时不发请求
  if (!nameField.value) {
    messageType.value = "error";
    message.value = "表单配置错误：缺少姓名（name）字段";
    return;
  }
  if (!phoneField.value) {
    messageType.value = "error";
    message.value = "表单配置错误：缺少手机号（phone）字段";
    return;
  }

  const phoneValue = readPhoneValue();
  if (!PHONE_NUMBER_REG.test(phoneValue)) {
    messageType.value = "error";
    message.value = "请输入正确手机号";
    return;
  }

  if (props.privacyRequired && !consentAccepted.value) {
    messageType.value = "error";
    message.value = "请先同意隐私政策";
    return;
  }

  if (!props.pageId || !props.publishedVersionId) {
    messageType.value = "error";
    message.value = "页面版本无效，请刷新后重试";
    return;
  }

  const remark = buildRemark();
  if (remark && remark.length > REMARK_MAX_LENGTH) {
    messageType.value = "error";
    message.value = "备注内容过长，请缩减后提交";
    return;
  }

  submitting.value = true;
  try {
    const marketing = getMarketingParams();
    pendingRequestId.value ??= createRequestId();

    await submitLeadRequest(
      {
        requestId: pendingRequestId.value,
        name: (form[NAME_FIELD_KEY] ?? "").trim(),
        phoneNumber: phoneValue,
        remark,
        pageId: props.pageId,
        publishedVersionId: props.publishedVersionId,
        sessionId: getTrackingSessionId(),
        utm: marketing.utm,
        channel: marketing.channel,
        // privacyRequired 为 false 时无需勾选，按已同意上报
        consentAccepted: props.privacyRequired ? consentAccepted.value : true,
      },
      props.endpoint,
    );

    if (props.trackingEnabled) {
      try {
        await trackFormSubmitRequest(
          {
            eventType: "form_submit",
            pageId: props.pageId,
            publishedVersionId: props.publishedVersionId,
            payload: { formType: "business_form" },
            utm: marketing.utm,
            channel: marketing.channel,
          },
          props.trackingEndpoint,
        );
      } catch {
        // 埋点失败不影响提交结果
      }
    }

    emit("submit", { ...form });
    messageType.value = "success";
    message.value = props.successText;
    resetForm();
    consentAccepted.value = false;
    pendingRequestId.value = null;
  } catch {
    messageType.value = "error";
    message.value = props.errorText;
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
.form-consent { display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 12px; }
.submit-button { min-height: 40px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; cursor: pointer; }
.submit-button:disabled { cursor: wait; opacity: .7; }
.form-message { margin: 12px 0 0; font-size: 13px; }
.form-message.success { color: #16a34a; }
.form-message.error { color: #dc2626; }
</style>

<template>
  <div class="lead-form-block" :style="wrapperStyle">
    <h3 class="lead-title">{{ title }}</h3>
    <p v-if="subtitle" class="lead-subtitle">{{ subtitle }}</p>

    <form class="lead-form" @submit.prevent="handleSubmit">
      <input
        v-model.trim="form.name"
        class="lead-input"
        type="text"
        :placeholder="namePlaceholder"
      />
      <input
        v-model.trim="form.phoneNumber"
        class="lead-input"
        type="tel"
        maxlength="11"
        :placeholder="phonePlaceholder"
      />
      <textarea
        v-model.trim="form.remark"
        class="lead-textarea"
        rows="3"
        :placeholder="remarkPlaceholder"
      />
      <label v-if="privacyRequired" class="lead-consent">
        <input v-model="consentAccepted" type="checkbox" />
        <span>我已阅读并同意隐私政策</span>
      </label>
      <button class="lead-submit" :disabled="submitting" type="submit">
        {{ submitting ? submittingText : submitText }}
      </button>
    </form>

    <p v-if="message" class="lead-message" :class="messageType">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  PHONE_NUMBER_REG,
  createRequestId,
  getMarketingParams,
  getTrackingSessionId,
  submitLeadRequest,
  trackFormSubmitRequest,
} from "../utils/form-submit";

interface Props {
  title?: string;
  subtitle?: string;
  submitText?: string;
  submittingText?: string;
  successText?: string;
  errorText?: string;
  namePlaceholder?: string;
  phonePlaceholder?: string;
  remarkPlaceholder?: string;
  pageId?: number;
  publishedVersionId?: string;
  endpoint?: string;
  trackingEndpoint?: string;
  trackingEnabled?: boolean;
  privacyRequired?: boolean;
  styles?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  title: "线索收集",
  subtitle: "",
  submitText: "立即提交",
  submittingText: "提交中...",
  successText: "提交成功",
  errorText: "提交失败，请稍后重试",
  namePlaceholder: "请输入姓名",
  phonePlaceholder: "请输入手机号",
  remarkPlaceholder: "备注（选填）",
  pageId: 0,
  publishedVersionId: "",
  endpoint: "/atlas-cms/submitLead",
  trackingEndpoint: "/atlas-cms/trackEvent",
  trackingEnabled: true,
  privacyRequired: true,
});

const form = reactive({
  name: "",
  phoneNumber: "",
  remark: "",
});

const submitting = ref(false);
const consentAccepted = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");

const wrapperStyle = computed(() => props.styles || {});

/** 同一轮提交内复用 requestId，重试时保持幂等 */
const pendingRequestId = ref<string | null>(null);

const handleSubmit = async () => {
  message.value = "";

  if (!form.name) {
    messageType.value = "error";
    message.value = "请输入姓名";
    return;
  }

  if (!PHONE_NUMBER_REG.test(form.phoneNumber)) {
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

  submitting.value = true;
  try {
    const marketing = getMarketingParams();
    pendingRequestId.value ??= createRequestId();
    const sessionId = getTrackingSessionId();

    await submitLeadRequest(
      {
        requestId: pendingRequestId.value,
        name: form.name,
        phoneNumber: form.phoneNumber,
        remark: form.remark || undefined,
        pageId: props.pageId,
        publishedVersionId: props.publishedVersionId,
        sessionId,
        utm: marketing.utm,
        channel: marketing.channel,
        consentAccepted: consentAccepted.value,
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
            payload: { formType: "lead_form" },
            utm: marketing.utm,
            channel: marketing.channel,
          },
          props.trackingEndpoint,
        );
      } catch {
        // 埋点失败不影响线索提交结果
      }
    }

    messageType.value = "success";
    message.value = props.successText;
    form.name = "";
    form.phoneNumber = "";
    form.remark = "";
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
.lead-form-block {
  background: #ffffff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
}

.lead-title {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}

.lead-subtitle {
  margin: 6px 0 12px;
  font-size: 12px;
  color: #64748b;
}

.lead-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lead-input,
.lead-textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}

.lead-submit {
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  background: #2563eb;
  color: #fff;
  font-size: 14px;
}

.lead-submit:disabled {
  opacity: 0.7;
}

.lead-message {
  margin-top: 10px;
  font-size: 12px;
}

.lead-message.success {
  color: #16a34a;
}

.lead-message.error {
  color: #dc2626;
}
</style>

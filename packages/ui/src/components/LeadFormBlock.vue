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

interface SubmitLeadPayload {
  name: string;
  phoneNumber: string;
  remark?: string;
  pageId?: number;
  utm?: Record<string, string>;
  channel?: Record<string, string>;
}

interface TrackingPayload {
  eventType: "form_submit";
  pageId?: number;
  payload?: Record<string, unknown>;
  utm?: Record<string, string>;
  channel?: Record<string, string>;
}

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
  endpoint?: string;
  trackingEndpoint?: string;
  trackingEnabled?: boolean;
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
  endpoint: "/atlas-cms/submitLead",
  trackingEndpoint: "/atlas-cms/trackEvent",
  trackingEnabled: true,
});

const form = reactive({
  name: "",
  phoneNumber: "",
  remark: "",
});

const submitting = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");

const wrapperStyle = computed(() => props.styles || {});

const getBaseApiUrl = () => {
  if (typeof import.meta !== "undefined") {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (env?.VITE_API_BASE_URL) {
      return env.VITE_API_BASE_URL;
    }
  }
  return "/api";
};

const getSessionId = () => {
  const key = "__lead_form_session__";
  const current = sessionStorage.getItem(key);
  if (current) {
    return current;
  }
  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, next);
  return next;
};

const getMarketingParams = () => {
  const querySource =
    window.location.hash && window.location.hash.includes("?")
      ? window.location.hash.slice(window.location.hash.indexOf("?"))
      : window.location.search;

  const params = new URLSearchParams(querySource || "");
  const pickByPrefixes = (prefixes: string[]) => {
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        result[key] = value;
      }
    });
    return result;
  };

  return {
    utm: pickByPrefixes(["utm_"]),
    channel: pickByPrefixes(["channel_", "ch_", "src_", "campaign_", "ad_"]),
  };
};

const buildUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const base = getBaseApiUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

const requestJson = async (url: string, payload: unknown) => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    code?: number;
    message?: string;
  };

  if (typeof body.code === "number" && body.code !== 10000) {
    throw new Error(body.message || "request_failed");
  }
};

const submitLead = async (payload: SubmitLeadPayload) => {
  await requestJson(buildUrl(props.endpoint), payload);
};

const trackSubmit = async (payload: TrackingPayload) => {
  if (!props.trackingEnabled) {
    return;
  }

  await requestJson(buildUrl(props.trackingEndpoint), {
    ...payload,
    sessionId: getSessionId(),
    timestamp: Date.now(),
  });
};

const phoneReg = /^1[3-9]\d{9}$/;

const handleSubmit = async () => {
  message.value = "";

  if (!form.name) {
    messageType.value = "error";
    message.value = "请输入姓名";
    return;
  }

  if (!phoneReg.test(form.phoneNumber)) {
    messageType.value = "error";
    message.value = "请输入正确手机号";
    return;
  }

  submitting.value = true;
  try {
    const marketing = getMarketingParams();

    await submitLead({
      name: form.name,
      phoneNumber: form.phoneNumber,
      remark: form.remark || undefined,
      pageId: props.pageId > 0 ? props.pageId : undefined,
      utm: marketing.utm,
      channel: marketing.channel,
    });

    await trackSubmit({
      eventType: "form_submit",
      pageId: props.pageId > 0 ? props.pageId : undefined,
      payload: { formType: "lead_form" },
      utm: marketing.utm,
      channel: marketing.channel,
    });

    messageType.value = "success";
    message.value = props.successText;
    form.name = "";
    form.phoneNumber = "";
    form.remark = "";
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

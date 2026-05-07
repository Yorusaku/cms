<template>
  <div class="preview-iframe-container">
    <iframe
      ref="iframeRef"
      :src="previewUrl"
      class="preview-iframe"
      @load="handleIframeLoad"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useEventListener, useDebounceFn } from "@vueuse/core";
import { usePageStore } from "../store/usePageStore";
import { MESSAGE_TYPE } from "@cms/types";
import type { IMessagePayload, IPageSchema } from "@cms/types";
import {
  MessageSequenceTracker,
  createSecureMessage,
  verifySecureMessage,
  validateOrigin,
  type SecureMessagePayload,
} from "@cms/utils";

defineProps<{
  previewUrl: string;
}>();

const pageStore = usePageStore();
const iframeRef = ref<HTMLIFrameElement | null>(null);
const iframeLoaded = ref(false);

// 消息序列追踪器
const outgoingSequenceTracker = new MessageSequenceTracker();
const incomingSequenceTracker = new MessageSequenceTracker();

const getTargetOrigin = (): string => {
  // 开发环境也使用白名单，不再使用 "*"
  return import.meta.env.DEV ? "http://localhost:5174" : window.location.origin;
};

const sendSchemaToIframe = async (schema: IPageSchema) => {
  if (!iframeRef.value?.contentWindow || !iframeLoaded.value) {
    return;
  }

  try {
    const clonedSchema = JSON.parse(JSON.stringify(schema));

    // 创建安全消息
    const securePayload = await createSecureMessage(
      MESSAGE_TYPE.SYNC_SCHEMA,
      clonedSchema,
      outgoingSequenceTracker
    );

    iframeRef.value.contentWindow.postMessage(securePayload, getTargetOrigin());
  } catch (error) {
    console.warn("发送 Schema 到 iframe 失败:", error);
  }
};

const debouncedSendSchema = useDebounceFn((schema: IPageSchema) => {
  sendSchemaToIframe(schema);
}, 100);

const handleIframeLoad = () => {
  iframeLoaded.value = true;
  sendSchemaToIframe(pageStore.pageSchema);
};

useEventListener(window, "message", async (event: MessageEvent) => {
  // 验证来源
  if (!validateOrigin(event.origin)) {
    console.warn("拒绝来自未授权源的消息:", event.origin);
    return;
  }

  try {
    const payload = event.data as SecureMessagePayload;

    // 验证安全消息
    const verification = await verifySecureMessage(payload, incomingSequenceTracker);

    if (!verification.valid) {
      console.warn("消息验证失败:", verification.error);
      return;
    }

    // 处理验证通过的消息
    const { type } = payload;
    const data = verification.data;

    if (
      type === MESSAGE_TYPE.ON_SELECT_BLOCK &&
      data &&
      typeof data === "object" &&
      "id" in data
    ) {
      pageStore.setActiveId(data.id as string);
    }
  } catch (error) {
    console.warn("处理消息失败:", error);
  }
});

watch(
  () => pageStore.pageSchema,
  (schema) => {
    debouncedSendSchema(schema);
  },
  { deep: true },
);
</script>

<style scoped>
.preview-iframe-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>

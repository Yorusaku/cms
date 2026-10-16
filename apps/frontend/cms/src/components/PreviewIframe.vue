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
import { ref, watch } from "vue";
import { useEventListener, useDebounceFn } from "@vueuse/core";
import { usePageStore } from "../store/usePageStore";
import { MESSAGE_TYPE } from "@cms/types";
import type { IPageSchema } from "@cms/types";
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

const outgoingSequenceTracker = new MessageSequenceTracker();
const incomingSequenceTracker = new MessageSequenceTracker();

const getTargetOrigin = (): string => {
  const configured = import.meta.env.VITE_CRS_PREVIEW_ORIGIN;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured;
  }
  return "http://127.0.0.1:3010";
};

const sendSchemaToIframe = async (schema: IPageSchema) => {
  if (!iframeRef.value?.contentWindow || !iframeLoaded.value) {
    return;
  }

  try {
    const clonedSchema = JSON.parse(JSON.stringify(schema));

    const securePayload = await createSecureMessage(
      MESSAGE_TYPE.SYNC_SCHEMA,
      clonedSchema,
      outgoingSequenceTracker,
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
  // 首次推送由 CRS 的 PREVIEW_READY 触发（见下方监听）：
  // 子应用为异步 chunk，load 后立即推送可能早于其监听器注册而丢失
};

useEventListener(window, "message", async (event: MessageEvent) => {
  if (!validateOrigin(event.origin)) {
    console.warn("拒绝未授权来源消息:", event.origin);
    return;
  }

  try {
    const payload = event.data as SecureMessagePayload;

    const verification = await verifySecureMessage(payload, incomingSequenceTracker);

    if (!verification.valid) {
      console.warn("消息验签失败:", verification.error);
      return;
    }

    const { type } = payload;
    const data = verification.data;

    if (type === MESSAGE_TYPE.PREVIEW_READY) {
      // READY 即对端就绪证明（比 load 事件更可靠，且不依赖 CSS/图片加载完成），
      // 立即推送当前 store 中（含未保存改动）的 schema
      iframeLoaded.value = true;
      sendSchemaToIframe(pageStore.pageSchema);
      return;
    }

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



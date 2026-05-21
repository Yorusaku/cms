<template>
  <div class="page-preview-container">
    <SchemaRenderer :page-schema="pageStore.pageSchema" />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { provide } from "vue";
import SchemaRenderer from "../components/SchemaRenderer.vue";
import { usePageStore } from "../store/usePageStore";
import { MESSAGE_TYPE } from "@cms/types";
import type { IPageSchemaV2 } from "@cms/types";
import {
  MessageSequenceTracker,
  createSecureMessage,
  verifySecureMessage,
  validateOrigin,
  type SecureMessagePayload,
} from "@cms/utils";

const pageStore = usePageStore();

const outgoingSequenceTracker = new MessageSequenceTracker();
const incomingSequenceTracker = new MessageSequenceTracker();

const getParentOrigin = (): string => {
  const configured = import.meta.env.VITE_POSTMESSAGE_PARENT_ORIGIN;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured;
  }
  return "http://127.0.0.1:3011";
};

const sendSelectEvent = async (componentId: string) => {
  if (!window.parent) return;

  try {
    const securePayload = await createSecureMessage(
      MESSAGE_TYPE.ON_SELECT_BLOCK,
      { id: componentId },
      outgoingSequenceTracker,
    );

    window.parent.postMessage(securePayload, getParentOrigin());
  } catch (error) {
    console.warn("发送选中组件事件失败:", error);
  }
};

provide("sendSelectEvent", sendSelectEvent);

useEventListener(window, "message", async (event: MessageEvent) => {
  if (!validateOrigin(event.origin)) {
    console.warn("拒绝未授权来源消息:", event.origin);
    return;
  }

  try {
    const payload = event.data as SecureMessagePayload<IPageSchemaV2>;

    const verification = await verifySecureMessage(payload, incomingSequenceTracker);

    if (!verification.valid) {
      console.warn("消息验签失败:", verification.error);
      return;
    }

    if (payload.type === MESSAGE_TYPE.SYNC_SCHEMA && verification.data) {
      pageStore.importPageSchema(verification.data);
    }
  } catch (error) {
    console.warn("处理消息失败:", error);
  }
});
</script>

<style scoped>
.page-preview-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>


<template>
  <div class="page-container">
    <div
      v-if="loading"
      class="loading-overlay flex items-center justify-center min-h-screen bg-white"
    >
      <div class="text-center">
        <Loading type="spinner" color="#1989fa" size="40px" class="mb-4" />
        <p class="text-gray-600 text-lg">页面加载中...</p>
        <p class="text-gray-400 text-sm mt-2">正在获取页面数据</p>
      </div>
    </div>

    <div
      v-else-if="error"
      class="error-overlay flex items-center justify-center min-h-screen bg-gray-50"
    >
      <Empty :description="errorMessage" image="error" class="w-full max-w-md px-4">
        <template #bottom>
          <Button class="mt-4" type="primary" @click="retryLoad">
            重新加载
          </Button>
        </template>
      </Empty>
    </div>

    <div v-else class="page-content" :style="{ backgroundColor: pageBackgroundColor }">
      <SchemaRenderer :page-schema="pageStore.pageSchema" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { Loading, Empty, Button } from "vant";
import { migrateSchema } from "@cms/utils";
import { normalizePageSchemaMaterials } from "@cms/ui";
import { getPageDataById, parsePageSchema } from "@/api/page";
import SchemaRenderer from "@/components/SchemaRenderer.vue";
import { usePageStore } from "@/store/usePageStore";
import { getMarketingParamsFromLocation, trackEvent } from "@/utils/tracking";

defineOptions({
  name: "CrsPageView",
});

const route = useRoute();
const pageStore = usePageStore();

const loading = ref(true);
const error = ref(false);
const errorMessage = ref("");

const pageId = computed(() => {
  const id = route.query.id;
  return id ? Number(id) : null;
});

const pageBackgroundColor = computed(() => {
  const bgColor = pageStore.pageSchema.pageConfig?.backgroundColor;
  return typeof bgColor === "string" ? bgColor : "#ffffff";
});

const loadPageData = async () => {
  if (!pageId.value) {
    error.value = true;
    errorMessage.value = "页面ID不存在，请检查URL参数";
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = false;
    errorMessage.value = "";

    const response = await getPageDataById(pageId.value);

    if (response.code !== 10000) {
      throw new Error(response.message || `获取页面数据失败 (code: ${response.code})`);
    }

    if (!response.data) {
      throw new Error("页面数据为空");
    }

    const pageData = response.data as unknown as {
      schema: string;
      [key: string]: unknown;
    };
    const rawSchema = pageData.schema ? parsePageSchema(pageData.schema) : pageData;
    const schema = normalizePageSchemaMaterials(migrateSchema(rawSchema));

    pageStore.importPageSchema(schema);

    const pageTitle =
      typeof schema.pageConfig?.name === "string"
        ? schema.pageConfig.name
        : "移动端页面";
    document.title = pageTitle;

    const marketing = getMarketingParamsFromLocation();
    await trackEvent({
      eventType: "page_view",
      pageId: pageId.value,
      payload: {
        source: "crs_page",
        title: pageTitle,
      },
      utm: marketing.utm,
      channel: marketing.channel,
    });
  } catch (err: unknown) {
    error.value = true;
    const errorObj = err as Error;
    errorMessage.value = errorObj.message || "页面加载失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};

const retryLoad = () => {
  loadPageData();
};

onMounted(() => {
  loadPageData();
});
</script>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: white;
}

.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: #f5f5f5;
}

.page-content {
  width: 100%;
  min-height: 100vh;
}
</style>

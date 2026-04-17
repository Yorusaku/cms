<template>
  <div class="decorate-container">
    <TopHeader />

    <div class="decorate-content">
      <LeftMaterial />
      <CenterCanvas :page-store="pageStore" />
      <RightConfig />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { usePageStore } from "@/store/usePageStore";
import { getCmsPageById } from "@/api/activity";
import { migrateSchema } from "@cms/utils";
import { normalizePageSchemaMaterials } from "@cms/ui";
import { adaptPageData } from "@/utils/data-adapter";
import { loadPageDraft, savePageDraft } from "@/utils/page-draft";
import TopHeader from "./components/TopHeader.vue";
import LeftMaterial from "./components/LeftMaterial.vue";
import CenterCanvas from "./components/CenterCanvas.vue";
import RightConfig from "./components/RightConfig.vue";

interface PageDetailResponse {
  code: number;
  message?: string;
  data?: Record<string, unknown>;
}

const pageStore = usePageStore();
const route = useRoute();
const draftReady = ref(false);

const pageId = computed(() => {
  const id = Number(route.query.id);
  return Number.isFinite(id) && id > 0 ? id : null;
});

const restoreDraftIfNeeded = async () => {
  const draft = loadPageDraft(pageId.value);
  if (!draft) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      "检测到本地未保存草稿，是否恢复到编辑器？",
      "恢复草稿",
      {
        confirmButtonText: "恢复",
        cancelButtonText: "忽略",
        type: "warning",
      },
    );
    pageStore.importPageSchema(draft.schema);
    ElMessage.success("已恢复本地草稿");
  } catch {
    // 用户主动忽略草稿时不提示
  }
};

const debouncedSaveDraft = useDebounceFn(() => {
  if (!draftReady.value) {
    return;
  }
  savePageDraft(pageId.value, pageStore.exportPageSchema());
}, 800);

const initData = async () => {
  const { id } = route.query;

  if (id) {
    try {
      const response = (await getCmsPageById(Number(id))) as PageDetailResponse;

      if (response.code !== 10000) {
        throw new Error(
          response.message || `获取页面数据失败 (code: ${response.code})`,
        );
      }

      if (!response.data) {
        throw new Error("页面数据为空");
      }

      const pageData = response.data;
      let rawSchema = pageData;

      if (pageData?.schema) {
        rawSchema =
          typeof pageData.schema === "string"
            ? JSON.parse(pageData.schema)
            : pageData.schema;
      } else {
        rawSchema = adaptPageData(pageData);
      }

      const schema = normalizePageSchemaMaterials(migrateSchema(rawSchema));
      pageStore.importPageSchema(schema);
      ElMessage.success("页面数据加载成功");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "页面数据加载失败";
      ElMessage.error(errorMessage);
      pageStore.setInitPageSchema();
    }
  } else {
    pageStore.setInitPageSchema();
  }

  await restoreDraftIfNeeded();
  draftReady.value = true;
};

onMounted(() => {
  initData();
});

watch(
  () => pageStore.pageSchema,
  () => {
    debouncedSaveDraft();
  },
  { deep: true },
);
</script>

<style scoped>
.decorate-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.decorate-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>

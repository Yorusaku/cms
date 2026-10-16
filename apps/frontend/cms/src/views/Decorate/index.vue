<template>
  <div class="decorate-container">
    <TopHeader />

    <div class="decorate-content">
      <LeftMaterial />
      <CenterCanvas
        :page-store="pageStore"
        @open-live-preview="livePreviewVisible = true"
      />
      <RightConfig />
    </div>

    <el-drawer
      v-model="livePreviewVisible"
      title="实时预览（含未保存改动）"
      size="420px"
      direction="ltr"
      class="live-preview-drawer"
      :modal="false"
      :lock-scroll="false"
    >
      <PreviewIframe :preview-url="livePreviewUrl" />
    </el-drawer>
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
import { markPageDraft } from "@/utils/page-publish";
import TopHeader from "./components/TopHeader.vue";
import LeftMaterial from "./components/LeftMaterial.vue";
import CenterCanvas from "./components/CenterCanvas.vue";
import RightConfig from "./components/RightConfig.vue";
import PreviewIframe from "@/components/PreviewIframe.vue";

interface PageDetailResponse {
  code: number;
  message?: string;
  data?: Record<string, unknown>;
}

const pageStore = usePageStore();
const route = useRoute();
const draftReady = ref(false);

// 编辑器内实时预览：PreviewIframe 订阅 store，改动经 postMessage 实时同步到 CRS
const livePreviewVisible = ref(false);
const livePreviewUrl = computed(() => {
  const base =
    import.meta.env.VITE_CRS_PREVIEW_URL ||
    "http://127.0.0.1:3010/crs/#/pagePreview";
  const id = Number(route.query.id);
  return Number.isFinite(id) && id > 0 ? `${base}?id=${id}` : base;
});

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

  const rollbackVersionId = String(route.query.rollbackVersionId || "");
  if (pageId.value && rollbackVersionId) {
    markPageDraft(pageId.value);
    ElMessage.success("已回滚到目标发布版本，当前为草稿待发布");
  }

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
  /* 三栏定位上下文：左右面板（absolute）相对本容器定位 */
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* 顶部工具栏为 fixed 定位（不占文档流），此处让位 56px，避免画布顶部被压住 */
  margin-top: 56px;
}

/*
 * LeftMaterial（.component-sidebar，186px）与 RightConfig（.page-right，376px）
 * 都是 position: absolute 的浮层，不参与 flex 布局。画布需显式避让两侧宽度，
 * 否则会按整页宽度布局：组件横向铺进左栏 / 右栏区域，造成层叠错乱
 * （画布内容盖住物料列表、右栏裁掉组件右侧）。
 */
.canvas-area {
  min-width: 0;
  min-height: 0;
  margin-left: 186px;
  margin-right: 376px;
}
</style>

<style>
/* el-drawer 默认 teleport 到 body 场景下 scoped 样式选不中，用全局类名限定 */
.live-preview-drawer .el-drawer__body {
  padding: 0;
  height: 100%;
  overflow: hidden;
}

/*
 * 实时预览为无遮罩模式（:modal="false"）：Element Plus 仍会渲染一个全屏的
 * 定位容器包裹抽屉面板，且默认拦截指针事件，导致画布无法交互（不能边改边看）。
 * 放行外层容器、仅面板自身接收事件。
 */
.decorate-container > div:has(> .live-preview-drawer) {
  pointer-events: none;
}

.decorate-container > div:has(> .live-preview-drawer) > .live-preview-drawer {
  pointer-events: auto;
}
</style>

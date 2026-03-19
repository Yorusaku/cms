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
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { usePageStore } from "@/store/usePageStore";
import { getCmsPageById } from "@/api/activity";
import { migrateSchema } from "@cms/utils";
import { normalizePageSchemaMaterials } from "@cms/ui";
import { adaptPageData } from "@/utils/data-adapter";
import TopHeader from "./components/TopHeader.vue";
import LeftMaterial from "./components/LeftMaterial.vue";
import CenterCanvas from "./components/CenterCanvas.vue";
import RightConfig from "./components/RightConfig.vue";

const pageStore = usePageStore();
const route = useRoute();

const initData = async () => {
  const { id } = route.query;

  if (id) {
    try {
      const response: any = await getCmsPageById(Number(id));

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
};

onMounted(() => {
  initData();
});
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

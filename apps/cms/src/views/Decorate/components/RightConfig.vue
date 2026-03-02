<template>
  <div class="page-right">
    <div class="config-panel">
      <div class="config-header">
        <h3 class="config-title">
          <span v-if="activeComponent"
            >{{ getComponentDisplayName(activeComponent.type) }} 配置</span
          >
          <span v-else>组件配置</span>
        </h3>
      </div>

      <div class="config-body">
        <div
          v-if="activeComponent && resolveConfigComponent(activeComponent.type)"
          class="config-content"
        >
          <component
            :is="resolveConfigComponent(activeComponent.type)"
            :parmes="activeComponent.props"
            @edit-component="handleConfigUpdate"
          />
        </div>
        <div v-else-if="activeComponent" class="config-placeholder">
          <div class="placeholder-icon">⚙️</div>
          <p class="placeholder-text">
            暂无 {{ getComponentDisplayName(activeComponent.type) }} 的配置面板
          </p>
        </div>
        <div v-else class="config-empty">
          <div class="empty-icon">🎨</div>
          <p class="empty-text">请选择画布中的组件</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { usePageStore } from "@/store/usePageStore";

const pageStore = usePageStore();

const activeComponent = computed(() => {
  return (
    pageStore.pageSchema.components.find(
      (c: any) => c.id === pageStore.activeComponentId,
    ) || null
  );
});

const configComponentMap: Record<string, any> = {
  Carousel: defineAsyncComponent(
    () => import("@/components/configs/CarouselConfig.vue"),
  ),
  Notice: defineAsyncComponent(
    () => import("@/components/configs/NoticeConfig.vue"),
  ),
};

const resolveConfigComponent = (type: string) => {
  return configComponentMap[type] || null;
};

const handleConfigUpdate = (newProps: any) => {
  if (activeComponent.value) {
    pageStore.editComponent({
      id: activeComponent.value.id,
      props: newProps,
    });
  }
};

const getComponentDisplayName = (type: string) => {
  const displayNameMap: Record<string, string> = {
    Notice: "公告",
    Carousel: "轮播图",
    ImageNav: "图片导航",
    Product: "商品",
    RichText: "富文本",
    Slider: "滑块",
    Dialog: "弹窗",
    AssistLine: "辅助线",
    FloatLayer: "浮动层",
    OnlineService: "在线客服",
    CubeSelection: "魔方选择",
  };
  return displayNameMap[type] || type;
};
</script>

<style scoped>
.page-right {
  position: absolute;
  top: 56px;
  right: 0;
  bottom: 0;
  width: 376px;
  padding-bottom: 50px;
  overflow-x: hidden;
  overflow-y: auto;
  background: #fff;
}

.config-panel {
  width: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.config-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

.config-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.config-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-content {
  background-color: #fff;
}

.config-placeholder,
.config-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.placeholder-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-text,
.empty-text {
  margin: 0;
  font-size: 16px;
  color: #606266;
}
</style>

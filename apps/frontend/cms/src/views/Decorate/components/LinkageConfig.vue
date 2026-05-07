<template>
  <div class="linkage-config p-4">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700">组件联动配置</h3>
      <el-button size="small" type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加规则
      </el-button>
    </div>

    <div v-if="linkages.length === 0" class="empty-state">
      <el-empty description="暂无联动规则" :image-size="80">
        <template #description>
          <p class="text-sm text-gray-500">点击"添加规则"创建组件间的联动关系</p>
        </template>
      </el-empty>
    </div>

    <div v-else class="linkage-list">
      <LinkageRuleItem
        v-for="linkage in linkages"
        :key="linkage.id"
        :linkage="linkage"
        @edit="handleEdit"
        @delete="handleDelete"
        @toggle="handleToggle"
      />
    </div>

    <LinkageRuleDialog
      v-model="dialogVisible"
      :linkage="currentLinkage"
      :components="components"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { usePageStore } from '@/store/usePageStore';
import type { IComponentLinkage } from '@cms/types';
import LinkageRuleItem from './LinkageRuleItem.vue';
import LinkageRuleDialog from './LinkageRuleDialog.vue';

const pageStore = usePageStore();
const dialogVisible = ref(false);
const currentLinkage = ref<IComponentLinkage | null>(null);

const linkages = computed(() => pageStore.linkages || []);
const components = computed(() => {
  return Object.values(pageStore.pageSchema.componentMap);
});

const handleAdd = () => {
  currentLinkage.value = null;
  dialogVisible.value = true;
};

const handleEdit = (linkage: IComponentLinkage) => {
  currentLinkage.value = linkage;
  dialogVisible.value = true;
};

const handleDelete = (id: string) => {
  pageStore.deleteLinkage(id);
};

const handleToggle = (id: string) => {
  pageStore.toggleLinkage(id);
};

const handleSave = (linkage: IComponentLinkage) => {
  if (currentLinkage.value) {
    pageStore.updateLinkage(linkage.id, linkage);
  } else {
    pageStore.addLinkage(linkage);
  }
  dialogVisible.value = false;
};
</script>

<style scoped>
.linkage-config {
  height: 100%;
  overflow-y: auto;
}

.linkage-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
</style>

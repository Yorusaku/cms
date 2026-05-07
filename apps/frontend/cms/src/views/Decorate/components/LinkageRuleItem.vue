<template>
  <div class="linkage-rule-item border border-gray-200 rounded-lg p-3 mb-2 hover:border-blue-400 transition-colors">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <el-tag :type="linkage.enabled ? 'success' : 'info'" size="small">
            {{ linkage.enabled ? '已启用' : '已禁用' }}
          </el-tag>
          <span class="text-xs text-gray-500">ID: {{ linkage.id }}</span>
        </div>

        <div class="text-sm space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-gray-600">来源：</span>
            <span class="font-medium">{{ getComponentName(linkage.sourceComponentId) }}</span>
            <span class="text-gray-400">.</span>
            <span class="text-blue-600">{{ linkage.sourceProperty }}</span>
          </div>

          <div class="flex items-center gap-2">
            <el-icon class="text-gray-400"><Right /></el-icon>
            <span class="text-gray-600">目标：</span>
            <span class="font-medium">{{ getComponentName(linkage.targetComponentId) }}</span>
            <span class="text-gray-400">.</span>
            <span class="text-green-600">{{ linkage.targetProperty }}</span>
          </div>

          <div v-if="linkage.transformFn" class="flex items-center gap-2 text-xs text-gray-500">
            <el-icon><Operation /></el-icon>
            <span>转换：{{ linkage.transformFn }}</span>
          </div>

          <div v-if="linkage.condition" class="flex items-center gap-2 text-xs text-gray-500">
            <el-icon><Filter /></el-icon>
            <span>条件：{{ linkage.condition.expression }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1 ml-2">
        <el-button size="small" text @click="$emit('edit', linkage)">
          <el-icon><Edit /></el-icon>
        </el-button>
        <el-button size="small" text @click="$emit('toggle', linkage.id)">
          <el-icon v-if="linkage.enabled"><Hide /></el-icon>
          <el-icon v-else><View /></el-icon>
        </el-button>
        <el-button size="small" text type="danger" @click="handleDelete">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Right, Edit, Delete, Operation, Filter, Hide, View } from '@element-plus/icons-vue';
import type { IComponentLinkage } from '@cms/types';
import { usePageStore } from '@/store/usePageStore';

interface Props {
  linkage: IComponentLinkage;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [linkage: IComponentLinkage];
  delete: [id: string];
  toggle: [id: string];
}>();

const pageStore = usePageStore();

const getComponentName = (componentId: string) => {
  const component = pageStore.pageSchema.componentMap[componentId];
  return component ? `${component.type} (${componentId.slice(0, 8)})` : componentId;
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条联动规则吗？',
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    emit('delete', props.linkage.id);
  } catch {
    // 用户取消
  }
};
</script>

<style scoped>
.linkage-rule-item {
  background: #fafafa;
}

.linkage-rule-item:hover {
  background: #f5f7fa;
}
</style>

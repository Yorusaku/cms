<template>
  <el-dialog
    v-model="visible"
    title="选择模板"
    width="900px"
    :close-on-click-modal="false"
  >
    <!-- 分类 Tab -->
    <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="营销" name="marketing" />
      <el-tab-pane label="电商" name="ecommerce" />
      <el-tab-pane label="品牌" name="brand" />
      <el-tab-pane label="通用" name="general" />
    </el-tabs>

    <!-- 模板网格 -->
    <div v-loading="loading" class="template-grid">
      <div
        v-for="item in templates"
        :key="item.id"
        class="template-card"
        :class="{ active: selectedId === item.id }"
        @click="selectedId = item.id"
      >
        <div class="template-thumb">
          <div
            class="thumb-placeholder"
            :style="{ background: categoryColor(item.category) }"
          >
            <span class="thumb-text">{{ item.name[0] }}</span>
          </div>
        </div>
        <div class="template-info">
          <div class="template-name">{{ item.name }}</div>
          <div class="template-desc">{{ item.description || '' }}</div>
          <el-tag size="small" :type="categoryTagType(item.category)">
            {{ categoryLabel(item.category) }}
          </el-tag>
        </div>
      </div>

      <div v-if="templates.length === 0 && !loading" class="empty-state">
        <p>暂无可用的模板</p>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleSkip">跳过，创建空白页</el-button>
      <el-button type="primary" :disabled="selectedId === null" :loading="creating" @click="handleUse">
        使用此模板
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getTemplateList, createPageFromTemplate, type TemplateItem } from "@/api/activity";

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', pageId: number): void;
  (e: 'skip'): void;
}>();

const visible = ref(false);
const loading = ref(false);
const creating = ref(false);
const activeCategory = ref("all");
const selectedId = ref<number | null>(null);
const templates = ref<TemplateItem[]>([]);

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val) {
    fetchTemplates();
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});

const fetchTemplates = async () => {
  loading.value = true;
  selectedId.value = null;
  try {
    const cat = activeCategory.value === 'all' ? undefined : activeCategory.value;
    const res = await getTemplateList(cat);
    templates.value = (res as any).data || [];
  } catch {
    ElMessage.error("获取模板列表失败");
  } finally {
    loading.value = false;
  }
};

const handleCategoryChange = () => {
  fetchTemplates();
};

const handleUse = async () => {
  if (selectedId.value === null) return;
  creating.value = true;
  try {
    const template = templates.value.find((t) => t.id === selectedId.value);
    const name = template?.name || "新建页面";
    const res = await createPageFromTemplate({
      templateId: selectedId.value,
      name,
    });
    const pageId = (res as any).data?.id;
    if (pageId) {
      ElMessage.success(`已从模板创建页面: ${name}`);
      visible.value = false;
      emit('created', pageId);
    }
  } catch {
    ElMessage.error("创建页面失败");
  } finally {
    creating.value = false;
  }
};

const handleSkip = () => {
  visible.value = false;
  emit('skip');
};

const categoryColor = (cat: string) => {
  const map: Record<string, string> = {
    marketing: '#ff6b6b',
    ecommerce: '#ffd93d',
    brand: '#6c5ce7',
    general: '#00b894',
  };
  return map[cat] || '#95a5a6';
};

const categoryTagType = (cat: string): 'danger' | 'warning' | 'success' | 'info' => {
  const map: Record<string, 'danger' | 'warning' | 'success' | 'info'> = {
    marketing: 'danger',
    ecommerce: 'warning',
    brand: 'info',
    general: 'success',
  };
  return map[cat] || 'info';
};

const categoryLabel = (cat: string) => {
  const map: Record<string, string> = {
    marketing: '营销',
    ecommerce: '电商',
    brand: '品牌',
    general: '通用',
  };
  return map[cat] || cat;
};
</script>

<style scoped>
.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  min-height: 200px;
}

.template-card {
  border: 2px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.template-card.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.template-thumb {
  height: 120px;
  overflow: hidden;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-text {
  font-size: 40px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
}

.template-info {
  padding: 10px 12px;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>
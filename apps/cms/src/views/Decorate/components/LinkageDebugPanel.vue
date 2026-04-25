<template>
  <div class="linkage-debug-panel">
    <div class="panel-header">
      <h4>联动调试</h4>
      <div class="header-actions">
        <el-button size="small" @click="clearHistory">清空历史</el-button>
        <el-button size="small" @click="refreshStats">刷新</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="debug-tabs">
      <!-- 统计信息 -->
      <el-tab-pane label="统计" name="stats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">总联动数</div>
            <div class="stat-value">{{ stats.totalLinkages }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">已启用</div>
            <div class="stat-value">{{ stats.enabledLinkages }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">组件数</div>
            <div class="stat-value">{{ stats.totalComponents }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">历史记录</div>
            <div class="stat-value">{{ stats.historySize }}</div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 触发历史 -->
      <el-tab-pane label="历史" name="history">
        <div class="history-list">
          <div
            v-for="(event, index) in history"
            :key="index"
            class="history-item"
          >
            <div class="history-time">
              {{ formatTime(event.timestamp) }}
            </div>
            <div class="history-content">
              <div class="history-source">
                <el-tag size="small" type="info">
                  {{ getComponentLabel(event.sourceComponentId) }}
                </el-tag>
                <span class="property">{{ event.sourceProperty }}</span>
              </div>
              <div class="history-arrow">→</div>
              <div class="history-value">
                <code>{{ formatValue(event.value) }}</code>
              </div>
            </div>
          </div>
          <el-empty v-if="history.length === 0" description="暂无触发记录" />
        </div>
      </el-tab-pane>

      <!-- 联动规则 -->
      <el-tab-pane label="规则" name="rules">
        <div class="rules-list">
          <div
            v-for="linkage in linkages"
            :key="linkage.id"
            class="rule-item"
            :class="{ disabled: !linkage.enabled }"
          >
            <div class="rule-header">
              <el-switch
                :model-value="linkage.enabled"
                size="small"
                @change="toggleLinkage(linkage.id)"
              />
              <span class="rule-id">{{ linkage.id }}</span>
            </div>
            <div class="rule-flow">
              <div class="rule-source">
                <el-tag size="small">
                  {{ getComponentLabel(linkage.sourceComponentId) }}
                </el-tag>
                <span class="property">.{{ linkage.sourceProperty }}</span>
              </div>
              <div class="rule-arrow">→</div>
              <div class="rule-target">
                <el-tag size="small" type="success">
                  {{ getComponentLabel(linkage.targetComponentId) }}
                </el-tag>
                <span class="property">.{{ linkage.targetProperty }}</span>
              </div>
            </div>
            <div v-if="linkage.transformFn" class="rule-transform">
              <el-tag size="small" type="warning">转换</el-tag>
              <code>{{ linkage.transformFn }}</code>
            </div>
            <div v-if="linkage.condition" class="rule-condition">
              <el-tag size="small" type="danger">条件</el-tag>
              <code>{{ linkage.condition.expression }}</code>
            </div>
          </div>
          <el-empty v-if="linkages.length === 0" description="暂无联动规则" />
        </div>
      </el-tab-pane>

      <!-- 组件状态 -->
      <el-tab-pane label="状态" name="state">
        <div class="state-list">
          <div
            v-for="(state, componentId) in componentStates"
            :key="componentId"
            class="state-item"
          >
            <div class="state-header">
              <el-tag size="small">
                {{ getComponentLabel(componentId) }}
              </el-tag>
            </div>
            <div class="state-content">
              <pre>{{ JSON.stringify(state, null, 2) }}</pre>
            </div>
          </div>
          <el-empty v-if="Object.keys(componentStates).length === 0" description="暂无状态数据" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePageStore } from '@/store/usePageStore';
import type { LinkageEvent } from '@/utils/linkage-engine';

const pageStore = usePageStore();
const activeTab = ref('stats');

// 统计信息
const stats = ref({
  totalLinkages: 0,
  enabledLinkages: 0,
  totalComponents: 0,
  historySize: 0,
});

// 触发历史
const history = ref<LinkageEvent[]>([]);

// 联动规则
const linkages = computed(() => pageStore.linkages || []);

// 组件状态
const componentStates = ref<Record<string, any>>({});

// 刷新统计信息
const refreshStats = () => {
  stats.value = pageStore.linkageEngine.getStatistics();
  history.value = pageStore.linkageEngine.getHistory().slice(-20).reverse();

  // 获取所有组件状态
  const allComponents = Object.keys(pageStore.pageSchema.componentMap);
  componentStates.value = {};
  allComponents.forEach(id => {
    const state = pageStore.linkageEngine.getComponentState(id);
    if (Object.keys(state).length > 0) {
      componentStates.value[id] = state;
    }
  });
};

// 清空历史
const clearHistory = () => {
  pageStore.linkageEngine.clearHistory();
  refreshStats();
};

// 切换联动启用状态
const toggleLinkage = (id: string) => {
  pageStore.toggleLinkage(id);
  refreshStats();
};

// 获取组件标签
const getComponentLabel = (componentId: string) => {
  const component = pageStore.pageSchema.componentMap[componentId];
  if (!component) return componentId;
  return `${component.type} (${componentId.slice(0, 8)})`;
};

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

// 格式化值
const formatValue = (value: any) => {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

// 定时刷新
let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  refreshStats();
  refreshInterval = setInterval(refreshStats, 1000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.linkage-debug-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.debug-tabs {
  flex: 1;
  overflow: hidden;
}

.debug-tabs :deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow-y: auto;
  padding: 16px;
}

/* 统计信息 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

/* 历史记录 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.history-time {
  font-size: 11px;
  color: #909399;
  margin-bottom: 8px;
}

.history-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.history-source,
.history-value {
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-arrow {
  color: #909399;
  font-weight: bold;
}

.property {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #606266;
}

code {
  padding: 2px 6px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  color: #e6a23c;
}

/* 联动规则 */
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid #67c23a;
}

.rule-item.disabled {
  opacity: 0.5;
  border-left-color: #dcdfe6;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rule-id {
  font-size: 11px;
  color: #909399;
  font-family: 'Consolas', 'Monaco', monospace;
}

.rule-flow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
}

.rule-source,
.rule-target {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rule-arrow {
  color: #909399;
  font-weight: bold;
}

.rule-transform,
.rule-condition {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
}

/* 组件状态 */
.state-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.state-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.state-header {
  margin-bottom: 8px;
}

.state-content pre {
  margin: 0;
  padding: 8px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}
</style>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <el-card class="mb-5">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="mr-4 text-xl font-bold">页面效果看板</h1>
        <el-select v-model="pageId" placeholder="选择页面" class="w-60" @change="handlePageChange">
          <el-option v-for="page in pages" :key="page.id" :label="page.name" :value="page.id" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="loadSummary"
        />
        <el-select v-model="filters.source" class="w-44" @change="loadSummary">
          <el-option label="访客事件（crs）" value="crs" />
          <el-option label="后台操作（cms）" value="cms" />
          <el-option label="全部来源" value="all" />
        </el-select>
        <el-select
          v-model="filters.publishedVersionId"
          clearable
          placeholder="全部版本"
          class="w-40"
          @change="loadSummary"
        >
          <el-option
            v-for="log in publishLogs"
            :key="String(log.versionId)"
            :label="log.displayVersion || String(log.versionId)"
            :value="String(log.versionId)"
          />
        </el-select>
        <el-input
          v-model="filters.channel"
          clearable
          placeholder="渠道或 UTM 值"
          class="w-48"
          @keyup.enter="loadSummary"
        />
        <el-button :loading="loading" type="primary" @click="loadSummary">刷新</el-button>
        <el-button v-if="canExport" :loading="exporting" @click="handleExport">
          导出 CSV
        </el-button>
      </div>
      <p class="mt-3 text-xs text-gray-500">
        统计口径：漏斗指标按「访客事件（crs）」计算，独立访客按 sessionId 去重；后台操作不计入访客转化。
      </p>
    </el-card>

    <el-empty v-if="!pageId" description="请选择页面查看效果数据" />
    <template v-else>
      <div v-loading="loading" class="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <el-card v-for="item in metricCards" :key="item.label" shadow="never">
          <div class="text-sm text-gray-500">{{ item.label }}</div>
          <div class="mt-2 text-2xl font-bold text-gray-800">{{ item.value }}</div>
        </el-card>
      </div>

      <el-card class="mt-5" shadow="never">
        <template #header>每日趋势</template>
        <el-empty v-if="trendRows.length === 0" description="暂无趋势数据" />
        <div v-else class="trend">
          <div v-for="row in trendRows" :key="row.date" class="trend__row">
            <span class="trend__date">{{ row.date }}</span>
            <div class="trend__bars">
              <div
                class="trend__bar trend__bar--pv"
                :style="{ width: row.pageViewWidth }"
                :title="`访问量 ${row.pageViews}`"
              />
              <div
                class="trend__bar trend__bar--lead"
                :style="{ width: row.leadWidth }"
                :title="`线索 ${row.leads}`"
              />
            </div>
            <span class="trend__meta">
              访问 {{ row.pageViews }} · 独立 {{ row.uniqueVisitors }} · CTA {{ row.ctaClicks }} · 线索
              {{ row.leads }}
            </span>
          </div>
        </div>
      </el-card>

      <el-card class="mt-5" shadow="never">
        <template #header>渠道效果</template>
        <el-table :data="summary?.channels || []" border stripe>
          <el-table-column prop="channelKey" label="渠道字段" width="180" />
          <el-table-column prop="channelValue" label="渠道值" width="180" />
          <el-table-column label="访问量">
            <template #default="{ row }">{{ row.metrics.pageViews }}</template>
          </el-table-column>
          <el-table-column label="独立访客">
            <template #default="{ row }">{{ row.metrics.uniqueVisitors }}</template>
          </el-table-column>
          <el-table-column label="CTA 点击">
            <template #default="{ row }">{{ row.metrics.ctaClicks }}</template>
          </el-table-column>
          <el-table-column label="线索">
            <template #default="{ row }">{{ row.metrics.leads }}</template>
          </el-table-column>
          <el-table-column label="CTA 点击率">
            <template #default="{ row }">{{ formatRate(row.metrics.ctaClickRate) }}</template>
          </el-table-column>
          <el-table-column label="线索转化率">
            <template #default="{ row }">{{ formatRate(row.metrics.leadConversionRate) }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getCmsPageList, getPagePublishLogs, type PageItem } from "@/api/activity";
import {
  exportPageFunnelCsv,
  getPageFunnelSummary,
  type FunnelQueryParams,
  type PageFunnelSummary,
} from "@/api/tracking";
import { getEffectiveRole } from "@/utils/auth";
import { saveBlob } from "@/utils/download";

interface PublishLogOption {
  versionId: string | number;
  displayVersion?: string;
}

const pages = ref<PageItem[]>([]);
const pageId = ref<number>();
const dateRange = ref<[string, string]>();
const publishLogs = ref<PublishLogOption[]>([]);
const summary = ref<PageFunnelSummary>();
const loading = ref(false);
const exporting = ref(false);

const filters = reactive({
  channel: "",
  publishedVersionId: "" as string | undefined,
  source: "crs" as NonNullable<FunnelQueryParams["source"]>,
});

/** 导出为管理员专属；观察员与编辑员可只看板 */
const canExport = computed(() => getEffectiveRole() === "admin");

const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`;

const metricCards = computed(() => {
  const metrics = summary.value?.metrics;
  return [
    { label: "页面访问", value: metrics?.pageViews ?? 0 },
    { label: "独立访客", value: metrics?.uniqueVisitors ?? 0 },
    { label: "CTA 点击", value: metrics?.ctaClicks ?? 0 },
    { label: "表单提交", value: metrics?.formSubmits ?? 0 },
    { label: "有效线索", value: metrics?.leads ?? 0 },
    { label: "CTA 点击率", value: formatRate(metrics?.ctaClickRate ?? 0) },
    { label: "线索转化率", value: formatRate(metrics?.leadConversionRate ?? 0) },
  ];
});

/** 趋势图用 CSS 条形表示：以当前区间最大访问量为 100% 基准 */
const trendRows = computed(() => {
  const trend = summary.value?.dailyTrend ?? [];
  const maxPageViews = Math.max(...trend.map((point) => point.metrics.pageViews), 1);
  const maxLeads = Math.max(...trend.map((point) => point.metrics.leads), 1);

  return trend.map((point) => ({
    date: point.date,
    pageViews: point.metrics.pageViews,
    uniqueVisitors: point.metrics.uniqueVisitors,
    ctaClicks: point.metrics.ctaClicks,
    leads: point.metrics.leads,
    pageViewWidth: `${Math.round((point.metrics.pageViews / maxPageViews) * 100)}%`,
    leadWidth: `${Math.round((point.metrics.leads / maxLeads) * 100)}%`,
  }));
});

const buildQuery = (): FunnelQueryParams => ({
  pageId: pageId.value as number,
  startTime: dateRange.value?.[0],
  endTime: dateRange.value?.[1],
  channel: filters.channel.trim() || undefined,
  publishedVersionId: filters.publishedVersionId || undefined,
  source: filters.source,
});

const loadPages = async () => {
  const response = await getCmsPageList({ pageNum: 1, pageSize: 100 });
  if (response.code !== 10000) throw new Error(response.message || "获取页面失败");
  pages.value = response.data?.list ?? [];
  if (!pageId.value && pages.value[0]) pageId.value = pages.value[0].id;
};

const loadPublishLogs = async () => {
  if (!pageId.value) {
    publishLogs.value = [];
    return;
  }
  try {
    const response = await getPagePublishLogs(pageId.value);
    publishLogs.value = Array.isArray(response.data) ? response.data : [];
  } catch {
    // 版本筛选为辅助能力，取不到不影响看板主数据
    publishLogs.value = [];
  }
};

const loadSummary = async () => {
  if (!pageId.value) return;
  loading.value = true;
  try {
    const response = await getPageFunnelSummary(buildQuery());
    if (response.code !== 10000) throw new Error(response.message || "获取效果数据失败");
    summary.value = response.data;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "获取效果数据失败");
  } finally {
    loading.value = false;
  }
};

const handlePageChange = async () => {
  filters.publishedVersionId = undefined;
  await Promise.all([loadPublishLogs(), loadSummary()]);
};

const handleExport = async () => {
  if (!pageId.value) return;
  exporting.value = true;
  try {
    const { blob, filename } = await exportPageFunnelCsv(buildQuery());
    saveBlob(blob, filename);
    ElMessage.success("看板数据已导出");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "导出看板数据失败");
  } finally {
    exporting.value = false;
  }
};

onMounted(async () => {
  try {
    await loadPages();
    await Promise.all([loadPublishLogs(), loadSummary()]);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "初始化看板失败");
  }
});
</script>

<style scoped>
.trend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trend__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trend__date {
  flex: 0 0 96px;
  color: #6b7280;
  font-size: 12px;
}

.trend__bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.trend__bar {
  height: 8px;
  border-radius: 4px;
  min-width: 2px;
}

.trend__bar--pv {
  background: #3b82f6;
}

.trend__bar--lead {
  background: #f97316;
}

.trend__meta {
  flex: 0 0 260px;
  color: #4b5563;
  font-size: 12px;
  text-align: right;
}
</style>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">活动页面管理</h1>
        <p class="text-gray-600 mt-1">管理页面、发布状态、版本记录与回滚</p>
      </div>

      <el-card class="mb-6 shadow-none border border-gray-200">
        <el-form :model="searchForm" inline class="w-full">
          <el-form-item label="页面标题">
            <el-input v-model="searchForm.name" placeholder="请输入页面标题" clearable class="w-64" />
          </el-form-item>
          <el-form-item label="运营状态">
            <el-select
              v-model="searchForm.isAbled"
              placeholder="请选择运营状态"
              clearable
              class="w-36"
            >
              <el-option label="下线" :value="0" />
              <el-option label="上线" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="内容状态">
            <el-select
              v-model="searchForm.contentStatus"
              placeholder="请选择内容状态"
              clearable
              class="w-40"
            >
              <el-option label="草稿" value="draft" />
              <el-option label="已发布" value="published" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <div class="mb-6 flex justify-between items-center">
        <div>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增页面
          </el-button>
        </div>
        <div class="text-sm text-gray-500">共 {{ pagination.total }} 条记录</div>
      </div>

      <el-table v-loading="loading" :data="filteredTableData" border stripe class="w-full">
        <el-table-column prop="id" label="页面ID" width="100" align="center" />
        <el-table-column prop="name" label="页面标题" min-width="200" />
        <el-table-column label="运营状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isAbled === 1 ? 'success' : 'info'" size="small">
              {{ row.onlineStatusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.contentStatus === 'published' ? 'success' : 'warning'" size="small">
              {{ row.contentStatusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" align="center" />
        <el-table-column prop="update_time" label="更新时间" width="180" align="center" />
        <el-table-column label="操作" fixed="right" width="520" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row.id)">装修</el-button>
            <el-button
              type="success"
              size="small"
              :loading="row.loading"
              @click="handleToggleActivity(row)"
            >
              {{ row.isAbled === 0 ? "上线" : "下线" }}
            </el-button>
            <el-button size="small" :loading="duplicateLoadingId === row.id" @click="handleDuplicate(row.id)">
              复制
            </el-button>
            <el-button type="info" size="small" @click="handlePreview(row.id)">预览</el-button>
            <el-button size="small" @click="openPublishLogs(row.id)">发布记录</el-button>
            <el-button size="small" type="warning" @click="handleRollbackLatest(row)">回滚到最新发布</el-button>
            <el-popconfirm title="确定要删除这个页面吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-6 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-drawer v-model="publishDrawerVisible" title="发布记录" size="560px">
      <template v-if="publishLogsLoading">
        <div class="text-sm text-gray-500">加载中...</div>
      </template>
      <template v-else-if="publishLogs.length === 0">
        <el-empty description="暂无发布记录" />
      </template>
      <template v-else>
        <el-timeline>
          <el-timeline-item
            v-for="item in publishLogs"
            :key="item.versionId"
            :timestamp="formatTime(item.publishedAt)"
            placement="top"
          >
            <div class="log-card">
              <p><strong>{{ item.displayVersion }}</strong> · {{ item.operator || "当前用户" }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ item.note || "发布" }}</p>
              <div class="mt-2 flex gap-2">
                <el-button size="small" @click="previewVersion(item.versionId)">只读预览</el-button>
                <el-button size="small" type="warning" @click="rollbackVersion(item.versionId)">
                  回滚到此版本
                </el-button>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search, Refresh } from "@element-plus/icons-vue";
import {
  deletePage,
  getCmsPageById,
  getCmsPageList,
  getPagePublishLogs,
  rollbackPageVersion,
  saveCmsPage,
  updateStatus,
  type PageItem,
  type PublishLogItem,
  type SavePageParams,
} from "../api/activity";
import { usePageStore } from "../store/usePageStore";
import {
  getLocalPublishLogs,
  markPageDraft,
  resolvePageContentStatus,
  rollbackLocalPublishVersion,
  type PageContentStatus,
  type PublishLogRecord,
} from "@/utils/page-publish";

interface PageDetailResponse {
  code: number;
  message: string;
  data?: Record<string, unknown>;
}

type ActivityRow = PageItem & {
  onlineStatus: number;
  onlineStatusLabel: string;
  contentStatus: PageContentStatus;
  contentStatusLabel: string;
  loading: boolean;
};

const router = useRouter();
const route = useRoute();
const pageStore = usePageStore();

const searchForm = reactive({
  name: "",
  isAbled: undefined as number | undefined,
  contentStatus: "" as "" | PageContentStatus,
});

const tableData = ref<ActivityRow[]>([]);
const loading = ref(false);
const duplicateLoadingId = ref<number | null>(null);

const publishDrawerVisible = ref(false);
const publishLogsLoading = ref(false);
const publishLogs = ref<PublishLogRecord[]>([]);
const activeLogPageId = ref<number | null>(null);

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

const normalizeSchemaValue = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toActivityRow = (item: PageItem): ActivityRow => {
  const pageId = Number(item.id || 0);
  const onlineStatus = Number(item.isAbled || 0);
  const contentStatus =
    pageId > 0 ? resolvePageContentStatus(pageId, "draft") : ("draft" as const);

  return {
    ...item,
    onlineStatus,
    onlineStatusLabel: onlineStatus === 1 ? "上线" : "下线",
    contentStatus,
    contentStatusLabel: contentStatus === "published" ? "已发布" : "草稿",
    loading: false,
  };
};

const filteredTableData = computed(() => {
  if (!searchForm.contentStatus) {
    return tableData.value;
  }

  return tableData.value.filter((row) => row.contentStatus === searchForm.contentStatus);
});

const getTableData = async () => {
  loading.value = true;
  try {
    const response = await getCmsPageList({
      name: searchForm.name || undefined,
      isAbled:
        searchForm.isAbled !== null && searchForm.isAbled !== undefined
          ? searchForm.isAbled
          : undefined,
      pageNum: pagination.current,
      pageSize: pagination.size,
    });

    if (response.code !== 10000) {
      throw new Error(response.message || "获取页面列表失败");
    }

    const list = response.data?.list ?? [];
    pagination.total = response.data?.total ?? list.length;
    tableData.value = list.map(toActivityRow);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "获取列表数据失败";
    ElMessage.error(errorMessage);
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  getTableData();
};

const handleReset = () => {
  searchForm.name = "";
  searchForm.isAbled = undefined;
  searchForm.contentStatus = "";
  pagination.current = 1;
  getTableData();
};

const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1;
  getTableData();
};

const handleCurrentChange = (page: number) => {
  pagination.current = page;
  getTableData();
};

const handleEdit = (id: number) => {
  const routeData = router.resolve({ path: "/decorate", query: { id } });
  window.open(routeData.href, "_blank");
};

const handleToggleActivity = async (row: ActivityRow) => {
  const targetStatus = row.isAbled === 0 ? 1 : 0;
  const action = targetStatus === 1 ? "上线" : "下线";

  try {
    await ElMessageBox.confirm(`确定要${action}页面【${row.name}】吗？`, "操作确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    row.loading = true;
    const response = await updateStatus({ id: row.id, isAbled: targetStatus });
    if ((response as { code?: number }).code !== 10000) {
      throw new Error((response as { message?: string }).message || `${action}失败`);
    }

    ElMessage.success(`${action}成功`);
    await getTableData();
  } catch (error: unknown) {
    if (error !== "cancel") {
      const errorMessage = error instanceof Error ? error.message : `${action}失败`;
      ElMessage.error(errorMessage);
    }
  } finally {
    row.loading = false;
  }
};

const handleDelete = async (id: number) => {
  try {
    const response = await deletePage({ id });
    if ((response as { code?: number }).code !== 10000) {
      throw new Error((response as { message?: string }).message || "删除失败");
    }

    ElMessage.success("删除成功");
    await getTableData();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "删除失败";
    ElMessage.error(errorMessage);
  }
};

const handleDuplicate = async (id: number) => {
  duplicateLoadingId.value = id;
  try {
    const response = (await getCmsPageById(id)) as PageDetailResponse;
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || "获取页面详情失败");
    }

    const sourceData = { ...response.data };
    const sourceName = typeof sourceData.name === "string" ? sourceData.name : `页面${id}`;
    const cloneName = `${sourceName}-副本`;

    delete sourceData.id;
    delete sourceData.create_time;
    delete sourceData.update_time;
    delete sourceData.isAbled;

    const clonePayload: SavePageParams = {
      ...sourceData,
      name: cloneName,
      schema: normalizeSchemaValue(sourceData.schema),
    };

    const saveResponse = await saveCmsPage(clonePayload);
    if ((saveResponse as { code?: number }).code !== 10000) {
      throw new Error((saveResponse as { message?: string }).message || "复制页面失败");
    }

    ElMessage.success("页面复制成功");
    await getTableData();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "复制页面失败";
    ElMessage.error(errorMessage);
  } finally {
    duplicateLoadingId.value = null;
  }
};

const handleAdd = () => {
  pageStore.setInitPageSchema();
  router.push("/decorate");
};

const handlePreview = (id: number) => {
  const url = router.resolve({
    path: "/preview",
    query: { id },
  });
  window.open(url.href, "_blank");
};

const normalizeLogRecord = (pageId: number, item: PublishLogItem): PublishLogRecord => {
  const timestamp = Number(item.publishedAt || Date.now());
  return {
    pageId,
    versionId: String(item.versionId),
    displayVersion: String(item.displayVersion || `v${item.versionId}`),
    operator: String(item.operator || "当前用户"),
    note: String(item.note || "发布"),
    publishedAt: Number.isFinite(timestamp) ? timestamp : Date.now(),
  };
};

const openPublishLogs = async (pageId: number) => {
  activeLogPageId.value = pageId;
  publishDrawerVisible.value = true;
  publishLogsLoading.value = true;
  try {
    const resp = (await getPagePublishLogs(pageId)) as {
      code?: number;
      data?: PublishLogItem[];
      message?: string;
    };
    if ((resp.code ?? 10000) !== 10000) {
      throw new Error(resp.message || "获取发布记录失败");
    }
    const serverLogs = Array.isArray(resp.data) ? resp.data : [];
    if (serverLogs.length > 0) {
      publishLogs.value = serverLogs
        .map((item) => normalizeLogRecord(pageId, item))
        .sort((a, b) => b.publishedAt - a.publishedAt);
      return;
    }

    publishLogs.value = getLocalPublishLogs(pageId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "获取发布记录失败";
    ElMessage.warning(`${errorMessage}，已使用本地记录展示`);
    publishLogs.value = getLocalPublishLogs(pageId);
  } finally {
    publishLogsLoading.value = false;
  }
};

const rollbackVersion = async (versionId: string) => {
  if (!activeLogPageId.value) {
    return;
  }

  await ElMessageBox.confirm(
    "回滚会覆盖当前编辑内容并将页面置为草稿待发布，是否继续？",
    "确认回滚",
    {
      confirmButtonText: "确认回滚",
      cancelButtonText: "取消",
      type: "warning",
    },
  );

  try {
    const response = (await rollbackPageVersion({
      pageId: activeLogPageId.value,
      versionId,
    })) as { code?: number; message?: string; data?: { schema?: unknown } };

    if ((response.code ?? 10000) !== 10000) {
      throw new Error(response.message || "回滚失败");
    }

    markPageDraft(activeLogPageId.value);
    ElMessage.success("回滚成功，已标记为草稿待发布");
    await getTableData();

    const decorateUrl = router.resolve({
      path: "/decorate",
      query: {
        id: activeLogPageId.value,
        rollbackVersionId: versionId,
      },
    });
    window.open(decorateUrl.href, "_blank");
  } catch (error: unknown) {
    const localHit = rollbackLocalPublishVersion({
      pageId: activeLogPageId.value,
      versionId,
    });

    if (!localHit) {
      const errorMessage = error instanceof Error ? error.message : "回滚失败";
      ElMessage.error(errorMessage);
      return;
    }

    ElMessage.warning("后端回滚接口暂不可用，已切换到本地回滚模式");
    await getTableData();
    const decorateUrl = router.resolve({
      path: "/decorate",
      query: {
        id: activeLogPageId.value,
        rollbackVersionId: versionId,
      },
    });
    window.open(decorateUrl.href, "_blank");
  }
};

const handleRollbackLatest = async (row: ActivityRow) => {
  const logs = getLocalPublishLogs(row.id);
  if (logs.length === 0) {
    ElMessage.info("暂无可回滚的发布记录");
    return;
  }
  activeLogPageId.value = row.id;
  await rollbackVersion(logs[0].versionId);
};

const previewVersion = (versionId: string) => {
  if (!activeLogPageId.value) {
    return;
  }
  const url = router.resolve({
    path: "/preview",
    query: {
      id: activeLogPageId.value,
      versionId,
    },
  });
  window.open(url.href, "_blank");
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
};

const tryOpenLogsFromQuery = async () => {
  const pageId = Number(route.query.publishLogsPageId || 0);
  if (Number.isFinite(pageId) && pageId > 0) {
    await openPublishLogs(pageId);
  }
};

onMounted(async () => {
  await getTableData();
  await tryOpenLogsFromQuery();
});

watch(
  () => route.query.publishLogsPageId,
  async () => {
    await tryOpenLogsFromQuery();
  },
);
</script>

<style scoped>
.log-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fff;
}
</style>

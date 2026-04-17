<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">活动页面管理</h1>
        <p class="text-gray-600 mt-1">管理您的活动页面内容</p>
      </div>

      <el-card class="mb-6 shadow-none border border-gray-200">
        <el-form :model="searchForm" inline class="w-full">
          <el-form-item label="页面标题">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入页面标题"
              clearable
              class="w-64"
            />
          </el-form-item>
          <el-form-item label="页面状态">
            <el-select
              v-model="searchForm.isAbled"
              placeholder="请选择页面状态"
              clearable
              class="w-32"
            >
              <el-option label="下线" :value="0" />
              <el-option label="上线" :value="1" />
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

      <el-table v-loading="loading" :data="tableData" border stripe class="w-full">
        <el-table-column prop="id" label="页面ID" width="100" align="center" />
        <el-table-column prop="name" label="页面标题" min-width="200" />
        <el-table-column
          prop="status"
          label="页面状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.isAbled === 1 ? 'success' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="create_time"
          label="创建时间"
          width="180"
          align="center"
        />
        <el-table-column
          prop="update_time"
          label="更新时间"
          width="180"
          align="center"
        />
        <el-table-column label="操作" fixed="right" width="360" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row.id)">
              装修
            </el-button>
            <el-button
              type="success"
              size="small"
              :loading="row.loading"
              @click="handleToggleActivity(row)"
            >
              {{ row.isAbled === 0 ? "上线" : "下线" }}
            </el-button>
            <el-button
              size="small"
              :loading="duplicateLoadingId === row.id"
              @click="handleDuplicate(row.id)"
            >
              复制
            </el-button>
            <el-button type="info" size="small" @click="handlePreview(row.id)">
              预览
            </el-button>
            <el-popconfirm
              title="确定要删除这个页面吗？"
              @confirm="handleDelete(row.id)"
            >
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search, Refresh } from "@element-plus/icons-vue";
import {
  deletePage,
  getCmsPageById,
  getCmsPageList,
  saveCmsPage,
  updateStatus,
  type PageItem,
  type SavePageParams,
} from "../api/activity";
import { usePageStore } from "../store/usePageStore";

type ActivityRow = PageItem & {
  status: string;
  loading: boolean;
};

interface PageDetailResponse {
  code: number;
  message: string;
  data?: Record<string, unknown>;
}

const router = useRouter();
const pageStore = usePageStore();

const searchForm = reactive({
  name: "",
  isAbled: undefined as number | undefined,
});

const tableData = ref<ActivityRow[]>([]);
const loading = ref(false);
const duplicateLoadingId = ref<number | null>(null);

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
    tableData.value = list.map((item) => ({
      ...item,
      status: item.isAbled === 1 ? "上线" : "下线",
      loading: false,
    }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取列表数据失败";
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
  const actionText = targetStatus === 1 ? "上架" : "下架";

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}页面【${row.name}】吗？`,
      "操作确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    row.loading = true;
    const response = await updateStatus({ id: row.id, isAbled: targetStatus });
    if ((response as { code?: number }).code !== 10000) {
      throw new Error((response as { message?: string }).message || `${action}失败`);
    }

    ElMessage.success(`${action}成功`);
    await getTableData();
  } catch (error: unknown) {
    if (error !== "cancel") {
      const errorMessage =
        error instanceof Error ? error.message : `${action}失败`;
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

onMounted(() => {
  getTableData();
});
</script>

<style scoped>
/* 使用 Tailwind CSS 原子类，无需额外样式 */
</style>

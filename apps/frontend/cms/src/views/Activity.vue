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
          <el-button type="success" @click="openAiDialog">
            <el-icon><Plus /></el-icon>
            AI 新建
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
        <el-table-column label="操作" fixed="right" width="700" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row.id)">装修</el-button>
            <el-button
              type="success"
              size="small"
              :loading="row.loading"
              :disabled="!canPublish"
              :title="canPublish ? '' : '仅管理员可发布'"
              @click="handleToggleActivity(row)"
            >
              {{ row.isAbled === 0 ? "上线" : "下线" }}
            </el-button>
            <el-button size="small" :loading="duplicateLoadingId === row.id" @click="handleDuplicate(row.id)">
              复制
            </el-button>
            <el-button type="info" size="small" @click="handlePreview(row.id)">预览</el-button>
            <el-button size="small" @click="openPublishLogs(row.id)">发布记录</el-button>
            <el-button size="small" @click="openLeadDrawer(row.id)">线索</el-button>
            <el-button size="small" type="warning" @click="openAiDiagnosis(row)">
              <el-icon><TrendCharts /></el-icon>
              AI 优化
            </el-button>
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
              <p><strong>{{ item.displayVersion }}</strong> - {{ item.operator || "当前用户" }}</p>
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

    <el-drawer v-model="leadDrawerVisible" title="线索列表" size="680px">
      <template v-if="leadLoading">
        <div class="text-sm text-gray-500">加载中...</div>
      </template>
      <template v-else>
        <el-table :data="leadList" border stripe class="w-full">
          <el-table-column prop="name" label="姓名" min-width="110" />
          <el-table-column prop="phoneNumber" label="手机号" min-width="140" />
          <el-table-column prop="remark" label="备注" min-width="160" />
          <el-table-column label="UTM" min-width="220">
            <template #default="{ row }">
              <div class="text-xs text-gray-600">{{ formatMap(row.utm) }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" min-width="160" />
        </el-table>

        <div class="mt-4 flex justify-end">
          <el-pagination
            v-model:current-page="leadPagination.pageNum"
            v-model:page-size="leadPagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="leadPagination.total"
            layout="total, sizes, prev, pager, next"
            background
            @size-change="handleLeadPageSizeChange"
            @current-change="handleLeadPageChange"
          />
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="aiDiagnoseDrawerVisible" title="AI 优化建议" size="720px">
      <template v-if="aiDiagnoseLoading">
        <div class="text-sm text-gray-500">AI 正在分析页面结构与转化漏斗...</div>
      </template>
      <template v-else-if="!aiDiagnosis">
        <el-empty description="暂无优化建议" />
      </template>
      <template v-else>
        <div class="diagnosis-summary">
          <div class="text-sm text-gray-500">页面</div>
          <div class="diagnosis-title">{{ aiDiagnosisPageName || `页面 ${aiDiagnosis.pageId}` }}</div>
          <p class="diagnosis-copy">{{ aiDiagnosis.summary }}</p>
        </div>

        <div class="diagnosis-list">
          <div
            v-for="(item, index) in aiDiagnosis.advice"
            :key="`${item.category}-${index}`"
            class="diagnosis-item"
          >
            <div class="diagnosis-item__header">
              <div class="diagnosis-item__meta">
                <el-tag :type="getAdviceTagType(item.severity)" size="small">
                  {{ getAdviceSeverityLabel(item.severity) }}
                </el-tag>
                <el-tag type="info" size="small" effect="plain">
                  {{ getAdviceCategoryLabel(item.category) }}
                </el-tag>
              </div>
              <span class="diagnosis-target">
                关联组件：{{ item.targetComponentId || "页面级" }}
              </span>
            </div>
            <p class="diagnosis-problem">{{ item.problem }}</p>
            <div class="diagnosis-action">
              <span class="diagnosis-action__label">建议动作</span>
              <span>{{ item.suggestion }}</span>
            </div>
            <div class="diagnosis-impact">
              <span class="diagnosis-action__label">预期影响</span>
              <span>{{ item.expectedImpact }}</span>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>

    <TemplatePicker
      v-model="showTemplatePicker"
      @created="handleTemplateCreated"
      @skip="handleSkipTemplate"
    />

    <el-dialog
      v-model="aiDialogVisible"
      title="AI 新建活动页"
      width="760px"
      destroy-on-close
    >
      <el-form label-width="96px" class="ai-form">
        <el-form-item label="页面标题" required>
          <el-input v-model="aiForm.pageName" placeholder="如：618 爆款限时购" maxlength="80" />
        </el-form-item>
        <el-form-item label="活动类型" required>
          <el-select v-model="aiForm.activityType" class="w-full" placeholder="请选择活动类型">
            <el-option
              v-for="item in aiActivityOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标人群" required>
          <el-input v-model="aiForm.audience" placeholder="如：25-35 岁新锐白领" maxlength="120" />
        </el-form-item>
        <el-form-item label="优惠信息" required>
          <el-input
            v-model="aiForm.promotion"
            placeholder="如：满 299 减 80，前 100 名加赠礼包"
            maxlength="160"
          />
        </el-form-item>
        <el-form-item label="按钮文案" required>
          <el-input v-model="aiForm.ctaText" placeholder="如：立即领取优惠" maxlength="40" />
        </el-form-item>
        <el-form-item label="留资目标">
          <el-input
            v-model="aiForm.leadGoal"
            placeholder="如：领取优惠券并预约专属顾问"
            maxlength="120"
          />
        </el-form-item>
        <el-form-item label="页面风格">
          <el-select v-model="aiForm.styleTone" class="w-full" placeholder="请选择页面风格">
            <el-option
              v-for="item in aiStyleOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="商品信息">
          <div class="ai-products">
            <div
              v-for="(product, index) in aiForm.products"
              :key="index"
              class="ai-product-row"
            >
              <el-input v-model="product.name" placeholder="商品名" maxlength="80" />
              <el-input v-model="product.price" placeholder="现价" maxlength="20" />
              <el-input v-model="product.originalPrice" placeholder="原价" maxlength="20" />
              <el-input v-model="product.sellingPoint" placeholder="卖点" maxlength="120" />
              <el-button
                size="small"
                type="danger"
                text
                @click="removeAiProduct(index)"
              >
                删除
              </el-button>
            </div>
            <el-button
              size="small"
              :disabled="aiForm.products.length >= 6"
              @click="addAiProduct"
            >
              添加商品
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="补充描述">
          <el-input
            v-model="aiForm.extraPrompt"
            type="textarea"
            :rows="3"
            placeholder="如：突出夏季清爽感，首屏要强调限时福利"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="aiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenerating" @click="submitAiGenerate">
          生成草稿
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import TemplatePicker from "@/components/TemplatePicker.vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search, TrendCharts } from "@element-plus/icons-vue";
import type {
  AiAdviceCategory,
  AiAdviceSeverity,
  AiDiagnosePageResponse,
  AiGeneratePageRequest,
} from "@cms/types";
import { aiDiagnosePage, aiGeneratePage } from "@/api/ai";
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
import { getLeadList, type LeadItem } from "@/api/lead";
import { usePageStore } from "../store/usePageStore";
import { trackEvent } from "@/utils/tracking";
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

interface AiProductFormItem {
  name: string;
  price: string;
  originalPrice: string;
  sellingPoint: string;
}

const userRole = ref(localStorage.getItem("role") || "editor");
const showTemplatePicker = ref(false);
const canPublish = computed(() => userRole.value === "admin");

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
const aiDialogVisible = ref(false);
const aiGenerating = ref(false);
const aiDiagnoseDrawerVisible = ref(false);
const aiDiagnoseLoading = ref(false);
const aiDiagnosis = ref<AiDiagnosePageResponse | null>(null);
const aiDiagnosisPageName = ref("");

const aiActivityOptions = ["电商大促", "新品首发", "限时秒杀", "会员专享"];
const aiStyleOptions = ["热烈促销", "高级简洁", "年轻活力", "温暖亲和"];

const adviceSeverityLabels: Record<AiAdviceSeverity, string> = {
  info: "观察",
  warning: "建议优化",
  critical: "重点处理",
};

const adviceCategoryLabels: Record<AiAdviceCategory, string> = {
  structure: "结构",
  copywriting: "文案",
  cta: "行动按钮",
  form: "表单",
  product: "商品",
  tracking: "埋点",
};

const createAiProduct = (): AiProductFormItem => ({
  name: "",
  price: "",
  originalPrice: "",
  sellingPoint: "",
});

const aiForm = reactive({
  pageName: "",
  activityType: "电商大促",
  audience: "",
  promotion: "",
  ctaText: "立即领取优惠",
  leadGoal: "",
  styleTone: "热烈促销",
  extraPrompt: "",
  products: [createAiProduct()],
});

const publishDrawerVisible = ref(false);
const publishLogsLoading = ref(false);
const publishLogs = ref<PublishLogRecord[]>([]);
const activeLogPageId = ref<number | null>(null);

const leadDrawerVisible = ref(false);
const leadLoading = ref(false);
const activeLeadPageId = ref<number | null>(null);
const leadList = ref<LeadItem[]>([]);
const leadPagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
});

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
    pageId > 0 ? resolvePageContentStatus(onlineStatus, "draft") : ("draft" as const);

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

    await trackEvent({
      eventType: "cta_click",
      pageId: row.id,
      ctaText: targetStatus === 1 ? "online_page" : "offline_page",
      payload: { action, targetStatus },
    });

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
  showTemplatePicker.value = true;
};

const resetAiForm = () => {
  aiForm.pageName = "";
  aiForm.activityType = "电商大促";
  aiForm.audience = "";
  aiForm.promotion = "";
  aiForm.ctaText = "立即领取优惠";
  aiForm.leadGoal = "";
  aiForm.styleTone = "热烈促销";
  aiForm.extraPrompt = "";
  aiForm.products = [createAiProduct()];
};

const openAiDialog = () => {
  resetAiForm();
  aiDialogVisible.value = true;
};

const addAiProduct = () => {
  if (aiForm.products.length >= 6) {
    return;
  }
  aiForm.products.push(createAiProduct());
};

const removeAiProduct = (index: number) => {
  aiForm.products.splice(index, 1);
};

const buildAiGeneratePayload = (): AiGeneratePageRequest => {
  return {
    pageName: aiForm.pageName.trim(),
    activityType: aiForm.activityType.trim(),
    audience: aiForm.audience.trim(),
    promotion: aiForm.promotion.trim(),
    ctaText: aiForm.ctaText.trim(),
    leadGoal: aiForm.leadGoal.trim() || undefined,
    styleTone: aiForm.styleTone.trim() || undefined,
    extraPrompt: aiForm.extraPrompt.trim() || undefined,
    products: aiForm.products
      .map((product) => ({
        name: product.name.trim(),
        price: product.price.trim() || undefined,
        originalPrice: product.originalPrice.trim() || undefined,
        sellingPoint: product.sellingPoint.trim() || undefined,
      }))
      .filter((product) => product.name),
  };
};

const validateAiPayload = (payload: AiGeneratePageRequest) => {
  if (!payload.pageName) {
    return "请填写页面标题";
  }
  if (!payload.activityType) {
    return "请选择活动类型";
  }
  if (!payload.audience) {
    return "请填写目标人群";
  }
  if (!payload.promotion) {
    return "请填写优惠信息";
  }
  if (!payload.ctaText) {
    return "请填写按钮文案";
  }
  return "";
};

const submitAiGenerate = async () => {
  const payload = buildAiGeneratePayload();
  const validationMessage = validateAiPayload(payload);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  aiGenerating.value = true;
  try {
    const response = await aiGeneratePage(payload);
    if (response.code !== 10000 || !response.data?.pageId) {
      throw new Error(response.message || "AI 生成页面失败");
    }

    aiDialogVisible.value = false;
    const warnings = response.data.warnings ?? [];
    if (warnings.length > 0) {
      ElMessage.warning(warnings.slice(0, 2).join("；"));
    } else {
      ElMessage.success(response.data.summary || "AI 页面草稿已生成");
    }

    await trackEvent({
      eventType: "cta_click",
      pageId: response.data.pageId,
      ctaText: "ai_generate_page",
      payload: {
        activityType: payload.activityType,
        productCount: payload.products.length,
      },
    });

    router.push({ path: "/decorate", query: { id: response.data.pageId } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "AI 生成页面失败";
    ElMessage.error(errorMessage);
  } finally {
    aiGenerating.value = false;
  }
};

const getAdviceTagType = (severity: AiAdviceSeverity) => {
  if (severity === "critical") {
    return "danger";
  }
  if (severity === "warning") {
    return "warning";
  }
  return "info";
};

const getAdviceSeverityLabel = (severity: AiAdviceSeverity) =>
  adviceSeverityLabels[severity] || severity;

const getAdviceCategoryLabel = (category: AiAdviceCategory) =>
  adviceCategoryLabels[category] || category;

const openAiDiagnosis = async (row: ActivityRow) => {
  aiDiagnosisPageName.value = row.name;
  aiDiagnosis.value = null;
  aiDiagnoseDrawerVisible.value = true;
  aiDiagnoseLoading.value = true;

  try {
    const response = await aiDiagnosePage({ pageId: row.id });
    if (response.code !== 10000 || !response.data) {
      throw new Error(response.message || "获取 AI 优化建议失败");
    }

    aiDiagnosis.value = response.data;
    await trackEvent({
      eventType: "page_view",
      pageId: row.id,
      payload: {
        source: "ai_diagnosis_drawer",
        adviceCount: response.data.advice.length,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "获取 AI 优化建议失败";
    ElMessage.error(errorMessage);
  } finally {
    aiDiagnoseLoading.value = false;
  }
};

const handleTemplateCreated = (pageId: number) => {
  void trackEvent({
    eventType: "cta_click",
    pageId,
    ctaText: "create_page_from_template",
    payload: { source: "template_picker" },
  });
  router.push({ path: "/decorate", query: { id: pageId } });
};

const handleSkipTemplate = () => {
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

      await trackEvent({
        eventType: "page_view",
        pageId,
        payload: {
          source: "publish_logs",
          count: publishLogs.value.length,
        },
      });
      return;
    }

    publishLogs.value = [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "获取发布记录失败";
    ElMessage.warning(errorMessage);
    publishLogs.value = [];
  } finally {
    publishLogsLoading.value = false;
  }
};

const openLeadDrawer = async (pageId: number) => {
  activeLeadPageId.value = pageId;
  leadPagination.pageNum = 1;
  leadDrawerVisible.value = true;
  await loadLeadList();
};

const loadLeadList = async () => {
  if (!activeLeadPageId.value) {
    return;
  }

  leadLoading.value = true;
  try {
    const response = await getLeadList({
      pageId: activeLeadPageId.value,
      pageNum: leadPagination.pageNum,
      pageSize: leadPagination.pageSize,
    });

    if (response.code !== 10000) {
      throw new Error(response.message || "获取线索列表失败");
    }

    leadList.value = response.data?.list ?? [];
    leadPagination.total = response.data?.total ?? 0;

    await trackEvent({
      eventType: "page_view",
      pageId: activeLeadPageId.value,
      payload: {
        source: "lead_drawer",
        total: leadPagination.total,
      },
    });
  } catch (error: unknown) {
    leadList.value = [];
    leadPagination.total = 0;
    const message = error instanceof Error ? error.message : "获取线索列表失败";
    ElMessage.error(message);
  } finally {
    leadLoading.value = false;
  }
};

const handleLeadPageChange = async (pageNum: number) => {
  leadPagination.pageNum = pageNum;
  await loadLeadList();
};

const handleLeadPageSizeChange = async (pageSize: number) => {
  leadPagination.pageSize = pageSize;
  leadPagination.pageNum = 1;
  await loadLeadList();
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
    await trackEvent({
      eventType: "cta_click",
      pageId: activeLogPageId.value,
      ctaText: "rollback_page_version",
      payload: { versionId },
    });

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
    const localHit = await rollbackLocalPublishVersion({
      pageId: activeLogPageId.value,
      versionId,
    });

    if (!localHit) {
      const errorMessage = error instanceof Error ? error.message : "回滚失败";
      ElMessage.error(errorMessage);
      return;
    }

    ElMessage.warning("已使用服务端回滚");
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
  const logs = await getLocalPublishLogs(row.id);
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

const formatMap = (map: Record<string, string> | null) => {
  if (!map) {
    return "-";
  }
  const entries = Object.entries(map);
  if (entries.length === 0) {
    return "-";
  }
  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
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

.ai-form {
  max-height: 64vh;
  overflow-y: auto;
  padding-right: 8px;
}

.ai-products {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 10px;
}

.ai-product-row {
  display: grid;
  grid-template-columns: minmax(120px, 1.4fr) minmax(72px, 0.7fr) minmax(72px, 0.7fr) minmax(140px, 1.5fr) 52px;
  gap: 8px;
  align-items: center;
}

.diagnosis-summary {
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
  background: #f8fafc;
}

.diagnosis-title {
  margin-top: 4px;
  color: #111827;
  font-size: 18px;
  font-weight: 600;
}

.diagnosis-copy {
  margin: 8px 0 0;
  color: #4b5563;
  line-height: 1.7;
}

.diagnosis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diagnosis-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
  background: #fff;
}

.diagnosis-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.diagnosis-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.diagnosis-target {
  color: #6b7280;
  font-size: 12px;
}

.diagnosis-problem {
  margin: 10px 0;
  color: #111827;
  font-weight: 600;
  line-height: 1.6;
}

.diagnosis-action,
.diagnosis-impact {
  display: flex;
  gap: 8px;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.6;
}

.diagnosis-action__label {
  flex: 0 0 56px;
  color: #6b7280;
}

@media (max-width: 760px) {
  .ai-product-row {
    grid-template-columns: 1fr;
  }

  .diagnosis-item__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

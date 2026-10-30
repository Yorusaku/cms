<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">业务页面管理</h1>
        <p class="text-gray-600 mt-1">管理页面、发布状态、版本记录与回滚</p>
      </div>

      <el-alert
        v-if="isViewer"
        class="mb-4"
        type="info"
        :closable="false"
        title="当前为观察员账号：仅可查看页面与发布记录，不能建页、提交审核、发布或回滚。"
      />

      <el-card class="mb-6 shadow-none border border-gray-200">
        <el-form :model="searchForm" inline class="w-full filter-form">
          <el-form-item label="页面标题">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入页面标题"
              clearable
              class="filter-control filter-control-name"
            />
          </el-form-item>
          <el-form-item label="运营状态">
            <el-select
              v-model="searchForm.isAbled"
              placeholder="请选择运营状态"
              clearable
              class="filter-control filter-control-status"
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
              class="filter-control filter-control-status"
            >
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending_review" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="审核通过" value="approved" />
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
          <el-button v-if="canEdit" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增页面
          </el-button>
          <el-button v-if="canEdit" type="success" @click="openAiDialog">
            <el-icon><Plus /></el-icon>
            AI 新建
          </el-button>
        </div>
        <div class="text-sm text-gray-500">共 {{ pagination.total }} 条记录</div>
      </div>

      <el-table v-loading="loading" :data="filteredTableData" border stripe class="w-full">
        <el-table-column prop="id" label="页面ID" width="90" align="center" />
        <el-table-column prop="name" label="页面标题" min-width="240" show-overflow-tooltip />
        <el-table-column label="运营状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isAbled === 1 ? 'success' : 'info'" size="small">
              {{ row.onlineStatusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容状态" width="130" align="center">
          <template #default="{ row }">
            <el-tooltip
              v-if="getRowReviewNote(row)"
              :content="`审核备注：${getRowReviewNote(row)}`"
              placement="top"
            >
              <el-tag :type="getStatusTagType(row.contentStatus)" size="small">
                {{ row.contentStatusLabel }}
              </el-tag>
            </el-tooltip>
            <el-tag v-else :type="getStatusTagType(row.contentStatus)" size="small">
              {{ row.contentStatusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">{{ formatDateTime(row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" width="160" align="center">
          <template #default="{ row }">{{ formatDateTime(row.update_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="240" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button v-if="canEdit" link type="primary" size="small" @click="handleEdit(row.id)">
                编辑
              </el-button>
              <el-button link type="primary" size="small" @click="handlePreview(row.id)">
                预览
              </el-button>

              <!-- 当前流程的主要动作：沿用原有状态与权限分支，只调整展示位置 -->
              <el-button
                v-if="getPrimaryAction(row) === 'submit-review'"
                link
                type="primary"
                size="small"
                @click="handleSubmitReview(row)"
              >
                提交审核
              </el-button>
              <el-button
                v-else-if="getPrimaryAction(row) === 'approve'"
                link
                type="primary"
                size="small"
                @click="handleReview(row, 'approved')"
              >
                通过审核
              </el-button>
              <el-button
                v-else-if="getPrimaryAction(row) === 'publish'"
                link
                type="primary"
                size="small"
                @click="handlePublishApproved(row)"
              >
                发布
              </el-button>

              <el-dropdown
                trigger="click"
                placement="bottom-end"
                popper-class="activity-more-menu"
                class="row-more"
              >
                <el-button link size="small" class="more-trigger" aria-label="更多操作">
                  更多
                  <el-icon class="more-icon"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 流程动作：成为行内主动作时不再重复出现 -->
                    <el-dropdown-item
                      v-if="
                        canEdit &&
                        ['draft', 'rejected'].includes(row.status) &&
                        getPrimaryAction(row) !== 'submit-review'
                      "
                      @click="handleSubmitReview(row)"
                    >
                      提交审核
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="
                        canReview &&
                        row.status === 'pending_review' &&
                        getPrimaryAction(row) !== 'approve'
                      "
                      @click="handleReview(row, 'approved')"
                    >
                      通过审核
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="canReview && row.status === 'pending_review'"
                      @click="handleReview(row, 'rejected')"
                    >
                      驳回
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="
                        canPublish &&
                        row.status === 'approved' &&
                        getPrimaryAction(row) !== 'publish'
                      "
                      @click="handlePublishApproved(row)"
                    >
                      发布
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="canEdit"
                      :disabled="duplicateLoadingId === row.id"
                      divided
                      @click="handleDuplicate(row.id)"
                    >
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item v-if="canEdit" @click="openLeadDrawer(row.id)">
                      线索
                    </el-dropdown-item>

                    <el-dropdown-item divided @click="openPublishLogs(row.id)">
                      发布记录
                    </el-dropdown-item>
                    <el-dropdown-item @click="openAiDiagnosis(row)">
                      优化建议
                    </el-dropdown-item>

                    <!-- 上线/下线：保留原有禁用条件（已下线且内容状态非 offline 时禁用） -->
                    <el-dropdown-item
                      v-if="canPublish"
                      divided
                      :disabled="row.isAbled === 0 && row.status !== 'offline'"
                      @click="handleToggleActivity(row)"
                    >
                      {{ row.isAbled === 0 ? "上线" : "下线" }}
                    </el-dropdown-item>

                    <el-dropdown-item
                      v-if="canPublish"
                      divided
                      style="color: var(--el-color-danger)"
                      @click="confirmAndDelete(row)"
                    >
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
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
              <p>
                <strong>{{ item.displayVersion }}</strong>
                <el-tag v-if="item.isCurrent" type="success" size="small" class="ml-2">当前线上</el-tag>
                <el-tag v-else-if="item.action === 'rollback'" type="warning" size="small" class="ml-2">回滚版本</el-tag>
              </p>
              <p class="text-xs text-gray-500 mt-1">
                审核人：{{ item.reviewerName || "-" }}
                <span class="mx-1">·</span>
                发布人：{{ item.publisherName || item.operator || "当前用户" }}
                <template v-if="item.rollbackerName">
                  <span class="mx-1">·</span>
                  回滚人：{{ item.rollbackerName }}
                </template>
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ item.note || "发布" }}</p>
              <div class="mt-2 flex gap-2">
                <el-button size="small" @click="previewVersion(item.versionId)">只读预览</el-button>
                <el-button
                  v-if="canPublish"
                  size="small"
                  type="warning"
                  @click="rollbackVersion(item.versionId)"
                >
                  回滚到此版本
                </el-button>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <el-drawer v-model="leadDrawerVisible" title="线索列表" size="820px">
      <div class="mb-4 flex gap-3">
        <el-select v-model="leadFilters.status" clearable placeholder="全部跟进状态" class="w-36" @change="reloadLeadList">
          <el-option label="待跟进" value="new" />
          <el-option label="已联系" value="contacted" />
          <el-option label="已转化" value="converted" />
          <el-option label="无效线索" value="invalid" />
        </el-select>
        <el-input v-model="leadFilters.channel" clearable placeholder="按渠道或 UTM 搜索" class="w-56" @keyup.enter="reloadLeadList" />
        <el-button @click="reloadLeadList">筛选</el-button>
        <el-button v-if="canPublish" :loading="exportingLeads" @click="handleExportLeads">
          导出 CSV
        </el-button>
        <el-button v-if="canPublish" type="warning" plain :loading="purgingLeads" @click="handlePurgeLeads">
          清理超期线索
        </el-button>
      </div>

      <el-alert
        v-if="canEdit && retentionPolicy"
        class="mb-3"
        type="info"
        :closable="false"
        :title="`数据保留策略：线索保留 ${retentionPolicy.retentionDays} 天，${formatDateLabel(retentionPolicy.cutoffAt)} 之前的线索可清理`"
      />
      <template v-if="leadLoading">
        <div class="text-sm text-gray-500">加载中...</div>
      </template>
      <template v-else>
        <el-table :data="leadList" border stripe class="w-full">
          <el-table-column prop="name" label="姓名" min-width="110" />
          <el-table-column prop="phoneNumber" label="手机号" min-width="140" />
          <el-table-column prop="remark" label="备注" min-width="160" />
          <el-table-column prop="publishedVersionId" label="来源版本" min-width="130" />
          <el-table-column label="渠道" min-width="180">
            <template #default="{ row }">
              <div class="text-xs text-gray-600">{{ formatMap(row.channel) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="UTM" min-width="220">
            <template #default="{ row }">
              <div class="text-xs text-gray-600">{{ formatMap(row.utm) }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" min-width="160" />
          <el-table-column label="跟进状态" min-width="130">
            <template #default="{ row }">
              <el-select
                :model-value="row.status"
                size="small"
                :disabled="!canEdit"
                @change="handleLeadStatusChange(row, $event)"
              >
                <el-option label="待跟进" value="new" />
                <el-option label="已联系" value="contacted" />
                <el-option label="已转化" value="converted" />
                <el-option label="无效" value="invalid" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="跟进备注" min-width="150">
            <template #default="{ row }">
              <el-button v-if="canEdit" size="small" @click="editLeadRemark(row)">
                {{ row.followUpRemark ? "修改备注" : "添加备注" }}
              </el-button>
              <span v-else class="text-xs text-gray-500">{{ row.followUpRemark || "-" }}</span>
            </template>
          </el-table-column>
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
      title="AI 新建业务页面"
      width="760px"
      destroy-on-close
    >
      <el-form label-width="96px" class="ai-form">
        <el-form-item label="页面标题" required>
          <el-input v-model="aiForm.pageName" placeholder="如：员工服务办理中心" maxlength="80" />
        </el-form-item>
        <el-form-item label="页面场景" required>
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
          <el-input v-model="aiForm.audience" placeholder="如：企业员工或客户" maxlength="120" />
        </el-form-item>
        <el-form-item label="页面需求" required>
          <el-input
            v-model="aiForm.promotion"
            placeholder="如：展示服务介绍、办理须知和常见问题"
            maxlength="160"
          />
        </el-form-item>
        <el-form-item label="提交文案" required>
          <el-input v-model="aiForm.ctaText" placeholder="如：提交申请" maxlength="40" />
        </el-form-item>
        <el-form-item label="业务目标">
          <el-input
            v-model="aiForm.leadGoal"
            placeholder="如：收集预约信息或展示办理进度"
            maxlength="120"
          />
        </el-form-item>
        <el-form-item label="视觉风格">
          <el-select v-model="aiForm.styleTone" class="w-full" placeholder="请选择页面风格">
            <el-option
              v-for="item in aiStyleOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="补充描述">
          <el-input
            v-model="aiForm.extraPrompt"
            type="textarea"
            :rows="3"
            placeholder="如：首屏突出办理条件，列表展示处理状态"
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
import { ArrowDown, Plus, Refresh, Search } from "@element-plus/icons-vue";
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
  publishCmsPage,
  reviewPage,
  rollbackPageVersion,
  saveCmsPage,
  submitPageReview,
  updateStatus,
  type PageItem,
  type PublishLogItem,
  type SavePageParams,
} from "../api/activity";
import {
  exportLeadCsv,
  getLeadList,
  getLeadRetentionPolicy,
  purgeExpiredLeads,
  updateLeadStatus,
  type LeadItem,
  type LeadRetentionPolicy,
} from "@/api/lead";
import { usePageStore } from "../store/usePageStore";
import { trackEvent } from "@/utils/tracking";
import { getEffectiveRole, type UserRole } from "@/utils/auth";
import { saveBlob } from "@/utils/download";
import { type PageContentStatus, type PublishLogRecord } from "@/utils/page-publish";

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

// 角色来源统一走 utils/auth（localStorage.role 优先，JWT payload 兜底，无法识别按 viewer 最小权限处理）
const userRole = ref<UserRole>(getEffectiveRole());
const showTemplatePicker = ref(false);
/** 审核、发布、下线、回滚、删除：仅管理员 */
const canPublish = computed(() => userRole.value === "admin");
const canReview = computed(() => userRole.value === "admin");
/** 建页、编辑草稿、提交审核、处理线索：管理员与编辑员 */
const canEdit = computed(() => ["admin", "editor"].includes(userRole.value));
/** 观察员只读：不参与任何写操作，也不查看含手机号的线索详情 */
const isViewer = computed(() => userRole.value === "viewer");

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

const aiActivityOptions = ["内容展示", "信息登记", "数据查询"];
const aiStyleOptions = ["简洁专业", "清晰明快", "温暖亲和", "稳重可信"];

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

const aiForm = reactive({
  pageName: "",
  activityType: "内容展示",
  audience: "",
  promotion: "",
  ctaText: "提交申请",
  leadGoal: "",
  styleTone: "简洁专业",
  extraPrompt: "",
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
const leadFilters = reactive({
  status: undefined as LeadItem["status"] | undefined,
  channel: "",
});
const retentionPolicy = ref<LeadRetentionPolicy | null>(null);
const exportingLeads = ref(false);
const purgingLeads = ref(false);

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
  const onlineStatus = Number(item.isAbled || 0);
  const contentStatus = item.status as PageContentStatus;
  const contentStatusLabels: Record<PageContentStatus, string> = {
    draft: "草稿", pending_review: "待审核", rejected: "已驳回", approved: "审核通过", published: "已发布", offline: "已下线",
  };

  return {
    ...item,
    onlineStatus,
    onlineStatusLabel: onlineStatus === 1 ? "上线" : "下线",
    contentStatus,
    contentStatusLabel: contentStatusLabels[contentStatus] || contentStatus,
    loading: false,
  };
};

const contentStatusTagTypes: Record<PageContentStatus, "info" | "warning" | "danger" | "primary" | "success"> = {
  draft: "info",
  pending_review: "warning",
  rejected: "danger",
  approved: "primary",
  published: "success",
  offline: "info",
};

const getStatusTagType = (status: PageContentStatus) =>
  contentStatusTagTypes[status] || "info";

/** 行上展示审核备注（驳回原因 / 审核说明），无备注返回空串 */
const getRowReviewNote = (row: ActivityRow): string => {
  const note = row.reviewNote;
  return typeof note === "string" && note.trim() ? note : "";
};

type RowPrimaryAction = "submit-review" | "approve" | "publish" | null;

/**
 * 行内展示的「当前流程动作」。
 * 分支与改造前的散落按钮条件一一对应，只决定谁出现在行内，不新增业务规则：
 * - 待审核且可审核 → 通过审核（驳回留在更多菜单）
 * - 草稿/已驳回且可编辑 → 提交审核
 * - 审核通过且可发布 → 发布
 */
const getPrimaryAction = (row: ActivityRow): RowPrimaryAction => {
  if (canReview.value && row.status === "pending_review") {
    return "approve";
  }
  if (canEdit.value && ["draft", "rejected"].includes(row.status)) {
    return "submit-review";
  }
  if (canPublish.value && row.status === "approved") {
    return "publish";
  }
  return null;
};

const handleSubmitReview = async (row: ActivityRow) => {
  try {
    const { value } = await ElMessageBox.prompt("可填写给审核人的说明", "提交审核", { inputType: "textarea", confirmButtonText: "提交", cancelButtonText: "取消" });
    const response = await submitPageReview({ pageId: row.id, note: value || undefined });
    if (response.code !== 10000) throw new Error(response.message || "提交审核失败");
    ElMessage.success("已提交审核");
    await getTableData();
  } catch (error: unknown) {
    if (error !== "cancel") ElMessage.error(error instanceof Error ? error.message : "提交审核失败");
  }
};

const handleReview = async (row: ActivityRow, decision: "approved" | "rejected") => {
  try {
    const { value } = await ElMessageBox.prompt(decision === "approved" ? "可填写审核说明" : "请填写驳回原因", decision === "approved" ? "通过审核" : "驳回审核", { inputType: "textarea", confirmButtonText: "确定", cancelButtonText: "取消", inputValidator: decision === "rejected" ? (input) => Boolean(input.trim()) || "驳回原因不能为空" : undefined });
    const response = await reviewPage({ pageId: row.id, decision, note: value || undefined });
    if (response.code !== 10000) throw new Error(response.message || "审核处理失败");
    ElMessage.success(decision === "approved" ? "审核通过" : "已驳回");
    await getTableData();
  } catch (error: unknown) {
    if (error !== "cancel") ElMessage.error(error instanceof Error ? error.message : "审核处理失败");
  }
};

const handlePublishApproved = async (row: ActivityRow) => {
  try {
    // 显式指定中文按钮文案，避免 Element Plus 默认 locale 渲染成 OK / Cancel
    await ElMessageBox.confirm(`确定发布页面【${row.name}】吗？`, "发布确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });
    const response = await publishCmsPage({ pageId: row.id });
    if (response.code !== 10000) throw new Error(response.message || "发布失败");
    ElMessage.success("发布成功");
    await getTableData();
  } catch (error: unknown) {
    if (error !== "cancel") ElMessage.error(error instanceof Error ? error.message : "发布失败");
  }
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

/**
 * 删除入口收进「更多」菜单后，把原来的 popconfirm 换成同文案的确认弹窗：
 * 菜单项点击会立即关闭下拉层，浮层内的 popconfirm 无法稳定展示。
 * 确认文案、权限条件与后续处理均保持原样。
 */
const confirmAndDelete = async (row: ActivityRow) => {
  try {
    await ElMessageBox.confirm("确定要删除这个页面吗？", "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  await handleDelete(row.id);
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
  aiForm.activityType = "内容展示";
  aiForm.audience = "";
  aiForm.promotion = "";
  aiForm.ctaText = "提交申请";
  aiForm.leadGoal = "";
  aiForm.styleTone = "简洁专业";
  aiForm.extraPrompt = "";
};

const openAiDialog = () => {
  resetAiForm();
  aiDialogVisible.value = true;
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
    products: [],
  };
};

const validateAiPayload = (payload: AiGeneratePageRequest) => {
  if (!payload.pageName) {
    return "请填写页面标题";
  }
  if (!payload.activityType) {
    return "请选择页面场景";
  }
  if (!payload.audience) {
    return "请填写目标人群";
  }
  if (!payload.promotion) {
    return "请填写页面需求";
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
    reviewerName: item.reviewerName ? String(item.reviewerName) : null,
    publisherName: item.publisherName ? String(item.publisherName) : null,
    rollbackerName: item.rollbackerName ? String(item.rollbackerName) : null,
    note: String(item.note || "发布"),
    publishedAt: Number.isFinite(timestamp) ? timestamp : Date.now(),
    action: item.action,
    isCurrent: item.isCurrent,
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
  leadFilters.status = undefined;
  leadFilters.channel = "";
  leadDrawerVisible.value = true;
  await Promise.all([loadLeadList(), loadRetentionPolicy()]);
};

const loadRetentionPolicy = async () => {
  if (!canEdit.value || retentionPolicy.value) {
    return;
  }
  try {
    const response = await getLeadRetentionPolicy();
    if (response.code === 10000) {
      retentionPolicy.value = response.data;
    }
  } catch {
    // 保留策略为辅助信息，取不到时不阻断线索查看
    retentionPolicy.value = null;
  }
};

const handleExportLeads = async () => {
  exportingLeads.value = true;
  try {
    const { blob, filename } = await exportLeadCsv({
      pageId: activeLeadPageId.value ?? undefined,
      status: leadFilters.status,
      channel: leadFilters.channel.trim() || undefined,
    });

    saveBlob(blob, filename);

    ElMessage.success("线索已导出");
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : "导出线索失败");
  } finally {
    exportingLeads.value = false;
  }
};

const handlePurgeLeads = async () => {
  purgingLeads.value = true;
  try {
    // 先预览将要删除的数量，交由用户二次确认，避免误删
    const preview = await purgeExpiredLeads(true);
    if (preview.code !== 10000) {
      throw new Error(preview.message || "获取超期线索数量失败");
    }
    const { matched, retentionDays } = preview.data;
    if (matched === 0) {
      ElMessage.info(`没有超过 ${retentionDays} 天的线索需要清理`);
      return;
    }

    await ElMessageBox.confirm(
      `将永久删除 ${matched} 条超过 ${retentionDays} 天的线索，删除后不可恢复，是否继续？`,
      "清理超期线索",
      {
        confirmButtonText: "确定清理",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const result = await purgeExpiredLeads(false);
    if (result.code !== 10000) {
      throw new Error(result.message || "清理超期线索失败");
    }

    ElMessage.success(`已清理 ${result.data.deleted} 条超期线索`);
    await loadLeadList();
  } catch (error: unknown) {
    if (error !== "cancel") {
      ElMessage.error(error instanceof Error ? error.message : "清理超期线索失败");
    }
  } finally {
    purgingLeads.value = false;
  }
};

const formatDateLabel = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleDateString("zh-CN")
    : value;
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
      status: leadFilters.status,
      channel: leadFilters.channel.trim() || undefined,
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

const reloadLeadList = async () => {
  leadPagination.pageNum = 1;
  await loadLeadList();
};

const handleLeadStatusChange = async (row: LeadItem, status: LeadItem["status"]) => {
  try {
    const response = await updateLeadStatus({ id: row.id, status, followUpRemark: row.followUpRemark || undefined });
    if (response.code !== 10000) throw new Error(response.message || "更新线索状态失败");
    row.status = status;
    ElMessage.success("线索状态已更新");
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : "更新线索状态失败");
    await loadLeadList();
  }
};

const editLeadRemark = async (row: LeadItem) => {
  try {
    const { value } = await ElMessageBox.prompt("填写本次跟进备注", "线索跟进", {
      inputValue: row.followUpRemark || "",
      inputPlaceholder: "例如：已电话联系，待确认预算",
      inputValidator: (input) => input.length <= 500 || "备注不能超过 500 个字符",
    });
    const response = await updateLeadStatus({ id: row.id, status: row.status, followUpRemark: value || undefined });
    if (response.code !== 10000) throw new Error(response.message || "更新跟进备注失败");
    row.followUpRemark = value || null;
    ElMessage.success("跟进备注已保存");
  } catch (error: unknown) {
    if (error !== "cancel") ElMessage.error(error instanceof Error ? error.message : "更新跟进备注失败");
  }
};

const rollbackVersion = async (versionId: string) => {
  if (!activeLogPageId.value) {
    return;
  }

  await ElMessageBox.confirm(
    "回滚会立即恢复线上页面到该历史版本，当前编辑草稿不会被覆盖，是否继续？",
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

    await trackEvent({
      eventType: "cta_click",
      pageId: activeLogPageId.value,
      ctaText: "rollback_page_version",
      payload: { versionId },
    });

    ElMessage.success("线上页面已回滚，当前草稿未受影响");
    await getTableData();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "回滚失败";
    ElMessage.error(errorMessage);
  }
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

const pad2 = (value: number) => String(value).padStart(2, "0");

/**
 * 时间统一展示为 YYYY-MM-DD HH:mm。
 * 后端 create_time / update_time 为 timestamptz 序列化的 ISO 字符串，
 * 这里交给 Date 解析后按浏览器本地时区输出（不是截取 ISO 字符串）。
 * 缺失或无法解析的值统一显示占位符，避免出现 Invalid Date。
 */
const formatDateTime = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const timestamp = typeof value === "number" ? value : Date.parse(String(value));
  if (!Number.isFinite(timestamp)) {
    return "-";
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const formatTime = (timestamp: number) => formatDateTime(timestamp);

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
/*
 * 筛选控件宽度：Element Plus 的组件样式在运行时注入，会覆盖 Tailwind 的 w-* 工具类，
 * 这里用带作用域的类给出可读宽度（scoped 属性选择器特异性更高）。
 */
.filter-control-name {
  width: 240px;
}

.filter-control-status {
  width: 176px;
}

/* 操作列：文字按钮单行排列，避免换行导致行高不一致 */
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.more-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.more-icon {
  font-size: 12px;
}

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

<style>
/* 下拉浮层挂到 body 下，scoped 选不到；只作用于本页指定的 popper 类 */
.activity-more-menu {
  min-width: 128px;
}
</style>

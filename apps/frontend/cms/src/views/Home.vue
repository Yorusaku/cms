<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <section class="hero">
      <div class="hero-decoration" aria-hidden="true">
        <span class="deco-circle deco-1"></span>
        <span class="deco-circle deco-2"></span>
        <span class="deco-ring"></span>
      </div>

      <div class="hero-main">
        <div class="hero-greeting">
          <span class="greeting-text">{{ greeting }}，{{ username }}</span>
          <el-tag :type="roleTagType" size="small" effect="light">{{ roleLabel }}</el-tag>
        </div>
        <h1 class="hero-title">业务页面可视化配置平台</h1>
        <p class="hero-subtitle">
          面向运营团队的业务页面低代码搭建与发布平台，覆盖内容展示、信息登记与数据查询场景
        </p>
        <p class="hero-date">{{ todayText }}</p>
        <div class="hero-actions">
          <el-button size="large" class="btn-light" @click="goToActivity">
            进入页面管理
          </el-button>
          <el-button
            v-if="canEdit"
            size="large"
            class="btn-ghost"
            @click="openTemplatePicker"
          >
            新建页面
          </el-button>
        </div>
      </div>

      <div class="hero-side">
        <el-button text class="logout-btn" @click="handleLogout">退出登录</el-button>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="section">
      <h2 class="section-title">快捷入口</h2>
      <div class="entry-grid">
        <div class="entry-card" role="button" tabindex="0" @click="goToActivity">
          <div class="entry-icon icon-primary"><el-icon :size="22"><Document /></el-icon></div>
          <div class="entry-body">
            <p class="entry-name">页面管理</p>
            <p class="entry-desc">查看、搭建与发布业务页面</p>
          </div>
        </div>

        <div
          v-if="canEdit"
          class="entry-card"
          role="button"
          tabindex="0"
          @click="openTemplatePicker"
        >
          <div class="entry-icon icon-success"><el-icon :size="22"><Plus /></el-icon></div>
          <div class="entry-body">
            <p class="entry-name">新建页面</p>
            <p class="entry-desc">从模板或空白画布开始搭建</p>
          </div>
        </div>

        <div class="entry-card" role="button" tabindex="0" @click="router.push('/performance')">
          <div class="entry-icon icon-warning"><el-icon :size="22"><TrendCharts /></el-icon></div>
          <div class="entry-body">
            <p class="entry-name">效果看板</p>
            <p class="entry-desc">访问、转化与线索数据分析</p>
          </div>
        </div>

        <div
          v-if="isAdmin"
          class="entry-card"
          role="button"
          tabindex="0"
          @click="goToUsers"
        >
          <div class="entry-icon icon-info"><el-icon :size="22"><Setting /></el-icon></div>
          <div class="entry-body">
            <p class="entry-name">用户管理</p>
            <p class="entry-desc">成员账号与角色权限管理</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 平台能力 -->
    <section class="section">
      <h2 class="section-title">平台能力</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon icon-primary"><el-icon :size="24"><Monitor /></el-icon></div>
          <h3 class="feature-name">内容展示</h3>
          <p class="feature-desc">富文本、轮播、图片导航等物料自由编排，所见即所得的装修画布</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon icon-success"><el-icon :size="24"><Tickets /></el-icon></div>
          <h3 class="feature-name">信息登记</h3>
          <p class="feature-desc">业务表单收集线索，隐私同意、幂等去重与线索治理全链路合规</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon icon-warning"><el-icon :size="24"><DataBoard /></el-icon></div>
          <h3 class="feature-name">数据查询</h3>
          <p class="feature-desc">列表关键词筛选与统计卡片实时联动，筛选结果一目了然</p>
        </div>
      </div>
    </section>

    <footer class="home-footer">业务页面可视化配置平台 · 内部运营系统</footer>

    <!-- 模板选择器 -->
    <TemplatePicker
      v-model="templatePickerVisible"
      @created="handleTemplateCreated"
      @skip="handleSkipTemplate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePageStore } from "../store/usePageStore";
import { ElMessageBox } from "element-plus";
import {
  Setting,
  Document,
  Plus,
  TrendCharts,
  Monitor,
  Tickets,
  DataBoard,
} from "@element-plus/icons-vue";
import TemplatePicker from "../components/TemplatePicker.vue";
import { getEffectiveRole, type UserRole } from "@/utils/auth";

const router = useRouter();
const pageStore = usePageStore();
const username = ref("");
const userRole = ref<UserRole>(getEffectiveRole());
const templatePickerVisible = ref(false);

const isAdmin = computed(() => userRole.value === "admin");
/** 建页入口：管理员与编辑员可见，观察员只读 */
const canEdit = computed(() => ["admin", "editor"].includes(userRole.value));

const roleLabel = computed(() => {
  const map: Record<string, string> = { admin: "管理员", editor: "编辑员", viewer: "观察员" };
  return map[userRole.value] || "未知";
});

const roleTagType = computed(() => {
  const map: Record<string, string> = { admin: "danger", editor: "warning", viewer: "info" };
  return map[userRole.value] || "info";
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 13) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

const todayText = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

const goToActivity = () => {
  router.push("/activity");
};

const goToUsers = () => {
  router.push("/users");
};

const openTemplatePicker = () => {
  templatePickerVisible.value = true;
};

const handleTemplateCreated = (pageId: number) => {
  router.push({ path: "/decorate", query: { id: pageId } });
};

const handleSkipTemplate = () => {
  pageStore.setInitPageSchema();
  router.push("/decorate");
};

const handleLogout = () => {
  ElMessageBox.confirm("确定要退出登录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      router.push("/login");
    })
    .catch(() => {});
};

onMounted(() => {
  username.value = localStorage.getItem("username") || "管理员";
  userRole.value = getEffectiveRole();
});
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 40px;
  min-height: 100vh;
  background: var(--color-bg-page, #f5f7fa);
}

/* ── 欢迎横幅 ─────────────────────────────── */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  padding: 44px 48px 40px;
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-hover, #2f7fe0) 100%
  );
  box-shadow: 0 8px 24px rgba(65, 155, 249, 0.25);
}

.hero-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-circle,
.deco-ring {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.deco-1 {
  width: 220px;
  height: 220px;
  right: -60px;
  top: -80px;
}

.deco-2 {
  width: 120px;
  height: 120px;
  right: 180px;
  bottom: -50px;
  background: rgba(255, 255, 255, 0.08);
}

.deco-ring {
  width: 90px;
  height: 90px;
  right: 320px;
  top: 36px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.22);
}

.hero-main {
  position: relative;
  z-index: 1;
}

.hero-greeting {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.greeting-text {
  font-size: 20px;
  font-weight: 600;
}

.hero-title {
  margin: 0 0 10px;
  font-size: 34px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: 1px;
}

.hero-subtitle {
  margin: 0 0 6px;
  max-width: 640px;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.88);
}

.hero-date {
  margin: 0 0 22px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.hero-actions {
  display: flex;
  gap: 12px;
}

/* 横幅内的按钮：白底主色 / 描边幽灵态 */
.hero-actions :deep(.btn-light) {
  background: #fff;
  border-color: #fff;
  color: var(--color-primary);
  font-weight: 600;
}

.hero-actions :deep(.btn-light:hover) {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(255, 255, 255, 0.92);
}

.hero-actions :deep(.btn-ghost) {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.6);
  color: #fff;
}

.hero-actions :deep(.btn-ghost:hover) {
  background: rgba(255, 255, 255, 0.14);
  border-color: #fff;
  color: #fff;
}

.hero-side {
  position: absolute;
  top: 20px;
  right: 24px;
  z-index: 1;
}

.logout-btn {
  color: rgba(255, 255, 255, 0.85);
}

.logout-btn:hover {
  color: #fff;
}

/* ── 通用 section ─────────────────────────── */
.section {
  margin-top: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.section-title::before {
  content: "";
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: var(--color-primary);
}

/* ── 快捷入口 ─────────────────────────────── */
.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.entry-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: 12px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.entry-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 10px 24px rgba(65, 155, 249, 0.14);
}

.entry-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.entry-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.icon-primary {
  background: var(--color-primary-light, #ecf5ff);
  color: var(--color-primary);
}

.icon-success {
  background: var(--color-success-light, #f0f9eb);
  color: var(--color-success);
}

.icon-warning {
  background: var(--color-warning-light, #fdf6ec);
  color: var(--color-warning);
}

.icon-info {
  background: var(--color-info-light, #f4f4f5);
  color: var(--color-info);
}

.entry-name {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.entry-desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary, #6b7280);
}

/* ── 平台能力 ─────────────────────────────── */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.feature-card {
  padding: 24px;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: 12px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.feature-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 14px;
  border-radius: 14px;
}

.feature-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.feature-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary, #6b7280);
}

/* ── 页脚 ─────────────────────────────────── */
.home-footer {
  margin-top: 40px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
}
</style>

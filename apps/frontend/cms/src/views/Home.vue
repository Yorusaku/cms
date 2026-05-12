<template>
  <div class="min-h-screen bg-gray-100 p-5">
    <el-card class="mb-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <el-avatar
            :size="70"
            src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
          />
          <div class="ml-4">
            <h2 class="text-xl font-bold text-gray-800">{{ username }}</h2>
            <p class="text-gray-500 mt-1">
              <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <el-button v-if="isAdmin" @click="goToUsers">
            <el-icon><Setting /></el-icon>
            用户管理
          </el-button>
          <el-button type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
    </el-card>

    <div class="text-center">
      <div class="mb-8">
        <div class="text-3xl text-gray-700 mb-2">欢迎体验</div>
        <div class="text-4xl text-blue-500 font-bold mb-4">
          CMS 移动端页面配置系统
        </div>
        <div class="text-gray-500">
          一套用于解决小程序活动页面发布问题的低代码平台
        </div>
      </div>

      <div class="flex justify-center gap-4">
        <el-button type="primary" size="large" @click="goToActivity"
          >活动管理</el-button
        >
        <el-button type="success" size="large" @click="openTemplatePicker"
          >新建页面</el-button
        >
      </div>
    </div>

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
import { Setting } from "@element-plus/icons-vue";
import TemplatePicker from "../components/TemplatePicker.vue";

const router = useRouter();
const pageStore = usePageStore();
const username = ref("");
const userRole = ref("");
const templatePickerVisible = ref(false);

const isAdmin = computed(() => userRole.value === "admin");

const roleLabel = computed(() => {
  const map: Record<string, string> = { admin: "管理员", editor: "编辑员", viewer: "观察员" };
  return map[userRole.value] || "未知";
});

const roleTagType = computed(() => {
  const map: Record<string, string> = { admin: "danger", editor: "warning", viewer: "info" };
  return map[userRole.value] || "info";
});

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
  userRole.value = localStorage.getItem("role") || "editor";
});
</script>
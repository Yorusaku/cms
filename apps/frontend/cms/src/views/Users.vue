<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="mb-6 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">用户管理</h1>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>

      <el-table v-loading="loading" :data="userList" border stripe>
        <el-table-column label="用户名" prop="username" width="150" />
        <el-table-column label="昵称" prop="nickname" width="150">
          <template #default="{ row }">
            {{ row.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.role === 'admin' ? 'danger' : row.role === 'editor' ? 'warning' : 'info'"
              size="small"
            >
              {{ roleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="180" align="center" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm
              title="确定要删除该用户吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger" :disabled="row.username === currentUsername">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="480px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            :disabled="isEdit"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" class="w-full">
            <el-option label="管理员 (admin)" value="admin" />
            <el-option label="编辑员 (editor)" value="editor" />
            <el-option label="观察员 (viewer)" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  type UserItem,
} from "@/api/activity";

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editingId = ref("");
const userList = ref<UserItem[]>([]);

const currentUsername = localStorage.getItem("username") || "";

const formRef = ref<FormInstance>();
const form = reactive({
  username: "",
  password: "",
  role: "editor" as string,
  nickname: "",
});

const rules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在3-20个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少6位", trigger: "blur" },
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
};

const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    admin: "管理员",
    editor: "编辑员",
    viewer: "观察员",
  };
  return map[role] || role;
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getUserList();
    userList.value = (res as any).data || [];
  } catch {
    ElMessage.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  isEdit.value = false;
  editingId.value = "";
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: UserItem) => {
  isEdit.value = true;
  editingId.value = row.id;
  form.username = row.username;
  form.role = row.role;
  form.nickname = row.nickname || "";
  form.password = "";
  dialogVisible.value = true;
};

const resetForm = () => {
  form.username = "";
  form.password = "";
  form.role = "editor";
  form.nickname = "";
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (isEdit.value) {
        await updateUser({
          id: editingId.value,
          role: form.role,
          nickname: form.nickname || undefined,
        });
        ElMessage.success("更新成功");
      } else {
        await createUser({
          username: form.username,
          password: form.password,
          role: form.role,
          nickname: form.nickname || undefined,
        });
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
      await fetchList();
    } catch (err: any) {
      ElMessage.error(err?.message || "操作失败");
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await deleteUser(id);
    ElMessage.success("删除成功");
    await fetchList();
  } catch (err: any) {
    ElMessage.error(err?.message || "删除失败");
  }
};

onMounted(() => {
  fetchList();
});
</script>
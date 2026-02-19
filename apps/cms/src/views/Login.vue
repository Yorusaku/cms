<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">CMS内容管理系统</h1>
          <p class="text-gray-600">请登录您的账户</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="space-y-6"
          autocomplete="on"
        >
          <el-form-item prop="username">
            <el-input
              ref="usernameRef"
              v-model="loginForm.username"
              placeholder="请输入用户名"
              name="username"
              size="large"
              prefix-icon="User"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              ref="passwordRef"
              v-model="loginForm.password"
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="请输入密码"
              name="password"
              size="large"
              prefix-icon="Lock"
              @keyup.enter="handleLogin"
            >
              <template #suffix>
                <el-icon class="cursor-pointer" @click="passwordVisible = !passwordVisible">
                  <View v-if="passwordVisible" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-button
            :loading="loading"
            type="primary"
            size="large"
            class="w-full"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'
import { login } from '../api/activity'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const usernameRef = ref()
const passwordRef = ref()

const loginForm = reactive({
  username: 'admin',
  password: 'admin123456'
})

const loading = ref(false)
const passwordVisible = ref(false)

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async valid => {
    if (valid) {
      loading.value = true
      try {
        const res: any = await login({
          username: loginForm.username,
          password: loginForm.password
        })

        console.log('=== 登录接口调试信息 ===')
        console.log('登录响应:', res)
        console.log('响应结构:', Object.keys(res || {}))
        if (res && res.data) {
          console.log('data字段:', res.data)
          console.log('token是否存在:', !!res.data.token)
        }

        // 存储token和用户信息
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('username', loginForm.username)

        ElMessage.success('登录成功')
        router.push('/activity')
      } catch (error: any) {
        console.error('登录失败:', error)
        ElMessage.error(error?.message || '登录失败，请检查用户名和密码')
      } finally {
        loading.value = false
      }
    }
  })
}

// 检查是否已登录
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  if (token) {
    router.push('/activity')
  }
}

onMounted(() => {
  checkLoginStatus()
  // 自动聚焦到用户名输入框
  setTimeout(() => {
    usernameRef.value?.focus()
  }, 100)
})
</script>

<style scoped>
/* 使用Tailwind CSS原子类，无需额外样式 */
</style>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600"
  >
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="w-full max-w-md bg-white/95 rounded-2xl p-10 shadow-2xl"
      label-position="top"
    >
      <div class="mb-10 text-center">
        <h3 class="text-2xl font-bold text-gray-800">Cms-Manage内容管理系统</h3>
      </div>

      <el-form-item prop="username">
        <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          placeholder="请输入密码"
          size="large"
          show-password
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <el-button :loading="loading" type="primary" size="large" class="w-full" @click="handleLogin">
        登录
      </el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loginForm = reactive({
  username: 'admin',
  password: 'admin123456'
})

const validateUsername = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else {
    callback()
  }
}

const validatePassword = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const loginRules: FormRules = {
  username: [{ required: true, trigger: 'blur', validator: validateUsername }],
  password: [{ required: true, trigger: 'blur', validator: validatePassword }]
}

const loading = ref(false)

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true

      setTimeout(() => {
        localStorage.setItem('token', 'mock-token-' + Date.now())
        localStorage.setItem('username', loginForm.username)
        ElMessage.success('登录成功')
        router.replace('/home')
        loading.value = false
      }, 500)
    }
  })
}
</script>

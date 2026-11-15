<template>
  <form class="login-form" @submit.prevent="handleSubmit">
    <label class="login-field">
      <span class="login-label">用户名</span>
      <input
        v-model="form.username"
        class="login-control"
        type="text"
        autocomplete="username"
        placeholder="请输入用户名"
        data-testid="login-username"
      />
    </label>
    <label class="login-field">
      <span class="login-label">密码</span>
      <input
        v-model="form.password"
        class="login-control"
        type="password"
        autocomplete="current-password"
        placeholder="请输入密码"
        data-testid="login-password"
      />
    </label>

    <p v-if="error" class="login-error" data-testid="login-error">{{ error }}</p>

    <button class="login-button" type="submit" :disabled="submitting" data-testid="login-submit">
      {{ submitting ? '登录中...' : '登录' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import http from '@/utils/http'
import { setToken } from '@/utils/auth'

/**
 * 登录表单：独立登录页与页面内嵌登录共用。
 * 登录只改变身份，不触发任何业务提交。
 */
const emit = defineEmits<{ success: [] }>()

const form = reactive({ username: '', password: '' })
const submitting = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  if (!form.username.trim() || !form.password) {
    error.value = '请填写用户名和密码'
    return
  }

  submitting.value = true
  try {
    const response = await http.post<{ token: string; role: string }>(
      '/atlas-cms/login',
      { username: form.username.trim(), password: form.password },
      { showError: false, skipAuth: true }
    )
    if (response.code !== 10000 || !response.data?.token) {
      throw new Error(response.message || '登录失败')
    }
    setToken(response.data.token)
    emit('success')
  } catch (err: unknown) {
    error.value = err instanceof Error && err.message ? err.message : '登录失败，请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-form {
  display: grid;
  gap: 16px;
}

.login-field {
  display: grid;
  gap: 6px;
}

.login-label {
  color: var(--color-text-regular, #4b5563);
  font-size: 13px;
}

.login-control {
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--color-border, #dcdfe6);
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 14px;
}

.login-control:focus {
  border-color: var(--color-primary, #409eff);
  outline: none;
}

.login-error {
  margin: 0;
  color: var(--color-danger, #ee0a24);
  font-size: 13px;
}

.login-button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary, #409eff);
  color: #fff;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}

.login-button:disabled {
  cursor: wait;
  opacity: 0.7;
}
</style>

<template>
  <div class="login-page layout-business">
    <div class="login-card">
      <h1 class="login-title">业务登录</h1>
      <p class="login-tip">登录后可登记、补充与查看票据异常记录</p>
      <LoginForm @success="handleSuccess" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import LoginForm from '@/components/LoginForm.vue'
import { resolveRedirect } from '@/utils/auth'

defineOptions({ name: 'CrsLoginView' })

const route = useRoute()
const router = useRouter()

const handleSuccess = () => {
  // 只允许站内返回地址
  const redirect = resolveRedirect(route.query.redirect)
  void router.replace(redirect)
}
</script>

<style scoped>
.layout-business {
  /* 业务布局：字号按 375 设计稿固定，不随浏览器宽度放大 */
  --design-vw: calc(min(100vw, 375px) / 100);
}

.login-page {
  min-height: 100vh;
  padding: 48px 16px;
  background: var(--color-bg-page, #f5f7fa);
  box-sizing: border-box;
}

.login-card {
  max-width: 420px;
  margin: 0 auto;
  padding: 24px 16px;
  border-radius: 12px;
  background: #fff;
  box-sizing: border-box;
}

.login-title {
  margin: 0;
  color: var(--color-text-primary, #1f2937);
  font-size: 20px;
}

.login-tip {
  margin: 8px 0 20px;
  color: var(--color-text-secondary, #6b7280);
  font-size: 13px;
}
</style>

<template>
  <div class="com-title">
    <span class="title-text">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: ''
  }
)
</script>

<style scoped>
.com-title {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.title-text {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}
</style>

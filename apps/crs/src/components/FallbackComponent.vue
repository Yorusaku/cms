<template>
  <div class="fallback-component">
    <div class="fallback-content">
      <div class="fallback-icon">⚠️</div>
      <div class="fallback-text">未知组件: {{ $attrs.type || 'Unknown' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.fallback-component {
  width: 100%;
  padding: 20px;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  margin: 10px 0;
}

.fallback-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fallback-icon {
  font-size: 24px;
}

.fallback-text {
  color: #856404;
  font-size: 14px;
}
</style>

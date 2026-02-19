<template>
  <div class="change-set-type">
    <div class="set-type-tabs">
      <div class="set-type-tab" :class="{ active: modelValue === 1 }" @click="handleClick(1)">
        <img src="@/assets/img/layout/set-type-page.png" />
        <span>页面设置</span>
      </div>
      <div class="set-type-tab" :class="{ active: modelValue === 2 }" @click="handleClick(2)">
        <img src="@/assets/img/layout/set-type-component.png" />
        <span>组件管理</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: number
  }>(),
  {
    modelValue: 1
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const handleClick = (value: number) => {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.change-set-type {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.set-type-tabs {
  display: flex;
  gap: 16px;
}

.set-type-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.set-type-tab:hover {
  opacity: 0.8;
}

.set-type-tab.active {
  opacity: 1;
}

.set-type-tab img {
  width: 28px;
  height: 28px;
  margin-bottom: 4px;
}

.set-type-tab span {
  font-size: 12px;
  color: #323233;
}
</style>

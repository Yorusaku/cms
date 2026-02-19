<template>
  <div class="com-group" :class="{ 'bg-gray': bgGray, 'content-block': contentBlock }">
    <div v-if="title" class="group-header">
      <span class="title" :class="{ 'name-black': nameBlack }">{{ title }}</span>
      <span v-if="tips" class="tips">{{ tips }}</span>
    </div>
    <div class="group-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    tips?: string
    nameBlack?: boolean
    bgGray?: boolean
    contentBlock?: boolean
  }>(),
  {
    title: '',
    tips: '',
    nameBlack: false,
    bgGray: false,
    contentBlock: false
  }
)
</script>

<style scoped>
.com-group {
  padding: 12px 16px;
  font-size: 14px;
  background: #fff;
}

.com-group.bg-gray {
  background: #f7f8fa;
  margin: 0 -16px;
  padding: 12px 16px;
}

.com-group.content-block {
  padding: 12px 16px;
}

.group-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title {
  font-size: 14px;
  color: #969799;
  margin-right: 8px;
}

.title.name-black {
  color: #323233;
  font-weight: 500;
}

.tips {
  font-size: 12px;
  color: #969799;
}

.group-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-content :deep(.el-slider) {
  width: 100%;
}

.group-content :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
}

.group-content :deep(.el-radio) {
  line-height: 30px;
  color: #323233;
}
</style>

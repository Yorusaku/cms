<template>
  <NoticeBlock v-bind="props" />
</template>

<script setup lang="ts">
import { NoticeBlock } from '@cms/ui'
import type { INoticeProps } from '@cms/ui'

defineProps<INoticeProps>()
</script>

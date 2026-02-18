<template>
  <div
    :style="{
      backgroundColor: backgroundColor || defBackgroundColor,
      height: `${height}px`,
      padding: paddingVisible ? '16px' : 0
    }"
  >
    <div :style="lineStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed, CSSProperties } from 'vue'

export interface IAssistLineProps {
  backgroundColor?: string
  defBackgroundColor?: string
  height?: number
  paddingVisible?: boolean
  borderColor?: string
  defBorderColor?: string
  type?: number
  borderStyle?: string
}

const {
  backgroundColor,
  defBackgroundColor = '#ffffff',
  height = 1,
  paddingVisible = false,
  borderColor,
  defBorderColor = '#e5e5e5',
  type = 1,
  borderStyle = 'solid'
} = defineProps<IAssistLineProps>()

const lineStyle = computed(() => {
  const style: CSSProperties = {
    color: borderColor || defBorderColor,
    borderBottom: '1px',
    lineHeight: `${height}px`,
    position: 'relative' as const,
    top: '50%'
  }
  if (!type) {
    style.borderBottomStyle = 'none'
  } else {
    style.borderBottomStyle = borderStyle as CSSProperties['borderBottomStyle']
  }
  return style
})
</script>

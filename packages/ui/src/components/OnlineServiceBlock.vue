<template>
  <div
    class="customer-container"
    :style="{
      position: 'fixed' as const,
      bottom: `${bottom}px`,
      right: `${right}px`,
      zIndex: zIndex,
      width: `${width}px`,
      height: `${height}px`,
      cursor: 'pointer',
      top: 'unset'
    }"
  >
    <div
      class="customer"
      :style="{
        width: `${width}px`,
        height: `${height}px`,
        background: backgroundColor,
        boxShadow: '0px 4px 14px 0px rgba(0,0,0,0.11)',
        position: 'fixed' as const,
        bottom: `${bottom}px`,
        right: `${right}px`,
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 2000,
        transition: 'right 0.5s'
      }"
      :class="{ 'opacity-100': visible, 'opacity-0': !visible }"
      @click="handleClick"
    >
      <div class="customer-image">
        <img :src="serviceImage" style="height: 20px" alt="" />
      </div>
      <div class="customer-text text-xs">
        {{ text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

export interface IOnlineServiceProps {
  bottom?: number
  right?: number
  zIndex?: number
  width?: number
  height?: number
  backgroundColor?: string
  serviceImage?: string
  text?: string
}

const {
  bottom = 24,
  right = 24,
  zIndex = 11,
  width = 48,
  height = 48,
  backgroundColor = '#ffffff',
  serviceImage = 'https://image.fuchuang.com/prod/3d488567_icon_kf20201116164901.png',
  text = '客服'
} = defineProps<IOnlineServiceProps>()

const emit = defineEmits<{
  click: []
}>()

const visible = ref(true)

const handleClick = () => {
  emit('click')
}

onMounted(() => {
  if (!document.querySelector('.draggable')) {
    window.addEventListener('scroll', scrollHandler)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scrollHandler)
})

const scrollHandler = () => {
  visible.value = false
  setTimeout(() => {
    visible.value = true
  }, 1000)
}
</script>

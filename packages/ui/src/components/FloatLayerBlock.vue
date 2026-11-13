<template>
  <div
    class="float-layer"
    :style="{
      width: `${width}px`,
      position: 'fixed' as const,
      bottom: `${bottom}px`,
      zIndex: zIndex,
      right: `${right}px`,
      minHeight: '56px',
      cursor: 'pointer'
    }"
  >
    <div>
      <img
        class="img-container"
        :style="{
          position: 'fixed' as const,
          bottom: `${bottom}px`,
          zIndex: zIndex,
          cursor: 'pointer',
          right: `${right}px`,
          transition: 'right 0.5s'
        }"
        :width="width"
        :src="imageUrl || defaultImage"
        :class="{ 'opacity-100': visible, 'opacity-0': !visible }"
        alt=""
        @click="handleClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

export interface IFloatLayerProps {
  width?: number
  bottom?: number
  zIndex?: number
  right?: number
  imageUrl?: string
  defaultImage?: string
  hideByPageScroll?: boolean
}

const {
  width = 56,
  bottom = 100,
  zIndex = 11,
  right = 24,
  imageUrl = '',
  defaultImage = 'https://via.placeholder.com/56',
  hideByPageScroll = false
} = defineProps<IFloatLayerProps>()

const emit = defineEmits<{
  click: []
}>()

const visible = ref(true)

const handleClick = () => {
  emit('click')
}

onMounted(() => {
  if (hideByPageScroll && !document.querySelector('.draggable')) {
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

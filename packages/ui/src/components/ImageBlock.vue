<template>
  <div class="image-block">
    <img
      :src="src || defaultImage"
      class="w-full h-full object-cover"
      :style="{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: `${borderRadius}px`,
        backgroundColor
      }"
      loading="lazy"
      alt=""
    />
  </div>
</template>

<script setup lang="ts">
export interface IImageProps {
  src?: string
  width?: number | string
  height?: number | string
  borderRadius?: number
  backgroundColor?: string
  defaultImage?: string
}

const {
  src = '',
  width = '100%',
  height = 200,
  borderRadius = 0,
  backgroundColor = '#f5f5f5',
  defaultImage = 'https://via.placeholder.com/400x200'
} = defineProps<IImageProps>()
</script>

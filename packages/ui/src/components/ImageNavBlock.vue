<template>
  <div class="nav-container" :style="containerStyle">
    <div class="flex flex-wrap">
      <div
        v-for="(item, index) in list"
        :key="index"
        class="w-11 text-center mx-2 my-2"
        @click="handleClick(item, index)"
      >
        <div class="text-center">
          <img
            :src="item.imageUrl || defaultImage"
            class="w-11 h-11 object-cover"
            :style="{ borderRadius: `${borderRadius}px` }"
            loading="lazy"
          />
        </div>
        <div class="mt-2 text-xs text-center wrap-break-word" :style="{ color: textColor }">
          {{ item.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface IImageNavItem {
  imageUrl?: string
  text: string
  link?: string
}

export interface IImageNavProps {
  list?: IImageNavItem[]
  columnPadding?: number
  rowPadding?: number
  backgroundColor?: string
  textColor?: string
  borderRadius?: number
  defaultImage?: string
}

const {
  list = [],
  columnPadding = 0,
  rowPadding = 0,
  backgroundColor = '#ffffff',
  textColor = '#333333',
  borderRadius = 0,
  defaultImage = 'https://via.placeholder.com/44'
} = defineProps<IImageNavProps>()

const emit = defineEmits<{
  click: [item: IImageNavItem, index: number]
}>()

const containerStyle = computed(() => ({
  padding: `${columnPadding}px ${rowPadding}px`,
  backgroundColor
}))

const handleClick = (item: IImageNavItem, index: number) => {
  emit('click', item, index)
}
</script>

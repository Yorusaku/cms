<template>
  <div class="my-slider" :style="{ backgroundColor }">
    <ul
      class="cont list-none whitespace-nowrap text-xs p-0 overflow-x-auto"
      :style="containerStyle"
    >
      <li
        v-for="(item, i) in list"
        :key="i"
        class="cont-item relative inline-block"
        @click="handleClick(item, i)"
      >
        <div class="cont-img" :style="imageStyle">
          <img
            :src="item.imageUrl || defaultImage"
            class="w-full h-full object-cover"
            :style="{ borderRadius: `${borderRadius}px` }"
            loading="lazy"
            alt=""
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ISliderItem {
  imageUrl?: string
  link?: string
}

export interface ISliderProps {
  list?: ISliderItem[]
  backgroundColor?: string
  padding?: number[]
  imageMargin?: number
  imageWidth?: number
  imageHeight?: number
  borderRadius?: number
  defaultImage?: string
}

const {
  list = [],
  backgroundColor = '#ffffff',
  padding = [15, 15],
  imageMargin = 15,
  imageWidth = 100,
  imageHeight = 80,
  borderRadius = 0,
  defaultImage = 'https://via.placeholder.com/100x80'
} = defineProps<ISliderProps>()

const emit = defineEmits<{
  click: [item: ISliderItem, index: number]
}>()

const containerStyle = computed(() => ({
  padding: `${padding[0]}px ${padding[1]}px`
}))

const imageStyle = computed(() => ({
  width: `${imageWidth}px`,
  height: `${imageHeight}px`,
  marginLeft: imageMargin > 0 ? `${imageMargin}px` : '0'
}))

const handleClick = (item: ISliderItem, index: number) => {
  emit('click', item, index)
}
</script>

<style>
.my-slider {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cont-item:first-child .cont-img {
  margin-left: 0 !important;
}
</style>

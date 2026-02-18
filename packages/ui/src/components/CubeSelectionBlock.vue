<template>
  <div class="cube-selection-block">
    <div :style="{ paddingLeft: `${pageMargin}px`, paddingRight: `${pageMargin}px` }">
      <div
        v-if="imageList.length === 0"
        class="flex items-center justify-center h-48 bg-gray-100 rounded-lg"
      >
        <div class="text-center text-gray-400">
          <p>暂无图片</p>
        </div>
      </div>
      <div v-else class="magic-box relative w-full flex box-border" :class="template">
        <div
          v-for="(item, index) in imageList"
          :key="index"
          class="magic-item flex-1 relative cursor-pointer text-center"
          :class="['magic-' + (index + 1)]"
        >
          <div
            class="magic-img w-full h-full box-border"
            :style="{ padding: `${imgMargin / 2}px` }"
            @click="handleClick(item, index)"
          >
            <img
              :src="item.imageUrl || defaultImg"
              class="w-full h-full object-cover"
              :style="{ borderRadius: `${radius}px` }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ICubeItem {
  imageUrl?: string
  link?: string
}

export interface ICubeSelectionProps {
  imageList?: ICubeItem[]
  template?: string
  pageMargin?: number
  imgMargin?: number
  radius?: number
  defaultImg?: string
}

const {
  imageList = [],
  template = 'oneLine2',
  pageMargin = 0,
  imgMargin = 4,
  radius = 4,
  defaultImg = ''
} = defineProps<ICubeSelectionProps>()

const emit = defineEmits<{ click: [item: ICubeItem, index: number] }>()

const handleClick = (item: ICubeItem, index: number) => {
  emit('click', item, index)
}
</script>

<style scoped>
.magic-box.left2right2 {
  flex-wrap: wrap;
}
.magic-box.left2right2 .magic-item {
  width: 50%;
  flex-basis: 50%;
}
.magic-box.top1bottom2 {
  flex-wrap: wrap;
}
.magic-box.top1bottom2 .magic-1 {
  width: 100%;
  flex-basis: 100%;
}
.magic-box.top1bottom2 .magic-2,
.magic-box.top1bottom2 .magic-3 {
  width: 50%;
  flex-basis: 50%;
}
</style>

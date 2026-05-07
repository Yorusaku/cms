<template>
  <div class="virtual-scroll-container" @scroll="handleScroll" ref="containerRef">
    <div class="virtual-scroll-content" :style="{ height: totalHeight + 'px' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }" class="virtual-scroll-inner">
        <slot :items="visibleItems" :start-index="startIndex" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string }">
import { ref, computed, onMounted, watch } from "vue";

interface Props {
  items: T[];
  itemHeight: number;
  bufferSize?: number;
  containerHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  bufferSize: 5,
  containerHeight: 600,
});

const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);
const actualContainerHeight = ref(props.containerHeight);

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize;
  return Math.max(0, index);
});

const endIndex = computed(() => {
  const index =
    Math.ceil((scrollTop.value + actualContainerHeight.value) / props.itemHeight) +
    props.bufferSize;
  return Math.min(props.items.length, index);
});

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value);
});

const offsetY = computed(() => {
  return startIndex.value * props.itemHeight;
});

const totalHeight = computed(() => {
  return props.items.length * props.itemHeight;
});

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
};

onMounted(() => {
  if (containerRef.value) {
    actualContainerHeight.value = containerRef.value.clientHeight;
  }
});

watch(
  () => props.containerHeight,
  (newHeight) => {
    actualContainerHeight.value = newHeight;
  },
);

watch(
  () => props.items.length,
  () => {
    scrollTop.value = 0;
  },
);
</script>

<style scoped>
.virtual-scroll-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-scroll-content {
  position: relative;
  width: 100%;
}

.virtual-scroll-inner {
  will-change: transform;
}
</style>

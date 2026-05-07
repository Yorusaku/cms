<template>
  <div
    v-if="dynamicHeight"
    ref="containerRef"
    class="virtual-scroll-container"
    @scroll="handleDynamicScroll"
  >
    <div class="virtual-scroll-content" :style="{ height: totalDynamicHeight + 'px' }">
      <div
        class="virtual-scroll-inner"
        :style="{ transform: `translateY(${dynamicOffsetY}px)` }"
      >
        <slot
          :items="dynamicVisibleItems"
          :start-index="dynamicStartIndex"
          :end-index="dynamicEndIndex"
          :on-measure="handleMeasure"
        />
      </div>
    </div>
  </div>
  <div
    v-else
    ref="containerRef"
    class="virtual-scroll-container"
    @scroll="handleScroll"
  >
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
  dynamicHeight?: boolean;
  heightCache?: Map<string, number>;
  gapSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  bufferSize: 5,
  containerHeight: 600,
  dynamicHeight: false,
  heightCache: () => new Map<string, number>(),
  gapSize: 0,
});

const emit = defineEmits<{
  measure: [id: string, height: number];
}>();

const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);
const actualContainerHeight = ref(props.containerHeight);

// ── Fixed-height mode ──
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

// ── Dynamic-height mode ──
const measuredHeights = ref<Map<string, number>>(new Map());
const DEFAULT_ESTIMATED_HEIGHT = 120;

const getItemHeight = (id: string): number => {
  return measuredHeights.value.get(id)
    || props.heightCache.get(id)
    || DEFAULT_ESTIMATED_HEIGHT;
};

const buildOffsets = (): number[] => {
  const offsets: number[] = [0];
  for (let i = 0; i < props.items.length; i++) {
    const h = getItemHeight(props.items[i].id);
    const gap = i < props.items.length - 1 ? props.gapSize : 0;
    offsets.push(offsets[i] + h + gap);
  }
  return offsets;
};

const dynamicOffsets = ref<number[]>([0]);
const totalDynamicHeight = ref(0);

const updateLayout = () => {
  const offsets = buildOffsets();
  dynamicOffsets.value = offsets;
  totalDynamicHeight.value = offsets[offsets.length - 1];
};

// Find the first item whose offset > scrollTop, then step back
const binarySearchStart = (scrollTopVal: number): number => {
  const offsets = dynamicOffsets.value;
  let lo = 0;
  let hi = offsets.length - 2; // offsets[i] is the start of item i
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (offsets[mid] < scrollTopVal) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(0, hi);
};

const dynamicStartIndex = ref(0);
const dynamicEndIndex = ref(0);

const dynamicVisibleItems = computed(() => {
  return props.items.slice(dynamicStartIndex.value, dynamicEndIndex.value);
});

const dynamicOffsetY = computed(() => {
  return dynamicOffsets.value[dynamicStartIndex.value] || 0;
});

const recalcVisible = (scrollTopVal: number) => {
  if (dynamicOffsets.value.length === 0) return;

  const { items } = props;
  const atEnd = scrollTopVal + actualContainerHeight.value >= totalDynamicHeight.value - 1;
  let start = binarySearchStart(scrollTopVal);
  start = Math.max(0, start - props.bufferSize);
  dynamicStartIndex.value = Math.max(0, start);

  let end = atEnd ? items.length : start;
  while (end < items.length && (dynamicOffsets.value[end] || 0) < scrollTopVal + actualContainerHeight.value) {
    end++;
  }
  end = Math.min(items.length, end + props.bufferSize);
  dynamicEndIndex.value = end;
};

const handleDynamicScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
  updateLayout();
  recalcVisible(target.scrollTop);
};

const handleMeasure = (id: string, element: HTMLElement) => {
  if (!element || !id) return;
  const rect = element.getBoundingClientRect();
  const height = rect.height;
  if (height > 0 && height !== measuredHeights.value.get(id)) {
    measuredHeights.value.set(id, height);
    emit("measure", id, height);
    updateLayout();
    if (containerRef.value) {
      recalcVisible(containerRef.value.scrollTop);
    }
  }
};

// ── Lifecycle ──
onMounted(() => {
  if (containerRef.value) {
    actualContainerHeight.value = containerRef.value.clientHeight;
  }
  if (props.dynamicHeight) {
    updateLayout();
    recalcVisible(0);
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
    if (props.dynamicHeight) {
      updateLayout();
      recalcVisible(0);
    }
  },
);

watch(
  () => props.heightCache,
  () => {
    if (props.dynamicHeight) {
      updateLayout();
      recalcVisible(scrollTop.value);
    }
  },
  { deep: true },
);

defineExpose({
  scrollToIndex: (index: number) => {
    if (!containerRef.value) return;
    if (props.dynamicHeight) {
      const targetTop = dynamicOffsets.value[index] || 0;
      containerRef.value.scrollTop = targetTop;
    } else {
      containerRef.value.scrollTop = index * props.itemHeight;
    }
  },
  getContainer: () => containerRef.value,
});
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

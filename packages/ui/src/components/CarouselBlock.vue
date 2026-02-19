<template>
  <div class="carousel-block" :style="containerStyle">
    <!-- 轮播图容器 -->
    <div
      ref="carouselRef"
      class="carousel-container"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="carousel-wrapper" :style="wrapperStyle" @transitionend="handleTransitionEnd">
        <div
          v-for="(item, index) in displayItems"
          :key="`${item.id || index}-${index}`"
          class="carousel-item"
          :style="itemStyle"
        >
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.text || `轮播图${index + 1}`"
            class="carousel-image"
            @load="handleImageLoad"
            @error="handleImageError"
          />
          <div v-else class="carousel-placeholder">
            <span class="placeholder-icon">🖼️</span>
            <span class="placeholder-text">请上传图片</span>
          </div>
        </div>
      </div>

      <!-- 指示器 -->
      <div v-if="showIndicators && imageList.length > 1" class="carousel-indicators">
        <button
          v-for="(_, index) in imageList"
          :key="index"
          class="indicator"
          :class="{ active: currentIndex === index }"
          @click="goToSlide(index)"
        />
      </div>

      <!-- 导航箭头 -->
      <button
        v-if="showArrows && imageList.length > 1"
        class="carousel-arrow arrow-prev"
        @click="prevSlide"
      >
        ❮
      </button>
      <button
        v-if="showArrows && imageList.length > 1"
        class="carousel-arrow arrow-next"
        @click="nextSlide"
      >
        ❯
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface ICarouselLink {
  clickType?: number
  data?: Record<string, unknown>
}

interface ICarouselItem {
  id?: string
  imageUrl: string
  text?: string
  link?: ICarouselLink
}

interface ICarouselProps {
  /** 图片列表 */
  imageList?: ICarouselItem[]
  /** 自动播放间隔(ms) */
  autoplay?: number
  /** 是否显示指示器 */
  showIndicators?: boolean
  /** 是否显示导航箭头 */
  showArrows?: boolean
  /** 轮播高度 */
  height?: string
  /** 背景颜色 */
  backgroundColor?: string
  /** 图片填充模式 */
  imageFit?: 'cover' | 'contain' | 'fill'
  /** 是否循环播放 */
  loop?: boolean
}

const props = withDefaults(defineProps<ICarouselProps>(), {
  imageList: () => [],
  autoplay: 3000,
  showIndicators: true,
  showArrows: true,
  height: '200px',
  backgroundColor: '#f5f7fa',
  imageFit: 'cover',
  loop: true
})

// 响应式数据
const currentIndex = ref(0)
const isTransitioning = ref(false)
const isHovering = ref(false)
const carouselRef = ref<HTMLElement | null>(null)

// 计算属性
const displayItems = computed(() => {
  if (props.imageList.length <= 1) return props.imageList

  // 为了实现无缝循环，需要添加首尾元素
  const items = [...props.imageList]
  if (props.loop && items.length > 1) {
    items.unshift(items[items.length - 1]) // 添加最后一个元素到开头
    items.push(items[1]) // 添加第一个元素到结尾
  }
  return items
})

const containerStyle = computed(() => ({
  height: props.height,
  backgroundColor: props.backgroundColor
}))

const wrapperStyle = computed(() => {
  const translateX = -(currentIndex.value * 100)
  return {
    transform: `translateX(${translateX}%)`,
    transition: isTransitioning.value ? 'transform 0.3s ease' : 'none'
  }
})

const itemStyle = computed(() => ({
  width: `${100 / displayItems.value.length}%`
}))

// 方法
const goToSlide = (index: number) => {
  if (isTransitioning.value || index === currentIndex.value) return

  isTransitioning.value = true
  currentIndex.value = index
}

const nextSlide = () => {
  if (props.imageList.length <= 1) return

  const nextIndex = currentIndex.value + 1
  if (nextIndex >= props.imageList.length) {
    if (props.loop) {
      goToSlide(0)
    }
  } else {
    goToSlide(nextIndex)
  }
}

const prevSlide = () => {
  if (props.imageList.length <= 1) return

  const prevIndex = currentIndex.value - 1
  if (prevIndex < 0) {
    if (props.loop) {
      goToSlide(props.imageList.length - 1)
    }
  } else {
    goToSlide(prevIndex)
  }
}

const handleTransitionEnd = () => {
  isTransitioning.value = false

  // 处理循环边界情况
  if (props.loop && props.imageList.length > 1) {
    if (currentIndex.value >= props.imageList.length) {
      // 从最后一张切换到第一张后，瞬间跳转到真正的第一张
      setTimeout(() => {
        isTransitioning.value = false
        currentIndex.value = 0
      }, 50)
    } else if (currentIndex.value < 0) {
      // 从第一张切换到最后一张后，瞬间跳转到真正的最后一张
      setTimeout(() => {
        isTransitioning.value = false
        currentIndex.value = props.imageList.length - 1
      }, 50)
    }
  }
}

const handleMouseEnter = () => {
  isHovering.value = true
}

const handleMouseLeave = () => {
  isHovering.value = false
}

const handleImageLoad = (_event: Event) => {
  // 图片加载成功后的处理
  // TODO: 可以在这里添加图片加载成功的业务逻辑
}

const handleImageError = (_event: Event) => {
  // 图片加载失败，可以设置默认图片
  // TODO: 可以在这里添加默认图片逻辑
}

// 自动播放
let autoplayTimer: number | null = null

const startAutoplay = () => {
  if (!props.autoplay || props.imageList.length <= 1) return

  autoplayTimer = window.setInterval(() => {
    if (!isHovering.value) {
      nextSlide()
    }
  }, props.autoplay)
}

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

// 监听props变化
watch(
  () => props.imageList,
  () => {
    currentIndex.value = 0
    stopAutoplay()
    startAutoplay()
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<style scoped>
.carousel-block {
  width: 100%;
  overflow: hidden;
  position: relative;
  border-radius: 8px;
}

.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.carousel-wrapper {
  display: flex;
  height: 100%;
  width: 100%;
}

.carousel-item {
  flex-shrink: 0;
  height: 100%;
  position: relative;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: v-bind('props.imageFit');
  display: block;
}

.carousel-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  color: #999;
}

.placeholder-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 14px;
}

.carousel-indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 2;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background-color: #ffffff;
  transform: scale(1.2);
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s ease;
  z-index: 2;
}

.carousel-arrow:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.arrow-prev {
  left: 12px;
}

.arrow-next {
  right: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .carousel-arrow {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .arrow-prev {
    left: 8px;
  }

  .arrow-next {
    right: 8px;
  }

  .carousel-indicators {
    bottom: 8px;
  }

  .indicator {
    width: 6px;
    height: 6px;
  }
}
</style>

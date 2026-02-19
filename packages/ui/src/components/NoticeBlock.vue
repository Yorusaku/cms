<template>
  <div class="notice-bar flex items-center px-4 py-2" :style="{ backgroundColor }">
    <div v-if="iconUrl" class="mr-2 shrink-0">
      <img :src="iconUrl" alt="公告图标" class="w-4 h-4" />
    </div>
    <div v-else class="mr-2 shrink-0">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: textColor }">
        <path
          fill-rule="evenodd"
          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
    <div class="flex-1 overflow-hidden">
      <div
        v-if="noticeList.length > 1"
        class="notice-scroll whitespace-nowrap"
        :style="{ '--scroll-duration': scrollDuration } as any"
      >
        <div class="inline-flex animate-scroll">
          <span
            v-for="(item, index) in noticeList"
            :key="index"
            class="mr-8"
            :style="{ color: textColor }"
          >
            {{ item.text }}
          </span>
          <span
            v-for="(item, index) in noticeList"
            :key="'copy-' + index"
            class="mr-8"
            :style="{ color: textColor }"
          >
            {{ item.text }}
          </span>
        </div>
      </div>
      <div v-else class="truncate" :style="{ color: textColor }">
        {{ noticeList[0]?.text || '' }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export interface INoticeItem {
  text: string
  link?: string
}

export interface INoticeProps {
  noticeList?: INoticeItem[]
  iconUrl?: string
  backgroundColor?: string
  textColor?: string
  speed?: number
}

export const NoticeDefaultConfig = {
  type: 'NoticeBlock',
  props: {
    noticeList: [{ text: '默认公告内容' }],
    iconUrl: '',
    backgroundColor: '#fffbeb',
    textColor: '#92400e',
    speed: 20
  }
}

export default defineComponent({
  name: 'NoticeBlock',
  props: {
    noticeList: {
      type: Array as () => INoticeItem[],
      default: () => []
    },
    iconUrl: {
      type: String,
      default: ''
    },
    backgroundColor: {
      type: String,
      default: '#fffbeb'
    },
    textColor: {
      type: String,
      default: '#92400e'
    },
    speed: {
      type: Number,
      default: 20
    }
  },
  setup(props) {
    const scrollDuration = computed(() => {
      const totalWidth = props.noticeList.reduce(
        (sum, item) => sum + item.text.length * 14 + 128,
        0
      )
      return `${totalWidth / props.speed}s`
    })
    return { scrollDuration }
  }
})
</script>

<style scoped>
@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-scroll {
  animation: scroll var(--scroll-duration) linear infinite;
}

.notice-scroll {
  --scroll-duration: 20s;
}
</style>

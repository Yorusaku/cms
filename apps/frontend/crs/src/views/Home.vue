<template>
  <div class="home-container min-h-screen bg-gray-100">
    <van-nav-bar title="活动列表" />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <van-cell
          v-for="item in activityList"
          :key="item.id"
          :title="item.name"
          :label="item.create_time"
          is-link
          @click="goToPreview(item.id)"
        >
          <template #icon>
            <van-tag :type="item.isAbled === 1 ? 'success' : 'default'">
              {{ item.isAbled === 1 ? '上线中' : '已下线' }}
            </van-tag>
          </template>
        </van-cell>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getPublishedPageList, type PageListItem } from '@/api/page'

defineOptions({
  name: 'CrsHomeView'
})

const router = useRouter()

interface ActivityItem extends PageListItem {
  [key: string]: unknown
}

const activityList = ref<ActivityItem[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = 10

const onLoad = async () => {
  try {
    const res = await getPublishedPageList({ pageNum: pageNum.value, pageSize })
    if (res.code !== 10000) {
      throw new Error(res.message || '加载失败')
    }
    const { list = [], total = 0 } = res.data ?? {}

    if (refreshing.value) {
      activityList.value = []
      refreshing.value = false
    }

    activityList.value.push(...list)
    loading.value = false
    pageNum.value += 1

    if (activityList.value.length >= total) {
      finished.value = true
    }
  } catch (error) {
    console.error('加载活动列表失败:', error)
    loading.value = false
    finished.value = true
    showToast('加载失败，请稍后重试')
  }
}

const onRefresh = () => {
  finished.value = false
  pageNum.value = 1
  onLoad()
}

const goToPreview = (id: number) => {
  router.push({ path: '/page', query: { id } })
}

onMounted(() => {
  onLoad()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
}
</style>

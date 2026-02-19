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

const router = useRouter()

const activityList = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const mockData = [
  {
    id: 1,
    name: '双十一活动页',
    isAbled: 1,
    create_time: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    name: '新年特惠活动',
    isAbled: 0,
    create_time: '2024-01-20 09:00:00'
  }
]

const onLoad = () => {
  setTimeout(() => {
    if (refreshing.value) {
      activityList.value = []
      refreshing.value = false
    }
    
    activityList.value.push(...mockData)
    loading.value = false
    
    if (activityList.value.length >= 20) {
      finished.value = true
    }
  }, 500)
}

const onRefresh = () => {
  finished.value = false
  onLoad()
}

const goToPreview = (id: number) => {
  showToast(`正在跳转到活动 ${id}`)
  router.push({ path: '/pagePreview', query: { id } })
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

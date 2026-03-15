<template>
  <div class="page-container">
    <!-- 鍔犺浇鐘舵€?-->
    <div 
      v-if="loading" 
      class="loading-overlay flex items-center justify-center min-h-screen bg-white"
    >
      <div class="text-center">
        <Loading 
          type="spinner" 
          color="#1989fa" 
          size="40px" 
          class="mb-4"
        />
        <p class="text-gray-600 text-lg">椤甸潰鍔犺浇涓?..</p>
        <p class="text-gray-400 text-sm mt-2">姝ｅ湪鑾峰彇椤甸潰鏁版嵁</p>
      </div>
    </div>

    <!-- 閿欒鐘舵€?-->
    <div 
      v-else-if="error" 
      class="error-overlay flex items-center justify-center min-h-screen bg-gray-50"
    >
      <Empty 
        :description="errorMessage"
        image="error"
        class="w-full max-w-md px-4"
      >
        <template #bottom>
          <Button 
            class="mt-4"
            type="primary" 
            @click="retryLoad"
          >
            閲嶆柊鍔犺浇
          </Button>
        </template>
      </Empty>
    </div>

    <!-- 椤甸潰鍐呭 -->
    <div 
      v-else 
      class="page-content"
      :style="{ backgroundColor: pageBackgroundColor }"
    >
      <SchemaRenderer :page-schema="pageStore.pageSchema" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePageStore } from '@/store/usePageStore'
import { getPageDataById, parsePageSchema } from '@/api/page'
import SchemaRenderer from '@/components/SchemaRenderer.vue'
import { Loading, Empty, Button } from 'vant'

// 涓洪伩鍏岴SLint璀﹀憡锛屾樉寮忚缃粍浠跺悕
defineOptions({
  name: 'CrsPageView'
})

const route = useRoute()
const pageStore = usePageStore()

// 鐘舵€佺鐞?
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')

// 璁＄畻灞炴€?
const pageId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})

const pageBackgroundColor = computed(() => {
  const bgColor = pageStore.pageSchema.pageConfig?.backgroundColor
  return typeof bgColor === 'string' ? bgColor : '#ffffff'
})

// 椤甸潰鍔犺浇鍑芥暟
const loadPageData = async () => {
  // 妫€鏌ラ〉闈D
  if (!pageId.value) {
    error.value = true
    errorMessage.value = '椤甸潰ID涓嶅瓨鍦紝璇锋鏌RL鍙傛暟'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = false
    errorMessage.value = ''
    
    // 鑾峰彇椤甸潰鏁版嵁
    const response = await getPageDataById(pageId.value)
    
    // 妫€鏌ュ搷搴旂姸鎬?
    if (response.code !== 10000) {
      throw new Error(response.message || `鑾峰彇椤甸潰鏁版嵁澶辫触 (code: ${response.code})`)
    }
    
    if (!response.data) {
      throw new Error('椤甸潰鏁版嵁涓虹┖')
    }
    
    // 瑙ｆ瀽Schema鏁版嵁
    const pageData = response.data as unknown as { schema: string; [key: string]: unknown }
    if (!pageData.schema) {
      throw new Error('椤甸潰Schema鏁版嵁缂哄け')
    }
    const schema = parsePageSchema(pageData.schema)
    
    // 娉ㄥ叆鍒皊tore
    pageStore.importPageSchema(schema)
    
    // Set page title
    const pageTitle =
      typeof schema.pageConfig?.name === 'string'
        ? schema.pageConfig.name
        : '移动端页面'
    document.title = pageTitle
    // 璁剧疆鑳屾櫙棰滆壊锛堝鏋滄湁鐨勮瘽锛?
    if (schema.pageConfig?.backgroundColor) {
      // 鑳屾櫙棰滆壊宸查€氳繃璁＄畻灞炴€у鐞?
    }
    
  } catch (err: unknown) {
    error.value = true
    const errorObj = err as Error
    errorMessage.value = errorObj.message || '椤甸潰鍔犺浇澶辫触锛岃绋嶅悗閲嶈瘯'
  } finally {
    loading.value = false
  }
}

// 閲嶈瘯鍔犺浇
const retryLoad = () => {
  loadPageData()
}

// 缁勪欢鎸傝浇鏃跺姞杞芥暟鎹?
onMounted(() => {
  loadPageData()
})
</script>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: white;
}

.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: #f5f5f5;
}

.page-content {
  width: 100%;
  min-height: 100vh;
}
</style>

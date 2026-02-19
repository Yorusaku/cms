<template>
  <div class="decorate-container">
    <TopHeader :page-store="pageStore" />

    <div class="decorate-content">
      <LeftMaterial :material-config="MATERIAL_CONFIG" />
      <CenterCanvas :page-store="pageStore" :material-config="MATERIAL_CONFIG" />
      <RightConfig :page-store="pageStore" :material-config="MATERIAL_CONFIG" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePageStore } from '@/store/usePageStore'
import { MATERIAL_CONFIG } from './config/material.config'
import { getCmsPageById } from '@/api/activity'
import { adaptPageData } from '@/utils/data-adapter'
import TopHeader from './components/TopHeader.vue'
import LeftMaterial from './components/LeftMaterial.vue'
import CenterCanvas from './components/CenterCanvas.vue'
import RightConfig from './components/RightConfig.vue'

const pageStore = usePageStore()
const route = useRoute()

// 初始化数据
const initData = async () => {
  const { id } = route.query

  // 如果是编辑已有页面
  if (id) {
    try {
      console.log('🚀 开始加载页面数据，ID:', id)

      // 调用API获取页面数据
      const response: any = await getCmsPageById(Number(id))

      console.log('📥 接口响应数据:', response)

      // 检查响应状态
      if (response.code !== 10000) {
        throw new Error(response.message || `获取页面数据失败 (code: ${response.code})`)
      }

      if (!response.data) {
        throw new Error('页面数据为空')
      }

      // 使用数据适配器转换数据格式
      const pageData = response.data
      console.log('📄 原始页面数据:', pageData)

      const schema = adaptPageData(pageData)
      console.log('🔧 转换后的Schema:', schema)

      // 确保组件类型大小写正确
      schema.components.forEach(comp => {
        console.log(`组件类型: ${comp.type} -> ${comp.type}`)
      })

      console.log('🔧 解析后的Schema:', schema)

      // 注入到store
      pageStore.importPageSchema(schema)

      ElMessage.success('页面数据加载成功')
    } catch (error: any) {
      console.error('❌ 页面数据加载失败:', error)
      ElMessage.error(error.message || '页面数据加载失败')
      // 加载失败时初始化为空页面
      pageStore.setInitPageSchema()
    }
  } else {
    // 新建页面，初始化空页面
    pageStore.setInitPageSchema()
    console.log('📝 初始化新页面')
  }
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.decorate-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.decorate-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>

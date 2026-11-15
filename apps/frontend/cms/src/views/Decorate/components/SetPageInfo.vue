<template>
  <div class="page-setting">
    <ComTitle title="页面设置" />

    <ComGroup title="页面名称" name-black content-block>
      <el-input v-model.lazy="pageName" placeholder="请输入页面名称" />
    </ComGroup>

    <ComGroup title="微信分享文案" name-black content-block>
      <el-input
        v-model.lazy="shareDesc"
        maxlength="28"
        placeholder="用户通过微信分享时显示，最多 28 个字"
      />
    </ComGroup>

    <ComGroup title="微信分享卡片" tips="图片建议长宽比为 5:4" name-black content-block>
      <el-button type="primary" link @click="shareImage = ''">重置</el-button>
      <UpLoadBox :img-url="shareImage" @update:img-url="updateShareImage" />
    </ComGroup>

    <ComDivider />

    <ComGroup title="背景颜色">
      <el-button type="primary" link @click="backgroundColor = ''"> 重置 </el-button>
      <el-color-picker v-model="backgroundColor" size="small" />
    </ComGroup>

    <ComGroup title="背景图片">
      <el-button type="primary" link @click="backgroundImage = ''"> 重置 </el-button>
      <UpLoadBox :img-url="backgroundImage" @update:img-url="updateBackgroundImage" />
    </ComGroup>

    <ComDivider />

    <ComGroup
      title="布局模式"
      tips="移动端沿用设计稿等比缩放；业务页使用固定字号并在桌面居中限宽"
      name-black
      content-block
    >
      <el-radio-group v-model="layoutMode" class="flex flex-wrap">
        <el-radio value="mobile" style="line-height: 30px; color: #323233">
          移动端（默认）
        </el-radio>
        <el-radio value="business" style="line-height: 30px; color: #323233">
          业务页（桌面自适应）
        </el-radio>
      </el-radio-group>
    </ComGroup>

    <ComDivider />

    <ComGroup
      title="业务场景"
      tips="含票据表单或票据记录列表的页面必须绑定；改名不影响已登记记录"
      name-black
      content-block
    >
      <el-select
        v-model="businessScenarioId"
        class="w-full"
        placeholder="选择业务场景"
        clearable
        filterable
      >
        <el-option
          v-for="scenario in scenarios"
          :key="scenario.id"
          :label="scenario.name"
          :value="scenario.id"
        />
      </el-select>
      <p v-if="scenarioNotice" class="scenario-notice">{{ scenarioNotice }}</p>
    </ComGroup>

    <ComGroup v-if="backgroundImage" title="背景图片位置">
      <el-radio-group v-model="backgroundPosition" class="flex flex-wrap">
        <el-radio value="top" style="line-height: 30px; color: #323233"> 居上 </el-radio>
        <el-radio value="bottom" style="line-height: 30px; color: #323233"> 居下 </el-radio>
      </el-radio-group>
    </ComGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { BusinessScenarioItem } from '@cms/types'
import { getBusinessScenarioList } from '@/api/scenario'
import { usePageStore } from '@/store/usePageStore'
import ComTitle from '@/components/basic/ComTitle.vue'
import ComGroup from '@/components/basic/ComGroup.vue'
import ComDivider from '@/components/basic/ComDivider.vue'
import UpLoadBox from '@/components/basic/UpLoadBox.vue'

const pageStore = usePageStore()

/** 场景绑定：选择器下拉，不让用户手填 UUID */
const scenarios = ref<BusinessScenarioItem[]>([])
const scenarioNotice = ref('')

const loadScenarios = async () => {
  try {
    const response = await getBusinessScenarioList()
    if (response.code === 10000) {
      scenarios.value = response.data ?? []
    }
  } catch {
    scenarioNotice.value = '场景列表加载失败，请刷新重试'
  }
}

const businessScenarioId = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.businessScenarioId
    return typeof value === 'string' ? value : ''
  },
  set: (value: string) => {
    // 绑定变更发布后只影响后续新登记，不改写历史记录归属
    scenarioNotice.value = value ? '变更需重新发布后生效，只影响之后的新登记，不迁移历史记录' : ''
    pageStore.setPageConfig({ businessScenarioId: value || '' })
  }
})

onMounted(() => {
  void loadScenarios()
})

/** 布局模式：缺省 mobile（旧页面行为不变） */
const layoutMode = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.layoutMode
    return value === 'business' ? 'business' : 'mobile'
  },
  set: (value: string) => {
    pageStore.setPageConfig({ layoutMode: value === 'business' ? 'business' : 'mobile' })
  }
})

const pageName = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.name
    return typeof value === 'string' ? value : ''
  },
  set: (value: string) => {
    pageStore.setPageConfig({ name: value })
  }
})

const shareDesc = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.shareDesc
    return typeof value === 'string' ? value : ''
  },
  set: (value: string) => {
    pageStore.setPageConfig({ shareDesc: value })
  }
})

const shareImage = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.shareImage
    return typeof value === 'string' ? value : ''
  },
  set: (value: string) => {
    pageStore.setPageConfig({ shareImage: value })
  }
})

const backgroundColor = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.backgroundColor
    return typeof value === 'string' ? value : ''
  },
  set: (value: string) => {
    pageStore.setPageConfig({ backgroundColor: value })
  }
})

const backgroundImage = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.backgroundImage
    return typeof value === 'string' ? value : ''
  },
  set: (value: string) => {
    pageStore.setPageConfig({ backgroundImage: value })
  }
})

const backgroundPosition = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.backgroundPosition
    return typeof value === 'string' ? value : 'top'
  },
  set: (value: string) => {
    pageStore.setPageConfig({ backgroundPosition: value })
  }
})

const updateShareImage = (url: string) => {
  shareImage.value = url
}

const updateBackgroundImage = (url: string) => {
  backgroundImage.value = url
}
</script>

<style scoped>
.page-setting {
  padding-bottom: 50px;
}
</style>

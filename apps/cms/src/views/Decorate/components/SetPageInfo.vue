<template>
  <div class="page-setting">
    <ComTitle title="页面设置" />

    <ComGroup title="页面名称" name-black content-block>
      <el-input
        v-model.lazy="pageStore.pageSchema.pageConfig.name"
        class="input-name"
        placeholder="请输入页面名称"
      />
    </ComGroup>

    <ComGroup title="微信分享文案" name-black content-block>
      <el-input
        v-model.lazy="pageStore.pageSchema.pageConfig.shareDesc"
        class="input-name"
        maxlength="28"
        placeholder="用户通过微信分享给朋友时显示，最多28个汉字"
      />
    </ComGroup>

    <ComGroup title="微信分享卡片" tips="图片建议长宽比为5:4" name-black content-block>
      <el-button type="primary" link @click="pageStore.pageSchema.pageConfig.shareImage = ''">
        重置
      </el-button>
      <UpLoadBox
        :img-url="pageStore.pageSchema.pageConfig.shareImage"
        @update:img-url="updateShareImage"
      />
    </ComGroup>

    <ComDivider />

    <ComGroup title="背景颜色">
      <el-button type="primary" link @click="pageStore.pageSchema.pageConfig.backgroundColor = ''">
        重置
      </el-button>
      <el-color-picker v-model="pageStore.pageSchema.pageConfig.backgroundColor" size="small" />
    </ComGroup>

    <ComGroup title="背景图片">
      <el-button type="primary" link @click="pageStore.pageSchema.pageConfig.backgroundImage = ''">
        重置
      </el-button>
      <UpLoadBox
        :img-url="pageStore.pageSchema.pageConfig.backgroundImage"
        @update:img-url="updateBackgroundImage"
      />
    </ComGroup>

    <ComGroup v-if="pageStore.pageSchema.pageConfig.backgroundImage" title="背景图片位置">
      <el-radio-group v-model="pageStore.pageSchema.pageConfig.backgroundPosition">
        <el-radio value="top">居上</el-radio>
        <el-radio value="bottom">居底</el-radio>
      </el-radio-group>
    </ComGroup>
  </div>
</template>

<script setup lang="ts">
import { usePageStore } from '@/store/usePageStore'
import ComTitle from '@/components/basic/ComTitle.vue'
import ComGroup from '@/components/basic/ComGroup.vue'
import ComDivider from '@/components/basic/ComDivider.vue'
import UpLoadBox from '@/components/basic/UpLoadBox.vue'

const pageStore = usePageStore()

const updateShareImage = (url: string) => {
  pageStore.setPageConfig({ shareImage: url })
}

const updateBackgroundImage = (url: string) => {
  pageStore.setPageConfig({ backgroundImage: url })
}
</script>

<style scoped>
.page-setting {
  padding-bottom: 50px;
}

.input-name :deep(.el-input__inner) {
  width: 100%;
}
</style>

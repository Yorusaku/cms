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

    <ComGroup
      title="微信分享卡片"
      tips="图片建议长宽比为 5:4"
      name-black
      content-block
    >
      <el-button type="primary" link @click="shareImage = ''">重置</el-button>
      <UpLoadBox :img-url="shareImage" @update:img-url="updateShareImage" />
    </ComGroup>

    <ComDivider />

    <ComGroup title="背景颜色">
      <el-button type="primary" link @click="backgroundColor = ''">
        重置
      </el-button>
      <el-color-picker v-model="backgroundColor" size="small" />
    </ComGroup>

    <ComGroup title="背景图片">
      <el-button type="primary" link @click="backgroundImage = ''">
        重置
      </el-button>
      <UpLoadBox
        :img-url="backgroundImage"
        @update:img-url="updateBackgroundImage"
      />
    </ComGroup>

    <ComGroup v-if="backgroundImage" title="背景图片位置">
      <el-radio-group v-model="backgroundPosition" class="flex flex-wrap">
        <el-radio value="top" style="line-height: 30px; color: #323233">
          居上
        </el-radio>
        <el-radio value="bottom" style="line-height: 30px; color: #323233">
          居下
        </el-radio>
      </el-radio-group>
    </ComGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePageStore } from "@/store/usePageStore";
import ComTitle from "@/components/basic/ComTitle.vue";
import ComGroup from "@/components/basic/ComGroup.vue";
import ComDivider from "@/components/basic/ComDivider.vue";
import UpLoadBox from "@/components/basic/UpLoadBox.vue";

const pageStore = usePageStore();

const pageName = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.name;
    return typeof value === "string" ? value : "";
  },
  set: (value: string) => {
    pageStore.setPageConfig({ name: value });
  },
});

const shareDesc = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.shareDesc;
    return typeof value === "string" ? value : "";
  },
  set: (value: string) => {
    pageStore.setPageConfig({ shareDesc: value });
  },
});

const shareImage = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.shareImage;
    return typeof value === "string" ? value : "";
  },
  set: (value: string) => {
    pageStore.setPageConfig({ shareImage: value });
  },
});

const backgroundColor = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.backgroundColor;
    return typeof value === "string" ? value : "";
  },
  set: (value: string) => {
    pageStore.setPageConfig({ backgroundColor: value });
  },
});

const backgroundImage = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.backgroundImage;
    return typeof value === "string" ? value : "";
  },
  set: (value: string) => {
    pageStore.setPageConfig({ backgroundImage: value });
  },
});

const backgroundPosition = computed({
  get: () => {
    const value = pageStore.pageSchema.pageConfig.backgroundPosition;
    return typeof value === "string" ? value : "top";
  },
  set: (value: string) => {
    pageStore.setPageConfig({ backgroundPosition: value });
  },
});

const updateShareImage = (url: string) => {
  shareImage.value = url;
};

const updateBackgroundImage = (url: string) => {
  backgroundImage.value = url;
};
</script>

<style scoped>
.page-setting {
  padding-bottom: 50px;
}
</style>

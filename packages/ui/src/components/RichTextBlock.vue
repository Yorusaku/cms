<template>
  <div
    class="crs-rich-text prose max-w-none"
    :style="{
      backgroundColor,
      padding: typeof padding === 'number' ? `${padding}px` : padding
    }"
  >
    <div class="ql-editor" v-html="content" />
  </div>
</template>

<script setup lang="ts">
export interface IRichTextProps {
  content?: string
  backgroundColor?: string
  padding?: number | string
}

const {
  content = '<p>你可以对文字进行<strong>加粗</strong>、<em>斜体</em>、<span style="text-decoration: underline;">下划线</span>、<span style="text-decoration: line-through;">删除线</span>、文字<span style="color: rgb(0, 176, 240);">颜色</span>、<span style="background-color: rgb(255, 192, 0); color: rgb(255, 255, 255);">背景色</span>、以及字号<span style="font-size: 20px;">大</span><span style="font-size: 14px;">小</span>等简单排版操作。</p>',
  backgroundColor = '#ffffff',
  padding = '10px 10px 0'
} = defineProps<IRichTextProps>()
</script>

<style>
.crs-rich-text {
  position: relative;
  box-sizing: border-box;
  color: #333;
  font-size: 16px;
  line-height: 1.5;
  text-align: left;
  word-wrap: break-word;
}

.crs-rich-text img {
  max-width: 100%;
  vertical-align: top;
  height: auto !important;
  width: auto !important;
}
</style>

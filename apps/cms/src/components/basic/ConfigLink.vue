<template>
  <div class="config-link">
    <div v-if="linkText" class="cl-link-box" @click="openDialog">
      <span class="cll-text">
        <span class="cllt-name" :title="linkText">{{ linkText }}</span>
        <span class="cllt-icon" @click.stop="onRemoveData">
          <el-icon><Close /></el-icon>
        </span>
      </span>
      <a class="cll-btn">修改</a>
    </div>
    <span v-else class="link" @click="openDialog">添加跳转链接</span>

    <el-dialog
      v-model="dialogVisible"
      title="添加跳转链接"
      width="500px"
      :close-on-click-modal="false"
      @closed="onclose"
    >
      <el-tabs v-model="activeName">
        <el-tab-pane label="外部链接" name="outer">
          <el-input v-model="outerUrl" placeholder="请输入外部链接地址" clearable />
        </el-tab-pane>
        <el-tab-pane label="无链接" name="none">
          <p class="no-link-tip">不设置任何跳转</p>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="onConfirm">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'

interface LinkObj {
  clickType: number
  data: any
}

const props = withDefaults(
  defineProps<{
    linkObj?: LinkObj
  }>(),
  {
    linkObj: () => ({
      clickType: 0,
      data: null
    })
  }
)

const emit = defineEmits<{
  (e: 'update:linkObj', value: LinkObj): void
}>()

const dialogVisible = ref(false)
const activeName = ref('none')
const outerUrl = ref('')

const linkText = computed(() => {
  if (!props.linkObj) {
    return ''
  }
  const { clickType, data } = props.linkObj
  const notEmptyObj = data && Object.keys(data).length > 0

  if (clickType && notEmptyObj) {
    if (clickType === 1) {
      return `外部链接 | ${data.url || ''}`
    }
    return '无链接'
  }
  return ''
})

const openDialog = () => {
  dialogVisible.value = true

  if (props.linkObj?.clickType === 1) {
    activeName.value = 'outer'
    outerUrl.value = props.linkObj.data?.url || ''
  } else {
    activeName.value = 'none'
    outerUrl.value = ''
  }
}

const onclose = () => {
  dialogVisible.value = false
}

const onConfirm = () => {
  let result: LinkObj

  if (activeName.value === 'outer' && outerUrl.value) {
    result = {
      clickType: 1,
      data: { url: outerUrl.value }
    }
  } else {
    result = {
      clickType: 0,
      data: null
    }
  }

  emit('update:linkObj', result)
  dialogVisible.value = false
}

const onRemoveData = () => {
  emit('update:linkObj', {
    clickType: 0,
    data: null
  })
}
</script>

<style scoped>
.config-link .link {
  cursor: pointer;
  color: #409eff;
}

.cl-link-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cll-text {
  display: inline-flex;
  align-items: center;
  border: 1px solid #409eff;
  background-color: #ecf5ff;
  padding: 2px 8px;
  border-radius: 2px;
}

.cllt-name {
  font-size: 12px;
  color: #409eff;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cllt-icon {
  margin-left: 6px;
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
}

.cllt-icon:hover {
  color: #f56c6c;
}

.cll-btn {
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
}

.no-link-tip {
  color: #909399;
  font-size: 14px;
  padding: 16px 0;
  text-align: center;
}
</style>

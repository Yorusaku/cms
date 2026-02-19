<template>
  <div class="pic-list">
    <VueDraggable
      v-model="picData"
      :animation="300"
      :disabled="unDraggable || picData.length < 2"
      handle=".pic-item"
      item-key="id"
      ghost-class="sortable-ghost"
    >
      <template #item="{ element, index }">
        <div class="pic-item" :class="{ 'can-drag': !unDraggable && picData.length > 1 }">
          <div class="pic-item-wrapper">
            <UpLoadBox
              v-if="showPic"
              :img-url="element.imageUrl"
              @update:img-url="updateItemImage(index, $event)"
            />
            <div class="info">
              <dl v-if="showName" class="form-group">
                <dt class="form-label">标题</dt>
                <dd class="form-container">
                  <el-input
                    v-model.lazy="element.text"
                    class="input-name"
                    :placeholder="inputPlaceHolder"
                  />
                </dd>
              </dl>
              <dl class="form-group">
                <dt class="form-label">链接</dt>
                <dd class="form-container">
                  <ConfigLink
                    :link-obj="element.link"
                    @update:link-obj="updateItemLink(index, $event)"
                  />
                </dd>
              </dl>
            </div>
          </div>
          <div
            v-if="showDelete"
            class="pic-item-delete"
            title="删除该项"
            @click="deleteItem(index)"
          >
            <el-icon><Close /></el-icon>
          </div>
        </div>
      </template>
    </VueDraggable>

    <el-button v-if="showAdd" class="add-btn" @click="addItem">
      <el-icon><Plus /></el-icon>
      {{ addPlaceHolder }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'
import UpLoadBox from './UpLoadBox.vue'
import ConfigLink from './ConfigLink.vue'

interface PicItem {
  id?: string
  imageUrl?: string
  text?: string
  link?: any
}

const props = withDefaults(
  defineProps<{
    imageList: PicItem[]
    inputPlaceHolder?: string
    addPlaceHolder?: string
    showPic?: boolean
    showName?: boolean
    showAdd?: boolean
    showDelete?: boolean
    unDraggable?: boolean
    limitSize?: number
  }>(),
  {
    inputPlaceHolder: '',
    addPlaceHolder: '添加广告图',
    showPic: true,
    showName: true,
    showAdd: true,
    showDelete: true,
    unDraggable: false,
    limitSize: 10
  }
)

const emit = defineEmits<{
  (e: 'update:imageList', value: PicItem[]): void
}>()

const picData = ref<PicItem[]>(JSON.parse(JSON.stringify(props.imageList)))

watch(
  () => props.imageList,
  newVal => {
    picData.value = JSON.parse(JSON.stringify(newVal))
  },
  { deep: true }
)

watch(
  picData,
  newVal => {
    emit('update:imageList', newVal)
  },
  { deep: true }
)

const addItem = () => {
  if (props.limitSize && picData.value.length >= props.limitSize) {
    ElMessage.warning(`最多添加${props.limitSize}条数据`)
    return
  }

  const item: PicItem = {
    id: `item-${Date.now()}`,
    link: null,
    imageUrl: '',
    text: ''
  }
  picData.value.push(item)
}

const updateItemImage = (index: number, url: string) => {
  if (picData.value[index]) {
    picData.value[index].imageUrl = url
  }
}

const updateItemLink = (index: number, link: any) => {
  if (picData.value[index]) {
    picData.value[index].link = link
  }
}

const deleteItem = (index: number) => {
  picData.value.splice(index, 1)
}
</script>

<style scoped>
.pic-list {
  width: 100%;
}

.pic-item {
  position: relative;
  margin-bottom: 12px;
  padding: 6px 0;
  background: #ffffff;
  box-shadow: 0 0 4px 0 rgba(10, 42, 97, 0.2);
  border-radius: 2px;
  user-select: none;
}

.pic-item.can-drag {
  cursor: move;
}

.pic-item.sortable-ghost {
  opacity: 0.2;
}

.pic-item:hover .pic-item-delete {
  visibility: visible;
}

.pic-item-wrapper {
  display: flex;
}

.info {
  flex: 1;
}

.form-group {
  padding: 6px 12px;
  display: flex;
  align-items: center;
}

.form-label {
  margin-right: 16px;
  font-size: 14px;
  color: #323233;
  line-height: 18px;
  white-space: nowrap;
  min-width: 40px;
}

.form-container {
  flex: 1;
}

.input-name :deep(.el-input__inner) {
  height: 32px;
  line-height: 32px;
  padding: 0 10px;
  border-radius: 2px;
}

.pic-item-delete {
  position: absolute;
  cursor: pointer;
  font-size: 20px;
  right: -10px;
  top: -10px;
  color: #bbb;
  background: #fff;
  border-radius: 50%;
  visibility: hidden;
  z-index: 2;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pic-item-delete:hover {
  color: #f56c6c;
}

.add-btn {
  width: 100%;
  border: 1px dashed #ddd;
  background: #fafafa;
  color: #666;
}

.add-btn:hover {
  border-color: #409eff;
  color: #409eff;
}
</style>

<template>
  <div class="com-valid-time">
    <ComGroup title="生效时间">
      <el-date-picker
        v-model="validTimeRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        :clearable="true"
      />
    </ComGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ComGroup from './ComGroup.vue'

interface ValidTimeItem {
  startTime: string
  endTime: string
}

const props = defineProps<{
  modelValue: ValidTimeItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ValidTimeItem[]): void
}>()

const validTimeRange = computed({
  get: () => {
    if (props.modelValue && props.modelValue.length > 0) {
      const item = props.modelValue[0]
      if (item.startTime && item.endTime) {
        return [item.startTime, item.endTime]
      }
    }
    return null
  },
  set: val => {
    if (val && Array.isArray(val)) {
      emit('update:modelValue', [
        {
          startTime: val[0] || '',
          endTime: val[1] || ''
        }
      ])
    } else {
      emit('update:modelValue', [])
    }
  }
})
</script>

<style scoped>
.com-valid-time :deep(.el-date-editor) {
  width: 100%;
}
</style>

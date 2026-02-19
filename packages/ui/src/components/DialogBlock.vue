<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50" @click="handleClose"></div>
    <div
      class="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 overflow-hidden"
      :style="{ backgroundColor: backgroundColor }"
    >
      <div v-if="title" class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold" :style="{ color: titleColor }">
          {{ title }}
        </h3>
      </div>
      <div class="px-6 py-4">
        <div class="text-gray-600" :style="{ color: contentColor }">
          {{ content }}
        </div>
      </div>
      <div v-if="showActions" class="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
        <button
          v-if="showCancel"
          class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
          :style="{ backgroundColor: confirmColor }"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
      <button
        v-if="showClose"
        class="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        @click="handleClose"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface IDialogProps {
  visible?: boolean
  title?: string
  content?: string
  showClose?: boolean
  showActions?: boolean
  showCancel?: boolean
  cancelText?: string
  confirmText?: string
  backgroundColor?: string
  titleColor?: string
  contentColor?: string
  confirmColor?: string
}

withDefaults(defineProps<IDialogProps>(), {
  visible: false,
  title: '',
  content: '',
  showClose: true,
  showActions: true,
  showCancel: true,
  cancelText: '取消',
  confirmText: '确定',
  backgroundColor: '#ffffff',
  titleColor: '#1f2937',
  contentColor: '#6b7280',
  confirmColor: '#3b82f6'
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  confirm: []
  cancel: []
}>()

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped></style>

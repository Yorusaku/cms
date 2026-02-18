<template>
  <div class="cms-button">
    <button
      :class="[
        'px-4 py-2 border rounded-md cursor-pointer transition-all duration-300',
        {
          'bg-primary border-primary text-white': type === 'primary',
          'bg-red-500 border-red-500 text-white': type === 'danger',
          'bg-white border-gray-300 text-gray-700': type === 'default'
        }
      ]"
      @click="handleClick"
    >
      <slot />
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'primary' | 'default' | 'danger'
}

withDefaults(defineProps<Props>(), {
  type: 'default'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<style scoped>
.cms-button button:hover {
  opacity: 0.8;
}
</style>

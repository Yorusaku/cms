<template>
  <div class="coupon-block">
    <div
      v-if="list.length === 0"
      class="flex items-center justify-center h-48 bg-gray-100 rounded-lg"
    >
      <div class="text-center text-gray-400">
        <p>暂无优惠券</p>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(item, index) in list"
        :key="item.id"
        class="coupon-item relative overflow-hidden rounded-lg bg-white shadow-sm"
        @click="handleClick(item, index)"
      >
        <div class="flex items-center p-4">
          <div
            class="flex flex-col items-center justify-center w-32 h-20 border-r-2 border-dashed border-gray-200"
          >
            <div class="text-red-500">
              <span v-if="item.discountType !== 2" class="text-xs">¥</span>
              <span class="text-3xl font-bold">
                {{ item.discountType !== 2 ? item.discountAmount : item.couponDiscount }}
              </span>
              <span v-if="item.discountType === 2" class="text-xs">折</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ item.discountType !== 3 ? `满${item.fitAmount}元可用` : '无门槛代金券' }}
            </div>
          </div>

          <div class="flex-1 ml-4">
            <div class="text-sm font-medium text-gray-800 line-clamp-1">
              {{ item.name }}
            </div>
            <div class="text-xs text-gray-500 mt-1">有效时间: {{ formatTime(item) }}</div>
            <div v-if="item.description" class="text-xs text-gray-400 mt-1 line-clamp-2">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ICouponItem {
  id: string | number
  name: string
  discountType: 1 | 2 | 3
  discountAmount?: number
  couponDiscount?: number
  maxDiscountAmount?: number
  fitAmount?: number
  effectiveType: 1 | 2
  effectiveDay?: number
  effectiveStartTime?: string
  effectiveEndTime?: string
  description?: string
  couponRangeDesc?: string
}

export interface ICouponProps {
  list?: ICouponItem[]
}

const { list = [] } = defineProps<ICouponProps>()

const emit = defineEmits<{
  click: [item: ICouponItem, index: number]
}>()

const formatTime = (item: ICouponItem) => {
  if (item.effectiveType === 1) {
    return `领取后${item.effectiveDay}天内`
  }
  return `${item.effectiveStartTime}-${item.effectiveEndTime}`
}

const handleClick = (item: ICouponItem, index: number) => {
  emit('click', item, index)
}
</script>

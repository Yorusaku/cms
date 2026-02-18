<template>
  <div class="product-block">
    <div
      v-if="list.length === 0"
      class="flex items-center justify-center h-48 bg-gray-100 rounded-lg"
    >
      <div class="text-center text-gray-400">
        <p>暂无商品</p>
      </div>
    </div>

    <div v-else-if="layoutType === 'listDetail'" class="space-y-0">
      <div
        v-for="(item, index) in list"
        :key="item.id"
        class="flex items-center p-3 bg-white gap-3"
      >
        <img :src="item.imgUrl" class="w-28 h-28 object-cover rounded" />
        <div class="flex-1 h-28 flex flex-col justify-between">
          <div>
            <p class="text-sm font-medium text-gray-800 line-clamp-2">{{ item.brand }}</p>
            <p class="text-xs text-gray-500 truncate mt-1">{{ item.categoryNames }}</p>
          </div>
          <div class="flex items-center justify-between">
            <div :style="{ color: priceColor }" class="text-xs">
              <span>¥</span><span class="text-xl font-bold">{{ item.price }}</span>
            </div>
            <button v-if="showPurchase" class="text-red-500" @click="handleClick(item, index)">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="layoutType === 'oneLineOne'" class="space-y-0">
      <div v-for="(item, index) in list" :key="item.id" class="bg-white">
        <img :src="item.imgUrl" class="w-full h-52 object-cover" />
        <div class="p-3">
          <div>
            <p class="text-sm font-medium text-gray-800 line-clamp-2">{{ item.brand }}</p>
            <p class="text-xs text-gray-500 truncate mt-1">{{ item.categoryNames }}</p>
          </div>
          <div class="flex items-center justify-between mt-2">
            <div :style="{ color: priceColor }" class="text-xs">
              <span>¥</span><span class="text-xl font-bold">{{ item.price }}</span>
            </div>
            <button v-if="showPurchase" class="text-red-500" @click="handleClick(item, index)">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="layoutType === 'oneLineTwo'" class="p-3 flex flex-wrap gap-3">
      <div v-for="(item, index) in list" :key="item.id" class="w-[calc(50%-6px)] bg-white">
        <img :src="item.imgUrl" class="w-full h-24 object-cover" />
        <div class="p-2">
          <div>
            <p class="text-sm font-medium text-gray-800 line-clamp-2">{{ item.brand }}</p>
            <p class="text-xs text-gray-500 truncate mt-1">{{ item.categoryNames }}</p>
          </div>
          <div class="flex items-center justify-between mt-2">
            <div :style="{ color: priceColor }" class="text-xs">
              <span>¥</span><span class="text-xl font-bold">{{ item.price }}</span>
            </div>
            <button v-if="showPurchase" class="text-red-500" @click="handleClick(item, index)">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface IProductItem {
  id: string | number
  imgUrl: string
  brand: string
  categoryNames: string
  price: number
}

export interface IProductProps {
  list?: IProductItem[]
  layoutType?: 'listDetail' | 'oneLineOne' | 'oneLineTwo'
  showPurchase?: boolean
  priceColor?: string
}

const {
  list = [],
  layoutType = 'listDetail',
  showPurchase = false,
  priceColor = '#DD1A21'
} = defineProps<IProductProps>()

const emit = defineEmits<{
  click: [item: IProductItem, index: number]
}>()

const handleClick = (item: IProductItem, index: number) => {
  emit('click', item, index)
}
</script>

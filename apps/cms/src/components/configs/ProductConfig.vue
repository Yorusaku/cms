<template>
  <div class="product-config space-y-6 p-4">
    <!-- 商品列表 -->
    <div class="config-section">
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h3 class="text-base font-semibold text-gray-800">商品列表</h3>
        <el-button type="primary" size="small" @click="addItem">
          <el-icon><Plus /></el-icon>
          添加商品
        </el-button>
      </div>

      <!-- 空状态 -->
      <div v-if="draftItems.length === 0" class="text-center py-8 text-gray-500">
        <div class="text-4xl mb-2">🛍️</div>
        <p class="mb-1">暂无商品</p>
        <p class="text-sm">点击上方按钮添加第一个商品</p>
      </div>

      <!-- 商品列表（支持拖拽排序）-->
      <draggable
        v-else
        v-model="draftItems"
        item-key="id"
        handle=".drag-handle"
        class="space-y-3"
        @end="handleDragEnd"
      >
        <template #item="{ element: item, index }">
          <div
            class="product-item-card bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-all duration-200 relative"
          >
            <!-- 拖拽手柄 -->
            <div
              class="drag-handle absolute top-3 right-12 cursor-move text-gray-400 hover:text-blue-500"
            >
              <el-icon><Rank /></el-icon>
            </div>
            <div class="flex justify-between items-start mb-3">
              <h4 class="font-medium text-gray-700">商品 #{{ index + 1 }}</h4>
              <el-button type="danger" size="small" circle @click="removeItem(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>

            <el-form label-position="top" size="small" class="space-y-3">
              <el-form-item label="商品ID" class="mb-0">
                <el-input
                  v-model="item.id"
                  placeholder="请输入商品唯一ID"
                  @change="triggerUpdate"
                />
              </el-form-item>

              <el-form-item label="商品图片" class="mb-0">
                <ImageUploader
                  v-model="item.imgUrl"
                  :max-size="2"
                  accept="image/*"
                  @change="triggerUpdate"
                />
              </el-form-item>

              <div class="grid grid-cols-2 gap-3">
                <el-form-item label="品牌" class="mb-0">
                  <el-input v-model="item.brand" placeholder="品牌名称" @change="triggerUpdate" />
                </el-form-item>

                <el-form-item label="价格" class="mb-0">
                  <el-input-number
                    v-model="item.price"
                    controls-position="right"
                    :min="0"
                    :step="0.01"
                    :precision="2"
                    @change="triggerUpdate"
                  >
                    <template #append>元</template>
                  </el-input-number>
                </el-form-item>
              </div>

              <el-form-item label="分类标签" class="mb-0">
                <el-input
                  v-model="item.categoryNames"
                  placeholder="请输入分类标签（多个用逗号分隔）"
                  @change="triggerUpdate"
                />
              </el-form-item>
            </el-form>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 兑换价颜色配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        兑换价颜色
      </h3>
      <div class="flex items-center gap-3 mb-4">
        <el-color-picker v-model="localExchangePriceColor" @change="handleDisplayUpdate" />
        <el-button type="text" @click="localExchangePriceColor = '#F5514B'"> 重置 </el-button>
        <span class="text-sm text-gray-500">
          {{ localExchangePriceColor || '未设置' }}
        </span>
      </div>
    </div>

    <!-- 排序方式配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        排序方式
      </h3>
      <el-radio-group v-model="localSortType" class="mb-4" @change="handleDisplayUpdate">
        <el-radio label="customsort">自定义排序</el-radio>
        <el-radio label="stylesort">系统排序</el-radio>
      </el-radio-group>

      <div v-if="localSortType === 'stylesort'" class="ml-6">
        <el-radio-group v-model="localPriceSortType" @change="handleDisplayUpdate">
          <div class="mb-2">\ <el-radio label="order">按兑换积分价顺序排序</el-radio></div>
          <div>
            <el-radio label="reverse">按兑换积分价倒序排序</el-radio>
          </div>
        </el-radio-group>
      </div>
    </div>

    <!-- 列表样式配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        列表样式
      </h3>
      <el-radio-group v-model="localLayoutType" class="space-y-2" @change="handleDisplayUpdate">
        <el-radio label="oneLineOne">一行一个</el-radio>
        <el-radio label="oneLineTwo">一行两个</el-radio>
        <el-radio label="listDetail">详细列表</el-radio>
      </el-radio-group>
    </div>

    <!-- 显示配置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        显示配置
      </h3>
      <el-form label-position="top" size="small" class="space-y-4">
        <el-form-item label="是否显示划线价" class="mb-0">
          <el-radio-group v-model="localMarkingPrice" @change="handleDisplayUpdate">
            <el-radio :label="0">否</el-radio>
            <el-radio :label="1">是</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="是否显示购买图标" class="mb-0">
          <el-radio-group v-model="localShowPurchase" @change="handleDisplayUpdate">
            <el-radio :label="0">否</el-radio>
            <el-radio :label="1">是</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="localShowPurchase" label="价格颜色" class="mb-0">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="localPriceColor" @change="handleDisplayUpdate" />
            <span class="text-sm text-gray-500">
              {{ localPriceColor || '未设置' }}
            </span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 商品缺货控制 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        商品缺货控制
      </h3>
      <el-radio-group v-model="localOutOfStock" @change="handleDisplayUpdate">
        <el-radio label="show">显示</el-radio>
        <el-radio label="showBottom">沉底显示</el-radio>
        <el-radio label="hidden">隐藏</el-radio>
      </el-radio-group>
    </div>

    <!-- 更多设置 -->
    <div class="config-section">
      <h3 class="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        更多设置
      </h3>
      <el-checkbox
        v-model="localBeOverdue"
        :true-label="1"
        :false-label="0"
        @change="handleDisplayUpdate"
      >
        非兑换日期内商品隐藏
      </el-checkbox>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Delete, Rank } from '@element-plus/icons-vue'
import { deepClone, debounce, createRandomId } from '@cms/utils'
import ImageUploader from '../../ImageUploader.vue'
import draggable from 'vuedraggable'

// 商品项类型定义
interface ProductItem {
  id: string
  imgUrl: string
  brand: string
  categoryNames: string
  price: number
  jvName?: string // 商品名称（旧项目字段）
  link?: any // 链接配置
}

// 完整的产品配置类型
interface ProductConfigProps {
  exchangePriceColor: string
  productList: ProductItem[]
  list: ProductItem[] // 兼容字段
  listStyle: string
  markingPrice: number
  purchase: number
  sortType: string
  priceSortType: string
  styleType: string
  showProduceName: number
  lineShowType: string
  cornerMarker: number
  originalPrice: number
  purchaseButton: number
  purchaseButtonType: string
  newTag: number
  outOfStock: string
  beOverdue: number
  layoutType: string
  showPurchase: boolean
  priceColor: string
}

// Props定义
interface Props {
  componentProps: ProductConfigProps
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update', props: any): void
}>()

// 草稿状态管理
const draftItems = ref<ProductItem[]>([])
const isSyncing = ref(false)

// 展示配置的本地状态
const localLayoutType = ref<string>('listDetail')
const localShowPurchase = ref<boolean>(false)
const localPriceColor = ref<string>('#DD1A21')

// 旧项目的完整配置状态
const localExchangePriceColor = ref<string>('#F5514B')
const localMarkingPrice = ref<number>(0)
const localSortType = ref<string>('customsort')
const localPriceSortType = ref<string>('order')
const localStyleType = ref<string>('styleType1')
const localShowProduceName = ref<number>(1)
const localLineShowType = ref<string>('onelineshow')
const localCornerMarker = ref<number>(1)
const localOriginalPrice = ref<number>(1)
const localPurchaseButton = ref<number>(1)
const localPurchaseButtonType = ref<string>('buttontype1')
const localNewTag = ref<number>(1)
const localOutOfStock = ref<string>('show')
const localBeOverdue = ref<number>(1)

// 同步items数据从props
const syncItemsFromProps = () => {
  // 处理商品列表数据
  const list = props.componentProps.productList || props.componentProps.list || []
  draftItems.value = list.map((item: any) => ({
    id: item.id?.toString() || createRandomId(),
    imgUrl: item.imgUrl || item.imageUrl || '',
    brand: item.brand || '',
    categoryNames: item.categoryNames || '',
    price: item.price || 0,
    jvName: item.jvName || '', // 旧项目字段
    link: item.link || null
  }))

  // 同步展示配置（兼容新旧字段名）
  localLayoutType.value =
    props.componentProps.listStyle || props.componentProps.layoutType || 'listDetail'
  localShowPurchase.value =
    props.componentProps.purchase === 1 || props.componentProps.showPurchase || false
  localPriceColor.value =
    props.componentProps.exchangePriceColor || props.componentProps.priceColor || '#DD1A21'

  // 同步旧项目的完整配置
  localExchangePriceColor.value = props.componentProps.exchangePriceColor || '#F5514B'
  localMarkingPrice.value = props.componentProps.markingPrice ?? 0
  localSortType.value = props.componentProps.sortType || 'customsort'
  localPriceSortType.value = props.componentProps.priceSortType || 'order'
  localStyleType.value = props.componentProps.styleType || 'styleType1'
  localShowProduceName.value = props.componentProps.showProduceName ?? 1
  localLineShowType.value = props.componentProps.lineShowType || 'onelineshow'
  localCornerMarker.value = props.componentProps.cornerMarker ?? 1
  localOriginalPrice.value = props.componentProps.originalPrice ?? 1
  localPurchaseButton.value = props.componentProps.purchaseButton ?? 1
  localPurchaseButtonType.value = props.componentProps.purchaseButtonType || 'buttontype1'
  localNewTag.value = props.componentProps.newTag ?? 1
  localOutOfStock.value = props.componentProps.outOfStock || 'show'
  localBeOverdue.value = props.componentProps.beOverdue ?? 1
}

// 防抖更新函数
const triggerUpdate = debounce(() => {
  // 构造商品数据（兼容新旧格式）
  const productList: any[] = draftItems.value.map(item => ({
    id: item.id,
    imgUrl: item.imgUrl,
    imageUrl: item.imgUrl, // 兼容字段
    brand: item.brand,
    categoryNames: item.categoryNames,
    price: item.price,
    jvName: item.jvName || '',
    link: item.link || null
  }))

  const updatedProps: ProductConfigProps = {
    ...deepClone(props.componentProps),
    // 新格式字段
    list: productList,
    layoutType: localLayoutType.value,
    showPurchase: localShowPurchase.value,
    priceColor: localPriceColor.value,
    // 旧项目完整字段
    exchangePriceColor: localExchangePriceColor.value,
    productList: productList,
    listStyle: localLayoutType.value,
    markingPrice: localMarkingPrice.value,
    purchase: localShowPurchase.value ? 1 : 0,
    sortType: localSortType.value,
    priceSortType: localPriceSortType.value,
    styleType: localStyleType.value,
    showProduceName: localShowProduceName.value,
    lineShowType: localLineShowType.value,
    cornerMarker: localCornerMarker.value,
    originalPrice: localOriginalPrice.value,
    purchaseButton: localPurchaseButton.value,
    purchaseButtonType: localPurchaseButtonType.value,
    newTag: localNewTag.value,
    outOfStock: localOutOfStock.value,
    beOverdue: localBeOverdue.value
  }

  emit('update', updatedProps)
}, 300)

// 数组操作方法
const addItem = () => {
  const newItem: ProductItem = {
    id: createRandomId(),
    imgUrl: '',
    brand: '',
    categoryNames: '',
    price: 0
  }
  draftItems.value.push(newItem)
  triggerUpdate()
}

const removeItem = (index: number) => {
  draftItems.value.splice(index, 1)
  triggerUpdate()
}

// 拖拽结束处理
const handleDragEnd = () => {
  triggerUpdate()
}

// 展示配置更新处理
const handleDisplayUpdate = () => {
  triggerUpdate()
}

// 监听外部props变化
watch(
  () => props.componentProps,
  _newProps => {
    if (!isSyncing.value) {
      isSyncing.value = true
      try {
        syncItemsFromProps()
      } finally {
        isSyncing.value = false
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.product-config {
  min-height: 400px;
}

.config-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.config-section:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.product-item-card {
  position: relative;
}

.product-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
  line-height: 1.5;
}

:deep(.el-input-group__append) {
  background-color: #f9fafb;
  border-color: #d1d5db;
}
</style>

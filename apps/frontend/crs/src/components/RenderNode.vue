<script setup lang="ts">
import { computed, defineComponent, h, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import type { IComponentSchemaV2 } from '@cms/types'
import { getMaterialAsyncComponent, resolveMaterialRuntimeProps } from '@cms/ui'
import { usePageStore } from '@/store/usePageStore'
import { trackEvent } from '@/utils/tracking'

const FallbackComponent = defineComponent({
  name: 'CrsMaterialFallback',
  setup() {
    return () =>
      h(
        'div',
        {
          class: 'material-fallback'
        },
        '未找到对应物料组件'
      )
  }
})

interface Props {
  nodeId: string
  componentMap: Record<string, IComponentSchemaV2>
  pageId?: number
  publishedVersionId?: string
  /** 预览模式：预览页把表单切成只读（禁止真实写入） */
  previewMode?: boolean
  /** 祖先组件链（自顶向下，格式 `type:id`），供埋点携带上下文 */
  ancestorPath?: string[]
}

const props = defineProps<Props>()
const pageStore = usePageStore()
const sendSelectEvent = inject<(componentId: string) => Promise<void> | void>(
  'sendSelectEvent',
  () => {}
)

const currentNode = computed(() => props.componentMap[props.nodeId])

/** 子节点继承的祖先链：当前节点追加到父链尾部 */
const childAncestorPath = computed(() => {
  const node = currentNode.value
  return node
    ? [...(props.ancestorPath ?? []), `${node.type}:${node.id}`]
    : (props.ancestorPath ?? [])
})

const resolveComponent = (type: string) => {
  return getMaterialAsyncComponent(type) || FallbackComponent
}

/**
 * 需要页面上下文才能完成提交的物料：线索表单与业务表单。
 * 发布页/预览页都必须拿到真实 pageId 与 publishedVersionId。
 */
const FORM_MATERIAL_TYPES = ['LeadForm', 'BusinessForm', 'TicketExceptionForm']

const shouldRender = computed(() => {
  if (!currentNode.value) return false
  if (typeof currentNode.value.condition === 'boolean') {
    return currentNode.value.condition
  }
  return true
})

const mergedProps = ref<Record<string, unknown>>({})

const updateMergedProps = () => {
  if (!currentNode.value) return

  const baseProps = resolveMaterialRuntimeProps(currentNode.value.type, currentNode.value.props)
  const linkageState = pageStore.linkageEngine.getComponentState(props.nodeId)

  mergedProps.value = {
    ...baseProps,
    ...linkageState,
    ...(FORM_MATERIAL_TYPES.includes(currentNode.value.type)
      ? {
          pageId: props.pageId,
          publishedVersionId: props.publishedVersionId,
          previewMode: props.previewMode === true
        }
      : {}),
    // 票据异常需要组件 ID 定位表单（其他表单不感知，避免多余 attr）
    ...(currentNode.value.type === 'TicketExceptionForm'
      ? { componentId: currentNode.value.id }
      : {})
  }
}

const handleClick = async () => {
  if (currentNode.value && props.pageId) {
    const isCta = ['Button', 'LeadForm', 'FloatLayer'].includes(currentNode.value.type)
    void trackEvent({
      eventType: isCta ? 'cta_click' : 'component_click',
      pageId: props.pageId,
      publishedVersionId: props.publishedVersionId,
      componentId: currentNode.value.id,
      componentType: currentNode.value.type,
      ctaText: isCta
        ? String(
            currentNode.value.props?.text ??
              currentNode.value.props?.title ??
              currentNode.value.type
          )
        : undefined,
      payload: {
        source: 'crs_component',
        // 递归埋点上下文：带上祖先链，便于区分「哪个容器里的按钮被点」
        ancestorPath: props.ancestorPath ?? []
      }
    })
  }
  if (sendSelectEvent) {
    await sendSelectEvent(props.nodeId)
  }
}

/**
 * 列表类物料的运行时事件桥接：组件 emit 的运行时状态 → 联动引擎，
 * 再由页面 schema 里的 linkages 决定流向哪个目标组件。
 * 只桥接物料定义中登记的受控事件（runtimeEventProperties），不设计通用事件编排。
 */
/**
 * 表单未登录：带当前站内路径去登录页，登录后回到原页面继续填写。
 * 不自动提交，表单内容由组件自己留在 sessionStorage 草稿里。
 */
const requireLoginHandler = inject<(() => void) | null>('businessRequireLogin', null)

/**
 * 表单未登录：交给页面端打开内嵌登录（提供方决定是弹层还是跳转）。
 * 页面组件不卸载，已填内容自然保留；登录不会自动提交。
 */
const handleRequireLogin = () => {
  requireLoginHandler?.()
}

const openRecordHandler = inject<((id: number) => void) | null>('businessOpenRecord', null)

/** 查看登记结果：交给页面端路由跳转，组件不直接改 hash */
const handleViewResult = (id: number) => {
  openRecordHandler?.(id)
}

const handleFilterChange = (payload: { filteredCount: number }) => {
  if (!currentNode.value) return
  pageStore.linkageEngine.triggerLinkage(
    currentNode.value.id,
    'filteredCount',
    payload.filteredCount
  )
}

let unsubscribe: (() => void) | null = null

// 缓存命中的异步物料可能立即挂载，首屏属性不能等父节点 mounted 才赋值。
updateMergedProps()

onMounted(() => {
  unsubscribe = pageStore.linkageEngine.subscribe(props.nodeId, () => {
    updateMergedProps()
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

watch(
  () => currentNode.value?.props,
  (newProps, oldProps) => {
    if (!newProps || !oldProps) return
    Object.keys(newProps).forEach(key => {
      if (newProps[key] !== oldProps[key]) {
        pageStore.linkageEngine.triggerLinkage(props.nodeId, key, newProps[key])
      }
    })
  },
  { deep: true }
)
</script>

<template>
  <!--
    不用 Suspense：物料是异步组件，Suspense 在本页卸载（如跳详情页）时
    会触发 Vue 的 vnode 断言错误，导致路由已切换但视图不更新。
    物料 chunk 很小，异步组件自身解析即可。
  -->
  <component
    :is="resolveComponent(currentNode.type)"
    v-if="shouldRender && currentNode"
    :key="currentNode.id"
    v-bind="mergedProps"
    :styles="currentNode.styles"
    @click.stop="handleClick"
    @filter-change="handleFilterChange"
    @require-login="handleRequireLogin"
    @view-result="handleViewResult"
  >
    <template v-for="childId in currentNode.children" :key="childId">
      <RenderNode
        :node-id="childId"
        :component-map="componentMap"
        :page-id="pageId"
        :published-version-id="publishedVersionId"
        :preview-mode="previewMode"
        :ancestor-path="childAncestorPath"
      />
    </template>
  </component>
</template>

<style scoped>
.component-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 100px;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

.material-fallback {
  padding: 16px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 12px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

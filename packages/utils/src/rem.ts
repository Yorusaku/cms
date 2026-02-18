const BASE_SIZE = 32

/**
 * 设置根元素的字体大小为 32px
 * 用于实现 rem 响应式布局
 */
function setRem(): void {
  document.documentElement.style.fontSize = BASE_SIZE + 'px'
}

/**
 * 初始化 rem 响应式布局
 * 设置根元素字体大小并监听窗口大小变化
 *
 * @example
 * // 在应用入口处调用
 * import { initRem } from '@cms/utils'
 * initRem()
 */
export function initRem(): void {
  setRem()
  window.addEventListener('resize', setRem)
}

/**
 * 销毁 rem 响应式布局
 * 移除窗口大小变化监听器
 *
 * @example
 * // 在组件卸载时调用
 * import { destroyRem } from '@cms/utils'
 * onUnmounted(() => {
 *   destroyRem()
 * })
 */
export function destroyRem(): void {
  window.removeEventListener('resize', setRem)
}

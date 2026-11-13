import { ref, onMounted, onUnmounted, Ref } from 'vue'

const MOBILE_WIDTH = 992

/**
 * 响应式设备检测 Hook
 * 自动监听窗口大小变化，判断当前设备类型
 *
 * @example
 * const { isMobile, device } = useResize()
 * console.log(isMobile.value) // true/false
 * console.log(device.value) // 'mobile' | 'desktop'
 */
export function useResize() {
  const isMobile: Ref<boolean> = ref(false)
  const device: Ref<'mobile' | 'desktop'> = ref('desktop')

  /**
   * 检查是否为移动设备
   * @returns 如果窗口宽度小于 992px 则返回 true
   */
  const checkMobile = (): boolean => {
    const { body } = document
    if (!body) return false
    const rect = body.getBoundingClientRect()
    return rect.width - 1 < MOBILE_WIDTH
  }

  /**
   * 处理窗口大小变化
   * 更新设备类型状态
   */
  const handleResize = (): void => {
    const mobile = checkMobile()
    if (isMobile.value !== mobile) {
      isMobile.value = mobile
      device.value = mobile ? 'mobile' : 'desktop'
    }
  }

  onMounted(() => {
    isMobile.value = checkMobile()
    device.value = isMobile.value ? 'mobile' : 'desktop'
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    isMobile,
    device,
    checkMobile,
    handleResize
  }
}

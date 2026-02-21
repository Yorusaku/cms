import { ref } from 'vue'
import { dateFormat } from '../../utils/src/index'

/**
 * 链接数据接口
 */
export interface LinkData {
  id?: string
  projectCode?: string
  activityId?: string
  redirectUrl?: string
  redirectOuterUrl?: string
  appId?: string
}

/**
 * 链接配置接口
 */
export interface LinkConfig {
  clickType: number
  data: LinkData
}

/**
 * 优惠券数据接口
 */
export interface CouponData {
  headImage: string
  middleImage: string
  tailImage: string
  couponActivityId: string
  couponList: Array<{
    effectiveStartTime: string
    effectiveEndTime: string
  }>
}

/**
 * 订单服务接口
 */
export interface OrderService {
  id: string
}

/**
 * 订单销售接口
 */
export interface OrderSale {
  id: string
}

/**
 * 页面跳转 Hook
 * 提供统一的页面跳转逻辑，支持多种跳转类型
 *
 * @example
 * const { jumpLink } = useJumpLink()
 * jumpLink({ clickType: 1, data: { id: '123' } })
 */
export function useJumpLink() {
  const isPreview = ref(false)
  const isToConfirmOrder = ref(false)

  const tabBarList = [
    '/pages/home/index',
    '/pages/maintenance/index',
    '/pages/store/shop/index',
    '/pages/user/userPage/index'
  ]

  /**
   * 根据链接配置进行跳转
   * @param link - 链接配置对象
   */
  const jumpLink = (link: LinkConfig | null): void => {
    if (!link) return

    const { clickType, data } = link
    console.log(clickType, data)

    switch (clickType) {
      case 1:
        jumpToGoodsDetail(data.id || '')
        break
      case 2:
        console.log('领取优惠券逻辑')
        break
      case 3:
        jumpToMaintenance(data.projectCode || '')
        break
      case 4:
        jumpToActivity(data.id || '')
        break
      case 6:
        console.log('领取券包代码逻辑')
        break
      case 7:
        jumpToRedirectUrl(data.redirectUrl || '')
        break
      case 8:
        jumpToOuterMiniProgram(data.appId || '', data.redirectOuterUrl || '')
        break
      case 9:
        console.log('领取KA券包代码逻辑')
        break
      case 10:
        console.log('单服务立即下单')
        break
      default:
        break
    }
  }

  /**
   * 跳转到商品详情页
   * @param id - 商品 ID
   */
  const jumpToGoodsDetail = (id: string): void => {
    console.log('跳转到商品详情', id)
  }

  /**
   * 跳转到保养适配页
   * @param projectCode - 项目编码
   */
  const jumpToMaintenance = (projectCode: string): void => {
    console.log('跳转到保养适配', projectCode)
  }

  /**
   * 跳转到活动页
   * @param id - 活动 ID
   */
  const jumpToActivity = (id: string): void => {
    console.log('跳转到活动页', id)
  }

  /**
   * 跳转到指定 URL
   * @param redirectUrl - 跳转地址
   */
  const jumpToRedirectUrl = (redirectUrl: string): void => {
    const url = redirectUrl.substr(0, 1) === '/' ? redirectUrl : `/${redirectUrl}`
    console.log('跳转到指定URL', url)

    if (tabBarList.includes(url)) {
      console.log('切换到TabBar页面')
    } else {
      console.log('跳转到普通页面')
    }
  }

  /**
   * 跳转到外部小程序
   * @param appId - 小程序 AppID
   * @param path - 跳转路径
   */
  const jumpToOuterMiniProgram = (appId: string, path: string): void => {
    const encodedPath = encodeURIComponent(path)
    console.log('跳转到外部小程序', appId, encodedPath)
  }

  /**
   * 格式化优惠券日期
   * @param coupon - 优惠券数据
   * @returns 格式化后的优惠券数据
   */
  const formatCouponDates = (coupon: unknown): unknown => {
    if (typeof coupon !== 'object' || coupon === null) {
      return coupon
    }

    const data = coupon as Record<string, unknown>
    if (data.effectiveType === 2) {
      return {
        ...data,
        effectiveStartTime: data.effectiveStartTime
          ? dateFormat(data.effectiveStartTime as string, { format: 'yyyy.MM.dd' })
          : '',
        effectiveEndTime: data.effectiveEndTime
          ? dateFormat(data.effectiveEndTime as string, { format: 'yyyy.MM.dd' })
          : ''
      }
    }
    return coupon
  }

  /**
   * 订单详情处理
   * @param orderService - 订单服务数据
   * @param orderSale - 订单销售数据
   */
  const orderDetail = async (orderService: OrderService, orderSale: OrderSale): Promise<void> => {
    if (isToConfirmOrder.value) return
    isToConfirmOrder.value = true

    const skuId = orderService?.id
    const promotionSaleId = orderSale?.id
    const skuDetailReq = [{ skuId, skuNum: 1, skuType: 1 }]

    const params = {
      skuDetailReq,
      promotionSaleId
    }

    console.log('提交订单入参：', params)
    await goOrderDetail(params)
  }

  /**
   * 跳转到订单详情页
   * @param params - 订单参数
   */
  const goOrderDetail = async (params: Record<string, unknown>): Promise<void> => {
    const data = {
      orderParams: params,
      needComfirmReq: true
    }
    const sendData = encodeURIComponent(JSON.stringify(data))
    console.log('跳转到确认订单页面', sendData)
    isToConfirmOrder.value = false
  }

  return {
    isPreview,
    isToConfirmOrder,
    jumpLink,
    jumpToGoodsDetail,
    jumpToMaintenance,
    jumpToActivity,
    jumpToRedirectUrl,
    jumpToOuterMiniProgram,
    formatCouponDates,
    orderDetail,
    goOrderDetail
  }
}

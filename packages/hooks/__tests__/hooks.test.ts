import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/vue'
import { defineComponent, h, nextTick } from 'vue'
import { useJumpLink, useResize, useToggle } from '../src'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('useToggle', () => {
  it('默认关闭，连续切换后恢复初始状态', () => {
    const [state, toggle] = useToggle()
    expect(state.value).toBe(false)
    toggle()
    expect(state.value).toBe(true)
    toggle()
    expect(state.value).toBe(false)
  })

  it('保留调用方指定的初始状态，各实例互不影响', () => {
    const [first, toggleFirst] = useToggle(true)
    const [second] = useToggle()
    expect(first.value).toBe(true)
    toggleFirst()
    expect(first.value).toBe(false)
    expect(second.value).toBe(false)
  })
})

describe('优惠券日期展示', () => {
  it('固定日期券格式化日期并保留其他字段，不修改原数据', () => {
    const coupon = {
      effectiveType: 2,
      effectiveStartTime: '2026-11-12T12:00:00',
      effectiveEndTime: '2026-11-15T12:00:00',
      title: '活动券'
    }
    const result = useJumpLink().formatCouponDates(coupon)
    expect(result).toEqual({
      ...coupon,
      effectiveStartTime: '2026.11.12',
      effectiveEndTime: '2026.11.15'
    })
    expect(coupon.effectiveStartTime).toBe('2026-11-12T12:00:00')
    expect(result).not.toBe(coupon)
  })

  it('固定日期券缺少日期时展示空值，其他有效期类型保持原值', () => {
    const { formatCouponDates } = useJumpLink()
    expect(formatCouponDates({ effectiveType: 2 })).toEqual({
      effectiveType: 2,
      effectiveStartTime: '',
      effectiveEndTime: ''
    })
    const relativeCoupon = { effectiveType: 1, effectiveDays: 7 }
    expect(formatCouponDates(relativeCoupon)).toBe(relativeCoupon)
  })

  it.each([null, undefined, 42, '未加载'])('非对象输入 %s 不被改写', value => {
    expect(useJumpLink().formatCouponDates(value)).toBe(value)
  })
})

describe('useResize', () => {
  it('挂载时识别桌面，窗口变化切换设备，卸载后不再监听', async () => {
    let width = 1200
    const measure = vi
      .spyOn(document.body, 'getBoundingClientRect')
      .mockImplementation(() => new DOMRect(0, 0, width, 900))
    const view = render(
      defineComponent({
        setup() {
          const { device, isMobile } = useResize()
          return () => h('output', `${device.value}:${isMobile.value}`)
        }
      })
    )
    expect(view.getByText('desktop:false')).toBeTruthy()
    width = 390
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(view.getByText('mobile:true')).toBeTruthy()
    width = 1200
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(view.getByText('desktop:false')).toBeTruthy()
    view.unmount()
    const measurementsAtUnmount = measure.mock.calls.length
    window.dispatchEvent(new Event('resize'))
    expect(measure).toHaveBeenCalledTimes(measurementsAtUnmount)
  })
})

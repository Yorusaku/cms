import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TicketExceptionFormBlock from '../TicketExceptionFormBlock.vue'

/**
 * 票据异常表单的写入边界：
 * - 预览态（画布 / 独立预览 / iframe 预览）不得发起创建请求；
 * - 未登录时提示登录并保留填写，不发请求、不自动提交。
 */
const pageContext = {
  pageId: 12,
  componentId: 'form-1',
  publishedVersionId: 'v-1',
  businessCategory: '报销票据',
  allowedExceptionTypes: '票据信息缺失\n质检信息不一致',
  extraFields: [{ key: 'issuedAt', label: '开票日期', type: 'date' as const, required: true }]
}

const fillRequired = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.find('[data-testid="ticket-no"]').setValue('FP-1')
  await wrapper.find('[data-testid="ticket-type"]').setValue('票据信息缺失')
  await wrapper.find('[data-testid="ticket-description"]').setValue('缺少开票日期')
  await wrapper.find('[data-testid="ticket-extra-issuedAt"]').setValue('2026-10-01')
}

describe('TicketExceptionFormBlock 写入边界', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('预览模式即使字段齐全也不发请求', async () => {
    const wrapper = mount(TicketExceptionFormBlock, {
      props: { ...pageContext, previewMode: true }
    })
    await fillRequired(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('预览环境')
  })

  it('未登录时提示登录、保留填写并写入草稿', async () => {
    const wrapper = mount(TicketExceptionFormBlock, {
      props: pageContext
    })
    await fillRequired(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请先登录')
    expect(wrapper.emitted('require-login')).toHaveLength(1)
    // 填写内容保留，草稿可在登录后恢复
    expect((wrapper.find('[data-testid="ticket-no"]').element as HTMLInputElement).value).toBe(
      'FP-1'
    )
    expect(sessionStorage.getItem('ticket-exception-draft:12:form-1')).toContain('FP-1')
  })

  it('预览模式优先于登录判断：预览态不弹登录', async () => {
    const wrapper = mount(TicketExceptionFormBlock, {
      props: { ...pageContext, previewMode: true }
    })
    await wrapper.find('[data-testid="ticket-no"]').setValue('FP-2')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('require-login')).toBeUndefined()
    expect(wrapper.text()).toContain('预览环境')
  })
})

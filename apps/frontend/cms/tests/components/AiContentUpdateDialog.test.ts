import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { IPageSchemaV2 } from '@cms/types'
import { ElMessage } from 'element-plus'

const suggestMock = vi.fn()

vi.mock('@/api/ai', () => ({
  aiSuggestContentChanges: (...args: unknown[]) => suggestMock(...args)
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { id: '1' } })
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn()
  }
}))

import AiContentUpdateDialog from '@/components/AiContentUpdateDialog.vue'
import { usePageStore } from '@/store/usePageStore'

const makeSchema = (): IPageSchemaV2 => ({
  version: '2.0.0',
  pageConfig: { name: '弹窗测试页' },
  componentMap: {
    'rich-1': {
      id: 'rich-1',
      type: 'RichText',
      parentId: null,
      children: [],
      props: { content: '<p>旧正文</p>' },
      styles: {}
    },
    'notice-1': {
      id: 'notice-1',
      type: 'Notice',
      parentId: null,
      children: [],
      props: { noticeList: [{ text: '旧公告' }] },
      styles: {}
    },
    'product-1': {
      id: 'product-1',
      type: 'Product',
      parentId: null,
      children: [],
      props: {
        list: [
          {
            id: 'p1',
            imageUrl: 'data:image/svg+xml;base64,x',
            brand: '品牌',
            price: 1,
            link: ''
          }
        ]
      },
      styles: {}
    }
  },
  rootIds: ['rich-1', 'notice-1', 'product-1']
})

const stubs = {
  'el-dialog': {
    props: ['modelValue'],
    template: `<div class="stub-dialog"><slot /><slot name="footer" /></div>`
  },
  'el-button': {
    props: ['disabled', 'loading', 'type'],
    emits: ['click'],
    template: `<button :disabled="disabled" @click="$emit('click')"><slot /></button>`
  },
  'el-tag': { template: `<span class="stub-tag"><slot /></span>` },
  'el-alert': {
    props: ['title', 'description'],
    template: `<div class="stub-alert">{{ title }} {{ description }}</div>`
  },
  'el-empty': {
    props: ['description'],
    template: `<div class="stub-empty">{{ description }}</div>`
  },
  'el-checkbox': {
    props: ['modelValue'],
    emits: ['change'],
    template: `<label class="stub-checkbox" @click="$emit('change')"><slot /></label>`
  },
  'el-input': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `<textarea class="stub-input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`
  },
  'el-icon': { template: `<i><slot /></i>` }
}

const mountDialog = (targetIds: string[], pageId: number | null = 1) =>
  mount(AiContentUpdateDialog, {
    props: { modelValue: true, targetIds, pageId },
    global: { stubs }
  })

const findButtonByText = (wrapper: ReturnType<typeof mountDialog>, text: string) =>
  wrapper.findAll('button').find(button => button.text().includes(text))

describe('AiContentUpdateDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    suggestMock.mockReset()
  })

  it('展示处理对象，并标注不参与的物料', () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())

    const wrapper = mountDialog(['rich-1', 'notice-1', 'product-1'])

    const text = wrapper.text()
    expect(text).toContain('富文本')
    expect(text).toContain('公告')
    expect(text).toContain('不参与更新')
    expect(text).toContain('2 个可更新')
  })

  it('没有可处理物料时禁用生成', () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())

    const wrapper = mountDialog(['product-1'])
    const generateButton = findButtonByText(wrapper, '生成建议')

    expect(generateButton).toBeDefined()
    expect(generateButton?.attributes('disabled')).toBeDefined()
  })

  it('mock 结果标注示例来源，默认全选，取消勾选后只应用选中项', async () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())
    const applySpy = vi.spyOn(store, 'applyContentChanges')

    suggestMock.mockResolvedValue({
      code: 10000,
      data: {
        source: 'mock',
        changes: [
          {
            componentId: 'rich-1',
            type: 'RichText',
            blocks: [{ type: 'paragraph', text: '（示例）新正文' }],
            html: '<p>（示例）新正文</p>'
          },
          {
            componentId: 'notice-1',
            type: 'Notice',
            noticeTexts: ['（示例）旧公告']
          }
        ],
        warnings: ['当前为示例结果（AI_MOCK_ENABLED=true），未调用真实模型。']
      }
    })

    const wrapper = mountDialog(['rich-1', 'notice-1'])

    await wrapper.find('.stub-input').setValue('更新为新资料')
    await findButtonByText(wrapper, '生成建议')!.trigger('click')
    await flushPromises()

    // 示例结果标识与警告文案
    expect(wrapper.text()).toContain('示例结果')
    expect(wrapper.text()).toContain('未调用真实模型')
    // 默认全选
    expect(wrapper.text()).toContain('应用选中修改（2）')

    // 取消第一个区块
    await wrapper.findAll('.stub-checkbox')[0].trigger('click')
    expect(wrapper.text()).toContain('应用选中修改（1）')

    await findButtonByText(wrapper, '应用选中修改')!.trigger('click')
    await flushPromises()

    expect(applySpy).toHaveBeenCalledTimes(1)
    const changes = applySpy.mock.calls[0][0]
    expect(changes).toHaveLength(1)
    expect(changes[0].componentId).toBe('notice-1')
  })

  it('建议与当前一致时提示无需修改，不触发应用', async () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())
    const applySpy = vi.spyOn(store, 'applyContentChanges')

    suggestMock.mockResolvedValue({
      code: 10000,
      data: { source: 'model', changes: [], warnings: [] }
    })

    const wrapper = mountDialog(['rich-1'])

    await wrapper.find('.stub-input').setValue('没有实际变化')
    await findButtonByText(wrapper, '生成建议')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('无需修改')
    const applyButton = findButtonByText(wrapper, '应用选中修改')
    expect(applyButton?.attributes('disabled')).toBeDefined()
    expect(applySpy).not.toHaveBeenCalled()
  })

  it('页面内容在生成后被改动时，应用被拒绝', async () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())
    const applySpy = vi.spyOn(store, 'applyContentChanges')

    suggestMock.mockResolvedValue({
      code: 10000,
      data: {
        source: 'model',
        changes: [
          {
            componentId: 'rich-1',
            type: 'RichText',
            blocks: [{ type: 'paragraph', text: '新正文' }],
            html: '<p>新正文</p>'
          }
        ],
        warnings: []
      }
    })

    const wrapper = mountDialog(['rich-1'])

    await wrapper.find('.stub-input').setValue('更新')
    await findButtonByText(wrapper, '生成建议')!.trigger('click')
    await flushPromises()

    // 生成后人工改动被选区块的内容
    store.editComponent({
      id: 'rich-1',
      props: { content: '<p>人工改过的内容</p>' }
    })

    await findButtonByText(wrapper, '应用选中修改')!.trigger('click')
    await flushPromises()

    // 冲突时整批不应用
    expect(applySpy).not.toHaveBeenCalled()
  })

  it('冲突后重新生成读取最新内容，但仍只处理打开弹窗时圈定的组件', async () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())
    const applySpy = vi.spyOn(store, 'applyContentChanges')
    suggestMock.mockResolvedValue({
      code: 10000,
      data: {
        source: 'model',
        changes: [
          {
            componentId: 'rich-1',
            type: 'RichText',
            blocks: [{ type: 'paragraph', text: '新正文' }],
            html: '<p>新正文</p>'
          }
        ],
        warnings: []
      }
    })

    const wrapper = mountDialog(['rich-1'])
    await wrapper.find('.stub-input').setValue('更新资料')
    await findButtonByText(wrapper, '生成建议')!.trigger('click')
    await flushPromises()
    store.editComponent({ id: 'rich-1', props: { content: '<p>人工新正文</p>' } })
    await findButtonByText(wrapper, '应用选中修改')!.trigger('click')
    expect(applySpy).not.toHaveBeenCalled()

    await wrapper.setProps({ targetIds: ['notice-1'] })
    await findButtonByText(wrapper, '重新生成')!.trigger('click')
    await flushPromises()
    expect(suggestMock.mock.calls[1][0].targets).toEqual([
      {
        componentId: 'rich-1',
        type: 'RichText',
        content: '<p>人工新正文</p>'
      }
    ])
    expect(wrapper.find('.ai-diff-col').text()).toContain('人工新正文')
    await findButtonByText(wrapper, '应用选中修改')!.trigger('click')
    expect(applySpy).toHaveBeenCalledTimes(1)
    expect(store.pageSchema.componentMap['rich-1'].props.content).toBe('<p>新正文</p>')
    store.undo()
    expect(store.pageSchema.componentMap['rich-1'].props.content).toBe('<p>人工新正文</p>')
  })

  it('公告空文字保留槽位，生成后可以应用并保持链接对应', async () => {
    const store = usePageStore()
    const schema = makeSchema()
    schema.componentMap['notice-1'].props.noticeList = [
      { text: '公告A', link: '/a' },
      { text: '', link: '/empty' },
      { text: '公告B', link: '/b' }
    ]
    store.importPageSchema(schema)
    const before = JSON.parse(
      JSON.stringify(store.pageSchema.componentMap['notice-1'].props.noticeList)
    )
    suggestMock.mockResolvedValue({
      code: 10000,
      data: {
        source: 'model',
        changes: [
          { componentId: 'notice-1', type: 'Notice', noticeTexts: ['新公告A', '', '新公告B'] }
        ],
        warnings: []
      }
    })
    const wrapper = mountDialog(['notice-1'])
    await wrapper.find('.stub-input').setValue('更新两条公告，空项保持不变')
    await findButtonByText(wrapper, '生成建议')!.trigger('click')
    await flushPromises()
    expect(suggestMock.mock.calls[0][0].targets[0].noticeTexts).toEqual(['公告A', '', '公告B'])
    await findButtonByText(wrapper, '应用选中修改')!.trigger('click')
    expect(store.pageSchema.componentMap['notice-1'].props.noticeList).toEqual(
      before.map((item: { text: string }, index: number) => ({
        ...item,
        text: ['新公告A', '', '新公告B'][index]
      }))
    )
  })

  it('未勾选的区块发生变化，不影响其余勾选区块的应用', async () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())
    suggestMock.mockResolvedValue({
      code: 10000,
      data: {
        source: 'model',
        changes: [
          {
            componentId: 'rich-1',
            type: 'RichText',
            blocks: [{ type: 'paragraph', text: '新正文' }],
            html: '<p>新正文</p>'
          },
          { componentId: 'notice-1', type: 'Notice', noticeTexts: ['新公告'] }
        ],
        warnings: []
      }
    })
    const wrapper = mountDialog(['rich-1', 'notice-1'])
    await wrapper.find('.stub-input').setValue('更新资料')
    await findButtonByText(wrapper, '生成建议')!.trigger('click')
    await flushPromises()
    await wrapper.findAll('.stub-checkbox')[0].trigger('click')
    store.editComponent({ id: 'rich-1', props: { content: '<p>人工正文</p>' } })
    await findButtonByText(wrapper, '应用选中修改')!.trigger('click')
    expect(store.pageSchema.componentMap['rich-1'].props.content).toBe('<p>人工正文</p>')
    expect(store.pageSchema.componentMap['notice-1'].props.noticeList).toEqual(
      expect.arrayContaining([expect.objectContaining({ text: '新公告' })])
    )
  })

  it('重新生成失败时清除旧建议，保留输入并展示错误，不允许应用过期结果', async () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())
    const applySpy = vi.spyOn(store, 'applyContentChanges')
    suggestMock
      .mockResolvedValueOnce({
        code: 10000,
        data: {
          source: 'model',
          changes: [
            {
              componentId: 'rich-1',
              type: 'RichText',
              blocks: [{ type: 'paragraph', text: '旧建议' }],
              html: '<p>旧建议</p>'
            }
          ],
          warnings: []
        }
      })
      .mockRejectedValueOnce({ message: 'AI 返回的内容格式不正确，请重新生成' })
    const wrapper = mountDialog(['rich-1'])
    await wrapper.find('.stub-input').setValue('第一份资料')
    await findButtonByText(wrapper, '生成建议')!.trigger('click')
    await flushPromises()
    await wrapper.find('.stub-input').setValue('第二份资料')
    await findButtonByText(wrapper, '重新生成')!.trigger('click')
    await flushPromises()
    expect(ElMessage.error).toHaveBeenCalledWith('AI 返回的内容格式不正确，请重新生成')
    expect(wrapper.find<HTMLTextAreaElement>('.stub-input').element.value).toBe('第二份资料')
    expect(wrapper.findAll('.ai-suggestion')).toHaveLength(0)
    expect(findButtonByText(wrapper, '应用选中修改')!.attributes('disabled')).toBeDefined()
    expect(findButtonByText(wrapper, '生成建议')!.attributes('disabled')).toBeUndefined()
    expect(applySpy).not.toHaveBeenCalled()
  })

  it('关闭弹窗后丢弃迟到响应，不展示建议', async () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())

    let resolveRequest: ((value: unknown) => void) | null = null
    suggestMock.mockReturnValue(
      new Promise(resolve => {
        resolveRequest = resolve
      })
    )

    const wrapper = mountDialog(['rich-1'])

    await wrapper.find('.stub-input').setValue('更新')
    await findButtonByText(wrapper, '生成建议')!.trigger('click')
    await flushPromises()

    // 请求仍在途时关闭弹窗
    await wrapper.setProps({ modelValue: false })

    // 迟到的响应
    resolveRequest!({
      code: 10000,
      data: {
        source: 'model',
        changes: [
          {
            componentId: 'rich-1',
            type: 'RichText',
            blocks: [{ type: 'paragraph', text: '迟到的建议内容' }],
            html: '<p>迟到的建议内容</p>'
          }
        ],
        warnings: []
      }
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('迟到的建议内容')
  })

  it('页面切换（pageId 变化）时自动关闭弹窗', async () => {
    const store = usePageStore()
    store.importPageSchema(makeSchema())

    const wrapper = mountDialog(['rich-1'], 1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await wrapper.setProps({ pageId: 2 })
    await flushPromises()

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted?.[0]).toEqual([false])
  })
})

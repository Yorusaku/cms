import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, type PropType } from 'vue'
import { getMaterialDefaults } from '@cms/ui'
import type { BusinessFormFieldInput, MaterialFieldSchema, MaterialSectionSchema } from '@cms/types'
import MaterialConfigRenderer from '../src/views/Decorate/components/MaterialConfigRenderer.vue'

type RenderableField = Exclude<MaterialFieldSchema, MaterialSectionSchema>

const NEXT_FIELDS: BusinessFormFieldInput[] = [
  { key: 'name', label: '姓名', type: 'text', required: true },
  { key: 'phone', label: '联系电话', type: 'text', required: true },
  { key: 'visitDate', label: '办理日期', type: 'date', required: true }
]

const FieldStub = defineComponent({
  name: 'MaterialFieldRenderer',
  props: {
    field: {
      type: Object as PropType<RenderableField>,
      required: true
    },
    modelValue: {
      type: null as unknown as PropType<unknown>,
      default: undefined
    },
    mirrorRaw: {
      type: null as unknown as PropType<unknown>,
      default: undefined
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: 'field-stub',
          'data-path': props.field.path,
          onClick: () => emit('update', props.field.type === 'formFields' ? NEXT_FIELDS : 'next')
        },
        props.field.path
      )
  }
})

const mountRenderer = (overrides: Record<string, unknown> = {}) =>
  mount(MaterialConfigRenderer, {
    props: {
      materialType: 'BusinessForm',
      componentProps: {
        ...getMaterialDefaults('BusinessForm'),
        ...overrides
      }
    },
    global: { stubs: { MaterialFieldRenderer: FieldStub } }
  })

const findFieldStub = (wrapper: ReturnType<typeof mountRenderer>, path: string) =>
  wrapper.findAll('.field-stub').find(button => button.attributes('data-path') === path)

describe('BusinessForm 字段配置双写', () => {
  it('表单字段更新时同步写入 fields 与 fieldsJson，并立即 emit', async () => {
    const wrapper = mountRenderer()

    const target = findFieldStub(wrapper, 'fields')
    expect(target).toBeTruthy()

    await target!.trigger('click')

    // 表单字段编辑不做防抖：切换组件/保存时不会丢失刚做的配置
    const emitted = wrapper.emitted('update')
    expect(emitted).toBeTruthy()

    const payload = emitted![emitted!.length - 1][0] as Record<string, unknown>
    expect(payload.fields).toEqual(NEXT_FIELDS)
    expect(JSON.parse(String(payload.fieldsJson))).toEqual(NEXT_FIELDS)
  })

  it('把 fieldsJson 原文传给字段编辑器，用于非法 JSON 检测', () => {
    const wrapper = mountRenderer({ fieldsJson: '{并不是合法 JSON' })

    const components = wrapper.findAllComponents(FieldStub)
    const formFieldsComponent = components.find(
      component => (component.props('field') as RenderableField).path === 'fields'
    )

    expect(formFieldsComponent).toBeTruthy()
    expect(formFieldsComponent!.props('mirrorRaw')).toBe('{并不是合法 JSON')
  })

  it('其他文本字段仍走防抖，不立即 emit', async () => {
    const wrapper = mountRenderer()

    const titleInput = findFieldStub(wrapper, 'title')
    expect(titleInput).toBeTruthy()

    await titleInput!.trigger('click')

    // 非表单字段：200ms 防抖内不 emit
    expect(wrapper.emitted('update')).toBeUndefined()
  })
})

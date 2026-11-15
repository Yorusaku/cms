import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import type { BusinessFormFieldInput } from '@cms/types'
import BusinessFormFieldsEditor from '@/views/Decorate/components/BusinessFormFieldsEditor.vue'

/**
 * 业务表单字段可视化配置。
 *
 * 关注点：
 * 1. 基础字段（姓名/手机号）固定：不可删除、不可改 key，名称与占位可改；
 * 2. 扩展字段可增删、上下移动、改 key，下拉选项逐行编辑；
 * 3. 校验不通过时不写入（不 emit），并展示原因；
 * 4. 非法 fieldsJson 显式提示并保留原文；
 * 5. 缺少基础字段时提供补齐入口。
 */
const stubs = {
  'el-input': {
    props: ['modelValue', 'placeholder', 'disabled'],
    emits: ['update:modelValue'],
    template: `<input class="stub-input" :value="modelValue" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`
  },
  'el-button': {
    props: ['disabled', 'loading', 'type', 'link', 'size'],
    emits: ['click'],
    template: `<button class="stub-button" :disabled="disabled" @click="$emit('click')"><slot /></button>`
  },
  'el-select': {
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: `<select class="stub-select" :value="modelValue" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value)"><slot /></select>`
  },
  'el-option': {
    props: ['label', 'value'],
    template: `<option :value="value">{{ label }}</option>`
  },
  'el-checkbox': {
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: `<label class="stub-checkbox"><input type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit('update:modelValue', $event.target.checked)" /><slot /></label>`
  },
  'el-alert': {
    props: ['title', 'type'],
    template: `<div class="stub-alert"><slot name="title" />{{ title }}<slot /></div>`
  },
  'el-tag': { template: `<span class="stub-tag"><slot /></span>` },
  'el-collapse': { template: `<div><slot /></div>` },
  'el-collapse-item': {
    props: ['title', 'name'],
    template: `<div class="stub-collapse-item"><slot name="title" />{{ title }}<slot /></div>`
  }
}

const baseFields = (): BusinessFormFieldInput[] => [
  { key: 'name', label: '姓名', type: 'text', required: true },
  { key: 'phone', label: '联系电话', type: 'text', required: true }
]

const mountEditor = (fields: BusinessFormFieldInput[], rawJson?: string) =>
  mount(BusinessFormFieldsEditor, {
    props: { modelValue: fields, rawJson },
    global: { stubs }
  })

const findButton = (wrapper: ReturnType<typeof mountEditor>, text: string) =>
  wrapper.findAll('.stub-button').find(button => button.text().includes(text))

describe('BusinessFormFieldsEditor', () => {
  it('姓名与手机号基础字段不可删除，名称可编辑', async () => {
    const wrapper = mountEditor(baseFields())

    const rows = wrapper.findAll('.bf-field-row')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('基础字段')
    expect(rows[1].text()).toContain('基础字段')

    // 基础字段的删除按钮禁用
    const deleteButtons = wrapper
      .findAll('.stub-button')
      .filter(button => button.text().includes('删除'))
    expect(deleteButtons).toHaveLength(2)
    expect(deleteButtons[0].attributes('disabled')).toBeDefined()

    // 名称输入框可用：改名后仍通过校验并写回
    const inputs = rows[0].findAll('.stub-input')
    await inputs[0].setValue('您的姓名')
    await nextTick()

    const emitted = wrapper.emitted('update')
    expect(emitted).toBeTruthy()
    const lastPayload = emitted![emitted!.length - 1][0] as BusinessFormFieldInput[]
    expect(lastPayload[0].label).toBe('您的姓名')
    expect(lastPayload[0].key).toBe('name')
  })

  it('新增扩展字段未填完时不写入，并展示校验原因', async () => {
    const wrapper = mountEditor(baseFields())

    await findButton(wrapper, '添加字段')!.trigger('click')
    await nextTick()

    expect(wrapper.findAll('.bf-field-row')).toHaveLength(3)
    // 新字段 key/label 为空 → 不合法 → 不 emit
    expect(wrapper.emitted('update')).toBeUndefined()
    expect(wrapper.text()).toContain('字段配置未通过校验')
    expect(wrapper.text()).toContain('key 不能为空')
  })

  it('扩展字段填完后写入，并可上下移动与删除', async () => {
    const wrapper = mountEditor(baseFields())

    await findButton(wrapper, '添加字段')!.trigger('click')
    await nextTick()

    const rows = wrapper.findAll('.bf-field-row')
    const newRow = rows[2]
    const inputs = newRow.findAll('.stub-input')
    // 名称 / 占位 / key
    await inputs[0].setValue('办理日期')
    await inputs[2].setValue('visitDate')
    await nextTick()

    let emitted = wrapper.emitted('update')
    expect(emitted).toBeTruthy()
    let payload = emitted![emitted!.length - 1][0] as BusinessFormFieldInput[]
    expect(payload).toHaveLength(3)
    expect(payload[2]).toMatchObject({
      key: 'visitDate',
      label: '办理日期',
      type: 'text'
    })

    // 上移：新字段从第 3 位移到第 2 位
    const rowsBefore = wrapper.findAll('.bf-field-row')
    const upButton = rowsBefore[2]
      .findAll('.stub-button')
      .find(button => button.text().includes('上移'))
    await upButton!.trigger('click')
    await nextTick()

    emitted = wrapper.emitted('update')
    payload = emitted![emitted!.length - 1][0] as BusinessFormFieldInput[]
    expect(payload.map(field => field.key)).toEqual(['name', 'visitDate', 'phone'])

    // 删除扩展字段
    const rowsAfterMove = wrapper.findAll('.bf-field-row')
    const deleteButton = rowsAfterMove[1]
      .findAll('.stub-button')
      .find(button => button.text().includes('删除'))
    await deleteButton!.trigger('click')
    await nextTick()

    emitted = wrapper.emitted('update')
    payload = emitted![emitted!.length - 1][0] as BusinessFormFieldInput[]
    expect(payload.map(field => field.key)).toEqual(['name', 'phone'])
  })

  it('下拉字段逐行编辑选项，空选项被丢弃', async () => {
    const fields: BusinessFormFieldInput[] = [
      ...baseFields(),
      {
        key: 'bizType',
        label: '业务类型',
        type: 'select',
        options: ['咨询']
      }
    ]
    const wrapper = mountEditor(fields)

    const selectRow = wrapper.findAll('.bf-field-row')[2]
    await selectRow.find('.stub-select').setValue('select')
    await nextTick()

    expect(wrapper.text()).toContain('下拉选项')

    await findButton(wrapper, '+ 添加选项')!.trigger('click')
    await nextTick()

    // 新增空选项 → 被过滤掉，但仍通过校验（原有一个有效选项）
    const optionInputs = wrapper.findAll('.bf-option-row .stub-input')
    expect(optionInputs.length).toBe(2)
    await optionInputs[1].setValue('办理')
    await nextTick()

    const emitted = wrapper.emitted('update')
    const payload = emitted![emitted!.length - 1][0] as BusinessFormFieldInput[]
    expect(payload[2].options).toEqual(['咨询', '办理'])
  })

  it('下拉选项重复时不写入并提示', async () => {
    const fields: BusinessFormFieldInput[] = [
      ...baseFields(),
      {
        key: 'bizType',
        label: '业务类型',
        type: 'select',
        options: ['咨询']
      }
    ]
    const wrapper = mountEditor(fields)

    await findButton(wrapper, '+ 添加选项')!.trigger('click')
    await nextTick()
    const optionInputs = wrapper.findAll('.bf-option-row .stub-input')
    await optionInputs[1].setValue('咨询')
    await nextTick()

    expect(wrapper.text()).toContain('下拉选项存在重复项')
  })

  it('缺少基础字段时提示并可以补齐', async () => {
    const wrapper = mountEditor([{ key: 'name', label: '姓名', type: 'text', required: true }])

    expect(wrapper.text()).toContain('缺少基础字段')
    expect(wrapper.text()).toContain('联系电话')

    await findButton(wrapper, '补齐基础字段')!.trigger('click')
    await nextTick()

    const emitted = wrapper.emitted('update')
    const payload = emitted![emitted!.length - 1][0] as BusinessFormFieldInput[]
    expect(payload.map(field => field.key)).toEqual(['name', 'phone'])
  })

  it('fieldsJson 非法时提示并保留原文，不自动覆盖', () => {
    const wrapper = mountEditor(baseFields(), '{不是合法 JSON')

    expect(wrapper.text()).toContain('字段配置 JSON 无法解析')
    expect(wrapper.text()).toContain('{不是合法 JSON')
    // 未点击覆盖前不应写回
    expect(wrapper.emitted('update')).toBeUndefined()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LinkageRuleDialog from '@/views/Decorate/components/LinkageRuleDialog.vue';
import type { IComponentSchemaV2, IComponentLinkage } from '@cms/types';

describe('LinkageRuleDialog.vue', () => {
  const mockComponents: IComponentSchemaV2[] = [
    {
      id: 'comp-1',
      type: 'ProductBlock',
      props: { price: 100, name: 'Product A' },
      styles: {},
      parentId: null,
      children: [],
    },
    {
      id: 'comp-2',
      type: 'CartBlock',
      props: { totalPrice: 0, quantity: 1 },
      styles: {},
      parentId: null,
      children: [],
    },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders dialog with form fields', () => {
    const wrapper = mount(LinkageRuleDialog, {
      props: {
        modelValue: true,
        linkage: null,
        components: mockComponents,
      },
      global: {
        stubs: {
          'el-dialog': {
            template: '<div><slot /></div>',
            props: ['modelValue'],
          },
          'el-form': { template: '<div><slot /></div>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div></div>' },
          'el-input': { template: '<input />' },
          'el-input-number': { template: '<input type="number" />' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    });

    expect(wrapper.find('div').exists()).toBe(true);
  });

  it('initializes form with linkage data when editing', async () => {
    const existingLinkage: IComponentLinkage = {
      id: 'linkage-1',
      sourceComponentId: 'comp-1',
      sourceProperty: 'price',
      targetComponentId: 'comp-2',
      targetProperty: 'totalPrice',
      transformFn: '(value) => value * 1.1',
      enabled: true,
    };

    const wrapper = mount(LinkageRuleDialog, {
      props: {
        modelValue: true,
        linkage: existingLinkage,
        components: mockComponents,
      },
      global: {
        stubs: {
          'el-dialog': { template: '<div><slot /></div>' },
          'el-form': { template: '<div><slot /></div>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div></div>' },
          'el-input': { template: '<input />' },
          'el-input-number': { template: '<input type="number" />' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.form.sourceComponentId).toBe('comp-1');
    expect(wrapper.vm.form.sourceProperty).toBe('price');
    expect(wrapper.vm.form.targetComponentId).toBe('comp-2');
    expect(wrapper.vm.form.targetProperty).toBe('totalPrice');
  });

  it('emits save event with correct linkage data', async () => {
    const wrapper = mount(LinkageRuleDialog, {
      props: {
        modelValue: true,
        linkage: null,
        components: mockComponents,
      },
      global: {
        stubs: {
          'el-dialog': { template: '<div><slot /></div>' },
          'el-form': { template: '<form ref="formRef"><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div></div>' },
          'el-input': { template: '<input />' },
          'el-input-number': { template: '<input type="number" />' },
          'el-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    });

    // 设置表单数据
    wrapper.vm.form.sourceComponentId = 'comp-1';
    wrapper.vm.form.sourceProperty = 'price';
    wrapper.vm.form.targetComponentId = 'comp-2';
    wrapper.vm.form.targetProperty = 'totalPrice';
    wrapper.vm.transformType = 'multiply';
    wrapper.vm.multiplier = 1.1;

    await wrapper.vm.$nextTick();

    // 模拟表单验证通过
    wrapper.vm.formRef = {
      validate: vi.fn().mockResolvedValue(true),
    };

    await wrapper.vm.handleSave();

    expect(wrapper.emitted('save')).toBeTruthy();
    const saveEvent = wrapper.emitted('save')[0][0];
    expect(saveEvent.sourceComponentId).toBe('comp-1');
    expect(saveEvent.targetComponentId).toBe('comp-2');
    expect(saveEvent.transformFn).toContain('* 1.1');
  });

  it('generates correct transform function for multiply type', async () => {
    const wrapper = mount(LinkageRuleDialog, {
      props: {
        modelValue: true,
        linkage: null,
        components: mockComponents,
      },
      global: {
        stubs: {
          'el-dialog': { template: '<div><slot /></div>' },
          'el-form': { template: '<form ref="formRef"><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div></div>' },
          'el-input': { template: '<input />' },
          'el-input-number': { template: '<input type="number" />' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    });

    wrapper.vm.form.sourceComponentId = 'comp-1';
    wrapper.vm.form.sourceProperty = 'price';
    wrapper.vm.form.targetComponentId = 'comp-2';
    wrapper.vm.form.targetProperty = 'totalPrice';
    wrapper.vm.transformType = 'multiply';
    wrapper.vm.multiplier = 2.5;

    wrapper.vm.formRef = {
      validate: vi.fn().mockResolvedValue(true),
    };

    await wrapper.vm.handleSave();

    const saveEvent = wrapper.emitted('save')[0][0];
    expect(saveEvent.transformFn).toBe('(value) => value * 2.5');
  });

  it('generates correct transform function for uppercase type', async () => {
    const wrapper = mount(LinkageRuleDialog, {
      props: {
        modelValue: true,
        linkage: null,
        components: mockComponents,
      },
      global: {
        stubs: {
          'el-dialog': { template: '<div><slot /></div>' },
          'el-form': { template: '<form ref="formRef"><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div></div>' },
          'el-input': { template: '<input />' },
          'el-input-number': { template: '<input type="number" />' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    });

    wrapper.vm.form.sourceComponentId = 'comp-1';
    wrapper.vm.form.sourceProperty = 'name';
    wrapper.vm.form.targetComponentId = 'comp-2';
    wrapper.vm.form.targetProperty = 'displayName';
    wrapper.vm.transformType = 'uppercase';

    wrapper.vm.formRef = {
      validate: vi.fn().mockResolvedValue(true),
    };

    await wrapper.vm.handleSave();

    const saveEvent = wrapper.emitted('save')[0][0];
    expect(saveEvent.transformFn).toBe('(value) => String(value).toUpperCase()');
  });

  it('generates correct condition for greater than', async () => {
    const wrapper = mount(LinkageRuleDialog, {
      props: {
        modelValue: true,
        linkage: null,
        components: mockComponents,
      },
      global: {
        stubs: {
          'el-dialog': { template: '<div><slot /></div>' },
          'el-form': { template: '<form ref="formRef"><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div></div>' },
          'el-input': { template: '<input />' },
          'el-input-number': { template: '<input type="number" />' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    });

    wrapper.vm.form.sourceComponentId = 'comp-1';
    wrapper.vm.form.sourceProperty = 'price';
    wrapper.vm.form.targetComponentId = 'comp-2';
    wrapper.vm.form.targetProperty = 'totalPrice';
    wrapper.vm.conditionType = 'gt';
    wrapper.vm.conditionValue = '100';

    wrapper.vm.formRef = {
      validate: vi.fn().mockResolvedValue(true),
    };

    await wrapper.vm.handleSave();

    const saveEvent = wrapper.emitted('save')[0][0];
    expect(saveEvent.condition.type).toBe('simple');
    expect(saveEvent.condition.expression).toBe('value > 100');
  });

  it('emits update:modelValue when cancel is clicked', async () => {
    const wrapper = mount(LinkageRuleDialog, {
      props: {
        modelValue: true,
        linkage: null,
        components: mockComponents,
      },
      global: {
        stubs: {
          'el-dialog': { template: '<div><slot /></div>' },
          'el-form': { template: '<div><slot /></div>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div></div>' },
          'el-input': { template: '<input />' },
          'el-input-number': { template: '<input type="number" />' },
          'el-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    });

    await wrapper.vm.handleCancel();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe(false);
  });
});

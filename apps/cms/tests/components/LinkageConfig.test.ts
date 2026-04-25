import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LinkageConfig from '@/views/Decorate/components/LinkageConfig.vue';
import { usePageStore } from '@/store/usePageStore';

describe('LinkageConfig.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders empty state when no linkages', () => {
    const wrapper = mount(LinkageConfig, {
      global: {
        stubs: {
          'el-button': true,
          'el-empty': true,
          'el-icon': true,
        },
      },
    });

    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('renders linkage list when linkages exist', async () => {
    const pageStore = usePageStore();

    // 添加测试联动规则
    pageStore.addLinkage({
      id: 'linkage-1',
      sourceComponentId: 'comp-1',
      sourceProperty: 'price',
      targetComponentId: 'comp-2',
      targetProperty: 'totalPrice',
      enabled: true,
    });

    const wrapper = mount(LinkageConfig, {
      global: {
        stubs: {
          'el-button': true,
          'el-empty': true,
          'el-icon': true,
          'LinkageRuleItem': true,
          'LinkageRuleDialog': true,
        },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find('.linkage-list').exists()).toBe(true);
    expect(wrapper.findAll('[data-test="linkage-rule-item"]').length).toBe(1);
  });

  it('opens dialog when add button clicked', async () => {
    const wrapper = mount(LinkageConfig, {
      global: {
        stubs: {
          'el-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          'el-empty': true,
          'el-icon': true,
          'LinkageRuleDialog': {
            template: '<div v-if="modelValue">Dialog</div>',
            props: ['modelValue'],
          },
        },
      },
    });

    const addButton = wrapper.find('button');
    await addButton.trigger('click');

    expect(wrapper.vm.dialogVisible).toBe(true);
  });

  it('calls pageStore.deleteLinkage when delete is triggered', async () => {
    const pageStore = usePageStore();
    const deleteSpy = vi.spyOn(pageStore, 'deleteLinkage');

    pageStore.addLinkage({
      id: 'linkage-1',
      sourceComponentId: 'comp-1',
      sourceProperty: 'price',
      targetComponentId: 'comp-2',
      targetProperty: 'totalPrice',
      enabled: true,
    });

    const wrapper = mount(LinkageConfig, {
      global: {
        stubs: {
          'el-button': true,
          'el-empty': true,
          'el-icon': true,
          'LinkageRuleItem': {
            template: '<div @delete="$emit(\'delete\', \'linkage-1\')"></div>',
            emits: ['delete'],
          },
          'LinkageRuleDialog': true,
        },
      },
    });

    await wrapper.vm.$nextTick();

    const ruleItem = wrapper.findComponent({ name: 'LinkageRuleItem' });
    await ruleItem.vm.$emit('delete', 'linkage-1');

    expect(deleteSpy).toHaveBeenCalledWith('linkage-1');
  });

  it('calls pageStore.toggleLinkage when toggle is triggered', async () => {
    const pageStore = usePageStore();
    const toggleSpy = vi.spyOn(pageStore, 'toggleLinkage');

    pageStore.addLinkage({
      id: 'linkage-1',
      sourceComponentId: 'comp-1',
      sourceProperty: 'price',
      targetComponentId: 'comp-2',
      targetProperty: 'totalPrice',
      enabled: true,
    });

    const wrapper = mount(LinkageConfig, {
      global: {
        stubs: {
          'el-button': true,
          'el-empty': true,
          'el-icon': true,
          'LinkageRuleItem': {
            template: '<div @toggle="$emit(\'toggle\', \'linkage-1\')"></div>',
            emits: ['toggle'],
          },
          'LinkageRuleDialog': true,
        },
      },
    });

    await wrapper.vm.$nextTick();

    const ruleItem = wrapper.findComponent({ name: 'LinkageRuleItem' });
    await ruleItem.vm.$emit('toggle', 'linkage-1');

    expect(toggleSpy).toHaveBeenCalledWith('linkage-1');
  });

  it('saves new linkage when dialog emits save', async () => {
    const pageStore = usePageStore();
    const addSpy = vi.spyOn(pageStore, 'addLinkage');

    const wrapper = mount(LinkageConfig, {
      global: {
        stubs: {
          'el-button': true,
          'el-empty': true,
          'el-icon': true,
          'LinkageRuleItem': true,
          'LinkageRuleDialog': {
            template: '<div @save="$emit(\'save\', linkage)"></div>',
            props: ['modelValue', 'linkage', 'components'],
            emits: ['save'],
            data() {
              return {
                linkage: {
                  id: 'linkage-new',
                  sourceComponentId: 'comp-1',
                  sourceProperty: 'value',
                  targetComponentId: 'comp-2',
                  targetProperty: 'value',
                  enabled: true,
                },
              };
            },
          },
        },
      },
    });

    const dialog = wrapper.findComponent({ name: 'LinkageRuleDialog' });
    await dialog.vm.$emit('save', {
      id: 'linkage-new',
      sourceComponentId: 'comp-1',
      sourceProperty: 'value',
      targetComponentId: 'comp-2',
      targetProperty: 'value',
      enabled: true,
    });

    expect(addSpy).toHaveBeenCalled();
  });

  it('updates existing linkage when dialog emits save with current linkage', async () => {
    const pageStore = usePageStore();
    const updateSpy = vi.spyOn(pageStore, 'updateLinkage');

    pageStore.addLinkage({
      id: 'linkage-1',
      sourceComponentId: 'comp-1',
      sourceProperty: 'price',
      targetComponentId: 'comp-2',
      targetProperty: 'totalPrice',
      enabled: true,
    });

    const wrapper = mount(LinkageConfig, {
      global: {
        stubs: {
          'el-button': true,
          'el-empty': true,
          'el-icon': true,
          'LinkageRuleItem': {
            template: '<div @edit="$emit(\'edit\', linkage)"></div>',
            props: ['linkage'],
            emits: ['edit'],
          },
          'LinkageRuleDialog': {
            template: '<div @save="$emit(\'save\', linkage)"></div>',
            props: ['modelValue', 'linkage', 'components'],
            emits: ['save'],
          },
        },
      },
    });

    await wrapper.vm.$nextTick();

    // 触发编辑
    const ruleItem = wrapper.findComponent({ name: 'LinkageRuleItem' });
    await ruleItem.vm.$emit('edit', pageStore.linkages[0]);

    // 保存更新
    const dialog = wrapper.findComponent({ name: 'LinkageRuleDialog' });
    await dialog.vm.$emit('save', {
      id: 'linkage-1',
      sourceComponentId: 'comp-1',
      sourceProperty: 'newPrice',
      targetComponentId: 'comp-2',
      targetProperty: 'totalPrice',
      enabled: true,
    });

    expect(updateSpy).toHaveBeenCalled();
  });
});

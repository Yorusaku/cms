import { mount, shallowMount, RouterLinkStub } from '@vue/test-utils'

export { mount, shallowMount, RouterLinkStub }

/**
 * 创建一个简单的 Vue 组件用于测试
 * @example
 * const wrapper = createWrapper({ props: { name: 'test' } })
 */
export function createWrapper(component: any, options?: any) {
  return mount(component, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub
      }
    },
    ...options
  })
}

/**
 * 等待异步更新
 * @example
 * await flushPromises()
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

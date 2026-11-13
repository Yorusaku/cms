import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

describe('Basic Tests', () => {
  it('should work', () => {
    const count = ref(0)
    expect(count.value).toBe(0)
  })

  it('should render component', async () => {
    const wrapper = mount({
      template: '<div>Hello World</div>'
    })
    expect(wrapper.text()).toContain('Hello World')
  })
})

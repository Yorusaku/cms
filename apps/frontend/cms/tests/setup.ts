import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})
window.IntersectionObserver = mockIntersectionObserver

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})
window.ResizeObserver = mockResizeObserver

// Global mocks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Vue Test Utils config
config.global.stubs = {
  teleport: true,
  transition: false,
  'transition-group': false
}

config.global.provide = {
  // Add any global provide values here
}

// Utility functions
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockScrollIntoView = () => {
  Element.prototype.scrollIntoView = vi.fn()
}

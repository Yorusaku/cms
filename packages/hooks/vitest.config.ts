import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: { statements: 53.93, branches: 88.9, functions: 44.66, lines: 53.93 },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/.{eslint,prettier}rc.{js,cjs}'
      ]
    }
  }
})

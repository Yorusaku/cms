import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,js}'],
    // 与 CMS 相同：forks 池在本机执行时会随机抛 EPERM 并静默跳过测试文件，threads 池稳定
    pool: 'threads',
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: { statements: 65.98, branches: 68.29, functions: 33, lines: 65.98 },
      exclude: ['node_modules/', 'dist/', '**/*.d.ts']
    }
  }
})

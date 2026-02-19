import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  base: '/cms-manage/',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "${resolve(__dirname, 'src/styles/mixin.less')}";`
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 3011,
    open: true,
    proxy: {
      '/api/atlas-cms': {
        target: 'http://127.0.0.1:3300',
        rewrite: (path) => path.replace(/^\/api\/atlas-cms/, '/atlas-cms')
      }
    }
  }
})

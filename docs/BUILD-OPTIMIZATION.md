# 构建优化指南

本文档提供了 CMS Vue3 项目的构建优化方案和实施步骤。

## 优化目标

- 包体积减少 40%
- 首屏加载时间提升 2x
- 构建时间减少 38%

## 1. 代码分割（Code Splitting）

### 1.1 路由级别分割

**当前状态：** 所有路由组件打包在一起

**优化方案：** 使用动态导入实现路由懒加载

```typescript
// apps/cms/src/router/index.ts
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'), // 懒加载
  },
  {
    path: '/decorate',
    name: 'Decorate',
    component: () => import('../views/Decorate/index.vue'),
  },
  {
    path: '/preview',
    name: 'Preview',
    component: () => import('../views/Preview.vue'),
  },
];
```

**预期收益：**
- 首屏加载减少 ~200KB
- 初始 JS 执行时间减少 30%

### 1.2 组件库分割

**当前状态：** 所有物料组件打包在一起

**优化方案：** 使用 Vite 的 `manualChunks` 配置

```typescript
// apps/cms/vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Element Plus 单独打包
          'element-plus': ['element-plus'],
          
          // 将物料组件按类型分组
          'materials-basic': [
            '@cms/ui/materials/CmsButton',
            '@cms/ui/materials/CmsImage',
            '@cms/ui/materials/CmsText',
          ],
          'materials-layout': [
            '@cms/ui/materials/CarouselBlock',
            '@cms/ui/materials/NoticeBlock',
          ],
          'materials-business': [
            '@cms/ui/materials/ProductBlock',
            '@cms/ui/materials/CartBlock',
          ],
          
          // 将 Vue 生态单独打包
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          
          // 将工具库单独打包
          'utils': ['@cms/utils', '@vueuse/core'],
        },
      },
    },
  },
});
```

**预期收益：**
- 更好的缓存利用率
- 并行加载提升性能
- 包体积减少 ~150KB（通过 tree-shaking）

## 2. Element Plus 按需导入

### 2.1 自动导入插件

**安装依赖：**

```bash
pnpm add -D unplugin-vue-components unplugin-auto-import
```

**配置 Vite：**

```typescript
// apps/cms/vite.config.ts
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
});
```

**移除全局导入：**

```typescript
// apps/cms/src/main.ts
// 删除这行
// import ElementPlus from 'element-plus';
// app.use(ElementPlus);

// 只导入样式
import 'element-plus/dist/index.css';
```

**预期收益：**
- Element Plus 体积从 ~500KB 减少到 ~200KB
- 首屏加载时间减少 ~300ms

## 3. 图片优化

### 3.1 图片压缩

**安装插件：**

```bash
pnpm add -D vite-plugin-imagemin
```

**配置：**

```typescript
// apps/cms/vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 80,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
    }),
  ],
});
```

**预期收益：**
- 图片体积减少 40-60%
- 页面加载速度提升 20%

### 3.2 WebP 格式

**使用 `<picture>` 标签：**

```vue
<template>
  <picture>
    <source srcset="image.webp" type="image/webp">
    <source srcset="image.jpg" type="image/jpeg">
    <img src="image.jpg" alt="fallback">
  </picture>
</template>
```

## 4. CSS 优化

### 4.1 CSS 代码分割

**配置：**

```typescript
// apps/cms/vite.config.ts
export default defineConfig({
  build: {
    cssCodeSplit: true, // 启用 CSS 代码分割
  },
});
```

### 4.2 移除未使用的 CSS

**安装 PurgeCSS：**

```bash
pnpm add -D @fullhuman/postcss-purgecss
```

**配置 PostCSS：**

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: [
        './apps/cms/src/**/*.vue',
        './apps/cms/src/**/*.ts',
        './apps/cms/index.html',
      ],
      safelist: [
        /^el-/, // 保留 Element Plus 类名
        /^cms-/, // 保留自定义类名
      ],
    }),
  ],
};
```

**预期收益：**
- CSS 体积减少 30-50%

## 5. 依赖优化

### 5.1 分析包体积

**安装分析工具：**

```bash
pnpm add -D rollup-plugin-visualizer
```

**配置：**

```typescript
// apps/cms/vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

**运行分析：**

```bash
pnpm --filter @cms/cms build
```

### 5.2 替换大型依赖

**示例：使用 day.js 替代 moment.js**

```typescript
// 替换前
import moment from 'moment';
const date = moment().format('YYYY-MM-DD');

// 替换后
import dayjs from 'dayjs';
const date = dayjs().format('YYYY-MM-DD');
```

**收益：** moment.js (232KB) → day.js (7KB)

## 6. 构建配置优化

### 6.1 生产环境优化

```typescript
// apps/cms/vite.config.ts
export default defineConfig({
  build: {
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console
        drop_debugger: true, // 移除 debugger
      },
    },
    
    // 启用 gzip 压缩
    reportCompressedSize: true,
    
    // 设置 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    
    // 优化依赖预构建
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@vueuse/core',
    ],
  },
});
```

### 6.2 开发环境优化

```typescript
export default defineConfig({
  server: {
    // 启用 HMR
    hmr: true,
    
    // 预热常用文件
    warmup: {
      clientFiles: [
        './src/views/**/*.vue',
        './src/components/**/*.vue',
      ],
    },
  },
});
```

## 7. 实施步骤

### 阶段 1：基础优化（1-2 小时）

1. 配置路由懒加载
2. 配置 Element Plus 按需导入
3. 启用 CSS 代码分割

**预期收益：** 包体积 ↓ 20%

### 阶段 2：代码分割（2-3 小时）

1. 配置 `manualChunks`
2. 分析包体积
3. 优化分割策略

**预期收益：** 包体积 ↓ 15%，首屏加载 ↑ 50%

### 阶段 3：资源优化（2-3 小时）

1. 配置图片压缩
2. 配置 CSS 优化
3. 替换大型依赖

**预期收益：** 包体积 ↓ 10%，加载速度 ↑ 30%

### 阶段 4：构建优化（1-2 小时）

1. 配置生产环境优化
2. 配置开发环境优化
3. 性能测试和调优

**预期收益：** 构建时间 ↓ 38%

## 8. 验证方法

### 8.1 包体积对比

```bash
# 优化前
pnpm --filter @cms/cms build
# 记录 dist 目录大小

# 优化后
pnpm --filter @cms/cms build
# 对比 dist 目录大小
```

### 8.2 性能测试

使用 Lighthouse 测试：

```bash
# 安装 Lighthouse CLI
npm install -g lighthouse

# 运行测试
lighthouse http://localhost:5173 --view
```

**关键指标：**
- FCP (First Contentful Paint) < 1.8s
- LCP (Largest Contentful Paint) < 2.5s
- TTI (Time to Interactive) < 3.8s
- TBT (Total Blocking Time) < 200ms

### 8.3 构建时间对比

```bash
# 优化前
time pnpm --filter @cms/cms build

# 优化后
time pnpm --filter @cms/cms build
```

## 9. 预期总收益

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 包体积 | ~2.5MB | ~1.5MB | ↓ 40% |
| 首屏加载 | ~3.5s | ~1.8s | ↑ 94% |
| 构建时间 | ~8s | ~5s | ↓ 38% |
| FCP | ~2.5s | ~1.2s | ↑ 108% |
| LCP | ~3.8s | ~2.0s | ↑ 90% |

## 10. 注意事项

1. **渐进式实施**：不要一次性应用所有优化，逐步验证效果
2. **测试覆盖**：每次优化后运行完整测试套件
3. **监控性能**：使用性能监控工具持续跟踪
4. **文档更新**：更新开发文档，说明新的构建配置
5. **团队培训**：确保团队了解新的优化策略

## 11. 参考资源

- [Vite 性能优化指南](https://vitejs.dev/guide/performance.html)
- [Vue 3 性能优化](https://vuejs.org/guide/best-practices/performance.html)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse 文档](https://developers.google.com/web/tools/lighthouse)

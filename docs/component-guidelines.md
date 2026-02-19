# 组件使用规范文档

## 📦 组件架构说明

### 组件分层结构
```
@cms/ui (共享UI组件库)
├── Block组件 - 带业务逻辑的可配置组件
├── 基础组件 - 纯UI展示组件
└── 工具组件 - 辅助功能组件

apps/cms (CMS管理端)
├── 业务组件 - CMS特有业务逻辑
├── 配置面板 - 组件配置界面
└── 包装组件 - UI库组件的CMS适配

apps/crs (客户端渲染服务)
├── 渲染组件 - 页面渲染逻辑
├── 包装组件 - UI库组件的CRS适配
└── 业务组件 - CRS特有功能
```

## 🎯 组件使用规范

### 1. UI组件库 (@cms/ui) 使用

#### Block组件使用原则
```typescript
// ✅ 正确使用方式
import { CarouselBlock, NoticeBlock } from '@cms/ui'

// 组件接收标准props
const props = {
  imageList: [], // 图片列表
  autoplay: 3000, // 自动播放间隔
  showIndicators: true, // 显示指示器
  // ... 其他配置项
}
```

#### 组件Props规范
所有Block组件遵循统一的Props接口：
```typescript
interface IBlockComponentProps {
  // 基础配置
  id?: string
  className?: string
  style?: CSSProperties
  
  // 业务配置（根据不同组件类型）
  [key: string]: any
}
```

### 2. CMS应用组件使用

#### 画布组件映射
```typescript
// apps/cms/src/views/Decorate.vue
const componentMap = {
  // 直接使用UI库组件
  Carousel: () => import('@cms/ui').then(m => m.CarouselBlock),
  Notice: () => import('@cms/ui').then(m => m.NoticeBlock),
  // ...
}
```

#### 配置面板组件
```typescript
// 专门的配置组件
const configMap = {
  Notice: () => import('../components/NoticeConfig.vue')
}
```

### 3. CRS应用组件使用

#### 渲染器组件映射
```typescript
// apps/crs/src/components/SchemaRenderer.vue
const componentMap = {
  // 使用UI库组件进行渲染
  Carousel: () => import('@cms/ui').then(m => m.CarouselBlock),
  Notice: () => import('./Notice.vue'), // 包装组件
  // ...
}
```

#### 包装组件模式
```vue
<!-- apps/crs/src/components/Notice.vue -->
<template>
  <NoticeBlock v-bind="props" />
</template>

<script setup lang="ts">
import { NoticeBlock } from '@cms/ui'
import type { INoticeProps } from '@cms/ui'

defineProps<INoticeProps>()
</script>
```

## 🔄 组件生命周期

### 1. 开发流程
```
需求分析 → 组件设计 → UI库实现 → 应用集成 → 测试验证
```

### 2. 组件更新流程
```
修改UI库组件 → 发布新版本 → 更新应用依赖 → 验证功能
```

## 📋 组件清单

### 当前可用组件

| 组件名称 | 类型 | 用途 | 状态 |
|---------|------|------|------|
| CarouselBlock | Block | 轮播图展示 | ✅ 可用 |
| NoticeBlock | Block | 公告展示 | ✅ 可用 |
| ImageNavBlock | Block | 图片导航 | ✅ 可用 |
| ProductBlock | Block | 商品展示 | ✅ 可用 |
| RichTextBlock | Block | 富文本展示 | ✅ 可用 |
| SliderBlock | Block | 滑块展示 | ✅ 可用 |
| DialogBlock | Block | 弹窗展示 | ✅ 可用 |
| CubeSelectionBlock | Block | 魔方选择 | ✅ 可用 |
| AssistLineBlock | Block | 辅助线 | ✅ 可用 |
| FloatLayerBlock | Block | 浮动层 | ✅ 可用 |
| OnlineServiceBlock | Block | 在线客服 | ✅ 可用 |

### 配置组件

| 组件名称 | 用途 | 状态 |
|---------|------|------|
| NoticeConfig | 公告配置面板 | ✅ 可用 |

## ⚠️ 注意事项

### 1. 组件依赖
- 优先使用@cms/ui组件
- 避免在应用层重复实现相同功能
- 保持组件接口的一致性

### 2. 性能优化
- 使用异步组件加载
- 合理使用keep-alive
- 注意组件的销毁和清理

### 3. 样式隔离
- 使用scoped样式
- 避免全局样式污染
- 统一样式变量管理

### 4. 类型安全
- 完善的TypeScript类型定义
- Props和Events的严格校验
- 避免any类型的使用

## 🛠️ 开发工具

### 推荐VSCode插件
- Vetur/Volar - Vue开发支持
- TypeScript Importer - 自动导入
- ESLint - 代码检查
- Prettier - 代码格式化

### 调试配置
已在`.vscode/launch.json`中配置了Chrome调试支持。

## 📊 最佳实践

### 1. 组件设计原则
- 单一职责原则
- 开闭原则（对扩展开放，对修改封闭）
- 里氏替换原则
- 接口隔离原则
- 依赖倒置原则

### 2. 代码组织
```
components/
├── ui/           # UI组件库
├── business/     # 业务组件
├── config/       # 配置组件
└── wrappers/     # 包装组件
```

### 3. 命名规范
- 组件文件名：PascalCase
- 组件名称：有意义的描述性名称
- Props属性：camelCase
- 事件名称：kebab-case
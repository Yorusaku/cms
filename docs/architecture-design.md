# Vbuilder 核心架构设计与原理解析

本文档深度剖析 Vbuilder 低代码平台的底层架构选型与核心渲染链路。

## 1. 为什么选择 Monorepo + Iframe 沙箱？

低代码平台最大的痛点在于**"B端复杂的编辑环境对 C端轻量渲染环境的污染"**。
为了彻底解决此问题，我们采用了 `apps/cms` 与 `apps/crs` 的物理隔离架构。

- **开发态**：基于 `pnpm workspace`，两者可以同时引用本地的 `packages/ui`，实现代码复用。
- **运行态**：通过 Iframe 将 CRS 嵌入 CMS，实现了 CSS 样式与 JS Window 执行上下文的 **100% 绝对物理隔离**，规避了全局变量与组件库样式的污染。

## 2. 核心渲染机制：扁平化 DSL

在 `packages/types/src/schema.ts` 中，我们定义了引擎的唯一数据源（Single Source of Truth）。
我们拒绝了冗长复杂的嵌套树，采用了**一维扁平化 JSON 对象数组**：

```typescript
// DSL 数据结构核心缩影
export interface BlockSchema {
  id: string // 唯一 UUID，由 nanoid 生成
  type: string // 映射对应的 UI 组件 (如 'CarouselBlock')
  props: Record<string, any>
  styles: Record<string, any>
}
```

## 3. Schema 版本适配器：平滑升级策略

项目实现了 **Schema V1 → V2** 的平滑升级方案，位于 `packages/utils/src/schema-adapter.ts`。

### 核心设计

- **版本检测**：通过 `version` 字段识别数据格式
- **零损耗迁移**：V2 格式支持完全解析 V1 数据，无需数据预处理
- **类型安全**：完全的 TypeScript 类型定义

### 版本对比

| 特性 | V1 | V2 |
|------|----|----|
| 数据结构 | `components` 数组 | `componentMap` + `rootIds` |
| 版本标识 | 无 | `version: "2.0.0"` |
| 扩展性 | 有限 | 支持增量更新 |

## 4. 测试架构：测试驱动开发

项目采用 Vitest 作为单元测试框架，践行 **TDD (测试驱动开发)** 理念。

### 测试分层

```
tests/
├── packages/
│   └── utils/
│       └── __tests__/
│           └── expression.test.ts      # 表达式引擎单元测试
└── apps/
    └── cms/
        ├── tests/
        │   └── basic.test.ts           # 基础功能测试
        └── src/tests/
            ├── schema-v2.integration.test.ts      # 集成测试
            └── schema-v2.performance.test.ts     # 性能测试
```

### 测试工具链

| 工具 | 用途 |
|------|------|
| **Vitest** | 单元测试框架（Globals API） |
| **@vue/test-utils** | Vue 组件测试工具 |
| **@cms/test-utils** | 项目自定义测试辅助函数 |
| **jsdom** | 浏览器环境模拟 |
| **Coverage** | 测试覆盖率报告 |

### 测试覆盖关键链路

- ✅ **Utils 层**：表达式求值、Schema 适配器逻辑
- ✅ **Schema 验证**：V2 格式完整性校验
- ✅ **性能回归**：大数据量场景下的渲染性能

### 快速开始

```bash
# 运行所有测试
pnpm test

# 生成覆盖率报告
pnpm test:coverage

# UI 界面运行测试
pnpm --filter @cms/cms test:ui
```

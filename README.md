# CMS 可视化搭建平台

> 面向营销 H5 的低代码可视化搭建平台，基于 Schema 驱动 + Monorepo 架构，支持拖拽编辑、组件联动、条件渲染、数据绑定等复杂业务场景。内建 NestJS 后端服务，提供页面管理、发布回滚和用户认证 API。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-green)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red)](https://nestjs.com/)
[![Test Coverage](https://img.shields.io/badge/coverage-35%25-yellow)](./docs/TESTING.md)

---

## ✨ 核心亮点

### 🎯 业务价值
- **降低生产成本**：运营可自主搭建营销页面，无需开发介入
- **提升交付效率**：标准化物料 + 可视化编辑，缩短上线周期
- **保证页面质量**：发布前校验 + 版本管理 + 一键回滚

### 🏗️ 架构设计
- **Schema V2 协议**：`componentMap + rootIds` 扁平结构，支持高频编辑操作
- **Monorepo 架构**：编辑器（CMS）与渲染器（CRS）分离，共享层统一协议和物料；自建 NestJS 后端提供 REST API
- **共享物料注册表**：单入口声明，双端消费，降低扩展成本
- **预览隔离机制**：iframe + postMessage 安全通信，避免后台样式污染移动端

### 🚀 核心功能

#### 1. 可视化编辑器
- **三板斧布局**：左侧物料区 + 中间画布区 + 右侧配置区
- **拖拽编辑**：跨区域拖放、组件嵌套、实时预览
- **多选操作**：批量配置、批量删除、批量移动
- **撤销/重做**：50 步历史记录，支持防抖合并
- **键盘快捷键**：Ctrl+Z/Y（撤销/重做）、Delete（删除）、Ctrl+D（复制）

#### 2. 物料系统（14+ 组件）
**基础内容型：**
- 轮播图（Carousel）：支持自动播放、指示器、切换箭头
- 图文导航（ImageNav）：多列布局、自定义链接
- 富文本（RichText）：HTML 渲染、样式自定义
- 公告（Notice）：滚动播放、自定义样式
- 辅助线（AssistLine）：分割线、装饰元素
- 魔方选区（CubeSelection）：网格布局、自定义跳转
- 滑块（Slider）：数值选择、范围配置

**业务营销型：**
- 商品（Product）：列表/网格布局、价格展示、购买按钮
- 弹窗（Dialog）：自定义内容、触发条件
- 浮层（FloatLayer）：悬浮按钮、快捷入口
- 在线客服（OnlineService）：客服接入、咨询入口
- 优惠券（Coupon）：券面展示、领取入口
- 图片（Image）：单图/多图展示

**物料特性：**
- 动态加载：按需加载，减少包体积
- 别名映射：兼容历史数据
- 配置驱动：Schema 自动生成配置面板
- 运行时转换：编辑态与运行态属性转换

#### 3. 三大引擎系统

##### 🔗 组件联动引擎（LinkageEngine）
**功能：** 实现组件间数据流管理和联动效果，支持可视化配置零代码使用。

**核心能力：**
- 数据流转：一个组件的属性变化触发另一个组件更新
- 转换函数：内置 9 种预设（乘系数、加数值、转大小写、限制范围、值域映射、格式化货币、取反），支持自定义函数
- 条件触发：可视化条件构建器（VisualConditionBuilder），支持 > < >= <= === !== 包含/为空/不为空 9 种运算符，支持 AND/OR 复合条件嵌套（3 层深度），高级表达式模式作为兜底
- 联动调试面板：实时追踪联动触发链路，记录事件历史和触发结果，便于调试
- 事件订阅：支持监听联动事件，实现自定义逻辑

**应用场景：**
- 价格联动：商品价格变化自动更新总价
- 状态同步：一个组件的显示/隐藏影响其他组件
- 数据转换：源数据经过转换后传递给目标组件

**代码示例：**
```typescript
// 注册联动关系
linkageEngine.registerLinkage({
  id: 'price-linkage',
  sourceComponentId: 'product-1',
  targetComponentId: 'total-price',
  sourceProperty: 'price',
  targetProperty: 'value',
  transformFn: (value) => value * 1.1, // 加价 10%
  condition: { type: 'simple', expression: 'value > 100' }
})

// 触发联动
linkageEngine.triggerLinkage('product-1', 'price', 150)
```

##### 🎭 条件渲染引擎（ConditionEngine）
**功能：** 基于条件控制组件的显示/隐藏和启用/禁用。

**核心能力：**
- 简单条件：支持 equals、greaterThan、lessThan、in、isTruthy、isEmpty 等
- 复合条件：支持 AND/OR 逻辑运算符，支持嵌套表达式
- 条件缓存：避免重复计算，提升性能
- 动作类型：show/hide（显示/隐藏）、enable/disable（启用/禁用）、custom（自定义）
- 规则管理：支持启用/禁用规则、按动作类型查询

**应用场景：**
- 权限控制：根据用户权限显示/隐藏组件
- 表单联动：根据选项显示/隐藏相关字段
- 动态布局：根据条件调整页面布局

**代码示例：**
```typescript
// 注册条件规则
conditionEngine.registerRule({
  id: 'vip-rule',
  componentId: 'discount-banner',
  condition: {
    type: 'complex',
    operator: 'AND',
    conditions: [
      { type: 'simple', expression: 'userLevel === "VIP"' },
      { type: 'simple', expression: 'orderAmount > 1000' }
    ]
  },
  action: 'show'
})

// 评估规则
const shouldShow = conditionEngine.evaluateRule('vip-rule', {
  userLevel: 'VIP',
  orderAmount: 1500
})
```

##### 📊 数据绑定引擎（DataBindingEngine）
**功能：** 管理数据源和组件数据绑定关系。

**核心能力：**
- 多种数据源：API（动态数据）、Static（静态数据）、Computed（计算数据）
- 数据缓存：支持缓存和过期时间配置
- 定时刷新：支持自动刷新数据
- 数据转换：支持数据转换函数
- 错误处理：支持自定义错误处理
- 事件订阅：监听数据变化

**应用场景：**
- API 数据：商品列表、用户信息等动态数据
- 静态数据：配置项、枚举值等固定数据
- 计算数据：基于其他数据源计算得出的数据

**代码示例：**
```typescript
// 注册 API 数据源
dataBindingEngine.registerDataSource({
  id: 'product-list',
  name: '商品列表',
  type: 'api',
  url: 'https://api.example.com/products',
  method: 'GET',
  cacheEnabled: true,
  cacheDuration: 5000,
  refreshInterval: 30000
})

// 注册数据绑定
dataBindingEngine.registerBinding({
  id: 'product-binding',
  componentId: 'product-component',
  dataSourceId: 'product-list',
  targetProperty: 'list',
  enabled: true
})

// 应用数据绑定
await dataBindingEngine.applyDataBinding('product-binding')
```

**引擎系统价值：**
- 降低复杂度：将复杂业务逻辑抽象为可配置的引擎
- 零代码配置：联动条件和转换函数完全可视化，消除代码表达式输入
- 增强可维护性：统一管理，联动调试面板辅助排错
- 支持扩展：易于添加新的转换函数、条件类型、数据源类型

#### 4. 发布流程与版本管理

##### 草稿/发布双轨
- **保存草稿**：编辑过程自动保存，防止数据丢失
- **本地恢复**：意外关闭后可恢复未保存内容
- **发布前校验**：自动检查页面标题、空页面、必填项
- **状态解耦**：内容状态（draft/published）与运营状态（online/offline）分离

##### 审计日志
- **版本记录**：每次发布生成版本号、操作人、时间、备注
- **Schema 快照**：完整保存页面配置
- **历史查看**：支持查看完整发布历史

##### 一键回滚
- **快速恢复**：回滚到任意历史版本
- **安全机制**：回滚后进入草稿态，需再次发布
- **状态保护**：不自动改变上线/下线状态

#### 5. 性能优化

##### 虚拟滚动（VirtualScroll）
- **场景**：处理 100+ 组件的大型页面
- **原理**：只渲染可视区域组件，非可视区域用占位符
- **效果**：渲染时间从 300ms 降至 100ms（67% 提升）

##### 编辑器优化
- **防抖/节流**：文本输入、配置修改使用防抖（300ms）
- **RAF 节流**：拖拽、滚动使用 requestAnimationFrame
- **组件缓存**：LRU 缓存机制，最多缓存 100 个组件
- **批量更新**：合并多次状态更新，减少渲染次数

##### 性能监控
- **Core Web Vitals**：LCP、FID、CLS、TTFB
- **自定义指标**：组件渲染时间、拖拽响应时间
- **性能报告**：实时追踪性能数据

**优化效果：**
- 100 组件渲染：300ms → 100ms（67% ↑）
- 1000 组件渲染：超时 → 500ms（✅ 可用）
- 拖拽响应：100ms → 30ms（70% ↑）
- 草稿保存：100 次/秒 → 3 次/秒（97% ↓）
- 内存占用：200MB → 50MB（75% ↓）

#### 6. iframe 安全通信

- **来源验证**：postMessage 通信中严格校验 message 来源域名
- **消息安全**：结构化消息格式校验，防止恶意注入
- **沙箱隔离**：预览 iframe 使用 sandbox 属性限制能力
- **安全审计**：完整的消息安全单元测试覆盖

---

## 🛠️ 技术栈

### 前端
- **框架**：Vue 3.5 + TypeScript 5.x + Composition API
- **构建工具**：Vite 6.x + TurboRepo
- **状态管理**：Pinia
- **路由管理**：Vue Router 4.x
- **B 端 UI**：Element Plus + Tailwind CSS
- **C 端 UI**：Vant + 原生组件
- **图标库**：@element-plus/icons-vue
- **拖拽库**：vue-draggable-plus（基于 Sortable.js）
- **预览隔离**：iframe + postMessage

### 后端
- **框架**：NestJS 10.x
- **ORM**：TypeORM 0.3.x
- **数据库**：PostgreSQL
- **认证**：Passport + JWT + bcrypt
- **文件上传**：Multer
- **校验**：class-validator + class-transformer

### 工程化
- **包管理**：pnpm workspace
- **Monorepo**：TurboRepo
- **代码规范**：ESLint + Prettier + EditorConfig
- **Git 规范**：Husky + lint-staged + Commitlint + Commitizen
- **单元测试**：Vitest（单元测试 + 组件测试）
- **E2E 测试**：Playwright
- **安全扫描**：gitleaks + semgrep + npm audit

---

## 📦 项目结构

```
cms-vue3/
├── apps/
│   ├── frontend/
│   │   ├── cms/                        # 编辑器应用（B 端）
│   │   │   ├── src/
│   │   │   │   ├── views/
│   │   │   │   │   ├── Decorate/       # 装修页（编辑器主页面）
│   │   │   │   │   │   ├── components/
│   │   │   │   │   │   │   ├── TopHeader.vue        # 顶部操作栏
│   │   │   │   │   │   │   ├── LeftMaterial.vue     # 左侧物料区
│   │   │   │   │   │   │   ├── CenterCanvas.vue     # 中间画布区
│   │   │   │   │   │   │   ├── RightConfig.vue      # 右侧配置区
│   │   │   │   │   │   │   ├── LinkageConfig.vue    # 联动配置
│   │   │   │   │   │   │   ├── LinkageRuleDialog.vue # 联动规则对话框
│   │   │   │   │   │   │   ├── LinkageRuleItem.vue  # 联动规则卡片
│   │   │   │   │   │   │   └── LinkageDebugPanel.vue # 联动调试面板
│   │   │   │   │   │   └── index.vue
│   │   │   │   │   ├── Activity.vue    # 活动管理页
│   │   │   │   │   └── Preview.vue     # 预览页
│   │   │   │   ├── store/
│   │   │   │   │   └── usePageStore.ts # 页面状态管理
│   │   │   │   ├── components/
│   │   │   │   │   ├── basic/
│   │   │   │   │   │   └── VisualConditionBuilder.vue # 可视化条件构建器
│   │   │   │   │   ├── PreviewIframe.vue
│   │   │   │   │   └── VirtualScroll.vue
│   │   │   │   ├── utils/
│   │   │   │   │   ├── linkage-engine.ts       # 组件联动引擎
│   │   │   │   │   ├── condition-engine.ts     # 条件渲染引擎
│   │   │   │   │   ├── data-binding-engine.ts  # 数据绑定引擎
│   │   │   │   │   ├── condition-serializer.ts # 条件序列化（可视化 ↔ 存储格式）
│   │   │   │   │   ├── performance-monitor.ts  # 性能监控
│   │   │   │   │   ├── editor-optimization.ts  # 编辑器优化
│   │   │   │   │   ├── page-draft.ts           # 草稿自动保存
│   │   │   │   │   └── page-preflight.ts       # 发布前校验
│   │   │   │   ├── api/                # API 接口
│   │   │   │   └── tests/              # 测试文件
│   │   │   └── package.json
│   │   └── crs/                        # 渲染器应用（C 端）
│   │       ├── src/
│   │       │   ├── views/
│   │       │   │   └── PagePreview.vue # 页面渲染
│   │       │   ├── components/
│   │       │   │   ├── SchemaRenderer.vue
│   │       │   │   └── RenderNode.vue
│   │       │   ├── store/
│   │       │   │   └── usePageStore.ts # 页面状态（消费态）
│   │       │   └── utils/
│   │       │       └── linkage-engine.ts # 预览端联动引擎
│   │       └── package.json
│   └── backend/                        # NestJS 后端服务
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/               # 用户认证模块
│       │   │   ├── page/               # 页面管理模块
│       │   │   └── upload/             # 文件上传模块
│       │   ├── database/               # 数据源配置 & 迁移
│       │   └── common/                 # 公共守卫/拦截器/装饰器
│       └── package.json
├── packages/
│   ├── types/                          # 类型定义
│   │   └── src/
│   │       └── schema.ts               # Schema V2 协议
│   ├── ui/                             # UI 物料库
│   │   └── src/
│   │       ├── components/             # 14+ 业务组件
│   │       ├── materials/              # 物料注册表
│   │       └── renderer/               # 渲染器
│   ├── utils/                          # 共享工具函数
│   │   └── src/
│   │       ├── date.ts                 # 日期工具
│   │       ├── expression.ts           # 表达式工具
│   │       ├── message-security.ts     # iframe 消息安全
│   │       ├── schema-adapter.ts       # Schema 适配
│   │       └── request.ts              # HTTP 请求
│   ├── hooks/                          # 通用 Hooks
│   ├── eslint-config/                  # ESLint 配置
│   ├── prettier-config/                # Prettier 配置
│   └── test-utils/                     # 测试工具
├── docs/                               # 文档
│   ├── ARCHITECTURE.md                 # 架构设计
│   ├── PERFORMANCE.md                  # 性能优化
│   ├── CASE-STUDIES.md                 # 优化案例
│   ├── DEVELOPMENT.md                  # 开发指南
│   ├── API.md                          # API 文档
│   └── BUILD-OPTIMIZATION.md           # 构建优化
├── scripts/                            # 辅助脚本
├── pnpm-workspace.yaml                 # pnpm workspace 配置
└── turbo.json                          # TurboRepo 配置
```

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18.x
- pnpm >= 9.x
- PostgreSQL >= 14.x（后端需要）

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
# 启动编辑器（默认端口 5173）
pnpm dev:cms

# 启动渲染器（默认端口 5174）
pnpm dev:crs

# 启动后端服务（默认端口 3000）
pnpm dev:backend

# 同时启动所有应用
pnpm dev
```

### 构建生产版本
```bash
# 构建所有应用
pnpm build

# 构建指定应用
pnpm --filter @cms/cms build
pnpm --filter @cms/crs build
pnpm --filter @cms/backend build
```

### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm --filter @cms/cms test

# 生成覆盖率报告
pnpm test:coverage

# 运行 E2E 测试
pnpm --filter @cms/cms test:e2e

# E2E 测试 UI 模式
pnpm --filter @cms/cms test:e2e:ui
```

### 代码质量检查
```bash
# Lint 检查
pnpm lint

# 类型检查
pnpm typecheck

# 格式化代码
pnpm format

# 完整 CI 检查 (lint + typecheck + test + build)
pnpm ci:all
```

---

## 📖 文档

- [架构设计文档](./docs/ARCHITECTURE.md) - 详细的架构设计和技术选型
- [性能优化指南](./docs/PERFORMANCE.md) - 性能优化策略和最佳实践
- [开发指南](./docs/DEVELOPMENT.md) - 本地开发、调试、贡献指南
- [API 文档](./docs/API.md) - 核心模块的 API 说明
- [优化案例](./docs/CASE-STUDIES.md) - 详细的优化案例
- [构建优化](./docs/BUILD-OPTIMIZATION.md) - 构建流程优化方案

---

## 🧪 测试覆盖

### 当前状态
- **总覆盖率**：35%+
- **测试文件**：30 个
- **单元/组件测试**：Vitest（20+ 测试文件）
- **E2E 测试**：Playwright（6 个 spec 文件）

### 核心模块覆盖
- **usePageStore**：100% 语句覆盖率
- **联动引擎**：完整的联动单元测试
- **条件序列化**：37 个测试用例覆盖所有运算符和边界
- **可视化条件构建器**：组件渲染和交互测试
- **消息安全**：iframe 通信安全完整测试
- **复杂业务场景**：LinkageEngine、ConditionEngine、DataBindingEngine 集成测试

### 测试类型
- **单元测试**：Vitest — 工具函数、引擎逻辑
- **组件测试**：Vitest + Vue Test Utils — UI 组件渲染、事件、props
- **集成测试**：业务流程端到端测试
- **性能测试**：性能基准测试
- **E2E 测试**：Playwright — 完整用户操作链路

---

## 🎯 核心设计理念

### 1. Schema 驱动
- **协议优先**：Schema V2 作为编辑器和渲染器的中间协议
- **扁平结构**：componentMap + rootIds，适合高频编辑操作
- **版本管理**：支持 Schema 迁移和历史兼容

### 2. 单一写源
- **CMS 写源**：所有编辑动作统一由 CMS 处理
- **CRS 消费**：渲染器只读取和渲染，不承担编辑逻辑
- **状态一致**：避免双端状态撕裂

### 3. 共享物料注册表
- **单入口声明**：type、默认配置、运行组件、编辑配置统一声明
- **双端消费**：CMS 和 CRS 只消费注册表，不维护私有映射
- **降低成本**：新增物料只需修改共享层

### 4. 预览隔离
- **iframe 隔离**：避免后台样式污染移动端
- **postMessage 安全通信**：来源校验 + 结构化消息验证
- **所见即所得**：预览结果接近真实交付

---

## 🏆 项目亮点（面试版）

### 架构设计
1. **Schema V2 协议**：componentMap + rootIds 扁平结构，支持高频编辑、历史回退、运行时解析
2. **全栈 Monorepo**：编辑器 + 渲染器 + NestJS 后端，共享类型协议，统一构建
3. **共享物料注册表**：单入口声明，双端消费，新增物料改动收敛到共享层
4. **预览隔离机制**：iframe + postMessage 安全通信，来源校验防注入

### 性能优化
1. **虚拟滚动**：处理 100+ 组件场景，渲染时间降低 67%
2. **防抖/节流**：优化高频操作，草稿保存频率降低 97%
3. **组件缓存**：LRU 缓存机制，减少重复渲染
4. **性能监控**：Core Web Vitals 实时追踪

### 复杂业务场景
1. **组件联动引擎**：9 种内置转换、可视化条件构建、联动调试面板、预览端集成
2. **条件渲染引擎**：支持简单/复合条件、AND/OR 逻辑、嵌套表达式
3. **数据绑定引擎**：支持 API/静态/计算数据源、缓存、定时刷新

### 工程化能力
1. **完整的工程化链路**：ESLint + Prettier + Husky + Commitlint + CI 流水线
2. **测试体系**：Vitest 单元测试 + Playwright E2E 测试 + CI/CD 集成
3. **安全扫描**：gitleaks + semgrep + npm audit
4. **发布流程**：草稿/发布双轨、审计日志、一键回滚

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范
遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 📄 License

MIT

---

## 📞 联系方式

如有问题或建议，欢迎提 Issue 或 PR。

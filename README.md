# CMS 可视化搭建平台

基于 Vue 3、TypeScript、Vite 与 Turborepo 的 Monorepo 项目，面向营销活动页搭建场景，提供可视化编辑、组件物料复用、页面配置管理、预览联调与运行时渲染能力。

当前仓库包含两个应用：

- `apps/cms`：编辑端，负责搭建、配置、预览和页面管理
- `apps/crs`：渲染端，负责页面运行时渲染与预览态消费

共享能力沉淀在 `packages/*` 中。

## 项目特点

- 可视化搭建：包含物料面板、画布编辑区、右侧配置区和预览能力
- 双端分层：编辑端与渲染端拆分，便于隔离编辑态和运行态
- Schema 驱动：围绕页面 Schema、组件配置和适配逻辑组织能力
- Monorepo 架构：应用、组件库、类型、工具函数、Hooks 与测试能力统一管理
- 工程化完善：集成 Turbo、ESLint、Prettier、TypeScript、Vitest
- 共享组件：`packages/ui` 提供编辑端与渲染端可复用组件

## 技术栈

- 前端框架：Vue 3、Vue Router、Pinia
- 开发语言：TypeScript
- 构建工具：Vite、Turborepo、pnpm workspace
- UI 能力：Element Plus、Vant、Tailwind CSS、TipTap、Vue Draggable Plus
- 工程质量：ESLint、Prettier、Husky、lint-staged
- 测试方案：Vitest、@vue/test-utils、@testing-library/vue

## 目录结构

```text
cms-vue3/
├─ apps/
│  ├─ cms/                    # CMS 编辑端应用
│  └─ crs/                    # CRS 渲染端应用
├─ packages/
│  ├─ eslint-config/          # 共享 ESLint 配置
│  ├─ hooks/                  # 通用组合式 Hooks
│  ├─ prettier-config/        # 共享 Prettier 配置
│  ├─ test-utils/             # 测试工具
│  ├─ types/                  # Schema 与类型定义
│  ├─ ui/                     # 共享 UI 与页面物料组件
│  └─ utils/                  # 工具函数、请求封装、Schema 适配
├─ docs/                      # 项目文档与阶段性记录
├─ scripts/                   # 辅助脚本
├─ turbo.json                 # Turbo 任务编排
├─ pnpm-workspace.yaml        # Workspace 配置
└─ package.json               # 根目录脚本
```

## 环境要求

- Node.js `>= 18`
- pnpm `>= 9`

推荐在中国大陆网络环境下配置稳定的 npm 镜像后再安装依赖。

## 快速开始

```bash
pnpm install
pnpm dev
```

默认会通过 Turbo 启动工作区内可运行的 `dev` 任务。

## 常用命令

### 根目录

```bash
pnpm dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm format
pnpm typecheck
pnpm test
pnpm test:coverage
```

### 单独启动应用

```bash
pnpm dev:cms
pnpm build:cms

pnpm dev:crs
pnpm build:crs
```

### 按包执行

```bash
pnpm --filter @cms/cms test
pnpm --filter @cms/utils test
pnpm --filter @cms/ui build
```

## 主要应用说明

### `apps/cms`

CMS 编辑端，包含以下核心页面与能力：

- `/decorate`：页面搭建主界面
- `/preview`：页面预览
- `/activity`：活动相关页面
- `/home`、`/login`：基础业务入口

搭建主界面主要由以下部分组成：

- `TopHeader`：顶部操作区
- `LeftMaterial`：物料面板
- `CenterCanvas`：中间画布
- `RightConfig`：右侧配置面板

### `apps/crs`

CRS 渲染端，包含以下核心能力：

- `PagePreview`：接收编辑端通过 `postMessage` 同步的 Schema 做预览渲染
- `Page`：根据页面 ID 拉取页面数据并做运行时渲染
- `SchemaRenderer`：按 `rootIds` 驱动页面节点渲染
- `RenderNode`：递归解析节点并按组件类型异步加载

## 共享包说明

### `@cms/types`

维护页面 Schema、组件类型、消息协议与通用类型定义。

### `@cms/ui`

维护共享组件与页面物料组件，例如轮播、公告、商品、图片导航、辅助线等。

### `@cms/utils`

维护通用工具、请求封装、表达式能力与 Schema 迁移适配逻辑。

### `@cms/hooks`

维护通用 Hooks，例如尺寸监听、跳转处理等。

### `@cms/test-utils`

维护测试辅助能力，服务于工具包与应用测试。

## 开发说明

### 新增物料组件

1. 在 `packages/ui/src/components/` 新增运行时物料组件
2. 在 `packages/ui/src/materials/definitions.ts` 声明对应 `MaterialDefinition`（`type`、`aliases`、`group`、`label`、`icon`、`maxCount`、`defaultProps`、`runtimeComponent`、`editorConfig`）
3. 在 `packages/types/src/materials.ts` 复用/扩展共享字段 DSL（仅在通用字段无法表达时才扩展）
4. 在 `packages/ui/src/materials/definitions.ts` 补齐 `editorConfig.schema`，默认不再新增 CMS 专用配置组件
5. 补齐测试：registry 解析、type 归一化、配置渲染与导入导出链路
6. 新增物料默认不再修改 `apps/cms` 与 `apps/crs` 的业务映射文件，双端统一消费 shared registry

### 测试与质量检查

提交前建议至少执行：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

如果只修改了某个包，优先使用 `pnpm --filter` 定位执行，减少等待时间。

## 文档

项目补充文档位于 `docs/` 目录，包含但不限于：

- 架构设计与重构记录
- Schema V2 迁移说明
- 业务与配置面板改造报告
- 环境变量与组件规范文档
- 面试回答参考文档

## 说明

- README 已按当前仓库真实结构整理
- `apps` 下包含 `cms` 与 `crs` 两个应用
- 如需补充部署说明、环境变量模板或接口联调规范，建议继续在 `docs/` 中拆分维护


## 工程化门禁基线（新增）

- CI 质量门禁：pnpm run ci:quality
- 安全扫描：pnpm run security:scan
- 一键全量门禁：pnpm run ci:all
- 阶段文档索引：docs/engineering/README.md
- Gemini Prompt 索引：docs/gemini-prompts/README.md

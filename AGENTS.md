# AGENTS.md — 仓库开发指南

本文件是 `cms-vue3` 面向 AI Agent 与开发者的落地开发规范。原则性最高约束见 [constitution.md](./constitution.md)，Claude Code 快速上手见 [CLAUDE.md](./CLAUDE.md)，面向人的项目介绍见 [README.md](./README.md)。若本文与 `constitution.md` 冲突，以 `constitution.md` 为准。

## 1. 项目概览

CMS 营销 H5 可视化低代码平台，目标不是完整企业化，而是做出「可演示、可验证、可复用」的平台闭环：低代码搭建、发布预览、版本回滚、渠道参数透传、埋点与线索收集。当前一期已补齐 AI 一句话建页、基础漏斗汇总和 AI 转化建议，动作日志维护在根目录 `plan.md`。

技术基线：

- 前端：Vue 3 + TypeScript + Vite；管理端（CMS）用 Element Plus，渲染端（CRS）用 Vant
- 后端：NestJS + TypeORM + PostgreSQL，JWT 鉴权
- 状态管理：Pinia；HTTP：axios
- 测试：前端 Vitest + jsdom、后端 Jest、E2E Playwright
- 工程：pnpm workspace + turbo；ESLint + Prettier + husky + lint-staged

## 2. 目录结构与包职责

```
cms-vue3/
├── apps/
│   ├── frontend/cms/   # @cms/cms 管理端：搭建、发布、回滚、线索查看
│   ├── frontend/crs/   # @cms/crs 渲染端：移动端页面渲染（预览/发布页）
│   └── backend/        # @cms/backend NestJS API
├── packages/
│   ├── types/          # @cms/types 类型协议：Schema / DTO / Event（zod 校验）
│   ├── ui/             # @cms/ui 共享组件 + 物料注册表（CMS/CRS 同源消费）
│   ├── utils/          # @cms/utils 请求封装、消息安全、Schema 适配
│   ├── hooks/          # @cms/hooks 共享 composables
│   ├── test-utils/     # @cms/test-utils 测试工具（直接导出 src，无需 build）
│   ├── eslint-config/  # @cms/eslint-config 共享 ESLint 配置
│   └── prettier-config/# @cms/prettier-config 共享 Prettier 配置
├── docs/               # 架构、开发、API、性能等文档
├── scripts/            # 治理检查、物料生成、Schema 校验脚本
├── constitution.md     # 最高约束
├── CLAUDE.md           # Claude Code 快速上手
└── README.md           # 项目门面
```

后端模块划分（`apps/backend/src/modules/`）：`ai`（AI 建页/诊断）、`auth`（鉴权）、`user`（用户）、`page`（页面）、`template`（模板）、`lead`（线索）、`tracking`（埋点）、`upload`（上传）。

## 3. 常用命令

### 根目录（pnpm）

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装 workspace 依赖 |
| `pnpm dev` | turbo 一键启动全部（CMS 3011 / CRS 3010 / Backend 3300） |
| `pnpm dev:cms` / `dev:crs` / `dev:backend` | 分别启动单个应用 |
| `pnpm build` / `build:cms` / `build:crs` / `build:backend` | 构建 |
| `pnpm lint` / `lint:fix` | ESLint 检查 / 自动修复 |
| `pnpm typecheck` | 全 workspace TypeScript + Vue 类型检查 |
| `pnpm test` | 运行全部测试 |
| `pnpm check:ui-governance` | UI 治理检查（Element 深覆盖白名单） |
| `pnpm gen:material` | 生成物料定义 |
| `pnpm ci:all` | CI 全量（quality + security:scan） |
| `pnpm security:scan` | 安全扫描（audit + gitleaks + semgrep） |

### 单包

```bash
pnpm --filter <pkg> test -- --run          # 跑单个包的测试（如 @cms/cms / @cms/utils）
pnpm --filter @cms/cms test:e2e            # CMS E2E
pnpm --filter @cms/cms test:e2e -- tests/e2e/smoke-core.spec.ts   # 核心冒烟
```

### 后端专属

```bash
pnpm --filter @cms/backend migration:generate  # 生成 TypeORM migration
pnpm --filter @cms/backend migration:run       # 执行 migration
pnpm --filter @cms/backend migration:revert    # 回滚 migration
pnpm --filter @cms/backend seed                # 写入种子数据（含管理员账号）
```

## 4. 编码与命名规范

（完整规则见 `constitution.md` 第 4–6 节，以下为高频要点）

- 统一 Vue 3 Composition API + `<script setup>` + TypeScript。
- 组件文件 `PascalCase`（如 `ArticleEditor.vue`）；composable 用 `useXxx`；store 用领域命名；工具模块 `camelCase`；常量 `UPPER_SNAKE_CASE`。
- 统一 2 空格缩进，遵循仓库现有 ESLint / Prettier / TS 配置，不擅自引入风格改动。
- `props`、`emits`、暴露结构必须显式声明类型。
- 能局部状态解决的不要提升为全局 store；跨页面共享才进 store。
- 异步请求统一处理加载态、空态、错误态，不散落重复请求逻辑。
- 禁止提交未使用代码、调试日志、注释掉的历史大段实现。

## 5. 测试规范

- 前端单元/组件测试：Vitest + jsdom；后端：Jest；E2E：Playwright。
- 测试文件命名：单测 `*.spec.ts` / `*.test.ts`，E2E 保留 `*.e2e.ts`。
- 改动 store / composable / utils / schema / 关键交互 / 缺陷修复时，必须补充或更新测试。
- AI 一期或活动页相关的可验证小闭环完成后，要同步更新根目录 `plan.md`，一条 Action 对应一个明确的验证结果。
- 合并前至少通过 `pnpm lint`、`pnpm typecheck`、与改动范围对应的测试（先跑最窄命令，再按需跑全量）。

## 6. 关键约定与坑

- **workspace 编译产物**：`packages/types|ui|utils|hooks` 的入口指向 `dist/`，改这些包源码后必须先 `pnpm --filter <pkg> build`（或 `dev` watch），app 侧才能生效。例外：`test-utils` 直接导出 `src/`，`eslint-config` / `prettier-config` 导出源码 `index.js`，均无需 build。
- **`@cms/ui` 构建较重**：`build` = `vue-tsc --noEmit && vite build`，不要把它当轻量类型检查用。
- **模块体系分叉**：backend 为 `commonjs`，前端与 packages 为 `module`（ESM），不要跨端假设模块语义。
- **鉴权与通信**：统一 `Authorization: Bearer <token>`；CMS→CRS 预览走 `postMessage`，来源白名单与埋点开关由 env 控制（`VITE_CRS_PREVIEW_ORIGIN` / `VITE_POSTMESSAGE_PARENT_ORIGIN` / `VITE_TRACKING_ENABLED`）。
- **中文编码历史坑**：`packages/ui/src/materials/definitions.ts` 曾出现中文编码损坏（~80 处乱码）。改动前先确认 UTF-8，避免引入新乱码。
- **UI 治理白名单**：Element 深覆盖 / 选择器受白名单约束（`scripts/check-ui-governance.mjs` 读取 `docs/` 下的 `element-deep-override-allowlist.txt` / `element-selector-allowlist.txt` / `important-override-allowlist.txt`），改深覆盖样式需同步更新白名单。
- **跨包引用**：禁止跨包引用私有内部文件，只依赖包的公开导出（`exports` 字段）。
- **断点续作**：根目录 `plan.md` 记录 AI 一期与后续接手动作。每完成一个可验证小闭环，先更新顶部状态和动作清单，再追加对应 Action 日志；若 Action 阻塞，必须写明原因、已尝试内容和需要的外部输入。
- **E2E 约定**：`pnpm --filter @cms/cms test:e2e -- tests/e2e/smoke-core.spec.ts` 是最小可独立验证的核心冒烟；完整 `pnpm --filter @cms/cms test:e2e` 可能仍暴露既有失败，先查看 `plan.md` 再决定是否治理。

## 7. Commit 与 PR 规范

- Commit message 使用 Conventional Commits：`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:` 等。
- 一个 commit 只做一类事；一个 PR 只解决一类问题，避免功能、重构、格式化混在一起。
- PR 必须包含：变更目的、影响范围、验证命令、测试结果；UI 变更附截图或录屏；破坏性变更写明迁移与回滚方案；存在例外时说明原因、失效期限与补偿计划。

## 8. 安全与配置

- 禁止提交密钥、令牌、生产 `.env` 值；环境变量变更需在 PR 说明，并标注鉴权/上传/网络副作用。
- 鉴权、权限、上传、富文本、外部请求相关改动，需在 PR 中说明风险点。
- 不引入无必要的大型依赖，新增依赖需说明收益与成本。

## 9. 文档索引

- `constitution.md` — 最高约束
- `CLAUDE.md` — Claude Code 快速上手
- `README.md` — 项目介绍与演示
- `docs/ARCHITECTURE.md` — 架构设计
- `docs/DEVELOPMENT.md` — 开发指南
- `docs/API.md` — 接口契约
- `docs/PERFORMANCE.md` / `BUILD-OPTIMIZATION.md` — 性能与构建优化

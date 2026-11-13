# AGENTS.md — 仓库开发指南

本文件是 `cms-vue3` 面向 AI Agent 与开发者的落地开发规范。最高约束见 [constitution.md](./constitution.md)，快速上手见 [CLAUDE.md](./CLAUDE.md)，项目介绍见 [README.md](./README.md)。冲突时以 `constitution.md` 为准；子目录约定只补本包差异，不豁免最高约束。

## 1. 项目概览

CMS 营销 H5 可视化低代码平台，面向单一公司内部运营团队，目标是形成可审计、可验证、可复用的平台闭环：低代码搭建、审核发布、预览回滚、渠道参数透传、埋点、线索治理与效果看板。AI 一句话建页和转化建议属于辅助能力，动作日志维护在根目录 `plan.md`。

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

| 命令                                                       | 说明                                      | 前置条件                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| `pnpm install`                                             | 安装 workspace 依赖                       | Node ≥18、pnpm 9；依赖下载源可达                         |
| `pnpm dev`                                                 | 启动三端及共享包 watch                    | 本地 PostgreSQL 可达并完成迁移；常驻进程，审计限定 30 秒 |
| `pnpm dev:cms` / `pnpm dev:crs`                            | 单独启动 CMS 3011 / CRS 3010              | 对应端口空闲；会常驻，完整业务还需后端                   |
| `pnpm dev:backend`                                         | 启动 Backend 3300                         | PostgreSQL 可达；本次 127.0.0.1:5433 拒绝连接            |
| `pnpm build`                                               | 按依赖图构建全仓                          | 安装依赖；工具会清理生成的输出目录                       |
| `pnpm build:cms` / `pnpm build:crs` / `pnpm build:backend` | 构建指定应用                              | 共享包 dist 为当前版本；不代替类型检查或测试             |
| `pnpm typecheck`                                           | 全 workspace 类型检查                     | 安装依赖；Turbo 会先构建上游依赖                         |
| `pnpm lint` / `pnpm check:ui-governance`                   | ESLint / UI 治理                          | 安装依赖；lint 只读；自动修复使用 pnpm lint:fix          |
| `pnpm ci:quality`                                          | format:check、lint、typecheck、单测、构建 | 安装依赖；Vitest 与 Jest 分开传参                        |
| `pnpm test:coverage`                                       | 四包覆盖率与阈值                          | coverage-v8 与 Vitest 固定同为 3.0.2；阈值为实测减 2     |

实跑退出码、耗时和完整输出见 [阶段 0 报告](./reports/stage0-commands.md)，失败历史与修复复验分开记录。根测试会进入 watch，不用于无人值守验收。物料生成必须提供 `--name`、`--group`、`--maxCount`、`--withRuntimeProps`，不凭空补业务参数。安全审计报存量漏洞，安全聚合及 live E2E 不在本次通过范围。

### 单包

```bash
pnpm --filter @cms/cms test -- --run       # CMS 单测，单次运行；不能据此外推 Jest 参数
pnpm --filter @cms/backend exec jest --runInBand # 后端 Jest，单次运行
pnpm --filter @cms/cms test:e2e            # CMS mock E2E（仅 CMS + API mock）
pnpm --filter @cms/cms test:e2e -- tests/e2e/smoke-core.spec.ts   # 核心 5 条闭环冒烟
pnpm --filter @cms/cms test:e2e:live       # 需独立 PostgreSQL 测试库；本次仅探测，原命令未跑
```

mock E2E 需 headless Chrome、3011/3010 空闲；可设置 `PLAYWRIGHT_HTML_OPEN=never` 禁止报告自动打开浏览器。数据库迁移与 live 的破坏性准备步骤见对应应用约定，不能因命令有实跑记录就省略目标环境授权。

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
- 测试文件命名：单测与 E2E 统一使用 `*.spec.ts` / `*.test.ts`；真实链路 E2E 位于 `apps/frontend/cms/tests/e2e-live/`。
- 改动 store / composable / utils / schema / 关键交互 / 缺陷修复时，必须补充或更新测试。
- AI 一期或活动页相关的可验证小闭环完成后，要同步更新根目录 `plan.md`，一条 Action 对应一个明确的验证结果。
- 合并前至少通过 `pnpm lint`、`pnpm typecheck`、与改动范围对应的测试（先跑最窄命令，再按需跑全量）。

## 6. 关键约定与坑

- **workspace 编译产物**：`types|utils|hooks|ui` 的公开入口指向 `dist/`，改动后按依赖顺序运行 `pnpm --filter @cms/types build`、`pnpm --filter @cms/utils build`、`pnpm --filter @cms/hooks build`、`pnpm --filter @cms/ui build`。部分 app/test 配置有源码 alias，不能据此跳过发布产物构建。`test-utils` / `eslint-config` / `prettier-config` 导出源码，无需 build。
- **`@cms/ui` 构建较重**：`build` = `vue-tsc --noEmit && vite build`，不要把它当轻量类型检查用。
- **鉴权与通信**：统一 `Authorization: Bearer <token>`；CMS→CRS 的 postMessage 握手和来源配置见应用分片，埋点开关由 `VITE_TRACKING_ENABLED` 控制。
- **中文编码历史坑**：`packages/ui/src/materials/definitions.ts` 曾出现中文编码损坏（~80 处乱码）。改动前先确认 UTF-8，避免引入新乱码。
- **UI 治理白名单**：`scripts/check-ui-governance.mjs` 读取 `docs/` 下三份 `*-allowlist.txt`。优先用令牌和组件 API；只有无法替代的覆盖才说明原因并评审白名单例外，不能为过检查直接放宽。
- **跨包引用**：禁止跨包引用私有内部文件，只依赖包的公开导出（`exports` 字段）。
- **断点续作**：根目录 `plan.md` 记录 AI 一期与后续接手动作。每完成一个可验证小闭环，先更新顶部状态和动作清单，再追加对应 Action 日志；若 Action 阻塞，必须写明原因、已尝试内容和需要的外部输入。
- **生产补全交接**：内部运营工具生产补全使用 Action 19-24。每个 Action 必须记录 Status、Goal、Scope、Changes、Verification、Decisions、Risks、Open Questions、Next、Handoff；接手时先读 `plan.md` 顶部状态和最后一个未完成 Action。
- **E2E 约定**：核心冒烟使用上表 smoke-core；mock 与 live 分开验收，不写固定通过数量。live 的构建、端口与独立测试库约束见 CMS 分片；部署与恢复按需读 `docs/OPERATIONS.md`。

## 7. Commit 与 PR 规范

- Commit message 使用 Conventional Commits：`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:` 等。
- 一个 commit 只做一类事；一个 PR 只解决一类问题，避免功能、重构、格式化混在一起。
- PR 必须包含：变更目的、影响范围、验证命令、测试结果；UI 变更附截图或录屏；破坏性变更写明迁移与回滚方案；存在例外时说明原因、失效期限与补偿计划。

## 8. 不许做的事（含安全配置）

| 不许                                                         | 兜底手段                                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 提交 debugger、var 或未使用变量                              | `packages/eslint-config/index.js` 的 `no-debugger` / `no-var`，`vue-typescript.js` 的 `@typescript-eslint/no-unused-vars`                         |
| 未获例外批准就增加 Element 深覆盖、选择器、!important        | `scripts/check-ui-governance.mjs`；`.husky/pre-commit` 接入既有 lint-staged 配置调用它                                                            |
| 提交密钥、令牌、生产配置或敏感数据                           | review；虽有 `.gitleaks.toml`，安全聚合命令在 audit 阶段失败，不能算生效兜底                                                                      |
| 在新增行中吞错、聚焦/跳过测试、裸禁用 ESLint；降低覆盖率阈值 | 前四类由 `scripts/agent/check-skips.mjs` + pre-commit + `agent-guards.yml` 拦；阈值下调和存量例外仍需 review                                      |
| 未经批准新增依赖或不说明收益、成本和替代                     | `scripts/agent/check-deps.mjs` + pre-commit + `agent-guards.yml`，扫根及全部 workspace 四类依赖；CI 需 `deps-approved` label；版本变更仍需 review |
| 跨包依赖私有文件、改 `.gitignore`、提交本地状态和运行产物    | review                                                                                                                                            |

review 表示机器不会替你发现。鉴权、权限、上传、富文本、外部请求和环境变量改动，必须在 PR 说明风险与网络副作用。

## 9. 文档索引

- 应用差异：[Backend](./apps/backend/AGENTS.md)、[CMS](./apps/frontend/cms/AGENTS.md)、[CRS](./apps/frontend/crs/AGENTS.md)
- `constitution.md` — 最高约束
- `CLAUDE.md` — Claude Code 快速上手
- `README.md` — 项目介绍与演示
- `plan.md` — 生产补全动作清单与交接日志（断点续作入口）
- `docs/ARCHITECTURE.md` — 架构设计
- `docs/DEVELOPMENT.md` — 开发指南
- `docs/API.md` — 接口契约
- `docs/OPERATIONS.md` — 生产运维手册（上线检查 / 存储 / 备份恢复 / 回滚）
- `docs/E2E-FINDINGS.md` — 真实链路 E2E 的发现与修复记录
- `docs/ACCEPTANCE_CHECKLIST_ZH.md` — 验收清单
- `docs/PERFORMANCE.md` / `BUILD-OPTIMIZATION.md` — 性能与构建优化

## 10. 什么算做完

- `pnpm lint`、`pnpm typecheck`、改动范围对应的单测全部退出 0；交互变化补相关 E2E。某项失败不能用其他检查成功抵消。
- 新行为按需求补测试，修 bug 有原问题的回归用例；不以 skip、only、吞错或改检查配置换绿灯。
- 交付写明改了什么、原因、实跑命令、退出码、结果与未覆盖风险；报告应该没问题不算做完。未跑就写未跑，卡住就写卡在哪。
- `constitution.md` 要求人工审查；自动检查不能替代人工审查，也不能因本次基线失败放宽合并标准。

## 11. 什么时候停下来问

- 业务规则有影响正确性的歧义；公共 Schema / DTO / 导出接口、鉴权权限、支付金额或架构边界要变。
- 删除或覆盖业务数据、执行 migration/revert、重建测试库、生产操作、修改 constitution.md、安装新依赖或改已有依赖版本；同一会话明确授权的范围不重复问。
- 同一个检查两次仍失败先定位原因；用户已授权本次继续修复可解决的失败，涉及上一条边界仍先问。外部服务拿不到时保留命令与输出，标明未跑范围，不绕过、不降低验收。

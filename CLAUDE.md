# CLAUDE.md

本文件给 Claude Code 提供本仓库的快速上手上下文。完整规范见 [AGENTS.md](./AGENTS.md)，最高约束见 [constitution.md](./constitution.md)，面向人的介绍见 [README.md](./README.md)。

## 项目定位

CMS 营销 H5 可视化低代码平台（个人项目，目标是「可演示、可验证、可复用」的平台闭环）。pnpm workspace monorepo：

- 前端：Vue 3 + TypeScript + Vite（CMS 用 Element Plus，CRS 用 Vant）
- 后端：NestJS + TypeORM + PostgreSQL（JWT 鉴权）
- 状态：Pinia；测试：前端 Vitest、后端 Jest、E2E Playwright
- AI 一期：活动页支持「AI 新建」电商促销/线索收集草稿页，后端支持 OpenAI-compatible provider 与 mock fallback，并提供基础漏斗汇总和 AI 优化建议。

## 常用命令（根目录，pnpm）

```bash
pnpm install                                        # 安装依赖
pnpm dev:cms / dev:crs / dev:backend                # 分别启动 CMS(3011) / CRS(3010) / Backend(3300)
pnpm dev                                            # turbo 一键启动全部
pnpm build / build:cms / build:crs / build:backend  # 构建
pnpm lint / typecheck / test                        # lint / 类型检查 / 测试
pnpm --filter <pkg> test -- --run                   # 单包跑测试
pnpm check:ui-governance                            # UI 治理检查（Element 深覆盖白名单）
pnpm ci:all                                         # CI 全量：quality + security:scan

# backend 专属
pnpm --filter @cms/backend migration:run            # 跑 TypeORM migration
pnpm --filter @cms/backend seed                     # 写入种子数据（含管理员账号）
```

默认访问地址：CMS `http://127.0.0.1:3011/cms-manage/login`，CRS `http://127.0.0.1:3010/crs/#/pagePreview?id=1`，Backend `http://127.0.0.1:3300`。

## 断点续作

- 根目录 `plan.md` 是当前 AI 一期和后续接手的事实来源，记录目标、已确认决策、Action 日志、验证命令和下一步。
- 一个 Action = 一个可验证小闭环。开始前更新顶部状态，完成或阻塞后追加 Action 日志。
- 如果只做排查或文档更新，也要在 `plan.md` 写明验证结果或阻塞原因，方便后续 Agent/Claude 接续。

## 目录速览

- `apps/frontend/cms` — 管理端（搭建、发布、回滚、线索查看），`@cms/cms`
- `apps/frontend/crs` — 渲染端（移动端页面渲染），`@cms/crs`
- `apps/backend` — NestJS API（modules: ai/auth/lead/page/template/tracking/upload/user），`@cms/backend`
- `packages/types` — 类型协议（Schema / DTO / Event，zod）
- `packages/ui` — 共享组件与物料注册
- `packages/utils` — 请求、消息安全、Schema 适配
- `packages/hooks` — 共享 composables
- `packages/test-utils` / `eslint-config` / `prettier-config` — 工程支撑包

## 关键约定与坑

- **workspace 编译产物**：`packages/types|ui|utils|hooks` 的 `main` 指向 `dist/`，修改这些包源码后需先 `pnpm --filter <pkg> build`（或 `dev` 进入 watch），依赖方 app 才能拿到新代码。例外：`test-utils` 直接导出 `src/`，`eslint-config` / `prettier-config` 导出 `index.js`，均无需 build。
- **`@cms/ui` 构建慢**：它的 `build` 是 `vue-tsc --noEmit && vite build`，比普通 `tsc` 慢，别把它当轻量类型检查。
- **模块体系分叉**：backend 是 `type: commonjs`，前端与 packages 是 `type: module`（ESM）。写代码时不要跨端假设 import/require 语义。
- **鉴权与通信**：统一 `Authorization: Bearer <token>`；CMS→CRS 预览通过 `postMessage`，来源白名单由 env 控制（`VITE_CRS_PREVIEW_ORIGIN` / `VITE_POSTMESSAGE_PARENT_ORIGIN` / `VITE_TRACKING_ENABLED`）。
- **中文编码历史坑**：`packages/ui/src/materials/definitions.ts` 曾出现中文编码损坏（~80 处乱码）。改动该文件前先确认文件是 UTF-8，避免引入新乱码。
- **环境变量**：各 app 有 `.env.example`（backend / cms / crs）。backend 需本地 PostgreSQL，启动前跑 `migration:run` + `seed` 生成管理员账号。
- **后端启动坑**：若 `pnpm --filter @cms/backend dev` 报找不到 `dist/main`，先运行 `pnpm --filter @cms/backend build`，再按当前产物入口 `apps/backend/dist/apps/backend/src/main.js` 复核真实启动；不要把这个误判为数据库或 AI 模块问题。
- **E2E 现状**：核心冒烟 `pnpm --filter @cms/cms test:e2e -- tests/e2e/smoke-core.spec.ts` 已可跑通；完整 Playwright 套件仍有既有 fixture/page object 失败，详情看 `plan.md`。
- **治理检查**：Element 深覆盖/选择器有白名单约束（`scripts/check-ui-governance.mjs` 读取 `docs/` 下的 `element-deep-override-allowlist.txt` / `element-selector-allowlist.txt` / `important-override-allowlist.txt`），改动 Element 深覆盖样式时需同步更新白名单，否则 `check:ui-governance` 会失败。

## 规范入口

- 最高约束与原则：`constitution.md`
- 完整落地开发规范：`AGENTS.md`
- 架构：`docs/ARCHITECTURE.md` · 开发：`docs/DEVELOPMENT.md` · API：`docs/API.md` · 性能：`docs/PERFORMANCE.md`

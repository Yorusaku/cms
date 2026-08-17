# CMS 营销 H5 可视化低代码平台

> 面向营销活动场景的 H5 低代码搭建平台。支持页面搭建、发布预览、版本回滚、渠道参数透传、埋点、线索收集，以及 AI 一句话建页与转化优化建议。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-green)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red)](https://nestjs.com/)

## 项目定位

这是一个个人项目，目标不是完整企业化，而是做出“可演示、可验证、可复用”的平台闭环：

- 运营可独立完成页面搭建与发布
- 发布链路支持回滚恢复
- 具备最小营销能力（渠道参数、埋点、线索收集）
- 具备 AI 辅助建页与转化诊断能力
- 有自动化测试保障关键链路

## 核心能力

### 1. 低代码搭建闭环

- 登录后进入活动页管理
- 模板建页 / 空白建页
- 可视化装修（组件列表、画布、配置面板）
- 保存草稿、发布、预览
- 发布记录与版本回滚

### 2. 营销最小能力

- 渠道参数识别：`utm_*` + `channel_*` / `ch_*` / `src_*` / `campaign_*` / `ad_*`
- 轻量埋点事件：`page_view`、`component_click`、`cta_click`、`form_submit`
- 线索收集闭环：`LeadForm` 组件 + 后端提交接口 + CMS 列表查询

### 3. AI 一期能力

- CMS 活动页支持「AI 新建」：输入活动目标、优惠信息、商品卖点等，生成电商促销 + 线索收集草稿页
- 后端支持 OpenAI-compatible provider，通过 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 等 env 配置；未配置或失败时使用 mock fallback
- 基础漏斗汇总：按页面/渠道统计 PV、CTA 点击、表单提交、线索数和转化率
- AI 优化建议：结合页面 Schema 与漏斗数据，输出标题、CTA、表单、商品区、埋点等优化建议
- AI 结果只保存为草稿，用户人工检查后再发布

### 4. 安全与一致性

- 鉴权统一使用：`Authorization: Bearer <token>`
- CMS -> CRS 预览通信使用 `postMessage` 白名单来源校验
- 预览源、父窗口源与埋点开关均使用 env 配置

## 技术架构

### Monorepo 结构

- `apps/frontend/cms`：管理端（搭建、发布、回滚、线索查看）
- `apps/frontend/crs`：渲染端（移动端页面渲染）
- `apps/backend`：NestJS 后端 API（`ai` / `auth` / `user` / `page` / `template` / `lead` / `tracking` / `upload`）
- `packages/types`：类型协议（Schema / DTO / Event，zod 校验）
- `packages/ui`：共享组件与物料注册
- `packages/utils`：请求、消息安全、Schema 适配等工具
- `packages/hooks`：共享 composables
- `packages/test-utils`：测试工具
- `packages/eslint-config` / `packages/prettier-config`：共享代码风格配置

### 关键设计

- Schema 驱动页面（`componentMap + rootIds`）
- 共享物料注册表（CMS/CRS 同源消费）
- iframe 预览隔离与安全通信

## 本地开发

### 环境要求

- Node.js `>= 18`
- pnpm `>= 9`
- PostgreSQL `>= 14`

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
# backend
cp apps/backend/.env.example apps/backend/.env

# cms
cp apps/frontend/cms/.env.example apps/frontend/cms/.env

# crs
cp apps/frontend/crs/.env.example apps/frontend/crs/.env
```

建议重点检查以下变量：

- `VITE_CRS_PREVIEW_ORIGIN`（默认 `http://127.0.0.1:3010`）
- `VITE_POSTMESSAGE_PARENT_ORIGIN`（默认 `http://127.0.0.1:3011`）
- `VITE_TRACKING_ENABLED`（默认 `true`）

### 启动服务

```bash
# CMS（3011）
pnpm dev:cms

# CRS（3010）
pnpm dev:crs

# Backend（3300）
pnpm dev:backend

# 或者一键启动（turbo）
pnpm dev
```

### 默认访问地址

- CMS：`http://127.0.0.1:3011/cms-manage/login`
- CRS：`http://127.0.0.1:3010/crs/#/pagePreview?id=1`
- Backend：`http://127.0.0.1:3300`

## 测试与质量检查

### 单测/集成

前端与 packages 使用 Vitest，后端使用 Jest。

```bash
# CMS
pnpm --filter @cms/cms test -- --run

# CMS AI 交互组件测试
pnpm --filter @cms/cms test -- --run src/tests/Activity.ai.test.ts

# Utils
pnpm --filter @cms/utils test -- --run

# UI
pnpm --filter @cms/ui test -- --run

# Backend（Jest）
pnpm --filter @cms/backend test
```

### E2E（Playwright）

```bash
# 全量 e2e
pnpm --filter @cms/cms test:e2e

# 核心 5 条闭环冒烟
pnpm --filter @cms/cms test:e2e -- tests/e2e/smoke-core.spec.ts
```

### 类型与治理检查

```bash
pnpm --filter @cms/cms typecheck
pnpm --filter @cms/crs typecheck
pnpm --filter @cms/backend typecheck
pnpm check:ui-governance
```

### 最近一次验证基线（2026-08-18）

- `pnpm --filter @cms/backend build`：通过
- `pnpm --filter @cms/backend test -- --runInBand`：通过，3 个测试文件 / 5 条测试
- `pnpm --filter @cms/cms test -- --run src/tests/api.test.ts src/tests/Activity.ai.test.ts`：通过，2 个测试文件 / 16 条测试
- `pnpm --filter @cms/cms test:e2e -- tests/e2e/smoke-core.spec.ts`：通过，5 条核心冒烟
- 完整 `pnpm --filter @cms/cms test:e2e` 当前仍有既有 E2E fixture/page object 失败，详情见 `plan.md`

## 演示与文档

- 演示脚本：[docs/DEMO_SCRIPT_ZH.md](./docs/DEMO_SCRIPT_ZH.md)
- 验收清单：[docs/ACCEPTANCE_CHECKLIST_ZH.md](./docs/ACCEPTANCE_CHECKLIST_ZH.md)
- 简历证据映射：[docs/RESUME_EVIDENCE_ZH.md](./docs/RESUME_EVIDENCE_ZH.md)
- AI 一期断点续作：[plan.md](./plan.md)
- AI 检索图谱：[docs/PROJECT_AI_GRAPH.md](./docs/PROJECT_AI_GRAPH.md)
- AI 检索索引：[docs/PROJECT_AI_INDEX.json](./docs/PROJECT_AI_INDEX.json)

## 常用脚本

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm ci:all
```

## License

MIT

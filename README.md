# CMS 营销 H5 可视化低代码平台

> 面向营销活动场景的 H5 低代码搭建平台。支持页面搭建、发布预览、版本回滚、渠道参数透传、埋点、线索收集，以及 AI 一句话建页与转化优化建议。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-green)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red)](https://nestjs.com/)

## 项目定位

面向真实公司内部运营团队，目标是提供可审计、可验证、可复用的运营闭环：

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

### 5. 权限与发布治理

- 角色矩阵：`viewer` 只读 / `editor` 建页与提交审核 / `admin` 审核、发布、下线、回滚、用户管理
- 页面状态流：`draft → pending_review → rejected / approved → published → offline`
- 发布日志记录审核人、发布人、回滚人快照；已发布页编辑后可回草稿，线上快照继续可访问
- 前端按角色隐藏操作入口，后端以 `@Roles` 为准做最终鉴权

### 6. 线索与效果数据

- 线索治理：隐私同意、`requestId` 幂等去重、非管理员手机号脱敏、导出（仅管理员）与访问审计
- 数据保留：`LEAD_RETENTION_DAYS`（默认 180 天）+ 管理员手动清理超期线索（先预览再确认）
- 效果看板：按页面 / 日期 / 渠道 / 版本 / 来源过滤，含独立访客、每日趋势与 CSV 导出
- 埋点口径：`crs` 访客事件与 `cms` 后台操作分开统计，看板默认只算访客漏斗

### 7. 生产运行保障

- 统一存储接口：本地磁盘（开发）与 S3 兼容对象存储（生产）通过 `STORAGE_DRIVER` 切换
- 生产启动校验：示例密钥、默认数据库密码、默认管理员密码会直接拒绝启动
- 种子数据保护：生产默认关闭，且只会创建管理员账号
- 健康检查 `/health`（区分 database / storage），可直接用于探针

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

# 真实 Backend + CMS + CRS 主链路（重建独立测试库）
pnpm --filter @cms/cms test:e2e:live
```

`test:e2e` 使用 CMS 与 API mock；`test:e2e:live` 会启动真实三端，并重建专用测试库 `cms_platform_resume_e2e`。运行真实链路套件前，请确认 `DB_HOST`、`DB_PORT`、`DB_USERNAME`、`DB_PASSWORD` 与 `RESUME_DB_DATABASE` 指向可删除的测试 PostgreSQL 实例，切勿指向业务库。

### 类型与治理检查

```bash
pnpm --filter @cms/cms typecheck
pnpm --filter @cms/crs typecheck
pnpm --filter @cms/backend typecheck
pnpm check:ui-governance
```

### 最近一次验证基线（2026-09-30）

- `pnpm --filter @cms/backend test -- --runInBand`：通过，7 个测试文件 / 62 条测试
- `pnpm --filter @cms/utils test -- --run`：通过，4 个文件 / 57 条测试
- `pnpm --filter @cms/ui test -- --run`：通过，7 个文件 / 33 条测试
- 各包 `typecheck` 与 `lint`：通过（`pnpm --filter <pkg> typecheck` / `pnpm --filter <pkg> lint`）
- `pnpm --filter @cms/backend build`、`@cms/ui` / `@cms/cms` / `@cms/crs` / `@cms/types` / `@cms/utils` build：通过
- `pnpm --filter @cms/cms test:e2e`：**28/28** 通过（含 5 条核心冒烟）
- `pnpm --filter @cms/cms test:e2e:live`：**12/12** 通过，覆盖登录、建页、编辑、提交审核、审核发布、CRS 访问、留资、线索跟进与导出、发布记录、回滚、埋点漏斗与 AI 建页（mock）

> 根目录 `pnpm lint` / `pnpm typecheck` 走 turbo 并发调度，在子进程/管道受限的环境（部分容器与沙箱）下可能报 `os error 231`；此时改用 `pnpm --filter <pkg> <script>` 逐包执行即可，验收口径相同。

完整验证记录与已解决问题见 [plan.md](./plan.md) Action 15-24 及 [docs/E2E-FINDINGS.md](./docs/E2E-FINDINGS.md)。

## 演示与文档

- 演示脚本：[docs/DEMO_SCRIPT_ZH.md](./docs/DEMO_SCRIPT_ZH.md)
- 验收清单：[docs/ACCEPTANCE_CHECKLIST_ZH.md](./docs/ACCEPTANCE_CHECKLIST_ZH.md)
- 生产运维手册（上线检查 / 存储 / 备份恢复 / 回滚）：[docs/OPERATIONS.md](./docs/OPERATIONS.md)
- 简历证据映射：[docs/RESUME_EVIDENCE_ZH.md](./docs/RESUME_EVIDENCE_ZH.md)
- 生产补全断点续作：[plan.md](./plan.md)
- 真实链路 E2E 验证与发现：[docs/E2E-FINDINGS.md](./docs/E2E-FINDINGS.md)
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

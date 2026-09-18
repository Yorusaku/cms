# 真实数据库与业务闭环进度

## 目标

完成并验证以下真实业务路径：

`编辑草稿 -> 发布线上版本 -> 访客访问 -> 提交线索 -> 后台跟进 -> 版本回滚`

## 约束与决策

- 开发使用新的 PostgreSQL 数据库 `cms_platform_resume`，不删除或改写已有数据库。
- 页面现有 `schema` 保存草稿，公开端只读取独立的线上快照（`published_schema`）。
- 回滚创建新的线上发布记录，保留当前草稿和操作轨迹。
- 线索以 `requestId` 作为唯一幂等键，并关联页面、线上版本和会话。
- 不在本轮引入多租户、审批流、商品中心、复杂 CRM 或实时协作。

## 动作清单

- [x] Action 1: 补齐数据库实体、首份基线 migration 和可重复 seed。
- [x] Action 2: 实现草稿/线上隔离、显式发布和线上回滚事务。
- [x] Action 3: 接入 CRS 公开页面、版本化埋点与幂等留资。
- [x] Action 4: 完成 CMS 线索跟进状态和发布记录展示。
- [x] Action 5: 补后端集成验证、真实链路冒烟与文档证据。

## 当前进度

Status: done

已完成：

- Docker 数据库就绪：容器 `cms-vue3-resume-postgres`（postgres:16-alpine，本机 5432 被原生 postgres 占用，故映射 `0.0.0.0:5433->5432`），库 `cms_platform_resume`。`apps/backend/.env` 改为 `DB_PORT=5433`、`DB_DATABASE=cms_platform_resume`。
- 首份基线 migration `1790000000000-InitialResumeDatabase` 已执行，6 张表 + migrations；seed 写入 3 用户、4 页面（3 已发布带 version_id）、3 条 publish_logs、10 templates。
- 草稿/线上隔离、显式发布、线上回滚事务与公开读取完成；真实链路冒烟 16/16 PASS（独立运行两次均通过）。
- CRS 公开页接 `getPublishedPage`，埋点携带 `publishedVersionId`，留资按 `requestId` 幂等；CRS typecheck 通过。
- CMS 线索列表新增跟进状态/备注、来源版本与渠道展示，发布记录新增「当前线上/回滚版本」标签，回滚语义改为「线上回滚不覆盖草稿」，顶部发布改为「保存草稿 + 显式 publishPage」；组件测试 9/9 通过。

验证证据见下方「验证记录」。

## 验证记录

### 数据库与后端

- `docker ps`：容器 `cms-vue3-resume-postgres` 运行中（`0.0.0.0:5433->5432/tcp`，Up）。
- `pnpm --filter @cms/backend migration:run`：`1790000000000-InitialResumeDatabase` 成功。
- `pnpm --filter @cms/backend seed`：成功（用户/页面/发布记录/模板）。
- `pnpm --filter @cms/backend build` + `node dist/main`：后端启动成功并连上 5433 库。
- 后端 Jest：2 套件 4 条全部通过（`ai.service.spec.ts`、`tracking.service.spec.ts`）。

### 真实链路冒烟（`%TEMP%\cms-resume-verify.mjs`）

16/16 PASS，覆盖：

登录 -> 建草稿 -> 发布 v1 -> 公开读取（`getPublishedPage` 返回线上快照）-> `page_view`/`cta_click` 埋点（带 `publishedVersionId`）-> `submitLead` 首次成功 + 同 `requestId` 幂等（`duplicated=true`）-> 线索列表/状态更新（contacted）-> 发布 v2 -> 回滚到 v1（新记录 `action=rollback`、`isCurrent=true`、`sourceVersionId` 指向 v1）-> 回滚后公开读取 schema 为 V1 -> 漏斗汇总（pageViews>=1、leads>=1、ctaClickRate/leadConversionRate=1）。

注意：`ApiCode.SUCCESS = 10000`（非 0），冒烟脚本断言用 `code === 10000`。

### 前端

- typecheck：`@cms/backend`、`@cms/cms`、`@cms/crs` 全部通过。
- `@cms/ui` LeadFormBlock.test.ts：2/2 通过。
- `@cms/cms`：
  - `Activity.ai.test.ts`（含新增线索跟进/发布记录/回滚交互测试）：9/9 通过。
  - `api.test.ts` 12/12、`tracking-utils.test.ts` 4/4、`usePageStore.test.ts` 58/58 通过。

### 已知问题（非本轮引入）

- `pnpm --filter @cms/backend lint` 报 `Could not find plugin "vue"`：根因是根目录 `eslint.config.js` 覆盖块引用 vue 规则但未声明 plugins；该文件 git 未改动，属既有问题。
- `pnpm --filter @cms/cms test -- --run` 全量仍存在既有失败（condition/data-binding/linkage/page-publish 等，见 `plan.md`），非本轮改动引入。

## 关键命令与文件

- 建库：`pnpm --filter @cms/backend db:create:resume`（脚本在 `apps/backend/scripts/`）
- migration：`pnpm --filter @cms/backend migration:run`
- seed：`pnpm --filter @cms/backend seed`
- 冒烟：`node %TEMP%\cms-resume-verify.mjs`
- 后端入口：`apps/backend/src/modules/page/page.service.ts`、`apps/backend/src/modules/lead/lead.service.ts`、`apps/backend/src/modules/tracking/tracking.service.ts`
- 前端：`apps/frontend/crs/src/views/Page.vue`（公开渲染/埋点）、`apps/frontend/cms/src/views/Activity.vue`（线索/发布记录/回滚）、`apps/frontend/cms/src/views/Decorate/components/TopHeader.vue`（保存草稿+显式发布）

## 交接提示

- 后续如需全量 CMS Vitest/E2E 治理，先看 `plan.md` 既有失败清单再决定，不要与本轮改动混淆。
- 容器与后端进程可继续复用；收尾时停掉后端进程，并按需 `docker stop cms-vue3-resume-postgres`。
- `.env`（`DB_PORT=5433`、`DB_DATABASE=cms_platform_resume`）为本地未跟踪文件；`apps/backend/tsconfig.json` 的 paths 修复（指向 `packages/types/dist`）已进 git 待提交。
- 首次接手先读本文件 + `plan.md`，不凭记忆推断。
# E2E 真实链路测试：发现与问题清单

> 本文记录 `@cms/cms` 新增的**真实链路 E2E 套件（e2e-live）**的运行结果与发现的问题。
> 该套件**不改动任何业务源码**，只新增测试文件/配置/脚本；**不治理既有 mock 套件**（`tests/e2e`），仅引用其基线数据。
> 修复阶段（Action 16）已落地 F1–F5 修复并把对应断言升级为正向断言，下方每条已标记当前状态。

## 一、概述

- 套件位置：`apps/frontend/cms/tests/e2e-live/`
- 运行方式：`pnpm --filter @cms/cms test:e2e:live`（或根目录 `pnpm test:e2e:live`）
- 数据源：真实 backend(3300) + Docker PostgreSQL(5433) + **独立测试库 `cms_platform_resume_e2e`**；每次运行前由 `globalSetup` 重建库 → `migration:run` → `seed`，业务库零污染
- 三端：backend(3300，注入 `DB_DATABASE=cms_platform_resume_e2e` / `AI_MOCK_ENABLED=true`) + CRS(3010) + CMS(3011)
- **当前结果：11 / 11 全部通过（末次完整运行 31.8s，正向断言）；F1–F5 已修复**

覆盖范围：

| spec | 内容 |
|------|------|
| `full-flow.spec.ts` | 登录 → seed 演示页可见 → 模板/空白建页 → 装修(填名+拖组件) → 保存草稿 → 发布 → 访客公开接口 `getPublishedPage`+`submitLead` 留资 → 后台线索(渠道/UTM) → 发布记录 → 回滚 → CRS 访客直连正向渲染 |
| `ai-build.spec.ts` | 「AI 一句话建页」弹窗 → 填描述 → 生成草稿（后端本地 mock）→ 进入 `/decorate?id=` 且草稿已保存、画布渲染出 AI 组件 |
| `crs-render.spec.ts` | CMS 预览流（新 tab + iframe + postMessage）正向断言 iframe 200 + `.page-preview-container`；CRS 访客直连已发布页正向断言渲染 `.page-content` |

## 二、问题清单

> 状态图例：✅ 已修复（Action 16）｜◻️ 基线/未治理（F6）

### F1 装修画布可视化渲染断点 —— ✅ 已修复

- **现象**：在装修页添加/加载组件后，画布区域为空——`.sortable-list` 存在但内部没有渲染出任何组件节点，`.empty-canvas` 提示也不显示；页面无 console 报错，保存/发布/预检均正常。
- **位置**：`apps/frontend/cms/src/views/Decorate/components/CenterCanvas.vue`
- **根因**：`vue-draggable-plus@0.6.1` 的 `VueDraggable` **组件**（`defineComponent`）的 render 只渲染默认插槽；业务代码在**组件**上使用了 `#item` 具名插槽（`#item` 是 `vDraggable` **指令**用法），二者不匹配。
- **修复**：两处 `<VueDraggable>` 由 `<template #item>` 改为**默认插槽 + `v-for`** 渲染 `<div class="canvas-component">`（虚拟滚动分支用 `visibleItems`，非虚拟滚动分支用 `sortableComponents`），保留 `v-model` / `handle=".component-drag-handle"` / 删除按钮，不改 script/store/样式；同时修正两处标签配对错误。
- **验证**：`full-flow.spec.ts` / `ai-build.spec.ts` 升级为正向断言 `.canvas-dropzone .canvas-component` 渲染出组件节点，11/11 通过。

### F2 CRS 访客直连已发布页断点 —— ✅ 已修复

- **现象**：访客直接打开 `http://127.0.0.1:3010/crs/#/page?id=<id>` 无任何渲染入口（路由不匹配，页面空白）。
- **位置**：`apps/frontend/crs/src/router/index.ts`
- **根因**：CRS router 仅注册 `/`（`Home.vue`）与 `/pagePreview`（`PagePreview.vue`）；`Page.vue`（唯一调用 `getPublishedPage` 并走 `SchemaRenderer` 正向渲染已发布页的组件）**未注册到路由**。
- **修复**：注册 `{ path: "/page", name: "Page", component: () => import("../views/Page.vue") }`；`Page.vue` 本身逻辑完整（`getPublishedPage` + `SchemaRenderer` + 埋点），未改动。
- **验证**：`full-flow.spec.ts` 第 8 步正向断言 `http://127.0.0.1:3010/crs/#/page?id=<id>` 渲染出 `.page-content` 与组件节点，通过。

### F3 CMS 预览 iframe base 缺失 —— ✅ 已修复

- **现象**：CMS「预览」新 tab 中 `iframe#previewIframe` 加载 3010 根路径而非 CRS 应用，白屏/404。
- **位置**：`apps/frontend/cms/src/views/Preview.vue` 的 `buildPreviewUrl()`
- **根因**：`buildPreviewUrl()` 未拼 CRS 的 `/crs/` base（CRS `vite.config.ts` 配置 `base: '/crs/'`），正确地址应为 `http://127.0.0.1:3010/crs/#/pagePreview?id=...`。
- **修复**：`buildPreviewUrl()` 改用 env `VITE_CRS_PREVIEW_URL`（fallback `http://127.0.0.1:3010/crs/#/pagePreview`）再追加 `?id=`；`apps/frontend/cms/.env` 中该值由 `localhost` 改为 `127.0.0.1` 并**加引号**（值含 `#`，不加引号会被 Vite 当注释截断）；`apps/frontend/cms/src/env.d.ts` 补 `VITE_CRS_PREVIEW_URL: string`。
- **验证**：`crs-render.spec.ts` 改为正向断言 iframe HTTP 200 且出现 `.page-preview-container`，通过。

### F4 CRS Home 列表为硬编码 mock —— ✅ 已修复

- **现象**：`http://127.0.0.1:3010/crs/#/` 首页活动列表显示「双十一/新年特惠」等假数据，不来自后端。
- **位置**：`apps/frontend/crs/src/views/Home.vue`（`const mockData = [...]`，直接 `activityList.value.push(...mockData)`）
- **修复**：后端 `PageController` 新增 `@Public() @Get("getPublishedPageList")`（复用 `GetPageListDto`），`PageService.getPublishedPageList()` 过滤 `isDeleted:false, isAbled:1, status:"published"` 并复用 `toPageItem` 返回 `{list,total,pageNum,pageSize}`（避免给 `getPageList` 加 `@Public` 暴露草稿）；CRS `api/page.ts` 新增 `getPublishedPageList(params)`；`Home.vue` 删除 `mockData`，改请求该接口，`goToPreview` 跳 `{ path: "/page", query: { id } }`（配合 F2）。语义：访客首页只展示已上线页面，不暴露草稿。
- **验证**：`full-flow.spec.ts` / `crs-render.spec.ts` 首页真实列表断言通过；后端新增 `page.service.spec.ts` 3 用例（published/isAbled 过滤与分页）通过。

### F5 seed 演示页 schema 为空 —— ✅ 已修复

- **现象**：seed 的演示页面 `schema.componentMap = {}`、`rootIds = []`，内容为空；模板（`template-seeds.ts`）才有真实 schema。
- **位置**：`apps/backend/src/database/seed.service.ts`（`DEMO_PAGES` 常量）——以及更隐蔽的 `apps/backend/src/database/seed.ts`（`pnpm seed` 实际走的是它，原返回空 schema 且仅 4 页）。
- **修复**：新建 `apps/backend/src/database/seeds/demo-page-schemas.ts`，`buildDemoPageSchema(name)` 为每个页面生成含真实组件的 `IPageSchemaV2`（`componentMap`+`rootIds`，组件类型取物料白名单 CarouselBlock/ComTitle/ProductBlock/CmsButton/RichTextBlock/NoticeBlock，`cid` 模式保证唯一）；`seed.ts` 与 `seed.service.ts` **同步**引用（DEMO_PAGES 统一 8 个，published 4 个），published 演示页以该 schema 发布，保留 `publish_log`/`publishedVersionId` 逻辑。
- **验证**：seed 后演示页 schema 有内容；`full-flow.spec.ts` 第 1 步断言 seed 演示页在活动列表出现，发布/回滚/访客渲染全链路 11/11 通过。

### F6 既有 mock 套件基线 —— ✅ 已治理（Action 17）

- **现象**：`pnpm --filter @cms/cms test:e2e`（mock 套件，只起 CMS dev 3011 + API mock）最初基线 26 条中 14 条通过、11 条失败、1 条未运行；其中 `smoke-core` 第 4 条「发布并预览」出现回归（此前 5/5 通过）。
- **结论（重要）**：**11 条失败全部是 mock 侧与业务行为不一致，没有一条是 F1–F5 引入的业务回归。**
- **逐条根因与修复**：

| # | 用例 | 根因 | 类别 | 修复 |
|---|------|------|------|------|
| 1 | `smoke-core:4 发布并预览` | `api-mocks.setup.ts` 缺 `/atlas-cms/publishPage` 拦截，`TopHeader.saveAndPreview` 的显式发布被 proxy 到 3300 → ECONNREFUSED → 发布失败不打开预览 | mock 不完整（**非 F1–F5 回归**） | 补 `publishPage` handler，返回 `{versionId, versionNo}` |
| 2 | `activity:12 renders page list` | mock `getPageList` 不按 `pageSize` 分页，返回全部 12 条；真实后端按页截断 | mock 不忠实 | handler 按 `pageNum/pageSize` 切片 |
| 3 | `activity:25 create page navigates` | `Activity.vue`「新增页面」现先开 `TemplatePicker` 弹窗，需再点「跳过，创建空白页」 | 断言过时（Action 14 起） | page object 加 `skipTemplatePicker()` / `createBlankPageAndWait()` |
| 4–9 | `condition-rendering×2` / `data-binding` / `linkage` / `page-builder×2` | mock detail schema 仅 1 个组件（断言要求 ≥5）；`expectCanvasHasComponentsAtLeast` 实为 `toHaveCount`（精确等于，与命名矛盾）；`.right-config` 类名已变 `.page-right` | fixture / page object 过时 | mock detail 扩为 5 个真实 registry 组件；断言改 `expect.poll(...).toBeGreaterThanOrEqual`；选择器改 `.page-right` |
| 10 | `preview:18 device selector` | `selectDevice` 用 `getByText().click()` 命不中 el-select 选项 | page object 过时 | 先点 `.toolbar-select` 展开下拉，再点 `.el-select-dropdown__item` |
| 11 | `publish-rollback:27 rolling back` | Action 14 回滚语义已改为「只切换线上版本、不覆盖草稿、不跳转装修页」 | 断言过时（Action 14 起） | 断言「线上页面已回滚」提示 + 停留 `/activity` |

附带修正：`smoke-core:5 回滚恢复` 同为旧回滚语义（因 `describe.serial` 前置失败被跳过而未暴露），一并按新语义更新；mock detail schema 需可通过 `runPagePreflight`，图片字段改内联 SVG data URI、`link` 改 `{clickType:1,data:{url}}`，否则发布/预览会被发布前校验拦截。

- **验证**：`pnpm --filter @cms/cms test:e2e` → **26 passed（17.5s）**；`pnpm --filter @cms/cms test:e2e:live` → **11 passed（32.2s）**（live 不回归）；`pnpm --filter @cms/backend test -- --runInBand` → 7 tests passed；三端 typecheck 通过。
- **是否改业务源码**：否。全部修复在 `tests/e2e/`（fixture / page object / spec 断言）内完成。

### F7 mock 套件时序 flaky —— ✅ 已治理（Action 18）

- **现象**：F6 修复后套件可全绿，但连续运行会出现「某一条随机失败、重跑即过」，失败用例每次不同（实测遇到过「登录」「搜索过滤」）。
- **根因（两处，均为测试侧）**：
  1. **登录态残留**：`permission.ts` 在有 token 时把 `/login` 重定向到 `/home`；`LoginPage.login()` 未先清理，同 context 内前序用例留下的 token 会让「登录 → 跳 `/activity`」等不到目标 URL。
  2. **搜索点击被吞**：activity 首屏 `v-loading` 遮罩未消失时点「搜索」无效，断言一直读到未过滤的初始 10 行。
- **修复**：`LoginPage.login()` 进登录页前清 `token/role/username` 并 reload；`searchByName()` 先等首行渲染；smoke-core 发布预览用例 `setTimeout(60000)`（冷启动需额外编译 Preview 模块，全局 30s 不够）。
- **验证**：`pnpm --filter @cms/cms test:e2e` **连续 3 次均 26 passed**；live 11/11 不回归。

> 状态图例（更新后）：✅ 已修复（Action 16 / 17 / 18）｜F1–F7 全部已治理，mock 与 live 两套 E2E 均稳定全绿。

## 三、测试策略（修复后已升级为正向断言）

- **画布渲染**：修复 F1 后，拖入组件以原生 DnD 事件（`dragstart`/`dragover`/`drop`）驱动，断言 `.canvas-dropzone .canvas-component` 渲染出组件节点（替代早期「物料计数」间接断言）。
- **AI 建页**：生成草稿后断言页面名称加载 + 画布 `.canvas-component` 出现 AI 组件（替代早期计数断言）。
- **CRS 访客直连**：修复 F2/F4 后，正向断言 `#/page?id=` 渲染 `.page-content` 与组件节点；首页断言真实 published 列表。
- **CMS 预览 iframe**：修复 F3 后，正向断言 iframe HTTP 200 且出现 `.page-preview-container`。
- **回滚断言**：断言「线上页面已回滚，当前草稿未受影响」成功提示 + 发布记录抽屉出现「回滚至 …」日志（后端回滚语义为创建新 publish_log、不覆盖草稿、留在当前页）。

## 四、结论与建议

- **主链路数据闭环 + 渲染端全链路已跑通（11/11，正向断言）**：登录 → 建页 → 编辑（画布可视化）→ 保存草稿 → 发布 → CRS 访客直连已发布页渲染 → 留资 → 后台线索 → 发布记录 → 回滚；AI 一句话建页（mock）画布渲染正常。
- F1–F5 渲染端断点已全部修复并验证；注意 `pnpm seed` 走的是 `seed.ts`（不调用 `seed.service.ts`），二者必须保持同步（都调用 `buildDemoPageSchema`、8 个演示页、published 4 个）。
- **F6 mock 套件已在 Action 17 治理**：`tests/e2e` 由 14 passed / 11 failed / 1 skipped 恢复为 **26/26 全绿**，`smoke-core` 恢复 5/5；11 条失败全为 mock 侧（fixture / page object / 断言）与 Action 14–16 业务行为不一致，**无业务回归**、**未改业务源码**。
- 经验教训：mock 套件不起 backend/CRS，业务每新增一个走 proxy 的接口（如 Action 14 的 `publishPage`），必须在 `fixtures/api-mocks.setup.ts` 同步补拦截，否则请求会落到 3300 报 ECONNREFUSED；发布/预览类用例的 mock schema 必须可通过 `runPagePreflight`（图片与链接字段非空）。

*关联文件：`plan.md` Action 15/16/17、`apps/frontend/cms/playwright.live.config.ts`、`apps/frontend/cms/tests/e2e-live/*`、`apps/frontend/cms/tests/e2e/*`。*
# 营销 AI 低代码一期执行计划

## 当前目标

更新 `AGENTS.md`、`CLAUDE.md` 和 `README.md`，同步 AI 一期能力、`plan.md` 断点续作规则与最新验证状态。

## 当前进度

- Action 0: 已完成，已创建本断点续作文件。
- Action 1: 已完成，已补充 AI 相关类型与接口契约。
- Action 2: 已完成，后端已新增 AI 模块与 mock 版 `aiGeneratePage`。
- Action 3: 已完成，已接入 OpenAI-compatible provider 与 env 配置。
- Action 4: 已完成，CMS 活动页已增加「AI 新建」弹窗。
- Action 5: 已完成，后端已新增基础漏斗汇总接口。
- Action 6: 已完成，已新增 `aiDiagnosePage`。
- Action 7: 已完成，CMS 已增加「AI 优化建议」入口和抽屉。
- Action 8: 已完成，已补齐后端与前端 API 测试；E2E 未运行。
- Action 9: 已完成，已收尾整理 provider summary fallback 并重新验证后端。
- Action 10: 已完成，已补 CMS AI 新建弹窗与 AI 优化建议抽屉组件测试。
- Action 11: 已完成，已运行 Playwright 冒烟并验证真实 Backend/CMS/CRS 启动环境。
- Action 12: 已完成，已排查活动管理动态导入失败，当前判断为 dev server 断开/未运行导致。
- Action 13: 已完成，已同步更新 `AGENTS.md`、`CLAUDE.md` 和 `README.md`。
- Action 14: 已完成，真实数据库与业务闭环（Docker PostgreSQL + 发布/回滚/线索/埋点），详见 `resume-database-progress.md`。
- Action 15: 已完成，新增真实链路 E2E live 套件（11/11 通过，独立测试库 `cms_platform_resume_e2e`），并输出问题清单 `docs/E2E-FINDINGS.md`（含画布渲染/CRS 路由等断点）。
- Action 16: 已完成，修复渲染端断点 F1–F5（画布渲染/CRS /page 路由/预览 iframe/CRS 真实列表/seed schema），live 套件升级为正向断言后仍 11/11 全绿，详见 `docs/E2E-FINDINGS.md`。
- Action 17: 已完成，治理既有 mock 套件 F6：mock 套件由 14 通过/11 失败/1 跳过恢复为 **26/26 全绿**（smoke-core 恢复 5/5），live 套件保持 11/11，后端 Jest 7/7 与三端 typecheck 通过，详见 `docs/E2E-FINDINGS.md` 与下方 Action 17 日志。

## 下一步动作

F1–F6 已全部治理：渲染端断点（F1–F5，Action 16）与 mock 套件基线（F6，Action 17）均已修复并验证，mock/live 两套 E2E 全绿。后续如需继续推进，优先在无 mock 依赖的真实三端环境补跑，或按需清理遗留未提交改动（Action 17 已按语义分组提交到本地 `main`，尚未 push）。

## 已确认决策

- 项目方向：营销 AI 低代码平台，优先服务电商促销和线索收集场景。
- AI 生成结果：保存为草稿页面，用户进入装修页检查后再发布。
- 模型接入：后端统一 OpenAI-compatible 适配，前端不暴露密钥。
- 首期物料范围：轮播、公告、富文本、商品、线索表单、弹窗、辅助线、浮层。
- 首期不做：图片生成、素材库、商品中心、自动发布、A/B 变体生成、自动流量分流。

## 风险/阻塞

- 真实模型调用依赖后端 env 配置；无密钥时必须可用 mock fallback。
- AI 输出必须经过 Schema 校验和物料归一化，避免生成无法渲染的组件类型。
- 富文本内容需要做基础安全清洗，避免危险 HTML 进入渲染端。
- `pnpm --filter @cms/cms test -- --run` 当前仍有非本轮 AI 改动引入的既有失败，集中在 condition/data-binding/linkage/page-publish/generate-material 与 e2e spec 被 Vitest 收集等测试。
- `pnpm --filter @cms/cms test:e2e` 完整 mock 套件已在 Action 17 治理为 **26/26 全绿**（smoke-core 5/5）；此前基线为 26 条中 16 通过、10 失败。失败根因是 mock fixture/page object 与 Action 14–16 后的真实行为不一致（非业务回归）。
- 渲染端断点 F1–F5 已在 Action 16 修复并验证（`docs/E2E-FINDINGS.md`）：F1 画布渲染（VueDraggable 改默认插槽+v-for）、F2 CRS `/page` 路由、F3 预览 iframe base/env、F4 CRS 真实 published 列表、F5 seed 演示页真实 schema（seed.ts 与 seed.service.ts 已同步）；live 套件断言已升级为正向断言，11/11 全绿。
- F6 既有 mock 套件基线已在 Action 17 治理（`docs/E2E-FINDINGS.md`）：核心是补齐 `publishPage` 拦截（smoke-core:4 根因）、让 mock schema 可通过 `runPagePreflight`、修正过时断言（回滚语义/模板弹窗/设备选择器/选择器类名）。
- 点击「活动管理」出现 `Failed to fetch dynamically imported module ... Activity.vue` 且伴随 Vite WebSocket 失败时，优先检查 3011 dev server 是否仍在运行。
- `AGENTS.md` / `CLAUDE.md` / `README.md` 已同步 AI 一期、`plan.md` 规则和最新验证状态。

## 动作清单

- [x] Action 0: 创建并维护 `plan.md`。
- [x] Action 1: 补充 AI 相关类型与接口契约。
- [x] Action 2: 后端新增 AI 模块与 mock 版 `aiGeneratePage`。
- [x] Action 3: 接入 OpenAI-compatible provider 与 env 配置。
- [x] Action 4: CMS 活动页增加「AI 新建」弹窗。
- [x] Action 5: 后端新增基础漏斗汇总接口。
- [x] Action 6: 新增 `aiDiagnosePage`。
- [x] Action 7: CMS 增加「AI 优化建议」入口和抽屉。
- [x] Action 8: 补齐测试与 E2E 冒烟。
- [x] Action 9: 收尾整理 provider summary fallback。
- [x] Action 10: 补 CMS AI 交互组件测试。
- [x] Action 11: E2E 环境验证。
- [x] Action 12: 排查活动管理动态导入失败。
- [x] Action 13: 同步更新文档。
- [x] Action 14: 真实数据库与业务闭环（详见 `resume-database-progress.md`）。
- [x] Action 15: 真实链路 E2E live 套件（11/11）。
- [x] Action 16: 修复渲染端断点 F1–F5。
- [x] Action 17: 治理既有 mock 套件 F6 与遗留未提交改动收尾。

## Action 0: 创建断点续作文件

Status: done

Goal: 创建根目录 `plan.md`，承载当前 AI 一期方案、动作清单、已确认决策和后续接手信息。

Scope: 根目录文档。

Changes: 新增 `plan.md`，记录总目标、当前进度、下一步动作、已确认决策、风险和动作清单。

Verification: 未运行测试；本动作仅新增执行计划文档。

Decisions: 采用“可验证小闭环”作为动作粒度，并使用顶部状态 + 底部动作日志的记录方式。

Next: Action 1，补充 AI 相关类型与接口契约。

Notes for Claude: 后续每完成一个 Action，都要先更新顶部状态和动作清单，再追加对应 Action 日志。

## Action 1: 补充 AI 类型与接口契约

Status: done

Goal: 在共享类型包中定义 AI 建页、漏斗汇总和诊断建议的公共契约，供 backend 与 CMS 复用。

Scope: `packages/types/src/ai.ts`、`packages/types/src/index.ts`、`packages/types/dist/*`。

Changes: 新增 `AiGeneratePageRequest/Response`、`PageFunnelSummary`、`AiDiagnosePageRequest/Response` 等 zod Schema 与 TypeScript 类型，并通过 `@cms/types` 公开导出。

Verification: 已运行 `pnpm --filter @cms/types typecheck`，通过；已运行 `pnpm --filter @cms/types build`，通过并同步 dist。

Decisions: AI 页面生成响应复用现有 `PageSchemaV2Schema`，避免后端和前端各自定义页面结构。

Next: Action 2，后端新增 AI 模块与 mock 版 `aiGeneratePage`，先跑通生成草稿闭环。

Notes for Claude: `packages/types` 的公开入口指向 `dist`，后续修改该包源码后必须重新 build。

## Action 2: 后端 AI 模块与 mock 建页接口

Status: done

Goal: 新增后端 AI 模块，先用 mock 生成受控电商促销 H5 Schema，并保存为草稿页面。

Scope: `apps/backend/src/modules/ai/*`、`apps/backend/src/modules/page/page.module.ts`、`apps/backend/src/app.module.ts`。

Changes: 新增 `POST /atlas-cms/aiGeneratePage`，支持 `admin/editor` 调用；新增 AI 建页 DTO、`AiService` mock 生成器、`AiModule`；生成结果复用 `PageService.addPageJson` 保存草稿；`PageModule` 导出 `PageService`。

Verification: 已运行 `pnpm --filter @cms/backend typecheck`，通过。

Decisions: mock 生成使用受控物料类型 `Carousel/Notice/RichText/Product/LeadForm/FloatLayer`；图片用内联 SVG data URI 占位；富文本内容先做 HTML 转义。

Next: Action 3，接入 OpenAI-compatible provider 与 env 配置，真实调用失败时保留 mock fallback。

Notes for Claude: 当前接口已经能在无模型配置时生成草稿；后续 provider 应优先返回同样的 `IPageSchemaV2`，并继续走 `PageSchemaV2Schema` 校验。

## Action 3: 接入 OpenAI-compatible provider

Status: done

Goal: 支持后端通过 env 调用 OpenAI-compatible 模型，并在未配置或调用失败时回退到 mock 生成。

Scope: `apps/backend/src/modules/ai/ai-provider.service.ts`、`apps/backend/src/modules/ai/ai.service.ts`、`apps/backend/src/modules/ai/ai.module.ts`、`apps/backend/.env.example`。

Changes: 新增 `AiProviderService`，支持 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`、`AI_TIMEOUT_MS`、`AI_MOCK_ENABLED`；模型响应按 JSON 提取为 `{ schema, summary, warnings }`；真实模型输出仍经过 `PageSchemaV2Schema`、物料白名单和富文本清洗；`.env.example` 补充 AI 配置占位。

Verification: 已运行 `pnpm --filter @cms/backend typecheck`，通过。

Decisions: 不引入 LLM SDK，使用 Node 原生 `fetch` 调 OpenAI-compatible `/v1/chat/completions`；`AI_MOCK_ENABLED=true` 强制 mock，未配置或调用失败也会 mock fallback。

Next: Action 4，CMS 活动页增加「AI 新建」弹窗，并调用 `aiGeneratePage` 创建草稿后跳转装修页。

Notes for Claude: 不要把真实 `AI_API_KEY` 写入仓库；如果用户要换供应商，只需改后端 env。

## Action 4: CMS AI 新建弹窗

Status: done

Goal: 在 CMS 活动管理页新增 AI 建页入口，采用“表单 + 一句话”输入，生成后保存草稿并跳转装修页。

Scope: `apps/frontend/cms/src/api/ai.ts`、`apps/frontend/cms/src/views/Activity.vue`。

Changes: 新增 `aiGeneratePage` API 封装；活动页新增「AI 新建」按钮和弹窗；表单包含页面标题、活动类型、目标人群、优惠信息、CTA、留资目标、页面风格、商品信息和补充描述；提交成功后调用 `aiGeneratePage` 并跳转 `/decorate?id=<pageId>`。

Verification: 已运行 `pnpm --filter @cms/cms typecheck`，通过。

Decisions: 前端只收集营销关键变量，不暴露模型配置；商品最多 6 个，未填商品时后端 mock 会补默认示例商品。

Next: Action 5，后端新增基础漏斗汇总接口，先支持页面维度和渠道维度统计。

Notes for Claude: 当前 AI 建页入口依赖后端 `POST /atlas-cms/aiGeneratePage`；若本地无模型 env，后端会自动 mock fallback。

## Action 5: 基础漏斗汇总接口

Status: done

Goal: 后端提供页面/渠道维度的基础漏斗数据，支撑后续 AI 转化诊断。

Scope: `apps/backend/src/modules/tracking/*`。

Changes: 新增 `GetPageFunnelSummaryDto`；`TrackingModule` 注入 `Lead` 仓库；`TrackingService.getPageFunnelSummary` 汇总 PV、CTA 点击、表单提交、线索数、CTA 点击率和线索转化率；`TrackingController` 新增 `GET /atlas-cms/getPageFunnelSummary`。

Verification: 首次运行 `pnpm --filter @cms/backend typecheck` 发现 TypeORM 泛型约束问题；修正为 `T extends ObjectLiteral` 后重新运行，通过。

Decisions: 首期使用内存汇总 JSONB 渠道字段，避免复杂 SQL JSONB 聚合；渠道优先取 `channel`，其次取 `utm_source`，否则归为“直接访问”。

Next: Action 6，新增 `aiDiagnosePage`，结合页面 Schema 与漏斗汇总输出优化建议。

Notes for Claude: 当前 `channel` 查询参数支持两种形式：渠道值本身，或 `channelKey:channelValue`。

## Action 6: AI 页面诊断接口

Status: done

Goal: 后端提供页面转化诊断接口，结合页面 Schema 与基础漏斗汇总输出可执行优化建议。

Scope: `apps/backend/src/modules/ai/*`、`apps/backend/src/modules/tracking/tracking.module.ts`。

Changes: 新增 `AiDiagnosePageDto`；`TrackingModule` 导出 `TrackingService`；`AiService.diagnosePage` 读取页面 Schema 与漏斗汇总，按页面结构、CTA 点击率、线索转化率、表单提交/线索偏差等规则生成建议；`AiController` 新增 `POST /atlas-cms/aiDiagnosePage`。

Verification: 已运行 `pnpm --filter @cms/backend typecheck`，通过。

Decisions: 首期诊断使用规则化 fallback，不依赖真实模型，保证无 AI Key 时也能输出稳定建议。

Next: Action 7，CMS 增加「AI 优化建议」入口和抽屉。

Notes for Claude: 后续如需接真实模型润色建议，可以在规则建议生成后再调用 provider，但不要移除规则 fallback。

## Action 7: CMS AI 优化建议抽屉

Status: done

Goal: 在活动管理页增加 AI 转化诊断入口，展示建议等级、问题、建议动作和关联组件。

Scope: `apps/frontend/cms/src/api/ai.ts`、`apps/frontend/cms/src/views/Activity.vue`。

Changes: `api/ai.ts` 新增 `aiDiagnosePage`；活动列表操作列新增「AI 优化」按钮；新增 AI 优化建议抽屉，展示页面摘要、建议等级、建议分类、关联组件、问题、建议动作和预期影响。

Verification: 已运行 `pnpm --filter @cms/cms typecheck`，通过。

Decisions: 首期在活动列表行内打开诊断抽屉，不进入装修页；关联组件先展示 `targetComponentId`，无组件时展示“页面级”。

Next: Action 8，补齐后端单测和前端/类型检查验证，视本地环境决定是否运行 E2E 冒烟。

Notes for Claude: 前端诊断入口依赖 `POST /atlas-cms/aiDiagnosePage`；后端当前为规则化诊断，不要求真实模型配置。

## Action 8: 测试补强与收尾验证

Status: done

Goal: 为 AI 建页、漏斗汇总和前端 AI API 补充自动化测试，并完成当前可运行的类型检查。

Scope: `apps/backend/jest.config.cjs`、`apps/backend/test/*`、`apps/frontend/cms/src/tests/api.test.ts`。

Changes: 新增后端 Jest 配置；新增 `AiService` 单测，覆盖 mock 建页保存草稿和规则化诊断建议；新增 `TrackingService` 单测，覆盖页面漏斗统计和渠道过滤；前端 API 测试补充 `aiGeneratePage` 与 `aiDiagnosePage`。

Verification: 已运行 `pnpm --filter @cms/backend test -- --runInBand`，通过，3 个测试文件 5 条测试；已运行 `pnpm --filter @cms/cms test -- --run src/tests/api.test.ts`，通过，12 条测试；已运行 `pnpm --filter @cms/backend typecheck`，通过；已运行 `pnpm --filter @cms/cms typecheck`，通过。

Decisions: 后端单测使用 Jest 专用 `@cms/types` 轻量 mock，避免 Jest 解析 workspace 外 TS 入口不稳定；真实生产类型仍由 `pnpm --filter @cms/backend typecheck` 校验。

Next: 在本地 PostgreSQL、Backend、CMS、CRS 三端服务可用时，补跑 `pnpm --filter @cms/cms test:e2e -- tests/e2e/smoke-core.spec.ts`。

Notes for Claude: E2E 未在本轮运行，原因是它依赖完整本地服务和数据库状态；本轮已完成单测与类型检查闭环。

## Action 9: provider summary fallback 收尾整理

Status: done

Goal: 整理 `aiGeneratePage` 返回摘要逻辑，确保只有 provider Schema 校验通过时才使用模型摘要，否则使用本地 mock 摘要，并重新确认后端可通过验证。

Scope: `apps/backend/src/modules/ai/ai.service.ts`、`plan.md`。

Changes: 将 `summary` fallback 提取为局部变量，保留 `providerSchema && providerDraft?.summary` 的保护条件；provider 输出未通过平台 Schema/物料校验时，不再沿用模型摘要，避免草稿内容与摘要不一致。

Verification: 已运行 `pnpm --filter @cms/backend typecheck`，通过；已运行 `pnpm --filter @cms/backend test -- --runInBand`，通过，3 个测试文件 5 条测试；已运行 `pnpm --filter @cms/types typecheck`，通过；已运行 `pnpm --filter @cms/cms typecheck`，通过；已运行 `pnpm --filter @cms/cms test -- --run src/tests/api.test.ts`，通过，12 条测试。

Decisions: 这次只做收尾可读性与一致性修正，不扩大到真实模型诊断、E2E 或 UI 调整。

Next: 若继续推进，优先在 PostgreSQL、Backend、CMS、CRS 三端服务可用时补跑 CMS E2E 冒烟；也可以先确认 `apps/backend/test/test-cms-types.spec.ts`、`apps/backend/test/test-resolve.js` 是否需要保留。

Notes for Claude: 当前一期功能和可运行验证已闭环；不要写入真实 AI Key，真实 provider 配置只放后端 env。

## Action 10: CMS AI 交互组件测试

Status: done

Goal: 补齐 CMS 活动页 AI 新建弹窗与 AI 优化建议抽屉的前端组件测试，覆盖用户可感知的关键交互路径。

Scope: `apps/frontend/cms/src/tests/Activity.ai.test.ts`、`plan.md`。

Changes: 新增 `Activity.ai.test.ts`，使用 Vue Test Utils + Vitest 挂载 `Activity.vue`；通过轻量 Element Plus stub 保留按钮点击、输入框 v-model、弹窗/抽屉显示和表格行 slot；mock 页面列表、AI 建页、AI 诊断、埋点、路由与消息提示。

Verification: 已运行 `pnpm --filter @cms/cms test -- --run src/tests/Activity.ai.test.ts`，通过，4 条测试；已运行 `pnpm --filter @cms/cms test -- --run src/tests/api.test.ts src/tests/Activity.ai.test.ts`，通过，2 个测试文件 16 条测试；已运行 `pnpm --filter @cms/cms typecheck`，通过；已运行 `pnpm --filter @cms/backend test -- --runInBand`，通过，3 个测试文件 5 条测试；已运行 `pnpm --filter @cms/types typecheck`，通过。尝试运行 `pnpm --filter @cms/cms test -- --run`，失败，新增 `Activity.ai.test.ts` 通过，失败集中在既有测试：`condition-engine.test.ts`、`data-binding-engine.test.ts`、`linkage-engine.test.ts`、`performance-benchmark.test.ts`、`generate-material-script.test.ts`、`page-publish.test.ts`、`LinkageConfig.test.ts`，以及 `tests/e2e/*.spec.ts` 被 Vitest 收集但无测试。

Decisions: 本轮只补 AI 相关组件测试，不修复无关历史测试；E2E 仍保持为需要 PostgreSQL、Backend、CMS、CRS 三端服务的独立验证项。

Next: 若继续治理测试，建议先修 CMS Vitest 配置，避免 `tests/e2e/*.spec.ts` 被单元测试命令收集；再分组处理 condition/data-binding/linkage/page-publish 等既有失败。

Notes for Claude: `Activity.ai.test.ts` 使用本地 stub 而非真实 Element Plus DOM，目标是验证 AI 业务交互，不验证 UI 库内部结构；不要把这些 stub 迁移为生产代码。

## Action 11: E2E 环境验证

Status: done

Goal: 验证本地 E2E 环境是否可运行，包括 Playwright 核心冒烟、系统浏览器、CMS dev server，以及真实 Backend/CMS/CRS 三端启动与端口响应。

Scope: Playwright E2E 运行环境、`apps/backend` build/start 验证、`apps/frontend/cms` dev server、`apps/frontend/crs` dev server、`plan.md`。

Changes: 未新增业务代码；运行 E2E 与服务启动验证。`pnpm --filter @cms/backend build` 产生/刷新了 `apps/backend/dist/*` 编译产物。后端真实启动时 TypeORM synchronize 在本地 PostgreSQL 中补建了缺失的 `leads` 与 `tracking_events` 表，这是当前后端启动配置的副作用。

Verification: 已运行 `pnpm --filter @cms/cms test:e2e -- tests/e2e/smoke-core.spec.ts`，通过，5 条测试全部通过，覆盖登录、模板建页、编辑保存草稿、发布并预览、回滚恢复；已运行 `pnpm --filter @cms/cms test:e2e`，执行 26 条，16 条通过、10 条失败；已运行 `pnpm --filter @cms/backend build`，通过；用构建产物 `node apps/backend/dist/apps/backend/src/main.js` 临时启动 Backend，3300 端口可监听，`GET /atlas-cms/getPageList?pageNum=1&pageSize=1` 返回 200；临时启动 CMS dev server，3011 端口可监听，`/cms-manage/login` 返回 200；临时启动 CRS dev server，3010 端口可监听，`/crs/` 返回 200；验证后确认 3300/3011/3010 端口均已清理。

Decisions: 将本轮定义为“E2E 环境验证完成”，不把完整 Playwright 套件的历史/既有用例失败混同为环境阻塞；后续若要全量 E2E 绿，需要单独治理测试用例与 fixture。

Next: 继续治理完整 Playwright 套件失败：`activity.spec.ts` 的行数/模板建页流程；`page-builder/condition-rendering/data-binding/linkage` 的画布组件 fixture 或画布渲染断言；`preview.spec.ts` 的 Element Select 操作；`publish-rollback.spec.ts` 的回滚确认与新标签页等待。

Notes for Claude: Playwright `smoke-core` 当前是 CMS + API mock 模式，不依赖真实 Backend/PostgreSQL；真实三端启动已单独验证。Backend 的 `dev` 脚本当前会编译到 `dist/apps/backend/src/main.js`，但随后寻找 `dist/main` 导致启动失败；真实启动验证使用的是构建产物入口。

## Action 12: 活动管理动态导入失败排查

Status: done

Goal: 排查用户点击首页「活动管理」时报 `TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:3011/cms-manage/src/views/Activity.vue` 的原因。

Scope: CMS Vite dev server、`Activity.vue` 动态模块请求、`plan.md`。

Changes: 未改业务代码；临时启动 CMS dev server 做模块请求验证。

Verification: 当前 3011 未运行时请求 `http://127.0.0.1:3011/cms-manage/src/views/Activity.vue` 连接失败；临时启动 `pnpm --filter @cms/cms dev` 后，同一 URL 返回 200，Vite 能成功编译并返回 `Activity.vue` 模块内容。结合用户控制台同时出现 `WebSocket connection to ws://127.0.0.1:3011/cms-manage/ failed`，当前判断为 dev server/HMR 连接断开或 3011 服务被停掉，而非 `Activity.vue` 当前源码编译失败。

Decisions: 先让用户重新启动 CMS dev server 并强制刷新页面；不做源码修复，因为当前没有观察到 `Activity.vue` 编译 500 或类型错误。

Next: 如果重启后仍复现，需要抓 Vite 终端里的红色编译错误，或直接请求 `http://127.0.0.1:3011/cms-manage/src/views/Activity.vue` 查看是否返回 500。

Notes for Claude: Action 11 真实三端验证后曾清理 3300/3011/3010 端口；如果用户原本依赖同一 3011 dev server，可能被清理流程停掉了。后续清理端口前应区分自己启动的进程和用户已有进程。

## Action 14: 真实数据库与业务闭环

Status: done

Goal: 在 Docker 上完成并验证真实业务路径：`编辑草稿 -> 发布线上版本 -> 访客访问 -> 提交线索 -> 后台跟进 -> 版本回滚`，使用新库 `cms_platform_resume`，不触碰已有数据库。

Scope: `apps/backend`（page/lead/tracking 模块、首份基线 migration、可重复 seed、tsconfig paths 修复）、`apps/frontend/crs`（公开渲染/版本化埋点/幂等留资）、`apps/frontend/cms`（线索跟进、发布记录、回滚语义、显式发布）、`packages/types`（版本化埋点/线索契约）、根文档。

Changes: 新增首份基线 migration 与可重复 seed；页面草稿（schema）与线上快照（published_schema）隔离，显式 publishPage 与线上回滚事务；线索以 requestId 幂等并关联页面/线上版本/会话；CRS 接 getPublishedPage、埋点带 publishedVersionId；CMS 线索跟进状态/备注、发布记录「当前线上/回滚」标签、回滚不覆盖草稿；TopHeader 保存草稿 + 显式发布。

Verification: 真实链路冒烟 `%TEMP%\cms-resume-verify.mjs` 16/16 PASS（独立运行两次）；后端 Jest 4/4；@cms/backend、@cms/cms、@cms/crs typecheck 通过；@cms/cms Activity.ai.test.ts 9/9（含新增线索/发布记录/回滚交互）、api.test.ts 12/12、tracking-utils.test.ts 4/4、usePageStore.test.ts 58/58；@cms/ui LeadFormBlock 2/2。完整证据见 `resume-database-progress.md`。

Decisions: 新库 `cms_platform_resume` 走 5433 端口（本机 5432 被原生 postgres 占用）；`synchronize: false`，migration 是唯一 schema 来源；回滚创建新 publish_log 记录，不覆盖草稿；`ApiCode.SUCCESS = 10000`。

Next: 后续如需全量 CMS Vitest/E2E 治理，先看本文件既有失败清单再决定；收尾时停掉后端进程并按需 `docker stop cms-vue3-resume-postgres`。

Notes for Claude: 后端 `dev` 脚本仍存在 dist 路径问题（tsc 编译到 dist/apps/backend/src 但找 dist/main），真实启动用 `pnpm --filter @cms/backend build` + `node dist/main`；`@cms/backend lint` 的 vue 插件报错为根目录 eslint.config.js 既有问题，非本轮引入。
## Action 15: 真实链路 E2E live 套件（独立测试库）

Status: done

Goal: 用真实 backend(3300) + Docker PostgreSQL(5433) + 独立测试库 `cms_platform_resume_e2e` 覆盖核心全流程（登录 -> 模板建页 -> 编辑 -> 发布 -> 访客留资 -> 后台线索 -> 发布记录 -> 回滚）与 AI 一句话建页（本地 mock），输出问题/失败清单，不修改业务源码、不治理既有 mock 套件。

Scope: `apps/frontend/cms/tests/e2e-live/`（`full-flow.spec.ts`、`ai-build.spec.ts`、`crs-render.spec.ts`、`global-setup.cjs`）、`apps/frontend/cms/playwright.live.config.ts`、`apps/frontend/cms/package.json`、根 `package.json`、`docs/E2E-FINDINGS.md`。

Changes: 新增独立 e2e-live 目录与 `playwright.live.config.ts`（三端 webServer：backend 注入 `DB_DATABASE=cms_platform_resume_e2e`/`AI_MOCK_ENABLED=true`，CRS 3010，CMS 3011）；globalSetup 每次重建测试库并 migration/seed；复用既有 login/activity/decorate page object，不引入 mock fixture；spec 对 F1 画布渲染断点采用原生 DnD 事件 + 物料计数断言规避，对 CRS/预览断点（F2/F3/F4）做记录现状探针；新增 `test:e2e:live` 脚本。

Verification: `pnpm --filter @cms/cms test:e2e:live` -> **11/11 passed（末次完整运行 42.1s）**，主链路（登录->建页->编辑->保存草稿->发布->getPublishedPage+submitLead 留资->后台线索含渠道 UTM->发布记录->回滚）与 AI 建页（mock）均跑通；测试库每次重建 seed，业务库零污染。问题清单见 `docs/E2E-FINDINGS.md`（F1-F6）。

Decisions: 独立测试库避免污染业务库；backend 不复用旧进程（env 需指向测试库）；回滚断言成功提示 + 「回滚至」日志，不跳转装修页；画布断点不改源码，以 store 数据断言规避。

Next: 若需修复渲染端断点，按 `docs/E2E-FINDINGS.md` 建议：F1 将 VueDraggable 的 `#item` 改为 `#default` 并升级画布 DOM 断言；F2 注册 CRS `/page` 路由；F3 修正预览 iframe base；F4 接真实页面列表。修复后可把 crs-render 探针改为正向断言。

Notes for Claude: `vue-draggable-plus@0.6.1` 的 `VueDraggable` 组件只渲染默认插槽（`#item` 是 `vDraggable` 指令用法），这是 F1 根因；`Preview.vue` 的 `buildPreviewUrl()` 未拼 `/crs/` base 是 F3 根因；CRS router 仅 `/` 与 `/pagePreview` 两条路由，`Page.vue` 未注册是 F2 根因。

## Action 16: 修复渲染端断点 F1–F5

Status: done

Goal: 修复 `docs/E2E-FINDINGS.md` 中 5 个渲染端断点（F1–F5），让「装修画布可视化、CRS 访客直连已发布页、CMS 预览 iframe、CRS 首页真实列表、seed 演示页内容」全部跑通；把 live 套件中对应「记录现状」断言升级为正向断言作为验收。F6（既有 mock 套件 16/26 基线）不纳入本次。

Scope: `apps/frontend/cms/src/views/Decorate/components/CenterCanvas.vue`（F1）、`apps/frontend/crs/src/router/index.ts`（F2）、`apps/frontend/cms/src/views/Preview.vue` + `apps/frontend/cms/.env` + `apps/frontend/cms/src/env.d.ts`（F3）、`apps/backend/src/modules/page/page.controller.ts` + `page.service.ts` + `apps/frontend/crs/src/api/page.ts` + `apps/frontend/crs/src/views/Home.vue`（F4）、`apps/backend/src/database/seeds/demo-page-schemas.ts` + `seed.ts` + `seed.service.ts`（F5）、`apps/backend/test/page.service.spec.ts`、`apps/frontend/cms/tests/e2e-live/*`（断言升级）。

Changes: F1 将两处 `VueDraggable` 由 `#item` 具名插槽改为默认插槽 + `v-for` 渲染 `.canvas-component`（并修正两处标签配对）；F2 注册 CRS `/page` 路由指向 `Page.vue`；F3 `buildPreviewUrl()` 改用 env `VITE_CRS_PREVIEW_URL`（fallback `http://127.0.0.1:3010/crs/#/pagePreview`），`.env` 中该值改为 `127.0.0.1` 并加引号（含 `#` 否则被 Vite 当注释截断），`env.d.ts` 补类型；F4 后端新增 `@Public() GET /atlas-cms/getPublishedPageList`（仅 published/isAbled/未删除），CRS 首页改请求该接口并跳 `/page?id=`；F5 新建 `demo-page-schemas.ts` 为 8 个演示页生成含真实组件的 schema（published 4 个），`seed.ts` 与 `seed.service.ts` 同步引用（原 `seed.ts` 不调用 seed.service 且返回空 schema，是隐藏坑）。

Verification: `pnpm --filter @cms/cms test:e2e:live` -> **11/11 passed（末次 31.8s，正向断言）**，覆盖画布 `.canvas-component` 渲染、AI 草稿画布组件、CRS 访客直连 `/page?id=` 渲染 `.page-content`、预览 iframe 200 + `.page-preview-container`、CRS 首页真实列表；`pnpm --filter @cms/backend test -- --runInBand` -> 7 用例通过（含 `page.service.spec.ts` 3 用例：published/isAbled 过滤与分页）；`@cms/backend` / `@cms/cms` / `@cms/crs` typecheck 与 backend build 通过。

Decisions: 修复范围严格限 F1–F5，不改 `packages/*` 源码；F4 采用新增公开列表接口（避免 `getPageList` 加 `@Public` 暴露草稿）；F5 为演示页填充代表性简单 schema（非完整复杂模板）；VITE_CRS_PREVIEW_URL 因含 `#` 需加引号否则被 Vite 截断；`seed.ts` 与 `seed.service.ts` 必须保持同步。

Next: 若继续治理既有 mock 套件 `tests/e2e`（F6 基线 16/26），先看本文件既有失败清单；本次未涉及 `packages/*` 与 mock 套件。

Notes for Claude: 工作区存在大量上一任务遗留的未提交改动（lead/tracking/types/ui 等，非本轮），提交前需区分本轮文件与既有改动；本轮文件集中在 `apps/frontend/cms/tests/e2e-live/*`、`apps/frontend/cms/playwright.live.config.ts`、`apps/frontend/crs/*`、`apps/backend/src/modules/page/*`、`apps/backend/src/database/*`、`apps/backend/test/page.service.spec.ts`、`apps/frontend/cms/src/views/Decorate/components/CenterCanvas.vue`、`apps/frontend/cms/src/views/Preview.vue`、`apps/frontend/cms/.env`、`apps/frontend/cms/src/env.d.ts`、`docs/E2E-FINDINGS.md`、`plan.md`。

## Action 17: 治理既有 mock 套件 F6 与遗留未提交改动收尾

Status: done

Goal: 治理 `apps/frontend/cms/tests/e2e`（mock 套件）的 11 条失败（F6），恢复 smoke-core 5/5 并让套件接近全绿；同时把 Action 14–16 的遗留未提交改动按语义分组提交到本地 `main`。不改业务源码迁就 mock，除非确认是真实回归。

Scope: `apps/frontend/cms/tests/e2e/*`（spec、`pages/*.page.ts`、`fixtures/api-mocks.ts`、`fixtures/api-mocks.setup.ts`）、`plan.md`、`docs/E2E-FINDINGS.md`；其余 Action 14–16 遗留文件仅做提交分组，不改内容。

Changes: 逐条定位根因后修复（均为 mock 侧问题，**无业务回归**）：
1. `smoke-core:4 发布并预览`——`api-mocks.setup.ts` 缺 `/atlas-cms/publishPage` 拦截，`TopHeader.saveAndPreview` 的显式发布请求被 proxy 到 3300 导致 ECONNREFUSED，发布失败不打开预览页。补 `publishPage` handler 返回 `{versionId, versionNo}`。**根因非 F1–F5 引入**：`publishPage` 调用是 Action 14 新增，mock fixture 自 `24fd264` 后未同步。
2. `activity:12 行数 10 vs 12`——mock `getPageList` 不按 `pageSize` 分页，返回全部 12 条；真实后端会按页截断。改为按 `pageNum/pageSize` 切片。
3. `activity:25 建页跳转`——`Activity.vue` 的「新增页面」现在先开 `TemplatePicker` 弹窗（Action 14 起），需点「跳过，创建空白页」才进装修页。新增 `ActivityPage.skipTemplatePicker()` / `createBlankPageAndWait()`，spec 与 page object 同步。
4. 画布 6 条（condition-rendering×2、data-binding、linkage、page-builder×2）——mock detail schema 只有 1 个组件（断言要求 ≥5）；`expectCanvasHasComponentsAtLeast` 实际用 `toHaveCount`（精确等于，与命名矛盾）；`.right-config` 类名已变为 `.page-right`。mock detail 扩为 5 个真实 registry 类型组件（Carousel/ImageNav/RichText/Notice/Product），断言改为 `expect.poll(...).toBeGreaterThanOrEqual`，选择器改 `.page-right`、画布收紧为 `.canvas-dropzone .canvas-component`。
5. `preview:18 设备选择器`——`selectDevice` 用 `getByText().click()` 命不中 el-select 选项。改为先点 `.toolbar-select` 展开下拉，再点 `.el-select-dropdown__item`。
6. `publish-rollback:27 回滚跳装修页`——Action 14 已把回滚语义改为「只切换线上版本、不覆盖草稿、不跳转装修页」。断言改为等待「线上页面已回滚」成功提示并停留在 `/activity`。
7. 附带修 `smoke-core:5 回滚恢复`：同为旧回滚语义，因 `describe.serial` 前置失败被跳过而未暴露，一并改为新语义。
8. mock detail schema 需可通过 `runPagePreflight`（发布/预览先跑发布前校验）：图片字段由空串改为内联 SVG data URI、`link` 由 `{clickType:0,data:null}` 改为 `{clickType:1,data:{url:...}}`，否则会被判「缺少图片/缺少有效链接」而拦截发布。

Verification: `pnpm --filter @cms/cms test:e2e` -> **26 passed（17.5s）**，此前为 14 passed / 11 failed / 1 did not run；`pnpm --filter @cms/cms test:e2e:live` -> **11 passed（32.2s）**，live 不回归；`pnpm --filter @cms/backend test -- --runInBand` -> 3 suites / **7 tests passed**；`@cms/backend`、`@cms/cms`、`@cms/crs` typecheck 均通过。

Decisions: 一律优先修 mock 侧（fixture/page object/断言计数），不改业务源码；确认 `smoke-core:4` 为 mock 不完整而非 F1–F5 回归；mock detail schema 扩充组件时只用 `materialRegistry` 真实类型，避免 FallbackComponent；回滚断言按 Action 14 新语义更新并如实记录；`.env.example` 不提交（`VITE_CRS_PREVIEW_URL` 属本地生效改动）；`packages/ui/tsconfig.tsbuildinfo` 为误跟踪构建产物，恢复其变更不提交内容；`视频总结.md`（用户个人文件，未跟踪）不提交。

Next: 两套 E2E（mock 26/26、live 11/11）与后端 Jest、三端 typecheck 全绿；遗留改动已按 `feat:`/`test:`/`fix:` 分组提交到本地 `main`，**未 push**（是否推送由用户决定）。

Notes for Claude: mock 套件不起 backend/CRS，`publishPage` 这类新增接口必须同步补拦截，否则会 proxy 到 3300 报 ECONNREFUSED——本次 smoke-core:4 即由此而来；`runPagePreflight` 会在发布/预览前校验图片与链接字段，mock schema 必须「可发布」；`tests/e2e`（mock）与 `tests/e2e-live`（真实链路）共享 `pages/*.page.ts`，改 page object 时需同时确认 live 不回归。

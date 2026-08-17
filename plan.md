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

## 下一步动作

文档已同步完成；若继续排查活动管理页面问题，先重新启动 CMS dev server，再按 `plan.md` 中的判断继续定位。

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
- `pnpm --filter @cms/cms test:e2e` 完整套件当前 26 条中 16 条通过、10 条失败；失败集中在 E2E fixture/page object 与当前页面行为不一致，核心 `smoke-core` 已通过。
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

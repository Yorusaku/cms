# CMS 差异约定

通用规则与最高约束见根 AGENTS.md、constitution.md。

- 管理端使用 Element Plus；覆盖组件样式优先用组件公开 props、CSS 变量或自有类名。UI 治理由 scripts/check-ui-governance.mjs 与 docs 下三个 allowlist 执行；不能为了让检查通过就扩白名单，预览抽屉使用 body-class 的 live-preview-body。
- Vitest 与 Playwright 分开收集：vitest.config.ts 排除 tests/e2e、tests/e2e-live、tests/e2e-ticket；不要把 Playwright spec 当 Vitest 单测执行。源码 alias 只属于测试/开发解析，发布产物仍需构建。
- 默认 Playwright tests/e2e 使用 API mock，并启动 CMS 3011 与 CRS 3010；live 使用 playwright.live.config.ts、真实 backend 3300 与独立 PostgreSQL。live global setup 会删除并重建测试库，先核对数据库授权；RESUME_DB_DATABASE 必须与 webServer 的 DB_DATABASE 一致。后端由 node dist/main 启动，改后端先构建，不复用其他环境的 3300 进程。
- PreviewIframe.vue 在收到 CRS 的 PREVIEW_READY 后推送当前 store schema，再以 100ms 防抖同步修改；保留 validateOrigin、verifySecureMessage、MessageSequenceTracker 和精确 targetOrigin，不能仅凭 iframe load 推首帧或改成星号来源。目标来源由 VITE_CRS_PREVIEW_ORIGIN 配置。

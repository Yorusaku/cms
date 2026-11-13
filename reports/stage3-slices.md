# 阶段 3：应用差异分片

阶段 2 验收退出 0 后开始。本报告逐条对应子文件，不以模型意见替代测试。

## apps/backend/AGENTS.md

- 本包是 CommonJS，保持 tsconfig 的 commonjs、Nest 装饰器及元数据配置；不要套前端 ESM/import.meta 用法。Jest 的 @cms/types 根入口走 test/mocks/cms-types.ts，子路径走 dist/cjs；公共契约变更要同步核对两处解析。

不知道会写错：把 ESM 的 import.meta 或源码类型入口直接搬进 Nest/Jest，会因模块体系不匹配而编译或加载失败。

源码依据：apps/backend/package.json; apps/backend/tsconfig.json; apps/backend/jest.config.cjs

- 数据库运行配置在 src/database/database.module.ts，migration CLI 配置在 src/database/data-source.ts；新增实体必须核对运行时实体注册与 migration，两处都保持 synchronize=false。迁移、回滚、seed 执行前需明确目标数据库与授权；生成 migration 必须给目标路径，不能只运行无参数脚本。

不知道会写错：只注册 CLI 实体、漏掉 Nest 运行实体会导致 repository 不可用；打开自动同步会绕过 migration 改库。

源码依据：apps/backend/src/database/database.module.ts; apps/backend/src/database/data-source.ts

- 测试使用 Jest，单次执行用根命令表的 backend Jest 命令；不要接收前端 Vitest 的 --run 参数。前端 mock E2E 不代表后端或数据库链路通过。

不知道会写错：给 Jest 传 Vitest 的 --run 会直接退出失败，聚合测试在后端处中止。

源码依据：apps/backend/package.json; reports/stage0-commands.md

- 业务异常沿用 AllExceptionsFilter 的 HTTP 200 + code/message/data，探针 /health 使用真实状态码；不要把业务接口改成常规 HTTP 错误码而不同步调用方。

不知道会写错：只改 HTTP 状态码会让依赖业务 code 的前端错误处理分支失配。

源码依据：apps/backend/src/common/filters/http-exception.filter.ts; apps/backend/src/main.ts

- 上传统一走 StorageAdapter；local 上传目录只由 resolveUploadDir() 解析，s3 不挂载本地静态目录。生产配置校验由 common/config/env-validation.ts 执行，不用开发默认凭据绕过启动失败。

不知道会写错：另外拼接上传目录会让写入位置与静态服务不一致；用开发默认凭据部署会被生产启动校验拒绝。

源码依据：apps/backend/src/main.ts; apps/backend/src/modules/upload/storage/local-storage.adapter.ts; apps/backend/src/common/config/env-validation.ts

## apps/frontend/cms/AGENTS.md

- 管理端使用 Element Plus；覆盖组件样式优先用组件公开 props、CSS 变量或自有类名。UI 治理由 scripts/check-ui-governance.mjs 与 docs 下三个 allowlist 执行；不能为了让检查通过就扩白名单，预览抽屉使用 body-class 的 live-preview-body。

不知道会写错：新增 Element 私有选择器会被 UI 治理拦住；放宽白名单则失去对后续同类覆盖的约束。

源码依据：apps/frontend/cms/src/views/Decorate/index.vue; scripts/check-ui-governance.mjs

- Vitest 与 Playwright 分开收集：vitest.config.ts 排除 tests/e2e、tests/e2e-live、tests/e2e-ticket；不要把 Playwright spec 当 Vitest 单测执行。源码 alias 只属于测试/开发解析，发布产物仍需构建。

不知道会写错：Vitest 收集 Playwright spec 会因测试运行器上下文不匹配报错，源码 alias 也会掩盖过期发布产物。

源码依据：apps/frontend/cms/vitest.config.ts; apps/frontend/cms/playwright.config.ts

- 默认 Playwright tests/e2e 使用 API mock，并启动 CMS 3011 与 CRS 3010；live 使用 playwright.live.config.ts、真实 backend 3300 与独立 PostgreSQL。live global setup 会删除并重建测试库，先核对数据库授权；RESUME_DB_DATABASE 必须与 webServer 的 DB_DATABASE 一致。后端由 node dist/main 启动，改后端先构建，不复用其他环境的 3300 进程。

不知道会写错：把 mock 通过当真实链路通过会漏掉数据库故障；测试库变量与 webServer 不一致会重建一个库、业务请求却打向另一个库。

源码依据：apps/frontend/cms/playwright.config.ts; apps/frontend/cms/playwright.live.config.ts; apps/frontend/cms/tests/e2e-live/global-setup.cjs

- PreviewIframe.vue 在收到 CRS 的 PREVIEW_READY 后推送当前 store schema，再以 100ms 防抖同步修改；保留 validateOrigin、verifySecureMessage、MessageSequenceTracker 和精确 targetOrigin，不能仅凭 iframe load 推首帧或改成星号来源。目标来源由 VITE_CRS_PREVIEW_ORIGIN 配置。

不知道会写错：仅在 iframe load 推送首帧时，CRS 异步组件监听器尚未注册会丢 schema；改用星号目标会把 schema 发往错误来源。

源码依据：apps/frontend/cms/src/components/PreviewIframe.vue

## apps/frontend/crs/AGENTS.md

- 渲染端使用 Vant；postcss.config.js 以 375px 设计稿换算 viewport 单位，layout-business 的规则保留 px。调整布局要区分营销页与 business 布局，不照搬管理端 Element Plus 的桌面尺寸。

不知道会写错：把 business 的固定 px 再按营销页换算会导致字号和布局随视口错误缩放。

源码依据：apps/frontend/crs/package.json; apps/frontend/crs/postcss.config.js

- PagePreview.vue 从父窗口接收 schema，不取代正式 Page.vue 的发布页数据加载；PREVIEW_READY 握手后才能可靠接收首帧。保留 validateOrigin、verifySecureMessage 与序列追踪，回传目标由 VITE_POSTMESSAGE_PARENT_ORIGIN 指定；两端消息密钥须一致。

不知道会写错：去掉就绪握手会丢首帧；两端消息密钥或来源不一致时验签拒绝，预览保持空白。

源码依据：apps/frontend/crs/src/views/PagePreview.vue; packages/utils/src/message-security.ts

- 预览入口必须向 SchemaRenderer 传 preview-mode，并沿 RenderNode 传到物料；预览不注入正式页的业务数据适配器。不能为了在预览里显示真实数据而复用正式页的请求注入。

不知道会写错：漏传 preview-mode 或注入正式页适配器，会让编辑预览读取真实业务记录或走正式表单行为。

源码依据：apps/frontend/crs/src/views/PagePreview.vue; apps/frontend/crs/src/views/Page.vue; apps/frontend/crs/src/components/RenderNode.vue

- 正式构建由 postcss 的 inline-cms-ui-dist-css 内联 packages/ui/dist/ui.css，再做 viewport 换算；开发态源码 alias 能显示组件不代表发布 CSS 完整，改共享物料样式后需构建上游 UI 再构建 CRS。

不知道会写错：只看开发态会漏掉发布产物缺少 ui.css，正式 CRS 的共享物料布局会塌。

源码依据：apps/frontend/crs/postcss.config.js; packages/ui/package.json

删除了“统一 2 空格缩进、统一中文注释”分片候选，因为答不出包级差异的具体后果；通用风格仍归根规则和格式工具。

删除了“运行全部测试即可完成”分片候选，因为答不出比根文件更具体的后果；各包只保留测试运行器和隔离环境差异。

## 验收命令与完整输出

命令：`node %TEMP%/cms-vue3-agent-audit-20261112/stage3-report.cjs`；退出码：0。

```text
应用分片：3；规则：13；逐条后果：13；源码路径均存在。
阶段 3 结构验收：PASS。具体规则及后果逐条见上；不声称路径检查能证明业务语义。
```

## 验收进程的完整输出

### node %TEMP%/cms-vue3-agent-audit-20261112/stage3-report.cjs

记录 ID：stage3-final-gate；退出码：0；耗时：0.159 秒；超时：false。

完整输出：

```text
apps/backend/AGENTS.md #1: - 本包是 CommonJS，保持 tsconfig 的 commonjs、Nest 装饰器及元数据配置；不要套前端 ESM/import.meta 用法。Jest 的 @cms/types 根入口走 test/mocks/cms-types.ts，子路径走 dist/cjs；公共契约变更要同步核对两处解析。
不知道会写错：把 ESM 的 import.meta 或源码类型入口直接搬进 Nest/Jest，会因模块体系不匹配而编译或加载失败。
apps/backend/AGENTS.md #2: - 数据库运行配置在 src/database/database.module.ts，migration CLI 配置在 src/database/data-source.ts；新增实体必须核对运行时实体注册与 migration，两处都保持 synchronize=false。迁移、回滚、seed 执行前需明确目标数据库与授权；生成 migration 必须给目标路径，不能只运行无参数脚本。
不知道会写错：只注册 CLI 实体、漏掉 Nest 运行实体会导致 repository 不可用；打开自动同步会绕过 migration 改库。
apps/backend/AGENTS.md #3: - 测试使用 Jest，单次执行用根命令表的 backend Jest 命令；不要接收前端 Vitest 的 --run 参数。前端 mock E2E 不代表后端或数据库链路通过。
不知道会写错：给 Jest 传 Vitest 的 --run 会直接退出失败，聚合测试在后端处中止。
apps/backend/AGENTS.md #4: - 业务异常沿用 AllExceptionsFilter 的 HTTP 200 + code/message/data，探针 /health 使用真实状态码；不要把业务接口改成常规 HTTP 错误码而不同步调用方。
不知道会写错：只改 HTTP 状态码会让依赖业务 code 的前端错误处理分支失配。
apps/backend/AGENTS.md #5: - 上传统一走 StorageAdapter；local 上传目录只由 resolveUploadDir() 解析，s3 不挂载本地静态目录。生产配置校验由 common/config/env-validation.ts 执行，不用开发默认凭据绕过启动失败。
不知道会写错：另外拼接上传目录会让写入位置与静态服务不一致；用开发默认凭据部署会被生产启动校验拒绝。
apps/frontend/cms/AGENTS.md #1: - 管理端使用 Element Plus；覆盖组件样式优先用组件公开 props、CSS 变量或自有类名。UI 治理由 scripts/check-ui-governance.mjs 与 docs 下三个 allowlist 执行；不能为了让检查通过就扩白名单，预览抽屉使用 body-class 的 live-preview-body。
不知道会写错：新增 Element 私有选择器会被 UI 治理拦住；放宽白名单则失去对后续同类覆盖的约束。
apps/frontend/cms/AGENTS.md #2: - Vitest 与 Playwright 分开收集：vitest.config.ts 排除 tests/e2e、tests/e2e-live、tests/e2e-ticket；不要把 Playwright spec 当 Vitest 单测执行。源码 alias 只属于测试/开发解析，发布产物仍需构建。
不知道会写错：Vitest 收集 Playwright spec 会因测试运行器上下文不匹配报错，源码 alias 也会掩盖过期发布产物。
apps/frontend/cms/AGENTS.md #3: - 默认 Playwright tests/e2e 使用 API mock，并启动 CMS 3011 与 CRS 3010；live 使用 playwright.live.config.ts、真实 backend 3300 与独立 PostgreSQL。live global setup 会删除并重建测试库，先核对数据库授权；RESUME_DB_DATABASE 必须与 webServer 的 DB_DATABASE 一致。后端由 node dist/main 启动，改后端先构建，不复用其他环境的 3300 进程。
不知道会写错：把 mock 通过当真实链路通过会漏掉数据库故障；测试库变量与 webServer 不一致会重建一个库、业务请求却打向另一个库。
apps/frontend/cms/AGENTS.md #4: - PreviewIframe.vue 在收到 CRS 的 PREVIEW_READY 后推送当前 store schema，再以 100ms 防抖同步修改；保留 validateOrigin、verifySecureMessage、MessageSequenceTracker 和精确 targetOrigin，不能仅凭 iframe load 推首帧或改成星号来源。目标来源由 VITE_CRS_PREVIEW_ORIGIN 配置。
不知道会写错：仅在 iframe load 推送首帧时，CRS 异步组件监听器尚未注册会丢 schema；改用星号目标会把 schema 发往错误来源。
apps/frontend/crs/AGENTS.md #1: - 渲染端使用 Vant；postcss.config.js 以 375px 设计稿换算 viewport 单位，layout-business 的规则保留 px。调整布局要区分营销页与 business 布局，不照搬管理端 Element Plus 的桌面尺寸。
不知道会写错：把 business 的固定 px 再按营销页换算会导致字号和布局随视口错误缩放。
apps/frontend/crs/AGENTS.md #2: - PagePreview.vue 从父窗口接收 schema，不取代正式 Page.vue 的发布页数据加载；PREVIEW_READY 握手后才能可靠接收首帧。保留 validateOrigin、verifySecureMessage 与序列追踪，回传目标由 VITE_POSTMESSAGE_PARENT_ORIGIN 指定；两端消息密钥须一致。
不知道会写错：去掉就绪握手会丢首帧；两端消息密钥或来源不一致时验签拒绝，预览保持空白。
apps/frontend/crs/AGENTS.md #3: - 预览入口必须向 SchemaRenderer 传 preview-mode，并沿 RenderNode 传到物料；预览不注入正式页的业务数据适配器。不能为了在预览里显示真实数据而复用正式页的请求注入。
不知道会写错：漏传 preview-mode 或注入正式页适配器，会让编辑预览读取真实业务记录或走正式表单行为。
apps/frontend/crs/AGENTS.md #4: - 正式构建由 postcss 的 inline-cms-ui-dist-css 内联 packages/ui/dist/ui.css，再做 viewport 换算；开发态源码 alias 能显示组件不代表发布 CSS 完整，改共享物料样式后需构建上游 UI 再构建 CRS。
不知道会写错：只看开发态会漏掉发布产物缺少 ui.css，正式 CRS 的共享物料布局会塌。
应用分片：3；规则：13；逐条后果：13；源码路径均存在。
阶段 3 结构验收：PASS。具体规则及后果逐条见上；不声称路径检查能证明业务语义。
```

# CRS 差异约定

通用规则与最高约束见根 AGENTS.md、constitution.md。

- 渲染端使用 Vant；postcss.config.js 以 375px 设计稿换算 viewport 单位，layout-business 的规则保留 px。调整布局要区分营销页与 business 布局，不照搬管理端 Element Plus 的桌面尺寸。
- PagePreview.vue 从父窗口接收 schema，不取代正式 Page.vue 的发布页数据加载；PREVIEW_READY 握手后才能可靠接收首帧。保留 validateOrigin、verifySecureMessage 与序列追踪，回传目标由 VITE_POSTMESSAGE_PARENT_ORIGIN 指定；两端消息密钥须一致。
- 预览入口必须向 SchemaRenderer 传 preview-mode，并沿 RenderNode 传到物料；预览不注入正式页的业务数据适配器。不能为了在预览里显示真实数据而复用正式页的请求注入。
- 正式构建由 postcss 的 inline-cms-ui-dist-css 内联 packages/ui/dist/ui.css，再做 viewport 换算；开发态源码 alias 能显示组件不代表发布 CSS 完整，改共享物料样式后需构建上游 UI 再构建 CRS。

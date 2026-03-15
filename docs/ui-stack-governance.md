# CMS/CRS UI 栈治理规范

> 适用范围：`apps/cms`、`apps/crs`、`packages/ui`

## 1. 目标

- 保持双端开发效率，不强行统一到单一 UI 库。
- 保持视觉一致性，避免 token 漂移和风格分裂。
- 降低维护成本，减少深度覆盖和 `!important` 扩散。

## 2. 分层职责（强约束）

### 2.1 UI 框架层

- `apps/cms` 使用 `Element Plus`（后台中重交互）。
- `apps/crs` 使用 `Vant`（移动端基础交互）。

### 2.2 共享业务组件层

- `packages/ui` 仅放跨端可复用业务组件。
- 共享组件不得直接依赖 `element-plus` / `vant`。

### 2.3 样式原子层

- `Tailwind` 负责布局、间距、排版、响应式和轻量视觉微调。
- 不把 Tailwind 当主题系统，不在页面里重复定义核心 token。

## 3. 选型决策

| 场景 | 首选 |
| --- | --- |
| CMS 中重交互（表单/表格/弹层） | Element Plus |
| CRS 通用移动交互 | Vant |
| 跨端业务区块 | `@cms/ui` |
| 布局与排版 | Tailwind |
| 主题一致性 | 统一 Token（CSS 变量） |

## 4. 禁止项（评审红线）

- 在 `packages/ui` 中引入 `element-plus` 或 `vant`。
- 新增全局 `.el-*` / `.van-*` 覆盖。
- 新增未审批的 `:deep(.el-*)` / `:deep(.van-*)`。
- 在 app 样式入口重复定义 `--color-primary` 等核心 token。

## 5. 样式治理规则

### 5.1 Token 单一来源

- Token 源文件：`packages/ui/src/styles/tokens.css`
- `apps/cms`、`apps/crs` 仅消费 token 并做框架变量映射。

### 5.2 深度覆盖白名单

- 白名单文件：`docs/element-deep-override-allowlist.txt`
- 新文件出现 `:deep(.el-/ .van-)` 必须先更新白名单并说明理由。

### 5.3 自动门禁

- 规则检查命令：`pnpm check:ui-governance`
- 已接入 `lint-staged`，提交时自动执行。

## 6. PR 检查清单

- [ ] 新增组件归属明确（CMS 专属 / CRS 专属 / 共享）
- [ ] 遵守“UI 库负责交互，Tailwind 负责布局”
- [ ] 未引入新的全局 `.el-*` / `.van-*` 覆盖
- [ ] 使用统一 token，不在页面写死品牌色/圆角
- [ ] `packages/ui` 保持端无关依赖
- [ ] `pnpm check:ui-governance` 通过

## 7. 关联文档

- 整改计划：`docs/ui-governance-remediation-plan.md`
- 准入检查：`docs/ui-component-admission-checklist.md`
- 覆盖清单：`docs/cms-style-override-inventory.md`

## 8. 一句话原则

同一功能只在一层实现；同一视觉只在一处定义。

# @cms/ui 组件准入检查单

> 适用范围：新增或重构 `packages/ui/src/components/*`

## 1. 复用价值

- [ ] 该组件在 CMS 与 CRS 都存在明确复用场景
- [ ] 不是单端专属业务（单端组件应留在 `apps/*`）
- [ ] 组件职责清晰，不混入页面级业务流程

## 2. 依赖边界

- [ ] 不直接依赖 `element-plus`
- [ ] 不直接依赖 `vant`
- [ ] 仅依赖 `vue`、`@cms/types`、`@cms/utils` 等端无关能力

## 3. 类型与接口

- [ ] Props 使用 TypeScript 且字段语义清晰
- [ ] Emits 定义完整（事件名、参数类型）
- [ ] 必要默认值明确，避免 `undefined` 导致渲染分支混乱

## 4. 样式与 Token

- [ ] 不写死品牌色、圆角、字号等基础视觉参数
- [ ] 优先使用统一 token（`@cms/ui/styles/tokens.css`）
- [ ] 禁止引入全局污染样式（全局 reset、全局 `.el-*` / `.van-*` 覆盖）

## 5. 渲染与性能

- [ ] 仅在必要时使用异步组件
- [ ] 无不必要的深层 watch / 深层计算
- [ ] 列表渲染具备稳定 key

## 6. 验证与门禁

- [ ] `pnpm --filter @cms/ui typecheck` 通过
- [ ] `pnpm check:ui-governance` 通过
- [ ] 在 CRS 场景中完成最小渲染验证（`@cms/ui` 被正确消费）

## 7. 变更记录（提交说明建议）

- 组件名称：
- 复用场景：
- 关键 Props/Emits：
- 样式 token 使用：
- 风险点与回滚方案：

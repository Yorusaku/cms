# UI 栈治理整改计划

## 目标

- 消除双端重复实现，统一以 `@cms/ui` 作为跨端业务组件来源。
- 统一设计 token 来源，避免多处重复定义。
- 收敛 UI 库覆盖样式，降低 `:deep(.el-*)` 和 `!important` 扩散。

## 当前状态

- `P0-1` CRS 渲染链已改为优先加载 `@cms/ui`（`RenderNode`）。
- `P0-2` Token 已集中到 `packages/ui/src/styles/tokens.css`。
- `P0-3` CMS/CRS 已通过 `@cms/ui/styles/tokens.css` 消费 token 并做库变量映射。
- `P0-4` `.gitignore` 已修正为根目录限定，避免误伤 `apps/crs/**`。
- `P0-5` 已增加 `pnpm check:ui-governance` 自动检查，并接入 `lint-staged`。
- `P0-6` CRS 本地重复 Block 组件已清理，入口统一转发 `@cms/ui`。

## 待办清单

### P1（已完成）

- [x] 清理 CRS 本地重复 Block 组件（`apps/crs/src/components/*Block.vue`）
- [x] 入口统一转发 `@cms/ui`
- [x] 建立 `@cms/ui` 组件准入模板（复用价值、端无关依赖、token 化）

### P2（进行中）

- [x] 建立“允许覆盖清单”（`docs/element-deep-override-allowlist.txt`）
- [x] 将 `SliderConfig.vue`、`ImageNavConfig.vue`、`DialogConfig.vue`、`FloatLayerConfig.vue`、`OnlineServiceConfig.vue`、`ProductConfig.vue` 从深度覆盖迁移到容器级 CSS 变量
- [ ] 继续收敛 CMS 其余 `:deep(.el-*)` 覆盖点（优先 `configs/*Config.vue`）
- [ ] 逐步替换其余 `!important` 样式为组件 API、局部容器选择器或 token

## 风险与注意事项

- 覆盖样式收敛应按页面分批进行，避免一次性改动引发回归。
- 删除遗留样式前先做可视化回归，重点关注装配页配置面板与预览页。

## 建议执行顺序

1. 先完成剩余 `configs/*Config.vue` 深度覆盖收敛。
2. 再处理 `LeftMaterial.vue` 与 `CenterCanvas.vue`。
3. 最后清理 `basic/*` 并补一轮回归测试。

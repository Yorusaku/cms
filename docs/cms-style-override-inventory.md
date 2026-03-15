# CMS 样式覆盖盘点（P2 收尾）
> 扫描日期：2026-03-15  
> 扫描规则：`.el-`、`:deep(.el-)`、`!important`  
> 扫描范围：`apps/cms/src/components`、`apps/cms/src/views`

## 当前结果

- `:deep(.el-)`：已清零
- `!important`：已清零（components/views 范围）
- `.el-*` 选择器：已清零（components/views 范围）

## 本轮关键收尾

- 清理 `ComGroup.vue` 中 `.el-slider/.el-radio-group/.el-radio` 规则，样式下沉到调用侧。
- 清理 `LeftMaterial.vue` 中 `.el-collapse-item__*` 规则，改为容器变量 + 结构后缀选择器。
- 清理 `UpLoadBox.vue`、`Preview.vue` 中 `.el-icon` 选择器，改为语义 class。

## 治理门禁

- 深度覆盖白名单：`docs/element-deep-override-allowlist.txt`
- `.el-*` 白名单：`docs/element-selector-allowlist.txt`（当前为空）
- `!important` 白名单：`docs/important-override-allowlist.txt`（当前为空）
- 检查脚本：`scripts/check-ui-governance.mjs`

## 后续建议

1. 将 `check-ui-governance` 挂到 CI 必过阶段（pre-merge）。
2. 继续收敛 `any` 与 `v-html` 历史警告，避免技术债反弹。

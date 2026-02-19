# 新项目组件重构检查报告

## 🔍 检查结果

### apps/cms/src/components/ 组件状态
✅ **正常使用的组件**：
- `NoticeConfig.vue` - 公告配置面板（合理保留）
- `PreviewIframe.vue` - 预览iframe组件（合理保留）
- `FallbackComponent.vue` - 兜底组件（合理保留）

❌ **需要清理的重复组件**（10个）：
- `Carousel.vue` - 应使用 `@cms/ui/CarouselBlock`
- `Dialog.vue` - 应使用 `@cms/ui/DialogBlock`
- `ImageNav.vue` - 应使用 `@cms/ui/ImageNavBlock`
- `Product.vue` - 应使用 `@cms/ui/ProductBlock`
- `RichText.vue` - 应使用 `@cms/ui/RichTextBlock`
- `Slider.vue` - 应使用 `@cms/ui/SliderBlock`
- `AssistLine.vue` - 应使用 `@cms/ui/AssistLineBlock`
- `FloatLayer.vue` - 应使用 `@cms/ui/FloatLayerBlock`
- `OnlineService.vue` - 应使用 `@cms/ui/OnlineServiceBlock`
- `CubeSelection.vue` - 应使用 `@cms/ui/CubeSelectionBlock`

⚠️ **异常组件**：
- `Notice.vue` - 空文件，可直接删除

### apps/crs/src/components/ 组件状态
✅ **正常使用的组件**：
- `Notice.vue` - 包装器组件（合理保留）
- `SchemaRenderer.vue` - 渲染器组件（合理保留）
- `FallbackComponent.vue` - 兜底组件（合理保留）

❌ **需要清理的重复组件**（9个）：
- `Carousel.vue` - 应使用 `@cms/ui/CarouselBlock`
- `Dialog.vue` - 应使用 `@cms/ui/DialogBlock`
- `ImageNav.vue` - 应使用 `@cms/ui/ImageNavBlock`
- `Product.vue` - 应使用 `@cms/ui/ProductBlock`
- `RichText.vue` - 应使用 `@cms/ui/RichTextBlock`
- `Slider.vue` - 应使用 `@cms/ui/SliderBlock`
- `AssistLine.vue` - 应使用 `@cms/ui/AssistLineBlock`
- `FloatLayer.vue` - 应使用 `@cms/ui/FloatLayerBlock`
- `OnlineService.vue` - 应使用 `@cms/ui/OnlineServiceBlock`
- `CubeSelection.vue` - 应使用 `@cms/ui/CubeSelectionBlock`

## 🎯 重构建议

### 立即清理项
1. 删除apps/cms中所有重复的组件文件（除了配置和工具组件）
2. 删除apps/crs中所有重复的组件文件（除了包装器和工具组件）
3. 删除空的Notice.vue文件

### 验证项
- 确认Decorate.vue正确使用@cms/ui组件
- 确认SchemaRenderer.vue正确使用@cms/ui组件
- 验证所有功能正常运行

### 预期收益
- 减少20个重复组件文件
- 统一组件使用规范
- 提升代码维护性
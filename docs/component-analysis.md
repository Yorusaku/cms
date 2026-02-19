# 组件现状分析报告

## 当前组件分布情况

### 1. packages/ui/src/components/ (共享UI组件库)
```
├── AssistLineBlock.vue      ✓ (辅助线区块组件)
├── CmsButton.vue           ✓ (CMS按钮组件)
├── CouponBlock.vue         ✓ (优惠券区块组件)
├── CubeSelectionBlock.vue  ✓ (魔方选择区块组件)
├── DialogBlock.vue         ✓ (弹窗区块组件)
├── FloatLayerBlock.vue     ✓ (浮动层区块组件)
├── ImageBlock.vue          ✓ (图片区块组件)
├── ImageNavBlock.vue       ✓ (图片导航区块组件)
├── NoticeBlock.vue         ✓ (公告区块组件)
├── OnlineServiceBlock.vue  ✓ (在线客服区块组件)
├── ProductBlock.vue        ✓ (商品区块组件)
├── RichTextBlock.vue       ✓ (富文本区块组件)
├── SliderBlock.vue         ✓ (滑块区块组件)
└── index.ts                ✓ (导出配置)
```

### 2. apps/cms/src/components/ (CMS管理端组件)
```
├── AssistLine.vue          ✗ (重复 - 应使用@cms/ui)
├── Carousel.vue            ✗ (缺失 - 应添加到@cms/ui)
├── CubeSelection.vue       ✗ (重复 - 应使用@cms/ui)
├── Dialog.vue              ✗ (重复 - 应使用@cms/ui)
├── FallbackComponent.vue   ✓ (兜底组件 - 保留)
├── FloatLayer.vue          ✗ (重复 - 应使用@cms/ui)
├── ImageNav.vue            ✗ (重复 - 应使用@cms/ui)
├── NoticeConfig.vue        ✓ (配置面板 - 保留)
├── OnlineService.vue       ✗ (重复 - 应使用@cms/ui)
├── PreviewIframe.vue       ✓ (预览iframe - 保留)
├── Product.vue             ✗ (重复 - 应使用@cms/ui)
├── RichText.vue            ✗ (重复 - 应使用@cms/ui)
└── Slider.vue              ✗ (重复 - 应使用@cms/ui)
```

### 3. apps/crs/src/components/ (CRS客户端组件)
```
├── AssistLine.vue          ✗ (重复 - 应使用@cms/ui)
├── Carousel.vue            ✗ (重复 - 应使用@cms/ui)
├── CubeSelection.vue       ✗ (重复 - 应使用@cms/ui)
├── Dialog.vue              ✗ (重复 - 应使用@cms/ui)
├── FallbackComponent.vue   ✓ (兜底组件 - 保留)
├── FloatLayer.vue          ✗ (重复 - 应使用@cms/ui)
├── ImageNav.vue            ✗ (重复 - 应使用@cms/ui)
├── Notice.vue              ✓ (包装器组件 - 合理)
├── OnlineService.vue       ✗ (重复 - 应使用@cms/ui)
├── Product.vue             ✗ (重复 - 应使用@cms/ui)
├── RichText.vue            ✗ (重复 - 应使用@cms/ui)
├── SchemaRenderer.vue      ✓ (渲染器 - 保留)
├── Slider.vue              ✗ (重复 - 应使用@cms/ui)
└── index.ts               ✓ (导出配置)
```

## 组件依赖关系分析

### CMS应用依赖情况
- 直接依赖本地组件：11个（大量重复）
- 依赖@cms/ui组件：1个（NoticeDefaultConfig）
- 问题：没有充分利用共享组件库

### CRS应用依赖情况
- 直接依赖@cms/ui组件：2个（NoticeBlock, INoticeProps）
- 依赖本地包装组件：11个（大部分可优化）
- 问题：部分合理使用，但仍有大量重复

## 重复组件统计

| 组件名称 | UI库 | CMS | CRS | 状态 |
|---------|------|-----|-----|------|
| AssistLine | ✓Block | ✗ | ✗ | 需统一 |
| Carousel | ✗ | ✓ | ✓ | 需补充到UI库 |
| CubeSelection | ✓Block | ✓ | ✓ | 需统一 |
| Dialog | ✓Block | ✓ | ✓ | 需统一 |
| FloatLayer | ✓Block | ✓ | ✓ | 需统一 |
| ImageNav | ✓Block | ✓ | ✓ | 需统一 |
| Notice | ✓Block | Config | Wrapper | 合理分工 |
| OnlineService | ✓Block | ✓ | ✓ | 需统一 |
| Product | ✓Block | ✓ | ✓ | 需统一 |
| RichText | ✓Block | ✓ | ✓ | 需统一 |
| Slider | ✓Block | ✓ | ✓ | 需统一 |

## 重构优先级建议

### P0 (立即处理)
1. 补充Carousel组件到@cms/ui
2. 统一所有Block后缀组件的使用
3. 建立组件依赖规范

### P1 (短期优化)
1. 移除CMS和CRS中的重复组件
2. 完善组件类型定义
3. 建立组件测试

### P2 (长期完善)
1. 性能优化和懒加载
2. 组件文档完善
3. 开发工具链优化
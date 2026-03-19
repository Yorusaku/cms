# 共享物料注册表与新增物料规范

## 目标

共享物料体系的唯一入口已经收敛到共享层：

- `packages/types` 负责物料 DSL、类型约束和配置协议
- `packages/ui` 负责物料 definition、默认配置和运行时组件
- `apps/cms` 只负责把 DSL 渲染成后台配置 UI
- `apps/crs` 只负责消费 registry 做运行时渲染

后续新增物料时，默认目标是“不改 `apps/cms` 和 `apps/crs` 的业务映射文件”。

## 当前约束

- 统一注册入口：`packages/ui/src/materials/definitions.ts`
- 统一导出入口：`packages/ui/src/materials/index.ts`
- 统一类型入口：`packages/types/src/materials.ts`
- `type` 必须使用规范值，保存时只输出规范值
- `aliases` 只用于导入兼容和运行时兜底，不用于新数据保存
- 已迁移物料使用 `editorConfig.mode = "schema"`
- 未迁移老物料允许临时使用 `editorConfig.mode = "legacy"`，但也必须先注册进 registry
- CMS 侧旧 `components/configs/*.vue` 已下线，右侧配置统一由 `MaterialConfigRenderer` 基于 schema 渲染
- `@cms/ui` 根导出不再提供物料组件的静态导出，运行时统一通过 registry 的异步组件加载
- 为兼容历史 `import { NoticeBlock } from "@cms/ui"` 用法，根导出增加了 `legacy-components` 兼容层（底层仍是 registry 异步解析）

## 一个新物料的标准接入步骤

1. 在 `packages/ui/src/components/` 新增运行时物料组件。
2. 为物料补齐 props 类型、默认配置、兼容别名和必要的 props 归一化逻辑。
3. 在 `packages/ui/src/materials/definitions.ts` 新增对应 `MaterialDefinition`。
4. 如果现有字段 DSL 足够表达配置面板，直接声明 `editorConfig.schema`。
5. 只有当 DSL 无法表达该物料配置时，才允许短期挂 `editorConfig.mode = "legacy"`。
6. 补测试，至少覆盖 registry 解析、历史别名兼容和核心配置更新行为。

## MaterialDefinition 必填项

每个物料 definition 至少要声明这些字段：

- `type`
- `aliases`
- `group`
- `label`
- `icon`
- `maxCount`
- `defaultProps`
- `runtimeComponent`
- `editorConfig`

按需补充：

- `normalizeProps`
- `toRuntimeProps`

## editor schema 设计规则

第一阶段共享 DSL 的固定集合如下：

- `section`
- `text`
- `textarea`
- `number`
- `switch`
- `select`
- `color`
- `image`
- `richText`
- `array`
- `link`
- `visibleWhen`

约束说明：

- 共享层只描述字段语义，不感知 Element Plus、Vant 或其他 UI 组件
- CMS 字段渲染能力统一落在 `apps/cms/src/views/Decorate/components/MaterialFieldRenderer.vue`
- 如果只是缺一个通用字段语义，优先扩展 DSL 和通用字段渲染器
- 不允许为了单个新物料再新增专用 CMS 配置组件，除非确认属于阶段性 `legacy` 兜底

## 禁止事项

以下做法不再允许新增：

- 在 `apps/cms` 新增新的 `type -> defaultProps` 业务映射
- 在 `apps/cms` 新增新的 `type -> config component` 业务映射
- 在 `apps/crs` 新增新的 `type -> runtime component` 业务映射
- 在保存链路输出 alias、小写 type 或历史命名
- 绕过 registry 直接在应用层拼装物料元数据

## 迁移老物料的建议顺序

1. 先把老物料注册进 registry，哪怕先走 `legacy`。
2. 补 `normalizeProps`，把历史数据入口先统一。
3. 梳理该物料是否能被现有 DSL 描述。
4. 能描述就切到 `editorConfig.schema`，并删除对应专用配置组件依赖。
5. 全量迁移完成后，再清理 CMS 遗留映射和旧配置组件。

## 验收标准

满足下面条件，才算真正接入了“新体系物料”：

- 新增物料时不需要修改 `apps/cms` 和 `apps/crs` 中任何业务映射文件
- 左侧物料面板可以直接从 registry 展示该物料
- CMS 画布和 CRS 运行时都能通过 `resolveMaterialDefinition()` 解析组件
- 历史别名和旧 type 可以被 `normalizeMaterialType()` 兼容
- 保存结果只输出规范 type

## 首批迁移基线

当前已经按新体系迁移的物料：

- `Carousel`
- `ImageNav`
- `RichText`
- `Notice`
- `Dialog`
- `Product`
- `CubeSelection`
- `AssistLine`
- `FloatLayer`
- `OnlineService`
- `Slider`

覆盖能力：

- 图片列表型配置
- 导航数组型配置
- 富文本型配置
- 条件显隐字段配置
- 位置/尺寸类配置
- 运行时 link 兼容转换（对象到字符串）

# API 文档

## 一、usePageStore - 页面状态管理

### 1.1 概述

`usePageStore` 是编辑器的核心状态管理模块，负责管理页面 Schema、编辑状态、历史记录等。

### 1.2 初始化

```typescript
import { usePageStore } from "@/store/usePageStore";

const pageStore = usePageStore();
```

### 1.3 状态属性

```typescript
// 页面数据
pageStore.pageSchema: IPageSchemaV2;           // 当前页面 Schema
pageStore.pageConfig: IPageSchemaV2["pageConfig"]; // 页面配置

// 编辑状态
pageStore.activeComponentId: string | null;    // 当前选中组件 ID
pageStore.selectedComponentIds: string[];      // 多选组件 ID 列表

// 历史记录
pageStore.history: IPageSchemaV2[];            // 历史记录列表
pageStore.historyIndex: number;                // 当前历史记录索引
pageStore.canUndo: boolean;                    // 是否可以撤销
pageStore.canRedo: boolean;                    // 是否可以重做

// 计算属性
pageStore.sortableComponents: IComponentSchemaV2[]; // 排序后的根组件列表
pageStore.activeComponent: IComponentSchemaV2 | null; // 当前选中组件
```

### 1.4 方法

#### setInitPageSchema(schema: IPageSchemaV2)
初始化页面 Schema。

```typescript
pageStore.setInitPageSchema({
  version: "2.0.0",
  pageConfig: { name: "My Page" },
  componentMap: {},
  rootIds: [],
});
```

#### setPageConfig(config: Partial<IPageSchemaV2["pageConfig"]>)
更新页面配置。

```typescript
pageStore.setPageConfig({
  name: "Updated Page",
  backgroundColor: "#ffffff",
});
```

#### setActiveId(id: string)
设置当前选中的组件。

```typescript
pageStore.setActiveId("component-1");
```

#### toggleComponentSelection(id: string)
切换组件的多选状态。

```typescript
pageStore.toggleComponentSelection("component-1");
```

#### addComponent(component: IComponentSchemaV2, parentId?: string)
添加组件。

```typescript
pageStore.addComponent({
  id: "new-component",
  type: "NoticeBlock",
  props: { title: "Notice" },
  children: [],
});
```

#### removeComponent(id: string)
删除组件。

```typescript
pageStore.removeComponent("component-1");
```

#### deleteComponent(options: { index: number })
按索引删除根组件。

```typescript
pageStore.deleteComponent({ index: 0 });
```

#### deleteActiveComponent()
删除当前选中的组件。

```typescript
pageStore.deleteActiveComponent();
```

#### updateComponent(id: string, updates: Partial<IComponentSchemaV2>)
更新组件。

```typescript
pageStore.updateComponent("component-1", {
  props: { title: "Updated Title" },
});
```

#### duplicateComponent(options: { id: string })
复制组件。

```typescript
pageStore.duplicateComponent({ id: "component-1" });
```

#### moveComponent(options: { from: number; to: number })
移动组件位置。

```typescript
pageStore.moveComponent({ from: 0, to: 1 });
```

#### reorderRootIds(ids: string[])
重新排序根组件。

```typescript
pageStore.reorderRootIds(["comp-2", "comp-1", "comp-3"]);
```

#### undo()
撤销上一步操作。

```typescript
if (pageStore.canUndo) {
  pageStore.undo();
}
```

#### redo()
重做下一步操作。

```typescript
if (pageStore.canRedo) {
  pageStore.redo();
}
```

### 1.5 示例

```typescript
import { usePageStore } from "@/store/usePageStore";

const pageStore = usePageStore();

// 初始化页面
pageStore.setInitPageSchema({
  version: "2.0.0",
  pageConfig: { name: "My Page" },
  componentMap: {},
  rootIds: [],
});

// 添加组件
pageStore.addComponent({
  id: "notice-1",
  type: "NoticeBlock",
  props: { title: "Welcome" },
});

// 选中组件
pageStore.setActiveId("notice-1");

// 更新组件
pageStore.updateComponent("notice-1", {
  props: { title: "Updated Welcome" },
});

// 撤销
pageStore.undo();

// 重做
pageStore.redo();
```

---

## 二、usePageDraft - 草稿管理

### 2.1 概述

`usePageDraft` 负责管理页面草稿的保存和加载。

### 2.2 方法

#### loadPageDraft(pageId: string): Promise<IPageSchemaV2>
加载页面草稿。

```typescript
const schema = await usePageDraft().loadPageDraft("page-123");
```

#### savePageDraft(pageId: string, schema: IPageSchemaV2): Promise<void>
保存页面草稿。

```typescript
await usePageDraft().savePageDraft("page-123", schema);
```

#### clearPageDraft(pageId: string): Promise<void>
清除页面草稿。

```typescript
await usePageDraft().clearPageDraft("page-123");
```

#### getLastSaveTime(pageId: string): number
获取最后保存时间。

```typescript
const timestamp = usePageDraft().getLastSaveTime("page-123");
```

### 2.3 示例

```typescript
import { usePageDraft } from "@/hooks/usePageDraft";

const pageDraft = usePageDraft();

// 加载草稿
const schema = await pageDraft.loadPageDraft("page-123");

// 保存草稿
await pageDraft.savePageDraft("page-123", schema);

// 获取最后保存时间
const lastSaveTime = pageDraft.getLastSaveTime("page-123");
console.log("Last saved:", new Date(lastSaveTime));
```

---

## 三、usePagePublish - 发布管理

### 3.1 概述

`usePagePublish` 负责管理页面的发布、回滚和发布记录。

### 3.2 方法

#### getLocalPublishLogs(pageId: string): PublishLog[]
获取本地发布记录。

```typescript
const logs = usePagePublish().getLocalPublishLogs("page-123");
```

#### markPageDraft(pageId: string)
标记页面为草稿状态。

```typescript
usePagePublish().markPageDraft("page-123");
```

#### publishPage(pageId: string, schema: IPageSchemaV2, remark: string): Promise<PublishLog>
发布页面。

```typescript
const log = await usePagePublish().publishPage(
  "page-123",
  schema,
  "Initial publish"
);
```

#### rollbackPage(pageId: string, version: number): Promise<PublishLog>
回滚到指定版本。

```typescript
const log = await usePagePublish().rollbackPage("page-123", 1);
```

#### getPublishLog(pageId: string, version: number): PublishLog | null
获取指定版本的发布记录。

```typescript
const log = usePagePublish().getPublishLog("page-123", 1);
```

### 3.3 示例

```typescript
import { usePagePublish } from "@/hooks/usePagePublish";

const pagePublish = usePagePublish();

// 获取发布记录
const logs = pagePublish.getLocalPublishLogs("page-123");
console.log("Publish logs:", logs);

// 发布页面
const publishLog = await pagePublish.publishPage(
  "page-123",
  schema,
  "Release v1.0"
);
console.log("Published version:", publishLog.version);

// 回滚到上一个版本
const rollbackLog = await pagePublish.rollbackPage("page-123", publishLog.version - 1);
console.log("Rolled back to version:", rollbackLog.version);
```

---

## 四、UI 组件库

### 4.1 NoticeBlock - 通知块

**用途：** 显示通知、公告等信息。

**Props：**
```typescript
interface NoticeBlockProps {
  title: string;              // 标题
  content: string;            // 内容
  type?: "info" | "success" | "warning" | "error"; // 类型
  closable?: boolean;         // 是否可关闭
  icon?: string;              // 图标
}
```

**使用示例：**
```vue
<NoticeBlock
  title="Important Notice"
  content="This is an important message"
  type="warning"
  :closable="true"
/>
```

### 4.2 CarouselBlock - 轮播块

**用途：** 显示图片或内容轮播。

**Props：**
```typescript
interface CarouselBlockProps {
  items: Array<{
    id: string;
    image: string;
    title?: string;
    link?: string;
  }>;
  autoplay?: boolean;         // 自动播放
  interval?: number;          // 播放间隔（毫秒）
  height?: string;            // 高度
}
```

**使用示例：**
```vue
<CarouselBlock
  :items="[
    { id: '1', image: 'url1', title: 'Slide 1' },
    { id: '2', image: 'url2', title: 'Slide 2' },
  ]"
  :autoplay="true"
  :interval="3000"
/>
```

### 4.3 ProductBlock - 产品块

**用途：** 显示产品信息。

**Props：**
```typescript
interface ProductBlockProps {
  productId: string;          // 产品 ID
  title: string;              // 产品名称
  price: number;              // 价格
  image: string;              // 产品图片
  description?: string;       // 描述
  link?: string;              // 链接
}
```

**使用示例：**
```vue
<ProductBlock
  product-id="prod-123"
  title="Amazing Product"
  :price="99.99"
  image="product.jpg"
  description="This is an amazing product"
/>
```

### 4.4 ImageBlock - 图片块

**用途：** 显示图片。

**Props：**
```typescript
interface ImageBlockProps {
  src: string;                // 图片 URL
  alt?: string;               // 替代文本
  width?: string;             // 宽度
  height?: string;            // 高度
  link?: string;              // 链接
}
```

**使用示例：**
```vue
<ImageBlock
  src="image.jpg"
  alt="Description"
  width="100%"
  height="300px"
/>
```

### 4.5 TextBlock - 文本块

**用途：** 显示文本内容。

**Props：**
```typescript
interface TextBlockProps {
  content: string;            // 文本内容
  fontSize?: string;          // 字体大小
  color?: string;             // 文字颜色
  align?: "left" | "center" | "right"; // 对齐方式
}
```

**使用示例：**
```vue
<TextBlock
  content="Hello World"
  font-size="16px"
  color="#333"
  align="center"
/>
```

### 4.6 ButtonBlock - 按钮块

**用途：** 显示按钮。

**Props：**
```typescript
interface ButtonBlockProps {
  text: string;               // 按钮文本
  type?: "primary" | "success" | "warning" | "danger"; // 类型
  size?: "small" | "medium" | "large"; // 大小
  link?: string;              // 链接
  onClick?: () => void;       // 点击回调
}
```

**使用示例：**
```vue
<ButtonBlock
  text="Click Me"
  type="primary"
  size="large"
  @click="handleClick"
/>
```

### 4.7 FormBlock - 表单块

**用途：** 显示表单。

**Props：**
```typescript
interface FormBlockProps {
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "email" | "number" | "textarea";
    required?: boolean;
  }>;
  submitText?: string;        // 提交按钮文本
  onSubmit?: (data: any) => void; // 提交回调
}
```

**使用示例：**
```vue
<FormBlock
  :fields="[
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'message', label: 'Message', type: 'textarea' },
  ]"
  submit-text="Send"
  @submit="handleSubmit"
/>
```

### 4.8 TableBlock - 表格块

**用途：** 显示表格数据。

**Props：**
```typescript
interface TableBlockProps {
  columns: Array<{
    key: string;
    label: string;
    width?: string;
  }>;
  data: Array<Record<string, any>>;
  pagination?: {
    pageSize: number;
    total: number;
  };
}
```

**使用示例：**
```vue
<TableBlock
  :columns="[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ]"
  :data="[
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' },
  ]"
/>
```

### 4.9 ChartBlock - 图表块

**用途：** 显示图表。

**Props：**
```typescript
interface ChartBlockProps {
  type: "line" | "bar" | "pie" | "area"; // 图表类型
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
  options?: any;              // 图表选项
}
```

**使用示例：**
```vue
<ChartBlock
  type="bar"
  :data="{
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { label: 'Sales', data: [100, 200, 150] },
    ],
  }"
/>
```

### 4.10 VideoBlock - 视频块

**用途：** 显示视频。

**Props：**
```typescript
interface VideoBlockProps {
  src: string;                // 视频 URL
  poster?: string;            // 封面图片
  width?: string;             // 宽度
  height?: string;            // 高度
  controls?: boolean;         // 显示控制条
  autoplay?: boolean;         // 自动播放
}
```

**使用示例：**
```vue
<VideoBlock
  src="video.mp4"
  poster="poster.jpg"
  width="100%"
  height="400px"
  :controls="true"
/>
```

---

## 五、工具函数

### 5.1 editor-optimization.ts

#### createDebounce(fn, options)
创建防抖函数。

```typescript
import { createDebounce } from "@/utils/editor-optimization";

const debouncedSave = createDebounce(
  () => savePageDraft(pageId, schema),
  { wait: 300, trailing: true }
);
```

#### createThrottle(fn, options)
创建节流函数。

```typescript
import { createThrottle } from "@/utils/editor-optimization";

const throttledScroll = createThrottle(
  (event) => handleScroll(event),
  { wait: 16 }
);
```

#### createRAFThrottle(fn)
创建 RAF 节流函数。

```typescript
import { createRAFThrottle } from "@/utils/editor-optimization";

const rafThrottledDrag = createRAFThrottle(
  (event) => handleDrag(event)
);
```

#### ComponentRenderCache
组件渲染缓存。

```typescript
import { ComponentRenderCache } from "@/utils/editor-optimization";

const cache = new ComponentRenderCache(100);
cache.set("component-1", renderedComponent);
const cached = cache.get("component-1");
```

### 5.2 performance-monitor.ts

#### getPerformanceMonitor()
获取性能监控实例。

```typescript
import { getPerformanceMonitor } from "@/utils/performance-monitor";

const monitor = getPerformanceMonitor();
```

#### markStart(name)
标记测量开始。

```typescript
monitor.markStart("editor-init");
```

#### markEnd(name, metricName?)
标记测量结束。

```typescript
monitor.markEnd("editor-init", "editorInitTime");
```

#### getVitals()
获取 Core Web Vitals。

```typescript
const vitals = monitor.getVitals();
console.log("LCP:", vitals.lcp);
```

#### getReport()
获取完整的性能报告。

```typescript
const report = monitor.getReport();
```

#### onReport(callback)
注册性能报告回调。

```typescript
const unsubscribe = monitor.onReport((report) => {
  console.log("Performance report:", report);
});
```

---

## 六、类型定义

### 6.1 IPageSchemaV2

```typescript
interface IPageSchemaV2 {
  version: "2.0.0";
  pageConfig: {
    name: string;
    shareDesc: string;
    shareImage: string;
    backgroundColor: string;
    backgroundImage: string;
    backgroundPosition: "top" | "center" | "bottom";
    cover: string;
  };
  componentMap: Record<string, IComponentSchemaV2>;
  rootIds: string[];
  state?: Record<string, unknown>;
}
```

### 6.2 IComponentSchemaV2

```typescript
interface IComponentSchemaV2 {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[];
  events?: Record<string, unknown>;
  styles?: Record<string, unknown>;
}
```

### 6.3 PublishLog

```typescript
interface PublishLog {
  id: string;
  pageId: string;
  version: number;
  schema: IPageSchemaV2;
  operator: string;
  publishTime: number;
  remark: string;
  status: "published" | "rollbacked";
}
```

---

## 七、常见问题

**Q: 如何获取当前选中的组件？**
A: 使用 `pageStore.activeComponent` 获取当前选中的组件。

**Q: 如何添加多个组件？**
A: 使用 `pageStore.addComponent()` 多次调用，或使用 `createBatchUpdate()` 批量更新。

**Q: 如何监听状态变化？**
A: 使用 `watch()` 监听 `pageStore.pageSchema` 的变化。

**Q: 如何自定义 UI 组件？**
A: 在 `packages/ui/src/components/` 中创建新组件，然后在 `index.ts` 中导出。

**Q: 如何扩展 Schema 协议？**
A: 修改 `packages/types/src/schema.ts` 中的类型定义，然后更新相关处理逻辑。

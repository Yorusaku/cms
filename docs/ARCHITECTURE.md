# CMS 可视化搭建平台 - 架构设计文档

## 一、项目概览

### 1.1 项目定位

CMS 可视化搭建平台是一个低代码/可视化编辑平台，允许用户通过拖拽、配置等方式快速搭建页面，无需编写代码。

**核心价值：**
- 降低页面搭建门槛
- 提升内容编辑效率
- 支持复杂业务场景

### 1.2 核心功能

| 功能 | 说明 |
|------|------|
| 可视化编辑 | 拖拽式编辑器，支持组件拖拽、配置、预览 |
| 组件系统 | 14+ 业务组件，支持自定义扩展 |
| 发布流程 | 草稿/发布双轨，支持版本管理和回滚 |
| 编辑器效率 | 搜索、快捷键、批量配置、撤销重做 |
| 性能优化 | 虚拟滚动、防抖节流、组件缓存 |

### 1.3 技术栈

```
前端框架：Vue 3 + TypeScript
构建工具：Vite
状态管理：Pinia
UI 框架：Element Plus（部分）+ 原生组件
包管理：pnpm
项目管理：Turbo（Monorepo）
测试框架：Vitest + Playwright
代码质量：ESLint + Prettier + TypeScript
```

---

## 二、整体架构

### 2.1 Monorepo 结构

```
cms-vue3/
├── apps/
│   ├── cms/                    # 编辑器应用
│   │   ├── src/
│   │   │   ├── views/          # 页面组件
│   │   │   ├── components/     # 通用组件
│   │   │   ├── store/          # Pinia 状态管理
│   │   │   ├── utils/          # 工具函数
│   │   │   ├── hooks/          # 自定义 hooks
│   │   │   └── tests/          # 测试文件
│   │   └── vite.config.ts
│   └── crs/                    # 渲染器应用（预览/发布）
├── packages/
│   ├── ui/                     # UI 组件库
│   ├── utils/                  # 工具函数库
│   ├── types/                  # TypeScript 类型定义
│   ├── hooks/                  # 共享 hooks
│   ├── eslint-config/          # ESLint 配置
│   ├── prettier-config/        # Prettier 配置
│   └── test-utils/             # 测试工具
└── turbo.json                  # Turbo 配置
```

### 2.2 应用划分

**cms（编辑器应用）：**
- 负责页面编辑、配置、预览
- 提供完整的编辑器 UI
- 管理编辑状态和历史记录

**crs（渲染器应用）：**
- 负责页面预览和发布
- 根据 Schema 动态渲染页面
- 支持数据绑定和动态交互

### 2.3 包划分

| 包 | 职责 |
|------|------|
| @cms/ui | UI 组件库（NoticeBlock、CarouselBlock 等） |
| @cms/utils | 工具函数（Schema 处理、数据转换等） |
| @cms/types | TypeScript 类型定义 |
| @cms/hooks | 共享 hooks（usePageStore、usePageDraft 等） |
| @cms/eslint-config | ESLint 规则配置 |
| @cms/prettier-config | 代码格式化配置 |
| @cms/test-utils | 测试工具和 mock 数据 |

---

## 三、Schema V2 协议设计

### 3.1 协议版本演进

**V1 版本（已弃用）：**
- 简单的组件树结构
- 不支持复杂嵌套
- 扩展性差

**V2 版本（当前）：**
- 基于 componentMap 的扁平化设计
- 支持任意深度的组件嵌套
- 易于序列化和扩展
- 支持状态管理

### 3.2 数据结构设计

```typescript
// 页面 Schema
interface IPageSchemaV2 {
  version: "2.0.0";
  pageConfig: {
    name: string;                    // 页面名称
    shareDesc: string;               // 分享描述
    shareImage: string;              // 分享图片
    backgroundColor: string;         // 背景颜色
    backgroundImage: string;         // 背景图片
    backgroundPosition: "top" | "center" | "bottom";
    cover: string;                   // 页面封面
  };
  componentMap: Record<string, IComponentSchemaV2>;  // 组件映射表
  rootIds: string[];                 // 根组件 ID 列表
  state?: Record<string, unknown>;   // 页面全局状态
}

// 组件 Schema
interface IComponentSchemaV2 {
  id: string;                        // 组件唯一 ID
  type: string;                      // 组件类型
  props: Record<string, unknown>;    // 组件属性
  children?: string[];               // 子组件 ID 列表
  events?: Record<string, unknown>;  // 事件配置
  styles?: Record<string, unknown>;  // 样式配置
}
```

### 3.3 设计优势

**1. 数据与视图分离**
- Schema 是纯数据结构，不包含 Vue 组件实例
- 易于序列化、存储、传输
- 支持跨平台渲染

**2. 支持组件嵌套**
- 通过 children 字段支持任意深度嵌套
- 通过 componentMap 快速查找组件
- 避免深层对象嵌套导致的性能问题

**3. 易于扩展**
- 新增字段不影响现有逻辑
- 支持自定义属性和事件
- 支持插件系统

**4. 易于序列化**
- 纯 JSON 结构，无循环引用
- 支持 localStorage、IndexedDB 存储
- 支持网络传输

### 3.4 组件嵌套机制

```typescript
// 示例：创建嵌套组件结构
const schema: IPageSchemaV2 = {
  version: "2.0.0",
  pageConfig: { /* ... */ },
  componentMap: {
    "root-1": {
      id: "root-1",
      type: "Container",
      props: { layout: "flex" },
      children: ["child-1", "child-2"],
    },
    "child-1": {
      id: "child-1",
      type: "NoticeBlock",
      props: { title: "Notice" },
      children: [],
    },
    "child-2": {
      id: "child-2",
      type: "Container",
      props: { layout: "grid" },
      children: ["grandchild-1"],
    },
    "grandchild-1": {
      id: "grandchild-1",
      type: "ProductBlock",
      props: { productId: "123" },
    },
  },
  rootIds: ["root-1"],
};

// 获取组件树
function getComponentTree(schema: IPageSchemaV2, componentId: string) {
  const component = schema.componentMap[componentId];
  if (!component) return null;

  return {
    ...component,
    children: (component.children || []).map((childId) =>
      getComponentTree(schema, childId)
    ),
  };
}
```

### 3.5 状态管理

```typescript
// 页面全局状态示例
const schema: IPageSchemaV2 = {
  // ...
  state: {
    currentUser: { id: "123", name: "John" },
    theme: "light",
    locale: "zh-CN",
  },
};

// 组件可以访问全局状态
interface IComponentSchemaV2 {
  // ...
  props: {
    // 支持状态绑定
    userName: "${state.currentUser.name}",
    isDarkMode: "${state.theme === 'dark'}",
  };
}
```

---

## 四、编辑器架构

### 4.1 三板斧设计

编辑器采用"三板斧"设计模式：

```
┌─────────────────────────────────────────────────┐
│                   TopHeader                      │
│  (保存草稿 | 发布 | 发布记录 | 预览)             │
├──────────────┬──────────────┬──────────────────┤
│              │              │                  │
│ LeftMaterial │ CenterCanvas │  RightConfig    │
│              │              │                  │
│  物料库      │   编辑画布   │   配置面板       │
│              │              │                  │
│ - 搜索       │ - 拖拽       │ - 属性编辑       │
│ - 分类       │ - 选中       │ - 样式编辑       │
│ - 预览       │ - 删除       │ - 事件配置       │
│              │ - 复制       │                  │
│              │ - 撤销/重做  │                  │
└──────────────┴──────────────┴──────────────────┘
```

### 4.2 数据流向

```
用户操作
  ↓
事件处理（CenterCanvas / RightConfig）
  ↓
Pinia 状态更新（usePageStore）
  ↓
Schema 更新
  ↓
视图重新渲染
  ↓
草稿自动保存（防抖）
```

### 4.3 状态管理（Pinia）

**usePageStore 核心状态：**

```typescript
interface PageStore {
  // 页面数据
  pageSchema: IPageSchemaV2;
  
  // 编辑状态
  activeComponentId: string | null;
  selectedComponentIds: string[];
  
  // 历史记录
  history: IPageSchemaV2[];
  historyIndex: number;
  
  // 方法
  setInitPageSchema(schema: IPageSchemaV2): void;
  setPageConfig(config: Partial<IPageSchemaV2["pageConfig"]>): void;
  setActiveId(id: string): void;
  addComponent(component: IComponentSchemaV2): void;
  removeComponent(id: string): void;
  updateComponent(id: string, updates: Partial<IComponentSchemaV2>): void;
  undo(): void;
  redo(): void;
}
```

### 4.4 事件系统

```typescript
// 编辑器事件
interface EditorEvents {
  "component:select": { componentId: string };
  "component:add": { component: IComponentSchemaV2 };
  "component:remove": { componentId: string };
  "component:update": { componentId: string; updates: any };
  "component:move": { from: number; to: number };
  "page:save": { schema: IPageSchemaV2 };
  "page:publish": { schema: IPageSchemaV2 };
}

// 事件发射
const emit = defineEmits<EditorEvents>();
emit("component:select", { componentId: "comp-1" });
```

---

## 五、组件系统

### 5.1 组件注册机制

```typescript
// 组件注册表
const componentRegistry = new Map<string, ComponentDefinition>();

interface ComponentDefinition {
  name: string;
  component: Component;
  icon: string;
  category: string;
  defaultProps: Record<string, unknown>;
  schema: JSONSchema;
}

// 注册组件
function registerComponent(definition: ComponentDefinition) {
  componentRegistry.set(definition.name, definition);
}

// 获取组件
function getComponent(type: string) {
  return componentRegistry.get(type)?.component;
}
```

### 5.2 组件库结构

```
packages/ui/src/components/
├── NoticeBlock/
│   ├── NoticeBlock.vue
│   ├── NoticeBlock.ts (类型定义)
│   └── __tests__/
├── CarouselBlock/
├── ProductBlock/
├── ImageBlock/
├── TextBlock/
├── ButtonBlock/
├── FormBlock/
├── TableBlock/
├── ChartBlock/
├── VideoBlock/
├── MapBlock/
├── CustomBlock/
└── index.ts (导出)
```

### 5.3 物料系统

**物料脚手架：**
```bash
# 自动生成组件模板
pnpm run scaffold:component --name MyComponent --category business
```

**生成的文件结构：**
```
packages/ui/src/components/MyComponent/
├── MyComponent.vue
├── MyComponent.ts
├── __tests__/
│   └── MyComponent.test.ts
└── README.md
```

### 5.4 组件治理

**UI 治理门禁：**
- 样式覆盖白名单（element-deep-override-allowlist.txt）
- 选择器白名单（element-selector-allowlist.txt）
- 重要样式覆盖白名单（important-override-allowlist.txt）

**治理流程：**
```
代码提交
  ↓
ESLint 检查
  ↓
TypeScript 类型检查
  ↓
UI 治理检查（检查样式覆盖）
  ↓
单元测试
  ↓
集成测试
  ↓
合并到主分支
```

---

## 六、发布流程

### 6.1 草稿管理

```typescript
interface PageDraft {
  pageId: string;
  schema: IPageSchemaV2;
  lastSaveTime: number;
  autoSaveInterval: number; // 自动保存间隔
}

// 自动保存（防抖 300ms）
const debouncedSave = createDebounce(
  () => savePageDraft(pageId, schema),
  { wait: 300 }
);
```

### 6.2 发布前预检

```typescript
interface PreflightCheck {
  name: string;
  check: (schema: IPageSchemaV2) => boolean;
  message: string;
}

const preflightChecks: PreflightCheck[] = [
  {
    name: "hasComponents",
    check: (schema) => schema.rootIds.length > 0,
    message: "页面至少需要一个组件",
  },
  {
    name: "validComponentTypes",
    check: (schema) => {
      return Object.values(schema.componentMap).every((comp) =>
        isValidComponentType(comp.type)
      );
    },
    message: "存在无效的组件类型",
  },
  {
    name: "noCircularReferences",
    check: (schema) => !hasCircularReferences(schema),
    message: "组件存在循环引用",
  },
];

// 执行预检
function runPreflightChecks(schema: IPageSchemaV2): PreflightCheckResult[] {
  return preflightChecks.map((check) => ({
    name: check.name,
    passed: check.check(schema),
    message: check.message,
  }));
}
```

### 6.3 发布记录

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

// 发布页面
async function publishPage(pageId: string, remark: string) {
  const schema = await getPageDraft(pageId);
  const checks = runPreflightChecks(schema);
  
  if (!checks.every((c) => c.passed)) {
    throw new Error("发布前预检失败");
  }
  
  const log: PublishLog = {
    id: generateId(),
    pageId,
    version: getNextVersion(pageId),
    schema,
    operator: getCurrentUser().id,
    publishTime: Date.now(),
    remark,
    status: "published",
  };
  
  await savePublishLog(log);
  return log;
}
```

### 6.4 回滚机制

```typescript
// 回滚到指定版本
async function rollbackPage(pageId: string, version: number) {
  const log = await getPublishLog(pageId, version);
  if (!log) {
    throw new Error("发布记录不存在");
  }
  
  // 将发布版本恢复为草稿
  await savePageDraft(pageId, log.schema);
  
  // 记录回滚操作
  const rollbackLog: PublishLog = {
    ...log,
    id: generateId(),
    version: getNextVersion(pageId),
    operator: getCurrentUser().id,
    publishTime: Date.now(),
    remark: `回滚到版本 ${version}`,
    status: "rollbacked",
  };
  
  await savePublishLog(rollbackLog);
  return rollbackLog;
}
```

---

## 七、性能优化

### 7.1 虚拟滚动

**原理：**
- 只渲染可见区域的组件
- 使用缓冲区处理边界情况
- 通过 transform 优化滚动性能

**实现：**
```typescript
function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  bufferSize: number = 5
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize;
  return { startIndex, endIndex };
}
```

### 7.2 防抖和节流

**防抖（Debounce）：**
- 用于保存草稿（等待用户停止编辑后再保存）
- 等待时间：300-800ms

**节流（Throttle）：**
- 用于滚动事件处理
- 用于拖拽事件处理
- 间隔时间：16ms（60fps）

### 7.3 组件缓存

```typescript
class ComponentRenderCache {
  private cache = new Map<string, any>();
  
  get(key: string) {
    return this.cache.get(key);
  }
  
  set(key: string, value: any) {
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### 7.4 Undo/Redo 优化

**当前实现：**
- 容量：50
- 深拷贝整个 schema

**优化方向：**
- 增量保存（只保存变化的部分）
- 压缩历史记录（合并相似操作）
- 异步保存（不阻塞主线程）

---

## 八、工程化体系

### 8.1 Monorepo 管理

**Turbo 构建编排：**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "lint": {}
  }
}
```

**pnpm 包管理：**
```bash
# 安装依赖
pnpm install

# 添加依赖到特定包
pnpm --filter @cms/cms add lodash

# 运行脚本
pnpm --filter @cms/cms run dev
```

### 8.2 CI/CD 流程

```
代码提交
  ↓
Lint 检查（ESLint）
  ↓
类型检查（TypeScript）
  ↓
单元测试（Vitest）
  ↓
构建（Vite）
  ↓
安全扫描（gitleaks、semgrep、npm audit）
  ↓
合并到主分支
```

### 8.3 代码质量门禁

**Husky + lint-staged：**
```bash
# 提交前自动运行
- ESLint 检查
- Prettier 格式化
- TypeScript 类型检查
- 单元测试
```

### 8.4 安全扫描

| 工具 | 功能 |
|------|------|
| gitleaks | 检测密钥泄露 |
| semgrep | 静态代码分析 |
| npm audit | 依赖安全审计 |

---

## 九、扩展性设计

### 9.1 插件系统

```typescript
interface Plugin {
  name: string;
  version: string;
  install(app: App): void;
}

// 注册插件
app.use(myPlugin);
```

### 9.2 自定义组件

```typescript
// 用户可以注册自定义组件
registerComponent({
  name: "CustomBlock",
  component: CustomBlock,
  icon: "custom",
  category: "custom",
  defaultProps: {},
  schema: {},
});
```

### 9.3 主题系统

```typescript
// 支持自定义主题
const theme = {
  colors: {
    primary: "#409eff",
    success: "#67c23a",
    warning: "#e6a23c",
    danger: "#f56c6c",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
};
```

---

## 十、最佳实践

### 10.1 组件开发

1. **使用 TypeScript** - 确保类型安全
2. **编写单元测试** - 覆盖率 > 80%
3. **添加文档** - 说明组件用途和 API
4. **遵循命名规范** - 使用 PascalCase 命名组件

### 10.2 状态管理

1. **使用 Pinia** - 集中管理应用状态
2. **避免深层嵌套** - 保持状态结构扁平
3. **使用 computed** - 缓存计算结果
4. **使用 watch** - 监听状态变化

### 10.3 性能优化

1. **使用虚拟滚动** - 处理大数据列表
2. **使用防抖/节流** - 优化频繁事件
3. **使用组件缓存** - 避免重复渲染
4. **使用代码分割** - 减少初始包体积

### 10.4 代码质量

1. **运行 ESLint** - 检查代码规范
2. **运行 TypeScript** - 检查类型安全
3. **运行单元测试** - 验证功能正确性
4. **运行集成测试** - 验证流程完整性

---

## 十一、常见问题

**Q: 如何添加新的组件？**
A: 使用脚手架生成模板，然后在 packages/ui/src/components 中实现组件，最后在 index.ts 中导出。

**Q: 如何修改 Schema 协议？**
A: 修改 packages/types/src/schema.ts 中的类型定义，然后更新相关的处理逻辑。

**Q: 如何优化性能？**
A: 使用虚拟滚动处理大数据，使用防抖/节流优化频繁事件，使用组件缓存避免重复渲染。

**Q: 如何调试编辑器？**
A: 使用 Vue DevTools 查看组件树和状态，使用 Chrome DevTools 分析性能。

---

## 十二、参考资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Element Plus 官方文档](https://element-plus.org/)

# 开发指南

## 一、本地开发

### 1.1 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git >= 2.30.0
- VS Code（推荐）+ Vue 3 插件

### 1.2 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-org/cms-vue3.git
cd cms-vue3

# 安装依赖
pnpm install

# 验证安装
pnpm --version
node --version
```

### 1.3 启动开发服务器

```bash
# 启动编辑器应用
pnpm --filter @cms/cms run dev

# 启动渲染器应用
pnpm --filter @cms/crs run dev

# 启动所有应用
pnpm run dev
```

访问 http://localhost:5173 查看编辑器。

### 1.4 调试技巧

**Vue DevTools：**
```bash
# 安装 Vue DevTools 浏览器扩展
# Chrome: https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmeocebotngbohdhpeja07dqblw
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/vue-devtools/

# 在浏览器中打开 DevTools，查看组件树和状态
```

**Chrome DevTools：**
```bash
# 打开 Chrome DevTools (F12)
# 1. Elements 标签：查看 DOM 结构
# 2. Console 标签：执行 JavaScript 代码
# 3. Performance 标签：分析性能
# 4. Memory 标签：检测内存泄漏
# 5. Network 标签：查看网络请求
```

**VS Code 调试：**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true
    }
  ]
}
```

---

## 二、项目结构

### 2.1 Monorepo 结构

```
cms-vue3/
├── apps/
│   ├── cms/                    # 编辑器应用
│   │   ├── src/
│   │   │   ├── views/          # 页面组件
│   │   │   │   ├── Decorate.vue        # 编辑器主页面
│   │   │   │   ├── Activity.vue        # 活动管理页面
│   │   │   │   └── Preview.vue         # 预览页面
│   │   │   ├── components/     # 通用组件
│   │   │   │   ├── VirtualScroll.vue   # 虚拟滚动
│   │   │   │   └── FallbackComponent.vue
│   │   │   ├── store/          # Pinia 状态管理
│   │   │   │   └── usePageStore.ts
│   │   │   ├── utils/          # 工具函数
│   │   │   │   ├── editor-optimization.ts
│   │   │   │   ├── performance-monitor.ts
│   │   │   │   └── page-publish.ts
│   │   │   ├── hooks/          # 自定义 hooks
│   │   │   │   ├── useDragDrop.ts
│   │   │   │   ├── usePageDraft.ts
│   │   │   │   └── usePagePublish.ts
│   │   │   ├── tests/          # 测试文件
│   │   │   │   ├── performance-benchmark.test.ts
│   │   │   │   └── ...
│   │   │   ├── App.vue
│   │   │   └── main.ts
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── crs/                    # 渲染器应用
├── packages/
│   ├── ui/                     # UI 组件库
│   │   ├── src/components/
│   │   │   ├── NoticeBlock/
│   │   │   ├── CarouselBlock/
│   │   │   ├── ProductBlock/
│   │   │   └── ...
│   │   └── package.json
│   ├── utils/                  # 工具函数库
│   ├── types/                  # TypeScript 类型定义
│   ├── hooks/                  # 共享 hooks
│   ├── eslint-config/
│   ├── prettier-config/
│   └── test-utils/
├── docs/                       # 文档
│   ├── ARCHITECTURE.md
│   ├── PERFORMANCE.md
│   ├── CASE-STUDIES.md
│   └── ...
├── turbo.json                  # Turbo 配置
├── pnpm-workspace.yaml         # pnpm workspace 配置
└── package.json
```

### 2.2 应用结构

**编辑器应用（cms）：**
- 负责页面编辑、配置、预览
- 提供完整的编辑器 UI
- 管理编辑状态和历史记录

**渲染器应用（crs）：**
- 负责页面预览和发布
- 根据 Schema 动态渲染页面
- 支持数据绑定和动态交互

### 2.3 包结构

| 包 | 职责 |
|------|------|
| @cms/ui | UI 组件库 |
| @cms/utils | 工具函数库 |
| @cms/types | TypeScript 类型定义 |
| @cms/hooks | 共享 hooks |
| @cms/eslint-config | ESLint 规则配置 |
| @cms/prettier-config | 代码格式化配置 |
| @cms/test-utils | 测试工具和 mock 数据 |

### 2.4 文件命名规范

**Vue 组件：**
- 使用 PascalCase 命名
- 文件名与组件名相同
- 示例：`NoticeBlock.vue`

**TypeScript 文件：**
- 使用 camelCase 命名
- 示例：`usePageStore.ts`、`editor-optimization.ts`

**测试文件：**
- 使用 `.test.ts` 或 `.spec.ts` 后缀
- 示例：`usePageStore.test.ts`

**样式文件：**
- 使用 `scoped` 样式
- 使用 BEM 命名规范
- 示例：`.canvas-component__title`

---

## 三、开发流程

### 3.1 创建分支

```bash
# 创建功能分支
git checkout -b feat/component-linkage

# 创建修复分支
git checkout -b fix/editor-performance

# 创建文档分支
git checkout -b docs/api-documentation
```

**分支命名规范：**
- `feat/` - 新功能
- `fix/` - 修复 bug
- `docs/` - 文档
- `refactor/` - 重构
- `perf/` - 性能优化
- `test/` - 测试

### 3.2 开发功能

```bash
# 1. 创建分支
git checkout -b feat/my-feature

# 2. 开发功能
# 编辑代码...

# 3. 运行测试
pnpm --filter @cms/cms test -- --run

# 4. 运行 lint
pnpm --filter @cms/cms run lint

# 5. 运行类型检查
pnpm --filter @cms/cms run typecheck

# 6. 构建
pnpm --filter @cms/cms run build
```

### 3.3 提交代码

```bash
# 查看修改
git status
git diff

# 暂存文件
git add apps/cms/src/views/Decorate.vue

# 提交代码
git commit -m "feat: 添加组件联动功能"

# 推送到远程
git push origin feat/my-feature
```

**提交信息规范：**
```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：
```
feat(editor): 实现组件联动机制

- 添加 LinkageEngine 类
- 支持组件间的数据绑定
- 添加单元测试

Closes #123
```

### 3.4 创建 PR

```bash
# 推送分支后，在 GitHub 上创建 PR
# 1. 填写 PR 标题和描述
# 2. 选择 reviewers
# 3. 等待 CI 检查通过
# 4. 等待代码审查
```

**PR 模板：**
```markdown
## 描述
简要描述这个 PR 的目的

## 相关 Issue
Closes #123

## 修改类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性修改
- [ ] 文档更新

## 测试
- [ ] 添加了单元测试
- [ ] 添加了集成测试
- [ ] 手动测试通过

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
```

### 3.5 代码审查

```bash
# 审查者检查代码
# 1. 查看代码修改
# 2. 运行本地测试
# 3. 提出建议或批准
```

### 3.6 合并代码

```bash
# 代码审查通过后，合并到主分支
git checkout main
git pull origin main
git merge feat/my-feature
git push origin main
```

---

## 四、编码规范

### 4.1 TypeScript 规范

```typescript
// ✅ 好的做法
interface PageConfig {
  name: string;
  description: string;
}

function updatePageConfig(config: PageConfig): void {
  // ...
}

// ❌ 不好的做法
function updatePageConfig(config: any): void {
  // ...
}
```

### 4.2 Vue 3 规范

```vue
<!-- ✅ 好的做法 -->
<template>
  <div class="component">
    <h1>{{ title }}</h1>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
  title: string;
}

const props = defineProps<Props>();
const count = ref(0);

const handleClick = () => {
  count.value++;
};
</script>

<style scoped>
.component {
  padding: 16px;
}
</style>

<!-- ❌ 不好的做法 -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="count++">Click me</button>
  </div>
</template>

<script>
export default {
  props: ["title"],
  data() {
    return { count: 0 };
  },
};
</script>
```

### 4.3 命名规范

```typescript
// 常量：UPPER_SNAKE_CASE
const MAX_HISTORY_SIZE = 50;

// 变量/函数：camelCase
const pageSchema = {};
function updateComponent() {}

// 类/接口：PascalCase
class ComponentRenderCache {}
interface IPageSchemaV2 {}

// 私有属性：_camelCase
private _cache = new Map();
```

### 4.4 注释规范

```typescript
// ✅ 好的做法 - 说明 WHY，不是 WHAT
// 使用 shallowRef 避免深度响应式，提升性能
const schema = shallowRef(initialSchema);

// ❌ 不好的做法 - 重复代码的内容
// 设置 schema
const schema = shallowRef(initialSchema);
```

---

## 五、测试指南

### 5.1 单元测试

```bash
# 运行所有测试
pnpm --filter @cms/cms test -- --run

# 运行特定测试文件
pnpm --filter @cms/cms test -- usePageStore.test.ts --run

# 运行测试并生成覆盖率报告
pnpm --filter @cms/cms test -- --coverage --run
```

**编写单元测试：**
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { usePageStore } from "../store/usePageStore";

describe("usePageStore", () => {
  let store: ReturnType<typeof usePageStore>;

  beforeEach(() => {
    store = usePageStore();
  });

  it("should initialize with empty schema", () => {
    expect(store.pageSchema.rootIds).toEqual([]);
  });

  it("should add component", () => {
    store.addComponent({
      id: "comp-1",
      type: "NoticeBlock",
      props: {},
    });
    expect(store.pageSchema.componentMap["comp-1"]).toBeDefined();
  });
});
```

### 5.2 集成测试

```bash
# 运行集成测试
pnpm --filter @cms/cms test -- material-flow.integration.test.ts --run
```

### 5.3 E2E 测试

```bash
# 运行 E2E 测试
pnpm --filter @cms/cms test:e2e

# 运行特定 E2E 测试
pnpm --filter @cms/cms test:e2e -- editor.e2e.test.ts
```

### 5.4 性能测试

```bash
# 运行性能基准测试
pnpm --filter @cms/cms test -- performance-benchmark.test.ts --run
```

---

## 六、常见任务

### 6.1 添加新的 UI 组件

```bash
# 1. 使用脚手架生成模板
pnpm run scaffold:component --name MyComponent --category business

# 2. 实现组件
# 编辑 packages/ui/src/components/MyComponent/MyComponent.vue

# 3. 添加类型定义
# 编辑 packages/ui/src/components/MyComponent/MyComponent.ts

# 4. 编写测试
# 编辑 packages/ui/src/components/MyComponent/__tests__/MyComponent.test.ts

# 5. 导出组件
# 编辑 packages/ui/src/components/index.ts
```

### 6.2 修改 Schema 协议

```bash
# 1. 修改类型定义
# 编辑 packages/types/src/schema.ts

# 2. 更新相关处理逻辑
# 编辑 apps/cms/src/store/usePageStore.ts
# 编辑 apps/crs/src/utils/schema-renderer.ts

# 3. 添加迁移脚本（如果需要）
# 编辑 apps/cms/src/utils/schema-migration.ts

# 4. 编写测试
# 编辑 apps/cms/src/tests/schema-v2.test.ts

# 5. 更新文档
# 编辑 docs/ARCHITECTURE.md
```

### 6.3 优化性能

```bash
# 1. 分析性能
pnpm --filter @cms/cms run build -- --analyze

# 2. 运行性能基准测试
pnpm --filter @cms/cms test -- performance-benchmark.test.ts --run

# 3. 使用 Chrome DevTools 分析
# 打开 Chrome DevTools → Performance 标签

# 4. 实施优化
# 编辑相关代码...

# 5. 验证优化效果
pnpm --filter @cms/cms test -- performance-benchmark.test.ts --run
```

---

## 七、调试技巧

### 7.1 使用 console.log

```typescript
// 基本调试
console.log("value:", value);

// 对象调试
console.table(componentMap);

// 性能调试
console.time("operation");
// ... 操作
console.timeEnd("operation");

// 分组调试
console.group("Editor State");
console.log("activeId:", activeId);
console.log("selectedIds:", selectedIds);
console.groupEnd();
```

### 7.2 使用 debugger

```typescript
// 在代码中设置断点
function updateComponent(id: string, updates: any) {
  debugger; // 执行到这里时暂停
  // ...
}

// 在浏览器中打开 DevTools，代码会在这里暂停
```

### 7.3 使用 Vue DevTools

```typescript
// 在 Vue DevTools 中查看组件树
// 1. 打开浏览器 DevTools
// 2. 切换到 Vue 标签
// 3. 查看组件树和状态
```

### 7.4 使用 Chrome DevTools

```typescript
// Performance 分析
// 1. 打开 Chrome DevTools
// 2. 切换到 Performance 标签
// 3. 点击 Record
// 4. 执行操作
// 5. 点击 Stop
// 6. 分析性能数据

// Memory 分析
// 1. 打开 Chrome DevTools
// 2. 切换到 Memory 标签
// 3. 拍摄堆快照
// 4. 执行操作
// 5. 再次拍摄堆快照
// 6. 对比两个快照，查找内存泄漏
```

---

## 八、常见问题

**Q: 如何快速启动开发服务器？**
A: 使用 `pnpm run dev` 启动所有应用，或使用 `pnpm --filter @cms/cms run dev` 启动特定应用。

**Q: 如何运行测试？**
A: 使用 `pnpm --filter @cms/cms test -- --run` 运行所有测试，或使用 `pnpm --filter @cms/cms test -- <filename> --run` 运行特定测试。

**Q: 如何调试代码？**
A: 使用 Vue DevTools 查看组件树，使用 Chrome DevTools 分析性能，使用 `debugger` 设置断点。

**Q: 如何添加新的依赖？**
A: 使用 `pnpm --filter @cms/cms add <package>` 添加依赖到特定包。

**Q: 如何更新依赖？**
A: 使用 `pnpm update` 更新所有依赖，或使用 `pnpm --filter @cms/cms update <package>` 更新特定包。

---

## 九、参考资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vitest 官方文档](https://vitest.dev/)
- [Turbo 官方文档](https://turbo.build/)

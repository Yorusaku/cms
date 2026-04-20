# 测试覆盖率提升计划

## 一、当前测试现状

### 1.1 测试覆盖率分析
- **总代码行数**：6,198 行
- **测试代码行数**：1,670 行
- **当前覆盖率**：27%
- **目标覆盖率**：70%
- **需要补充**：约 2,600 行测试代码

### 1.2 测试文件分布
```
apps/cms/src/tests/
├── schema-v2.integration.test.ts      ✅ 已有
├── schema-v2.performance.test.ts      ⚠️ 空文件
├── usePageStore.test.ts               ❌ 缺失
├── editor.integration.test.ts         ❌ 缺失
├── editor.e2e.test.ts                 ❌ 缺失
├── virtual-scroll.test.ts             ❌ 缺失
├── linkage.test.ts                    ❌ 缺失
├── condition.test.ts                  ❌ 缺失
└── data-binding.test.ts               ❌ 缺失

packages/ui/src/components/__tests__/
├── NoticeBlock.test.ts                ❌ 缺失
├── CarouselBlock.test.ts              ❌ 缺失
├── ProductBlock.test.ts               ❌ 缺失
└── ...                                ❌ 缺失

packages/utils/src/__tests__/
├── linkage-engine.test.ts             ❌ 缺失
├── condition-engine.test.ts           ❌ 缺失
└── data-binding-engine.test.ts        ❌ 缺失
```

---

## 二、单元测试计划

### 2.1 usePageStore 单元测试

**文件：** `apps/cms/src/tests/usePageStore.test.ts`

**测试覆盖范围：**
- 初始化状态
- 页面配置更新
- 组件操作（添加、删除、更新）
- 选中状态管理
- Undo/Redo 功能
- 草稿保存

**测试用例示例：**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePageStore } from '@/store/usePageStore';

describe('usePageStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('初始化', () => {
    it('应该初始化为空页面', () => {
      const store = usePageStore();
      expect(store.pageSchema.componentMap).toEqual({});
      expect(store.pageSchema.rootIds).toEqual([]);
    });

    it('应该有正确的初始配置', () => {
      const store = usePageStore();
      expect(store.pageSchema.pageConfig.name).toBe('页面标题');
    });
  });

  describe('页面配置', () => {
    it('应该更新页面配置', () => {
      const store = usePageStore();
      store.setPageConfig({ name: '新标题' });
      expect(store.pageSchema.pageConfig.name).toBe('新标题');
    });

    it('应该支持部分更新', () => {
      const store = usePageStore();
      store.setPageConfig({ backgroundColor: '#fff' });
      expect(store.pageSchema.pageConfig.name).toBe('页面标题');
      expect(store.pageSchema.pageConfig.backgroundColor).toBe('#fff');
    });
  });

  describe('组件操作', () => {
    it('应该添加组件', () => {
      const store = usePageStore();
      const component = { id: 'comp-1', type: 'NoticeBlock', props: {} };
      store.addComponent(component);
      expect(store.pageSchema.componentMap['comp-1']).toBeDefined();
    });

    it('应该删除组件', () => {
      const store = usePageStore();
      const component = { id: 'comp-1', type: 'NoticeBlock', props: {} };
      store.addComponent(component);
      store.removeComponent('comp-1');
      expect(store.pageSchema.componentMap['comp-1']).toBeUndefined();
    });

    it('应该更新组件属性', () => {
      const store = usePageStore();
      const component = { id: 'comp-1', type: 'NoticeBlock', props: { text: 'old' } };
      store.addComponent(component);
      store.updateComponent('comp-1', { text: 'new' });
      expect(store.pageSchema.componentMap['comp-1'].props.text).toBe('new');
    });
  });

  describe('Undo/Redo', () => {
    it('应该支持撤销', () => {
      const store = usePageStore();
      store.setPageConfig({ name: '标题1' });
      store.setPageConfig({ name: '标题2' });
      store.undo();
      expect(store.pageSchema.pageConfig.name).toBe('标题1');
    });

    it('应该支持重做', () => {
      const store = usePageStore();
      store.setPageConfig({ name: '标题1' });
      store.setPageConfig({ name: '标题2' });
      store.undo();
      store.redo();
      expect(store.pageSchema.pageConfig.name).toBe('标题2');
    });

    it('应该有正确的撤销/重做状态', () => {
      const store = usePageStore();
      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);
      store.setPageConfig({ name: '标题1' });
      expect(store.canUndo).toBe(true);
    });
  });

  describe('选中状态', () => {
    it('应该设置活跃组件', () => {
      const store = usePageStore();
      store.setActiveId('comp-1');
      expect(store.activeComponentId).toBe('comp-1');
      expect(store.selectedComponentIds).toContain('comp-1');
    });

    it('应该支持多选', () => {
      const store = usePageStore();
      store.setComponentSelection(['comp-1', 'comp-2']);
      expect(store.selectedComponentIds).toEqual(['comp-1', 'comp-2']);
    });
  });
});
```

**预期覆盖率：** 95%+

---

### 2.2 工具函数单元测试

**文件：** `packages/utils/src/__tests__/linkage-engine.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { LinkageEngine } from '../linkage-engine';

describe('LinkageEngine', () => {
  let engine: LinkageEngine;

  beforeEach(() => {
    engine = new LinkageEngine();
  });

  describe('注册联动', () => {
    it('应该注册联动关系', () => {
      const linkage = {
        sourceComponentId: 'comp-1',
        sourceProperty: 'value',
        targetComponentId: 'comp-2',
        targetProperty: 'text',
      };
      engine.registerLinkage(linkage);
      expect(engine.getLinkages()).toContain(linkage);
    });
  });

  describe('触发联动', () => {
    it('应该触发联动更新', () => {
      // 设置组件
      engine.setComponent('comp-1', { id: 'comp-1', type: 'Input', props: {} });
      engine.setComponent('comp-2', { id: 'comp-2', type: 'Text', props: {} });

      // 注册联动
      engine.registerLinkage({
        sourceComponentId: 'comp-1',
        sourceProperty: 'value',
        targetComponentId: 'comp-2',
        targetProperty: 'text',
      });

      // 触发联动
      engine.triggerLinkage('comp-1', 'value', 'hello');

      // 验证目标组件属性已更新
      const comp2 = engine.getComponent('comp-2');
      expect(comp2.props.text).toBe('hello');
    });

    it('应该支持转换函数', () => {
      engine.setComponent('comp-1', { id: 'comp-1', type: 'Input', props: {} });
      engine.setComponent('comp-2', { id: 'comp-2', type: 'Text', props: {} });

      engine.registerLinkage({
        sourceComponentId: 'comp-1',
        sourceProperty: 'value',
        targetComponentId: 'comp-2',
        targetProperty: 'text',
        transformFn: (value) => value.toUpperCase(),
      });

      engine.triggerLinkage('comp-1', 'value', 'hello');

      const comp2 = engine.getComponent('comp-2');
      expect(comp2.props.text).toBe('HELLO');
    });

    it('应该支持条件判断', () => {
      engine.setComponent('comp-1', { id: 'comp-1', type: 'Input', props: {} });
      engine.setComponent('comp-2', { id: 'comp-2', type: 'Text', props: {} });

      engine.registerLinkage({
        sourceComponentId: 'comp-1',
        sourceProperty: 'value',
        targetComponentId: 'comp-2',
        targetProperty: 'text',
        condition: (value) => value.length > 5,
      });

      // 不满足条件
      engine.triggerLinkage('comp-1', 'value', 'hi');
      let comp2 = engine.getComponent('comp-2');
      expect(comp2.props.text).toBeUndefined();

      // 满足条件
      engine.triggerLinkage('comp-1', 'value', 'hello world');
      comp2 = engine.getComponent('comp-2');
      expect(comp2.props.text).toBe('hello world');
    });
  });
});
```

**预期覆盖率：** 90%+

---

## 三、集成测试计划

### 3.1 编辑器集成测试

**文件：** `apps/cms/src/tests/editor.integration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Decorate from '@/views/Decorate/index.vue';

describe('编辑器集成测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('编辑流程', () => {
    it('应该支持完整的编辑流程', async () => {
      const wrapper = mount(Decorate);

      // 1. 添加组件
      const store = usePageStore();
      store.addComponent({
        id: 'comp-1',
        type: 'NoticeBlock',
        props: { text: 'Notice' },
      });

      // 2. 选中组件
      store.setActiveId('comp-1');
      expect(store.activeComponentId).toBe('comp-1');

      // 3. 修改组件属性
      store.updateComponent('comp-1', { text: 'Updated Notice' });
      expect(store.pageSchema.componentMap['comp-1'].props.text).toBe('Updated Notice');

      // 4. 撤销
      store.undo();
      expect(store.pageSchema.componentMap['comp-1'].props.text).toBe('Notice');

      // 5. 重做
      store.redo();
      expect(store.pageSchema.componentMap['comp-1'].props.text).toBe('Updated Notice');

      // 6. 删除组件
      store.removeComponent('comp-1');
      expect(store.pageSchema.componentMap['comp-1']).toBeUndefined();
    });

    it('应该支持草稿自动保存', async () => {
      const wrapper = mount(Decorate);
      const store = usePageStore();

      // 修改页面
      store.setPageConfig({ name: '新标题' });

      // 等待防抖
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 验证草稿已保存
      const draft = localStorage.getItem('page-draft-1');
      expect(draft).toBeDefined();
    });
  });

  describe('拖拽功能', () => {
    it('应该支持拖拽添加组件', async () => {
      const wrapper = mount(Decorate);
      // 模拟拖拽操作
      // ...
    });

    it('应该支持拖拽排序', async () => {
      const wrapper = mount(Decorate);
      // 模拟拖拽排序
      // ...
    });
  });

  describe('预览功能', () => {
    it('应该支持预览页面', async () => {
      const wrapper = mount(Decorate);
      // 模拟预览操作
      // ...
    });
  });
});
```

**预期覆盖率：** 85%+

---

## 四、E2E 测试计划

### 4.1 编辑器 E2E 测试

**文件：** `apps/cms/src/tests/editor.e2e.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('编辑器 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/decorate?id=1');
  });

  test('应该支持完整的编辑流程', async ({ page }) => {
    // 1. 从物料库拖拽组件
    const materialItem = page.locator('[data-testid="material-notice"]');
    const canvas = page.locator('[data-testid="canvas"]');
    
    await materialItem.dragTo(canvas);

    // 2. 验证组件已添加
    const component = page.locator('[data-testid="component-1"]');
    await expect(component).toBeVisible();

    // 3. 点击组件选中
    await component.click();
    await expect(component).toHaveClass('selected');

    // 4. 修改组件属性
    const textInput = page.locator('[data-testid="config-text"]');
    await textInput.fill('Updated Text');

    // 5. 验证属性已更新
    await expect(component).toContainText('Updated Text');

    // 6. 撤销
    await page.keyboard.press('Control+Z');
    await expect(component).toContainText('Notice');

    // 7. 重做
    await page.keyboard.press('Control+Y');
    await expect(component).toContainText('Updated Text');

    // 8. 保存草稿
    const saveButton = page.locator('[data-testid="save-draft"]');
    await saveButton.click();
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();

    // 9. 发布
    const publishButton = page.locator('[data-testid="publish"]');
    await publishButton.click();
    await expect(page.locator('[data-testid="publish-success"]')).toBeVisible();
  });

  test('应该支持多组件编辑', async ({ page }) => {
    // 添加多个组件
    // 验证联动功能
    // 验证条件渲染
    // 验证数据绑定
  });

  test('应该支持性能场景', async ({ page }) => {
    // 添加 100+ 组件
    // 验证编辑流畅度
    // 验证内存占用
  });
});
```

**预期覆盖率：** 80%+

---

## 五、UI 组件测试计划

### 5.1 组件单元测试

**文件：** `packages/ui/src/components/__tests__/NoticeBlock.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NoticeBlock from '../NoticeBlock.vue';

describe('NoticeBlock', () => {
  describe('基础功能', () => {
    it('应该渲染通知栏', () => {
      const wrapper = mount(NoticeBlock, {
        props: {
          noticeList: [{ text: 'Notice 1' }, { text: 'Notice 2' }],
        },
      });

      expect(wrapper.find('.notice-block').exists()).toBe(true);
    });

    it('应该显示通知文本', () => {
      const wrapper = mount(NoticeBlock, {
        props: {
          noticeList: [{ text: 'Test Notice' }],
        },
      });

      expect(wrapper.text()).toContain('Test Notice');
    });

    it('应该支持自定义样式', () => {
      const wrapper = mount(NoticeBlock, {
        props: {
          noticeList: [{ text: 'Notice' }],
          backgroundColor: '#ff0000',
          textColor: '#ffffff',
        },
      });

      const element = wrapper.find('.notice-block');
      expect(element.attributes('style')).toContain('background-color: #ff0000');
    });
  });

  describe('交互功能', () => {
    it('应该支持点击事件', async () => {
      const wrapper = mount(NoticeBlock, {
        props: {
          noticeList: [{ text: 'Notice' }],
        },
      });

      await wrapper.find('.notice-block').trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });
  });

  describe('边界情况', () => {
    it('应该处理空列表', () => {
      const wrapper = mount(NoticeBlock, {
        props: {
          noticeList: [],
        },
      });

      expect(wrapper.find('.notice-empty').exists()).toBe(true);
    });

    it('应该处理单个通知', () => {
      const wrapper = mount(NoticeBlock, {
        props: {
          noticeList: [{ text: 'Single Notice' }],
        },
      });

      expect(wrapper.text()).toContain('Single Notice');
    });
  });
});
```

**预期覆盖率：** 90%+

---

## 六、性能测试计划

### 6.1 性能基准测试

**文件：** `apps/cms/src/tests/performance-benchmark.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('性能基准测试', () => {
  describe('编辑器渲染性能', () => {
    it('100 个组件的渲染时间应该 < 100ms', () => {
      const start = performance.now();

      // 创建 100 个组件
      const components = Array.from({ length: 100 }, (_, i) => ({
        id: `comp-${i}`,
        type: 'NoticeBlock',
        props: { text: `Notice ${i}` },
      }));

      // 渲染组件
      // ...

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(100);
    });

    it('1000 个组件的渲染时间应该 < 500ms', () => {
      // 类似的测试，但使用 1000 个组件
    });
  });

  describe('拖拽性能', () => {
    it('拖拽响应时间应该 < 50ms', () => {
      // 测试拖拽响应时间
    });
  });

  describe('保存性能', () => {
    it('保存 100 个组件应该 < 200ms', () => {
      // 测试保存性能
    });
  });

  describe('内存占用', () => {
    it('编辑 100 个组件时内存占用应该 < 50MB', () => {
      // 测试内存占用
    });
  });
});
```

**预期覆盖率：** 100%（性能指标）

---

## 七、实施时间表

| 测试类型 | 文件 | 时间 | 完成度 |
|---------|------|------|--------|
| usePageStore 单元测试 | usePageStore.test.ts | 15h | 0% |
| 工具函数单元测试 | linkage/condition/data-binding.test.ts | 15h | 0% |
| UI 组件测试 | components/__tests__/*.test.ts | 20h | 0% |
| 编辑器集成测试 | editor.integration.test.ts | 15h | 0% |
| 编辑器 E2E 测试 | editor.e2e.test.ts | 20h | 0% |
| 性能基准测试 | performance-benchmark.test.ts | 10h | 0% |
| **总计** | | **95h** | |

---

## 八、测试覆盖率目标

| 模块 | 当前 | 目标 | 提升 |
|------|------|------|------|
| usePageStore | 30% | 95% | +65% |
| 工具函数 | 20% | 90% | +70% |
| UI 组件 | 15% | 90% | +75% |
| 编辑器组件 | 25% | 85% | +60% |
| **整体** | **27%** | **70%** | **+43%** |

---

## 九、测试命令

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test -- usePageStore.test.ts

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e

# 运行性能测试
pnpm test -- performance-benchmark.test.ts

# 监听模式
pnpm test -- --watch
```

---

## 十、CI/CD 集成

### 10.1 测试门禁

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test -- --run
      - run: pnpm test:coverage
      
      # 检查覆盖率
      - name: Check coverage
        run: |
          COVERAGE=$(pnpm test:coverage | grep -oP 'Lines\s+:\s+\K[\d.]+')
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Coverage is below 70%: $COVERAGE%"
            exit 1
          fi
```

### 10.2 覆盖率报告

```bash
# 生成覆盖率报告
pnpm test:coverage

# 上传到 Codecov
pnpm dlx codecov
```

---

## 十一、关键文件清单

### 需要创建的测试文件
- `apps/cms/src/tests/usePageStore.test.ts`
- `apps/cms/src/tests/editor.integration.test.ts`
- `apps/cms/src/tests/editor.e2e.test.ts`
- `apps/cms/src/tests/virtual-scroll.test.ts`
- `apps/cms/src/tests/linkage.test.ts`
- `apps/cms/src/tests/condition.test.ts`
- `apps/cms/src/tests/data-binding.test.ts`
- `apps/cms/src/tests/performance-benchmark.test.ts`
- `packages/ui/src/components/__tests__/*.test.ts`
- `packages/utils/src/__tests__/*.test.ts`

### 需要修改的文件
- `apps/cms/src/tests/schema-v2.performance.test.ts` - 补充性能测试
- `vitest.config.ts` - 配置覆盖率收集
- `.github/workflows/test.yml` - 添加测试门禁

---

## 十二、简历话术

> "提升测试覆盖率从 27% 到 70%，包括：
> - **单元测试**：为核心模块（usePageStore、工具函数）编写完整的单元测试
> - **集成测试**：测试编辑器的完整工作流程
> - **E2E 测试**：使用 Playwright 进行端到端测试
> - **性能测试**：建立性能基准测试，监控关键指标
> - **CI/CD 集成**：在 GitHub Actions 中集成测试门禁，确保代码质量"

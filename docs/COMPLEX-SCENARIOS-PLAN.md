# 复杂业务场景实施计划

## 一、组件联动机制

### 1.1 目标
- 支持组件之间的数据联动
- 一个组件的配置影响另一个组件的显示
- 支持条件判断和动态更新

### 1.2 实现方案

#### Step 1: 设计联动协议

**文件：** `packages/types/src/index.ts`

```typescript
// 联动关系定义
interface IComponentLinkage {
  sourceComponentId: string;      // 源组件 ID
  sourceProperty: string;          // 源组件属性
  targetComponentId: string;       // 目标组件 ID
  targetProperty: string;          // 目标组件属性
  transformFn?: (value: any) => any; // 转换函数
  condition?: (value: any) => boolean; // 条件判断
}

// 扩展 Schema V2
interface IPageSchemaV2 {
  version: "2.0.0";
  pageConfig: {...};
  componentMap: Record<string, IComponentSchemaV2>;
  rootIds: string[];
  state?: Record<string, unknown>;
  linkages?: IComponentLinkage[]; // 新增：联动关系
}
```

#### Step 2: 实现联动引擎

**文件：** `packages/utils/src/linkage-engine.ts`

```typescript
// 联动引擎核心逻辑
class LinkageEngine {
  private linkages: IComponentLinkage[] = [];
  private componentMap: Record<string, IComponentSchemaV2> = {};
  private listeners: Map<string, Set<Function>> = new Map();

  // 注册联动关系
  registerLinkage(linkage: IComponentLinkage) {
    this.linkages.push(linkage);
    this.setupListener(linkage.sourceComponentId);
  }

  // 监听源组件属性变化
  private setupListener(componentId: string) {
    if (!this.listeners.has(componentId)) {
      this.listeners.set(componentId, new Set());
    }
  }

  // 触发联动
  triggerLinkage(componentId: string, property: string, value: any) {
    const relatedLinkages = this.linkages.filter(
      l => l.sourceComponentId === componentId && l.sourceProperty === property
    );

    relatedLinkages.forEach(linkage => {
      const targetComponent = this.componentMap[linkage.targetComponentId];
      if (!targetComponent) return;

      // 应用转换函数
      let newValue = value;
      if (linkage.transformFn) {
        newValue = linkage.transformFn(value);
      }

      // 检查条件
      if (linkage.condition && !linkage.condition(newValue)) {
        return;
      }

      // 更新目标组件属性
      targetComponent.props[linkage.targetProperty] = newValue;

      // 触发监听器
      const callbacks = this.listeners.get(linkage.targetComponentId);
      if (callbacks) {
        callbacks.forEach(cb => cb(linkage.targetProperty, newValue));
      }
    });
  }

  // 获取所有联动关系
  getLinkages(): IComponentLinkage[] {
    return this.linkages;
  }
}
```

#### Step 3: 集成到编辑器

**文件：** `apps/cms/src/store/usePageStore.ts`

```typescript
// 在 usePageStore 中集成联动引擎
const linkageEngine = new LinkageEngine();

// 当组件属性更新时，触发联动
const updateComponent = (componentId: string, props: Record<string, any>) => {
  const component = pageSchema.value.componentMap[componentId];
  if (!component) return;

  // 更新属性
  Object.assign(component.props, props);

  // 触发联动
  Object.entries(props).forEach(([key, value]) => {
    linkageEngine.triggerLinkage(componentId, key, value);
  });

  // 保存草稿
  debouncedCommit();
};
```

#### Step 4: 配置面板支持

**文件：** `apps/cms/src/views/Decorate/components/RightConfig.vue`

```vue
<!-- 在配置面板中添加联动配置 -->
<template>
  <div class="right-config">
    <!-- 基础配置 -->
    <div class="config-section">
      <h3>基础配置</h3>
      <!-- 现有配置 -->
    </div>

    <!-- 联动配置 -->
    <div class="config-section">
      <h3>联动配置</h3>
      <button @click="addLinkage">添加联动</button>
      <div v-for="linkage in linkages" :key="linkage.id" class="linkage-item">
        <select v-model="linkage.sourceProperty">
          <option v-for="prop in sourceProps" :key="prop" :value="prop">
            {{ prop }}
          </option>
        </select>
        <span>→</span>
        <select v-model="linkage.targetComponentId">
          <option v-for="comp in components" :key="comp.id" :value="comp.id">
            {{ comp.type }}
          </option>
        </select>
        <select v-model="linkage.targetProperty">
          <option v-for="prop in targetProps" :key="prop" :value="prop">
            {{ prop }}
          </option>
        </select>
        <button @click="removeLinkage(linkage.id)">删除</button>
      </div>
    </div>
  </div>
</template>
```

---

## 二、条件渲染机制

### 2.1 目标
- 支持根据条件显示/隐藏组件
- 支持复杂的条件表达式
- 支持动态条件更新

### 2.2 实现方案

#### Step 1: 设计条件协议

**文件：** `packages/types/src/index.ts`

```typescript
// 条件表达式定义
interface IConditionExpression {
  type: 'simple' | 'complex'; // 简单条件或复杂条件
  operator?: 'and' | 'or';     // 逻辑运算符
  conditions?: ICondition[];    // 条件列表
}

interface ICondition {
  componentId: string;          // 组件 ID
  property: string;             // 属性名
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'contains';
  value: any;                   // 比较值
}

// 扩展组件 Schema
interface IComponentSchemaV2 {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[];
  events?: Record<string, unknown>;
  visibility?: IConditionExpression; // 新增：可见性条件
}
```

#### Step 2: 实现条件引擎

**文件：** `packages/utils/src/condition-engine.ts`

```typescript
// 条件引擎核心逻辑
class ConditionEngine {
  private componentMap: Record<string, IComponentSchemaV2> = {};

  // 评估条件
  evaluateCondition(condition: ICondition): boolean {
    const component = this.componentMap[condition.componentId];
    if (!component) return false;

    const value = component.props[condition.property];

    switch (condition.operator) {
      case '==':
        return value == condition.value;
      case '!=':
        return value != condition.value;
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'contains':
        return String(value).includes(String(condition.value));
      default:
        return false;
    }
  }

  // 评估条件表达式
  evaluateExpression(expression: IConditionExpression): boolean {
    if (expression.type === 'simple' && expression.conditions?.length === 1) {
      return this.evaluateCondition(expression.conditions[0]);
    }

    if (expression.type === 'complex' && expression.conditions) {
      const results = expression.conditions.map(c => this.evaluateCondition(c));

      if (expression.operator === 'and') {
        return results.every(r => r);
      } else if (expression.operator === 'or') {
        return results.some(r => r);
      }
    }

    return true;
  }

  // 判断组件是否可见
  isComponentVisible(componentId: string): boolean {
    const component = this.componentMap[componentId];
    if (!component || !component.visibility) return true;

    return this.evaluateExpression(component.visibility);
  }
}
```

#### Step 3: 集成到渲染器

**文件：** `apps/crs/src/renderer.ts`

```typescript
// 在渲染器中检查条件
function renderComponent(componentId: string): VNode | null {
  const component = componentMap[componentId];
  if (!component) return null;

  // 检查可见性条件
  if (!conditionEngine.isComponentVisible(componentId)) {
    return null;
  }

  // 渲染组件
  return h(getComponentType(component.type), {
    ...component.props,
    key: componentId,
  });
}
```

#### Step 4: 配置面板支持

**文件：** `apps/cms/src/views/Decorate/components/RightConfig.vue`

```vue
<!-- 在配置面板中添加条件配置 -->
<template>
  <div class="right-config">
    <!-- 基础配置 -->
    <div class="config-section">
      <h3>基础配置</h3>
      <!-- 现有配置 -->
    </div>

    <!-- 条件配置 -->
    <div class="config-section">
      <h3>条件配置</h3>
      <div class="condition-editor">
        <label>
          <input type="checkbox" v-model="hasCondition" />
          启用条件渲染
        </label>

        <div v-if="hasCondition" class="condition-builder">
          <select v-model="expression.type">
            <option value="simple">简单条件</option>
            <option value="complex">复杂条件</option>
          </select>

          <div v-if="expression.type === 'complex'" class="operator-selector">
            <label>
              <input type="radio" v-model="expression.operator" value="and" />
              全部满足（AND）
            </label>
            <label>
              <input type="radio" v-model="expression.operator" value="or" />
              任意满足（OR）
            </label>
          </div>

          <div class="conditions-list">
            <div v-for="(condition, index) in expression.conditions" :key="index" class="condition-item">
              <select v-model="condition.componentId">
                <option v-for="comp in components" :key="comp.id" :value="comp.id">
                  {{ comp.type }}
                </option>
              </select>

              <select v-model="condition.property">
                <option v-for="prop in getComponentProps(condition.componentId)" :key="prop" :value="prop">
                  {{ prop }}
                </option>
              </select>

              <select v-model="condition.operator">
                <option value="==">等于</option>
                <option value="!=">不等于</option>
                <option value=">">大于</option>
                <option value="<">小于</option>
                <option value=">=">大于等于</option>
                <option value="<=">小于等于</option>
                <option value="in">包含</option>
                <option value="contains">包含字符串</option>
              </select>

              <input v-model="condition.value" type="text" placeholder="比较值" />

              <button @click="removeCondition(index)">删除</button>
            </div>
          </div>

          <button @click="addCondition">添加条件</button>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 三、数据绑定机制

### 3.1 目标
- 支持组件数据来自 API
- 支持数据映射和转换
- 支持数据缓存和更新

### 3.2 实现方案

#### Step 1: 设计数据绑定协议

**文件：** `packages/types/src/index.ts`

```typescript
// 数据源定义
interface IDataSource {
  id: string;
  type: 'api' | 'static' | 'computed'; // 数据源类型
  url?: string;                         // API 地址
  method?: 'GET' | 'POST';              // HTTP 方法
  params?: Record<string, any>;         // 请求参数
  headers?: Record<string, string>;     // 请求头
  transformFn?: string;                 // 数据转换函数（JSON 字符串）
  cacheTime?: number;                   // 缓存时间（毫秒）
  refreshInterval?: number;             // 刷新间隔（毫秒）
}

// 数据绑定定义
interface IDataBinding {
  componentId: string;                  // 组件 ID
  property: string;                     // 组件属性
  dataSourceId: string;                 // 数据源 ID
  dataPath?: string;                    // 数据路径（支持 a.b.c）
}

// 扩展 Schema V2
interface IPageSchemaV2 {
  version: "2.0.0";
  pageConfig: {...};
  componentMap: Record<string, IComponentSchemaV2>;
  rootIds: string[];
  state?: Record<string, unknown>;
  linkages?: IComponentLinkage[];
  dataSources?: IDataSource[];          // 新增：数据源
  dataBindings?: IDataBinding[];         // 新增：数据绑定
}
```

#### Step 2: 实现数据绑定引擎

**文件：** `packages/utils/src/data-binding-engine.ts`

```typescript
// 数据绑定引擎核心逻辑
class DataBindingEngine {
  private dataSources: Map<string, IDataSource> = new Map();
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private componentMap: Record<string, IComponentSchemaV2> = {};
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();

  // 注册数据源
  registerDataSource(dataSource: IDataSource) {
    this.dataSources.set(dataSource.id, dataSource);

    // 如果有刷新间隔，设置定时刷新
    if (dataSource.refreshInterval) {
      this.setupRefreshTimer(dataSource.id);
    }
  }

  // 获取数据
  async fetchData(dataSourceId: string): Promise<any> {
    const dataSource = this.dataSources.get(dataSourceId);
    if (!dataSource) return null;

    // 检查缓存
    const cached = this.dataCache.get(dataSourceId);
    if (cached && Date.now() - cached.timestamp < (dataSource.cacheTime || 0)) {
      return cached.data;
    }

    // 根据数据源类型获取数据
    let data;
    if (dataSource.type === 'api') {
      data = await this.fetchFromAPI(dataSource);
    } else if (dataSource.type === 'static') {
      data = dataSource.params;
    } else if (dataSource.type === 'computed') {
      data = await this.computeData(dataSource);
    }

    // 应用转换函数
    if (dataSource.transformFn) {
      const transformFn = new Function('data', dataSource.transformFn);
      data = transformFn(data);
    }

    // 缓存数据
    this.dataCache.set(dataSourceId, { data, timestamp: Date.now() });

    return data;
  }

  // 从 API 获取数据
  private async fetchFromAPI(dataSource: IDataSource): Promise<any> {
    const response = await fetch(dataSource.url!, {
      method: dataSource.method || 'GET',
      headers: dataSource.headers,
      body: dataSource.method === 'POST' ? JSON.stringify(dataSource.params) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // 应用数据绑定
  async applyDataBinding(binding: IDataBinding) {
    const data = await this.fetchData(binding.dataSourceId);
    if (!data) return;

    // 提取数据路径
    const value = this.getValueByPath(data, binding.dataPath);

    // 更新组件属性
    const component = this.componentMap[binding.componentId];
    if (component) {
      component.props[binding.property] = value;
    }
  }

  // 根据路径获取值
  private getValueByPath(obj: any, path?: string): any {
    if (!path) return obj;

    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // 设置刷新定时器
  private setupRefreshTimer(dataSourceId: string) {
    const dataSource = this.dataSources.get(dataSourceId);
    if (!dataSource || !dataSource.refreshInterval) return;

    const timer = setInterval(() => {
      this.dataCache.delete(dataSourceId); // 清除缓存，强制重新获取
    }, dataSource.refreshInterval);

    this.refreshTimers.set(dataSourceId, timer);
  }

  // 清理资源
  destroy() {
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();
  }
}
```

#### Step 3: 集成到编辑器

**文件：** `apps/cms/src/store/usePageStore.ts`

```typescript
// 在 usePageStore 中集成数据绑定引擎
const dataBindingEngine = new DataBindingEngine();

// 初始化数据绑定
const initDataBindings = async () => {
  const schema = pageSchema.value;

  // 注册数据源
  schema.dataSources?.forEach(ds => {
    dataBindingEngine.registerDataSource(ds);
  });

  // 应用数据绑定
  for (const binding of schema.dataBindings || []) {
    await dataBindingEngine.applyDataBinding(binding);
  }
};

// 页面卸载时清理
onUnmounted(() => {
  dataBindingEngine.destroy();
});
```

---

## 四、实施时间表

| 功能 | 时间 | 完成度 |
|------|------|--------|
| 组件联动机制 | 25h | 0% |
| 条件渲染机制 | 25h | 0% |
| 数据绑定机制 | 30h | 0% |
| 配置面板集成 | 15h | 0% |
| 测试和文档 | 10h | 0% |
| **总计** | **105h** | |

---

## 五、简历话术

> "实现了复杂业务场景支持：
> - **组件联动**：支持组件之间的数据联动，一个组件的配置可以影响另一个组件的显示
> - **条件渲染**：支持复杂的条件表达式，根据条件动态显示/隐藏组件
> - **数据绑定**：支持组件数据来自 API，包括数据映射、转换、缓存和定时刷新
> - **灵活配置**：在配置面板中提供可视化的联动、条件和数据绑定配置"

---

## 六、验证方式

### 6.1 功能测试
```bash
# 1. 测试组件联动
# - 修改源组件属性
# - 验证目标组件是否更新

# 2. 测试条件渲染
# - 修改条件组件属性
# - 验证目标组件是否显示/隐藏

# 3. 测试数据绑定
# - 配置数据源
# - 验证组件数据是否正确更新
```

### 6.2 性能测试
```bash
# 1. 测试联动性能
# - 100 个联动关系
# - 验证更新响应时间

# 2. 测试条件渲染性能
# - 100 个条件表达式
# - 验证评估时间

# 3. 测试数据绑定性能
# - 100 个数据绑定
# - 验证数据更新时间
```

---

## 七、关键文件清单

### 需要创建的文件
- `packages/utils/src/linkage-engine.ts` - 联动引擎
- `packages/utils/src/condition-engine.ts` - 条件引擎
- `packages/utils/src/data-binding-engine.ts` - 数据绑定引擎
- `apps/cms/src/tests/linkage.test.ts` - 联动测试
- `apps/cms/src/tests/condition.test.ts` - 条件测试
- `apps/cms/src/tests/data-binding.test.ts` - 数据绑定测试

### 需要修改的文件
- `packages/types/src/index.ts` - 扩展 Schema 类型
- `apps/cms/src/store/usePageStore.ts` - 集成引擎
- `apps/cms/src/views/Decorate/components/RightConfig.vue` - 配置面板
- `apps/crs/src/renderer.ts` - 渲染器集成

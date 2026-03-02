# Events、Condition、State 扩展计划

## 📋 一、现状分析

### 当前状态
- **type.ts**: 已定义 `IComponentSchemaV2` 接口包含 `events`、`condition`、`state` 三个字段
- **schema-adapter.ts**: 迁移适配器已初始化这些字段，但未实际使用
- **usePageStore.ts**: 组件创建时设置了 `condition: true`，其余字段未使用
- **/apps**: 项目应用层（CMS编辑器、CRS渲染服务）完全未使用这三个字段

### 字段定义回顾
```typescript
// events: 事件行为队列映射
events?: Record<string, IActionSchema[]>; // 如: { click: [...], load: [...] }

// condition: 条件渲染（布尔值或表达式）
condition?: boolean | string; // 如: true | "item.visible" | "state.count > 0"

// state: 组件局部状态
state?: Record<string, unknown>; // 如: { visible: false, count: 0 }
```

---

## 🎯 二、扩 展 目 标

### 核心价值
将这三个字段从**预留字段**转变为**核心功能**，构建完整的组件交互系统：

| 字段 | 作用 | 业务价值 |
|------|------|----------|
| `events` | 声明式事件绑定 | 实现组件交互行为的可视化配置 |
| `condition` | 动态条件渲染 | 实现基于业务逻辑的显示/隐藏控制 |
| `state` | 组件局部状态 | 支持组件内部状态管理和响应式更新 |

---

## 📐 三、扩 展 方 案

### 方案A：完整交互系统（推荐）

#### 阶段 1：基础设施建设

**1.1 事件系统设计**
```
事件类型定义 (packages/types/src/events.ts)
├── 鼠标事件: click, dbclick, mouseenter, mouseleave
├── 触摸事件: touchstart, touchend
├── 生命周期: mounted, unmounted, beforeUnmount
├── 数据事件: data_LOADED, data_ERROR, data_SUCCESS
├── 自定义事件: (业务可扩展)
```

**1.2 行为动作设计**
```
动作类型定义 (packages/types/src/actions.ts)
├── navigate: 路由跳转
├── apiCall: API 调用
├── stateChange: 状态更新
├── toast: 消息提示
├── modal: 弹窗控制
├── setVariable: 设置变量
├── runScript: 执行脚本
└── inherit: 继续传播
```

**1.3 表达式引擎**
```
表达式求值器 (packages/utils/src/expression.ts)
├── 解析器: 将字符串表达式解析为 AST
├── 求值器: 执行表达式（支持安全沙箱）
├── 辅助函数: $state, $props, $event, $api
└── 类型推断: 表达式类型检查
```

#### 阶段 2：CMS 编辑器增强

**2.1 新增配置面板**
```
组件配置面板 (apps/cms/src/components/configs/)
├── EventConfig.vue          // 事件配置面板
│   ├── 事件列表（可添加/删除）
│   ├── 事件类型选择
│   ├── 动作列表配置
│   └── 动作条件设置
│
├── ConditionConfig.vue      // 条件配置面板
│   ├── 条件模式切换（常量/变量/表达式）
│   ├── 表达式编辑器（支持语法高亮）
│   └── 预览效果
│
└── StateConfig.vue          // 状态配置面板
    ├── 状态项列表（key-value）
    ├── 类型选择（string/number/boolean/object）
    └── 默认值设置
```

**2.2 可视化流程图**
```
事件-动作流程图 (apps/cms/src/views/Decorate/)
├── 事件触发器图标 🎯
├── 动作节点 ✨
├── 条件分支 🌿
└── 连接线（可拖拽编排）
```

#### 阶段 3：渲染服务实现

**3.1 事件监听器**
```typescript
// packages/hooks/src/useComponentEvents.ts
import { onMounted, onUnmounted } from 'vue';

export function useComponentEvents(
  events: Record<string, IActionSchema[]> | undefined,
  state: Ref<Record<string, unknown>>,
  props: Ref<Record<string, unknown>>,
) {
  onMounted(() => {
    if (!events) return;
    
    Object.entries(events).forEach(([eventType, actions]) => {
      // 注册事件监听
      registerEventListener(eventType, async (event) => {
        for (const action of actions) {
          // 检查条件
          if (!checkCondition(action.condition, { event, state, props })) {
            continue;
          }
          
          // 执行动作
          await executeAction(action, { event, state, props });
        }
      });
    });
  });
  
  onUnmounted(() => {
    // 清理事件监听
  });
}
```

**3.2 条件渲染指令**
```typescript
// packages/hooks/src/useConditionalRender.ts
export function useConditionalRender(
  condition: Ref<boolean | string>,
  state: Ref<Record<string, unknown>>,
  props: Ref<Record<string, unknown>>,
) {
  const shouldRender = computed(() => {
    if (typeof condition === 'boolean') {
      return condition;
    }
    
    if (typeof condition === 'string') {
      return evaluateExpression(condition, { state, props });
    }
    
    return false;
  });
  
  return shouldRender;
}
```

**3.3 状态管理**
```typescript
// packages/hooks/src/useComponentState.ts
export function useComponentState(
  initialState: Record<string, unknown> | undefined
) {
  const state = ref(initialState || {});
  
  const setState = (key: string | Record<string, unknown>, value?: unknown) => {
    if (typeof key === 'string') {
      state.value[key] = value;
    } else {
      state.value = { ...state.value, ...key };
    }
  };
  
  const getState = (key: string) => {
    return state.value[key];
  };
  
  return { state, setState, getState };
}
```

#### 阶段 4：高级功能

**4.1 组件间通信**
```
跨组件状态共享
├── 全局状态 (Page State)
├── 组件间通信 (Event Bus)
└── 父子组件通信 (Props / Emit)
```

**4.2 数据绑定**
```typescript
// 支持双向绑定
props: {
  visible: "@state.dialogVisible",  // 从状态绑定
  title: "@props.pageTitle",        // 从props绑定
  count: "{{state.count + 1}}"      // 表达式
}
```

**4.3 逻辑组件（无UI）**
```
逻辑组件类型 (Mock Component)
├── for: 循环渲染
├── if: 条件渲染
├── watch: 监听变化
└── computed: 计算属性
```

---

### 方案B：快速验证版本（MVP）

如果需要快速验证，可以采用简化方案：

#### 功能清单
- [ ] 1. 条件渲染（最 직접적이고 유용）
- [ ] 2. 基础事件（click 事件）
- [ ] 3. 简单状态（布尔值切换）

#### 实现步骤
1. **CRS 渲染层**：实现条件渲染
2. **CMS 编辑层**：添加条件配置输入框
3. **测试验证**：创建测试页面验证功能

---

## 🏗️ 四、文 件 结 构

### 新增文件结构

```
packages/
├── types/
│   ├── src/
│   │   ├── schema.ts              (已有，补充类型)
│   │   ├── events.ts              (新增) 事件类型定义
│   │   ├── actions.ts             (新增) 动作类型定义
│   │   └── expression.ts          (新增) 表达式类型定义
│   └── ...
│
└── utils/
    ├── src/
    │   ├── schema-adapter.ts      (已有，补充转换逻辑)
    │   ├── expression.ts          (新增) 表达式求值
    │   ├── event-parser.ts        (新增) 事件解析
    │   └── state-manager.ts       (新增) 状态管理工具
    └── ...

apps/
├── cms/                           (CMS编辑器)
│   ├── src/
│   │   ├── components/
│   │   │   └── configs/
│   │   │       ├── EventConfig.vue         (新增)
│   │   │       ├── ConditionConfig.vue     (新增)
│   │   │       └── StateConfig.vue         (新增)
│   │   ├── hooks/
│   │   │   ├── useComponentEvents.ts       (新增)
│   │   │   ├── useConditionalRender.ts     (新增)
│   │   │   └── useComponentState.ts        (新增)
│   │   └── views/
│   │       └── Decorate/
│   │           ├── components/
│   │           │   └── ComponentTree.vue   (增强：显示事件/条件)
│   │           └── schema-viewer.vue       (新增：Schema查看器)
│   └── ...
│
└── crs/                           (客户端渲染服务)
    ├── src/
    │   ├── directives/
    │   │   ├── v-condition.ts     (新增) 条件渲染指令
    │   │   └── v-event.ts         (新增) 事件绑定指令
    │   ├── composables/
    │   │   ├── useEvents.ts       (新增)
    │   │   ├── useCondition.ts    (新增)
    │   │   └── useState.ts        (新增)
    │   └── renderer/
    │       └── ComponentRenderer.vue  (新增：智能组件渲染器)
    └── ...
```

---

## 🎨 五、使 用 例 子

### 示例 1：条件渲染按钮

```typescript
// 组件配置
{
  id: "btn-001",
  type: "CmsButton",
  props: { text: "登录按钮" },
  condition: "@state.isLoggedIn",  // 登录后才显示
  state: { isLoggedIn: false }
}
```

### 示例 2：点击弹窗

```typescript
{
  id: "dialog-001",
  type: "Dialog",
  props: { title: "提示", visible: false },
  events: {
    click: [
      {
        type: "stateChange",
        config: {
          target: "@state.dialogVisible",
          value: true
        }
      }
    ]
  },
  state: { dialogVisible: false }
}
```

### 示例 3：循环列表 + 条件显示

```typescript
{
  id: "list-001",
  type: "ProductList",
  props: { items: "@api.products" },
  events: {
    mounted: [
      {
        type: "apiCall",
        config: {
          url: "/api/products",
          successAction: "setState(items, $data)"
        }
      }
    ]
  },
  children: [
    {
      id: "item-{{index}}",
      type: "ProductItem",
      condition: "@item.stock > 0",  // 库存大于0才显示
      state: { index: "{{index}}" }
    }
  ]
}
```

---

## 🔧 六、技 术 细 节

### 表达式语法设计

```typescript
// 支持的语法
"@state.count"           // 访问状态
"@props.title"           // 访问props
"@api.data.list"         // 访问API数据
"state.count > 10"       // 表达式比较
"state.items.length > 0" // 调用方法
"state.name || '默认'"    // 三元运算
"state.items.filter(i => i.visible)" // 函数调用（需安全沙箱）
```

### 安全考虑

```typescript
// 表达式求值器需要
├── 沙箱环境（避免任意代码执行）
├── 白名单函数（只允许安全的操作）
├── 作用域限制（只能访问授权的数据）
└── 异常处理（表达式错误不影响整体）
```

---

## 📅 七、实 施 计 划

### Week 1: 基础设施
- [ ] 定义事件、动作类型
- [ ] 实现表达式求值器
- [ ] 编写类型定义

### Week 2: CMS 增强
- [ ] 条件配置面板
- [ ] 事件配置面板
- [ ] 状态配置面板

### Week 3: CRS 渲染
- [ ] 条件渲染实现
- [ ] 事件监听实现
- [ ] 状态管理实现

### Week 4: 测试优化
- [ ] 单元测试
- [ ] E2E测试
- [ ] 文档完善

---

## 🎯 八、优 先 级 建 议

### P0 - 必须实现（核心功能）
1. **条件渲染**：最直接的业务价值
2. **基础事件**：click 事件支持
3. **状态管理**：简单的状态更新

### P1 - 应该实现（重要功能）
1. **API调用**：组件内发起请求
2. **路由跳转**：页面导航
3. **消息提示**：用户反馈

### P2 - 可选实现（增强功能）
1. **表达式脚本**：复杂逻辑
2. **组件通信**：跨组件交互
3. **数据绑定**：双向绑定

---

## 📚 九、相 关 文件

### 现有文件（需要修改）
- `packages/types/src/schema.ts` - 类型定义补充
- `packages/utils/src/schema-adapter.ts` - 迁移适配增强
- `apps/cms/src/store/usePageStore.ts` - Store 增强

### 外部参考
- [Vue 3 reactivity API](https://vuejs.org/api/reactivity-core.html)
- [Pinia store](https://pinia.vuejs.org/)
- [Vue Use](https://vueuse.org/)

---

## ✅ 十、总 结

### 核心收益
1. **可视化配置**：非开发人员可通过界面配置交互
2. **减少代码**：大部分交互无需编写代码
3. **统一管理**：事件、条件、状态集中管理
4. **易于维护**：声明式配置比 Imperative 代码更易维护

### 风险评估
- **复杂度**：中等（需要设计良好的API）
- **性能**：低（表达式求值可优化）
- **维护成本**：中等（需要持续维护表达式引擎）

### 建议
**推荐采用方案A，分阶段实施：**
1. 先实现 MVP（条件渲染 + 基础事件）
2. 收集业务反馈
3. 逐步完善高级功能

---

**版本**: v1.0  
**最后更新**: 2026-03-02  
**作者**: Qwen Code Agent

# 详细文档实施计划

## 一、ARCHITECTURE.md - 架构设计文档

### 1.1 文档结构

```markdown
# CMS 可视化搭建平台 - 架构设计文档

## 一、项目概览
- 项目定位
- 核心功能
- 技术栈

## 二、整体架构
- Monorepo 结构
- 应用划分（cms + crs）
- 包划分（ui + utils + types + hooks）

## 三、Schema V2 协议设计
- 协议版本演进
- 数据结构设计
- 组件嵌套机制
- 状态管理

## 四、编辑器架构
- 三板斧设计（LeftMaterial + CenterCanvas + RightConfig）
- 数据流向
- 状态管理（Pinia）
- 事件系统

## 五、组件系统
- 组件注册机制
- 组件库结构
- 物料系统
- 组件治理

## 六、发布流程
- 草稿管理
- 发布前预检
- 发布记录
- 回滚机制

## 七、性能优化
- 虚拟滚动
- 防抖节流
- 组件缓存
- 构建优化

## 八、工程化体系
- Monorepo 管理
- CI/CD 流程
- 代码质量门禁
- 安全扫描
```

### 1.2 关键内容

**Schema V2 协议设计：**
```typescript
// 核心数据结构
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

interface IComponentSchemaV2 {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[];
  events?: Record<string, unknown>;
}

// 设计优势：
// 1. 数据与视图分离
// 2. 支持组件嵌套
// 3. 易于扩展
// 4. 易于序列化
```

**编辑器数据流：**
```
用户操作
  ↓
事件处理
  ↓
状态更新（Pinia）
  ↓
Schema 更新
  ↓
视图重新渲染
  ↓
草稿自动保存
```

---

## 二、PERFORMANCE.md - 性能优化指南

### 2.1 文档结构

```markdown
# 性能优化指南

## 一、性能指标
- Core Web Vitals（LCP、FID、CLS）
- 自定义指标（编辑器响应时间、渲染时间等）

## 二、虚拟滚动优化
- 原理
- 实现方式
- 性能对比
- 最佳实践

## 三、编辑器渲染优化
- 防抖和节流
- 组件缓存
- Undo/Redo 优化
- 性能对比

## 四、构建优化
- 代码分割
- 依赖优化
- 压缩优化
- 性能对比

## 五、性能监控
- 监控指标
- 上报机制
- 告警设置
- 性能报告

## 六、性能基准测试
- 测试场景
- 测试结果
- 性能对比
- 优化建议

## 七、常见问题
- Q: 为什么虚拟滚动后拖拽变慢了？
- Q: 如何处理组件高度不一致的情况？
- Q: 性能监控会影响性能吗？
```

### 2.2 关键内容

**性能指标对比表：**

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| LCP | 3.2s | 1.5s | 53% |
| FID | 150ms | 50ms | 67% |
| CLS | 0.15 | 0.05 | 67% |
| 编辑器渲染（100 组件） | 300ms | 100ms | 67% |
| 编辑器渲染（1000 组件） | 超时 | 500ms | ✅ |
| 拖拽响应时间 | 100ms | 30ms | 70% |
| 内存占用 | 200MB | 100MB | 50% |
| 包体积 | 500KB | 300KB | 40% |
| 构建时间 | 45s | 28s | 38% |

**虚拟滚动实现指南：**
```typescript
// 核心算法
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

// 性能优化技巧
// 1. 使用 transform 而不是 top/left
// 2. 使用 requestAnimationFrame 处理滚动
// 3. 使用 IntersectionObserver 检测可见性
// 4. 缓存计算结果
```

---

## 三、CASE-STUDIES.md - 优化案例研究

### 3.1 文档结构

```markdown
# 优化案例研究

## 案例 1：虚拟滚动优化
### 问题
- 编辑器中 100+ 组件时卡顿
- 内存占用过高
- 拖拽响应缓慢

### 解决方案
- 实现虚拟滚动
- 只渲染可见区域的组件
- 使用缓冲区处理边界情况

### 结果
- 渲染时间从 300ms 降至 100ms（67% 提升）
- 内存占用从 200MB 降至 100MB（50% 降低）
- 拖拽响应时间从 100ms 降至 30ms（70% 提升）

### 关键代码
[代码示例]

### 学到的经验
[经验总结]

## 案例 2：编辑器渲染优化
### 问题
- 频繁的状态更新导致重新渲染
- 防抖时间设置不合理
- 组件缓存不充分

### 解决方案
- 根据操作类型调整防抖时间
- 使用 shallowRef 减少深度响应式
- 实现组件级别的缓存

### 结果
- 编辑器响应时间提升 40%
- CPU 占用率降低 30%

### 关键代码
[代码示例]

### 学到的经验
[经验总结]

## 案例 3：构建优化
### 问题
- 构建时间过长（45s）
- 包体积过大（500KB）
- 首屏加载时间长（3.2s）

### 解决方案
- 实现路由级别的代码分割
- 按需导入 Element Plus 和 VueUse
- 启用 gzip 压缩

### 结果
- 构建时间从 45s 降至 28s（38% 提升）
- 包体积从 500KB 降至 300KB（40% 降低）
- LCP 从 3.2s 降至 1.5s（53% 提升）

### 关键代码
[代码示例]

### 学到的经验
[经验总结]

## 案例 4：Undo/Redo 优化
### 问题
- 每次操作都深拷贝整个 schema
- 历史记录占用内存过多
- 撤销/重做响应缓慢

### 解决方案
- 实现增量保存（只保存变化的部分）
- 压缩历史记录（合并相似操作）
- 异步保存（不阻塞主线程）

### 结果
- 内存占用降低 40%
- 撤销/重做响应时间提升 50%

### 关键代码
[代码示例]

### 学到的经验
[经验总结]
```

### 3.2 案例模板

每个案例应包含：
1. **问题描述** - 具体的性能问题
2. **根本原因** - 为什么会出现这个问题
3. **解决方案** - 具体的优化方案
4. **实现步骤** - 如何实现
5. **性能对比** - 优化前后的数据
6. **关键代码** - 核心实现代码
7. **学到的经验** - 经验总结和最佳实践
8. **可能的陷阱** - 需要注意的问题

---

## 四、DEVELOPMENT.md - 开发指南

### 4.1 文档结构

```markdown
# 开发指南

## 一、本地开发
- 环境要求
- 安装依赖
- 启动开发服务器
- 调试技巧

## 二、项目结构
- Monorepo 结构
- 应用结构
- 包结构
- 文件命名规范

## 三、开发流程
- 创建分支
- 开发功能
- 提交代码
- 创建 PR
- 代码审查
- 合并代码

## 四、编码规范
- TypeScript 规范
- Vue 3 规范
- 命名规范
- 注释规范

## 五、测试指南
- 单元测试
- 集成测试
- E2E 测试
- 性能测试

## 六、调试技巧
- Vue DevTools
- Chrome DevTools
- 性能分析
- 内存分析

## 七、常见问题
- Q: 如何添加新的组件？
- Q: 如何修改 Schema 协议？
- Q: 如何优化性能？
```

---

## 五、API.md - API 文档

### 5.1 文档结构

```markdown
# API 文档

## 一、usePageStore
### 方法
- setInitPageSchema()
- setPageConfig()
- setActiveId()
- addComponent()
- removeComponent()
- updateComponent()
- undo()
- redo()

### 属性
- pageSchema
- activeComponentId
- selectedComponentIds
- canUndo
- canRedo

## 二、usePageDraft
### 方法
- loadPageDraft()
- savePageDraft()
- clearPageDraft()

## 三、usePagePublish
### 方法
- getLocalPublishLogs()
- markPageDraft()
- publishPage()
- rollbackPage()

## 四、UI 组件库
### 组件列表
- NoticeBlock
- CarouselBlock
- ProductBlock
- ImageBlock
- ...

### 组件 API
- Props
- Events
- Slots
- 使用示例
```

---

## 六、实施时间表

| 文档 | 时间 | 完成度 |
|------|------|--------|
| ARCHITECTURE.md | 10h | 0% |
| PERFORMANCE.md | 10h | 0% |
| CASE-STUDIES.md | 10h | 0% |
| DEVELOPMENT.md | 5h | 0% |
| API.md | 5h | 0% |
| **总计** | **40h** | |

---

## 七、文档检查清单

- [ ] 文档结构清晰
- [ ] 代码示例完整
- [ ] 性能数据准确
- [ ] 链接正确
- [ ] 格式统一
- [ ] 拼写检查
- [ ] 技术审查
- [ ] 发布前审查

---

## 八、文档维护

### 8.1 更新频率
- ARCHITECTURE.md：每个大版本更新一次
- PERFORMANCE.md：每个优化完成后更新
- CASE-STUDIES.md：每个案例完成后更新
- DEVELOPMENT.md：每个流程变更后更新
- API.md：每个 API 变更后更新

### 8.2 版本控制
- 使用 git 管理文档版本
- 在 README.md 中记录文档版本
- 保留历史版本的链接

---

## 九、文档发布

### 9.1 发布位置
- GitHub Wiki
- 项目 docs 目录
- 内部文档平台

### 9.2 发布流程
1. 编写文档
2. 技术审查
3. 格式检查
4. 发布到 docs 目录
5. 更新 README.md 中的文档链接
6. 发布到 GitHub Wiki（可选）

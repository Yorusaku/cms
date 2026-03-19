# JavaScript 面试题 Q&A（飞书友好版）

> 用途：用于前端面试中的 JavaScript 专题复习。  
> 风格：按 Q&A 组织，兼顾“能直接复述”和“放到飞书里看起来清晰”。  
> 阅读建议：先看“高频题总览”，再看各题的“面试一句话”和代码示例。

---

## 文档导航

| 模块 | 题号 | 内容 |
| --- | --- | --- |
| 语言基础 | 1-14 | 闭包、作用域、类型转换、拷贝、原型链、Promise、存储等 |
| 机制与底层 | 15-19 | async/await 原理、事件循环、渲染、GC、WeakMap |
| 手写题与设计题 | 20-26 | Promise/A+、柯里化、防抖节流、调度器、EventEmitter |
| 浏览器与安全 | 27-29 | CORS、XSS/CSRF、Generator |

## 高频题总览

| 高频级别 | 题号 | 主题 | 面试必须说到的点 |
| --- | --- | --- | --- |
| 很高 | 1 | 闭包 | 词法作用域、私有变量、内存泄漏 |
| 很高 | 2 | `var` / `let` / `const` | 作用域、提升、TDZ |
| 很高 | 3 | 类型转换 | `==` vs `===`、隐式转换 |
| 很高 | 10 | `this` | 调用方式决定指向、箭头函数例外 |
| 很高 | 12 | Promise 并发 | `all` / `race` / `allSettled` / `any` |
| 很高 | 16 | Event Loop | 同步栈、微任务、宏任务 |
| 很高 | 17 | 浏览器渲染 | CRP、重排、重绘、优化 |
| 很高 | 22 | 防抖节流 | 最后一次执行 vs 固定频率执行 |
| 很高 | 23 | ESM vs CJS | 静态分析、同步加载、live binding |
| 很高 | 24 | Virtual DOM | 状态驱动 UI、Diff 启发式比较 |
| 很高 | 27 | CORS | 简单请求、预检请求、响应头 |
| 很高 | 28 | XSS / CSRF | 攻击原理和防护手段 |

---

## 第一部分：语言基础

### 1. 什么是闭包（Closure）？它可能导致哪些问题？如何避免内存泄漏？

**Q：什么是闭包（Closure）？它可能导致哪些问题？如何避免内存泄漏？**

**A：**

闭包本质上是“函数和它定义时所在词法作用域的组合”。即使外层函数已经执行完，内部函数仍然可以访问外层作用域里的变量。

闭包常见用途：

- 封装私有变量
- 实现柯里化
- 实现防抖、节流
- 在异步回调中保存上下文

它可能带来的问题主要有两个：

- 不再需要的变量被闭包持续引用，导致垃圾回收器无法及时回收，形成内存泄漏
- 在循环里配合 `var` 使用时，容易拿到同一个变量的最终值

避免内存泄漏的关键做法：

- 不要让无用闭包被全局变量长期持有
- 定时器用完及时 `clearTimeout` 或 `clearInterval`
- 事件监听不需要时及时 `removeEventListener`
- 大对象或 DOM 引用不再使用时及时置空

**面试一句话：** 闭包本身不是问题，问题在于它会把本该释放的变量继续引用住。

---

### 2. `var`、`let` 和 `const` 的区别是什么？

**Q：`var`、`let` 和 `const` 的区别是什么？请说明它们在作用域、变量提升和暂时性死区方面的不同。**

**A：**

| 维度 | `var` | `let` | `const` |
| --- | --- | --- | --- |
| 作用域 | 函数作用域 | 块级作用域 | 块级作用域 |
| 变量提升 | 有 | 有 | 有 |
| 提升后状态 | `undefined` | 处于 TDZ | 处于 TDZ |
| 暂时性死区 | 无 | 有 | 有 |
| 可重复声明 | 可以 | 不可以 | 不可以 |
| 可重新赋值 | 可以 | 可以 | 不可以 |
| 是否必须初始化 | 否 | 否 | 是 |

补充一点：`const` 保证的是“绑定关系不变”，不是“值绝对不可变”。如果 `const` 声明的是对象，对象内部属性仍然可以修改。

**面试一句话：** 现代 JavaScript 开发优先 `const`，需要重新赋值时用 `let`，基本不建议再用 `var`。

---

### 3. JavaScript 中的类型转换规则是什么？`==` 和 `===` 有什么区别？`[] == ![]` 为什么是 `true`？

**Q：请解释 JavaScript 中的类型转换规则，特别是 `==` 和 `===` 的区别。`[] == ![]` 的结果是什么，为什么？**

**A：**

`==` 在比较前会发生隐式类型转换，`===` 不会，要求类型和值都完全相等。

| 比较符 | 是否类型转换 | 适用建议 |
| --- | --- | --- |
| `==` | 会 | 除非非常清楚规则，否则少用 |
| `===` | 不会 | 默认优先使用 |

`[] == ![]` 的结果是 `true`，原因分三步：

1. `![]` 先计算，空数组是 truthy，所以 `![]` 得到 `false`
2. 表达式变成 `[] == false`
3. 比较时发生隐式转换：`false -> 0`，`[] -> '' -> 0`

最终变成：

```js
0 == 0 // true
```

**面试一句话：** `==` 的可怕之处不是功能弱，而是隐式转换太多，容易出现反直觉结果。

---

### 4. 什么是浅拷贝和深拷贝？如何手写一个深拷贝函数？

**Q：什么是浅拷贝（Shallow Copy）和深拷贝（Deep Copy）？如何手动实现一个深拷贝函数？**

**A：**

| 类型 | 含义 | 风险 |
| --- | --- | --- |
| 浅拷贝 | 只复制第一层属性 | 嵌套对象仍共享引用 |
| 深拷贝 | 递归复制每一层 | 实现复杂度更高 |

常见浅拷贝方式：

- 展开运算符 `...`
- `Object.assign()`
- 数组的 `slice()`、`concat()`

手写深拷贝时通常要考虑：

- 基本类型直接返回
- 数组和对象分别处理
- 循环引用
- `Date`、`RegExp` 等特殊对象

```js
function deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target

  if (map.has(target)) return map.get(target)

  if (target instanceof Date) return new Date(target)
  if (target instanceof RegExp) return new RegExp(target)

  const clone = Array.isArray(target) ? [] : {}
  map.set(target, clone)

  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      clone[key] = deepClone(target[key], map)
    }
  }

  return clone
}
```

如果运行环境支持，也可以优先考虑 `structuredClone()`，但它并不能覆盖所有场景。

**面试一句话：** 浅拷贝复制的是第一层值，深拷贝复制的是整条对象引用链。

---

### 5. `Symbol` 的独特用途是什么？和字符串属性键有什么区别？

**Q：`Symbol` 这种基本数据类型有什么独特的用途？它和字符串作为对象属性键有什么区别？**

**A：**

`Symbol` 是一种唯一且不可变的基本数据类型，最核心的价值是“避免属性名冲突”。

| 对比点 | 字符串键 | `Symbol` 键 |
| --- | --- | --- |
| 是否容易重名 | 容易 | 不容易 |
| 是否可遍历 | 常规可遍历 | 默认不可被常规遍历取到 |
| 典型用途 | 普通公开字段 | 内部标识、协议扩展 |

典型用途：

- 作为对象的唯一属性键，避免命名冲突
- 定义对象的内部行为，比如 `Symbol.iterator`
- 在框架或工具库里做私有语义字段

获取 `Symbol` 键常用方法：

- `Object.getOwnPropertySymbols()`
- `Reflect.ownKeys()`

**面试一句话：** 字符串键适合业务字段，`Symbol` 更适合唯一标识和内部协议。

---

### 6. `Proxy` 和 `Reflect` 是什么？能举一个实际应用场景吗？

**Q：`Proxy` 和 `Reflect` 是做什么的？请举一个实际应用场景，比如实现一个响应式对象。**

**A：**

`Proxy` 用来拦截对象的基础操作，比如读取、赋值、删除、`in` 判断等。  
`Reflect` 提供和这些操作对应的标准方法，通常在 `Proxy` 中配合使用。

可以把它们理解成：

- `Proxy` 负责“拦截”
- `Reflect` 负责“规范地执行默认行为”

```js
const data = { count: 0 }

const state = new Proxy(data, {
  get(target, key, receiver) {
    console.log('读取:', key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    console.log('修改:', key, value)
    return Reflect.set(target, key, value, receiver)
  }
})

state.count
state.count = 1
```

Vue 3 的响应式实现就是基于 `Proxy`。

**面试一句话：** `Proxy` 让你接管对象行为，`Reflect` 让你以标准方式把原操作执行回去。

---

### 7. `Array.prototype.map` 和 `Array.prototype.forEach` 的区别是什么？

**Q：`Array.prototype.map` 和 `Array.prototype.forEach` 的区别是什么？`map` 可以被 `forEach` 替代吗，为什么？**

**A：**

| 方法 | 核心用途 | 返回值 | 常见场景 |
| --- | --- | --- | --- |
| `forEach` | 遍历并执行副作用 | `undefined` | 打印、发请求、修改外部状态 |
| `map` | 遍历并生成新数组 | 新数组 | 数据转换 |

示例：

```js
const nums = [1, 2, 3]

nums.forEach((n) => console.log(n))

const doubled = nums.map((n) => n * 2)
```

`map` 不能完全替代 `forEach`。如果你只是想做副作用操作，却使用 `map`，虽然代码能跑，但会额外创建一个没有意义的新数组，语义也不准确。

**面试一句话：** `forEach` 是“遍历做事”，`map` 是“遍历并产出一个新数组”。

---

### 8. `reduce` 是如何工作的？如何用它实现 `map`、`filter` 和 `flat`？

**Q：`Array.prototype.reduce` 方法是如何工作的？请用它实现 `map`、`filter` 和 `flat`。**

**A：**

`reduce` 的核心思想是把数组“归约”为一个结果。这个结果可以是数字、字符串、对象或数组。

标准签名：

```js
arr.reduce((acc, cur, index, array) => {
  return acc
}, initialValue)
```

用 `reduce` 实现 `map`：

```js
const map = (arr, fn) =>
  arr.reduce((acc, cur, index) => {
    acc.push(fn(cur, index, arr))
    return acc
  }, [])
```

用 `reduce` 实现 `filter`：

```js
const filter = (arr, fn) =>
  arr.reduce((acc, cur, index) => {
    if (fn(cur, index, arr)) acc.push(cur)
    return acc
  }, [])
```

用 `reduce` 实现 `flat`：

```js
const flat = (arr) =>
  arr.reduce((acc, cur) => {
    return acc.concat(Array.isArray(cur) ? flat(cur) : cur)
  }, [])
```

**面试一句话：** `reduce` 的本质是“你自己定义累计规则”，所以它可以模拟很多数组方法。

---

### 9. 什么是原型链？`__proto__` 和 `prototype` 的关系与区别是什么？

**Q：什么是原型链（Prototype Chain）？`__proto__` 和 `prototype` 的关系与区别是什么？**

**A：**

原型链是 JavaScript 实现继承的一套查找机制。访问对象属性时，如果当前对象没有，就会沿着原型对象继续向上找。

| 概念 | 归属 | 作用 |
| --- | --- | --- |
| `prototype` | 函数 | 给实例共享方法和属性 |
| `__proto__` | 对象 | 指向其构造函数的 `prototype` |

示例：

```js
function Person() {}

const p = new Person()

console.log(p.__proto__ === Person.prototype) // true
```

一句话理解：

- `prototype` 偏“定义端”
- `__proto__` 偏“实例端”

**面试一句话：** 原型链不是魔法，本质上就是对象属性查找失败后沿着原型继续找。

---

### 10. `this` 在不同场景下分别指向什么？

**Q：`this` 的指向在不同场景下有什么区别？比如普通函数、箭头函数、构造函数、`bind/call/apply`。**

**A：**

`this` 的关键原则是：大多数情况下，它取决于“函数如何调用”，而不是“函数在哪里定义”。

| 场景 | `this` 指向 |
| --- | --- |
| 普通函数 | 谁调用指向谁；独立调用在严格模式下是 `undefined` |
| 箭头函数 | 没有自己的 `this`，继承外层作用域 |
| 构造函数 | `new` 出来的实例 |
| `call/apply` | 显式指定的对象 |
| `bind` | 返回一个永久绑定 `this` 的新函数 |

示例：

```js
const obj = {
  name: 'A',
  say() {
    console.log(this.name)
  }
}

obj.say() // A
```

**面试一句话：** 普通函数看调用方式，箭头函数看外层词法环境。

---

### 11. `BigInt` 解决了什么问题？和 `Number` 混用时要注意什么？

**Q：`BigInt` 的出现解决了什么问题？它和 `Number` 类型在使用上有什么注意事项？**

**A：**

`BigInt` 主要解决的是大整数超出 `Number.MAX_SAFE_INTEGER` 后的精度丢失问题。

```js
Number.MAX_SAFE_INTEGER // 9007199254740991
```

使用 `BigInt` 时要注意：

- 只能表示整数，不能表示小数
- 不能和 `Number` 直接混算
- 很多 `Math` 方法不能直接用在 `BigInt` 上

```js
1n + 1 // TypeError
```

**面试一句话：** `BigInt` 用来解决大整数精度问题，但它和 `Number` 不是能随意混用的。

---

### 12. `Promise.all`、`Promise.race`、`Promise.allSettled` 和 `Promise.any` 的区别是什么？

**Q：`Promise.all`、`Promise.race`、`Promise.allSettled` 和 `Promise.any` 的区别和适用场景分别是什么？**

**A：**

| 方法 | 成功条件 | 失败条件 | 适用场景 |
| --- | --- | --- | --- |
| `Promise.all` | 全部成功 | 任一失败 | 多个请求缺一不可 |
| `Promise.race` | 最先返回结果即可 | 最先返回的是失败也会失败 | 超时控制、抢最快结果 |
| `Promise.allSettled` | 全部结束 | 不会因单个失败中断 | 批量任务汇总 |
| `Promise.any` | 任一成功 | 全部失败 | 多服务兜底、镜像源请求 |

**面试一句话：** `all` 看全成，`race` 看最先，`allSettled` 看全结束，`any` 看先成功。

---

### 13. `async/await` 中如何优雅处理错误？`try...catch` 和 `.catch()` 有什么区别？

**Q：在 `async/await` 中如何进行优雅的错误处理？`try...catch` 和 `.catch()` 在使用上有什么异同？**

**A：**

`async/await` 本质上是 Promise 的语法糖，所以错误处理仍然遵循 Promise 机制。

| 方式 | 特点 | 适用场景 |
| --- | --- | --- |
| `try...catch` | 写法更像同步代码，可捕获 `await` 抛出的异常和块内同步异常 | 一整段异步流程控制 |
| `.catch()` | 粒度更细，只处理前面那个 Promise 链 | 局部兜底、链式调用 |

```js
try {
  const res = await fetchData()
  console.log(res)
} catch (error) {
  console.error(error)
}
```

**面试一句话：** 流程控制优先 `try...catch`，局部兜底可以用 `.catch()`。

---

### 14. `localStorage`、`sessionStorage` 和 Cookie 有什么区别？

**Q：浏览器中的 `localStorage`、`sessionStorage` 和 Cookie 有什么区别？**

**A：**

| 项目 | `localStorage` | `sessionStorage` | Cookie |
| --- | --- | --- | --- |
| 生命周期 | 长期存储 | 当前会话/标签页 | 可设置过期时间 |
| 容量 | 较大 | 较大 | 较小，通常约 4KB |
| 是否自动随请求发送 | 否 | 否 | 是 |
| 典型用途 | 前端本地缓存 | 临时状态保存 | 登录态、服务端会话协同 |

安全上要注意：

- 不要把敏感信息随意放在本地存储里
- 登录态如果用 Cookie，要结合 `HttpOnly`、`Secure`、`SameSite`

**面试一句话：** 前端本地缓存优先考虑 `localStorage` / `sessionStorage`，需要服务端自动参与时再考虑 Cookie。

---

## 第二部分：机制与底层

### 15. `async/await` 是如何通过 `Generator` 和 `Promise` 实现的？

**Q：`async/await` 是如何通过 `Generator` 和 `Promise` 实现的？请简述其核心转换过程。**

**A：**

从语义上看，`async/await` 可以理解成“`Generator` + 自动执行器 + Promise”的语法糖。

核心过程：

1. `async function` 会被转换成返回 Promise 的函数
2. 函数内部的 `await` 会被转换成 `yield`
3. 执行器不断调用 `generator.next()`
4. 每次拿到 `yield` 的值后，用 `Promise.resolve()` 包装
5. Promise 成功后把结果再传回生成器，继续执行

```js
function asyncToGenerator(generatorFn) {
  return function (...args) {
    const gen = generatorFn.apply(this, args)

    return new Promise((resolve, reject) => {
      function step(method, arg) {
        let result

        try {
          result = gen[method](arg)
        } catch (error) {
          reject(error)
          return
        }

        const { value, done } = result

        if (done) {
          resolve(value)
          return
        }

        Promise.resolve(value).then(
          (val) => step('next', val),
          (err) => step('throw', err)
        )
      }

      step('next')
    })
  }
}
```

**面试一句话：** `await` 负责“暂停”，Promise 负责“等待结果”，执行器负责“恢复执行”。

---

### 16. JavaScript 的事件循环机制是什么？浏览器和 Node.js 有什么差异？

**Q：请深入解释 JavaScript 的事件循环（Event Loop）机制，特别是微任务和宏任务在浏览器和 Node.js 环境中的执行差异。**

**A：**

JavaScript 是单线程的，但它能处理异步，是因为有事件循环机制。

执行顺序可以概括成：

1. 执行当前调用栈里的同步代码
2. 同步代码结束后，先清空微任务队列
3. 再执行下一个宏任务
4. 重复这个过程

常见任务分类：

| 类型 | 浏览器常见任务 |
| --- | --- |
| 微任务 | `Promise.then`、`queueMicrotask`、`MutationObserver` |
| 宏任务 | `script`、`setTimeout`、`setInterval`、DOM 事件回调 |

经典输出题：

```js
console.log(1)

setTimeout(() => console.log(2))

Promise.resolve().then(() => console.log(3))

console.log(4)
```

结果是：

```js
1
4
3
2
```

浏览器和 Node.js 的差异：

| 对比点 | 浏览器 | Node.js |
| --- | --- | --- |
| 核心模型 | 宏任务 + 微任务 + 渲染 | 多个事件循环阶段 |
| 渲染阶段 | 有 | 没有 |
| 特殊高优先级队列 | 无 | `process.nextTick` |
| 高频面试点 | 微任务先于下一轮宏任务 | `setTimeout`、`setImmediate`、`nextTick` 区别 |

**面试一句话：** 事件循环的本质是“同步代码先执行，异步任务排队，微任务优先于下一轮宏任务”。

---

### 17. 浏览器渲染过程是怎样的？什么是重排和重绘？如何优化？

**Q：谈谈你对浏览器渲染过程的理解。什么是关键渲染路径、重排和重绘？如何优化它们？**

**A：**

浏览器关键渲染路径（Critical Rendering Path）：

1. 解析 HTML，构建 DOM
2. 解析 CSS，构建 CSSOM
3. 合成 Render Tree
4. Layout，计算几何信息
5. Paint，绘制像素
6. Composite，图层合成

| 概念 | 含义 | 成本 |
| --- | --- | --- |
| Reflow / Layout | 几何信息变化后重新计算布局 | 高 |
| Repaint | 布局不变，仅重绘视觉样式 | 中 |

两者关系：

- 重排一定会触发重绘
- 重绘不一定触发重排

优化方向：

- 避免频繁读写布局信息
- 批量修改 DOM
- 动画优先使用 `transform` 和 `opacity`
- 减少复杂布局和大范围样式计算
- 对 `scroll`、`resize` 等高频事件做节流

**面试一句话：** 优化渲染性能的关键不是“完全不更新”，而是尽量减少高成本的布局和绘制。

---

### 18. V8 的垃圾回收机制是怎样的？

**Q：V8 引擎的垃圾回收机制是怎样的？请描述新生代和老生代的回收策略。**

**A：**

V8 的核心思路是分代回收：新对象和老对象采用不同策略。

| 代际 | 特点 | 主要算法 |
| --- | --- | --- |
| 新生代 | 对象多、生命周期短 | Scavenge 复制算法 |
| 老生代 | 对象少、生命周期长 | Mark-Sweep、Mark-Compact |

新生代回收：

- 通常把空间划成两块
- 一块使用，一块空闲
- 回收时把存活对象复制到另一块
- 再整体清空原空间

老生代回收：

- `Mark-Sweep`：标记存活对象，再清理未标记对象
- `Mark-Compact`：标记后整理内存，减少碎片

实际运行中 V8 还会配合增量标记、并发回收等优化，目的是降低主线程停顿。

**面试一句话：** 新生代追求“快”，老生代更关注“清得干净、减少碎片”。

---

### 19. `WeakMap` 和 `WeakSet` 与 `Map`、`Set` 的区别是什么？

**Q：什么是 `WeakMap` 和 `WeakSet`？它们与 `Map` 和 `Set` 的主要区别是什么，以及其应用场景？**

**A：**

`WeakMap` 和 `WeakSet` 的关键点是“弱引用”。

| 对比点 | `Map` / `Set` | `WeakMap` / `WeakSet` |
| --- | --- | --- |
| 键/成员类型 | 任意类型 | 只能是对象 |
| 是否阻止 GC | 会 | 不会 |
| 是否可遍历 | 可以 | 不可以 |
| 是否有 `size` | 有 | 没有 |

典型场景：

- 给 DOM 节点挂元数据
- 做不影响回收的缓存
- 框架内部管理对象关联状态

**面试一句话：** 只要你需要“对象关联信息”但又不想因为缓存导致内存泄漏，就考虑 `WeakMap`。

---

## 第三部分：手写题与设计题

### 20. 如何实现一个符合 Promise/A+ 规范的 Promise？

**Q：如何实现一个符合 Promise/A+ 规范的 Promise？需要考虑哪些核心逻辑和边界情况？**

**A：**

面试里如果问 Promise/A+，重点不是你能不能写完整源码，而是你是否理解这些核心点：

1. Promise 有三种状态：`pending`、`fulfilled`、`rejected`
2. 状态一旦变化就不可逆
3. `then` 必须返回一个新的 Promise
4. `then` 回调必须异步执行
5. 要处理值穿透和错误冒泡
6. 最难点是 Promise Resolution Procedure，也就是 thenable 解析

thenable 解析必须考虑：

- `x === promise2`，要防止循环引用
- `x` 如果是 Promise，要接管它的状态
- `x` 如果是对象或函数，要尝试取它的 `then`
- `then` 可能抛错，要捕获
- `resolve` 和 `reject` 只能认第一次调用

骨架示例：

```js
class MyPromise {
  constructor(executor) {
    this.state = 'pending'
    this.value = undefined
    this.reason = undefined
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []

    const resolve = (value) => {
      if (this.state !== 'pending') return
      this.state = 'fulfilled'
      this.value = value
      this.onFulfilledCallbacks.forEach((fn) => fn())
    }

    const reject = (reason) => {
      if (this.state !== 'pending') return
      this.state = 'rejected'
      this.reason = reason
      this.onRejectedCallbacks.forEach((fn) => fn())
    }

    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }
}
```

**面试一句话：** Promise 的难点不在状态机本身，而在 then 返回值的规范解析。

---

### 21. 什么是函数柯里化？如何实现一个通用的 `curry`？

**Q：函数柯里化（Currying）是什么？请实现一个通用的柯里化函数，并说明其在函数式编程中的意义。**

**A：**

柯里化本质上是把“接收多个参数的函数”转换成“分多次接收参数的函数”。

```js
function curry(fn, ...args) {
  return function (...restArgs) {
    const allArgs = [...args, ...restArgs]

    if (allArgs.length >= fn.length) {
      return fn.apply(this, allArgs)
    }

    return curry.call(this, fn, ...allArgs)
  }
}
```

示例：

```js
function sum(a, b, c) {
  return a + b + c
}

const curriedSum = curry(sum)

curriedSum(1)(2)(3)
curriedSum(1, 2)(3)
curriedSum(1)(2, 3)
```

它的意义：

- 参数复用
- 便于函数组合
- 让函数更声明式

**面试一句话：** 柯里化的价值不是炫技，而是让函数更容易复用和组合。

---

### 22. 如何实现 `debounce` 和 `throttle`？

**Q：请实现一个 `debounce`（防抖）和 `throttle`（节流）函数，并说明它们的区别和应用场景。**

**A：**

| 方案 | 核心策略 | 常见场景 |
| --- | --- | --- |
| 防抖 `debounce` | 只执行最后一次 | 搜索联想、输入框校验、窗口 resize |
| 节流 `throttle` | 固定时间内最多执行一次 | 滚动监听、拖拽、鼠标移动 |

防抖实现：

```js
function debounce(fn, delay) {
  let timer = null

  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}
```

节流实现：

```js
function throttle(fn, delay) {
  let lastTime = 0

  return function (...args) {
    const now = Date.now()

    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}
```

**面试一句话：** 防抖关注“最后一次”，节流关注“执行频率上限”。

---

### 23. ES Modules 和 CommonJS 的本质区别是什么？

**Q：ES Modules 和 CommonJS 在模块导入和导出方面有什么本质区别？它们的加载机制有何不同？**

**A：**

| 对比点 | ES Modules | CommonJS |
| --- | --- | --- |
| 语法 | `import` / `export` | `require` / `module.exports` |
| 依赖分析 | 静态分析 | 运行时加载 |
| 加载方式 | 更适合异步链接 | 同步加载 |
| 值语义 | live binding | 更像导出对象结果 |
| Tree Shaking | 友好 | 较差 |
| 顶层 `await` | 支持 | 不支持原生模块语义 |

一句话理解：

- CommonJS 更偏 Node 早期工程实践
- ESM 才是现代 JavaScript 的标准模块系统

**面试一句话：** ESM 最大的优势不是语法新，而是“静态可分析”。

---

### 24. 什么是 Virtual DOM？Diff 算法是如何工作的？

**Q：什么是 Virtual DOM？它的 Diff 算法是如何工作的？它解决了什么问题？**

**A：**

Virtual DOM 可以理解成“用 JavaScript 对象描述真实 DOM 结构”。

当状态变化时，框架会生成新的虚拟节点树，再和旧树做比较，把差异最小化地更新到真实 DOM。

Diff 的核心思路不是求理论最优解，而是做启发式优化：

1. 同层比较，不跨层级暴力比对
2. 节点类型不同，直接替换
3. 节点类型相同，复用节点并比较属性和子节点
4. 列表更新依赖 `key` 来判断节点是否可复用

它解决的问题主要有：

- 降低直接操作 DOM 的复杂度
- 让 UI 更新从命令式变成声明式
- 方便跨平台渲染抽象

**面试一句话：** Virtual DOM 的核心价值是“状态到 UI 的可维护更新策略”，不只是“比原生 DOM 快”。

---

### 25. 如何设计一个任务调度器来控制 Promise 并发数？

**Q：如何设计一个任务调度器（Scheduler），可以控制并发执行的 Promise 数量？**

**A：**

核心思路：

- 任务不是直接传 Promise，而是传“返回 Promise 的函数”
- 维护一个等待队列
- 维护一个当前执行数
- 执行完成后自动补位

```js
class Scheduler {
  constructor(limit) {
    this.limit = limit
    this.runningCount = 0
    this.queue = []
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject })
      this.run()
    })
  }

  run() {
    while (this.runningCount < this.limit && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift()
      this.runningCount++

      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          this.runningCount--
          this.run()
        })
    }
  }
}
```

**面试一句话：** 并发控制题的本质是“维护队列和运行中数量，并在任务结束后补位”。

---

### 26. 如何实现一个 `EventEmitter`？

**Q：请实现一个 `EventEmitter`（发布订阅模式），需要包含 `on`、`off`、`emit` 和 `once` 方法。**

**A：**

核心数据结构通常是：

- 一个 `Map`
- key 是事件名
- value 是监听函数集合

```js
class EventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set())
    }

    this.events.get(eventName).add(listener)
    return this
  }

  off(eventName, listener) {
    const listeners = this.events.get(eventName)
    if (!listeners) return this

    listeners.delete(listener)

    if (listeners.size === 0) {
      this.events.delete(eventName)
    }

    return this
  }

  emit(eventName, ...args) {
    const listeners = this.events.get(eventName)
    if (!listeners) return false

    ;[...listeners].forEach((listener) => {
      listener(...args)
    })

    return true
  }

  once(eventName, listener) {
    const wrapper = (...args) => {
      this.off(eventName, wrapper)
      listener(...args)
    }

    this.on(eventName, wrapper)
    return this
  }
}
```

**面试一句话：** `EventEmitter` 的本质就是“事件名到监听函数集合”的映射管理。

---

## 第四部分：浏览器与安全

### 27. 什么是 CORS？简单请求和预检请求有什么区别？

**Q：什么是跨域资源共享（CORS）？请解释其工作原理，特别是简单请求和预检请求的区别。**

**A：**

CORS 是浏览器在同源策略基础上，允许服务端“显式授权跨域访问”的机制。

高频响应头：

- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Credentials`

| 类型 | 特征 | 是否先发 `OPTIONS` |
| --- | --- | --- |
| 简单请求 | 方法和请求头都在浏览器允许范围内 | 否 |
| 预检请求 | 使用了复杂方法、自定义头或特殊 `Content-Type` | 是 |

常见会触发预检的情况：

- `PUT`、`DELETE` 等方法
- 自定义请求头
- `Content-Type: application/json`

**面试一句话：** CORS 本质不是前端绕过同源策略，而是浏览器和服务端之间的一次跨域授权协商。

---

### 28. 什么是 XSS 和 CSRF？如何防范？

**Q：什么是 XSS（跨站脚本攻击）和 CSRF（跨站请求伪造）？如何防范这两种攻击？**

**A：**

| 攻击类型 | 本质 | 危害 | 关键防护 |
| --- | --- | --- | --- |
| XSS | 把恶意脚本注入页面并在用户浏览器执行 | 窃取信息、冒充操作、篡改页面 | 输入校验、输出转义、CSP、避免危险 API |
| CSRF | 借用户已登录状态伪造请求 | 冒用身份发起操作 | CSRF Token、`SameSite`、校验 `Origin/Referer` |

XSS 常见类型：

- 存储型 XSS
- 反射型 XSS
- DOM 型 XSS

防范 XSS：

- 对输入做校验和过滤
- 输出到页面时做转义
- 尽量避免直接使用 `innerHTML`
- 配置 CSP
- 敏感 Cookie 使用 `HttpOnly`

防范 CSRF：

- 使用 CSRF Token
- Cookie 设置 `SameSite`
- 对敏感操作校验 `Origin` 或 `Referer`
- 不要用 `GET` 做有副作用的操作

**面试一句话：** XSS 是“往页面里注入脚本”，CSRF 是“借用户登录态发请求”。

---

### 29. 什么是 `Generator` 函数？它除了作为 `async/await` 的基础，还有哪些应用场景？

**Q：什么是 `Generator` 函数？它有什么用处？除了作为 `async/await` 的基础，还有哪些应用场景？**

**A：**

`Generator` 是一种可以暂停和恢复执行的函数。

```js
function* gen() {
  yield 1
  yield 2
  return 3
}
```

调用后不会立刻执行函数体，而是返回一个迭代器对象。每次调用 `next()`，函数才会从上一次暂停的位置继续执行。

```js
const it = gen()

it.next() // { value: 1, done: false }
it.next() // { value: 2, done: false }
it.next() // { value: 3, done: true }
```

除了作为 `async/await` 的底层思想之一，它还有这些典型场景：

- 惰性求值
- 自定义迭代器
- 状态机
- 数据流按需生成
- 早期异步流程控制，比如 `co`

**面试一句话：** `Generator` 最独特的能力不是“返回多个值”，而是“可暂停、可恢复、可控制执行过程”。

---

## 面试速记版

| 主题 | 一句话速记 |
| --- | --- |
| 闭包 | 函数 + 词法作用域，注意引用链和内存释放 |
| `var` / `let` / `const` | 作用域不同，`let/const` 有 TDZ |
| 类型转换 | `==` 会转换，`===` 不会 |
| 拷贝 | 浅拷贝复制第一层，深拷贝递归复制 |
| `Symbol` | 唯一键，避免冲突 |
| `Proxy` / `Reflect` | 拦截行为 + 标准执行原操作 |
| `map` / `forEach` | 产出新数组 vs 执行副作用 |
| `reduce` | 自定义归约规则 |
| 原型链 | 属性查找失败后沿原型向上找 |
| `this` | 普通函数看调用方式，箭头函数看外层 |
| `BigInt` | 解决大整数精度问题 |
| Promise 并发 | `all`、`race`、`allSettled`、`any` |
| 异步错误处理 | 流程控制优先 `try...catch` |
| 存储 | `localStorage` / `sessionStorage` / Cookie 用途不同 |
| `async/await` 原理 | `Generator + Promise + 自动执行器` |
| Event Loop | 同步栈、微任务、宏任务 |
| 渲染性能 | CRP、Reflow、Repaint、Composite |
| GC | 新生代复制回收，老生代标记清除和标记整理 |
| `WeakMap` / `WeakSet` | 弱引用，不阻止对象回收 |
| Promise/A+ | 状态机 + thenable 解析 |
| 柯里化 | 参数复用、组合能力更强 |
| 防抖节流 | 最后一次执行 vs 固定频率执行 |
| 模块化 | ESM 静态分析，CJS 运行时同步加载 |
| Virtual DOM | 状态驱动 UI，Diff 依赖同层比较和 `key` |
| Scheduler | 队列 + 并发上限 + 自动补位 |
| EventEmitter | 事件名映射监听器集合 |
| CORS | 跨域授权协商，非简单请求会预检 |
| XSS / CSRF | 注入脚本 vs 借登录态发请求 |
| `Generator` | 可暂停、可恢复、可控制流程 |

---

## 面试前 5 分钟复习建议

1. 先背高频题：闭包、作用域、`this`、Promise、Event Loop、渲染、模块化、安全。
2. 手写题优先准备：深拷贝、柯里化、防抖节流、调度器、EventEmitter。
3. 遇到底层题时，优先讲“为什么这样设计”，再讲“怎么实现”。
4. 回答时尽量先给一句总结，再展开 2 到 4 个关键点，节奏会更稳。

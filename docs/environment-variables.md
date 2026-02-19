# 环境变量管理规范

## 环境变量命名规范

### 前缀规则
- 所有环境变量必须以 `VITE_` 开头（Vite要求）
- 使用大写字母和下划线分隔单词

### 分类前缀
```
VITE_API_*        # API相关配置
VITE_APP_*        # 应用基本信息
VITE_DEBUG_*      # 调试相关配置
VITE_FEATURE_*    # 功能开关
VITE_SERVICE_*    # 服务地址配置
```

## 环境文件说明

### 根目录环境文件
```
.env                    # 所有环境通用配置
.env.local             # 本地开发配置（git忽略）
.env.development       # 开发环境配置
.env.production        # 生产环境配置
.env.test             # 测试环境配置
```

### 应用级环境文件
每个应用目录下可以有自己的 `.env` 文件：
```
apps/cms/.env          # CMS应用配置
apps/crs/.env          # CRS应用配置
```

## 使用示例

### 在代码中使用
```typescript
// 获取环境变量
const apiUrl = import.meta.env.VITE_API_BASE_URL
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

// 带默认值的安全访问
const getEnv = (key: string, defaultValue: string = '') => {
  return import.meta.env[key] || defaultValue
}

const appName = getEnv('VITE_APP_TITLE', '默认应用名称')
```

### 环境变量验证
```typescript
// 环境变量类型定义
interface EnvVariables {
  VITE_API_BASE_URL: string
  VITE_APP_TITLE: string
  VITE_DEBUG: string
  VITE_APP_VERSION: string
}

// 验证必需的环境变量
const requiredEnvVars: (keyof EnvVariables)[] = [
  'VITE_API_BASE_URL',
  'VITE_APP_TITLE'
]

requiredEnvVars.forEach(key => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})
```

## 最佳实践

### 1. 安全性
- 敏感信息（如密钥）不应存储在环境变量中
- 使用 `.env.local` 存储本地敏感配置
- 确保 `.env.local` 被添加到 `.gitignore`

### 2. 文档化
- 为每个环境变量提供清晰的注释说明
- 在 `.env.example` 中维护完整的变量列表
- 更新环境变量时同步更新文档

### 3. 类型安全
- 为环境变量创建TypeScript接口
- 使用类型检查确保变量正确使用
- 提供默认值避免undefined错误

### 4. 环境隔离
- 不同环境使用不同的配置文件
- 避免在代码中硬编码环境特定的值
- 使用环境变量进行环境区分

## 常用环境变量参考

### 开发环境
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DEBUG=true
VITE_APP_TITLE=开发环境
```

### 生产环境
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_DEBUG=false
VITE_APP_TITLE=生产环境
```

### 测试环境
```bash
VITE_API_BASE_URL=https://test-api.yourdomain.com
VITE_DEBUG=true
VITE_APP_TITLE=测试环境
```
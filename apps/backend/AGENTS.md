# Backend 差异约定

通用规则与最高约束见根 AGENTS.md、constitution.md。

- 本包是 CommonJS，保持 tsconfig 的 commonjs、Nest 装饰器及元数据配置；不要套前端 ESM/import.meta 用法。Jest 的 @cms/types 根入口走 test/mocks/cms-types.ts，子路径走 dist/cjs；公共契约变更要同步核对两处解析。
- 数据库运行配置在 src/database/database.module.ts，migration CLI 配置在 src/database/data-source.ts；新增实体必须核对运行时实体注册与 migration，两处都保持 synchronize=false。迁移、回滚、seed 执行前需明确目标数据库与授权；生成 migration 必须给目标路径，不能只运行无参数脚本。
- 测试使用 Jest，单次执行用根命令表的 backend Jest 命令；不要接收前端 Vitest 的 --run 参数。前端 mock E2E 不代表后端或数据库链路通过。
- 业务异常沿用 AllExceptionsFilter 的 HTTP 200 + code/message/data，探针 /health 使用真实状态码；不要把业务接口改成常规 HTTP 错误码而不同步调用方。
- 上传统一走 StorageAdapter；local 上传目录只由 resolveUploadDir() 解析，s3 不挂载本地静态目录。生产配置校验由 common/config/env-validation.ts 执行，不用开发默认凭据绕过启动失败。

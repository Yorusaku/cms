# 阶段一：CI/CD 质量门禁基线

## 目标

在 Monorepo 中建立统一的基础质量门禁，确保合并前至少通过：

- lint
- typecheck
- test
- build

## 本阶段新增产物

- 根脚本（`package.json`）：`ci:lint`、`ci:typecheck`、`ci:test`、`ci:build`、`ci:quality`、`ci:all`
- GitLab 流水线：`.gitlab-ci.yml`

## 关键设计

1. 所有流水线 job 直接调用根脚本，避免把检查逻辑散落在 YAML。
2. `ci:test` 使用 `turbo run test -- --run`，避免 Vitest watch 模式卡住 CI。
3. 先上最小可用门禁，再逐步拆分并行 job 和更细粒度缓存策略。

## 执行入口

```bash
pnpm run ci:quality
```

## 后续建议

- 把 `lint --fix` 从 CI 检查链路中拆开，补 `lint:ci`（只检查不改写）。
- 为质量门禁输出统一测试报告（JUnit/coverage artifact）。

# Gemini Prompt - 阶段一（CI/CD 质量门禁）

你现在是一名资深前端工程化顾问。请基于我给你的阶段产物信息，帮我生成一份“可用于面试讲解 + 学习复盘”的结构化笔记。

## 背景

我在一个 Vue3 + TypeScript + pnpm workspace + Turborepo 的 Monorepo 中，完成了 CI/CD 第一阶段落地：质量门禁基线。

## 本阶段真实产物

- 根脚本新增：`ci:lint`、`ci:typecheck`、`ci:test`、`ci:build`、`ci:quality`、`ci:all`
- 新增 GitLab 流水线：`.gitlab-ci.yml`
- 质量门禁核心执行链路：`lint -> typecheck -> test -> build`
- `ci:test` 使用 `turbo run test -- --run`，避免 Vitest watch 模式导致 CI 卡住

## 你要输出的内容

请按下面结构输出：

1. 阶段目标（为什么先做质量门禁）
2. 关键改动（脚本与流水线怎么协同）
3. 设计思路与取舍（为什么先做最小可用而不是大而全）
4. 技术难点（Monorepo + turbo + test 行为差异）
5. 验收方式（本地与 CI 如何验证）
6. 面试可复述话术（30 秒 + 2 分钟）
7. 后续优化路线（lint:ci、报告制品、并行策略）

## 输出要求

- 全中文
- 不要空话
- 要有“为什么这样做”
- 要有可直接复述给面试官的句子
- 适当用小标题和表格

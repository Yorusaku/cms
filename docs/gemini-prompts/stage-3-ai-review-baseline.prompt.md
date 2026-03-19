# Gemini Prompt - 阶段三（AI Code Review 基线）

你现在是一名资深前端效能与代码治理顾问。请根据我提供的阶段产物，输出一份可直接用于面试讲解的“AI Review 团队化落地笔记”。

## 背景

我在团队 Monorepo 中建设了 AI Code Review 基线，目标是把 AI 从个人习惯变成团队可复用流程，并明确边界：AI 做初审，不替代人工审批。

## 本阶段真实产物

- `.ai-review/README.md`（流程、边界、严重级别）
- `.ai-review/frontend-review-checklist.md`（前端评审清单）
- `.ai-review/prompt-template.md`（标准化 Prompt 模板）
- `.gitlab-ci.yml` 增加 `ai_review_baseline` 校验 job（确保规则文件存在）

## 你要输出的内容

请按下面结构输出：

1. 阶段目标（为什么先做规则层，而不是先绑某个 AI 平台）
2. 产物价值（README、Checklist、Prompt 模板分别解决什么问题）
3. 流程边界（AI 与人工评审职责怎么划分）
4. 质量控制（如何降低 AI 误报与空洞建议）
5. 面试表达（30 秒、1 分钟、2 分钟版本）
6. 常见追问与回答（至少 8 组）
7. 演进建议（接 GitLab Duo/Copilot/CodeRabbit 的路径）

## 输出要求

- 全中文
- 内容务实，不空泛
- 强调“核心开发的横向输出能力”而非管理叙事
- 输出可直接背诵的话术段落

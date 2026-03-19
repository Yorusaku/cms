# 阶段三：AI Code Review 基线

## 目标

把 AI review 从“个人习惯”升级为“团队可复用流程”，并明确边界：

- AI 做初审，不替代人工审批
- AI 发现问题，人工做最终判断

## 本阶段新增产物

- AI Review 说明：`.ai-review/README.md`
- 前端评审清单：`.ai-review/frontend-review-checklist.md`
- Prompt 模板：`.ai-review/prompt-template.md`
- 流水线校验：`.gitlab-ci.yml` 中 `ai_review_baseline` job

## 关键设计

1. 明确严重级别（P0/P1/P2/P3）统一沟通语义。
2. 先标准化评审维度（正确性/类型安全/安全/性能/测试），再接具体 AI 平台。
3. 通过仓库内规则文件沉淀团队共识，避免口口相传。

## 执行入口

```bash
# 示例：在 MR 中调用仓库 AI Review 模板
cat .ai-review/prompt-template.md
```

## 后续建议

- 结合具体平台（GitLab Duo/Copilot/CodeRabbit）接入自动评论。
- 对 AI review 结果做“命中率和误报率”复盘。
- 将高频问题反哺到 ESLint/Semgrep 规则中。

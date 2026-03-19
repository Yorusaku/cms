# Gemini Prompt - 阶段二（安全检查基线）

你现在是一名资深前端安全与工程治理顾问。请基于我提供的阶段产物，生成一份面向面试与复盘的深度笔记。

## 背景

我在同一个 Vue Monorepo 中，完成了安全检查第二阶段：依赖漏洞、密钥泄漏、SAST 最小闭环。

## 本阶段真实产物

- 根脚本新增：`security:audit`、`security:secrets`、`security:sast`、`security:scan`
- 新增 `.gitleaks.toml`（Secret 扫描配置）
- 新增 `.semgrep/rules.yml`（高危规则：`eval`、`new Function`、`document.write`）
- 在 `.gitlab-ci.yml` 增加 `security_audit`、`security_secrets`、`security_sast` job

## 你要输出的内容

请按下面结构输出：

1. 阶段目标（安全基线为什么必须和质量门禁并行建设）
2. 安全能力拆解（三层：audit / secret / sast）
3. 规则设计思路（为何先高危低噪音）
4. 落地风险与规避（误报、漏报、执行成本）
5. 验收机制（如何定义阻断阈值）
6. 面试讲解模板（1 分钟 + 3 分钟）
7. 下一步演进（SBOM、例外审批、规则库沉淀）

## 输出要求

- 全中文
- 强调工程取舍
- 不要泛泛而谈
- 要有可落地建议和面试可用表达

# 工程化阶段基线索引

## 阶段产物文档

1. 阶段一：`docs/engineering/stage-1-ci-quality-gate.md`
2. 阶段二：`docs/engineering/stage-2-security-baseline.md`
3. 阶段三：`docs/engineering/stage-3-ai-review-baseline.md`
4. 共享物料注册表：`docs/engineering/shared-material-registry.md`

## 关键配置文件

- CI/CD：`.gitlab-ci.yml`
- Secret 扫描：`.gitleaks.toml`
- SAST 规则：`.semgrep/rules.yml`
- AI Review 基线：`.ai-review/README.md`
- AI Review 检查清单：`.ai-review/frontend-review-checklist.md`
- AI Review Prompt 模板：`.ai-review/prompt-template.md`

## 根脚本入口

- `pnpm run ci:quality`
- `pnpm run security:scan`
- `pnpm run ci:all`

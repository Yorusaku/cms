# 阶段二：安全检查基线

## 目标

建立团队可复用的安全检查最小闭环，覆盖三类风险：

- 依赖漏洞
- 密钥泄漏
- 高风险静态规则

## 本阶段新增产物

- 安全脚本（`package.json`）：`security:audit`、`security:secrets`、`security:sast`、`security:scan`
- 密钥扫描配置：`.gitleaks.toml`
- SAST 规则：`.semgrep/rules.yml`
- 流水线安全 job：`.gitlab-ci.yml` 中 `security_*`

## 关键设计

1. `pnpm audit` 负责依赖层风险。
2. `gitleaks` 负责 Secret 泄漏检测。
3. `semgrep` 先收敛到高危规则（`eval`/`new Function`/`document.write`），降低噪音。
4. 先保证规则可跑通，再逐步扩展规则覆盖面。

## 执行入口

```bash
pnpm run security:scan
```

## 后续建议

- 接入 SBOM（例如 CycloneDX）和制品扫描。
- 引入漏洞例外审批流程（有时效与责任人）。
- 根据历史问题沉淀团队自定义 semgrep 规则库。

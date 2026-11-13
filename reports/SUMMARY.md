# 审计交付状态

- 阶段 0：分类验收退出 0；25 条记录，24 条原命令实跑，live 1 条仅前置探测。
- 分类：9 能跑、8 需要前置条件、3 会挂住、5 跑不通。
- 阶段 1：最终对账见 stage0 报告；根 AGENTS 150/160 行。
- 阶段 2：验收退出 0；两条 diff 规则与真实 hook 正反例、四包覆盖率正反例均有原始输出。
- hooks 新增 9 条真实测试；移除 passWithNoTests，未忽略无测试包。
- 经用户批准 coverage-v8 固定 3.0.2 匹配 Vitest；四包阈值为新实测减 2，接入 PR quality job。
- 阶段 3：结构验收退出 0；三个应用分片共 13 条差异，各附具体写错后果和源码依据。
- lint / UI 治理修复后退出 0；抽屉改用公开 body-class，没有放宽白名单。
- ci:quality 退出 0：lint + typecheck + 单测 + build；修复 Jest 与 Vitest 参数混用。
- 预览 CSS 回归 E2E：5 passed；前轮 mock E2E 45 passed、核心冒烟 5 passed。
- CMS 单测 455 passed、2 skipped（存量）；后端 Jest 139 passed，不把存量 skip 冒充执行。
- security:audit 去掉无效参数后退出 1：243 漏洞，9 critical / 116 high；gitleaks/semgrep 未执行。
- PostgreSQL 127.0.0.1:5433 拒绝连接；未重建数据库。
- constitution.md 未改、标尺只读；原有 406 份源码/配置除本任务明确修改的 8 份外，差异 0。
- GitHub workflow 远端运行未跑；目标仓库未 commit。
- 所有原始输出见 stage0-commands.md 与 stage2-rules.md。
- git add -A 限定本任务文件；CMS vitest 配置仅暂存阈值；保留原有业务改动、本地状态及缓存；未 commit。

# token比比 · 新线程交接摘要

## 项目位置

```text
/root/workspace/token_compare/token-bibi
```

## 当前状态

- Next.js 16 + React 19 + TypeScript + 静态 JSON 数据
- 服务：`http://100.125.251.103:8090/`
- systemd：
  - `token-bibi-app.service`：active
  - `token-bibi-collect.timer`：active
  - `token-bibi-snapshot.timer`：active

## 已完成的核心能力

- 首页、模型比价、模型详情、平台详情
- 模型比价默认只显示已核验价格，可手动切换“全部价格（含样例）”
- 订阅套餐、积分/充值、卡密/兑换码
- 成本计算器、分享结果、长尾专题
- 分享卡 PNG API：`/api/share-card`
- 嵌入卡 API：`/api/embed-card`
- 数据纠错：`/feedback`、`/api/feedback`
- Web 价格核验：`/admin/prices`
- 赞助位：`/advertise`
- SEO：`/sitemap.xml`、`/robots.txt`
- 数据快照、数据质量报告、人工核验 CLI
- 核验后发布提示：后台明确要求人工构建/重启，成功核验后显示“待发布”
- 价格来源复核：CLI 重新抓取源站并比对，导入时保留未变化的核验状态

## 自动采集

- OpenRouter：`npm run collect:openrouter`
- SiliconFlow：`npm run collect:siliconflow`
- Anthropic / 智谱官方：`npm run collect:official`
- 导入：`npm run import:prices -- --file <csv>`
- 每日 03:45：`token-bibi-collect.timer` 执行 OpenRouter、SiliconFlow、Anthropic / 智谱官方价格采集，然后导入、快照、质量报告、构建、重启

## 当前数据

- 模型：10
- 平台：8
- 价格：24 条
- 已核验价格：15 条（来源复核）
  - OpenRouter：10
  - SiliconFlow：2
  - Anthropic 官方：2
  - 智谱官方：1
- 样例价格：9 条
- 待核验：0 条
- 孤儿价格：0
- 重复价格 ID：0

## 验证结果

- Vitest：26 个文件 / 69 个测试通过
- HTTP 烟测：20 项通过
- 浏览器 E2E：6 个场景通过
- Lighthouse mobile：
  - simulated：100
  - provided：100
- `npm run typecheck`：通过
- `npm run build`：通过

## 常用命令

```bash
npm test
npm run typecheck
npm run build
npm run test:smoke
npm run test:e2e
npm run lighthouse
npm run quality:report
npm run snapshot
npm run review:prices -- --list
npm run review:sources
npm run review:verify-sources
```

## 来源复核

`npm run review:sources` 会重新抓取 OpenRouter API、SiliconFlow 公开价格页、Claude 官方定价页和智谱官方定价页，逐条比对输入价、输出价和缓存价；`npm run collect:official` 负责每日生成官方价格 CSV，导入时保留未变化记录的核验状态；`npm run review:verify-sources` 只把完全一致的价格标记为已核验，并写入 `verificationMethod: "source_check"`。对于官方源中已下架、但仍保留展示的样例记录，输出 SKIP 而不是误报失败。

每日导入会比较价格字段：价格未变化的已核验记录会保留原核验状态和核验时间；价格变化时才重置为 `pending_review`。

## 管理后台

```text
/admin/prices
```

核验只更新 `data/prices.json` 并生成备份，不会自动上线。批量核验后执行：

```bash
npm run build && systemctl restart token-bibi-app.service
```

后台页面已内置该提示和复制按钮，不会自动触发重启。

Token 位于：

```text
/root/workspace/token_compare/token-bibi/.env.production
```

字段名：`ADMIN_TOKEN`

不要把 Token 发到公开仓库或公共聊天。

## 文档

- `specs/prd.md`
- `specs/ui-design.md`
- `specs/architecture.md`
- `specs/test-cases.md`
- `specs/marketing.md`
- `specs/tasks.md`
- `specs/checklist.md`
- `marketing/README.md`

## 自动化任务队列

- `automation/`：Codex CLI 自动化 runner，每个任务一个干净上下文
- `automation/results/`：任务结果记录
- 001 管理后台发布流程：已完成
- 002 采集扩展：已确认 302.AI / AIHubMix 仍被 ECS 出网或 DNS 阻塞，未实现新采集器
- 000 runner 冒烟：只读总结已完成；runner 本身仍需在网络/额度正常时真实验证

## 已知后续扩展

- 302.AI 采集：当前 ECS 网络/DNS 阻塞（2026-10-23 复核仍超时）
- AIHubMix 采集：当前 ECS 网络/DNS 阻塞（2026-10-23 复核仍超时）
- 更多平台和模型覆盖
- 用户账号与权限系统
- API 数据订阅与企业服务

## 新线程建议开场

```text
请先读取 /root/workspace/token_compare/token-bibi/HANDOFF.md，
然后继续处理 token比比项目。不要重新读取整个长会话。
```

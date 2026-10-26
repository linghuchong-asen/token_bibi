# token比比

AI 模型 API 真实成本比价与决策工具。当前为 MVP 验证版，使用样例数据。

## 快速开始

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 构建与测试

```bash
npm run typecheck
npm test
npm run build
npm run snapshot
npm run import:prices
npm run test:smoke
npm run test:e2e
npm run collect:openrouter
npm run collect:siliconflow
npm run collect:official
npm run quality:report
npm run review:prices -- --list
npm run review:sources
npm run review:verify-sources
npm run lighthouse
```

## 当前实现

- 首页：真实成本与四类购买路径
- 模型比价：搜索、筛选、排序；默认只比较已核验价格，可切换包含样例
- 模型详情：平台价格、订阅套餐、数据来源
- 平台比价：充值规则、风险与来源
- 订阅套餐：额度折算与破局点
- 积分 / 充值：充值汇率与额度换算
- 卡密 / 兑换码：使用规则与风险
- 成本计算器：按量、积分、订阅对比
- 分享结果：可复制链接、分享卡片预览与 PNG 下载
- 分享卡 API：`/api/share-card`
- 嵌入组件：`/api/embed-card`
- 设计原型：`/prototype.html`
- 长尾专题：面向具体搜索意图
- SEO：`/sitemap.xml`、`/robots.txt`
- 数据方法 / 商业边界（含"我们怎么赚钱"）
- 赞助位合作：`/advertise`（刊例价、余位、自助申请表单，线索落盘 `data/sponsor-leads.jsonl`）
- 数据 API 订阅：`/data-api` 产品页 + 公开接口 `GET /api/prices`（免费层 60 次/分钟/IP，默认仅已核验价格）
- 推广分成机制：`providers.json.affiliateUrl` 配置后出站链接自动带 `rel="sponsored"` 并披露
- 数据纠错：`/feedback`
- 销售线索：`/api/leads`（广告位申请与 API 订阅咨询统一入口）
- 数据状态公开：`/data-status`（分平台核验统计、最近价格变动、核验方法说明）
- 数据新鲜度：首页与比价页顶部横幅；价格表超 7 天未复核就地标红
- 价格变动记录：`npm run changelog:prices` 对比基线快照生成 `data/price-changes.json`
- 数据快照：`npm run snapshot`
- 当前价格：24 条记录，其中 14 条已完成公开来源复核（OpenRouter 9 条、SiliconFlow 2 条、Anthropic 官方 2 条、智谱官方 1 条）、1 条待核验（源站已下架，等待人工处理）、9 条仍为样例数据
- 来源复核 CLI 会重新抓取 OpenRouter、SiliconFlow、Claude 官方和智谱官方定价源并逐字段比对；只有完全一致的价格才会标记为已核验
- 幽灵核验防线：`npm run review:demote-stale` 把源站已不认可（改价/下架）的已核验价格自动降回待核验
- 每日导入会保留价格未变化记录的已核验状态，避免采集任务把核验结果重置为待核验
- 数据质量：`data/quality-report.json` 显示 0 个孤儿价格、0 个重复 ID
- 价格导入：`npm run import:prices`
- HTTP 页面烟测：`npm run test:smoke`
- 浏览器 E2E：`npm run test:e2e`
- OpenRouter 采集：`npm run collect:openrouter`
- SiliconFlow 采集：`npm run collect:siliconflow`
- Anthropic / 智谱官方价格采集：`npm run collect:official`
- 数据质量报告：`npm run quality:report`
- 人工核验：`npm run review:prices -- --list` / `--verify <price-id>`
- Web 核验后台：`/admin/prices`，需要 `.env.production` 中的 `ADMIN_TOKEN`；核验后需人工构建并重启
- Lighthouse：`npm run lighthouse`（可用 `LIGHTHOUSE_THROTTLING=provided` 跑无模拟限速版本）
- 每日 03:45 自动采集 OpenRouter、SiliconFlow、Anthropic / 智谱官方价格，随后导入、快照、构建和重启（`token-bibi-collect.timer`）

## 营销发布工具包

- `marketing/`：7 天冷启动、30 天内容日历、社区文案、合作模板和指标表
- `specs/monetization.md`：盈利方案（三个收入入口、定价、单位经济与 90 天目标）

## 数据说明

`data/prices.json` 中 15 条价格已通过公开来源复核，另有 9 条样例价格。套餐、充值汇率、卡密和平台规则仍包含样例数据，正式上线前需继续逐条核验。

## 目录

```text
data/                 样例数据
design/               SVG 线框、PNG 高保真、HTML 原型
specs/                产品、UI、架构、测试与营销文档
src/app/              Next.js 页面
src/components/       共享组件
src/lib/              计算、校验、格式化
tests/                Vitest 自动化测试
```

## 当前验证

- 28 个测试文件通过
- 90 个自动化测试通过
- Lighthouse mobile：simulated 98 / provided 100（首页）、97（广告位页）
- 25 项 HTTP 页面烟测通过
- 7 个浏览器 E2E 场景通过（含广告位申请表单端到端）
- `npm run typecheck` 通过
- `npm run build` 通过

## 后续扩展

- 302.AI / AIHubMix 采集（当前 ECS 网络连接超时）
- 更多平台与模型覆盖
- 用户账号与权限系统
- API 数据订阅与企业服务

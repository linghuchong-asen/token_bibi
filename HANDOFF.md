# token比比 · 新线程交接摘要

> 更新：2026-10-27 凌晨（夜间打磨轮之后）。上一版描述的 ECS 状态仍然有效；
> 本版补充本机（Windows 工作副本）打磨轮的产出与新的数据口径。

## 项目位置

- ECS（线上）：`/root/workspace/token_compare/token-bibi`，服务 `http://100.125.251.103:8090/`
- 本机工作副本：`D:\userProjects\token_bibi`（本轮打磨在此完成，待推送到 ECS）

## 当前状态

- Next.js 16 + React 19 + TypeScript + 静态 JSON 数据
- 最新提交：`7a3c4e5 feat: 真实性/实时性加固 + 三条盈利入口上线`（后续修复见 git log）

## 已完成的核心能力

- 首页、模型比价、模型详情、平台详情
- 模型比价默认只显示已核验价格，可手动切换"全部价格（含样例）"
- 订阅套餐、积分/充值、卡密/兑换码
- 成本计算器、分享结果、长尾专题
- 分享卡 PNG API：`/api/share-card`；嵌入卡 API：`/api/embed-card`
- 数据纠错：`/feedback`、`/api/feedback`
- Web 价格核验：`/admin/prices`（需 `ADMIN_TOKEN`，核验后人工构建/重启）
- SEO：`/sitemap.xml`、`/robots.txt`
- 数据快照、数据质量报告、人工核验 CLI

## 2026-10-26 夜间打磨轮新增（真实性/实时性）

- **幽灵核验防线**：`npm run review:demote-stale`——源站改价/下架时自动把
  已核验价格降回待核验。已接入 `scripts/daily-collect.sh` 每日管线
  （顺序：采集 → 导入 → demote-stale → changelog → 快照 → 质量报告 → 构建重启）。
- **价格变动记录**：`npm run changelog:prices` 对比基线快照生成
  `data/price-changes.json`，在 `/data-status` 页面公示。
- **数据新鲜度**：`src/lib/freshness.ts`（fresh ≤3 天 / aging 3-7 天 / stale >7 天）；
  首页与比价页顶部横幅；价格表更新时间列分层预警。
- **数据状态页**：`/data-status`——分平台核验统计、最近价格变动、核验方法说明。
- **实测证据**：kimi-k3 在 OpenRouter 当日连续降价两次（1.7208 → 1.1592 → 1.0944）；
  `qwen3-8-max` 已在源站下架（幽灵核验案例，已降级为待核验）。

## 2026-10-27 清晨功能与营销轮新增

- **RSS 订阅**：`/feed.xml`（价格变动 RSS 2.0，布局自动发现 + 页脚入口）
- **价格走势图**：`npm run history:prices` 生成 `data/price-history.json`，
  模型详情页渲染 SVG 折线（只画真实变动过的价格）；已接入每日管线
- **模型对比页**：`/compare?models=a,b,c`（已核验最低价/上下文/能力/平台覆盖，
  链接可分享）；比价列表新增"近日降价"绿色徽章
- **降价动态页**：`/price-drops`（RSS 落地页 + "AI 降价"搜索长尾承接）
- **首页最新动态**：最近 3 条变动上首页；平台详情页有"近日降价"提示条
- **API 家族**：`GET /api/prices`（JSON/CSV）+ `GET /api/price-history?model=`
  （时间序列，仅已变动序列），共用 60 次/分钟限流
- **SEO/传播**：模型页 generateMetadata + OG 图（分享卡 PNG）+ JSON-LD
  Product/AggregateOffer（仅已核验）；`/faq` + FAQPage JSON-LD；
  两篇事件专题（kimi 降价 / qwen 下架替代）
- **营销资产**：`marketing/community-posts.md` 实测故事系列、
  `marketing/blog-drafts.md` 两篇可发布长文、`marketing/video-scripts.md`
  （60 秒口播稿 + 7 推 X Thread + 15 秒极短版）、`launch-plan.md` 与
  `content-calendar.csv` 全量刷新
- **运营后台**：`/admin/leads`（线索查看，ADMIN_TOKEN 鉴权）；
  管理后台互链已加
- **SEO 收尾**：sitemap lastModified 改为真实数据日期；全站 WebSite JSON-LD；
  依赖 npm audit 0 漏洞
- **生产 bug 修复**（见 changelog 10-17 条）：表单成功误报失败
  （React currentTarget 异步陷阱）、限流器内存泄漏、分发面硬编码状态

## 盈利入口（2026-10-26 上线，全部可见可用）

- `/advertise`：广告位自助投放销售页（刊例价在 `data/ad-products.json`，
  申请表单 → `POST /api/leads` → `data/sponsor-leads.jsonl`）
- `/data-api` + `GET /api/prices`：公开数据 API 免费层
  （60 次/分钟/IP，默认仅已核验价格，带 X-RateLimit-* 头与数据水位 meta）；
  Pro ¥199/月、企业层定制的订阅产品页
- AFF 机制：`providers.json.affiliateUrl` 配置后出站链接自动带
  `rel="sponsored"` 并披露（当前 8 个平台均为 null）
- 盈利方案文档：`specs/monetization.md`（单位经济、90 天目标 ≥ ¥5,000/月）

## 自动采集

- OpenRouter：`npm run collect:openrouter`（映射 `data/imports/openrouter-map.json`，9 个模型）
- SiliconFlow：`npm run collect:siliconflow`（映射 `data/imports/siliconflow-map.json`，2 个模型 + 1 个已下架保留）
- Anthropic / 智谱官方：`npm run collect:official`
- 导入：`npm run import:prices -- --file <csv>`
- 每日 03:45：`token-bibi-collect.timer`（ECS）执行完整管线
- **注意**：映射文件由采集器生成、不进版本库；新环境先跑一次采集器再跑复核。
  OpenRouter 模型 ID 为点分命名（如 `openai/gpt-5.6-sol`），重建映射用实时 API 比对。

## 当前数据（2026-10-27 凌晨口径）

- 模型：11；平台：8；价格：25 条
- 已核验：15（OpenRouter 10、SiliconFlow 2、Anthropic 官方 2、智谱官方 1）
  - OpenRouter 新增 `qwen3-8-max-0902`（下架模型 qwen3-8-max 的官方快照替代版，
    价格与原版一致：14.4 / 43.2 / 1.8 CNY，已来源复核）
- 待核验：1（`openrouter-qwen3-8-max-credit`，源站已下架——**待产品决策**：挂着等回归还是移除）
- 样例：9（其中 `siliconflow-kimi-k3` 对应模型已在源站下架，同为待决策项）
- 孤儿价格：0；重复 ID：0

## 验证结果（本机实测，10-27 早 8 点口径）

- Vitest：34 个文件 / 115 个测试通过
- HTTP 烟测：34 项通过（生产构建实测）
- 浏览器 E2E：8 个场景通过（含广告表单端到端、对比页移动端）
- Lighthouse mobile：首页 simulated 98 / provided 100；/advertise 97；/price-drops 98
- `npm run typecheck`：通过；`npm run build`：通过
- `npm audit`：0 漏洞（官方 registry）
- 浏览器目检：首页（含最新动态）、/data-status、/advertise、/compare、
  /price-drops、模型页走势图、分享页脚注均渲染正确

## 常用命令

```bash
npm test
npm run typecheck
npm run build
npm run test:smoke        # SMOKE_BASE_URL 可覆盖目标
npm run test:e2e
npm run lighthouse
npm run collect:openrouter && npm run import:prices -- --file data/imports/openrouter-collected.csv
npm run quality:report
npm run snapshot
npm run changelog:prices
npm run review:prices -- --list
npm run review:sources          # 只读复核
npm run review:verify-sources   # 与源一致才升已核验
npm run review:demote-stale     # 源不认可则降级（每日管线已接入）
```

## 管理后台

```text
/admin/prices
```

核验只更新 `data/prices.json` 并生成备份，不会自动上线。批量核验后执行
`npm run build && systemctl restart token-bibi-app.service`。
Token 位于 ECS 的 `.env.production`（字段 `ADMIN_TOKEN`），不要外发。

## 待办与决策项

1. **数据决策（领导拍板）**：下架模型的两条价格（qwen3-8-max 待核验、
   siliconflow-kimi-k3 样例）是保留还是移除
2. **部署**：本轮改动在本机，需推送到 ECS 重新构建 + 重启 systemd
3. **商业化跟进**：谈第一个 AFF 账号（优先 OpenRouter / SiliconFlow / AIHubMix）；
   广告位首个客户；/api/prices 对外曝光（marketing/ 工具包已备）
4. **302.AI / AIHubMix 采集**：ECS 出网阻塞（10-23 复核仍超时），本机连通性待探测
5. **支付与账号系统**：Pro 层先走人工线索开通，验证付费意愿后再建

## 文档

- `specs/prd.md`、`specs/ui-design.md`、`specs/architecture.md`、`specs/test-cases.md`
- `specs/monetization.md`（盈利方案）
- `specs/checklist.md`（AC-11/AC-13 已扩充）
- `docs/specs/align-yutu-doc-and-code/code-iteration-changelog.md`（变更留痕，必读）
- `marketing/README.md`

## 新线程建议开场

```text
请先读取 D:\userProjects\token_bibi\HANDOFF.md，
然后继续处理 token比比项目。不要重新读取整个长会话。
```

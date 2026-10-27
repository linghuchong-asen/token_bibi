# token比比 · 新线程交接摘要

> 更新：2026-10-28 凌晨（去 demo 化 + 跨平台比价两轮之后）。上一版描述的 ECS 状态仍然有效；
> 本版数据口径以本机 10-28 凌晨第二轮为准。

## 项目位置

- ECS（线上）：`/root/workspace/token_compare/token-bibi`，服务 `http://100.125.251.103:8090/`
- 本机工作副本：`D:\userProjects\token_bibi`（10-28 凌晨两轮在此完成，已本地提交
  `7c9e0cf` / `95704cb`，**待推送到 ECS**）

## 当前状态

- Next.js 16 + React 19 + TypeScript + 静态 JSON 数据
- 最新提交：`95704cb feat: 跨平台比价成网`（本机已领先 ECS 若干轮，推送后需在 ECS 重跑
  `node scripts/expand-openrouter-catalog.mjs` 重建映射，再跑每日管线）

## 2026-10-28 凌晨两轮（去 demo 化 + 跨平台成网，详见 changelog 27–36 条）

- **第一轮（去 demo 化）**：OpenRouter 收录 9 → 58 模型；样例价格 9 条、样例套餐 5 条、
  样例卡密规则 5 条、"New API 示例站"平台全部删除；充值规则换成 4 条带真实来源的
  待核验规则；订阅页改"订阅怎么算"方法论 + 按量基线表，卡密页改三步避坑指南；
  首页三个数字全部换真实指标；页脚四栏；about 重写（我们是谁/联系我们）；
  新增 /privacy /terms；域名兜底 example.com → 线上实例地址
- **第二轮（跨平台比价）**：SiliconFlow 2 → 15 条价格，新收录 9 个双平台同款模型；
  **67 模型 / 85 条价格 100% 已核验，17 个模型可跨平台比价**；
  变动/降价页空态补检测时间；E2E models 场景改 Ctrl+A 清空搜索（三连击选区不稳定）

## 2026-10-27 清晨功能与营销轮（保留摘要）

- RSS `/feed.xml`、模型页价格走势 SVG、对比页 `/compare`、降价动态 `/price-drops`、
  首页最新动态、`GET /api/prices`（JSON/CSV）+ `GET /api/price-history?model=`、
  模型页 generateMetadata + OG 分享卡 + JSON-LD、营销资产 `marketing/`、
  运营后台 `/admin/leads`、全站 WebSite JSON-LD

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
- **注意**：映射文件由采集器生成、不进版本库。OpenRouter 目录与映射用
  `node scripts/expand-openrouter-catalog.mjs` 重建（幂等，含 67 个精选模型）；
  SiliconFlow 映射目前只在本机（16 条），ECS 首次部署需手动同步或照
  changelog 35 条重建。OpenRouter 模型 ID 为点分命名（如 `openai/gpt-5.6-sol`）。

## 当前数据（2026-10-28 凌晨第二轮口径）

- 模型：67；平台：7（4 个已核验 + 3 个待接入：302ai / aihubmix / official-openai）；价格：85 条
- 已核验：85（OpenRouter 67、SiliconFlow 15、Anthropic 官方 2、智谱官方 1）——**100% 全核验**
- **跨平台可比模型：17 个**（OpenRouter×SiliconFlow 双平台同款，比价核心样本）
- 待核验价格：0；样例价格：0（样例套餐/卡密规则同步清零，宁缺毋假）
- 充值规则：4 条（带真实来源链接，字段级"待核验"如实标注）
- 孤儿价格：0；重复 ID：0；302.AI / AIHubMix 本机同样网络阻塞（000），搁置有据

## 验证结果（本机实测，10-28 凌晨第二轮口径）

- Vitest：34 个文件 / 115 个测试通过（filtering 断言改"全量 ≥ 已核验"新不变量；
  data-status / price-drops 空态渲染回归通过）
- HTTP 烟测：34 项通过（/subscriptions 断言锚点改为"破局点"）
- 浏览器 E2E：8 个场景通过（models 场景改为 Ctrl+A 清空搜索后断言 ≥60 行）
- `npm run typecheck`：通过；`npm run build`：通过（两轮各构建一次均绿）
- 页面目检：/privacy /terms /subscriptions /card-keys 首发渲染正确；
  全站"样例数据"字样清零（curl 扫 9 个关键页）；空态页展示检测时间
- 未复跑：Lighthouse（上轮数字首页 98 / advertise 97 / price-drops 98 可参考）

## 常用命令

```bash
npm test
npm run typecheck
npm run build
npm run test:smoke        # SMOKE_BASE_URL 可覆盖目标
npm run test:e2e
npm run lighthouse
node scripts/expand-openrouter-catalog.mjs   # 扩容/重建 OpenRouter 目录与映射（幂等，ECS 部署后先跑一次）
npm run collect:openrouter && npm run import:prices -- --file data/imports/openrouter-collected.csv
npm run collect:siliconflow && npm run import:prices -- --file data/imports/siliconflow-collected.csv
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

1. ~~数据决策~~：已处理（10-28 凌晨）——下架模型遗留价格与全部样例数据移除，
   依据"宁缺毋假"收录口径，见 changelog 28 条
2. **部署**：本机改动需推送到 ECS；ECS 侧步骤 = 拉取 →
   `node scripts/expand-openrouter-catalog.mjs`（重建映射）→
   每日管线 → build → 重启 systemd
3. **商业化跟进**：谈第一个 AFF 账号（优先 OpenRouter / SiliconFlow / AIHubMix）；
   广告位首个客户；/api/prices 对外曝光（marketing/ 工具包已备）
4. **302.AI / AIHubMix 采集**：ECS 出网阻塞（10-23 复核仍超时），本机连通性待探测
5. **域名**：现在兜底是 ECS 实例地址；正式域名定下来后设 `NEXT_PUBLIC_SITE_URL`
   即可全站生效（layout/sitemap/OG/JSON-LD 共用）
6. **支付与账号系统**：Pro 层先走人工线索开通，验证付费意愿后再建

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

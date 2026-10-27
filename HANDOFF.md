# token比比 · 新线程交接摘要

> 更新：2026-10-28 凌晨（去 demo 化 / 商业化一轮之后）。上一版描述的 ECS 状态仍然有效；
> 本版数据口径以本机 10-28 凌晨为准。

## 项目位置

- ECS（线上）：`/root/workspace/token_compare/token-bibi`，服务 `http://100.125.251.103:8090/`
- 本机工作副本：`D:\userProjects\token_bibi`（去 demo 化轮在此完成，待推送到 ECS）

## 当前状态

- Next.js 16 + React 19 + TypeScript + 静态 JSON 数据
- 最新提交：见 git log（本机已领先 ECS 若干轮，推送后需在 ECS 重跑
  `node scripts/expand-openrouter-catalog.mjs` 重建映射，再跑每日管线）

## 2026-10-28 凌晨去 demo 化 / 商业化一轮（详见 changelog 27–34 条）

- **数据扩容**：OpenRouter 收录 9 → 58 个模型（`scripts/expand-openrouter-catalog.mjs`，
  精选主流模型、元数据全部取自实时 API），价格 25 → 63 条，**100% 已核验、0 样例、0 stale**
- **虚构数据清零**：样例套餐 5 条、样例卡密规则 5 条、样例价格 9 条、"New API 示例站"
  平台整条删除；充值规则换成 4 条带真实来源的待核验规则（OpenRouter/SiliconFlow/
  Anthropic 官方/智谱官方）；两个"待领导拍板"的下架模型遗留项一并处理（qwen3-8-max
  模型条目删除、siliconflow-kimi-k3 样例价删除）
- **页面收编**：订阅页 → 订阅怎么算方法论 + 已核验按量基线表；卡密页 → 三步避坑指南；
  积分页去样例徽章；首页三个数字全部换成真实指标（最低核验价 / 63·63 核验 / 58 模型·7 平台）
- **自曝文案清零**：页脚四栏重构、about 重写（新增"我们是谁/联系我们"）、FAQ 更新
- **商业信任件**：新增 /privacy /terms（内容与真实行为对应），sitemap 收录，
  域名兜底 example.com → 线上实例地址（正式域名下来后设 NEXT_PUBLIC_SITE_URL 即可）
- **验证**：typecheck ✓、115/115 单测 ✓、生产构建 ✓、34/34 烟测 ✓（订阅页烟测断言
  改为"破局点"锚点）、E2E ✓

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
- **注意**：映射文件由采集器生成、不进版本库；新环境先跑一次采集器再跑复核。
  OpenRouter 模型 ID 为点分命名（如 `openai/gpt-5.6-sol`），重建映射用实时 API 比对。

## 当前数据（2026-10-28 凌晨口径）

- 模型：58；平台：7（4 个已核验 + 3 个待接入：302ai / aihubmix / official-openai）；价格：63 条
- 已核验：63（OpenRouter 58、SiliconFlow 2、Anthropic 官方 2、智谱官方 1）——**100% 全核验**
- 待核验价格：0；样例价格：0（样例套餐/卡密规则同步清零，宁缺毋假）
- 充值规则：4 条（带真实来源链接，字段级"待核验"如实标注）
- 孤儿价格：0；重复 ID：0
- 当日真实变动留痕：kimi-k3 输入价 1.2168 → 1.08；deepseek-v4-1-flash 计价重构（0.31/0.072 → 1.008/3.024）

## 验证结果（本机实测，10-28 凌晨口径）

- Vitest：34 个文件 / 115 个测试通过（filtering 断言按"全量 ≥ 已核验"新不变量修正）
- HTTP 烟测：34 项通过（/subscriptions 断言锚点改为"破局点"）
- 浏览器 E2E：8 个场景通过（models 场景改为 Ctrl+A 清空搜索后断言 ≥60 行）
- `npm run typecheck`：通过；`npm run build`：通过
- 页面目检：/privacy /terms /subscriptions /card-keys 首发渲染正确；
  全站"样例数据"字样清零（curl 扫 9 个关键页）

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

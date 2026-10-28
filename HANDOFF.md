# token比比 · 新线程交接摘要

> 更新：2026-10-28 上午（ECS 部署完成之后）。本机与 ECS 已同步到 `20833da`，
> 线上 http://100.125.251.103:8090/ 即最新口径，每日 03:45 管线恢复正常滚动。

## 项目位置

- ECS（线上）：`/root/workspace/token_compare/token-bibi`，服务 `http://100.125.251.103:8090/`
- 本机工作副本：`D:\userProjects\token_bibi`（与 ECS 同步；SSH 别名 `my-aliyun`，
  部署四步 = 推送 → ECS `git pull` → `node scripts/expand-openrouter-catalog.mjs` →
  `bash scripts/daily-collect.sh`）

## 当前状态

- Next.js 16 + React 19 + TypeScript + 静态 JSON 数据
- 最新提交：`20833da fix: 目录重建脚本剔除陈旧映射键 + CATALOG 补齐全量缺口`
  （本机 / GitHub / ECS 三端一致，线上已按新代码构建并重启）

## 2026-10-28 上午（ECS 部署轮，详见 changelog 38 条）

- 本机 3 个提交推送 GitHub，ECS 拉取时发现其落后到初始提交 `b623e89`，
  拉取后重建映射即触发管线失败：`unknown model: qwen3-8-max`。
  根因：ECS 旧映射残留模型改名前的 id，重建脚本"只增不删"；且 CATALOG
  少 10 个模型（9 个元老旗舰 + `qwen3-8-max-0902`），全新环境无法全量重建。
  修复（`20833da`）：重建时剔除两份映射的陈旧键并告警；CATALOG 补齐到
  67 条 = 模型表 67 个。
- 部署完成后 ECS 每日管线全绿：67 OpenRouter + 15 SiliconFlow + 3 官方采集、
  85 条价格、demote-stale 0、build + systemd 重启正常，03:45 timer 恢复滚动。
- **源价漂移防线实战**：本日 4 条 OpenRouter 价格漂移如实回到待核验
  （kimi-k3 输入/cache 涨、qwen3-6-27b 输入涨输出降、qwen3-6-35b-a3b 输出降、
  qwen3-8-27b 输入降 80% 输出降 50%）。`data/snapshots/` 不进版本库，
  ECS 降价基线一度缺失，已把本机最新快照（10-27T23-26Z）scp 给 ECS 作为
  基线并重跑留痕段——/price-drops 现已如实展示上述真实降价，
  旧变动记录备份在 ECS `data/price-changes.json.bak-pre-baseline-fix`。
- E2E 远程跑线上会在"线索落库"场景必然失败（脚本读本机文件断言），
  线上验证用烟测 + 页面抽查；E2E 仅在本机 8099 口径跑。

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

## 当前数据（2026-10-28 上午部署后线上口径）

- 模型：67；平台：7（4 个已核验 + 3 个待接入：302ai / aihubmix / official-openai）；价格：85 条
- 已核验：81 / 85 = 95.3%（OpenRouter 63 + SiliconFlow 15 + Anthropic 官方 2 + 智谱官方 1）；
  其余 4 条为本日源价漂移如实降为待核验（见上方部署轮说明），**不批量自动升核验**，
  待人工过目 `/admin/prices` 后再核验（qwen3-8-27b 降 80% 影响跨平台比价结论，优先看）
- **跨平台可比模型：17 个**（OpenRouter×SiliconFlow 双平台同款，比价核心样本）
- 样例价格：0（样例套餐/卡密规则同步清零，宁缺毋假）
- 充值规则：4 条（带真实来源链接，字段级"待核验"如实标注）
- 孤儿价格：0；重复 ID：0；302.AI / AIHubMix 双端网络阻塞（000），搁置有据

## 验证结果（本机实测，10-28 凌晨第二轮口径）

- Vitest：34 个文件 / 115 个测试通过（filtering 断言改"全量 ≥ 已核验"新不变量；
  data-status / price-drops 空态渲染回归通过）
- HTTP 烟测：34 项通过（/subscriptions 断言锚点改为"破局点"）
- 浏览器 E2E：8 个场景通过（models 场景改为 Ctrl+A 清空搜索后断言 ≥60 行）
- `npm run typecheck`：通过；`npm run build`：通过（两轮各构建一次均绿）
- 页面目检：/privacy /terms /subscriptions /card-keys 首发渲染正确；
  全站"样例数据"字样清零（curl 扫 9 个关键页）；空态页展示检测时间
- 未复跑：Lighthouse（上轮数字首页 98 / advertise 97 / price-drops 98 可参考）
- 线上（ECS）实测 10-28 上午：烟测 34/34（SMOKE_BASE_URL 指向 :8090）两轮全过；
  探活 200；首页 67 模型 / 85 条（95%）如实展示；/price-drops 展示当日 4 笔真实变动
  （3 笔降价）；质检报告 0 stale / 0 孤儿 / 0 无价格模型

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
2. ~~部署~~：已完成（10-28 上午）——三端同步 `20833da`，线上构建重启并全绿；
   修复了 ECS 旧映射陈旧键与 CATALOG 缺口（changelog 38 条）。
   **遗留小项**：4 条本日漂移价格在 `/admin/prices` 人工过目后核验，
   再 build + 重启；正式域名定了设 `NEXT_PUBLIC_SITE_URL` 即全站生效
3. **商业化跟进**：谈第一个 AFF 账号（优先 OpenRouter / SiliconFlow / AIHubMix）；
   广告位首个客户；/api/prices 对外曝光（marketing/ 工具包已备）
4. ~~302.AI / AIHubMix 采集~~：本机与 ECS 双端网络阻塞（curl 000）均已实测，
   维持"待接入"，接入前不再探测
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

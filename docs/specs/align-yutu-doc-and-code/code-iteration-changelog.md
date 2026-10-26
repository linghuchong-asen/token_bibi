# 代码迭代变更留痕（code-iteration-changelog）

> 依据 AGENTS.md 第 9 条：所有功能点的新增、修改、删除必须在此留档，不允许只改代码不留痕。
> 本项目规格文档的传统位置是根目录 `specs/`（spec.md / tasks.md / checklist.md），
> `docs/specs/` 按新规承接变更留痕与规格同步，两者互相引用。

## 记录格式

每条记录包含：日期、类型（新增/修改/删除）、涉及文件、变更说明、影响范围、验证方式。

---

## 2026-10-26（夜间打磨轮）

### 1. 新增：已核验价格的实时降级机制 `--demote-stale`

- **类型**：新增（真实性加固）
- **涉及文件**：
  - `scripts/lib/source-check.mjs`：新增 `demoteStaleVerifiedPrices()`
  - `scripts/review-prices.mjs`：新增 `--demote-stale` 子命令
  - `package.json`：新增 `npm run review:demote-stale`
  - `tests/source-check.test.ts`：新增降级逻辑单测
- **变更说明**：此前"已核验"是永久徽章——源站改价或模型下架后，页面仍挂着
  "已核验"展示源站已不认可的价格（当晚实测发现 `openrouter-qwen3-8-max-credit`
  即为这种"幽灵核验"：模型已在 OpenRouter 下架，库里仍是 verified）。
  新命令重新抓取实时源，对已核验记录逐条比对，mismatch/missing 一律降级为
  `pending_review` 并清空 `verificationMethod`。不自动改价格数值，数值仍由采集+导入流程负责。
- **影响范围**：仅影响 `data/prices.json` 中 `dataStatus === "verified"` 且属于四个
  可核验平台的记录；每日采集管线不受影响。
- **验证方式**：单测 + 实跑（当晚降级 1 条幽灵核验记录）。

### 2. 修改：来源复核命令容忍映射文件缺失

- **类型**：修改（工具链健壮性）
- **涉及文件**：`scripts/review-prices.mjs`（新增 `readJsonIfExists()`）
- **变更说明**：`data/imports/*-map.json` 由采集器生成、未纳入版本库，此前在新环境
  跑 `npm run review:sources` 直接 ENOENT 崩溃。现在缺失时降级为空映射并打印警告，
  复核命令开箱即用。
- **影响范围**：仅 `review:prices` 命令；采集器保持严格失败（映射缺失时宁可失败也不
  静默采集空数据，避免每日管线掩盖断供）。
- **验证方式**：在本机全新环境实跑 `review:sources` 成功。

### 3. 数据：全链路实时采集 + 来源复核 + 降级执行

- **类型**：数据更新（真实性/实时性验证的产物）
- **涉及文件**：`data/prices.json`、`data/imports/`（新增 openrouter-map.json、
  siliconflow-map.json 及采集 CSV）、`data/quality-report.json`、备份目录
- **变更说明**：
  1. 从实时源重建了两个模型映射文件（OpenRouter 9 个模型、SiliconFlow 2 个模型）；
  2. 完整跑通 采集→导入→复核→验证 管线，追平源站价格（如 `openrouter-kimi-k3-credit`
     源站输出价 77.76 → 144，已同步）；
  3. 降级 1 条幽灵核验（qwen3-8-max，源站已下架）。
- **实测发现（实时性证据）**：kimi-k3 在 OpenRouter 的价格在**几分钟内两次采集结果
  不同**（输入价 1.1592 → 1.0944），证明源站存在小时级内漂移，"已核验"只是时点声明，
  页面必须展示"数据截至时间"并在过期时预警。后续 3 次连续采样（间隔 3 秒）确认当前
  价格稳定在 1.0944，即当日源站对该模型**连续降价两次**（1.7208 → 1.1592 → 1.0944），
  漂移是真实的厂商调价而非抓取噪声。
- **影响范围**：数据面；核验状态 15→13→（复核后）14 verified。
- **验证方式**：`review:sources` 全量 MATCH（除下架模型）、quality-report 0 孤儿/0 重复。

### 4. 修改：AGENTS.md 新增协作规则第 9、10 条

- **类型**：修改（协作规范）
- **涉及文件**：`AGENTS.md`
- **变更说明**：按领导要求落实两条硬规则——①功能变更必须形成文档（本文件即产物）；
  ②代码一律中文注释、文件头部必须加注释、关键逻辑说明"为什么"。
- **影响范围**：所有后续代码变更。
- **验证方式**：本轮起所有新增/修改文件执行头部注释与中文注释标准。

### 5. 新增：数据新鲜度可视化（真实性/实时性进产品）

- **类型**：新增（UI + 数据）
- **涉及文件**：
  - `src/lib/freshness.ts`：新鲜度分层库（fresh ≤3 天 / aging 3-7 天 / stale >7 天）
  - `src/components/FreshnessBanner.tsx`：首页与比价页顶部数据状态横幅
  - `src/app/data-status/page.tsx`：数据状态页（总体水位、分平台核验统计、
    最近价格变动、核验方法说明）
  - `src/components/PriceTable.tsx`：更新时间列分层预警，超 7 天标红"以源站为准"
  - `src/components/SiteHeader.tsx`：导航新增"数据状态"常驻入口
  - `src/app/sitemap.ts`：新增 /data-status、/data-api、/advertise
- **影响范围**：首页、比价页、全站导航、SEO；无后端行为变化。
- **验证方式**：typecheck 通过；vitest 新增新鲜度用例通过。

### 6. 新增：价格变动记录管线

- **类型**：新增（数据 + 管线）
- **涉及文件**：
  - `scripts/price-changelog.mjs`：基线快照 vs 当前价格的逐字段对比
  - `package.json`：新增 `npm run changelog:prices`
  - `scripts/daily-collect.sh`：管线顺序改为 导入 → 变动记录 → 快照（先记录再留档，
    避免基线自我对比为空）
  - `data/price-changes.json`：首个真实变动记录（4 条，含 kimi-k3 降价与幽灵核验降级）
  - `src/data/index.ts` / `src/data/types.ts`：新增 `priceChanges` 数据导出与类型
- **影响范围**：每日采集管线新增一步（快照前）；/data-status 页面消费其产物。
- **验证方式**：实跑生成 4 条真实变动并全部在页面可读。

### 7. 新增：盈利入口三件套（广告位自助投放 / 数据 API 订阅 / AFF 机制）

- **类型**：新增（商业化）
- **涉及文件**：
  - `data/ad-products.json` + `src/data/types.ts`（AdProduct）：广告位刊例价与规格数据化
  - `src/app/advertise/page.tsx`：从占位说明升级为销售页（定价表、余位、红线、申请表单）
  - `src/lib/leads.ts` + `src/app/api/leads/route.ts`：统一线索入口（zod 校验，
    落盘 `data/sponsor-leads.jsonl`，JSONL 追加写与 feedback 同约定）
  - `src/components/LeadForm.tsx`：投放/API 两种场景复用的申请表单（客户端组件）
  - `src/lib/rate-limit.ts` + `src/app/api/prices/route.ts`：公开价格 API（免费层
    60 次/分钟/IP，默认仅已核验数据，限流响应头齐全）
  - `src/app/data-api/page.tsx`：API 产品页（免费/Pro ¥199 月/企业层 + curl 示例 + 咨询表单）
  - `data/providers.json` + `src/data/types.ts` + `src/lib/commercial.ts` +
    `src/app/providers/[slug]/page.tsx`：AFF 出站链接机制（affiliateUrl 字段、
    rel=sponsored、披露声明；当前全部为 null）
  - `src/app/about/page.tsx`：新增"我们怎么赚钱"（三条收入线全公开）
  - `src/components/SiteFooter.tsx`：页脚新增"广告合作 / 数据 API / 数据状态"入口
- **影响范围**：新增两个页面、两个 API 路由、一个数据文件；providers.json 结构新增
  字段（部署侧需重新 build）；无既有行为破坏。
- **验证方式**：typecheck 通过；leads 校验、限流、AFF 助手、新鲜度共 18 个单测通过。

### 8. 新增：specs/monetization.md 盈利方案

- **类型**：新增（文档）
- **变更说明**：给决策层的盈利路径——三轮真实性/实时性实测证据、三个已上线的
  收入入口与定价、单位经济与 90 天目标（月固定收入 ≥ ¥5,000）、增长飞轮与风险对策。
- **影响范围**：纯文档。
- **验证方式**：与代码实现逐条对得上（页面、API、字段均已存在）。

### 9. 修改：烟测扩充与广告位余位修正

- **类型**：修改（质量保障 + 商业页修正）
- **涉及文件**：`scripts/smoke-test.mjs`、`src/app/advertise/page.tsx`
- **变更说明**：
  1. 烟测新增 5 项：/advertise、/data-api、/data-status 页面锚点、
     GET /api/prices（校验默认仅已核验 + meta 水位）、无效 status 拒绝、
     /api/leads 校验拒绝；admin 鉴权项同时接受 401（已配置令牌）与
     503（全新环境未配置 ADMIN_TOKEN）两种合法状态；
  2. /advertise 余位统计修正：指向 /advertise 自身的"自推广"位不计入已占用，
     避免示例数据把所有位次显示成"已满"误导真实买家；
     投放位下拉去重（原来显示"首页推荐位 · 首页推荐位"）。
- **影响范围**：烟测 20 项 → 25 项；/advertise 展示逻辑。
- **验证方式**：生产构建 + 25 项烟测全过 + 浏览器目检首页/数据状态页/广告位页。

---

## 2026-10-27（凌晨续作）

### 10. 修改：每日管线接入幽灵核验防线

- **类型**：修改（真实性加固补全）
- **涉及文件**：`scripts/daily-collect.sh`
- **变更说明**：上一轮新增的 `review:demote-stale` 只在手动跑时生效。现接入每日
  采集管线，且顺序固定为 导入 → **demote-stale** → changelog → 快照——
  降级事件发生在 changelog 之前才能被价格变动记录捕获留痕，顺序错了会漏记。
- **影响范围**：ECS 每日 03:45 定时任务行为（部署后生效）。
- **验证方式**：顺序经人工推演确认；demote-stale 单测已有覆盖。

### 11. 修复：限流器内存泄漏

- **类型**：修复（生产 bug）
- **涉及文件**：`src/lib/rate-limit.ts`、`tests/monetize.test.ts`
- **变更说明**：公开 API 的限流 Map 会为每个访问过的 IP 保留条目且永不清理，
  长期运行无限增长。新增 `sweepExpiredEntries()`：条目数破万时先清理全表
  过期窗口，把内存上限压到"一个窗口内真实访问数"量级。
- **影响范围**：`/api/prices` 运行时行为；限流判定逻辑不变。
- **验证方式**：新增单测（50 个过期条目清理后归零），90 个测试全过。

### 12. 修复：表单提交成功被误报为失败（React currentTarget 异步陷阱）

- **类型**：修复（生产 bug，影响两条已上线的表单）
- **涉及文件**：`src/components/LeadForm.tsx`、`src/components/FeedbackForm.tsx`
- **变更说明**：两个表单都在 `await fetch` 之后调用 `event.currentTarget.reset()`。
  React 的事件 `currentTarget` 只在同步分发期间有效，await 之后恒为 null，
  抛出 TypeError 被 catch 捕获——**提交实际已成功落盘，但用户看到"提交失败"**，
  会诱导重复提交（线索重复）。修复：同步阶段先抓 `const formEl = event.currentTarget`。
  FeedbackForm 的同一问题自上线以来就存在（此前 E2E 没覆盖浏览器提交路径）。
- **影响范围**：/advertise、/feedback 两个表单的成功路径。
- **验证方式**：E2E 真实浏览器提交 → 成功提示出现 → 落盘可查；调试阶段
  浏览器控制台/network 证据：API 返回 200 而页面显示失败，修复后一致。

### 13. 修改：E2E / Lighthouse 在 Windows 开发机可跑

- **类型**：修改（工程化）
- **涉及文件**：`scripts/e2e-test.mjs`、`scripts/lighthouse-audit.mjs`
- **变更说明**：两个脚本原来依赖 `@sparticuz/chromium`（Lambda 专用 Linux 二进制），
  Windows 上无法启动，E2E 只能在 ECS 跑。现在解析顺序为
  `E2E_EXECUTABLE_PATH` → Linux 走 @sparticuz → Windows 走本机 Chrome/Edge；
  Lighthouse 侧同时过滤 `--single-process`/`--no-zygote`（Lambda 内存裁剪
  flag，会弄死桌面版 Chrome 的 DevTools 握手）并补 `--remote-allow-origins=*`。
  E2E 新增第 7 个场景：广告位申请表单端到端（真实浏览器提交 → 落盘断言 →
  测试数据自动剔除，可反复运行不污染数据）。
- **影响范围**：本地回归能力补齐；ECS 行为不变。
- **验证方式**：本机 E2E 7 场景全过；Lighthouse 首页 performance 98(simulate)/
  100(provided)、/advertise 97，无障碍与 SEO 100。

### 14. 数据/文档：302.AI / AIHubMix 连通性定论 + HANDOFF 刷新

- **类型**：数据 + 文档
- **变更说明**：本机探测 302.ai 与 aihubmix.com 全部连接失败（000），
  证实阻塞不是 ECS 特有而是网络层面问题，两个采集器继续搁置有了明确依据。
  `HANDOFF.md` 刷新到 10-27 口径（数据 14 verified / 1 pending / 9 sample、
  新命令清单、待办与决策项）。
- **影响范围**：文档；无代码行为变化。
- **验证方式**：探测命令留痕于本文件；HANDOFF 与实际仓库状态逐项核对。

### 15. 数据：补回下架模型的覆盖缺口（qwen3-8-max-0902）

- **类型**：新增（数据覆盖）
- **涉及文件**：`data/models.json`、`data/imports/openrouter-map.json`、
  `data/prices.json`、快照与质量报告
- **变更说明**：qwen3-8-max 在源站下架后，站内该模型只剩一条无法核验的
  待核验价格。本次从 OpenRouter 实时 API 确认其官方快照替代版
  `qwen/qwen3.8-max-0902`（同厂商、同 1M 上下文、价格与原版一致），
  新增模型条目与映射，走完整管线：采集 → 导入 → 来源复核，
  `openrouter-qwen3-8-max-0902-credit` 已核验（14.4 / 43.2 / 1.8 CNY，
  与源站逐字段一致）。旧模型的待核验价格继续保留，等领导拍板去留。
- **影响范围**：模型数 10 → 11；价格 24 → 25（已核验 14 → 15）；
  模型详情页、/api/prices、sitemap 自动收录新模型。
- **验证方式**：`review:sources` 全量 MATCH；API `?model=qwen3-8-max-0902`
  返回已核验数据；详情页渲染正常；25 项烟测通过。

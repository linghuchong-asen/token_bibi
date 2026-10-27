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

### 16. 新增：数据状态页与 LeadForm 的渲染/交互回归

- **类型**：新增（测试）
- **涉及文件**：`tests/data-status.test.tsx`（新增）、`tests/lead-form.test.tsx`（新增）
- **变更说明**：
  1. `/data-status` 页面依赖脚本生成的 `data/price-changes.json`，此前没有任何
     渲染护栏，生成文件的字段一旦漂移页面会在构建/运行时崩掉。新增渲染断言
     （三个指标、分平台统计表、核验方法说明、变动列表与计数）+ axe 无障碍检查。
  2. LeadForm 提交交互回归：mock fetch 断言"成功提示 + 表单清空"——这是
     currentTarget 生产 bug（见第 12 条）的直接回归测试，修复前该测试会失败。
  3. 测试基建修正：项目 vitest 未开 globals，RTL 自动清理不生效，两个测试文件
     显式 `afterEach(cleanup)`，否则同文件的多次渲染会在 jsdom 里互相污染
     （axe 的 main landmark 规则与 getByText 重复匹配都会误报）。
- **影响范围**：仅测试；无产品代码变化。
- **验证方式**：30 个测试文件 / 97 个测试全过；typecheck 通过。

### 17. 修复：分发面的真实性缺口（分享卡/嵌入卡/分享页）

- **类型**：修复（真实性加固——站外传播面）
- **涉及文件**：`src/lib/share-data.ts`、`src/lib/share-card.ts`、`src/lib/embed.ts`、
  `src/app/share/page.tsx`、`tests/share-card.test.ts`
- **变更说明**：三个把数据带到站外的面都存在诚实性问题：
  1. PNG 分享卡的状态徽章与日期**硬编码**为"样例数据 · 2026-10-22"——
     已核验的新数据也被标成样例，日期永远是旧的；
  2. 嵌入卡完全没有核验状态与数据日期；
  3. 分享页脚注硬编码"更新于 2026-10-23"，且"最低估算成本"可能选中样例价格。
  修复：ShareCardData 携带 `dataStatus / verificationMethod / lastVerifiedAt`，
  新增 `shareStatusLabel / shareDataDate` 统一状态文案与日期格式；
  三个面全部改为展示真实状态；分享结论改为**已核验优先**（与比价页
  "默认只看已核验"同一原则），仅在无已核验价格时回退并如实标注。
- **影响范围**：/api/share-card PNG、/api/embed-card iframe、/share 页面的
  状态展示与选择逻辑；分享结论的数字可能从"最便宜的样例"变为"最便宜的已核验"。
- **验证方式**：嵌入卡实测输出"数据截至 2026-10-23 · 已核验 · 来源复核"；
  新增 4 个断言（状态映射、日期格式、硬编码移除、已核验优先）；102 测试 /
  25 烟测 / 7 E2E 全过。

---

## 2026-10-27（清晨功能与营销轮）

### 18. 新增：RSS 价格变动订阅 + 价格走势图 + 结构化数据（功能 × 营销）

- **类型**：新增（产品功能 + SEO/传播）
- **涉及文件**：
  - `src/app/feed.xml/route.ts`（新增）：RSS 2.0 订阅，条目来自价格变动记录，
    链接回模型详情页；布局声明 RSS 自动发现，页脚新增入口
  - `scripts/price-history.mjs`（新增）+ `npm run history:prices`：遍历快照 +
    当前数据生成 `data/price-history.json` 时间序列（内容未变的快照自动去重）；
    接入每日管线（changelog → history → snapshot）
  - `src/lib/price-history.ts`（新增）+ `src/components/PriceTrend.tsx`（新增）：
    模型详情页"价格走势"区块，内联 SVG 折线（零客户端 JS），只画真实变动过
    的价格，输入/输出各自归一化，百分比涨跌文字并列
  - `src/app/models/[slug]/page.tsx`：新增 `generateMetadata`（描述 + OG 图
    复用分享卡 PNG）与 JSON-LD Product/AggregateOffer（只含已核验价格的 Offer）
  - `src/app/api/prices/route.ts`：新增 `format=csv` 输出——Google Sheets
    IMPORTDATA / Excel WEBSERVICE 的接入格式
- **变更说明**：把"实时性"从后台管线升级为用户可感知、可订阅、可引用的功能；
  把 SEO 结构化数据与社交分享图补齐（此前模型页连 description 都没有）。
  营销素材：`marketing/community-posts.md` 新增"实测故事"系列——
  kimi-k3 单日三次调价（-33% / -6% / +5%）的真实记录就是最好的传播钩子。
- **附带修正**：`price-changelog.mjs` 基线从"最旧快照"改为"上一个快照"，
  "最近价格变动"从无界累积变为最近一轮差异。
- **影响范围**：模型详情页、全站布局、API、每日管线、营销文案。
- **验证方式**：104 → 109 个单测（price-history/feed/changelog 基线）；
  烟测 28 项（新增 /faq、/feed.xml、CSV）；浏览器目检走势图渲染正确；
  实测 RSS 输出 4 条真实变动条目。

### 19. 新增：模型对比页 + 比价页"近日降价"高亮

- **类型**：新增（产品功能）
- **涉及文件**：
  - `src/app/compare/page.tsx`（新增）：2-3 个模型同口径并排对比
    （已核验最低有效输入/输出价、上下文、能力、平台覆盖数），最低值绿色高亮；
    searchParams 驱动 + GET 表单，零客户端状态，对比链接可分享可收藏
  - `src/lib/price-history.ts`：新增 `recentlyCutModelIds()`——从最近变动记录
    找出输入/输出价出现下调的模型
  - `src/components/ModelsExplorer.tsx`：模型名旁新增绿色"近日降价"徽章
  - `src/app/models/page.tsx`：计算并传入降价模型集合 + "对比模型 →"入口；
    模型详情页新增"对比其他模型"入口
  - `src/app/sitemap.ts`、`scripts/smoke-test.mjs`：收录 /compare
- **变更说明**：两个功能都在把"实时性"变成用户可感知、可传播的产品面：
  降价徽章让比价表自己会讲故事；对比页承接"选型求助"类外部讨论的直接链接。
- **影响范围**：模型比价页、模型详情页、新页面 /compare。
- **验证方式**：烟测 29 项（新增 /compare）；浏览器目检对比页与降价徽章；
  109 个单测全过；typecheck 通过；生产构建通过。

### 20. 新增：降价动态页 /price-drops（RSS 的落地页 + 降价类搜索承接）

- **类型**：新增（产品功能 + 营销长尾）
- **涉及文件**：`src/app/price-drops/page.tsx`（新增）、`src/app/topics/page.tsx`
  （索引页新增入口卡片）、`src/app/sitemap.ts`、`scripts/smoke-test.mjs`、
  `src/app/compare/page.tsx` 与 `src/app/price-drops/page.tsx`（补 OG/Twitter 元数据）
- **变更说明**：
  1. /price-drops 从每日变动记录中筛出真实的输入/输出价下调事件（状态/计费方式
     变化不算降价），按降幅排序展示前后值与检测时间；没有降价时如实说明并引导
     RSS 订阅。页面同时是 RSS 的落地页和"AI 降价"类搜索的长尾承接页。
  2. 诚实边界写进页面：不做"预测降价"或"独家渠道价"，只记录已发生的、
     可复核的价格事实。
  3. 专题索引页、sitemap、烟测全部收录。
- **影响范围**：新页面 + 专题索引；无既有行为变化。
- **验证方式**：烟测 30 项（新增 /price-drops）；实测页面输出 3 条真实下调事件
  （kimi-k3 输入/缓存、deepseek-v4-1-flash 输出/缓存）；109 单测 / 7 E2E 全过。

### 21. 新增：长文草稿 + 内容日历更新 + 回归扩展（营销收尾）

- **类型**：新增（营销资产）+ 修改（测试/文档）
- **涉及文件**：`marketing/blog-drafts.md`（新增）、`marketing/content-calendar.csv`、
  `scripts/e2e-test.mjs`、`tests/price-drops.test.tsx`（新增）、`specs/checklist.md`
- **变更说明**：
  1. 两篇可发布长文草稿：《为什么你看到的 token 价格是假的》（实测故事主推）、
     《我们如何自动核验 AI 价格》（开发者向，含管线全景与免费 API）——
     全部数字来自今晚的真实管线记录，发布前只需替换正式域名。
  2. 30 天内容日历头部插入两条主打（实测故事 / 开发者 API），资产列同步新产物。
  3. E2E 第 8 个场景：/compare 移动端不溢出（宽表格页最容易爆版式）；
     /price-drops 渲染回归（事件卡 + 诚实边界声明 + axe）。
  4. checklist AC-9 营销面扩充至 14 项。
- **影响范围**：营销资产与回归覆盖；无产品行为变化。
- **验证方式**：33 文件 / 112 测试全过；烟测 30 项；8 个 E2E 场景全过。

### 22. 新增：首页最新动态 + 平台降价提示 + 历史序列 API + 长尾专题扩充

- **类型**：新增（产品功能 + SEO 长尾）
- **涉及文件**：
  - `src/app/page.tsx`：首页新增"最新价格动态"区块（最近 3 条变动 + RSS/API 导流）
  - `src/app/providers/[slug]/page.tsx`：平台详情页新增"近日降价"提示条（按平台过滤变动记录）
  - `src/app/api/price-history/route.ts`（新增）：`GET /api/price-history?model=`
    返回模型价格时间序列（只含已变动序列），与 /api/prices 共用限流，
    meta 注明 Pro 层边界；`/data-api` 页面补该接口文档
  - `src/app/topics/[slug]/page.tsx` + `src/app/topics/page.tsx`：新增两篇
    事件策划专题——《Kimi K3 降价了：现在多少钱？》《qwen3.8-max 下架了？替代方案》
  - `specs/marketing.md`：Day 6 数据资产清单 4 项勾选完成（长尾模板/变动报告/
    JSON 接口/RSS）
- **附带修复**：price-history API 初版误传模型 id 给 series 查询（应为价格 id
  列表），烟测抓到 0 series 后修正。
- **影响范围**：首页、平台详情页、新 API 路由、专题页。
- **验证方式**：烟测 32 项（新增历史 API 200/400 两项）；112 单测 / 8 E2E 全过；
  /price-drops Lighthouse performance 98 / a11y 100 / seo 100。

### 23. 数据：第 9 轮实时采集——kimi 第 4 次调价 + deepseek 计价重构（9 点前最后一轮）

- **类型**：数据更新（真实性/实时性的又一次实证）
- **涉及文件**：`data/prices.json`、`data/price-changes.json`、`data/price-history.json`、
  快照与质量报告、`tests/data-status.test.tsx`（断言健壮化）
- **变更说明**：距上一轮采集数小时后重跑全管线，抓到：
  1. kimi-k3 输入价 1.1448 → **1.2168（+5.9%）**——12 小时内第 4 次调价，
     本次为上调（此前三次为下调），进一步证实源站价格的高波动性；
  2. deepseek-v4-1-flash **计价结构被调整**：输入价 0.343 → 0.311，输出价
     1.374 → **0.072（-94.8%）**，缓存 0.0069 → 0.245——幅度远超普通调价；
  3. 两条新价经来源复核重新核验通过（15 已核验 / 1 待核验 / 9 样例），
     0 条幽灵核验。
- **附带修正**：data-status 渲染测试的计数断言改为存在性断言（固定数字会与
  分平台统计撞车）。
- **影响范围**：数据面；首页动态、/price-drops、RSS、历史序列随构建自动更新。
- **验证方式**：review:sources 全量 MATCH；112 单测 / 32 烟测 / 8 E2E 全过。

### 24. 新增：销售线索管理后台（盈利闭环的运营端）

- **类型**：新增（商业化运营功能）
- **涉及文件**：`src/app/api/admin/leads/route.ts`（新增）、
  `src/app/admin/leads/page.tsx`（新增）、`src/components/AdminLeadsClient.tsx`（新增）、
  `tests/admin-leads.test.ts`（新增）、`scripts/smoke-test.mjs`
- **变更说明**：此前线索落盘 `data/sponsor-leads.jsonl` 后没有任何查看入口，
  运营者要手动开文件。新增 `/admin/leads`：ADMIN_TOKEN 鉴权（与价格核验后台
  同一套 admin-auth），加载全部线索按时间倒序展示（产品/位次/公司/联系人/
  邮箱/预算/状态），并附跟进约定。鉴权细节：
  - 未配置 ADMIN_TOKEN → 503；令牌错误 → 401；
  - JSONL 单行损坏只跳过该行，不能让整个后台 500；
  - 空线索返回空列表而不是错误。
- **影响范围**：新增管理页面与 API；公开页面无变化。
- **验证方式**：3 个新单测（503/401/200 空列表）；烟测 34 项（新增 /admin/leads
  页面锚点 + API 鉴权检查）；115 单测 / 8 E2E 全过。

### 25. 修改：sitemap lastModified 反映真实数据日期 + 短视频/X 脚本

- **类型**：修改（SEO 正确性）+ 新增（营销资产）
- **涉及文件**：`src/app/sitemap.ts`、`marketing/video-scripts.md`（新增）
- **变更说明**：
  1. sitemap 的 lastModified 此前硬编码 2026-10-22——数据每天都在变，
     sitemap 却在向搜索引擎声明"没变过"。lastModified 与实际内容变化不符
     会污染搜索引警的 freshness 信号。现取价格变动记录的生成时间
     （每日管线更新），实测输出 2026-10-26T23:41Z。
  2. 新增 `marketing/video-scripts.md`：60 秒口播稿（画面/口播对照表）、
     7 推 X Thread、15 秒极短版——与长文同源数据，完成 specs/marketing.md
     "一份数据变成文章、图表、卡片、讨论帖、短视频脚本"的内容复用承诺。
- **影响范围**：sitemap 输出、营销资产。
- **验证方式**：实测 sitemap 输出真实时间戳；115 单测 / 34 烟测 / 8 E2E 全过。

### 26. 新增：全站 WebSite JSON-LD + 管理后台互链（收尾轮）

- **类型**：新增（SEO）+ 修改（管理导航）
- **涉及文件**：`src/app/layout.tsx`、`src/app/admin/prices/page.tsx`
- **变更说明**：
  1. 根布局输出 WebSite JSON-LD（站名与站点实体关联，全站生效）；
  2. /admin/prices 与 /admin/leads 互相可见入口——价格核验与线索跟进
     是同一运营者的两个工作台，不应当互相藏起来。
- **影响范围**：全站 head；管理页导航。
- **验证方式**：115 单测 / 34 烟测 / 8 E2E 全过；typecheck 与生产构建通过。

---

## 2026-10-28（凌晨去 demo 化 / 商业化一轮）

> 背景：领导反馈"看起来就是个 demo，信息不全"。逐条排查出的 demo 感来源：
> ① 全站 10 条样例状态数据（套餐 5 / 充值规则 5 / 卡密规则 5 / 样例价 9），
> 且页脚、首页、about 页三处自曝"样例数据"；② 收录规模太小（11 模型 / 25 价格）；
> ③ 商业信任件缺失（无隐私政策/服务条款/联系方式，域名兜底是 example.com）；
> ④ 名为"New API 示例站"的纯演示平台在线上货架。

### 27. 数据扩容：OpenRouter 收录 9 → 58 个模型，价格 25 → 63 条全核验

- **类型**：数据扩容 + 新增工具
- **涉及文件**：
  - `scripts/expand-openrouter-catalog.mjs`（新增）：精选 48 个主流模型
    （OpenAI / Anthropic / Google / DeepSeek / Qwen / Kimi / GLM / MiniMax / Grok /
    Llama / Mistral / Nova），从实时 API 校验后合并进 models.json 与采集映射；
    模型元数据（上下文长度 / 多模态 / 发布日期）全部取自 API，不手写数字。
    映射文件不进版本库，ECS 部署后需重跑本脚本一次再跑每日管线。
  - `data/models.json`：11 → 58 条；`data/prices.json`：25 → 63 条（100% verified）
  - `data/imports/openrouter-map.json`：10 → 58 条映射
- **变更说明**：走完整真实性管线：collect → import → `review:verify-sources`
  （与实时源逐字段一致才升"已核验"），48 条新价格全部核验通过。
- **验证方式**：quality-report：58 模型 / 63 价格 / 0 待核验 / 0 stale / 0 孤儿。

### 28. 删除：全部样例/虚构商业数据（宁缺毋假）

- **类型**：删除（真实性防线）
- **涉及文件**：`data/plans.json`（5 → 0）、`data/card-key-rules.json`（5 → 0）、
  `data/recharge-rules.json`（5 条虚构 → 4 条带真实来源的待核验规则）、
  `data/providers.json`（移除 newapi-demo；openrouter/siliconflow/官方平台状态
  改为 verified，302ai/aihubmix/official-openai 无价格改为 pending_review）、
  `data/prices.json`（移除 9 条样例价 + 1 条源站已下架的 pending 价）
- **变更说明**：HANDOFF 遗留的两个"待领导拍板"项一并处理：下架模型
  qwen3-8-max 的模型条目与遗留价格移除（官方快照替代版 0902 保留），
  siliconflow-kimi-k3 样例价移除（kimi-k3 模型保留，走 OpenRouter 已核验价）。
- **验证方式**：quality-report 0 孤儿 / 0 重复；`modelsWithoutPrices: 0`。

### 29. 页面收编：样例货架改真实指南（订阅/卡密/积分）

- **类型**：修改（信息架构重构）
- **涉及文件**：
  - `src/app/subscriptions/page.tsx`：套餐货架 → "订阅怎么算"方法论
    （折算单价 / 破局点 / 修正项）+ 已核验按量基线表；明确收录口径：
    未经核验的套餐一律不上架。
  - `src/app/card-keys/page.tsx`：虚构平台规则表 → 三步避坑指南
    （认入口 / 小钱试单 / 算真实成本）+ 风险信号清单；并说明为什么这页没有平台条目。
  - `src/app/credits/page.tsx` + `src/components/CreditCalculator.tsx`：
    去掉"样例数据"徽章；下拉框显示平台名而非内部 id；充值规则表只保留
    有公开来源的 4 条，拿不准的字段如实标"待核验"。
  - `src/app/providers/page.tsx`：副标题去掉已删除的示例站口径；0 套餐显示
    "待核验"而非"0 个"。
  - `src/app/models/[slug]/page.tsx`、`src/components/CalculatorClient.tsx`：
    空套餐话术改为"暂无已核验的订阅套餐"并引导按量估算。
  - `src/app/data-status/page.tsx`：核验方法说明更新为当前口径（无样例数据）。
- **验证方式**：typecheck + 115 单测通过（1 条老断言按新不变量修正，见 30）。

### 30. 修改：全站去"样例"自曝文案 + 首页三数字换真实指标

- **类型**：修改（文案 / 信息设计）
- **涉及文件**：
  - `src/app/page.tsx`：三个核心数字改为——已核验最低有效输入价、
    已核验价格（63/63 条）、收录规模（58 模型 · 7 平台），全部实时取自数据文件；
    删除对样例套餐的依赖。
  - `src/components/SiteFooter.tsx`：页脚改四栏（品牌 / 产品 / 数据与信任 /
    商业与法律），自曝句"套餐与规则部分仍为样例数据"改为
    "未核验信息一律不上架"。
  - `src/app/about/page.tsx`：重写——新增"我们是谁"（独立开发者运营、
    不参与交易）与"联系我们"（反馈表单 / 刊例 / API+RSS）；
    规模数字从数据文件实时读取。
  - `src/app/faq/page.tsx`："样例数据"问答改为"已核验 / 待核验"机制说明。
  - `src/app/globals.css`：新增页脚四栏样式（窄屏单列退化）。
- **验证方式**：typecheck + 单测 + 构建通过；冒烟覆盖首页与关键页。

### 31. 新增：隐私政策 + 服务条款（商业信任件）

- **类型**：新增（法律合规 / 信任件）
- **涉及文件**：`src/app/privacy/page.tsx`、`src/app/terms/page.tsx`（均新增）、
  `src/app/sitemap.ts`（新增 /privacy /terms /feedback 路由）
- **变更说明**：内容与站点真实行为严格对应——无账号系统、无第三方追踪脚本、
  表单数据仅存站点数据库供运营处理、API/表单按 IP 限流；
  服务条款明确信息整理工具性质、数据时效免责与使用规范。
- **验证方式**：构建后烟测覆盖 /privacy /terms。

### 32. 修复：域名兜底 example.com → 线上实例地址

- **类型**：修改（SEO 正确性）
- **涉及文件**：`src/app/layout.tsx`、`src/app/sitemap.ts`
- **变更说明**：NEXT_PUBLIC_SITE_URL 未设置时，canonical/OG/sitemap 会带上
  `tokenbibi.example.com` 占位域——搜索引擎会把它当成另一个站点。
  兜底改为线上实例地址 `http://100.125.251.103:8090`；正式域名下来后
  只需设置环境变量，无需改代码。
- **验证方式**：构建产物检查 canonical 域名。

### 33. 修复：价格历史类型在"价格被移除"后失效

- **类型**：修改（类型正确性）
- **涉及文件**：`src/lib/price-history.ts`、`tests/filtering.test.ts`
- **变更说明**：
  1. 快照点键集不再一致（删除价格后新快照缺少该键），`HistoryPoint.prices`
     值类型放宽为可 undefined（`seriesForPrice` 本就有存在性守卫）；
  2. `filtering.test.ts` 的"全量 > 已核验"断言改为"全量 ≥ 已核验"——
     样例清零后两者相等，"已核验是全量子集"这一不变量不变。
- **验证方式**：typecheck 通过；115/115 单测通过。

### 34. 数据管线：全量跑通并抓到 2 条真实变动

- **类型**：数据更新
- **涉及文件**：`data/price-changes.json`、`data/price-history.json`、快照目录
- **变更说明**：changelog 基线对比发现 2 条真实变动并留痕：
  kimi-k3 输入价 1.2168 → 1.08（降价）；deepseek-v4-1-flash 计价重构
  （输入 0.31 → 1.008、输出 0.072 → 3.024，回到正常倍率区间）。
  质量报告：58 模型 / 7 平台（4 已核验 + 3 待接入）/ 63 价格全核验 / 0 stale。
- **验证方式**：`npm run quality:report` + changelog 输出。

---

## 2026-10-28（凌晨第二轮：跨平台比价成网）

### 35. 数据扩容：SiliconFlow 2 → 15 条价格，跨平台可比模型 3 → 17 个

- **类型**：数据扩容
- **涉及文件**：`scripts/expand-openrouter-catalog.mjs`（CATOLOG 追加 9 个双平台
  同款模型）、`data/imports/siliconflow-map.json`（3 → 16 条映射）、
  `data/models.json`（58 → 67）、`data/prices.json`（63 → 85 条，100% verified）
- **变更说明**：比价站的核心价值是"同款模型不同平台的价差"。此前 67 个模型里只有
  3 个有多平台价格。本轮：
  1. 直接同款补映射：deepseek-v3-2 / glm-5-2 / glm-5-3（SiliconFlow 定价页有）；
  2. 新收录 9 个 OpenRouter×SiliconFlow 双平台模型（Kimi K2.6 / K2.7 Code、
     GLM-4.5 Air / 4.5V、Qwen3.5/3.6/3.8 系列开源型号），映射与目录一次到位；
  3. 版本不明确的近似款（如 DeepSeek-V4-Flash vs V4-Flash-0731）**不映射**，
     避免把不同版本当同款比价。
- **结果**：85 条价格 100% 已核验；17 个模型可跨平台比价；质量报告 0 孤儿 / 0 stale。
- **连通性记录**：302.AI 与 AIHubMix 本机 curl 全部 000（网络层阻塞），
  与 ECS 侧结论一致，两平台维持"待接入"。
- **验证方式**：`review:verify-sources` 全量 MATCH；quality-report。

### 36. 修复：变动/降价页空态缺检测时间

- **类型**：修改（诚实呈现）
- **涉及文件**：`src/app/data-status/page.tsx`、`src/app/price-drops/page.tsx`
- **变更说明**：两页在"本次未发现变动"时把检测时间与基线说明一起藏掉了。
  何时不吻合恰恰是空态下最有价值的新鲜度信号——空态同样展示
  "检测时间 + 基线：上一个快照"。同时两个渲染回归测试从依赖线上数据有变动
  变为对空态/有变动态都成立。
- **验证方式**：115/115 单测通过；34/34 烟测；8/8 E2E。

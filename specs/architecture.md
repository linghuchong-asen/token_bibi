# token比比 — 技术架构文档

- **产品名**：token比比
- **版本**：v0.1
- **状态**：Draft，等待确认
- **日期**：2026-10-21
- **推荐技术栈**：Next.js + TypeScript + Tailwind CSS + 静态数据文件 + Vitest / Playwright

## 1. 选型结论

### 1.1 推荐组合
| 层 | 选型 | 理由 |
| --- | --- | --- |
| 前端框架 | Next.js + React | 支持 SSR / SSG / SEO / 路由 |
| 语言 | TypeScript | 数据结构复杂，需要强类型 |
| 样式 | Tailwind CSS | 快速实现响应式、低成本、可维护 |
| UI 组件 | 自建 + 少量 shadcn/ui | 控制依赖和包体 |
| 数据 | JSON / TS 静态文件 + Zod 校验 | 初期不需要数据库，便于版本控制和静态部署 |
| 搜索 | 客户端搜索 + 构建索引 | 适合百级模型和千级价格 |
| 计算 | 纯函数模块 | 便于测试和复用 |
| 测试 | Vitest + Puppeteer Core + @sparticuz/chromium | 单元/组件、HTTP 烟测和浏览器 E2E |
| 分享图 | @resvg/resvg-js | 服务端把 SVG 分享卡渲染为 PNG |
| 部署 | Vercel / Cloudflare Pages | 零成本启动，支持静态生成 |

### 1.2 为什么不用数据库作为 MVP 首选
1. **初期数据量不大**
   - 模型和价格可以用文件维护
2. **便于版本控制**
   - 每次数据变更可 review
3. **部署简单**
   - 不需要服务器和数据库
4. **性能更好**
   - 页面可静态生成
5. **后续可迁移**
   - 数据模型先在 TS 中稳定，再迁移到 SQLite / Postgres

## 2. 整体架构

```text
数据文件
  ↓
Zod 校验
  ↓
构建期数据索引
  ↓
Next.js 页面
  ↓
静态生成 / ISR
  ↓
用户访问
```

## 3. 模块划分

### 3.1 数据层
- `models`
- `providers`
- `pricing`
- `plans`
- `recharge`
- `card_key`
- `risk`
- `sources`

### 3.2 计算层
- 价格换算
- 充值汇率
- 订阅折算
- 破局点
- 混合策略建议

### 3.3 展示层
- 首页
- 模型比价
- 平台比价
- 详情页
- 计算器
- 分享页

### 3.4 增长层
- SEO
- 分享卡片
- 嵌入组件
- 长尾页面
- 数据快照

## 4. 数据模型

### 4.1 `Model`
```ts
type Model = {
  id: string;
  name: string;
  vendor: string;
  family: string;
  capabilities: string[];
  contextLength?: number;
  isMultimodal: boolean;
  releaseDate?: string;
  aliases: string[];
};
```

### 4.2 `Provider`
```ts
type Provider = {
  id: string;
  name: string;
  type: 'official_api' | 'aggregator' | 'relay' | 'new_api_instance';
  websiteUrl: string;
  pricingUrl?: string;
  monitorUrl?: string;
  supportUrl?: string;
  commercialRelation?: 'none' | 'listed' | 'affiliate' | 'sponsored' | 'partner';
  updatedAt: string;
};
```

### 4.3 `Pricing`
```ts
type Pricing = {
  modelId: string;
  providerId: string;
  currency: 'CNY' | 'USD';
  inputPricePerMTokens: number;
  outputPricePerMTokens: number;
  cacheReadPricePerMTokens?: number | null;
  cacheWritePricePerMTokens?: number | null;
  billingMode: 'pay_as_you_go' | 'credit' | 'subscription' | 'fixed' | 'per_request';
  rechargeRatio?: string | null;
  modelMultiplier?: number | null;
  effectiveInputPrice?: number;
  effectiveOutputPrice?: number;
  sourceUrl: string;
  lastVerifiedAt: string;
  dataStatus: 'sample' | 'pending_review' | 'verified';
};
```

### 4.4 `SubscriptionPlan`
```ts
type SubscriptionPlan = {
  providerId: string;
  name: string;
  price: number;
  currency: 'CNY' | 'USD';
  period: 'month' | 'year' | 'day' | 'custom';
  quota: number | null; // null = unlimited
  quotaUnit: 'tokens' | 'credits' | 'requests';
  resetCycle: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  modelScope: string[]; // Model IDs or wildcard '*'
  groupUpgrade?: string | null;
  groupDowngrade?: string | null;
  overageRule?: string | null;
  purchaseLimit?: number | null;
  sourceUrl: string;
  lastVerifiedAt: string;
};
```

### 4.5 `RechargeRule`
```ts
type RechargeRule = {
  providerId: string;
  currency: 'CNY' | 'USD';
  rechargeRatio: string; // e.g. "1 CNY = 1.2 credits"
  minimumTopUp?: number | null;
  discount?: number | null;
  balanceExpiry?: string | null;
  refundable: boolean | null;
  allowedModels?: string[] | null;
  sourceUrl: string;
  lastVerifiedAt: string;
};
```

### 4.6 `CardKeyRule`
```ts
type CardKeyRule = {
  providerId: string;
  supported: boolean;
  usageRule?: string | null;
  validUntil?: string | null;
  supportChannel?: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  sourceUrl?: string | null;
  lastVerifiedAt: string;
};
```

### 4.7 `Risk`
```ts
type Risk = {
  providerId: string;
  channelType:
    | 'official_api'
    | 'cloud'
    | 'first_party_pool'
    | 'reverse_engineered'
    | 'reseller'
    | 'mixed'
    | 'undisclosed';
  labels: string[];
  supportInvoice: boolean | null;
  refundPolicy?: string | null;
  supportChannels: string[];
  paymentMethods: string[];
  monitoringAvailable: boolean;
  updatedAt: string;
};
```

## 5. 关键计算公式

### 5.1 按量有效成本
```text
有效输入成本 =
  标价输入成本 × 充值系数 × 模型倍率 × 分组倍率
```

### 5.2 积分有效成本
```text
充值系数 =
  实付金额 / 到手额度

有效成本 =
  标价成本 × 充值系数
```

### 5.3 订阅有效成本
```text
每 1M tokens 订阅成本 =
  套餐价格 / (套餐额度 / 1,000,000)
```

### 5.4 破局点
```text
当 按量总成本 = 订阅总成本 时，
对应 token 用量即为破局点。
```

## 6. API / 数据接口设计

### 6.1 构建期数据
- `GET /data/models.json`
- `GET /data/providers.json`
- `GET /data/prices.json`
- `GET /data/plans.json`

### 6.2 页面路由
```text
/
/models
/models/[slug]
/providers
/providers/[slug]
/subscriptions
/credits
/card-keys
/calculator
/share
/topics
/topics/[slug]
/about
/prototype.html
/api/share-card
/api/embed-card
/advertise
/feedback
/admin/prices
/api/admin/prices/verify
/api/feedback
```

### 6.3 查询参数
计算器页使用 query params 保存结果：

```text
/calculator?model=glm-5.3-flash
  &input=1000000
  &output=500000
  &cache=0.2
  &currency=CNY
```

## 7. 目录结构建议

```text
token-bibi/
├── specs/
│   ├── prd.md
│   ├── ui-design.md
│   ├── architecture.md
│   ├── test-cases.md
│   └── marketing.md
├── data/
│   ├── models.json
│   ├── providers.json
│   ├── prices.json
│   ├── plans.json
│   └── rules.json
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── models/
│   │   ├── providers/
│   │   ├── subscriptions/
│   │   ├── credits/
│   │   ├── card-keys/
│   │   └── calculator/
│   ├── components/
│   ├── lib/
│   │   ├── pricing.ts
│   │   ├── calculate.ts
│   │   └── validate.ts
│   └── styles/
├── scripts/
│   ├── build-index.ts
│   └── validate-data.ts
├── tests/
│   ├── pricing.test.ts
│   ├── calculator.test.ts
│   └── e2e.spec.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 8. 构建与部署

### 8.1 构建流程
1. 读取 `data/*.json`
2. Zod 校验
3. 生成索引
4. 静态生成页面
5. 产出 sitemap 和 RSS

### 8.2 部署
- **开发**：`npm run dev`
- **构建**：`npm run build`
- **测试**：`npm test`
- **E2E**：`npm run test:e2e`
- **部署**：Vercel 或 Cloudflare Pages

## 9. 性能设计

1. 首页静态生成
2. 数据构建期索引
3. 客户端搜索仅加载必要字段
4. 图片使用 WebP
5. 分享卡片服务端生成或按需生成
6. 第三方脚本延迟加载
7. 移动端避免复杂动画

## 10. SEO 设计

1. 每个模型和平台页面有唯一 URL
2. 页面标题包含核心关键词
3. 生成 `sitemap.xml`
4. 使用结构化数据
5. 长尾页面由模型 × 平台 × 计费方式组合生成
6. 保持更新时间可见
7. 提供开放 JSON 数据，方便被引用

## 11. 安全与合规

1. 不存储用户敏感数据
2. 不保存 API Key
3. 不引导规避平台风控
4. 明确免责声明
5. 收录标准公开
6. 商业关系透明
7. 数据来源可追溯

## 12. 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 数据错误 | 信任下降 | 来源、时间、纠错入口 |
| 数据更新成本高 | 内容过期 | 半自动化脚本 + 定期快照 |
| 页面过重 | 性能下降 | 静态生成 + 按需加载 |
| 计算逻辑复杂 | 用户困惑 | 结论先行 + 展开解释 |
| 商业化冲突 | 排序公正性受疑 | 广告隔离 + 公开规则 |

## 13. 后续扩展

1. 用户提交平台
2. 后台管理面板
3. 真实调用监测
4. API 数据订阅
5. 更多语言版本
6. 嵌入组件市场

## 14. 实施中发现的问题与修正

### 2026-10-22
1. **`@resvg/resvg-js` 在 Turbopack 下构建失败**
   - 现象：原生 `.node` addon 无法作为 ESM chunk 打包。
   - 修正：在 `next.config.ts` 配置 `serverExternalPackages: ["@resvg/resvg-js"]`。
2. **NextResponse 不接受 Node Buffer 类型**
   - 现象：TypeScript 报 `Buffer` 不能赋给 `BodyInit`。
   - 修正：分享卡 API 使用 `new Uint8Array(png)` 返回。
3. **Vitest 配置出现 ESM/CommonJS 警告**
   - 现象：`vitest.config.ts` 以 CommonJS 加载时提示未来不兼容。
   - 修正：`package.json` 增加 `"type": "module"`。
4. **分享卡从占位页面升级为真实 PNG**
   - 新增 `/api/share-card`，支持参数化生成 1200×630 PNG。
   - 分享页增加预览和下载按钮。
5. **用户纠错暂存本地文件**
   - 新增 `/feedback` 与 `/api/feedback`。
   - MVP 阶段写入 `data/feedback.jsonl`，仅适合单机 ECS；正式上线前应迁移到数据库或对象存储。
6. **增加价格导入与每日快照**
   - 新增 `npm run import:prices`，从 `data/imports/prices.csv` 合并价格并生成备份。
   - 启用 `token-bibi-snapshot.timer`，每日 03:15 执行 `npm run snapshot`。
7. **axe 可访问性扫描发现空表头**
   - 现象：模型表格最后一列表头没有可读文本。
   - 修正：补上“操作”表头，并增加 `tests/accessibility.test.tsx`。
8. **Node `fetch` 访问 OpenRouter 失败，curl 可用**
   - 现象：ECS 上 Node `fetch` 连接 OpenRouter API 超时，`curl` 可正常访问。
   - 修正：采集脚本改用 `execFileSync("curl", ...)` 拉取 OpenRouter 模型数据。
   - 数据处理：USD/token 转为 CNY/1M，固定汇率 7.2，标记为 `pending_review`，不直接当作已核验数据。
9. **静态构建导致采集后页面数据不更新**
   - 现象：JSON 数据更新后，Next.js 静态页面仍然使用旧构建产物。
   - 修正：每日采集脚本在导入数据后执行 `npm run build` 并重启 `token-bibi-app.service`。
   - 当前定时：每日 03:45 采集 OpenRouter，随后导入、快照、质量检查、构建和重启。
10. **增加数据质量报告**
   - 新增 `npm run quality:report`，检查重复价格 ID、孤儿价格、缺失价格、过期价格和无效套餐/规则关联。
   - 输出 `data/quality-report.json`，每日采集后自动执行。
11. **增加 SiliconFlow 采集**
   - 新增 `npm run collect:siliconflow`，抓取公开价格页并解析 GLM/DeepSeek 价格。
   - 当前采集 2 个模型，标记为 `pending_review`。
   - 302.AI 与 AIHubMix 在当前 ECS 网络环境下连接超时，暂未接入。
12. **增加人工核验 CLI**
   - 新增 `npm run review:prices -- --list` 查看待核验价格。
   - 新增 `npm run review:prices -- --verify <price-id>` 标记为已核验并写入时间。
   - 核验前自动备份 `data/prices.json`。
13. **Lighthouse 性能审计**
   - 新增 `npm run lighthouse`，使用 `@sparticuz/chromium` + Lighthouse。
   - 将首页、Header、Footer、价格表等静态导航改为原生 `<a>`，减少客户端导航依赖。
   - Lighthouse 偶发出现未采集截图导致 speed-index 缺失，脚本增加最多 6 次自动重试；低于 0.9 时返回非零退出码，不再把失败结果当作成功。
   - 当前 mobile simulated：performance 99 / accessibility 100 / best-practices 100 / SEO 100。
   - 当前 mobile provided：performance 100 / accessibility 100 / best-practices 100 / SEO 100。
   - 结论：模拟移动端性能门槛已通过。
14. **增加 Web 价格核验后台**
   - 新增 `/admin/prices` 和 `/api/admin/prices/verify`。
   - 使用 `.env.production` 中的 `ADMIN_TOKEN` 保护写操作，比较时使用 `timingSafeEqual`。
   - 核验写入 `data/prices.json` 前自动备份；核验后需重新构建页面才能在前台生效。
   - 应用已从 transient unit 迁移为永久 systemd unit：`/etc/systemd/system/token-bibi-app.service`。
15. **增加浏览器级 E2E**
   - 新增 `npm run test:e2e`，使用 `@sparticuz/chromium` + `puppeteer-core`。
   - 覆盖首页、模型搜索筛选、计算器交互、分享卡图片、管理后台和移动端布局。
   - 当前 6 个 E2E 场景全部通过。
16. **E2E 发现移动端横向溢出**
   - 现象：390px 视口下 `/models` 页面 `scrollWidth=888`。
   - 修正：为 grid 子项和 `.card` 增加 `min-width: 0`，并限制 `.table-wrap` 最大宽度。
   - 修复后移动端 E2E 通过。
17. **价格复核闭环**
   - 新增 `npm run review:sources`，重新抓取 OpenRouter API 与 SiliconFlow 价格页并逐字段比对。
   - 新增 `npm run review:verify-sources`，只把 MATCH 的待核验价格写入 `verified`，记录 `verificationMethod: "source_check"`。
   - 导入脚本新增状态保真：价格字段未变化的已核验记录保留原核验状态和时间；价格变化时才重置为 `pending_review`。
   - 前台价格状态区分“人工核验”和“来源复核”；模型页与首页按价格集合汇总状态。
   - 2026-10-23：15 条价格完成来源复核（含 Anthropic / 智谱官方定价），新增 `collect:official` 每日官方价格采集，待核验归零。

## 15. 变更记录

- 2026-10-21：初稿创建，确定 Next.js + TypeScript + 静态数据方案。
- 2026-10-23：新增价格来源复核、批量核验与导入状态保真；新增 Anthropic / 智谱官方价格采集；15 条价格完成来源复核，修正官方样例价，待核验归零；Lighthouse 重试上限提升至 6 次并在性能不达标时失败；当前 26 个测试文件 / 69 个测试通过。
- 2026-10-22：补充 `@resvg/resvg-js`、分享卡 API、Turbopack 构建修正和测试覆盖说明；新增 `src/lib/filtering.ts` 并覆盖搜索、筛选、排序测试；新增 ModelsExplorer 与 CalculatorClient 组件交互测试；新增 `sitemap.ts`、`robots.ts` 与 SEO 烟测；新增 `/api/embed-card` 独立嵌入组件；新增稳定性排序、固定赞助位、`/advertise`、`/feedback`、`/admin/prices` 页面、`npm run snapshot`、`npm run import:prices`、`npm run collect:openrouter`、`npm run collect:siliconflow`、`npm run review:prices`、Lighthouse 性能审计与静态导航优化、数据质量报告、每日快照 timer、每日市场数据采集 timer、axe 可访问性测试、`npm run test:smoke` HTTP 烟测和 `npm run test:e2e` 浏览器 E2E；应用服务改为永久 systemd unit；Lighthouse simulated 100 / provided 100；E2E 修复移动端横向溢出。

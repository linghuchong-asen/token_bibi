# token比比 · 7 天冷启动 + 30 天节奏

> 2026-10-27 更新：产品已具备的可分发资产大幅扩充——RSS 订阅、公开数据 API
> （JSON/CSV）、价格走势图、模型对比页、数据状态页、FAQ 长尾页。
> 各 Day 的动作应优先使用这些现成资产。

## Day 1：准备资产

- [ ] 检查首页、模型比价、计算器、分享卡片可用
- [ ] 导出 3 张分享卡片
- [ ] 准备一句话介绍
- [ ] 准备 GitHub README
- [ ] 准备社区发布文案（用 community-posts.md 的"实测故事"系列——
      kimi-k3 单日三次调价的真实记录是最佳钩子）
- [ ] 核对 /data-status 页面数字与文案一致

## Day 2：社区首发

优先渠道：

1. Linux.do
2. V2EX
3. GitHub
4. X
5. Telegram

发布结构：

1. 反直觉结论（"你收藏的比价表可能是三天前的价格"）
2. 真实数据截图（/data-status 的变动记录 + 模型页走势图）
3. 工具链接
4. 请求补充平台和模型

## Day 3：长尾内容

发布：

- 《为什么你看到的 token 价格是假的》
- 《订阅 vs 按量，我算了一次破局点》
- 《充值汇率如何让低价变贵》
- 《kimi-k3 一天降价两次：谁在盯着你的 API 账单》（承接实测故事）

SEO/GEO 基建（已就绪，需提交搜索引擎）：

- [ ] sitemap.xml 提交（含 /faq、/compare 等新页）
- [ ] FAQ 页已带 FAQPage JSON-LD，模型页已带 Product/AggregateOffer
- [ ] /feed.xml 提交到 RSS 目录与聚合器

## Day 4：分享传播

- [ ] 分享卡片（PNG 已带真实核验状态与数据日期）
- [ ] 分享链接
- [ ] 嵌入组件（iframe 自带核验状态脚注）
- [ ] Markdown 结果
- [ ] 模型对比链接（/compare?models=...）发到"选型求助"类帖子

## Day 5：开发者分发

- [ ] /data-api 页面转成短文：《一条公式把 AI 价格表拉进表格》
      （Sheets IMPORTDATA + CSV，零代码人群也能用）
- [ ] 提交到公开 API 目录与 awesome 列表（免费层 + 署名要求）
- [ ] 在相关项目 issue/讨论里用 API 顺手回答价格问题（自然露出）

## Day 6：合作互推

联系：

- API 中转平台
- 开发者工具
- 独立开发者
- 技术社区管理员

## Day 7：复盘

记录：

- UV / PV
- 搜索点击
- 计算器使用
- 分享率
- 数据纠错数
- RSS 订阅数 / API 调用量（免费层日志）
- 广告位与 API 订阅线索数（data/sponsor-leads.jsonl）

## 30 天节奏

### Week 1
冷启动、收集反馈、修正文案。

### Week 2
发布 5 篇长尾内容，增加模型和平台页面；监控 RSS/API 增长。

### Week 3
SEO（JSON-LD 已就位）、开放数据引用、第一个 AFF 账号接入
（providers.json.affiliateUrl 填字段即生效）。

### Week 4
嵌入组件、合作互推、广告位首位成交、复盘转化与线索质量。

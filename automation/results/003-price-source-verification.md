# 003 Price Source Verification — 结果

## 完成内容

- 新增 `npm run review:sources`：重新抓取 OpenRouter API、SiliconFlow、Claude 官方和智谱官方定价页，逐条比对输入价、输出价和缓存价。
- 新增 `npm run collect:official`：每日采集 Anthropic / 智谱官方价格并生成 CSV。
- 新增 `npm run review:verify-sources`：只将 MATCH 的待核验价格标记为已核验，并写入 `verificationMethod: "source_check"`。
- 批量核验前自动备份 `data/prices.json`。
- 导入脚本增加状态保真：价格字段未变化的已核验记录保留原核验状态和时间；价格变化时才回到 `pending_review`。
- 前台区分“人工核验”和“来源复核”；模型页和首页按价格集合汇总状态。
- 模型比价默认只显示已核验价格，可切换“全部价格（含样例）”，避免样例低价污染默认排序。
- 首页最低价和模型详情最低价优先使用已核验价格。

## 数据结果

- OpenRouter：10 条，全部 MATCH
- SiliconFlow：2 条，全部 MATCH；Kimi K3 样例在源站已找不到，SKIP
- Anthropic 官方：2 条，全部 MATCH（Sonnet 5、Opus 5）
- 智谱官方：1 条，MATCH（GLM-5.3-Flash）
- 已核验：15 条
- 剩余待核验：0 条
- 样例价格：9 条（302.AI、AIHubMix、New API 示例站、OpenAI 官方样例、SiliconFlow Kimi K3 等）

## 修改文件

- `scripts/lib/prices.mjs`
- `scripts/lib/source-check.mjs`
- `scripts/review-prices.mjs`
- `scripts/import-prices.mjs`
- `src/lib/data-status.ts`
- `src/lib/filtering.ts`
- `src/components/Badges.tsx`
- `src/components/PriceTable.tsx`
- `src/components/ModelsExplorer.tsx`
- `src/app/page.tsx`
- `src/app/models/[slug]/page.tsx`
- `src/app/providers/[slug]/page.tsx`
- 相关测试与文档

## 验证命令与结果

- `npm run review:sources`：15 条 MATCH，1 条 SKIP，0 条 MISMATCH/MISSING
- `npm run review:verify-sources`：15 条匹配，1 条 SKIP，0 条未匹配
- 重复导入 OpenRouter / SiliconFlow / 官方价格采集文件：15 条已核验记录的状态均成功保留
- `npm run quality:report`：pendingReview 0，孤儿价格 0，重复 ID 0
- `npm run typecheck`：通过
- `npm test`：26 个测试文件 / 69 个测试通过
- `npm run build`：通过
- `npm run test:e2e`：6 个场景通过
- Lighthouse mobile simulated / provided：100 / 100

## 剩余问题

- 9 条样例价格尚未核实，其中 302.AI / AIHubMix 仍受 ECS 网络或 DNS 阻塞。
- 套餐、充值规则、卡密和平台规则仍有样例数据，需继续核验。

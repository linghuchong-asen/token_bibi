// 文件用途：HTTP 页面烟测（所属模块：scripts，部署后或发布前运行）
// 对一组关键路径断言"页面可访问 + 包含锚点文案"，覆盖全部核心页面、
// 两个盈利入口（/advertise、/data-api）、数据状态页和三个 API 的基本行为。
// 目标地址默认 127.0.0.1:8090，可用 SMOKE_BASE_URL 覆盖。
const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:8090";
const checks = [
  { path: "/", expect: "不要只看 token 单价" },
  { path: "/models", expect: "模型比价" },
  { path: "/providers", expect: "平台比价" },
  { path: "/subscriptions", expect: "OpenRouter Standard" },
  { path: "/credits", expect: "积分" },
  { path: "/card-keys", expect: "卡密" },
  { path: "/calculator", expect: "成本计算器" },
  { path: "/share", expect: "分享" },
  { path: "/about", expect: "收录不等于推荐" },
  { path: "/advertise", expect: "广告位合作" },
  { path: "/data-api", expect: "价格数据 API" },
  { path: "/data-status", expect: "数据状态与新鲜度" },
  { path: "/faq", expect: "常见问题" },
  { path: "/feed.xml", expect: "<rss" },
  { path: "/compare?models=glm-5-3-flash,kimi-k3", expect: "最低有效输入价" },
  { path: "/feedback", expect: "数据纠错" },
  { path: "/admin/prices", expect: "价格核验" },
  { path: "/models/gpt-5-6-sol", expect: "GPT-5.6 Sol" },
  { path: "/providers/openrouter", expect: "上游类型" },
  { path: "/sitemap.xml", expect: "<urlset" },
  { path: "/robots.txt", expect: "Sitemap:" },
];

let failed = 0;
let total = 0;
for (const check of checks) {
  total += 1;
  const response = await fetch(`${base}${check.path}`);
  const text = await response.text();
  const ok = response.ok && text.includes(check.expect);
  console.log(`${ok ? "PASS" : "FAIL"} ${check.path} (${response.status})`);
  if (!ok) failed += 1;
}

total += 1;
const card = await fetch(`${base}/api/share-card?model=gpt-5-6-sol`);
const cardBytes = new Uint8Array(await card.arrayBuffer());
const cardOk = card.ok && card.headers.get("content-type")?.includes("image/png") && cardBytes.length > 1000;
console.log(`${cardOk ? "PASS" : "FAIL"} /api/share-card (${card.status}, ${cardBytes.length} bytes)`);
if (!cardOk) failed += 1;

total += 1;
const embed = await fetch(`${base}/api/embed-card?model=gpt-5-6-sol`);
const embedText = await embed.text();
const embedOk = embed.ok && embedText.includes("token比比");
console.log(`${embedOk ? "PASS" : "FAIL"} /api/embed-card (${embed.status})`);
if (!embedOk) failed += 1;

total += 1;
const feedback = await fetch(`${base}/api/feedback`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({}),
});
const feedbackData = await feedback.json();
const feedbackOk = feedback.status === 400 && feedbackData.ok === false;
console.log(`${feedbackOk ? "PASS" : "FAIL"} POST /api/feedback validation (${feedback.status})`);
if (!feedbackOk) failed += 1;

// 管理接口必须拒绝未授权访问。两种合法状态：
// 401 = 已配置 ADMIN_TOKEN 且令牌错误；503 = 未配置 ADMIN_TOKEN（全新环境）。
// 鉴权逻辑本身的正确性由 tests/admin-auth.test.ts 单测保证。
total += 1;
const admin = await fetch(`${base}/api/admin/prices/verify`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-admin-token": "wrong" },
  body: JSON.stringify({ id: "not-a-real-id" }),
});
const adminData = await admin.json();
const adminOk = admin.status === 401 || admin.status === 503;
console.log(`${adminOk ? "PASS" : "FAIL"} POST /api/admin/prices/verify auth (${admin.status}, ${adminData.error ?? ""})`);
if (!adminOk) failed += 1;

// 公开数据 API（盈利入口②的免费层）：默认只出已核验价格，meta 需带数据水位
total += 1;
const pricesApi = await fetch(`${base}/api/prices`);
const pricesData = await pricesApi.json();
const pricesOk =
  pricesApi.ok &&
  pricesData.ok === true &&
  Array.isArray(pricesData.data) &&
  pricesData.data.length > 0 &&
  pricesData.data.every((row) => row.dataStatus === "verified") &&
  typeof pricesData.meta.verifiedRatio === "number" &&
  typeof pricesData.meta.newestVerifiedAt === "string";
console.log(`${pricesOk ? "PASS" : "FAIL"} GET /api/prices (${pricesApi.status}, ${pricesData.data?.length ?? 0} rows)`);
if (!pricesOk) failed += 1;

// CSV 输出：电子表格接入（Sheets IMPORTDATA / Excel WEBSERVICE）依赖的格式
total += 1;
const pricesCsv = await fetch(`${base}/api/prices?format=csv`);
const csvText = await pricesCsv.text();
const csvOk = pricesCsv.ok && csvText.startsWith("provider,model,") && csvText.split("\n").length > 2;
console.log(`${csvOk ? "PASS" : "FAIL"} GET /api/prices?format=csv (${pricesCsv.status}, ${csvText.split("\n").length - 2} rows)`);
if (!csvOk) failed += 1;

// 无效 status 参数应被拒绝
total += 1;
const pricesBad = await fetch(`${base}/api/prices?status=bogus`);
const pricesBadOk = pricesBad.status === 400;
console.log(`${pricesBadOk ? "PASS" : "FAIL"} GET /api/prices?status=bogus (${pricesBad.status})`);
if (!pricesBadOk) failed += 1;

// 销售线索 API：非法请求应被校验拦截（不落盘）
total += 1;
const leadsBad = await fetch(`${base}/api/leads`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ product: "sponsor_slot", company: "x", contact: "x", email: "bad" }),
});
const leadsBadData = await leadsBad.json();
const leadsBadOk = leadsBad.status === 400 && leadsBadData.ok === false;
console.log(`${leadsBadOk ? "PASS" : "FAIL"} POST /api/leads validation (${leadsBad.status})`);
if (!leadsBadOk) failed += 1;

if (failed > 0) {
  console.error(`smoke test failed: ${failed}`);
  process.exit(1);
}
console.log(`smoke test passed: ${total} checks`);

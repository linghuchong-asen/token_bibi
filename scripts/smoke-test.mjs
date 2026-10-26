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
  { path: "/advertise", expect: "赞助位合作" },
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

total += 1;
const admin = await fetch(`${base}/api/admin/prices/verify`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-admin-token": "wrong" },
  body: JSON.stringify({ id: "not-a-real-id" }),
});
const adminData = await admin.json();
const adminOk = admin.status === 401 && adminData.ok === false;
console.log(`${adminOk ? "PASS" : "FAIL"} POST /api/admin/prices/verify auth (${admin.status})`);
if (!adminOk) failed += 1;

if (failed > 0) {
  console.error(`smoke test failed: ${failed}`);
  process.exit(1);
}
console.log(`smoke test passed: ${total} checks`);

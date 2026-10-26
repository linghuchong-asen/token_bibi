// 文件用途：嵌入卡 HTML 生成（所属模块：src/lib，被 /api/embed-card 输出 iframe）
// 嵌入卡会把比价结论带到第三方站点，必须随卡片携带核验状态与数据日期，
// 让"真实性承诺"跟着数据走，而不是只留在站内。
import type { ShareCardData } from "./share-data";
import { shareDataDate, shareStatusLabel } from "./share-data";
import { formatCny, formatTokens } from "./format";

export function buildEmbedHtml(data: ShareCardData, origin: string, query: string): string {
  const model = escapeHtml(data.modelName);
  const provider = escapeHtml(data.providerName);
  const total = formatCny(data.totalCost);
  const effective = formatCny(data.effectiveCostPerMillion);
  const tokens = formatTokens(data.inputTokens + data.outputTokens);
  const statusLabel = escapeHtml(shareStatusLabel(data));
  const dataDate = shareDataDate(data);
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box}body{margin:0;background:transparent;font-family:"Noto Sans CJK SC","Inter",system-ui,sans-serif}
  .card{max-width:520px;border:1px solid #dbeafe;border-radius:18px;padding:18px;background:linear-gradient(135deg,#eff6ff,#f5f3ff);color:#0f172a}
  .row{display:flex;justify-content:space-between;gap:12px;align-items:start}
  .brand{font-weight:800;color:#1d4ed8}.muted{color:#64748b;font-size:12px}
  h2{margin:10px 0 4px;font-size:22px}.cost{font-size:30px;font-weight:800;color:#2563eb;margin:10px 0 2px}
  .metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.metric{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px}
  a{display:inline-block;margin-top:14px;background:#2563eb;color:#fff;text-decoration:none;border-radius:9px;padding:9px 12px;font-size:13px;font-weight:700}
</style>
</head>
<body>
<div class="card">
  <div class="row"><span class="brand">token比比</span><span class="muted">真实到手成本</span></div>
  <h2>${model}</h2>
  <div class="muted">${provider} · ${tokens} tokens / 月</div>
  <div class="cost">${total}</div>
  <div class="muted">最低估算成本</div>
  <div class="metrics">
    <div class="metric"><div class="muted">有效成本 / 1M</div><strong>${effective}</strong></div>
    <div class="metric"><div class="muted">缓存命中率</div><strong>${(data.cacheHitRate * 100).toFixed(0)}%</strong></div>
  </div>
  <div class="muted" style="margin-top:10px">数据截至 ${dataDate} · ${statusLabel}</div>
  <a href="${escapeHtml(origin)}/share?${escapeHtml(query)}" target="_blank" rel="noreferrer">查看完整对比</a>
</div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

import type { ShareCardData } from "./share-data";
import { formatCny, formatTokens } from "./format";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildShareCardSvg(data: ShareCardData): string {
  const model = escapeXml(data.modelName);
  const provider = escapeXml(data.providerName);
  const monthlyTokens = formatTokens(data.inputTokens + data.outputTokens);
  const totalCost = formatCny(data.totalCost);
  const effectiveCost = formatCny(data.effectiveCostPerMillion);
  const cache = `${(data.cacheHitRate * 100).toFixed(0)}%`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#020617" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="70" r="190" fill="#2563eb" opacity="0.16"/>
  <circle cx="120" cy="590" r="220" fill="#7c3aed" opacity="0.14"/>
  <rect x="54" y="48" width="1092" height="534" rx="28" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.14)"/>
  <text x="88" y="106" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="24" font-weight="700" fill="#ffffff">token比比</text>
  <text x="208" y="106" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="16" fill="#bfdbfe">真实到手成本</text>
  <rect x="88" y="140" width="176" height="38" rx="19" fill="rgba(56,189,248,0.16)" stroke="#38bdf8"/>
  <text x="112" y="165" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="15" fill="#bae6fd">样例数据</text>
  <text x="88" y="248" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="56" font-weight="800" fill="#ffffff">${model}</text>
  <text x="90" y="290" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="22" fill="#cbd5e1">${provider} · ${monthlyTokens} tokens / 月</text>
  <rect x="88" y="342" width="460" height="146" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)" filter="url(#shadow)"/>
  <text x="116" y="382" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="16" fill="#bfdbfe">最低估算成本</text>
  <text x="116" y="446" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="44" font-weight="800" fill="url(#accent)">${totalCost}</text>
  <rect x="576" y="342" width="248" height="146" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)"/>
  <text x="602" y="382" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="16" fill="#bfdbfe">有效成本 / 1M</text>
  <text x="602" y="438" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${effectiveCost}</text>
  <rect x="852" y="342" width="248" height="146" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)"/>
  <text x="878" y="382" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="16" fill="#bfdbfe">缓存命中率</text>
  <text x="878" y="438" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${cache}</text>
  <line x1="88" y1="526" x2="1112" y2="526" stroke="rgba(255,255,255,0.14)"/>
  <text x="88" y="558" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="14" fill="#93c5fd">不要只看 token 单价，先看真实到手成本。</text>
  <text x="942" y="558" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="14" fill="#93c5fd">2026-10-22 · 样例数据</text>
  <text x="88" y="586" font-family="Noto Sans CJK SC, DejaVu Sans, sans-serif" font-size="12" fill="#64748b">实际价格、可用性和售后规则请以平台公示为准。</text>
</svg>`;
}

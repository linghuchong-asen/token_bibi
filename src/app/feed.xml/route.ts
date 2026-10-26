// 文件用途：价格变动 RSS 订阅（所属模块：src/app/feed.xml，Node 运行时）
// 把"最近价格变动"变成用户可以订阅的功能：RSS 阅读器、Discord/Telegram 机器人
// 都能直接消费。条目来自 data/price-changes.json（每日管线生成），
// 每条变动一个 item，链接回对应模型详情页。
// 为什么用 RSS：零账号、零基础设施、开放标准——实时性卖点的最低摩擦入口。
import { getModelById, priceChanges } from "@/data";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tokenbibi.example.com";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FIELD_LABELS: Record<string, string> = {
  inputPricePerMTokens: "输入价",
  outputPricePerMTokens: "输出价",
  cacheReadPricePerMTokens: "缓存价",
  billingMode: "计费方式",
  dataStatus: "核验状态",
};

const STATUS_LABELS: Record<string, string> = {
  verified: "已核验",
  pending_review: "待核验",
  sample: "样例",
};

function describeChange(field: string, from: unknown, to: unknown): string {
  const label = FIELD_LABELS[field] ?? field;
  if (field === "dataStatus") {
    return `${label} ${STATUS_LABELS[String(from)] ?? String(from)} → ${STATUS_LABELS[String(to)] ?? String(to)}`;
  }
  return `${label} ${String(from)} → ${String(to)}`;
}

export async function GET() {
  const generatedAt = new Date(priceChanges.generatedAt).toUTCString();
  const items = priceChanges.changes.slice(0, 50).map((change) => {
    const model = getModelById(change.modelId);
    const link = model ? `${SITE_URL}/models/${model.slug}` : `${SITE_URL}/data-status`;
    const detail = change.changes
      .map((diff) => describeChange(diff.field, diff.from, diff.to))
      .join("；");
    const title = `${model?.name ?? change.modelId}：${detail}`;
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(`price-change-${change.priceId}-${priceChanges.generatedAt}`)}</guid>
      <pubDate>${generatedAt}</pubDate>
      <description>${escapeXml(`token比比 检测到 ${change.providerId} 的价格与上一个快照存在差异：${detail}。数据截至 ${priceChanges.generatedAt}。`)}</description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>token比比 · AI 模型价格变动</title>
    <link>${SITE_URL}/data-status</link>
    <description>AI 模型各平台价格的每日变动记录，全部经过公开来源复核。订阅即可在价格调整时第一时间知道。</description>
    <language>zh-CN</language>
    <lastBuildDate>${generatedAt}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
  });
}

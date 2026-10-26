// 文件用途：分享结果落地页（所属模块：src/app/share，动态渲染）
// 分享结论同样遵循"默认只看已核验"：复用 resolveShareData（已核验优先），
// 并把真实核验状态与数据日期展示在卡片上——与 PNG 卡/嵌入卡同一套口径，
// 不允许任何分享面出现硬编码的日期或状态。
import Link from "next/link";
import { getModelBySlug } from "@/data";
import { resolveShareData, shareDataDate, shareStatusLabel } from "@/lib/share-data";
import { formatCny, formatTokens } from "@/lib/format";
import { CopyButton } from "@/components/CopyButton";

export const metadata = { title: "分享结果" };

export default async function SharePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const slug = typeof params.model === "string" ? params.model : "gpt-5-6-sol";
  const input = typeof params.input === "string" ? Number(params.input) : 10_000_000;
  const output = typeof params.output === "string" ? Number(params.output) : 5_000_000;
  const cache = typeof params.cache === "string" ? Number(params.cache) : 0.2;
  const model = getModelBySlug(slug);
  const share = resolveShareData(slug, input, output, cache);
  const estimate = share;
  const shareQuery = `model=${encodeURIComponent(slug)}&input=${input}&output=${output}&cache=${cache}`;
  const statusLabel = share ? shareStatusLabel(share) : "暂无数据";

  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>分享结果</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>分享你的真实成本结论</h1>
          <p>分享卡片在脱离正文时也能看懂。</p>
        </div>
      </div>

      <section className="share-card">
        <div className="badge-row">
          <span className="badge" style={{ background: "rgba(255,255,255,.14)", borderColor: "rgba(255,255,255,.2)", color: "#dbeafe" }}>token比比</span>
          <span className="small" style={{ color: "#bfdbfe" }}>真实到手成本</span>
        </div>
        <h2 style={{ fontSize: 34, margin: "18px 0 8px" }}>{model?.name ?? "未知模型"}</h2>
        <p style={{ color: "#bfdbfe", marginTop: 0 }}>{share?.providerName ?? "暂无平台数据"} · {formatTokens(input + output)} tokens / 月</p>
        <div className="stat-row" style={{ marginTop: 24 }}>
          <div><div className="small" style={{ color: "#bfdbfe" }}>最低估算成本</div><strong style={{ fontSize: 30 }}>{estimate ? formatCny(estimate.totalCost) : "—"}</strong></div>
          <div><div className="small" style={{ color: "#bfdbfe" }}>有效成本 / 1M</div><strong style={{ fontSize: 30 }}>{estimate ? formatCny(estimate.effectiveCostPerMillion) : "—"}</strong></div>
          <div><div className="small" style={{ color: "#bfdbfe" }}>缓存命中率</div><strong style={{ fontSize: 30 }}>{(cache * 100).toFixed(0)}%</strong></div>
        </div>
        <p className="small" style={{ color: "#93c5fd", marginBottom: 0 }}>
          数据截至 {share ? shareDataDate(share) : "—"} · {statusLabel} · 实际价格以平台公示为准
        </p>
      </section>

      <section className="section card card-pad stack">
        <div className="section-heading" style={{ marginBottom: 0 }}>
          <div><h2 style={{ margin: 0 }}>分享卡片预览</h2><p>可下载 PNG，直接发到群聊、社区或文档。</p></div>
          <a href={`/api/share-card?${shareQuery}&download=1`} className="button button-primary">下载 PNG</a>
        </div>
        <img src={`/api/share-card?${shareQuery}`} alt={`${model?.name ?? "模型"} 真实成本分享卡片`} style={{ width: "100%", borderRadius: 16, border: "1px solid var(--line)" }} />
      </section>

      <section className="section card card-pad stack">
        <h2 style={{ margin: 0 }}>分享方式</h2>
        <div className="toolbar">
          <CopyButton value={`/share?${shareQuery}`} label="复制分享链接" />
          <Link href={`/calculator?${shareQuery}`} className="button">回到计算器</Link>
        </div>
        <div className="note">嵌入代码：<code>{`<iframe src="/api/embed-card?${shareQuery}" width="540" height="330" style="border:0"></iframe>`}</code></div>
      </section>
    </main>
  );
}

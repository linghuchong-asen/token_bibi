// 文件用途：数据状态页（所属模块：src/app/data-status，静态生成）
// 面向用户公开：①全站价格新鲜度水位；②分平台核验统计；
// ③最近一次基线对比发现的价格变动（实时性的直接证据）；
// ④核验方法说明。这是"真实性/实时性"的对外承诺页面。
import Link from "next/link";
import { priceChanges, prices, providers } from "@/data";
import { priceFreshness, freshnessSummary } from "@/lib/freshness";
import { formatDate } from "@/lib/format";
import { FreshnessBanner } from "@/components/FreshnessBanner";
import { ProviderTypeBadge } from "@/components/Badges";

export const metadata = { title: "数据状态与新鲜度" };

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

// 把单条变动翻译成人话：价格字段给数字对比，状态字段给状态名对比。
function describeChange(field: string, from: unknown, to: unknown): string {
  const label = FIELD_LABELS[field] ?? field;
  if (field === "dataStatus") {
    return `核验状态 ${STATUS_LABELS[String(from)] ?? String(from)} → ${STATUS_LABELS[String(to)] ?? String(to)}`;
  }
  return `${label} ${String(from)} → ${String(to)}`;
}

export default function DataStatusPage() {
  const summary = freshnessSummary(prices);

  // 分平台统计：平台名、类型、价格数、已核验数、最近核验时间、该平台整体新鲜度。
  const rows = providers.map((provider) => {
    const providerPrices = prices.filter((price) => price.providerId === provider.id);
    const providerSummary = freshnessSummary(providerPrices);
    return { provider, providerPrices, providerSummary };
  });

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>数据状态</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>数据状态与新鲜度</h1>
      <p className="muted">价格数据的核验情况、新鲜度水位和最近变动，全部公开。</p>

      <section className="section stack">
        <FreshnessBanner prices={prices} />
        <div className="grid-3">
          <div className="metric">
            <div className="metric-label">已核验价格占比</div>
            <div className="metric-value">{Math.round(summary.verifiedRatio * 100)}%</div>
            <div className="metric-note">{summary.verified} / {summary.total} 条价格记录</div>
          </div>
          <div className="metric">
            <div className="metric-label">最近一次来源核对</div>
            <div className="metric-value" style={{ fontSize: 22 }}>{summary.newestVerifiedAt ? formatDate(summary.newestVerifiedAt) : "—"}</div>
            <div className="metric-note">每日自动采集并复核公开来源</div>
          </div>
          <div className="metric">
            <div className="metric-label">本次基线对比发现的变动</div>
            <div className="metric-value">{priceChanges.changedCount}</div>
            <div className="metric-note">基线快照 {priceChanges.baseline.slice(0, 16).replace("T", " ")}</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>最近价格变动</h2>
            <p>与基线快照逐字段对比的结果。源站改价、模型下架、核验状态变化都会留痕。</p>
          </div>
        </div>
        {priceChanges.changes.length === 0 ? (
          <div className="empty">本次对比未发现价格变动。</div>
        ) : (
          <div className="card card-pad stack">
            {priceChanges.changes.map((entry) => (
              <div key={entry.priceId} className="small">
                <strong>{entry.providerId} / {entry.modelId}</strong>
                <div className="muted" style={{ marginTop: 2 }}>
                  {entry.changes.map((change) => describeChange(change.field, change.from, change.to)).join("；")}
                </div>
              </div>
            ))}
            <div className="small muted">检测时间：{formatDate(priceChanges.generatedAt)}</div>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>分平台核验统计</h2>
            <p>每个平台的价格数、已核验数与最近核对时间。</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>平台</th>
                <th>类型</th>
                <th className="num">价格数</th>
                <th className="num">已核验</th>
                <th>最近核验时间</th>
                <th>新鲜度</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ provider, providerPrices, providerSummary }) => (
                <tr key={provider.id}>
                  <td><a href={`/providers/${provider.slug}`} className="strong">{provider.name}</a></td>
                  <td><ProviderTypeBadge type={provider.type} /></td>
                  <td className="num">{providerPrices.length}</td>
                  <td className="num">{providerSummary.verified}</td>
                  <td className="small">{providerSummary.newestVerifiedAt ? formatDate(providerSummary.newestVerifiedAt) : "未核验"}</td>
                  <td className="small">
                    {providerSummary.staleCount > 0 ? (
                      <span className="badge badge-red">{providerSummary.staleCount} 条过期</span>
                    ) : providerSummary.agingCount > 0 ? (
                      <span className="badge badge-amber">{providerSummary.agingCount} 条待复核</span>
                    ) : (
                      <span className="badge badge-green">新鲜</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section card card-pad stack">
        <h2 style={{ marginTop: 0 }}>核验方法说明</h2>
        <div className="stack">
          <div className="note">来源复核（source_check）：脚本重新抓取平台公开定价页 / API，输入价、输出价、缓存价逐字段一致才标记已核验。每日自动执行。</div>
          <div className="note">人工核验（manual）：运营在管理后台逐条确认，记录核验人与时间。</div>
          <div className="warning">已核验不等于永久有效：源站价格随时可能调整，系统发现源站与库内不一致时会自动撤销核验徽章（降级为待核验）。</div>
          <div className="note">收录以可核验数据为准：平台官方不再提供的价格（如下架模型）会被移除或降级并留痕，不保留任何无来源的演示数据。</div>
        </div>
      </section>
    </main>
  );
}

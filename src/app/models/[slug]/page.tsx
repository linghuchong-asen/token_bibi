import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelBySlug, getPricesForModel, getProviderById, models, plans } from "@/data";
import type { EnrichedPrice } from "@/data/types";
import { enrichPrices } from "@/lib/enrich";
import { formatCny, formatDate, formatTokens } from "@/lib/format";
import { commonVerificationMethod, priceStatusNote, summarizeDataStatus } from "@/lib/data-status";
import { estimateSubscriptionPlan } from "@/lib/pricing";
import { PriceTable } from "@/components/PriceTable";
import { DataStatusBadge } from "@/components/Badges";

export function generateStaticParams() {
  return models.map((model) => ({ slug: model.slug }));
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const modelPrices = enrichPrices(getPricesForModel(model.id));
  const verifiedModelPrices = modelPrices.filter((price) => price.dataStatus === "verified");
  const pricePool = verifiedModelPrices.length > 0 ? verifiedModelPrices : modelPrices;
  const cheapest = [...pricePool].sort((a, b) => a.effectiveInputPrice - b.effectiveInputPrice)[0];
  const samplePriceCount = modelPrices.filter((price) => price.dataStatus === "sample").length;
  const latestVerifiedAt = verifiedModelPrices.length > 0
    ? verifiedModelPrices.map((price) => price.lastVerifiedAt).sort().at(-1)
    : cheapest?.lastVerifiedAt;
  const priceStatus = summarizeDataStatus(modelPrices);
  const verificationMethod = commonVerificationMethod(modelPrices);
  const relatedPlans = plans.filter((plan) => plan.modelScope.includes("*") || plan.modelScope.includes(model.id));

  return (
    <main className="page-shell">
      <div className="breadcrumbs">
        <Link href="/">首页</Link><span>/</span><Link href="/models">模型比价</Link><span>/</span><span>{model.name}</span>
      </div>

      <section className="card card-pad">
        <div className="split">
          <div>
            <div className="badge-row">
              <span className="badge">{model.vendor}</span>
              <DataStatusBadge status={priceStatus} method={verificationMethod} />
            </div>
            <h1 style={{ margin: "14px 0 8px", fontSize: 38, letterSpacing: "-0.03em" }}>{model.name}</h1>
            <p className="muted" style={{ marginTop: 0 }}>{model.capabilities.join(" · ")}</p>
            <div className="badge-row">
              {model.capabilities.map((capability) => <span key={capability} className="badge badge-neutral">{capability}</span>)}
            </div>
          </div>
          <div className="grid-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="metric">
              <div className="metric-label">最低有效输入价</div>
              <div className="metric-value">{cheapest ? formatCny(cheapest.effectiveInputPrice, 3) : "—"}</div>
              <div className="metric-note">{cheapest ? `${cheapest.provider.name}${verifiedModelPrices.length > 0 ? " · 已核验最低价" : " · 样例最低价"}` : "暂无数据"}</div>
            </div>
            <div className="metric">
              <div className="metric-label">上下文长度</div>
              <div className="metric-value">{formatTokens(model.contextLength)}</div>
              <div className="metric-note">发布日期 {model.releaseDate}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>平台比价</h2>
            <p>有效成本 = 标价 × 充值系数 × 模型倍率 × 分组倍率。</p>
          </div>
          <Link href={`/calculator?model=${model.id}`} className="button button-primary">计算这个模型</Link>
        </div>
        {samplePriceCount > 0 && (
          <div className="warning" role="note" style={{ marginBottom: 12 }}>
            该模型还包含 {samplePriceCount} 条样例价格，未计入“已核验最低价”。样例价格仅用于演示，请勿作为采购依据。
          </div>
        )}
        <div className="card card-pad">
          <PriceTable rows={modelPrices} />
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>可搭配的订阅套餐</h2>
            <p>订阅是否划算取决于你的月用量，而不是套餐折扣本身。</p>
          </div>
          <Link href="/subscriptions" className="button button-small">查看全部套餐</Link>
        </div>
        <div className="grid-3">
          {relatedPlans.length === 0 ? <div className="empty">暂无覆盖该模型的订阅套餐。</div> : relatedPlans.map((plan) => {
            const provider = getProviderById(plan.providerId);
            const estimate = estimateSubscriptionPlan(plan, cheapest?.effectiveInputPrice);
            return (
              <article className="card card-pad" key={plan.id}>
                <div className="badge-row">
                  <span className="badge">{provider?.name ?? plan.providerId}</span>
                  <span className="badge badge-neutral">{plan.period === "month" ? "月付" : plan.period}</span>
                </div>
                <h3 style={{ margin: "14px 0 4px" }}>{plan.name}</h3>
                <div className="metric-value">{formatCny(estimate.monthlyPriceCny)}</div>
                <div className="stack small muted">
                  <span>额度：{plan.quota ? formatTokens(plan.quota) : "不限总额度"}</span>
                  <span>重置：{plan.resetCycle}</span>
                  <span>超额：{plan.overageRule}</span>
                  <span>破局点：{estimate.breakEvenTokens ? formatTokens(estimate.breakEvenTokens) : "无法计算"}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>数据说明</h2>
        <p className="muted">{priceStatusNote(modelPrices)} 实际价格请以平台公开页面为准。</p>
        {latestVerifiedAt && <p className="small muted">{verifiedModelPrices.length > 0 ? "已核验价格最近复核" : "最近更新"}：{formatDate(latestVerifiedAt)}</p>}
      </section>
    </main>
  );
}

import Link from "next/link";
import { getModelById, getProviderById, plans, prices } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { formatCny, formatTokens } from "@/lib/format";
import { estimateSubscriptionPlan } from "@/lib/pricing";
import { DataStatusBadge } from "@/components/Badges";

export const metadata = { title: "订阅套餐" };

export default function SubscriptionsPage() {
  const enriched = enrichPrices(prices);
  const cheapestByModel = new Map<string, number>();
  for (const price of enriched) {
    const current = cheapestByModel.get(price.modelId);
    if (current === undefined || price.effectiveInputPrice < current) cheapestByModel.set(price.modelId, price.effectiveInputPrice);
  }

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>订阅套餐</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>订阅套餐</h1>
          <p>不要只看月费，先看额度、重置周期、模型范围和破局点。</p>
        </div>
        <Link href="/calculator" className="button button-primary">用用量计算</Link>
      </div>

      <div className="grid-3">
        {plans.map((plan) => {
          const provider = getProviderById(plan.providerId);
          const effectivePayg = plan.modelScope.includes("*")
            ? Math.min(...Array.from(cheapestByModel.values()))
            : Math.min(...plan.modelScope.map((id) => cheapestByModel.get(id) ?? Infinity));
          const estimate = estimateSubscriptionPlan(plan, Number.isFinite(effectivePayg) ? effectivePayg : undefined);
          return (
            <article className="card card-pad stack" key={plan.id}>
              <div className="badge-row">
                <span className="badge">{provider?.name ?? plan.providerId}</span>
                <DataStatusBadge status={plan.dataStatus} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{plan.name}</h2>
                <div className="metric-value">{formatCny(estimate.monthlyPriceCny)}<span className="small muted"> / 月</span></div>
              </div>
              <div className="stack small">
                <div><span className="muted">额度：</span>{plan.quota ? `${formatTokens(plan.quota)} ${plan.quotaUnit}` : "不限总额度"}</div>
                <div><span className="muted">重置：</span>{resetLabel(plan.resetCycle)}</div>
                <div><span className="muted">模型：</span>{plan.modelScope.includes("*") ? "全部收录模型" : plan.modelScope.map((id) => getModelById(id)?.name ?? id).join(" / ")}</div>
                <div><span className="muted">超额：</span>{plan.overageRule}</div>
                <div><span className="muted">购买上限：</span>{plan.purchaseLimit ?? "不限"}</div>
              </div>
              <div className="calc-result" style={{ padding: 14 }}>
                <span className="small muted">订阅 vs 按量破局点</span>
                <strong style={{ fontSize: 18 }}>{estimate.breakEvenTokens ? formatTokens(estimate.breakEvenTokens) : "无法计算"}</strong>
                <span className="small muted">每 1M tokens 折算成本：{estimate.effectivePerMillion ? formatCny(estimate.effectivePerMillion) : "—"}</span>
              </div>
              <a href={plan.sourceUrl} target="_blank" rel="noreferrer" className="button">查看来源</a>
            </article>
          );
        })}
      </div>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>订阅页要重点看什么？</h2>
        <div className="grid-3">
          <div className="note">额度是否按月重置，还是会累计。</div>
          <div className="warning">“不限额度”不等于无限制，仍受模型、并发和分组规则约束。</div>
          <div className="danger">年付折扣看起来更低，但要先确认退款和降级规则。</div>
        </div>
      </section>
    </main>
  );
}

function resetLabel(value: string) {
  if (value === "monthly") return "每月";
  if (value === "weekly") return "每周";
  if (value === "daily") return "每日";
  if (value === "none") return "不重置";
  return value;
}

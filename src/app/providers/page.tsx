import Link from "next/link";
import { getCardKeyRule, getPricesForProvider, getRechargeRule, plans, providers } from "@/data";
import { DataStatusBadge, ProviderTypeBadge } from "@/components/Badges";
import { formatCny } from "@/lib/format";
import { applyModifiers } from "@/lib/pricing";

export const metadata = { title: "平台比价" };

export default function ProvidersPage() {
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><span>首页</span><span>/</span><span>平台比价</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>平台比价</h1>
          <p>官方 API、聚合平台与中转平台的规则差异；每条价格标注核验状态与来源。</p>
        </div>
      </div>
      <div className="grid-3">
        {providers.map((provider) => {
          const prices = getPricesForProvider(provider.id);
          const recharge = getRechargeRule(provider.id);
          const cardKey = getCardKeyRule(provider.id);
          const planCount = plans.filter((plan) => plan.providerId === provider.id).length;
          const lowest = prices.length
            ? Math.min(...prices.map((price) => applyModifiers(price).effectiveInputPrice))
            : null;
          return (
            <article className="card card-pad stack" key={provider.id}>
              <div className="badge-row">
                <ProviderTypeBadge type={provider.type} />
                <DataStatusBadge status={provider.dataStatus} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{provider.name}</h2>
                <p className="muted" style={{ margin: "8px 0 0" }}>{provider.summary}</p>
              </div>
              <div className="stat-row small">
                <div><span className="muted">最低有效输入价</span><br /><strong>{lowest === null ? "—" : formatCny(lowest, 3)}</strong></div>
                <div><span className="muted">充值规则</span><br /><strong>{recharge?.rechargeRatio ?? "未提供"}</strong></div>
                <div><span className="muted">订阅套餐</span><br /><strong>{planCount > 0 ? planCount + " 个" : "待核验"}</strong></div>
              </div>
              <div className="badge-row">
                {provider.riskLabels.map((label) => <span className="badge badge-amber" key={label}>{label}</span>)}
                {cardKey?.supported && <span className="badge badge-green">支持兑换码</span>}
              </div>
              <Link href={`/providers/${provider.slug}`} className="button">查看平台详情</Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}

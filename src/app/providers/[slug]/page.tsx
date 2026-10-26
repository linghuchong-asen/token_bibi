// 文件用途：平台详情页（所属模块：src/app/providers/[slug]，静态生成）
// 展示平台的充值规则、风险与来源、模型价格与订阅套餐；出站"访问官网"链接
// 经 commercial 助手处理：配置了 affiliateUrl 的平台自动切换推广链接并披露。
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardKeyRule, getModelById, getPlansForProvider, getPricesForProvider, getProviderBySlug, getRechargeRule, providers } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { formatCny, formatDate } from "@/lib/format";
import { estimateSubscriptionPlan } from "@/lib/pricing";
import { hasAffiliateRelation, providerOutboundRel, providerOutboundUrl } from "@/lib/commercial";
import { PriceTable } from "@/components/PriceTable";
import { DataStatusBadge, ProviderTypeBadge } from "@/components/Badges";

export function generateStaticParams() {
  return providers.map((provider) => ({ slug: provider.slug }));
}

export default async function ProviderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) notFound();

  const recharge = getRechargeRule(provider.id);
  const cardKey = getCardKeyRule(provider.id);
  const providerPrices = enrichPrices(getPricesForProvider(provider.id));
  const providerPlans = getPlansForProvider(provider.id);

  return (
    <main className="page-shell">
      <div className="breadcrumbs">
        <Link href="/">首页</Link><span>/</span><Link href="/providers">平台比价</Link><span>/</span><span>{provider.name}</span>
      </div>

      <section className="card card-pad">
        <div className="badge-row">
          <ProviderTypeBadge type={provider.type} />
          <DataStatusBadge status={provider.dataStatus} />
          {provider.commercialRelation !== "none" && <span className="badge badge-amber">{provider.commercialRelation}</span>}
        </div>
        <h1 style={{ margin: "14px 0 8px", fontSize: 38, letterSpacing: "-0.03em" }}>{provider.name}</h1>
        <p className="muted" style={{ marginTop: 0 }}>{provider.summary}</p>
        <div className="hero-actions">
          {/* 出站链接统一走 commercial 助手：配置了 affiliateUrl 的平台自动切换
              推广链接并带 rel="sponsored"，同时下方出现披露声明 */}
          <a href={providerOutboundUrl(provider)} target="_blank" rel={providerOutboundRel(provider)} className="button button-primary">访问官网</a>
          {provider.pricingUrl && <a href={provider.pricingUrl} target="_blank" rel="noreferrer" className="button">查看价格页</a>}
          {provider.monitorUrl && <a href={provider.monitorUrl} target="_blank" rel="noreferrer" className="button">监测页</a>}
        </div>
        {hasAffiliateRelation(provider) && (
          <p className="small muted" style={{ marginBottom: 0 }}>含推广链接：通过上面按钮注册或充值可能为本站带来返佣，不影响价格数据与排序。</p>
        )}
      </section>

      <section className="section split">
        <div className="card card-pad stack">
          <h2 style={{ margin: 0 }}>充值规则</h2>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                <tr><th>充值汇率</th><td>{recharge?.rechargeRatio ?? "未提供"}</td></tr>
                <tr><th>最低充值</th><td>{recharge?.minimumTopUp ?? "未提供"}</td></tr>
                <tr><th>折扣</th><td>{recharge?.discount ?? "未提供"}</td></tr>
                <tr><th>余额有效期</th><td>{recharge?.balanceExpiry ?? "未提供"}</td></tr>
                <tr><th>退款</th><td>{recharge?.refundable === null || recharge?.refundable === undefined ? "待核验" : recharge.refundable ? "支持" : "不支持"}</td></tr>
                <tr><th>支付方式</th><td>{provider.paymentMethods.join(" / ")}</td></tr>
                <tr><th>发票</th><td>{provider.invoiceSupport}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card card-pad stack">
          <h2 style={{ margin: 0 }}>风险与来源</h2>
          <div className="badge-row">
            {provider.riskLabels.map((label) => <span className="badge badge-amber" key={label}>{label}</span>)}
          </div>
          <div className="stack small">
            <div><strong>上游类型：</strong>{provider.upstreamType}</div>
            <div><strong>退款政策：</strong>{provider.refundPolicy}</div>
            <div><strong>最近更新：</strong>{formatDate(provider.updatedAt)}</div>
            <div><strong>卡密 / 兑换码：</strong>{cardKey?.supported ? "支持" : "未发现公开入口"}</div>
            {cardKey?.supported && <div><strong>使用规则：</strong>{cardKey.usageRule}</div>}
          </div>
          <div className="warning">收录不等于推荐。实际价格、可用性和售后规则请以平台公示为准。</div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><h2>模型价格</h2><p>该平台当前收录的价格，核验状态以每行标记为准。</p></div>
          <Link href="/models" className="button button-small">返回模型比价</Link>
        </div>
        <div className="card card-pad">
          <PriceTable rows={providerPrices} showModel />
        </div>
      </section>

      {providerPlans.length > 0 && (
        <section className="section">
          <div className="section-heading"><div><h2>订阅套餐</h2><p>该平台提供的订阅计划。</p></div></div>
          <div className="grid-3">
            {providerPlans.map((plan) => {
              const estimate = estimateSubscriptionPlan(plan);
              return (
                <article className="card card-pad" key={plan.id}>
                  <h3 style={{ marginTop: 0 }}>{plan.name}</h3>
                  <div className="metric-value">{formatCny(estimate.monthlyPriceCny)}</div>
                  <div className="stack small muted">
                    <span>额度：{plan.quota ? plan.quota.toLocaleString("zh-CN") : "不限总额度"}</span>
                    <span>模型：{plan.modelScope.includes("*") ? "全部" : plan.modelScope.map((id) => getModelById(id)?.name ?? id).join(" / ")}</span>
                    <span>超额：{plan.overageRule}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

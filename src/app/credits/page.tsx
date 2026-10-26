import Link from "next/link";
import { getProviderById, rechargeRules } from "@/data";
import { CreditCalculator } from "@/components/CreditCalculator";
import { formatDate } from "@/lib/format";

export const metadata = { title: "积分 / 充值" };

export default function CreditsPage() {
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>积分 / 充值</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>积分 / 点数 / credits</h1>
          <p>把内部额度、充值汇率和有效折扣换算成真实现金成本。</p>
        </div>
        <span className="badge badge-amber">样例数据</span>
      </div>

      <CreditCalculator rules={rechargeRules} />

      <section className="section card card-pad">
        <div className="section-heading"><div><h2>充值规则表</h2><p>不同平台的内部额度单位并不统一。</p></div></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>平台</th><th>充值汇率</th><th className="num">最低充值</th><th>余额有效期</th><th>退款</th><th>更新时间</th><th>来源</th></tr></thead>
            <tbody>
              {rechargeRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="strong">{getProviderById(rule.providerId)?.name ?? rule.providerId}</td>
                  <td>{rule.rechargeRatio}</td>
                  <td className="num">{rule.minimumTopUp ?? "—"}</td>
                  <td>{rule.balanceExpiry ?? "未提供"}</td>
                  <td>{rule.refundable === null ? "待核验" : rule.refundable ? "支持" : "不支持"}</td>
                  <td className="small">{formatDate(rule.lastVerifiedAt)}</td>
                  <td><a href={rule.sourceUrl} target="_blank" rel="noreferrer" className="small">查看来源</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section grid-3">
        <div className="note">标价低但充值汇率差，真实成本可能更高。</div>
        <div className="warning">最低充值门槛会放大试错成本。</div>
        <div className="danger">余额有效期和退款规则决定了这笔钱有多灵活。</div>
      </section>
    </main>
  );
}

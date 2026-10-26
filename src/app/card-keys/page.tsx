import Link from "next/link";
import { cardKeyRules, getProviderById } from "@/data";
import { formatDate } from "@/lib/format";
import { DataStatusBadge } from "@/components/Badges";

export const metadata = { title: "卡密 / 兑换码" };

export default function CardKeysPage() {
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>卡密 / 兑换码</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>卡密 / 兑换码 / 网卡</h1>
          <p>这是购买路径和风险维度，不直接参与价格倍率计算。</p>
        </div>
        <span className="badge badge-amber">样例数据</span>
      </div>

      <section className="card card-pad">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>平台</th><th>是否支持</th><th>使用规则</th><th>有效期</th><th>售后</th><th>风险等级</th><th>更新时间</th><th>来源</th></tr></thead>
            <tbody>
              {cardKeyRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="strong">{getProviderById(rule.providerId)?.name ?? rule.providerId}</td>
                  <td>{rule.supported ? <span className="badge badge-green">支持</span> : <span className="badge badge-neutral">不支持</span>}</td>
                  <td>{rule.usageRule}</td>
                  <td>{rule.validUntil ?? "—"}</td>
                  <td>{rule.supportChannel ?? "—"}</td>
                  <td><RiskBadge level={rule.riskLevel} /></td>
                  <td className="small">{formatDate(rule.lastVerifiedAt)}</td>
                  <td>{rule.sourceUrl ? <a href={rule.sourceUrl} target="_blank" rel="noreferrer" className="small">查看来源</a> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section grid-3">
        <div className="note">兑换码只是获取额度的一种路径，不等于折扣。</div>
        <div className="warning">购买前确认有效期、使用限制、退款和售后入口。</div>
        <div className="danger">不建议在不可核验渠道大额购买兑换码。</div>
      </section>
    </main>
  );
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" | "unknown" }) {
  if (level === "low") return <span className="badge badge-green">低</span>;
  if (level === "medium") return <span className="badge badge-amber">中</span>;
  if (level === "high") return <span className="badge badge-red">高</span>;
  return <span className="badge badge-neutral">未知</span>;
}

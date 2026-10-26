import type { EnrichedPrice } from "@/data/types";
import { formatCny, formatDate, formatTokens } from "@/lib/format";
import { BillingModeBadge, DataStatusBadge, ProviderTypeBadge } from "./Badges";

export function PriceTable({ rows, showModel = false }: { rows: EnrichedPrice[]; showModel?: boolean }) {
  if (rows.length === 0) {
    return <div className="empty">当前筛选下没有价格数据。</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {showModel && <th>模型</th>}
            <th>平台</th>
            <th>类型</th>
            <th>计费方式</th>
            <th className="num">输入价 / 1M</th>
            <th className="num">输出价 / 1M</th>
            <th className="num">有效输入价</th>
            <th>数据状态</th>
            <th>更新时间</th>
            <th>来源</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((price) => (
            <tr key={price.id}>
              {showModel && (
                <td>
                  <a href={`/models/${price.model.slug}`} className="strong">{price.model.name}</a>
                  <div className="small muted">{price.model.vendor}</div>
                </td>
              )}
              <td>
                <a href={`/providers/${price.provider.slug}`} className="strong">{price.provider.name}</a>
                <div className="small muted">{formatTokens(price.model.contextLength)} 上下文</div>
              </td>
              <td><ProviderTypeBadge type={price.provider.type} /></td>
              <td><BillingModeBadge mode={price.billingMode} /></td>
              <td className="num">{formatCny(price.inputPricePerMTokens, 3)}</td>
              <td className="num">{formatCny(price.outputPricePerMTokens, 3)}</td>
              <td className="num strong">{formatCny(price.effectiveInputPrice, 3)}</td>
              <td><DataStatusBadge status={price.dataStatus} method={price.verificationMethod} /></td>
              <td className="small">{formatDate(price.lastVerifiedAt)}</td>
              <td><a href={price.sourceUrl} target="_blank" rel="noreferrer" className="small">查看来源</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

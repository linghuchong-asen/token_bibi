// 文件用途：价格对比表（所属模块：src/components，服务端组件）
// 展示每条价格的来源平台、计费方式、单价、核验状态与更新时间；
// 更新时间超过 7 天的记录就地标红并提示"以源站为准"——过期数据不允许
// 无声无息地混在新鲜数据里（真实性承诺的最后一道 UI 防线）。
import type { EnrichedPrice } from "@/data/types";
import { formatCny, formatDate, formatTokens } from "@/lib/format";
import { priceFreshness } from "@/lib/freshness";
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
          {rows.map((price) => {
            const freshness = priceFreshness(price);
            return (
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
                <td className="small">
                  {/* 过期预警：3-7 天琥珀提示复核，超 7 天红色并要求以源站为准 */}
                  <span style={{ color: freshness === "stale" ? "var(--red)" : freshness === "aging" ? "var(--amber)" : undefined }}>
                    {formatDate(price.lastVerifiedAt)}
                  </span>
                  {freshness === "stale" && <div style={{ color: "var(--red)" }}>已过期，请以源站为准</div>}
                  {freshness === "aging" && <div style={{ color: "var(--amber)" }}>临近过期</div>}
                </td>
                <td><a href={price.sourceUrl} target="_blank" rel="noreferrer" className="small">查看来源</a></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

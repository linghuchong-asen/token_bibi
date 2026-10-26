// 文件用途：数据新鲜度横幅（所属模块：src/components，服务端组件）
// 在首页与 /models 顶部声明"数据截至时间、已核验占比、过期条数"，
// 把真实性/实时性从幕后管线变成用户第一眼能看到的东西。
// 配色随新鲜度水位变化：good 蓝色 / warning 琥珀 / stale 红色。
import Link from "next/link";
import type { Price } from "@/data/types";
import { freshnessSummary } from "@/lib/freshness";
import { formatDate } from "@/lib/format";

export function FreshnessBanner({ prices }: { prices: Price[] }) {
  const summary = freshnessSummary(prices);
  const className = summary.level === "stale" ? "danger" : summary.level === "warning" ? "warning" : "note";
  const ratioText = `${Math.round(summary.verifiedRatio * 100)}%`;

  return (
    <div className={className} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
      <span>
        <strong>数据状态：</strong>
        {summary.newestVerifiedAt
          ? `已核验价格最近于 ${formatDate(summary.newestVerifiedAt)} 与公开来源核对一致`
          : "暂无已核验价格"}
        {` · 已核验 ${summary.verified}/${summary.total} 条（${ratioText}）`}
        {summary.agingCount > 0 ? ` · ${summary.agingCount} 条超过 3 天未复核` : ""}
        {summary.staleCount > 0 ? ` · ${summary.staleCount} 条已过期，请以源站为准` : ""}
      </span>
      <Link href="/data-status" className="small" style={{ fontWeight: 700 }}>
        查看数据状态 →
      </Link>
    </div>
  );
}

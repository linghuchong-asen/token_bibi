"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BillingMode, EnrichedPrice, ProviderType } from "@/data/types";
import { formatCny, formatDate, formatTokens } from "@/lib/format";
import { queryPrices, type PriceSort } from "@/lib/filtering";
import { BillingModeBadge, DataStatusBadge, billingLabel } from "./Badges";

const billingOptions: { value: "all" | BillingMode; label: string }[] = [
  { value: "all", label: "全部计费方式" },
  { value: "pay_as_you_go", label: "按量" },
  { value: "credit", label: "积分 / 额度" },
  { value: "subscription", label: "订阅" },
  { value: "fixed", label: "固定价" },
  { value: "per_request", label: "按次" },
];

const typeOptions: { value: "all" | ProviderType; label: string }[] = [
  { value: "all", label: "全部平台类型" },
  { value: "official_api", label: "官方 API" },
  { value: "aggregator", label: "聚合平台" },
  { value: "relay", label: "中转平台" },
  { value: "new_api_instance", label: "New API 实例" },
];

export function ModelsExplorer({ rows }: { rows: EnrichedPrice[] }) {
  const [query, setQuery] = useState("");
  const [billing, setBilling] = useState<"all" | BillingMode>("all");
  const [providerType, setProviderType] = useState<"all" | ProviderType>("all");
  const [sort, setSort] = useState<PriceSort>("effective-input");
  const [dataStatus, setDataStatus] = useState<"all" | "verified">(rows.some((row) => row.dataStatus === "verified") ? "verified" : "all");

  const sampleCount = rows.filter((row) => row.dataStatus === "sample").length;

  const filtered = useMemo(
    () => queryPrices(rows, { query, billing, providerType, dataStatus }, sort),
    [rows, query, billing, providerType, dataStatus, sort],
  );

  return (
    <div className="sidebar-layout">
      <aside className="card card-pad filter-card stack">
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>筛选</h2>
          <p className="small muted" style={{ margin: "6px 0 0" }}>默认只比较已核验价格，按有效输入价排序</p>
        </div>
        <div className="field">
          <label htmlFor="model-search">搜索</label>
          <input id="model-search" className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="模型、厂商、平台" />
        </div>
        <div className="field">
          <label htmlFor="billing-filter">计费方式</label>
          <select id="billing-filter" className="select" value={billing} onChange={(event) => setBilling(event.target.value as "all" | BillingMode)}>
            {billingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="provider-filter">平台类型</label>
          <select id="provider-filter" className="select" value={providerType} onChange={(event) => setProviderType(event.target.value as "all" | ProviderType)}>
            {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status-filter">数据范围</label>
          <select id="status-filter" className="select" value={dataStatus} onChange={(event) => setDataStatus(event.target.value as "all" | "verified")}>
            <option value="verified">仅已核验价格</option>
            <option value="all">全部价格（含样例）</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort-filter">排序</label>
          <select id="sort-filter" className="select" value={sort} onChange={(event) => setSort(event.target.value as PriceSort)}>
            <option value="effective-input">有效输入价：从低到高</option>
            <option value="effective-output">有效输出价：从低到高</option>
            <option value="stability">稳定性：从高到低</option>
            <option value="name">模型名称</option>
          </select>
        </div>
        <div className="note">广告与商业合作不会改变默认排序。</div>
      </aside>

      <section className="card card-pad">
        <div className="section-heading">
          <div>
            <h2 style={{ margin: 0 }}>模型比价</h2>
            <p>共 {filtered.length} 条结果 · {dataStatus === "verified" ? "仅显示已核验价格" : "包含样例价格，请留意每行状态"}</p>
          </div>
          <span className="badge">{billing === "all" ? "全部计费" : billingLabel(billing)}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty">没有符合条件的结果，试试清空搜索或切换筛选。</div>
        ) : (
          <>
            {dataStatus === "all" && sampleCount > 0 && (
              <div className="warning" role="note" style={{ marginBottom: 12 }}>
                当前列表包含 {sampleCount} 条样例价格。样例价格只用于演示产品结构，不应当作采购报价；请优先比较标记为“已核验”的记录。
              </div>
            )}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>模型</th>
                  <th>平台</th>
                  <th>计费方式</th>
                  <th className="num">输入价</th>
                  <th className="num">输出价</th>
                  <th className="num">有效输入价</th>
                  <th>稳定性</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/models/${row.model.slug}`} className="strong">{row.model.name}</Link>
                      <div className="small muted">{row.model.vendor} · {formatTokens(row.model.contextLength)}</div>
                    </td>
                    <td>
                      <Link href={`/providers/${row.provider.slug}`} className="strong">{row.provider.name}</Link>
                      <div className="small muted">{providerTypeLabel(row.provider.type)}</div>
                    </td>
                    <td><BillingModeBadge mode={row.billingMode} /></td>
                    <td className="num">{formatCny(row.inputPricePerMTokens, 3)}</td>
                    <td className="num">{formatCny(row.outputPricePerMTokens, 3)}</td>
                    <td className="num strong">{formatCny(row.effectiveInputPrice, 3)}</td>
                    <td><span className={row.stabilityScore && row.stabilityScore >= 95 ? "badge badge-green" : "badge badge-neutral"}>{row.stabilityScore ?? "—"}</span></td>
                    <td><DataStatusBadge status={row.dataStatus} method={row.verificationMethod} /></td>
                    <td className="small">{formatDate(row.lastVerifiedAt)}</td>
                    <td><Link href={`/models/${row.model.slug}`} className="button button-small">详情</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </div>
  );
}

function providerTypeLabel(type: ProviderType) {
  if (type === "official_api") return "官方 API";
  if (type === "aggregator") return "聚合平台";
  if (type === "relay") return "中转平台";
  return "New API 实例";
}

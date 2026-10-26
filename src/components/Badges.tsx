import type { BillingMode, DataStatus, ProviderType, VerificationMethod } from "@/data/types";

const providerLabels: Record<ProviderType, string> = {
  official_api: "官方 API",
  aggregator: "聚合平台",
  relay: "中转平台",
  new_api_instance: "New API 实例",
};

const billingLabels: Record<BillingMode, string> = {
  pay_as_you_go: "按量",
  subscription: "订阅",
  credit: "积分 / 额度",
  fixed: "固定价",
  per_request: "按次",
};

export function ProviderTypeBadge({ type }: { type: ProviderType }) {
  return <span className="badge badge-neutral">{providerLabels[type]}</span>;
}

export function BillingModeBadge({ mode }: { mode: BillingMode }) {
  return <span className="badge">{billingLabels[mode]}</span>;
}

export function DataStatusBadge({ status, method }: { status: DataStatus; method?: VerificationMethod | null }) {
  if (status === "verified") {
    const suffix = method === "source_check" ? " · 来源复核" : method === "manual" ? " · 人工" : "";
    return <span className="badge badge-green" title={method === "source_check" ? "已通过公开来源自动复核" : method === "manual" ? "已人工核验" : undefined}>已核验{suffix}</span>;
  }
  if (status === "pending_review") return <span className="badge badge-amber">待核验</span>;
  return <span className="badge badge-amber">样例数据</span>;
}

export function billingLabel(mode: BillingMode): string {
  return billingLabels[mode];
}

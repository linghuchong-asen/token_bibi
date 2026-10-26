"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EnrichedPrice, Model, Provider, SubscriptionPlan } from "@/data/types";
import { estimatePlanUsageCost, estimateSubscriptionPlan, estimateUsageCost, favorableBillingMode } from "@/lib/pricing";
import { formatCny, formatTokens } from "@/lib/format";

type Props = {
  models: Model[];
  providers: Provider[];
  prices: EnrichedPrice[];
  plans: SubscriptionPlan[];
  initialModelId?: string;
};

export function CalculatorClient({ models, providers, prices, plans, initialModelId }: Props) {
  const [modelId, setModelId] = useState(initialModelId || models[0]?.id || "");
  const [inputTokens, setInputTokens] = useState(10_000_000);
  const [outputTokens, setOutputTokens] = useState(5_000_000);
  const [cacheHitRate, setCacheHitRate] = useState(0.2);
  const [copied, setCopied] = useState(false);

  const modelPrices = useMemo(() => prices.filter((price) => price.modelId === modelId), [prices, modelId]);
  const [providerId, setProviderId] = useState(modelPrices[0]?.providerId ?? providers[0]?.id ?? "");
  const activePrice = modelPrices.find((price) => price.providerId === providerId) ?? modelPrices[0];
  const activeModel = models.find((model) => model.id === modelId);
  const activeProvider = providers.find((provider) => provider.id === providerId);

  const payg = activePrice
    ? estimateUsageCost(activePrice, inputTokens, outputTokens, cacheHitRate)
    : null;
  const totalTokens = inputTokens + outputTokens;
  const applicablePlans = plans.filter((plan) => {
    if (!activeModel) return false;
    return plan.modelScope.includes("*") || plan.modelScope.includes(activeModel.id);
  });
  const planOptions = applicablePlans.map((plan) => ({
    plan,
    estimate: estimateSubscriptionPlan(plan, payg?.effectiveCostPerMillion),
    usageCost: payg ? estimatePlanUsageCost(plan, totalTokens, payg.effectiveCostPerMillion) : null,
  })).sort((a, b) => (a.usageCost ?? Infinity) - (b.usageCost ?? Infinity));
  const bestPlan = planOptions[0];
  const cheapestPrice = [...modelPrices].sort((a, b) => {
    const ac = estimateUsageCost(a, inputTokens, outputTokens, cacheHitRate).totalCost;
    const bc = estimateUsageCost(b, inputTokens, outputTokens, cacheHitRate).totalCost;
    return ac - bc;
  })[0];
  const cheapestEstimate = cheapestPrice ? estimateUsageCost(cheapestPrice, inputTokens, outputTokens, cacheHitRate) : null;
  const bestIsPlan = bestPlan?.usageCost !== null && bestPlan?.usageCost !== undefined && bestPlan.usageCost < (cheapestEstimate?.totalCost ?? Infinity);
  const recommended = bestIsPlan && bestPlan ? `订阅：${bestPlan.plan.name}` : cheapestPrice ? `${favorableBillingMode(cheapestPrice.billingMode)}：${cheapestPrice.provider.name}` : "暂无推荐";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/calculator?model=${modelId}&input=${inputTokens}&output=${outputTokens}&cache=${cacheHitRate}`
    : `/calculator?model=${modelId}`;

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function updateModel(nextModelId: string) {
    setModelId(nextModelId);
    const nextPrice = prices.find((price) => price.modelId === nextModelId);
    setProviderId(nextPrice?.providerId ?? providers[0]?.id ?? "");
  }

  return (
    <div className="split">
      <section className="card card-pad stack">
        <div>
          <h2 style={{ margin: 0 }}>输入参数</h2>
          <p className="muted" style={{ margin: "6px 0 0" }}>先用你的月用量和场景做一次真实成本估算。</p>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="calc-model">模型</label>
            <select id="calc-model" className="select" value={modelId} onChange={(event) => updateModel(event.target.value)}>
              {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="calc-provider">平台</label>
            <select id="calc-provider" className="select" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
              {modelPrices.map((price) => <option key={price.id} value={price.providerId}>{price.provider.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="calc-input">月输入 tokens</label>
            <input id="calc-input" className="input" type="number" min={0} step={100000} value={inputTokens} onChange={(event) => setInputTokens(Number(event.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="calc-output">月输出 tokens</label>
            <input id="calc-output" className="input" type="number" min={0} step={100000} value={outputTokens} onChange={(event) => setOutputTokens(Number(event.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="calc-cache">缓存命中率（0-1）</label>
            <input id="calc-cache" className="input" type="number" min={0} max={1} step={0.05} value={cacheHitRate} onChange={(event) => setCacheHitRate(Number(event.target.value))} />
          </div>
          <div className="field">
            <label>当前口径</label>
            <div className="note" style={{ minHeight: 44, display: "flex", alignItems: "center" }}>
              {activeProvider ? `${activeProvider.name} · ${activePrice?.billingMode ?? "—"}` : "请先选择平台"}
            </div>
          </div>
        </div>
        <div className="note">有效成本已经包含充值系数、模型倍率和分组倍率；订阅成本按套餐额度折算。</div>
      </section>

      <section className="card card-pad stack">
        <div className="section-heading" style={{ marginBottom: 0 }}>
          <div>
            <h2 style={{ margin: 0 }}>结果与推荐</h2>
            <p>{activeModel?.name ?? "请选择模型"} · {formatTokens(totalTokens)} / 月</p>
          </div>
          <Link href={`/models/${activeModel?.slug ?? ""}`} className="button button-small">查看模型</Link>
        </div>
        <div className="grid-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="metric">
            <div className="metric-label">按量 / 积分成本</div>
            <div className="metric-value">{payg ? formatCny(payg.totalCost) : "—"}</div>
            <div className="metric-note">当前平台 · 包含缓存</div>
          </div>
          <div className="metric">
            <div className="metric-label">最低平台成本</div>
            <div className="metric-value">{cheapestEstimate ? formatCny(cheapestEstimate.totalCost) : "—"}</div>
            <div className="metric-note">{cheapestPrice?.provider.name ?? "暂无数据"}</div>
          </div>
        </div>
        <div className="calc-result">
          <span className="small muted">推荐路径</span>
          <strong>{recommended}</strong>
          <span className="small muted">
            按当前用量，{bestPlan ? `最低订阅方案为 ${bestPlan.plan.name}，月费 ${formatCny(bestPlan.estimate.monthlyPriceCny)}。` : "暂无可用订阅方案。"}
          </span>
        </div>
        <div className="stack small">
          {planOptions.slice(0, 3).map(({ plan, estimate, usageCost }) => (
            <div key={plan.id} className="card card-pad" style={{ boxShadow: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{plan.name}</strong>
                <span>{usageCost === null ? "—" : formatCny(usageCost)}</span>
              </div>
              <span className="muted">额度 {plan.quota ? formatTokens(plan.quota) : "不限"} · 破局点 {estimate.breakEvenTokens ? formatTokens(estimate.breakEvenTokens) : "—"}</span>
            </div>
          ))}
        </div>
        <div className="toolbar">
          <button type="button" className="button button-primary" onClick={copyShareLink}>{copied ? "已复制" : "复制分享链接"}</button>
          <Link href={`/share?model=${modelId}&input=${inputTokens}&output=${outputTokens}&cache=${cacheHitRate}`} className="button">查看分享卡片</Link>
        </div>
      </section>
    </div>
  );
}

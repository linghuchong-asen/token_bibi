import type { BillingMode, EnrichedPrice, Price, SubscriptionPlan } from "@/data/types";
import { toCny } from "./format";

const RECHARGE_PATTERN = /([\d.]+)\s*(?:CNY|RMB|人民币|元|USD|\$)?\s*=\s*([\d.]+)/i;

/**
 * Returns the cash multiplier for a recharge ratio.
 * Example: "1 CNY = 1.2 credits" => 1 / 1.2 = 0.833...
 * This means a listed price of 1 credit costs 0.833 CNY.
 */
export function parseRechargeMultiplier(ratio: string | null | undefined): number {
  if (!ratio) return 1;
  const match = ratio.match(RECHARGE_PATTERN);
  if (!match) return 1;
  const paid = Number(match[1]);
  const credits = Number(match[2]);
  if (!Number.isFinite(paid) || !Number.isFinite(credits) || paid <= 0 || credits <= 0) return 1;
  return paid / credits;
}

export function getRechargeMultiplier(price: Pick<Price, "billingMode" | "rechargeRatio">): number {
  if (price.billingMode === "credit") return parseRechargeMultiplier(price.rechargeRatio);
  return 1;
}

export function applyModifiers(price: Price): Pick<EnrichedPrice, "effectiveInputPrice" | "effectiveOutputPrice" | "effectiveCacheReadPrice" | "rechargeMultiplier"> {
  const rechargeMultiplier = getRechargeMultiplier(price);
  const combinedMultiplier = rechargeMultiplier * (price.modelMultiplier ?? 1) * (price.groupMultiplier ?? 1);
  return {
    rechargeMultiplier,
    effectiveInputPrice: price.inputPricePerMTokens * combinedMultiplier,
    effectiveOutputPrice: price.outputPricePerMTokens * combinedMultiplier,
    effectiveCacheReadPrice: (price.cacheReadPricePerMTokens ?? price.inputPricePerMTokens) * combinedMultiplier,
  };
}

export type UsageEstimate = {
  inputTokens: number;
  outputTokens: number;
  cacheHitRate: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  effectiveCostPerMillion: number;
};

export function estimateUsageCost(
  price: Pick<Price, "inputPricePerMTokens" | "outputPricePerMTokens" | "cacheReadPricePerMTokens" | "billingMode" | "rechargeRatio" | "modelMultiplier" | "groupMultiplier">,
  inputTokens: number,
  outputTokens: number,
  cacheHitRate = 0,
): UsageEstimate {
  const enriched = applyModifiers(price as Price);
  const safeCache = Math.min(1, Math.max(0, cacheHitRate));
  const cachedInputTokens = inputTokens * safeCache;
  const uncachedInputTokens = inputTokens - cachedInputTokens;
  const inputCost = (uncachedInputTokens / 1_000_000) * enriched.effectiveInputPrice
    + (cachedInputTokens / 1_000_000) * enriched.effectiveCacheReadPrice;
  const outputCost = (outputTokens / 1_000_000) * enriched.effectiveOutputPrice;
  const totalTokens = inputTokens + outputTokens;
  return {
    inputTokens,
    outputTokens,
    cacheHitRate: safeCache,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    effectiveCostPerMillion: totalTokens > 0 ? ((inputCost + outputCost) / totalTokens) * 1_000_000 : 0,
  };
}

export type SubscriptionEstimate = {
  plan: SubscriptionPlan;
  monthlyPriceCny: number;
  effectivePerMillion: number | null;
  breakEvenTokens: number | null;
};

export function estimateSubscriptionPlan(plan: SubscriptionPlan, effectivePaygPerMillion?: number): SubscriptionEstimate {
  const monthlyPriceCny = toCny(plan.price, plan.currency);
  const effectivePerMillion = plan.quota && plan.quota > 0
    ? monthlyPriceCny / (plan.quota / 1_000_000)
    : null;
  const breakEvenTokens = effectivePaygPerMillion && effectivePaygPerMillion > 0
    ? (monthlyPriceCny / effectivePaygPerMillion) * 1_000_000
    : null;
  return { plan, monthlyPriceCny, effectivePerMillion, breakEvenTokens };
}

export function favorableBillingMode(mode: BillingMode): string {
  switch (mode) {
    case "pay_as_you_go": return "按量";
    case "subscription": return "订阅";
    case "credit": return "积分 / 额度";
    case "fixed": return "固定价";
    case "per_request": return "按次";
  }
}

export function estimatePlanUsageCost(plan: SubscriptionPlan, totalTokens: number, paygPerMillion: number): number {
  const monthlyPrice = toCny(plan.price, plan.currency);
  if (!plan.quota) return monthlyPrice;
  const includedTokens = plan.quotaUnit === "tokens" || plan.quotaUnit === "credits" ? plan.quota : plan.quota * 1_000_000;
  const overageTokens = Math.max(0, totalTokens - includedTokens);
  return monthlyPrice + (overageTokens / 1_000_000) * paygPerMillion;
}

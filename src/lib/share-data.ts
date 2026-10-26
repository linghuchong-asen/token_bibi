import { getModelBySlug, getPricesForModel } from "@/data";
import { enrichPrices } from "./enrich";
import { estimateUsageCost } from "./pricing";

export type ShareCardData = {
  modelName: string;
  providerName: string;
  inputTokens: number;
  outputTokens: number;
  cacheHitRate: number;
  totalCost: number;
  effectiveCostPerMillion: number;
  billingMode: string;
};

export function resolveShareData(slug: string, inputTokens: number, outputTokens: number, cacheHitRate: number): ShareCardData | null {
  const model = getModelBySlug(slug);
  if (!model) return null;
  const prices = enrichPrices(getPricesForModel(model.id));
  const cheapest = [...prices].sort((a, b) => {
    const ac = estimateUsageCost(a, inputTokens, outputTokens, cacheHitRate).totalCost;
    const bc = estimateUsageCost(b, inputTokens, outputTokens, cacheHitRate).totalCost;
    return ac - bc;
  })[0];
  if (!cheapest) return null;
  const estimate = estimateUsageCost(cheapest, inputTokens, outputTokens, cacheHitRate);
  return {
    modelName: model.name,
    providerName: cheapest.provider.name,
    inputTokens,
    outputTokens,
    cacheHitRate,
    totalCost: estimate.totalCost,
    effectiveCostPerMillion: estimate.effectiveCostPerMillion,
    billingMode: cheapest.billingMode,
  };
}

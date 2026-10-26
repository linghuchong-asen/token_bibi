import { getModelById, getProviderById } from "@/data";
import type { EnrichedPrice, Price } from "@/data/types";
import { applyModifiers } from "./pricing";

export function enrichPrice(price: Price): EnrichedPrice | null {
  const model = getModelById(price.modelId);
  const provider = getProviderById(price.providerId);
  if (!model || !provider) return null;
  return {
    ...price,
    model,
    provider,
    ...applyModifiers(price),
  };
}

export function enrichPrices(prices: Price[]): EnrichedPrice[] {
  return prices.map(enrichPrice).filter((price): price is EnrichedPrice => Boolean(price));
}

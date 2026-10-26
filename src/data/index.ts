import modelsJson from "../../data/models.json";
import providersJson from "../../data/providers.json";
import pricesJson from "../../data/prices.json";
import plansJson from "../../data/plans.json";
import rechargeRulesJson from "../../data/recharge-rules.json";
import cardKeyRulesJson from "../../data/card-key-rules.json";
import sponsorsJson from "../../data/sponsors.json";
import type { CardKeyRule, Model, Price, Provider, RechargeRule, Sponsor, SubscriptionPlan } from "./types";

export const models = modelsJson as Model[];
export const providers = providersJson as Provider[];
export const prices = pricesJson as Price[];
export const plans = plansJson as SubscriptionPlan[];
export const rechargeRules = rechargeRulesJson as RechargeRule[];
export const cardKeyRules = cardKeyRulesJson as CardKeyRule[];
export const sponsors = sponsorsJson as Sponsor[];

export function getModelBySlug(slug: string): Model | undefined {
  return models.find((model) => model.slug === slug || model.id === slug);
}

export function getProviderBySlug(slug: string): Provider | undefined {
  return providers.find((provider) => provider.slug === slug || provider.id === slug);
}

export function getProviderById(id: string): Provider | undefined {
  return providers.find((provider) => provider.id === id);
}

export function getModelById(id: string): Model | undefined {
  return models.find((model) => model.id === id);
}

export function getPricesForModel(modelId: string): Price[] {
  return prices.filter((price) => price.modelId === modelId);
}

export function getPricesForProvider(providerId: string): Price[] {
  return prices.filter((price) => price.providerId === providerId);
}

export function getPlansForProvider(providerId: string): SubscriptionPlan[] {
  return plans.filter((plan) => plan.providerId === providerId);
}

export function getRechargeRule(providerId: string): RechargeRule | undefined {
  return rechargeRules.find((rule) => rule.providerId === providerId);
}

export function getCardKeyRule(providerId: string): CardKeyRule | undefined {
  return cardKeyRules.find((rule) => rule.providerId === providerId);
}

export function getSponsorForPlacement(placement: Sponsor["placement"]): Sponsor | undefined {
  return sponsors.find((sponsor) => sponsor.placement === placement && sponsor.enabled);
}

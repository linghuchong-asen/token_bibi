import { z } from "zod";
import modelsJson from "../../data/models.json";
import providersJson from "../../data/providers.json";
import pricesJson from "../../data/prices.json";
import plansJson from "../../data/plans.json";
import rechargeRulesJson from "../../data/recharge-rules.json";
import cardKeyRulesJson from "../../data/card-key-rules.json";
import sponsorsJson from "../../data/sponsors.json";

const dataStatus = z.enum(["sample", "pending_review", "verified"]);
const currency = z.enum(["CNY", "USD"]);
const billingMode = z.enum(["pay_as_you_go", "subscription", "credit", "fixed", "per_request"]);

export const modelSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  vendor: z.string().min(1),
  family: z.string().min(1),
  capabilities: z.array(z.string()),
  contextLength: z.number().positive(),
  multimodal: z.boolean(),
  releaseDate: z.string().min(1),
  aliases: z.array(z.string()),
});

export const providerSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["official_api", "aggregator", "relay", "new_api_instance"]),
  websiteUrl: z.string().url(),
  pricingUrl: z.string().url().nullable(),
  monitorUrl: z.string().url().nullable(),
  supportUrl: z.string().url().nullable(),
  commercialRelation: z.enum(["none", "listed", "affiliate", "sponsored", "partner", "unknown"]),
  summary: z.string(),
  upstreamType: z.string(),
  paymentMethods: z.array(z.string()),
  invoiceSupport: z.enum(["supported", "unsupported", "unknown"]),
  refundPolicy: z.string(),
  riskLabels: z.array(z.string()),
  dataStatus,
  updatedAt: z.string(),
});

export const priceSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  modelId: z.string().min(1),
  currency,
  inputPricePerMTokens: z.number().nonnegative(),
  outputPricePerMTokens: z.number().nonnegative(),
  cacheReadPricePerMTokens: z.number().nonnegative().nullable(),
  billingMode,
  rechargeRatio: z.string().nullable(),
  modelMultiplier: z.number().positive().nullable(),
  groupMultiplier: z.number().positive().nullable(),
  stabilityScore: z.number().min(0).max(100).nullable(),
  sourceUrl: z.string().url(),
  lastVerifiedAt: z.string().min(1),
  dataStatus,
  verificationMethod: z.enum(["manual", "source_check"]).nullable().optional(),
});

export const planSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  currency,
  period: z.enum(["month", "year", "day", "custom"]),
  quota: z.number().positive().nullable(),
  quotaUnit: z.enum(["tokens", "credits", "requests"]),
  resetCycle: z.enum(["none", "daily", "weekly", "monthly", "custom"]),
  modelScope: z.array(z.string()),
  overageRule: z.string(),
  purchaseLimit: z.number().positive().nullable(),
  sourceUrl: z.string().url(),
  lastVerifiedAt: z.string(),
  dataStatus,
});

export const rechargeRuleSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  currency,
  rechargeRatio: z.string().min(1),
  minimumTopUp: z.number().positive().nullable(),
  discount: z.number().positive().nullable(),
  balanceExpiry: z.string().nullable(),
  refundable: z.boolean().nullable(),
  allowedModels: z.array(z.string()).nullable(),
  sourceUrl: z.string().url(),
  lastVerifiedAt: z.string(),
  dataStatus,
});

export const cardKeyRuleSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  supported: z.boolean(),
  usageRule: z.string(),
  validUntil: z.string().nullable(),
  supportChannel: z.string().nullable(),
  riskLevel: z.enum(["low", "medium", "high", "unknown"]),
  sourceUrl: z.string().url().nullable(),
  lastVerifiedAt: z.string(),
  dataStatus,
});

export const sponsorSchema = z.object({
  id: z.string().min(1),
  placement: z.enum(["home", "models", "footer"]),
  title: z.string().min(1),
  description: z.string(),
  sponsorName: z.string().min(1),
  targetUrl: z.string(),
  label: z.string().min(1),
  tone: z.enum(["blue", "green", "amber"]),
  enabled: z.boolean(),
});

export function validateSeedData() {
  return {
    models: z.array(modelSchema).parse(modelsJson),
    providers: z.array(providerSchema).parse(providersJson),
    prices: z.array(priceSchema).parse(pricesJson),
    plans: z.array(planSchema).parse(plansJson),
    rechargeRules: z.array(rechargeRuleSchema).parse(rechargeRulesJson),
    cardKeyRules: z.array(cardKeyRuleSchema).parse(cardKeyRulesJson),
    sponsors: z.array(sponsorSchema).parse(sponsorsJson),
  };
}

import { normalizeOpenRouterModel } from "./openrouter.mjs";
import { parseSiliconFlowRows } from "./siliconflow.mjs";
import { parseAnthropicPricing, parseZhipuPricing } from "./official-pricing.mjs";

export const PRICE_CHECK_FIELDS = ["inputPricePerMTokens", "outputPricePerMTokens", "cacheReadPricePerMTokens"];

export const CHECKABLE_PROVIDERS = new Set(["openrouter", "siliconflow", "official-anthropic", "official-zhipu"]);

export function isCheckablePrice(price) {
  return CHECKABLE_PROVIDERS.has(price.providerId);
}

export function buildFreshPriceMap({ openRouterPayload, siliconFlowHtml, anthropicPricingHtml, zhipuPricingHtml, openRouterMap, siliconFlowMap, now = new Date() }) {
  const map = new Map();
  if (openRouterPayload) {
    const byId = new Map((openRouterPayload.data ?? []).map((model) => [model.id, model]));
    for (const [modelId, openRouterId] of Object.entries(openRouterMap ?? {})) {
      const row = normalizeOpenRouterModel(byId.get(openRouterId), modelId, now);
      if (row) map.set(row.id, row);
    }
  }
  if (siliconFlowHtml) {
    for (const row of parseSiliconFlowRows(siliconFlowHtml, siliconFlowMap ?? {}, now)) {
      map.set(row.id, row);
    }
  }
  if (anthropicPricingHtml) {
    for (const [modelId, price] of Object.entries(parseAnthropicPricing(anthropicPricingHtml))) {
      const id = `official-anthropic-${modelId}-pay_as_you_go`;
      map.set(id, {
        id,
        providerId: "official-anthropic",
        modelId,
        currency: "CNY",
        billingMode: "pay_as_you_go",
        sourceUrl: "https://claude.com/pricing",
        lastVerifiedAt: now.toISOString(),
        dataStatus: "pending_review",
        ...price,
      });
    }
  }
  if (zhipuPricingHtml) {
    for (const [modelId, price] of Object.entries(parseZhipuPricing(zhipuPricingHtml))) {
      const id = `official-zhipu-${modelId}-pay_as_you_go`;
      map.set(id, {
        id,
        providerId: "official-zhipu",
        modelId,
        currency: "CNY",
        billingMode: "pay_as_you_go",
        sourceUrl: "https://docs.bigmodel.cn/cn/guide/start/pricing",
        lastVerifiedAt: now.toISOString(),
        dataStatus: "pending_review",
        ...price,
      });
    }
  }
  return map;
}

export function comparePendingPrice(existing, fresh) {
  if (!fresh) return { status: "missing", diffs: [] };
  const diffs = PRICE_CHECK_FIELDS
    .filter((field) => existing[field] !== fresh[field])
    .map((field) => ({ field, existing: existing[field], fresh: fresh[field] }));
  return { status: diffs.length > 0 ? "mismatch" : "match", diffs };
}

export function verifyMatchedPrices(prices, freshById, now = new Date(), eligibleStatuses = ["pending_review"], eligiblePredicate = () => true) {
  const verifiedIds = [];
  const unmatched = [];
  const next = prices.map((price) => {
    if (!eligibleStatuses.includes(price.dataStatus) || !eligiblePredicate(price)) return price;
    const fresh = freshById.get(price.id);
    const check = comparePendingPrice(price, fresh);
    if (check.status !== "match") {
      unmatched.push({ id: price.id, status: check.status, diffs: check.diffs });
      return price;
    }
    verifiedIds.push(price.id);
    return {
      ...price,
      dataStatus: "verified",
      lastVerifiedAt: now.toISOString(),
      verificationMethod: "source_check",
      sourceUrl: fresh.sourceUrl ?? price.sourceUrl,
    };
  });
  return { prices: next, verifiedIds, unmatched };
}

export function formatCheckLine(price, check) {
  if (check.status === "match") return `MATCH\t${price.id}`;
  if (check.status === "missing") return `MISSING\t${price.id}\t来源中找不到对应模型`;
  const diffs = check.diffs.map((diff) => `${diff.field}: ${diff.existing} -> ${diff.fresh}`).join(", ");
  return `MISMATCH\t${price.id}\t${diffs}`;
}

// 文件用途：价格来源复核的核心比对库（所属模块：数据采集与核验管线 scripts/）
// 职责：把四个公开源（OpenRouter / SiliconFlow / Anthropic 官方 / 智谱官方）的最新
// 价格解析成统一结构，与库内记录逐字段比对；只有完全一致才允许标记"已核验"。
// 本文件是"数据真实性"的第一道防线，改动需同步更新 tests/source-check.test.ts。
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

// 降级失去来源支撑的"已核验"价格：已核验徽章只在实时来源仍然认可它时才诚实。
// 一旦源站改价（mismatch）或模型下架（missing），必须退回待核验，否则页面会
// 挂着"已核验"却展示源站已不认可的价格——这是比"待核验"更大的真实性漏洞。
// 注意：这里不自动改价格数值（数值由采集+导入流程负责），只负责撤回核验状态。
export function demoteStaleVerifiedPrices(prices, freshById, eligiblePredicate = isCheckablePrice) {
  const demotedIds = [];
  const next = prices.map((price) => {
    if (price.dataStatus !== "verified" || !eligiblePredicate(price)) return price;
    const check = comparePendingPrice(price, freshById.get(price.id));
    if (check.status === "match") return price;
    demotedIds.push(price.id);
    return {
      ...price,
      dataStatus: "pending_review",
      verificationMethod: null,
    };
  });
  return { prices: next, demotedIds };
}

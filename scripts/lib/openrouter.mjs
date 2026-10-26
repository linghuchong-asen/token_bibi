export const USD_TO_CNY = 7.2;

export function usdPerTokenToCnyPerMillion(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Number((number * 1_000_000 * USD_TO_CNY).toFixed(6));
}

export function normalizeOpenRouterModel(model, modelId, now = new Date()) {
  const prompt = usdPerTokenToCnyPerMillion(model?.pricing?.prompt);
  const completion = usdPerTokenToCnyPerMillion(model?.pricing?.completion);
  const cacheRead = usdPerTokenToCnyPerMillion(model?.pricing?.input_cache_read);
  if (prompt === null || completion === null) return null;
  return {
    id: `openrouter-${modelId}-credit`,
    providerId: "openrouter",
    modelId,
    currency: "CNY",
    inputPricePerMTokens: prompt,
    outputPricePerMTokens: completion,
    cacheReadPricePerMTokens: cacheRead,
    billingMode: "credit",
    rechargeRatio: "1 CNY = 1.0 credits",
    modelMultiplier: 1,
    groupMultiplier: 1,
    stabilityScore: 96,
    sourceUrl: "https://openrouter.ai/api/v1/models",
    lastVerifiedAt: now.toISOString(),
    dataStatus: "pending_review",
  };
}

export function toCsv(rows) {
  const headers = [
    "id", "providerId", "modelId", "currency", "inputPricePerMTokens", "outputPricePerMTokens",
    "cacheReadPricePerMTokens", "billingMode", "rechargeRatio", "modelMultiplier", "groupMultiplier",
    "stabilityScore", "sourceUrl", "lastVerifiedAt", "dataStatus",
  ];
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n")}\n`;
}

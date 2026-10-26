export const USD_TO_CNY = 7.2;

const anthropicModels = {
  "claude-sonnet-5": "Sonnet 5",
  "claude-opus-5": "Opus 5",
};

const zhipuModels = {
  "glm-5-3-flash": "GLM-5.3-Flash",
};

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function usdToCny(value) {
  return Number((Number(value) * USD_TO_CNY).toFixed(6));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseAnthropicPricing(html) {
  const text = htmlToText(html);
  const rows = {};
  for (const [modelId, label] of Object.entries(anthropicModels)) {
    const pattern = new RegExp(
      `${escapeRegExp(label)}(?![\\d.]) Prompt caching Read \\$([0-9.]+) / MTok Write \\$([0-9.]+) / MTok Input \\$([0-9.]+) / MTok Output \\$([0-9.]+) / MTok`,
    );
    const match = text.match(pattern);
    if (!match) continue;
    rows[modelId] = {
      inputPricePerMTokens: usdToCny(match[3]),
      outputPricePerMTokens: usdToCny(match[4]),
      cacheReadPricePerMTokens: usdToCny(match[1]),
    };
  }
  return rows;
}

export function buildOfficialPriceRows(anthropicRows, zhipuRows, now = new Date()) {
  const rows = [];
  for (const [modelId, price] of Object.entries(anthropicRows)) {
    rows.push({
      id: `official-anthropic-${modelId}-pay_as_you_go`,
      providerId: "official-anthropic",
      modelId,
      currency: "CNY",
      billingMode: "pay_as_you_go",
      rechargeRatio: null,
      modelMultiplier: null,
      groupMultiplier: null,
      stabilityScore: null,
      sourceUrl: "https://claude.com/pricing",
      lastVerifiedAt: now.toISOString(),
      dataStatus: "pending_review",
      ...price,
    });
  }
  for (const [modelId, price] of Object.entries(zhipuRows)) {
    rows.push({
      id: `official-zhipu-${modelId}-pay_as_you_go`,
      providerId: "official-zhipu",
      modelId,
      currency: "CNY",
      billingMode: "pay_as_you_go",
      rechargeRatio: null,
      modelMultiplier: null,
      groupMultiplier: null,
      stabilityScore: null,
      sourceUrl: "https://docs.bigmodel.cn/cn/guide/start/pricing",
      lastVerifiedAt: now.toISOString(),
      dataStatus: "pending_review",
      ...price,
    });
  }
  return rows;
}

export function parseZhipuPricing(html) {
  const text = htmlToText(html);
  const rows = {};
  for (const [modelId, label] of Object.entries(zhipuModels)) {
    const pattern = new RegExp(`${escapeRegExp(label)}\\s+1M\\s+([0-9.]+)\\s+([0-9.]+)\\s+限时免费\\s+([0-9.]+)`);
    const match = text.match(pattern);
    if (!match) continue;
    rows[modelId] = {
      inputPricePerMTokens: Number(match[1]),
      outputPricePerMTokens: Number(match[2]),
      cacheReadPricePerMTokens: Number(match[3]),
    };
  }
  return rows;
}

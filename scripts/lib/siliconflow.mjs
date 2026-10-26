export function parseSiliconFlowRows(html, modelMap, now = new Date()) {
  const rows = [];
  const parts = html.split('id="pricing-row-text-');
  for (const [modelId, targetId] of Object.entries(modelMap)) {
    const escaped = targetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = parts.find((part) => part.includes(`title="${targetId}"`) || new RegExp(`title=["']${escaped}["']`).test(part));
    if (!block) continue;
    const prices = [...block.matchAll(/¥\s*([0-9]+(?:\.[0-9]+)?)/g)].map((match) => Number(match[1]));
    if (prices.length < 2) continue;
    rows.push({
      id: `siliconflow-${modelId}-pay_as_you_go`,
      providerId: "siliconflow",
      modelId,
      currency: "CNY",
      inputPricePerMTokens: prices[0],
      outputPricePerMTokens: prices[1],
      cacheReadPricePerMTokens: prices[2] ?? null,
      billingMode: "pay_as_you_go",
      rechargeRatio: null,
      modelMultiplier: null,
      groupMultiplier: null,
      stabilityScore: 98,
      sourceUrl: "https://www.siliconflow.cn/pricing",
      lastVerifiedAt: now.toISOString(),
      dataStatus: "pending_review",
    });
  }
  return rows;
}

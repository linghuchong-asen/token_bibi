const PRICE_COMPARISON_FIELDS = [
  "providerId",
  "modelId",
  "currency",
  "inputPricePerMTokens",
  "outputPricePerMTokens",
  "cacheReadPricePerMTokens",
  "billingMode",
  "rechargeRatio",
  "modelMultiplier",
  "groupMultiplier",
  "sourceUrl",
];

function comparable(value) {
  return value === undefined ? null : value;
}

export function priceValuesUnchanged(existing, incoming) {
  return PRICE_COMPARISON_FIELDS.every(
    (field) => comparable(existing[field]) === comparable(incoming[field]),
  );
}

export function mergePriceRecord(existing, incoming) {
  if (!existing) return incoming;
  if (priceValuesUnchanged(existing, incoming) && existing.dataStatus === "verified" && incoming.dataStatus !== "verified") {
    return {
      ...incoming,
      dataStatus: existing.dataStatus,
      lastVerifiedAt: existing.lastVerifiedAt,
      verificationMethod: existing.verificationMethod ?? null,
    };
  }
  return {
    ...incoming,
    verificationMethod: incoming.verificationMethod ?? null,
  };
}

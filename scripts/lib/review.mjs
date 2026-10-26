export function listPendingPrices(prices) {
  return prices.filter((price) => price.dataStatus === "pending_review");
}

export function verifyPriceRecord(prices, id, now = new Date(), method = "manual") {
  let updated = null;
  const next = prices.map((price) => {
    if (price.id !== id) return price;
    updated = {
      ...price,
      dataStatus: "verified",
      lastVerifiedAt: now.toISOString(),
      verificationMethod: method,
    };
    return updated;
  });
  return { prices: next, updated };
}

import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { mergePriceRecord, priceValuesUnchanged } from "../scripts/lib/prices.mjs";

const base = {
  id: "openrouter-test-credit",
  providerId: "openrouter",
  modelId: "test",
  currency: "CNY",
  inputPricePerMTokens: 1,
  outputPricePerMTokens: 2,
  cacheReadPricePerMTokens: 0.1,
  billingMode: "credit",
  rechargeRatio: "1 CNY = 1.0 credits",
  modelMultiplier: 1,
  groupMultiplier: 1,
  stabilityScore: 96,
  sourceUrl: "https://openrouter.ai/api/v1/models",
  lastVerifiedAt: "2026-10-20T00:00:00.000Z",
  dataStatus: "verified",
  verificationMethod: "source_check",
};

const incoming = {
  ...base,
  lastVerifiedAt: "2026-10-23T00:00:00.000Z",
  dataStatus: "pending_review",
  verificationMethod: null,
};

describe("price import merge", () => {
  it("preserves verification when collected values are unchanged", () => {
    expect(priceValuesUnchanged(base, incoming)).toBe(true);
    const merged = mergePriceRecord(base, incoming);
    expect(merged.dataStatus).toBe("verified");
    expect(merged.lastVerifiedAt).toBe(base.lastVerifiedAt);
    expect(merged.verificationMethod).toBe("source_check");
  });

  it("resets verification when a price changes", () => {
    const changed = { ...incoming, inputPricePerMTokens: 9 };
    const merged = mergePriceRecord(base, changed);
    expect(merged.dataStatus).toBe("pending_review");
    expect(merged.lastVerifiedAt).toBe(changed.lastVerifiedAt);
  });

  it("does not reset verification for editorial stability changes", () => {
    const merged = mergePriceRecord(base, { ...incoming, stabilityScore: null });
    expect(merged.dataStatus).toBe("verified");
    expect(merged.lastVerifiedAt).toBe(base.lastVerifiedAt);
  });

  it("does not preserve sample status", () => {
    const merged = mergePriceRecord({ ...base, dataStatus: "sample" }, incoming);
    expect(merged.dataStatus).toBe("pending_review");
  });

  it("adds a null verification method for new imported rows", () => {
    const merged = mergePriceRecord(undefined, incoming);
    expect(merged.verificationMethod).toBeNull();
  });
});

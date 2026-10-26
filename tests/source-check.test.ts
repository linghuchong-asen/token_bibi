import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { comparePendingPrice, isCheckablePrice, verifyMatchedPrices } from "../scripts/lib/source-check.mjs";

const pending = {
  id: "openrouter-test-credit",
  dataStatus: "pending_review",
  inputPricePerMTokens: 1,
  outputPricePerMTokens: 2,
  cacheReadPricePerMTokens: 0.1,
};

const fresh = {
  ...pending,
  dataStatus: "pending_review",
  lastVerifiedAt: "2026-10-23T00:00:00.000Z",
};

describe("source check", () => {
  it("matches identical price values", () => {
    expect(comparePendingPrice(pending, fresh)).toEqual({ status: "match", diffs: [] });
  });

  it("reports exact numeric differences", () => {
    const result = comparePendingPrice(pending, { ...fresh, outputPricePerMTokens: 3 });
    expect(result.status).toBe("mismatch");
    expect(result.diffs).toEqual([{ field: "outputPricePerMTokens", existing: 2, fresh: 3 }]);
  });

  it("reports missing source records", () => {
    expect(comparePendingPrice(pending, undefined).status).toBe("missing");
  });

  it("classifies only supported providers as checkable", () => {
    expect(isCheckablePrice({ providerId: "openrouter", dataStatus: "sample" })).toBe(true);
    expect(isCheckablePrice({ providerId: "official-anthropic", dataStatus: "verified" })).toBe(true);
    expect(isCheckablePrice({ providerId: "302ai", dataStatus: "sample" })).toBe(false);
  });

  it("verifies only matching pending prices", () => {
    const prices = [
      pending,
      { ...pending, id: "changed", outputPricePerMTokens: 9 },
      { ...pending, id: "sample", dataStatus: "sample" },
    ];
    const freshById = new Map([
      [pending.id, fresh],
      ["changed", fresh],
      ["sample", fresh],
    ]);
    const now = new Date("2026-10-23T01:02:03.000Z");
    const result = verifyMatchedPrices(prices, freshById, now);
    expect(result.verifiedIds).toEqual([pending.id]);
    expect(result.prices[0].dataStatus).toBe("verified");
    expect(result.prices[0].verificationMethod).toBe("source_check");
    expect(result.prices[0].lastVerifiedAt).toBe(now.toISOString());
    expect(result.prices[1].dataStatus).toBe("pending_review");
    expect(result.prices[2].dataStatus).toBe("sample");
    expect(result.unmatched).toHaveLength(1);
  });

  it("can verify matching sample records for supported providers only", () => {
    const anthropic = {
      ...pending,
      id: "official-anthropic-test-pay_as_you_go",
      providerId: "official-anthropic",
      dataStatus: "sample",
      sourceUrl: "https://old.example",
    };
    const unsupported = { ...pending, id: "other", providerId: "302ai", dataStatus: "sample" };
    const freshById = new Map([[anthropic.id, { ...fresh, sourceUrl: "https://claude.com/pricing" }]]);
    const result = verifyMatchedPrices(
      [anthropic, unsupported],
      freshById,
      new Date("2026-10-23T00:00:00.000Z"),
      ["pending_review", "sample"],
      isCheckablePrice,
    );
    expect(result.verifiedIds).toEqual([anthropic.id]);
    expect(result.prices[0].dataStatus).toBe("verified");
    expect(result.prices[0].sourceUrl).toBe("https://claude.com/pricing");
    expect(result.prices[1].dataStatus).toBe("sample");
    expect(result.unmatched).toHaveLength(0);
  });
});

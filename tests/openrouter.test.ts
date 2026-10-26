import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { normalizeOpenRouterModel, toCsv, usdPerTokenToCnyPerMillion } from "../scripts/lib/openrouter.mjs";

describe("OpenRouter collector", () => {
  it("converts USD per token to CNY per million", () => {
    // TC-2a / data collector smoke
    expect(usdPerTokenToCnyPerMillion(0.000001)).toBeCloseTo(7.2, 6);
  });

  it("normalizes a pricing record and serializes CSV", () => {
    const row = normalizeOpenRouterModel({
      pricing: { prompt: "0.000001", completion: "0.000002", input_cache_read: "0.0000001" },
    }, "gpt-5-6-sol", new Date("2026-10-22T00:00:00.000Z"));
    expect(row?.inputPricePerMTokens).toBeCloseTo(7.2, 6);
    expect(row?.outputPricePerMTokens).toBeCloseTo(14.4, 6);
    const csv = toCsv([row]);
    expect(csv).toContain("openrouter-gpt-5-6-sol-credit");
  });
});

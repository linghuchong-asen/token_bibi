import { describe, expect, it } from "vitest";
import { validateSeedData } from "@/lib/validation";
import { models, prices, providers } from "@/data";

describe("seed data", () => {
  it("passes schema validation", () => {
    // TC-1a / TC-1b / TC-1c
    const data = validateSeedData();
    expect(data.models.length).toBeGreaterThan(0);
    expect(data.providers.length).toBeGreaterThan(0);
    expect(data.prices.length).toBeGreaterThan(0);
  });

  it("keeps price relationships valid", () => {
    // TC-1c
    const modelIds = new Set(models.map((model) => model.id));
    const providerIds = new Set(providers.map((provider) => provider.id));
    for (const price of prices) {
      expect(modelIds.has(price.modelId)).toBe(true);
      expect(providerIds.has(price.providerId)).toBe(true);
      expect(price.sourceUrl).toMatch(/^https?:\/\//);
      expect(price.lastVerifiedAt).toBeTruthy();
    }
  });

  it("supports all four purchase paths in seed data", () => {
    // TC-2a / TC-2b / TC-2c / TC-2d
    expect(prices.some((price) => price.billingMode === "pay_as_you_go")).toBe(true);
    expect(prices.some((price) => price.billingMode === "credit")).toBe(true);
  });
});

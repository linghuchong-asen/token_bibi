import { describe, expect, it } from "vitest";
import { enrichPrices } from "@/lib/enrich";
import { filterPrices, queryPrices, sortPrices } from "@/lib/filtering";
import { prices } from "@/data";

const rows = enrichPrices(prices);

describe("model filtering and sorting", () => {
  it("searches by model name", () => {
    // TC-8a
    const result = filterPrices(rows, { query: "glm", billing: "all", providerType: "all" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((row) => row.model.name.toLowerCase().includes("glm"))).toBe(true);
  });

  it("filters by billing mode", () => {
    // TC-8b
    const result = filterPrices(rows, { query: "", billing: "credit", providerType: "all" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((row) => row.billingMode === "credit")).toBe(true);
  });

  it("filters by provider type", () => {
    // TC-8b
    const result = filterPrices(rows, { query: "", billing: "all", providerType: "official_api" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((row) => row.provider.type === "official_api")).toBe(true);
  });

  it("filters out sample prices when requested", () => {
    const verified = filterPrices(rows, { query: "", billing: "all", providerType: "all", dataStatus: "verified" });
    expect(verified.length).toBeGreaterThan(0);
    expect(verified.every((row) => row.dataStatus === "verified")).toBe(true);
    const all = filterPrices(rows, { query: "", billing: "all", providerType: "all", dataStatus: "all" });
    expect(all.length).toBeGreaterThan(verified.length);
  });

  it("sorts by effective input price", () => {
    // TC-8c
    const result = sortPrices(rows, "effective-input");
    for (let index = 1; index < result.length; index += 1) {
      expect(result[index - 1].effectiveInputPrice).toBeLessThanOrEqual(result[index].effectiveInputPrice);
    }
  });

  it("sorts by stability score descending", () => {
    // TC-8c
    const result = sortPrices(rows, "stability");
    for (let index = 1; index < result.length; index += 1) {
      expect((result[index - 1].stabilityScore ?? 0)).toBeGreaterThanOrEqual(result[index].stabilityScore ?? 0);
    }
  });

  it("combines filtering and sorting", () => {
    // TC-8d
    const result = queryPrices(rows, { query: "claude", billing: "all", providerType: "all" }, "effective-input");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((row) => row.model.name.includes("Claude"))).toBe(true);
  });
});

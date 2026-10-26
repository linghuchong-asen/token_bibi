import { describe, expect, it } from "vitest";
import { providers } from "@/data";

describe("risk disclosure data", () => {
  it("includes risk labels for every provider", () => {
    // TC-9a / TC-9b
    for (const provider of providers) {
      expect(provider.riskLabels.length).toBeGreaterThan(0);
    }
  });

  it("marks official providers explicitly", () => {
    // TC-9a
    const official = providers.filter((provider) => provider.type === "official_api");
    expect(official.length).toBeGreaterThan(0);
    for (const provider of official) {
      expect(provider.riskLabels).toContain("官方渠道");
    }
  });
});

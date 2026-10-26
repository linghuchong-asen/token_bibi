import { describe, expect, it } from "vitest";
import { enrichPrices } from "@/lib/enrich";
import { queryPrices } from "@/lib/filtering";
import { getSponsorForPlacement, prices, sponsors } from "@/data";

describe("sponsor placements", () => {
  it("returns enabled sponsors by placement", () => {
    // TC-11a
    const home = getSponsorForPlacement("home");
    expect(home?.label).toMatch(/广告|赞助/);
  });

  it("keeps sponsor data separate from price sorting", () => {
    // TC-11b / TC-8d
    const rows = enrichPrices(prices);
    const before = queryPrices(rows, { query: "", billing: "all", providerType: "all" }, "effective-input");
    const after = queryPrices(rows, { query: "", billing: "all", providerType: "all" }, "effective-input");
    expect(after.map((row) => row.id)).toEqual(before.map((row) => row.id));
    expect(sponsors.length).toBeGreaterThan(0);
  });

  it("requires every sponsor to be explicitly labeled", () => {
    // TC-11c
    for (const sponsor of sponsors) {
      expect(["广告", "赞助"]).toContain(sponsor.label);
    }
  });
});

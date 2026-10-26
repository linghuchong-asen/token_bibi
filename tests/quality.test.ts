import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("data quality report", () => {
  it("reports counts and no orphan prices", async () => {
    // TC-1c / data quality smoke
    const report = JSON.parse(await readFile(path.join(process.cwd(), "data", "quality-report.json"), "utf8")) as {
      summary: { prices: number; pendingReview: number };
      issues: { orphanPrices: string[]; duplicatePriceIds: string[] };
    };
    expect(report.summary.prices).toBeGreaterThan(0);
    expect(report.summary.pendingReview).toBeGreaterThanOrEqual(0);
    expect(report.issues.orphanPrices).toEqual([]);
    expect(report.issues.duplicatePriceIds).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { listPendingPrices, verifyPriceRecord } from "../scripts/lib/review.mjs";

const prices = [
  { id: "a", dataStatus: "pending_review" },
  { id: "b", dataStatus: "verified" },
];

describe("price review", () => {
  it("lists pending prices", () => {
    expect(listPendingPrices(prices).map((price: { id: string }) => price.id)).toEqual(["a"]);
  });

  it("marks a price as verified", () => {
    const result = verifyPriceRecord(prices, "a", new Date("2026-10-22T00:00:00.000Z"));
    expect(result.updated?.dataStatus).toBe("verified");
    expect(result.updated?.lastVerifiedAt).toBe("2026-10-22T00:00:00.000Z");
    expect(result.prices[0].dataStatus).toBe("verified");
  });
});

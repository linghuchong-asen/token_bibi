import { describe, expect, it } from "vitest";
import { commonVerificationMethod, priceStatusNote, summarizeDataStatus } from "@/lib/data-status";

describe("data status summary", () => {
  it("summarizes verified, mixed, and sample records", () => {
    expect(summarizeDataStatus([{ dataStatus: "verified" }, { dataStatus: "verified" }])).toBe("verified");
    expect(summarizeDataStatus([{ dataStatus: "verified" }, { dataStatus: "pending_review" }])).toBe("pending_review");
    expect(summarizeDataStatus([{ dataStatus: "sample" }])).toBe("sample");
    expect(summarizeDataStatus([])).toBe("sample");
  });

  it("returns a shared verification method only for fully verified data", () => {
    expect(commonVerificationMethod([
      { dataStatus: "verified", verificationMethod: "source_check" },
      { dataStatus: "verified", verificationMethod: "source_check" },
    ])).toBe("source_check");
    expect(commonVerificationMethod([
      { dataStatus: "verified", verificationMethod: "source_check" },
      { dataStatus: "verified", verificationMethod: "manual" },
    ])).toBeNull();
    expect(commonVerificationMethod([{ dataStatus: "pending_review", verificationMethod: "source_check" }])).toBeNull();
  });

  it("writes an actionable status note", () => {
    expect(priceStatusNote([{ dataStatus: "verified" }, { dataStatus: "pending_review" }])).toContain("已核验 1 / 2");
    expect(priceStatusNote([{ dataStatus: "sample" }])).toContain("样例数据");
  });
});

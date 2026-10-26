import { describe, expect, it } from "vitest";
import { buildShareCardSvg } from "@/lib/share-card";
import { resolveShareData } from "@/lib/share-data";

describe("share card", () => {
  it("resolves share data for a known model", () => {
    // TC-10a / TC-10b
    const data = resolveShareData("gpt-5-6-sol", 10_000_000, 5_000_000, 0.2);
    expect(data).not.toBeNull();
    expect(data?.modelName).toBe("GPT-5.6 Sol");
    expect(data?.totalCost).toBeGreaterThan(0);
  });

  it("builds an SVG with the model and cost", () => {
    // TC-10a
    const data = resolveShareData("gpt-5-6-sol", 1_000_000, 1_000_000, 0);
    if (!data) throw new Error("missing share data");
    const svg = buildShareCardSvg(data);
    expect(svg).toContain("GPT-5.6 Sol");
    expect(svg).toContain("token比比");
    expect(svg).toContain("真实到手成本");
  });
});

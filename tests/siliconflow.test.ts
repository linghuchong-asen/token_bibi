import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { parseSiliconFlowRows } from "../scripts/lib/siliconflow.mjs";

const html = `<div id="pricing-row-text-1"><a title="zai-org/GLM-5.3-Flash">GLM-5.3-Flash</a><span>¥ 0.80</span><span>¥ 2.80</span><span>¥ 0.23</span></div>`;

describe("SiliconFlow collector", () => {
  it("parses model prices from the pricing page", () => {
    // TC-2a / data collector smoke
    const rows = parseSiliconFlowRows(html, { "glm-5-3-flash": "zai-org/GLM-5.3-Flash" }, new Date("2026-10-22T00:00:00.000Z"));
    expect(rows).toHaveLength(1);
    expect(rows[0].inputPricePerMTokens).toBe(0.8);
    expect(rows[0].outputPricePerMTokens).toBe(2.8);
    expect(rows[0].cacheReadPricePerMTokens).toBe(0.23);
  });
});

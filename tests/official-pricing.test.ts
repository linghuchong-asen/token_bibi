import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { parseAnthropicPricing, parseZhipuPricing } from "../scripts/lib/official-pricing.mjs";

describe("official pricing parsers", () => {
  it("extracts Anthropic Sonnet 5 and Opus 5 without matching 5.5", () => {
    const html = `
      <section>Sonnet 5.5 Prompt caching Read $0.10 / MTok Write $2.50 / MTok Input $2 / MTok Output $10 / MTok</section>
      <section>Opus 5.5 Prompt caching Read $0.20 / MTok Write $5 / MTok Input $4 / MTok Output $20 / MTok</section>
      <section>Sonnet 5 Prompt caching Read $0.20 / MTok Write $2.50 / MTok Input $2 / MTok Output $10 / MTok</section>
      <section>Opus 5 Prompt caching Read $0.50 / MTok Write $6.25 / MTok Input $5 / MTok Output $25 / MTok</section>
    `;
    const rows = parseAnthropicPricing(html);
    expect(rows["claude-sonnet-5"]).toEqual({
      inputPricePerMTokens: 14.4,
      outputPricePerMTokens: 72,
      cacheReadPricePerMTokens: 1.44,
    });
    expect(rows["claude-opus-5"]).toEqual({
      inputPricePerMTokens: 36,
      outputPricePerMTokens: 180,
      cacheReadPricePerMTokens: 3.6,
    });
  });

  it("extracts Zhipu GLM-5.3-Flash CNY prices", () => {
    const html = `
      <table>
        <tr><td>GLM-5.3</td><td>1M</td><td>8</td><td>28</td><td>限时免费</td><td>2</td></tr>
        <tr><td>GLM-5.3-Flash</td><td>1M</td><td>0.8</td><td>2.8</td><td>限时免费</td><td>0.23</td></tr>
      </table>
    `;
    expect(parseZhipuPricing(html)["glm-5-3-flash"]).toEqual({
      inputPricePerMTokens: 0.8,
      outputPricePerMTokens: 2.8,
      cacheReadPricePerMTokens: 0.23,
    });
  });
});

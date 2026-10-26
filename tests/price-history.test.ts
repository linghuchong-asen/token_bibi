import { describe, expect, it } from "vitest";
import { GET } from "@/app/feed.xml/route";
import { modelPriceSeries, priceHistory, seriesForPrice } from "@/lib/price-history";

describe("price history", () => {
  it("builds an ascending series for a known price", () => {
    const series = seriesForPrice("openrouter-kimi-k3-credit");
    expect(series.length).toBeGreaterThanOrEqual(2);
    const times = series.map((point) => point.capturedAt);
    expect([...times].sort()).toEqual(times);
  });

  it("returns an empty series for unknown prices", () => {
    expect(seriesForPrice("no-such-price")).toEqual([]);
  });

  it("marks only prices whose first and last values differ as changed", () => {
    const series = modelPriceSeries(["openrouter-kimi-k3-credit", "siliconflow-glm-5-3-flash-pay_as_you_go", "no-such-price"]);
    // 快照点数量是全局水位：本地至少 2 个点（历史快照 + 当前）
    expect(priceHistory.pointCount).toBeGreaterThanOrEqual(2);
    const byId = new Map(series.map((item) => [item.priceId, item]));
    // kimi-k3 在快照窗口内发生过真实调价
    expect(byId.get("openrouter-kimi-k3-credit")?.changed).toBe(true);
    // 从未变动过的价格不得画线，避免制造"在动"的错觉
    expect(byId.get("siliconflow-glm-5-3-flash-pay_as_you_go")?.changed).toBe(false);
    // 没有历史的价格直接不出现
    expect(byId.has("no-such-price")).toBe(false);
  });
});

describe("rss feed", () => {
  it("returns valid rss xml with items for detected changes", async () => {
    const response = await GET();
    expect(response.headers.get("Content-Type")).toContain("application/rss+xml");
    const xml = await response.text();
    expect(xml).toContain("<rss version=\"2.0\">");
    expect(xml).toContain("<channel>");
    expect(xml).toContain("价格变动");
    if (xml.includes("<item>")) {
      // 变动条目必须带链接与 guid
      expect(xml).toContain("<link>");
      expect(xml).toContain("<guid");
      expect(xml).toContain("<pubDate>");
    }
  });

  it("escapes xml special characters in titles", async () => {
    const response = await GET();
    const xml = await response.text();
    // 原始的裸 & 或 < 不允许出现在标签文本里（除转义外）
    expect(xml).not.toMatch(/<title>[^<]*&[^a]/);
  });
});

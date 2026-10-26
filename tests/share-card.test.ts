// 文件用途：分享卡/嵌入卡的回归（所属模块：tests）
// 分发面（PNG 卡 / iframe 卡）把数据带到站外，这里锁定两条铁律：
// ①状态徽章与数据日期必须来自真实核验状态，不允许硬编码；
// ②嵌入卡必须携带"数据截至 + 状态"脚注。
import { describe, expect, it } from "vitest";
import { buildEmbedHtml } from "@/lib/embed";
import { buildShareCardSvg } from "@/lib/share-card";
import { resolveShareData, shareDataDate, shareStatusLabel } from "@/lib/share-data";

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

  it("labels the card with the real verification status instead of a hardcoded one", () => {
    // 回归：此前固定写死"样例数据 · 2026-10-22"，把已核验数据也说成样例
    const data = resolveShareData("gpt-5-6-sol", 1_000_000, 1_000_000, 0);
    if (!data) throw new Error("missing share data");
    const svg = buildShareCardSvg(data);
    expect(svg).toContain(shareStatusLabel(data));
    expect(svg).toContain(shareDataDate(data));
    expect(svg).not.toContain("2026-10-22 · 样例数据");
  });

  it("prefers verified prices for the headline estimate over cheaper samples", () => {
    // 站内原则"默认只看已核验"同样适用于分享结论：gpt-5-6-sol 存在更便宜的
    // 样例价（302ai/newapi-demo），但分享卡必须选已核验的 OpenRouter 价格
    const data = resolveShareData("gpt-5-6-sol", 1_000_000, 1_000_000, 0);
    if (!data) throw new Error("missing share data");
    expect(data.dataStatus).toBe("verified");
    expect(data.providerName).toBe("OpenRouter");
  });

  it("maps each data status to an honest label", () => {
    expect(shareStatusLabel({ dataStatus: "verified", verificationMethod: "source_check" })).toBe("已核验 · 来源复核");
    expect(shareStatusLabel({ dataStatus: "verified", verificationMethod: "manual" })).toBe("已核验 · 人工核验");
    expect(shareStatusLabel({ dataStatus: "pending_review", verificationMethod: null })).toBe("待核验");
    expect(shareStatusLabel({ dataStatus: "sample", verificationMethod: null })).toBe("样例数据");
  });

  it("formats the data date or admits it is unknown", () => {
    expect(shareDataDate({ lastVerifiedAt: "2026-10-26T15:27:35.639Z" })).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(shareDataDate({ lastVerifiedAt: "not-a-date" })).toBe("数据日期未知");
  });
});

describe("embed card", () => {
  it("carries the data-as-of date and verification status", () => {
    const data = resolveShareData("gpt-5-6-sol", 1_000_000, 1_000_000, 0);
    if (!data) throw new Error("missing share data");
    const html = buildEmbedHtml(data, "https://tokenbibi.example.com", "model=gpt-5-6-sol");
    expect(html).toContain("数据截至");
    expect(html).toContain(shareStatusLabel(data));
    expect(html).toContain(shareDataDate(data));
  });
});

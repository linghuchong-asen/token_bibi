import { describe, expect, it } from "vitest";
import { buildEmbedHtml } from "@/lib/embed";
import { resolveShareData } from "@/lib/share-data";

describe("embed card", () => {
  it("builds a standalone html widget", () => {
    // TC-10c
    const data = resolveShareData("gpt-5-6-sol", 10_000_000, 5_000_000, 0.2);
    if (!data) throw new Error("missing share data");
    const html = buildEmbedHtml(data, "https://tokenbibi.example.com", "model=gpt-5-6-sol");
    expect(html).toContain("token比比");
    expect(html).toContain("GPT-5.6 Sol");
    expect(html).toContain("查看完整对比");
    expect(html).toContain("https://tokenbibi.example.com/share?model=gpt-5-6-sol");
  });
});

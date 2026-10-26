import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("seo routes", () => {
  it("includes core pages and model detail pages in the sitemap", () => {
    // TC-7a / TC-8a (SEO smoke)
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith("/models"))).toBe(true);
    expect(urls.some((url) => url.includes("/models/gpt-5-6-sol"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/calculator"))).toBe(true);
  });

  it("exposes robots with a sitemap reference", () => {
    // TC-7a (SEO smoke)
    const result = robots();
    expect(result.sitemap).toContain("/sitemap.xml");
    expect(result.rules).toBeTruthy();
  });
});

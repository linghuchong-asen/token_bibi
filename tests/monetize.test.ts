// 文件用途：商业化基础设施的单测（所属模块：tests）
// 覆盖：限流器（/api/prices 免费层）、价格新鲜度分层（/data-status 与横幅）、
// AFF 出站链接助手（rel=sponsored 合规）、销售线索校验（/api/leads）。
// 收入入口的每一块地基都要有回归保护——盈利功能坏了比不赚钱更伤信任。
import { describe, expect, it } from "vitest";
import { checkRateLimit, sweepExpiredEntries, RATE_LIMIT_FREE_PER_MINUTE } from "@/lib/rate-limit";
import { priceFreshness, freshnessSummary, FRESH_DAYS, STALE_DAYS } from "@/lib/freshness";
import type { Price } from "@/data/types";
import { hasAffiliateRelation, providerOutboundRel, providerOutboundUrl } from "@/lib/commercial";
import { leadSchema } from "@/lib/leads";

describe("rate limit", () => {
  it("allows requests within the window then blocks", () => {
    const store = new Map();
    const start = 1_700_000_000_000;
    for (let i = 0; i < RATE_LIMIT_FREE_PER_MINUTE; i += 1) {
      expect(checkRateLimit(store, "ip", RATE_LIMIT_FREE_PER_MINUTE, start).allowed).toBe(true);
    }
    const blocked = checkRateLimit(store, "ip", RATE_LIMIT_FREE_PER_MINUTE, start + 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("opens a fresh window after reset", () => {
    const store = new Map();
    const start = 1_700_000_000_000;
    for (let i = 0; i < RATE_LIMIT_FREE_PER_MINUTE; i += 1) {
      checkRateLimit(store, "ip", RATE_LIMIT_FREE_PER_MINUTE, start);
    }
    expect(checkRateLimit(store, "ip", RATE_LIMIT_FREE_PER_MINUTE, start + 1_000).allowed).toBe(false);
    // 窗口（60 秒）过后重新放行
    expect(checkRateLimit(store, "ip", RATE_LIMIT_FREE_PER_MINUTE, start + 61_000).allowed).toBe(true);
  });

  it("isolates buckets per key", () => {
    const store = new Map();
    const start = 1_700_000_000_000;
    checkRateLimit(store, "ip-a", 1, start);
    expect(checkRateLimit(store, "ip-b", 1, start).allowed).toBe(true);
    expect(checkRateLimit(store, "ip-a", 1, start).allowed).toBe(false);
  });

  it("sweeps expired windows so the store cannot grow without bound", () => {
    // 回归：公开 API 会被扫描器打进来，每个 IP 一条记录，不清理就是内存泄漏
    const store = new Map();
    const start = 1_700_000_000_000;
    for (let i = 0; i < 50; i += 1) {
      checkRateLimit(store, `ip-${i}`, RATE_LIMIT_FREE_PER_MINUTE, start);
    }
    expect(store.size).toBe(50);
    // 窗口过期后清理应移除全部过期条目
    expect(sweepExpiredEntries(store, start + 61_000)).toBe(0);
    expect(store.size).toBe(0);
  });
});

const price = (overrides: Partial<Price> = {}): Price => ({
  id: "p",
  providerId: "openrouter",
  modelId: "glm-5-3-flash",
  currency: "CNY",
  inputPricePerMTokens: 1,
  outputPricePerMTokens: 2,
  cacheReadPricePerMTokens: null,
  billingMode: "credit",
  rechargeRatio: null,
  modelMultiplier: null,
  groupMultiplier: null,
  stabilityScore: null,
  sourceUrl: "https://example.com",
  lastVerifiedAt: new Date("2026-10-26T00:00:00Z").toISOString(),
  dataStatus: "verified",
  verificationMethod: "source_check",
  ...overrides,
});

describe("price freshness", () => {
  const now = new Date("2026-10-26T12:00:00Z");

  it("treats recent verified prices as fresh", () => {
    const recent = price({ lastVerifiedAt: new Date(now.getTime() - FRESH_DAYS * 86_400_000).toISOString() });
    expect(priceFreshness(recent, now)).toBe("fresh");
  });

  it("treats 3-7 day old prices as aging", () => {
    const aging = price({ lastVerifiedAt: new Date(now.getTime() - 5 * 86_400_000).toISOString() });
    expect(priceFreshness(aging, now)).toBe("aging");
  });

  it("treats prices older than the stale threshold as stale", () => {
    const stale = price({ lastVerifiedAt: new Date(now.getTime() - (STALE_DAYS + 1) * 86_400_000).toISOString() });
    expect(priceFreshness(stale, now)).toBe("stale");
  });

  it("returns unknown for sample data (no real verification semantics)", () => {
    expect(priceFreshness(price({ dataStatus: "sample" }), now)).toBe("unknown");
  });

  it("summarizes the worst level across the list", () => {
    const summary = freshnessSummary(
      [
        price({ id: "1", lastVerifiedAt: now.toISOString() }),
        price({ id: "2", lastVerifiedAt: new Date(now.getTime() - 30 * 86_400_000).toISOString() }),
        price({ id: "3", dataStatus: "sample" }),
      ],
      now,
    );
    expect(summary.level).toBe("stale");
    expect(summary.verified).toBe(2);
    expect(summary.staleCount).toBe(1);
    expect(summary.newestVerifiedAt).toBe(now.toISOString());
  });
});

describe("commercial outbound links", () => {
  it("falls back to the plain website when no affiliate link exists", () => {
    const provider = { websiteUrl: "https://example.com", affiliateUrl: null };
    expect(providerOutboundUrl(provider)).toBe("https://example.com");
    expect(providerOutboundRel(provider)).toBe("noreferrer");
    expect(hasAffiliateRelation(provider)).toBe(false);
  });

  it("uses the affiliate link with rel=sponsored when configured", () => {
    const provider = { websiteUrl: "https://example.com", affiliateUrl: "https://example.com/?ref=tokenbibi" };
    expect(providerOutboundUrl(provider)).toBe("https://example.com/?ref=tokenbibi");
    expect(providerOutboundRel(provider)).toBe("sponsored nofollow");
    expect(hasAffiliateRelation(provider)).toBe(true);
  });
});

describe("lead validation", () => {
  it("accepts a complete sponsor application", () => {
    const result = leadSchema.safeParse({
      product: "sponsor_slot",
      placement: "home",
      company: "某某 API 中转站",
      contact: "张三",
      email: "biz@example.com",
      budget: "¥1,000 / 月",
      message: "",
    });
    expect(result.success).toBe(true);
  });

  it("requires placement for sponsor products", () => {
    const result = leadSchema.safeParse({
      product: "sponsor_slot",
      company: "某某公司",
      contact: "张三",
      email: "biz@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an API subscription inquiry without placement", () => {
    const result = leadSchema.safeParse({
      product: "api_subscription",
      company: "数据公司",
      contact: "李四",
      email: "data@example.com",
      message: "想要全量历史价格",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid emails", () => {
    const result = leadSchema.safeParse({
      product: "api_subscription",
      company: "数据公司",
      contact: "李四",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

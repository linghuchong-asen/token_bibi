// 文件用途：幽灵核验降级逻辑的单测（所属模块：tests，对应 scripts/lib/source-check.mjs）
// 场景背景：2026-10-26 实测发现 openrouter-qwen3-8-max-credit 在源站下架后仍挂着
// "已核验"徽章，由此新增 demoteStaleVerifiedPrices；本文件锁定该行为的回归。
import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { demoteStaleVerifiedPrices } from "../scripts/lib/source-check.mjs";

const verified = (overrides = {}) => ({
  id: "openrouter-test-credit",
  providerId: "openrouter",
  dataStatus: "verified",
  verificationMethod: "source_check",
  inputPricePerMTokens: 1,
  outputPricePerMTokens: 2,
  cacheReadPricePerMTokens: 0.1,
  ...overrides,
});

describe("demote stale verified prices", () => {
  it("keeps verified prices the live source still agrees with", () => {
    const price = verified();
    const freshById = new Map([[price.id, { ...price }]]);
    const result = demoteStaleVerifiedPrices([price], freshById);
    expect(result.demotedIds).toEqual([]);
    expect(result.prices[0].dataStatus).toBe("verified");
  });

  it("demotes verified prices that no longer exist on the source (ghost verification)", () => {
    // 真实案例：openrouter-qwen3-8-max-credit 模型已下架，库里还挂着已核验
    const price = verified();
    const freshById = new Map(); // 源上找不到
    const result = demoteStaleVerifiedPrices([price], freshById);
    expect(result.demotedIds).toEqual([price.id]);
    expect(result.prices[0].dataStatus).toBe("pending_review");
    expect(result.prices[0].verificationMethod).toBeNull();
  });

  it("demotes verified prices whose values drifted on the source", () => {
    const price = verified();
    const freshById = new Map([[price.id, { ...price, outputPricePerMTokens: 3 }]]);
    const result = demoteStaleVerifiedPrices([price], freshById);
    expect(result.demotedIds).toEqual([price.id]);
    expect(result.prices[0].dataStatus).toBe("pending_review");
  });

  it("ignores pending and sample records", () => {
    const pending = verified({ id: "a", dataStatus: "pending_review" });
    const sample = verified({ id: "b", dataStatus: "sample" });
    const freshById = new Map(); // 源上都没有
    const result = demoteStaleVerifiedPrices([pending, sample], freshById);
    expect(result.demotedIds).toEqual([]);
    // mjs 模块无类型信息，这里显式标注回调参数避免隐式 any
    expect(result.prices.map((item: { dataStatus: string }) => item.dataStatus)).toEqual(["pending_review", "sample"]);
  });
});

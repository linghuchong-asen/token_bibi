import { describe, expect, it } from "vitest";
import { estimatePlanUsageCost, estimateSubscriptionPlan, estimateUsageCost, parseRechargeMultiplier } from "@/lib/pricing";
import type { SubscriptionPlan } from "@/data/types";

describe("pricing", () => {
  it("parses recharge ratios into a cash multiplier", () => {
    // TC-2c / TC-3a
    expect(parseRechargeMultiplier("1 CNY = 1.2 credits")).toBeCloseTo(1 / 1.2, 8);
    expect(parseRechargeMultiplier("1 元 = 1 额度")).toBe(1);
    expect(parseRechargeMultiplier(null)).toBe(1);
  });

  it("estimates pay-as-you-go usage cost", () => {
    // TC-2a / TC-3b
    const price = {
      inputPricePerMTokens: 1,
      outputPricePerMTokens: 2,
      cacheReadPricePerMTokens: 0.5,
      billingMode: "pay_as_you_go" as const,
      rechargeRatio: null,
      modelMultiplier: 1,
      groupMultiplier: 1,
    };
    const estimate = estimateUsageCost(price, 1_000_000, 500_000, 0);
    expect(estimate.inputCost).toBeCloseTo(1, 8);
    expect(estimate.outputCost).toBeCloseTo(1, 8);
    expect(estimate.totalCost).toBeCloseTo(2, 8);
  });

  it("applies cache discount and credit multiplier", () => {
    // TC-3a / TC-3c
    const price = {
      inputPricePerMTokens: 1,
      outputPricePerMTokens: 2,
      cacheReadPricePerMTokens: 0.25,
      billingMode: "credit" as const,
      rechargeRatio: "1 CNY = 1.2 credits",
      modelMultiplier: 1.2,
      groupMultiplier: 0.8,
    };
    const estimate = estimateUsageCost(price, 1_000_000, 1_000_000, 0.5);
    const multiplier = (1 / 1.2) * 1.2 * 0.8;
    const expectedInput = (500_000 / 1_000_000) * multiplier + (500_000 / 1_000_000) * 0.25 * multiplier;
    const expectedOutput = (1_000_000 / 1_000_000) * 2 * multiplier;
    expect(estimate.inputCost).toBeCloseTo(expectedInput, 8);
    expect(estimate.outputCost).toBeCloseTo(expectedOutput, 8);
  });

  it("calculates subscription effective cost and break-even point", () => {
    // TC-4a / TC-4b
    const plan: SubscriptionPlan = {
      id: "test-plan",
      providerId: "test",
      name: "Test Plan",
      price: 50,
      currency: "CNY",
      period: "month",
      quota: 10_000_000,
      quotaUnit: "tokens",
      resetCycle: "monthly",
      modelScope: ["*"],
      overageRule: "按量",
      purchaseLimit: null,
      sourceUrl: "https://example.com",
      lastVerifiedAt: "2026-10-21T10:00:00+08:00",
      dataStatus: "sample",
    };
    const estimate = estimateSubscriptionPlan(plan, 5);
    expect(estimate.monthlyPriceCny).toBe(50);
    expect(estimate.effectivePerMillion).toBe(5);
    expect(estimate.breakEvenTokens).toBe(10_000_000);
  });

  it("adds overage when usage exceeds a plan quota", () => {
    // TC-4c
    const plan: SubscriptionPlan = {
      id: "quota-plan",
      providerId: "test",
      name: "Quota Plan",
      price: 50,
      currency: "CNY",
      period: "month",
      quota: 10_000_000,
      quotaUnit: "tokens",
      resetCycle: "monthly",
      modelScope: ["*"],
      overageRule: "按量",
      purchaseLimit: null,
      sourceUrl: "https://example.com",
      lastVerifiedAt: "2026-10-21T10:00:00+08:00",
      dataStatus: "sample",
    };
    expect(estimatePlanUsageCost(plan, 15_000_000, 5)).toBe(75);
  });
});

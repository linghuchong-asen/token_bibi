// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreditCalculator } from "@/components/CreditCalculator";
import type { RechargeRule } from "@/data/types";

const rules: RechargeRule[] = [
  {
    id: "test-rule",
    providerId: "test",
    currency: "CNY",
    rechargeRatio: "1 CNY = 1.2 credits",
    minimumTopUp: 10,
    discount: null,
    balanceExpiry: null,
    refundable: false,
    allowedModels: ["*"],
    sourceUrl: "https://example.com",
    lastVerifiedAt: "2026-10-21T10:00:00+08:00",
    dataStatus: "sample",
  },
];

describe("CreditCalculator", () => {
  it("renders the recharge conversion result", () => {
    // TC-5a / TC-6a
    render(<CreditCalculator rules={rules} />);
    expect(screen.getByText("积分 / 额度换算")).toBeTruthy();
    expect(screen.getByText("120.00 credits")).toBeTruthy();
  });
});

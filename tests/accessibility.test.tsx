// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { ModelsExplorer } from "@/components/ModelsExplorer";
import { CreditCalculator } from "@/components/CreditCalculator";
import { enrichPrices } from "@/lib/enrich";
import { prices, rechargeRules } from "@/data";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

describe("accessibility smoke", () => {
  it("has labelled controls and a semantic table", () => {
    // TC-12b / TC-12d
    render(<ModelsExplorer rows={enrichPrices(prices)} />);
    const search = screen.getByLabelText("搜索");
    expect(search).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    search.focus();
    expect(document.activeElement).toBe(search);
  });

  it("has no basic axe violations in the model explorer", async () => {
    // TC-12c
    const { container } = render(<ModelsExplorer rows={enrichPrices(prices)} />);
    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  }, 20000);

  it("has labelled recharge controls", () => {
    // TC-12b
    render(<CreditCalculator rules={rechargeRules} />);
    expect(screen.getByLabelText("充值规则")).toBeTruthy();
    expect(screen.getByLabelText("充值金额（元）")).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CalculatorClient } from "@/components/CalculatorClient";
import { models, plans, prices, providers } from "@/data";
import { enrichPrices } from "@/lib/enrich";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

describe("CalculatorClient", () => {
  it("renders a recommendation and updates with model selection", () => {
    // TC-6a / TC-7a
    render(<CalculatorClient models={models} providers={providers} prices={enrichPrices(prices)} plans={plans} />);
    expect(screen.getByText("推荐路径")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("模型"), { target: { value: "glm-5-3-flash" } });
    expect(screen.getByText("GLM-5.3 Flash")).toBeTruthy();
  });

  it("updates the usage estimate when input tokens change", () => {
    // TC-6a / TC-6c
    render(<CalculatorClient models={models} providers={providers} prices={enrichPrices(prices)} plans={plans} />);
    const input = screen.getByLabelText("月输入 tokens");
    fireEvent.change(input, { target: { value: "20000000" } });
    expect((input as HTMLInputElement).value).toBe("20000000");
  });
});

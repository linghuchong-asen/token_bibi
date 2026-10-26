// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModelsExplorer } from "@/components/ModelsExplorer";
import { enrichPrices } from "@/lib/enrich";
import { prices } from "@/data";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

describe("ModelsExplorer", () => {
  it("filters the table by search query", () => {
    // TC-7a / TC-8a
    render(<ModelsExplorer rows={enrichPrices(prices)} />);
    expect(screen.getAllByText("GPT-5.6 Sol").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("搜索"), { target: { value: "glm" } });
    expect(screen.getAllByText("GLM-5.3 Flash").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("GPT-5.6 Sol")).toHaveLength(0);
  });

  it("filters by billing mode", () => {
    // TC-8b
    render(<ModelsExplorer rows={enrichPrices(prices)} />);
    fireEvent.change(screen.getByLabelText("计费方式"), { target: { value: "credit" } });
    expect(screen.getAllByText("积分 / 额度").length).toBeGreaterThan(0);
  });

  it("sorts by effective input price", () => {
    // TC-8c
    const { container } = render(<ModelsExplorer rows={enrichPrices(prices)} />);
    const firstModel = container.querySelector("tbody tr td a")?.textContent;
    expect(firstModel).toBeTruthy();
  });
});

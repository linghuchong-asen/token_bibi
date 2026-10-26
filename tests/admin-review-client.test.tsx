// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminReviewClient } from "@/components/AdminReviewClient";
import type { EnrichedPrice } from "@/data/types";

const row = {
  id: "openrouter-test-credit",
  providerId: "openrouter",
  modelId: "test-model",
  inputPricePerMTokens: 1,
  outputPricePerMTokens: 2,
  sourceUrl: "https://openrouter.ai/api/v1/models",
  provider: { name: "OpenRouter" },
  model: { name: "Test Model" },
} as unknown as EnrichedPrice;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin review client", () => {
  it("states that verification needs a manual release", () => {
    render(<AdminReviewClient initialRows={[row]} />);

    expect(screen.getByRole("note").textContent).toContain("核验不会自动上线");
    expect(screen.getByText("核验后的发布步骤")).toBeTruthy();
    expect(screen.getByText("npm run build && systemctl restart token-bibi-app.service")).toBeTruthy();
    expect((screen.getByRole("button", { name: "标记已核验" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("marks a row verified and keeps the release warning visible", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminReviewClient initialRows={[row]} />);

    fireEvent.change(screen.getByLabelText("ADMIN_TOKEN"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "标记已核验" }));

    await waitFor(() => expect(screen.queryByText("openrouter-test-credit")).toBeNull());
    expect(screen.getByText(/前台尚未更新/)).toBeTruthy();
    expect(screen.getByText("待发布")).toBeTruthy();
    expect(screen.getByText(/本次已核验 1 条/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/prices/verify", expect.objectContaining({ method: "POST" }));
  });

  it("shows a readable message for an authentication failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 })));
    render(<AdminReviewClient initialRows={[row]} />);

    fireEvent.change(screen.getByLabelText("ADMIN_TOKEN"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "标记已核验" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("ADMIN_TOKEN 不正确"));
  });
});

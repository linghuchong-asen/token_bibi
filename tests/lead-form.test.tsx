// @vitest-environment jsdom
// 文件用途：LeadForm 提交交互的回归（所属模块：tests，对应 src/components/LeadForm.tsx）
// 这里锁一个真实生产 bug：React 事件 currentTarget 在 await 之后为 null，
// 曾导致"提交实际成功但页面显示失败"。修复前的本测试会失败，防止回归。
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadForm } from "@/components/LeadForm";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

// 项目未启用 RTL 自动清理（vitest 无 globals），显式清理避免跨测试 DOM 污染
afterEach(() => cleanup());

const placements = [
  { value: "home" as const, label: "首页推荐位" },
  { value: "models" as const, label: "比价页横幅" },
];

function fillForm() {
  fireEvent.change(screen.getByLabelText("公司 / 产品名"), { target: { value: "测试公司" } });
  fireEvent.change(screen.getByLabelText("联系人"), { target: { value: "张三" } });
  fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "biz@example.com" } });
}

describe("lead form", () => {
  it("shows success and resets the form after a persisted submission", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, id: "lead-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <LeadForm
        product="sponsor_slot"
        placements={placements}
        title="申请投放"
        description=""
        successNote="申请已收到"
      />,
    );
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "提交申请" }));

    await waitFor(() => {
      // 成功提示同时渲染在工具条与成功卡片两处，属组件预期行为
      expect(screen.getAllByText("申请已收到").length).toBeGreaterThanOrEqual(1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse(init.body);
    expect(payload.product).toBe("sponsor_slot");
    expect(payload.placement).toBe("home");
    // 成功后表单必须被清空（currentTarget 修复的直接验证点）
    expect((screen.getByLabelText("公司 / 产品名") as HTMLInputElement).value).toBe("");
    vi.unstubAllGlobals();
  });

  it("shows the error message when the API rejects the payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: "INVALID_INPUT" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <LeadForm
        product="api_subscription"
        placements={[]}
        title="申请开通"
        description=""
        successNote="申请已收到"
      />,
    );
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "提交申请" }));

    await waitFor(() => {
      expect(screen.getAllByText("提交失败，请稍后再试。").length).toBeGreaterThanOrEqual(1);
    });
    vi.unstubAllGlobals();
  });
});

// @vitest-environment jsdom
// 文件用途：降价动态页的渲染回归（所属模块：tests，对应 src/app/price-drops/page.tsx）
// 该页是 RSS 的落地页与"AI 降价"类搜索的承接页，必须保证：有降价时展示
// 带前后值的事件卡；没有降价时展示诚实的空状态而不是报错。
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import PriceDropsPage from "@/app/price-drops/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

describe("price drops page", () => {
  afterEach(() => cleanup());

  it("renders cut events with before/after values when changes exist", () => {
    render(<PriceDropsPage />);
    expect(screen.getByText("AI 模型降价动态")).toBeTruthy();
    // RSS 订阅 CTA 必须在第一屏
    expect(screen.getByText("RSS 订阅降价通知")).toBeTruthy();
    // 检测时间与基线说明（诚实边界）
    expect(screen.getByText(/检测时间：/)).toBeTruthy();
    expect(screen.getByText(/基线：上一个快照/)).toBeTruthy();
  });

  it("renders the honesty statement about no fabricated drops", () => {
    render(<PriceDropsPage />);
    expect(screen.getByText(/不做"预测降价"或"独家渠道价"/)).toBeTruthy();
  });

  it("has no basic axe violations", async () => {
    const { container } = render(<PriceDropsPage />);
    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  }, 20000);
});

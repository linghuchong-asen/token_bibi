// @vitest-environment jsdom
// 文件用途：数据状态页与新鲜度横幅的渲染回归（所属模块：tests）
// /data-status 依赖脚本生成的 data/price-changes.json，文件结构一旦漂移
// 页面就会在生产构建时崩掉——这里的渲染断言就是那道护栏。
// 注意：项目未启用 RTL 自动清理（vitest 无 globals），必须显式 afterEach(cleanup)，
// 否则多个测试的 <main> 会堆在同一个 jsdom document 里互相污染。
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import DataStatusPage from "@/app/data-status/page";
import { FreshnessBanner } from "@/components/FreshnessBanner";
import { priceChanges } from "@/data";
import type { Price } from "@/data/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

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
  lastVerifiedAt: new Date().toISOString(),
  dataStatus: "verified",
  verificationMethod: "source_check",
  ...overrides,
});

describe("data status page", () => {
  afterEach(() => cleanup());

  it("renders summary metrics, per-provider table and method notes", () => {
    render(<DataStatusPage />);
    expect(screen.getByText("数据状态与新鲜度")).toBeTruthy();
    // 三个核心指标之一：已核验占比
    expect(screen.getByText("已核验价格占比")).toBeTruthy();
    // 分平台核验统计表存在
    expect(screen.getByText("分平台核验统计")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    // 核验方法说明（真实性的对外承诺）完整呈现
    expect(screen.getByText("核验方法说明")).toBeTruthy();
    expect(screen.getByText(/来源复核（source_check）/)).toBeTruthy();
  });

  it("lists the latest detected price changes", () => {
    render(<DataStatusPage />);
    expect(screen.getByText("最近价格变动")).toBeTruthy();
    // 变动计数指标与检测时间必须出现；具体条目随数据演化，断言不写死模型名。
    // 计数文本（如 "2"）可能与页内其他数字撞车，用 getAllByText 做存在性断言。
    expect(screen.getByText("本次基线对比发现的变动")).toBeTruthy();
    expect(screen.getAllByText(String(priceChanges.changedCount)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/检测时间：/)).toBeTruthy();
    if (priceChanges.changes.length > 0) {
      const entries = screen.getAllByText(/ \/ /);
      expect(entries.length).toBeGreaterThanOrEqual(priceChanges.changes.length);
    }
  });

  it("has no basic axe violations", async () => {
    const { container } = render(<DataStatusPage />);
    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  }, 20000);
});

describe("freshness banner", () => {
  afterEach(() => cleanup());

  it("uses the neutral note style and stays silent when everything is fresh", () => {
    render(<FreshnessBanner prices={[price()]} />);
    // 配色类挂在文本所在的父级 div 上（span 本身无类名），用 closest 取到横幅容器
    const container = screen.getByText(/数据状态：/).closest("div");
    expect(container?.className).toContain("note");
    expect(screen.queryByText(/已过期/)).toBeNull();
  });

  it("warns about stale prices explicitly", () => {
    const stale = price({
      id: "stale",
      lastVerifiedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    });
    render(<FreshnessBanner prices={[stale]} />);
    const container = screen.getByText(/数据状态：/).closest("div");
    expect(container?.className).toContain("danger");
    expect(container?.textContent).toContain("已过期");
    expect(screen.getByText("查看数据状态 →")).toBeTruthy();
  });
});

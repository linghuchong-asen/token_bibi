// @vitest-environment node
// 文件用途：价格变动记录脚本的行为回归（所属模块：tests，对应 scripts/price-changelog.mjs）
// 该脚本产出 /data-status 页面的"最近价格变动"数据，判定逻辑必须锁死：
// 只报告基线里已存在的记录（新增不算变动）、浮点尾差不误报、字段级 diff 结构稳定。
// 通过子进程跑真实脚本 + 临时目录夹具，验证端到端行为而不是只测纯函数。
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

// 构造一个最小可运行的项目目录：data/prices.json + data/snapshots/<baseline>/prices.json
function buildFixtureProject() {
  const root = mkdtempSync(path.join(tmpdir(), "price-changelog-"));
  const baselinePrices = [
    {
      id: "openrouter-a-credit",
      providerId: "openrouter",
      modelId: "model-a",
      inputPricePerMTokens: 1.0,
      outputPricePerMTokens: 2.0,
      cacheReadPricePerMTokens: 0.1,
      billingMode: "credit",
      dataStatus: "verified",
    },
    {
      id: "openrouter-b-credit",
      providerId: "openrouter",
      modelId: "model-b",
      inputPricePerMTokens: 3,
      outputPricePerMTokens: 4,
      cacheReadPricePerMTokens: null,
      billingMode: "credit",
      dataStatus: "pending_review",
    },
  ];
  // 当前价格：a 调价（含浮点尾差 1e-13 级别）、b 不变；另有一条基线外的新增（不应报告）
  const currentPrices = [
    {
      ...baselinePrices[0],
      inputPricePerMTokens: 1.5 + 1e-13,
      outputPricePerMTokens: 2.0,
      dataStatus: "pending_review",
    },
    baselinePrices[1],
    {
      id: "openrouter-new-credit",
      providerId: "openrouter",
      modelId: "model-new",
      inputPricePerMTokens: 9,
      outputPricePerMTokens: 9,
      cacheReadPricePerMTokens: null,
      billingMode: "credit",
      dataStatus: "pending_review",
    },
  ];
  // 三个快照：基线取"上一个快照"（第二新的），语义是"本轮相对上一轮的变化"，
  // 而不是相对最旧快照的无界累积。最旧快照与上一个快照同内容（用于确认
  // 不会误选最旧的作为基线）。
  mkdirSync(path.join(root, "data", "snapshots", "2026-10-26T00-00-00"), { recursive: true });
  writeFileSync(path.join(root, "data", "snapshots", "2026-10-26T00-00-00", "prices.json"), JSON.stringify(baselinePrices));
  // 上一个快照：内容为"调价前"的旧数据——基线应取它而不是更旧的 26 日快照
  const previousPrices = [
    {
      ...baselinePrices[0],
      inputPricePerMTokens: 1.2,
      outputPricePerMTokens: 2.0,
      dataStatus: "verified",
    },
    baselinePrices[1],
  ];
  mkdirSync(path.join(root, "data", "snapshots", "2026-10-27T00-00-00"), { recursive: true });
  writeFileSync(path.join(root, "data", "snapshots", "2026-10-27T00-00-00", "prices.json"), JSON.stringify(previousPrices));
  // 最新快照：与当前 prices.json 相同的内容（本轮已留档）
  mkdirSync(path.join(root, "data", "snapshots", "2026-10-27T06-00-00"), { recursive: true });
  writeFileSync(path.join(root, "data", "snapshots", "2026-10-27T06-00-00", "prices.json"), JSON.stringify(currentPrices));
  writeFileSync(path.join(root, "data", "prices.json"), JSON.stringify(currentPrices));
  return root;
}

describe("price changelog script", () => {
  it("reports only real changes for baseline records and ignores float noise", () => {
    const root = buildFixtureProject();
    try {
      const scriptPath = path.join(process.cwd(), "scripts", "price-changelog.mjs");
      execFileSync("node", [scriptPath], { cwd: root, encoding: "utf8" });
      const report = JSON.parse(readFileSync(path.join(root, "data", "price-changes.json"), "utf8"));
      // 只有 a 调价（浮点尾差不构成变动）；b 不变不报告；新增记录不属于变动
      expect(report.changedCount).toBe(1);
      expect(report.changes[0].priceId).toBe("openrouter-a-credit");
      const fields = report.changes[0].changes.map((change: { field: string }) => change.field);
      expect(fields).toContain("inputPricePerMTokens");
      expect(fields).toContain("dataStatus");
      expect(report.changes[0].changes.find((change: { field: string }) => change.field === "inputPricePerMTokens").to).toBeCloseTo(1.5, 12);
      // 基线必须是"上一个快照"（27 日），而不是最旧的 26 日快照
      expect(report.baseline).toBe("2026-10-27T00-00-00");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails loudly when no snapshots exist", () => {
    const root = mkdtempSync(path.join(tmpdir(), "price-changelog-empty-"));
    try {
      mkdirSync(path.join(root, "data"), { recursive: true });
      writeFileSync(path.join(root, "data", "prices.json"), "[]");
      const scriptPath = path.join(process.cwd(), "scripts", "price-changelog.mjs");
      expect(() => execFileSync("node", [scriptPath], { cwd: root, encoding: "utf8" })).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

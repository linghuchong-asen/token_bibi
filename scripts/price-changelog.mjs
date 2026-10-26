// 文件用途：价格变动记录生成器（所属模块：数据采集与核验管线 scripts/）
// 对比"基线快照"与当前 data/prices.json，把真实发生的价格变化 / 核验状态变化
// 写入 data/price-changes.json，供 /data-status 页面展示"最近价格变动"和 RSS 订阅。
//
// 为什么需要它：实时性的核心不是"天天采集"，而是"让用户看到价格确实在动、
// 动了多少、什么时候发现的"。这张变动记录是源站漂移的产品化证据。
//
// 基线取"上一个快照"（第二新的），而不是最旧的：固定最旧快照会让变动清单
// 随时间无限增长，"最近变动"就不再是最近；上一个快照的语义永远是
// "这一轮采集相对上一轮发生了什么"。只有一个快照时退化为与它对比。
//
// 用法：
//   node scripts/price-changelog.mjs                 # 基线 = 上一个快照
//   node scripts/price-changelog.mjs --baseline <dir>  # 指定基线快照目录
// 每日管线顺序：采集 → 导入 → demote-stale → 生成变动记录 → 生成价格历史 → 快照。
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const snapshotRoot = path.join(root, "data", "snapshots");
const outputPath = path.join(root, "data", "price-changes.json");

// 参与比对的字段：价格三字段 + 计费模式 + 核验状态。
// 充值/倍率类字段也会影响到手成本，但当前采集器不产出它们的变化，先不纳入。
const COMPARED_FIELDS = [
  "inputPricePerMTokens",
  "outputPricePerMTokens",
  "cacheReadPricePerMTokens",
  "billingMode",
  "dataStatus",
];

// 数字字段用近似相等判断：浮点经过 CSV 往返可能出现 1e-13 级别的尾差，
// 逐位比较会把同价误报成变动，污染变动记录的可信度。
function sameValue(a, b) {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-9;
  return (a ?? null) === (b ?? null);
}

async function resolveBaselineDir(explicit) {
  if (explicit) return path.resolve(root, explicit);
  const entries = await readdir(snapshotRoot, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (dirs.length === 0) throw new Error(`没有可用快照目录：${snapshotRoot}`);
  // 第二新的快照 = "上一个快照"；只有一个快照时只能与它自己对比
  return path.join(snapshotRoot, dirs.length >= 2 ? dirs[dirs.length - 2] : dirs[0]);
}

const args = process.argv.slice(2);
const baselineIndex = args.indexOf("--baseline");
const baselineDir = await resolveBaselineDir(baselineIndex >= 0 ? args[baselineIndex + 1] : undefined);

const baselinePrices = JSON.parse(await readFile(path.join(baselineDir, "prices.json"), "utf8"));
const currentPrices = JSON.parse(await readFile(path.join(root, "data", "prices.json"), "utf8"));

// 以 baseline 为准建立索引；只报告"基线里存在"的记录，新增价格属于覆盖面扩大而非变动。
const baselineById = new Map(baselinePrices.map((price) => [price.id, price]));
const changes = [];
for (const price of currentPrices) {
  const before = baselineById.get(price.id);
  if (!before) continue;
  const diffs = COMPARED_FIELDS.filter((field) => !sameValue(before[field], price[field]))
    .map((field) => ({ field, from: before[field] ?? null, to: price[field] ?? null }));
  if (diffs.length === 0) continue;
  changes.push({
    priceId: price.id,
    providerId: price.providerId,
    modelId: price.modelId,
    changes: diffs,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  baseline: path.basename(baselineDir),
  comparedFields: COMPARED_FIELDS,
  changedCount: changes.length,
  changes,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`price changes: ${changes.length} (baseline ${report.baseline}) -> ${path.relative(root, outputPath)}`);
for (const change of changes) {
  const detail = change.changes.map((diff) => `${diff.field}: ${diff.from} -> ${diff.to}`).join("; ");
  console.log(`  ${change.priceId}: ${detail}`);
}

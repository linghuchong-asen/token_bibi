// 文件用途：价格历史序列生成器（所属模块：数据采集与核验管线 scripts/）
// 遍历 data/snapshots 下全部快照 + 当前 data/prices.json，为每条价格
// 构建时间序列，写入 data/price-history.json，供模型详情页渲染"价格走势"。
//
// 为什么需要它：用户对"实时"最直观的感知不是核验徽章，而是看得见价格曲线。
// 历史点会随每日快照自动累积；内容与上一点完全相同的快照会被去重跳过，
// 避免文件随天数线性膨胀而信息量为零。
//
// 每日管线顺序：采集 → 导入 → demote-stale → changelog → history → 快照。
// history 放在快照之前：当前数据作为最新点写入，下一次运行时今天的快照
// 自然成为历史点。
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const snapshotRoot = path.join(root, "data", "snapshots");
const outputPath = path.join(root, "data", "price-history.json");

// 序列只保留与走势有关的字段，控制文件体积
function toTrendPoint(price) {
  return {
    in: price.inputPricePerMTokens,
    out: price.outputPricePerMTokens,
    cache: price.cacheReadPricePerMTokens,
    status: price.dataStatus,
  };
}

async function readSnapshotPoint(dirName) {
  const dir = path.join(snapshotRoot, dirName);
  const prices = JSON.parse(await readFile(path.join(dir, "prices.json"), "utf8"));
  let capturedAt = dirName;
  try {
    const manifest = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8"));
    if (manifest.createdAt) capturedAt = manifest.createdAt;
  } catch {
    // manifest 缺失时用目录名兜底（目录名本身就含时间戳）
  }
  const trend = {};
  for (const price of prices) trend[price.id] = toTrendPoint(price);
  return { snapshot: dirName, capturedAt, prices: trend };
}

const entries = await readdir(snapshotRoot, { withFileTypes: true });
const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

const points = [];
let previousSerialized = null;
for (const dirName of dirs) {
  const point = await readSnapshotPoint(dirName);
  // 与上一点完全一致的快照跳过：历史曲线只保留"真的动过"的时刻
  const serialized = JSON.stringify(point.prices);
  if (serialized === previousSerialized) continue;
  previousSerialized = serialized;
  points.push(point);
}

// 当前库内数据永远是最后一个点（即使与最新快照一致，也保留 current 标记）
const currentPrices = JSON.parse(await readFile(path.join(root, "data", "prices.json"), "utf8"));
const currentTrend = {};
for (const price of currentPrices) currentTrend[price.id] = toTrendPoint(price);
points.push({ snapshot: "current", capturedAt: new Date().toISOString(), prices: currentTrend });

const report = { generatedAt: new Date().toISOString(), pointCount: points.length, points };
await writeFileSafe(report);
console.log(`price history: ${points.length} points -> ${path.relative(root, outputPath)}`);

async function writeFileSafe(report) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

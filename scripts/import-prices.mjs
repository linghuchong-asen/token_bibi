import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv, rowsToObjects } from "./lib/csv.mjs";
import { mergePriceRecord } from "./lib/prices.mjs";

const root = process.cwd();
const dataDir = path.join(root, "data");
const fileArgIndex = process.argv.indexOf("--file");
const importFile = fileArgIndex >= 0
  ? path.resolve(process.cwd(), process.argv[fileArgIndex + 1])
  : path.join(dataDir, "imports", "prices.csv");
const providers = JSON.parse(await readFile(path.join(dataDir, "providers.json"), "utf8"));
const models = JSON.parse(await readFile(path.join(dataDir, "models.json"), "utf8"));
const pricesPath = path.join(dataDir, "prices.json");
const existing = JSON.parse(await readFile(pricesPath, "utf8"));
const providerIds = new Set(providers.map((item) => item.id));
const modelIds = new Set(models.map((item) => item.id));

const csv = await readFile(importFile, "utf8");
const rows = rowsToObjects(parseCsv(csv));
const required = ["providerId", "modelId", "inputPricePerMTokens", "outputPricePerMTokens", "billingMode", "sourceUrl", "lastVerifiedAt"];
for (const row of rows) {
  for (const key of required) {
    if (!row[key]) throw new Error(`missing ${key} for ${row.providerId ?? "unknown"}/${row.modelId ?? "unknown"}`);
  }
  if (!providerIds.has(row.providerId)) throw new Error(`unknown provider: ${row.providerId}`);
  if (!modelIds.has(row.modelId)) throw new Error(`unknown model: ${row.modelId}`);
}

const merged = new Map(existing.map((item) => [item.id, item]));
let preservedVerified = 0;
for (const row of rows) {
  const id = row.id || `${row.providerId}-${row.modelId}-${row.billingMode}`;
  const incoming = {
    id,
    providerId: row.providerId,
    modelId: row.modelId,
    currency: row.currency || "CNY",
    inputPricePerMTokens: Number(row.inputPricePerMTokens),
    outputPricePerMTokens: Number(row.outputPricePerMTokens),
    cacheReadPricePerMTokens: row.cacheReadPricePerMTokens ? Number(row.cacheReadPricePerMTokens) : null,
    billingMode: row.billingMode,
    rechargeRatio: row.rechargeRatio || null,
    modelMultiplier: row.modelMultiplier ? Number(row.modelMultiplier) : null,
    groupMultiplier: row.groupMultiplier ? Number(row.groupMultiplier) : null,
    stabilityScore: row.stabilityScore ? Number(row.stabilityScore) : null,
    sourceUrl: row.sourceUrl,
    lastVerifiedAt: row.lastVerifiedAt,
    dataStatus: row.dataStatus || "pending_review",
    verificationMethod: row.verificationMethod || null,
  };
  const previous = merged.get(id);
  const record = mergePriceRecord(previous, incoming);
  if (previous?.dataStatus === "verified" && record.dataStatus === "verified" && record.lastVerifiedAt === previous.lastVerifiedAt) {
    preservedVerified += 1;
  }
  merged.set(id, record);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
await mkdir(path.join(dataDir, "imports", "backups"), { recursive: true });
await writeFile(path.join(dataDir, "imports", "backups", `prices-${timestamp}.json`), `${JSON.stringify(existing, null, 2)}\n`, "utf8");
await writeFile(pricesPath, `${JSON.stringify(Array.from(merged.values()), null, 2)}\n`, "utf8");
console.log(`imported ${rows.length} rows; total prices: ${merged.size}; preserved verified: ${preservedVerified}`);

import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeOpenRouterModel, toCsv } from "./lib/openrouter.mjs";

const root = process.cwd();
const map = JSON.parse(await readFile(path.join(root, "data", "imports", "openrouter-map.json"), "utf8"));
const raw = execFileSync("curl", ["-L", "--max-time", "30", "-sS", "https://openrouter.ai/api/v1/models"], { encoding: "utf8" });
const payload = JSON.parse(raw);
const byId = new Map(payload.data.map((model) => [model.id, model]));
const now = new Date();
const rows = [];
for (const [modelId, openRouterId] of Object.entries(map)) {
  const source = byId.get(openRouterId);
  if (!source) {
    console.warn(`missing OpenRouter model: ${openRouterId}`);
    continue;
  }
  const row = normalizeOpenRouterModel(source, modelId, now);
  if (row) rows.push(row);
}
const out = path.join(root, "data", "imports", "openrouter-collected.csv");
await writeFile(out, toCsv(rows), "utf8");
console.log(`collected ${rows.length} OpenRouter prices -> ${out}`);

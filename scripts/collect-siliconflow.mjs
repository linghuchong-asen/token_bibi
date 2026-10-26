import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { toCsv } from "./lib/openrouter.mjs";
import { parseSiliconFlowRows } from "./lib/siliconflow.mjs";

const root = process.cwd();
const map = JSON.parse(await readFile(path.join(root, "data", "imports", "siliconflow-map.json"), "utf8"));
const html = execFileSync("curl", ["-L", "--max-time", "30", "-sS", "https://www.siliconflow.cn/pricing"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});
const rows = parseSiliconFlowRows(html, map);
const out = path.join(root, "data", "imports", "siliconflow-collected.csv");
await writeFile(out, toCsv(rows), "utf8");
console.log(`collected ${rows.length} SiliconFlow prices -> ${out}`);

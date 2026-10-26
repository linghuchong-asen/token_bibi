import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { toCsv } from "./lib/openrouter.mjs";
import { buildOfficialPriceRows, parseAnthropicPricing, parseZhipuPricing } from "./lib/official-pricing.mjs";

const root = process.cwd();
const anthropicHtml = execFileSync("curl", ["-L", "--max-time", "30", "-sS", "-A", "Mozilla/5.0", "https://claude.com/pricing"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});
const zhipuHtml = execFileSync("curl", ["-L", "--max-time", "30", "-sS", "-A", "Mozilla/5.0", "https://docs.bigmodel.cn/cn/guide/start/pricing"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});
const rows = buildOfficialPriceRows(parseAnthropicPricing(anthropicHtml), parseZhipuPricing(zhipuHtml));
if (rows.length === 0) throw new Error("official collector found no prices");
const out = path.join(root, "data", "imports", "official-collected.csv");
await writeFile(out, toCsv(rows), "utf8");
console.log(`collected ${rows.length} official prices -> ${out}`);

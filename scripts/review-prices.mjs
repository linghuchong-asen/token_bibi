import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { listPendingPrices, verifyPriceRecord } from "./lib/review.mjs";
import { buildFreshPriceMap, comparePendingPrice, formatCheckLine, isCheckablePrice, verifyMatchedPrices } from "./lib/source-check.mjs";

const root = process.cwd();
const pricesPath = path.join(root, "data", "prices.json");
const prices = JSON.parse(await readFile(pricesPath, "utf8"));
const args = process.argv.slice(2);

function backupAndWrite(nextPrices) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(root, "data", "imports", "backups");
  return mkdir(backupDir, { recursive: true })
    .then(() => writeFile(path.join(backupDir, `prices-before-review-${timestamp}.json`), `${JSON.stringify(prices, null, 2)}\n`, "utf8"))
    .then(() => writeFile(pricesPath, `${JSON.stringify(nextPrices, null, 2)}\n`, "utf8"));
}

async function freshPricesFor(checkable) {
  const openRouterMapPath = path.join(root, "data", "imports", "openrouter-map.json");
  const siliconFlowMapPath = path.join(root, "data", "imports", "siliconflow-map.json");
  const openRouterMap = JSON.parse(await readFile(openRouterMapPath, "utf8"));
  const siliconFlowMap = JSON.parse(await readFile(siliconFlowMapPath, "utf8"));
  let openRouterPayload;
  let siliconFlowHtml;
  if (checkable.some((price) => price.providerId === "openrouter")) {
    const raw = execFileSync("curl", ["-L", "--max-time", "30", "-sS", "https://openrouter.ai/api/v1/models"], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    openRouterPayload = JSON.parse(raw);
  }
  if (checkable.some((price) => price.providerId === "siliconflow")) {
    siliconFlowHtml = execFileSync("curl", ["-L", "--max-time", "30", "-sS", "https://www.siliconflow.cn/pricing"], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  }
  let anthropicPricingHtml;
  let zhipuPricingHtml;
  if (checkable.some((price) => price.providerId === "official-anthropic")) {
    anthropicPricingHtml = execFileSync("curl", ["-L", "--max-time", "30", "-sS", "-A", "Mozilla/5.0", "https://claude.com/pricing"], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  }
  if (checkable.some((price) => price.providerId === "official-zhipu")) {
    zhipuPricingHtml = execFileSync("curl", ["-L", "--max-time", "30", "-sS", "-A", "Mozilla/5.0", "https://docs.bigmodel.cn/cn/guide/start/pricing"], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  }
  return buildFreshPriceMap({ openRouterPayload, siliconFlowHtml, anthropicPricingHtml, zhipuPricingHtml, openRouterMap, siliconFlowMap });
}

function printCheckReport(checkable, freshById) {
  let failures = 0;
  let skipped = 0;
  for (const price of checkable) {
    const check = comparePendingPrice(price, freshById.get(price.id));
    const optionalSampleMissing = price.dataStatus === "sample" && check.status === "missing";
    if (optionalSampleMissing) {
      skipped += 1;
      console.log(`SKIP\t${price.id}\t来源中未找到对应模型，保留样例数据`);
      continue;
    }
    if (check.status !== "match") failures += 1;
    console.log(formatCheckLine(price, check));
  }
  console.log(`checked: ${checkable.length}; matched: ${checkable.length - failures - skipped}; skipped: ${skipped}; unmatched: ${failures}`);
  return failures;
}

if (args.includes("--check-sources") || args.includes("--verify-matched")) {
  const checkable = prices.filter(isCheckablePrice);
  if (checkable.length === 0) {
    console.log("no checkable prices");
    process.exit(0);
  }
  const freshById = await freshPricesFor(checkable);
  const failures = printCheckReport(checkable, freshById);
  if (args.includes("--verify-matched")) {
    const result = verifyMatchedPrices(prices, freshById, new Date(), ["pending_review", "sample"], isCheckablePrice);
    if (result.verifiedIds.length > 0) {
      await backupAndWrite(result.prices);
      console.log(`verified: ${result.verifiedIds.length}`);
      for (const id of result.verifiedIds) console.log(`  ${id}`);
    } else {
      console.log("verified: 0; no file changes");
    }
    if (result.unmatched.length > 0) {
      const skipped = result.unmatched.filter((item) => prices.find((price) => price.id === item.id)?.dataStatus === "sample" && item.status === "missing");
      const remaining = result.unmatched.filter((item) => !skipped.some((entry) => entry.id === item.id));
      if (skipped.length > 0) {
        console.log(`skipped samples: ${skipped.length}`);
        for (const item of skipped) console.log(`  ${item.id} (missing)`);
      }
      if (remaining.length > 0) {
        console.log(`left pending: ${remaining.length}`);
        for (const item of remaining) console.log(`  ${item.id} (${item.status})`);
      }
    }
  }
  process.exit(failures > 0 ? 1 : 0);
}

if (args.includes("--list") || args.length === 0) {
  const pending = listPendingPrices(prices);
  if (pending.length === 0) {
    console.log("no pending prices");
  } else {
    for (const price of pending) {
      console.log(`${price.id}\t${price.providerId}/${price.modelId}\t${price.inputPricePerMTokens}/${price.outputPricePerMTokens}\t${price.sourceUrl}`);
    }
  }
  console.log(`pending: ${pending.length}`);
  process.exit(0);
}

const verifyIndex = args.indexOf("--verify");
if (verifyIndex >= 0) {
  const id = args[verifyIndex + 1];
  if (!id) throw new Error("missing price id after --verify");
  const result = verifyPriceRecord(prices, id);
  if (!result.updated) throw new Error(`price not found: ${id}`);
  await backupAndWrite(result.prices);
  console.log(`verified: ${id}`);
  process.exit(0);
}

console.log("usage: npm run review:prices -- --list | --verify <price-id> | --check-sources | --verify-matched");
process.exit(1);

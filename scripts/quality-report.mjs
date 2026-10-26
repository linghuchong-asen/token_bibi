import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const read = async (file) => JSON.parse(await readFile(path.join(root, "data", file), "utf8"));
const models = await read("models.json");
const providers = await read("providers.json");
const prices = await read("prices.json");
const plans = await read("plans.json");
const rechargeRules = await read("recharge-rules.json");
const cardKeyRules = await read("card-key-rules.json");

const ids = new Set();
const duplicatePriceIds = [];
for (const price of prices) {
  if (ids.has(price.id)) duplicatePriceIds.push(price.id);
  ids.add(price.id);
}

const modelIds = new Set(models.map((item) => item.id));
const providerIds = new Set(providers.map((item) => item.id));
const pricedModels = new Set(prices.map((item) => item.modelId));
const pricedProviders = new Set(prices.map((item) => item.providerId));
const now = Date.now();
const staleCutoff = now - 30 * 24 * 60 * 60 * 1000;

const issues = {
  duplicatePriceIds,
  pendingReviewPrices: prices.filter((price) => price.dataStatus === "pending_review").map((price) => price.id),
  stalePrices: prices.filter((price) => Date.parse(price.lastVerifiedAt) < staleCutoff).map((price) => price.id),
  modelsWithoutPrices: models.filter((model) => !pricedModels.has(model.id)).map((model) => model.id),
  providersWithoutPrices: providers.filter((provider) => !pricedProviders.has(provider.id)).map((provider) => provider.id),
  orphanPrices: prices.filter((price) => !modelIds.has(price.modelId) || !providerIds.has(price.providerId)).map((price) => price.id),
  invalidPlans: plans.filter((plan) => !providerIds.has(plan.providerId)).map((plan) => plan.id),
  invalidRechargeRules: rechargeRules.filter((rule) => !providerIds.has(rule.providerId)).map((rule) => rule.id),
  invalidCardKeyRules: cardKeyRules.filter((rule) => !providerIds.has(rule.providerId)).map((rule) => rule.id),
};

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    models: models.length,
    providers: providers.length,
    prices: prices.length,
    plans: plans.length,
    rechargeRules: rechargeRules.length,
    cardKeyRules: cardKeyRules.length,
    pendingReview: issues.pendingReviewPrices.length,
    stalePrices: issues.stalePrices.length,
    modelsWithoutPrices: issues.modelsWithoutPrices.length,
    providersWithoutPrices: issues.providersWithoutPrices.length,
  },
  issues,
};

await writeFile(path.join(root, "data", "quality-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.summary, null, 2));

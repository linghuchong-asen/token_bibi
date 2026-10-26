// 文件用途：分享卡/嵌入卡的共享数据装配（所属模块：src/lib）
// 把"最便宜方案"的明细装配成两类分发面（PNG 分享卡、iframe 嵌入卡）共用的结构。
// 分发面会把我们的数据带到站外，所以必须携带核验状态与数据日期——
// 真实性承诺要随数据一起传播，而不是只留在站内页面里。
import { getModelBySlug, getPricesForModel } from "@/data";
import { enrichPrices } from "./enrich";
import { estimateUsageCost } from "./pricing";
import type { DataStatus, VerificationMethod } from "@/data/types";

export type ShareCardData = {
  modelName: string;
  providerName: string;
  inputTokens: number;
  outputTokens: number;
  cacheHitRate: number;
  totalCost: number;
  effectiveCostPerMillion: number;
  billingMode: string;
  // 展示所用价格的核验状态：PNG 卡的徽章与嵌入卡的脚注都从这里取值，
  // 不允许任何分发面脱离真实状态自行标注
  dataStatus: DataStatus;
  verificationMethod: VerificationMethod | null;
  lastVerifiedAt: string;
};

// 分发面的状态徽章文案：严格跟随真实核验状态，任何分发面都不允许硬编码
// （此前 PNG 分享卡固定写死"样例数据"，把已核验的新数据也说成样例）
export function shareStatusLabel(data: Pick<ShareCardData, "dataStatus" | "verificationMethod">): string {
  if (data.dataStatus === "verified") {
    return data.verificationMethod === "source_check" ? "已核验 · 来源复核" : "已核验 · 人工核验";
  }
  if (data.dataStatus === "pending_review") return "待核验";
  return "样例数据";
}

// 分发面脚注的数据日期（yyyy-MM-dd）；解析失败时返回"数据日期未知"而不是假日期
export function shareDataDate(data: Pick<ShareCardData, "lastVerifiedAt">): string {
  const date = new Date(data.lastVerifiedAt);
  if (Number.isNaN(date.getTime())) return "数据日期未知";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function resolveShareData(slug: string, inputTokens: number, outputTokens: number, cacheHitRate: number): ShareCardData | null {
  const model = getModelBySlug(slug);
  if (!model) return null;
  const prices = enrichPrices(getPricesForModel(model.id));
  if (prices.length === 0) return null;
  // 分享结论优先建立在已核验价格上（与比价页"默认只看已核验"同一原则）；
  // 只有完全不存在已核验价格时才回退到待核验/样例，并通过状态标注如实说明。
  const statusRank = (status: DataStatus) => (status === "verified" ? 0 : status === "pending_review" ? 1 : 2);
  const cheapest = [...prices].sort((a, b) => {
    const rankDiff = statusRank(a.dataStatus) - statusRank(b.dataStatus);
    if (rankDiff !== 0) return rankDiff;
    const ac = estimateUsageCost(a, inputTokens, outputTokens, cacheHitRate).totalCost;
    const bc = estimateUsageCost(b, inputTokens, outputTokens, cacheHitRate).totalCost;
    return ac - bc;
  })[0];
  if (!cheapest) return null;
  const estimate = estimateUsageCost(cheapest, inputTokens, outputTokens, cacheHitRate);
  return {
    modelName: model.name,
    providerName: cheapest.provider.name,
    inputTokens,
    outputTokens,
    cacheHitRate,
    totalCost: estimate.totalCost,
    effectiveCostPerMillion: estimate.effectiveCostPerMillion,
    billingMode: cheapest.billingMode,
    dataStatus: cheapest.dataStatus,
    verificationMethod: cheapest.verificationMethod ?? null,
    lastVerifiedAt: cheapest.lastVerifiedAt,
  };
}

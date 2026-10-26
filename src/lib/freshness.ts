// 文件用途：价格新鲜度计算库（所属模块：src/lib，被首页、/data-status、价格表共用）
// "数据新鲜度"是本产品对用户的核心承诺之一：每条价格都必须能回答
// "这是什么时候从源站确认的、现在还可信吗"。
// 这里的分层标准是产品级约定：fresh ≤3 天、aging 3-7 天、stale >7 天。
// 超过 7 天的已核验价格必须在 UI 上明示"请以源站为准"——宁可显得不完美，
// 也不能让过期数据冒充新鲜数据（真实性优先于好看）。
import type { Price } from "@/data/types";

export const FRESH_DAYS = 3;
export const STALE_DAYS = 7;

export type FreshnessLevel = "fresh" | "aging" | "stale" | "unknown";

export type FreshnessSummary = {
  total: number;
  verified: number;
  verifiedRatio: number;
  staleCount: number;
  agingCount: number;
  newestVerifiedAt: string | null;
  oldestVerifiedAt: string | null;
  level: "good" | "warning" | "stale";
};

const DAY_MS = 24 * 60 * 60 * 1000;

// 单条价格的新鲜度：样例数据没有真实核验时间语义，返回 unknown 交给徽章另行表达；
// 已核验/待核验按 lastVerifiedAt 距今天数分层。
export function priceFreshness(price: Pick<Price, "dataStatus" | "lastVerifiedAt">, now = new Date()): FreshnessLevel {
  if (price.dataStatus === "sample") return "unknown";
  const verifiedAt = new Date(price.lastVerifiedAt);
  if (Number.isNaN(verifiedAt.getTime())) return "unknown";
  const ageDays = (now.getTime() - verifiedAt.getTime()) / DAY_MS;
  if (ageDays <= FRESH_DAYS) return "fresh";
  if (ageDays <= STALE_DAYS) return "aging";
  return "stale";
}

export function freshnessSummary(list: Price[], now = new Date()): FreshnessSummary {
  const verifiedList = list.filter((price) => price.dataStatus === "verified");
  const verifiedTimes = verifiedList
    .map((price) => new Date(price.lastVerifiedAt).getTime())
    .filter((time) => !Number.isNaN(time));
  const staleCount = list.filter((price) => priceFreshness(price, now) === "stale").length;
  const agingCount = list.filter((price) => priceFreshness(price, now) === "aging").length;

  // 总体水位取"最差主要指标"：有过期价格直接 stale；有临近过期为 warning；
  // 否则视为 good。首页横幅据此决定配色和文案强度。
  const level: FreshnessSummary["level"] = staleCount > 0 ? "stale" : agingCount > 0 ? "warning" : "good";

  return {
    total: list.length,
    verified: verifiedList.length,
    verifiedRatio: list.length === 0 ? 0 : verifiedList.length / list.length,
    staleCount,
    agingCount,
    newestVerifiedAt: verifiedTimes.length > 0 ? new Date(Math.max(...verifiedTimes)).toISOString() : null,
    oldestVerifiedAt: verifiedTimes.length > 0 ? new Date(Math.min(...verifiedTimes)).toISOString() : null,
    level,
  };
}

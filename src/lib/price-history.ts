// 文件用途：价格历史序列读取与模型走势装配（所属模块：src/lib）
// 数据源是 scripts/price-history.mjs 生成的 data/price-history.json：
// 快照点 + 当前点，内容未变化的快照已被去重。模型详情页据此渲染
// "价格走势"——用户对实时性最直观的感知是看得见价格曲线。
import historyJson from "../../data/price-history.json";
import type { DataStatus } from "@/data/types";
import type { PriceChangeEntry } from "@/data/types";

export type HistoryTrendPoint = {
  in: number;
  out: number;
  cache: number | null;
  status: DataStatus;
};

export type HistoryPoint = {
  snapshot: string;
  capturedAt: string;
  // 不同快照点的键集不同（价格被移除后新快照不再包含该键），
  // 读取方必须用 seriesForPrice 的存在性守卫，不能直接假设每个键都有值
  prices: Record<string, HistoryTrendPoint | undefined>;
};

export type PriceHistoryReport = {
  generatedAt: string;
  pointCount: number;
  points: HistoryPoint[];
};

export const priceHistory = historyJson as PriceHistoryReport;

export type PriceSeries = {
  priceId: string;
  points: { capturedAt: string; trend: HistoryTrendPoint }[];
};

export type ModelPriceSeries = PriceSeries & {
  // 序列中价格是否真的动过（首末数值组合不同）
  changed: boolean;
};

// 单条价格的时间序列（升序）。库里没有历史的价格返回空序列。
export function seriesForPrice(priceId: string): PriceSeries["points"] {
  const series: PriceSeries["points"] = [];
  for (const point of priceHistory.points) {
    const trend = point.prices[priceId];
    if (trend) series.push({ capturedAt: point.capturedAt, trend });
  }
  return series;
}

// 一个模型下所有价格序列的汇总，供模型页"价格走势"区块使用。
// changed 标记序列中价格是否真的动过（≥2 个不同数值组合），
// 页面只对动过的价格画曲线，静态价格不给用户制造"在动"的错觉。
export function modelPriceSeries(priceIds: string[]): ModelPriceSeries[] {
  return priceIds
    .map((priceId) => ({ priceId, points: seriesForPrice(priceId) }))
    .filter((series) => series.points.length >= 2)
    .map((series) => ({
      ...series,
      // 用第一个与最后一个点的数值组合判断是否动过：中间抖动但回到原价的
      // 情况极少见，且首尾对比就是用户关心的"涨没涨"
      changed:
        series.points[0].trend.in !== series.points[series.points.length - 1].trend.in ||
        series.points[0].trend.out !== series.points[series.points.length - 1].trend.out,
    }));
}

// 从最近变动记录里找出"输入价或输出价出现下调"的模型集合。
// 降价对买方是好消息，比价列表用绿色"近日降价"徽章突出——实时性的营销钩子。
// 只认价格字段下调，核验状态/计费方式变化不触发。
export function recentlyCutModelIds(changes: PriceChangeEntry[]): Set<string> {
  const cut = new Set<string>();
  for (const change of changes) {
    const hasCut = change.changes.some(
      (diff) =>
        (diff.field === "inputPricePerMTokens" || diff.field === "outputPricePerMTokens") &&
        typeof diff.from === "number" &&
        typeof diff.to === "number" &&
        diff.to < diff.from,
    );
    if (hasCut) cut.add(change.modelId);
  }
  return cut;
}

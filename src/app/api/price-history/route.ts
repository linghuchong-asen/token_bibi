// 文件用途：价格历史序列 API（所属模块：src/app/api/price-history，Node 运行时）
// GET /api/price-history?model=<slug|id> —— 返回该模型所有价格的时间序列
// （来自每日快照 + 当前点）。免费层与 /api/prices 共用同一限流桶。
//
// 商业边界：免费层输出"当前已累积的序列"；Pro 层承诺的是更长窗口（30 天）、
// 全量导出与 Webhook 推送——meta 里明确写出，避免免费层稀释付费卖点。
import { NextResponse } from "next/server";
import { getModelById, getModelBySlug, getPricesForModel } from "@/data";
import { modelPriceSeries, priceHistory } from "@/lib/price-history";
import { checkRateLimit, RATE_LIMIT_FREE_PER_MINUTE, rateLimitStore } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const decision = checkRateLimit(rateLimitStore, `history:${clientIp}`, RATE_LIMIT_FREE_PER_MINUTE);
  const headers = {
    "X-RateLimit-Limit": String(RATE_LIMIT_FREE_PER_MINUTE),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": String(Math.ceil(decision.resetAt / 1000)),
  };
  if (!decision.allowed) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED", message: "免费层限 60 次/分钟；更高配额见 /data-api" },
      { status: 429, headers },
    );
  }

  const url = new URL(request.url);
  const modelParam = url.searchParams.get("model");
  if (!modelParam) {
    return NextResponse.json({ ok: false, error: "MISSING_MODEL", message: "请通过 ?model= 指定模型（slug 或 id）" }, { status: 400, headers });
  }
  const model = getModelBySlug(modelParam) ?? getModelById(modelParam);
  if (!model) {
    return NextResponse.json({ ok: false, error: "MODEL_NOT_FOUND" }, { status: 404, headers });
  }

  // 只输出"真的动过"的序列：静态价格对消费方没有信息量，还会放大响应体积。
  // 注意 modelPriceSeries 的入参是"价格 id 列表"（每条价格一条序列），不是模型 id。
  const modelPrices = getPricesForModel(model.id);
  const series = modelPriceSeries(modelPrices.map((price) => price.id)).filter((item) => item.changed);

  return NextResponse.json(
    {
      ok: true,
      meta: {
        generatedAt: new Date().toISOString(),
        model: model.id,
        snapshotPoints: priceHistory.pointCount,
        changedSeries: series.length,
        tier: "free",
        proHint: "Pro 层提供 30 天窗口、全量导出与 Webhook 推送，见 /data-api",
        attribution: "数据来源：token比比 (tokenbibi.example.com)，转载需署名",
      },
      data: series.map((item) => ({
        priceId: item.priceId,
        points: item.points.map((point) => ({
          capturedAt: point.capturedAt,
          inputPerM: point.trend.in,
          outputPerM: point.trend.out,
          cachePerM: point.trend.cache,
          dataStatus: point.trend.status,
        })),
      })),
    },
    { headers },
  );
}

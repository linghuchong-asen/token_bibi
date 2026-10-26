// 文件用途：公开价格数据 API（所属模块：src/app/api/prices，Node 运行时）
// GET /api/prices —— 盈利入口②的免费层：让第三方（博客、机器人、工具站）
// 直接消费我们的已核验价格数据，把 token比比 变成"AI 成本数据源"。
// 免费层：60 次/分钟/IP，要求署名；Pro 层（付费）将提供更高配额、
// 历史变动与 Webhook 推送——配额与套餐在 /data-api 页面公开。
//
// 为什么默认只返回已核验价格：对外输出的每一条数据都代表本站信誉，
// 样例/待核验数据必须显式传 status 才能拿到。
import { NextResponse } from "next/server";
import { getModelById, getModelBySlug, getProviderById, getProviderBySlug, prices } from "@/data";
import { freshnessSummary } from "@/lib/freshness";
import { checkRateLimit, RATE_LIMIT_FREE_PER_MINUTE, rateLimitStore } from "@/lib/rate-limit";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["verified", "pending_review", "sample"]);

export async function GET(request: Request) {
  // 限流先行：以最左侧转发 IP 为准（本地部署无代理时直接用对端地址）
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const decision = checkRateLimit(rateLimitStore, `prices:${clientIp}`, RATE_LIMIT_FREE_PER_MINUTE);
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
  const providerParam = url.searchParams.get("provider");
  const statusParam = url.searchParams.get("status") ?? "verified";
  const limitParam = Number(url.searchParams.get("limit") ?? 200);

  if (!VALID_STATUSES.has(statusParam)) {
    return NextResponse.json({ ok: false, error: "INVALID_STATUS", message: `status 仅支持 ${[...VALID_STATUSES, "all"].join(", ")}` }, { status: 400, headers });
  }

  // 支持传模型/平台的 id 或 slug，调用方不必知道内部主键约定
  const model = modelParam ? getModelBySlug(modelParam) ?? getModelById(modelParam) : undefined;
  const provider = providerParam ? getProviderBySlug(providerParam) ?? getProviderById(providerParam) : undefined;
  if (modelParam && !model) {
    return NextResponse.json({ ok: false, error: "MODEL_NOT_FOUND" }, { status: 404, headers });
  }
  if (providerParam && !provider) {
    return NextResponse.json({ ok: false, error: "PROVIDER_NOT_FOUND" }, { status: 404, headers });
  }

  const filtered = prices.filter((price) => {
    if (model && price.modelId !== model.id) return false;
    if (provider && price.providerId !== provider.id) return false;
    if (statusParam !== "all" && price.dataStatus !== statusParam) return false;
    return true;
  });

  const summary = freshnessSummary(prices);
  const data = filtered.slice(0, Math.min(Math.max(limitParam, 1), 500)).map((price) => ({
    provider: price.providerId,
    model: price.modelId,
    currency: price.currency,
    inputPricePerMTokens: price.inputPricePerMTokens,
    outputPricePerMTokens: price.outputPricePerMTokens,
    cacheReadPricePerMTokens: price.cacheReadPricePerMTokens,
    billingMode: price.billingMode,
    dataStatus: price.dataStatus,
    verificationMethod: price.verificationMethod ?? null,
    lastVerifiedAt: price.lastVerifiedAt,
    sourceUrl: price.sourceUrl,
  }));

  return NextResponse.json(
    {
      ok: true,
      meta: {
        generatedAt: new Date().toISOString(),
        count: data.length,
        // 数据水位随响应一起给出，消费方可以自证引用的是多新的数据
        verifiedRatio: Number(summary.verifiedRatio.toFixed(4)),
        newestVerifiedAt: summary.newestVerifiedAt,
        tier: "free",
        attribution: "数据来源：token比比 (tokenbibi.example.com)，转载需署名",
        pricing: "更高配额与历史变动数据见 /data-api",
      },
      data,
    },
    { headers },
  );
}

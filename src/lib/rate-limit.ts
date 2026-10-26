// 文件用途：进程内固定窗口限流器（所属模块：src/lib，被 /api/prices 使用）
// 免费公开 API 必须有限流，否则一次爬虫就能把 2 核 8G 的小机器打垮。
// 这里刻意做成纯函数 + 外部传入存储 Map：单测可以精确控制时间，
// 生产要换 Redis 时只需要替换存储实现，判定逻辑不变。
// 固定窗口（而非滑动窗口）在低精度场景足够：业务允许边界上 2 倍突发。
export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  // 窗口重置时间（Unix 毫秒），写入 X-RateLimit-Reset 响应头
  resetAt: number;
};

const windowMs = 60_000;

export function checkRateLimit(
  store: Map<string, { count: number; windowStart: number }>,
  key: string,
  limit: number,
  now = Date.now(),
): RateLimitDecision {
  const entry = store.get(key);
  // 窗口过期则重开新窗口；未过期且没超限则计数 +1
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowMs };
  }
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.windowStart + windowMs };
}

export const RATE_LIMIT_FREE_PER_MINUTE = 60;
export const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

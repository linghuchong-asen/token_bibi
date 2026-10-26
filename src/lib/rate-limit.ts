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

// 清理阈值：条目数超过该值时触发一次全表过期清理。
// 为什么需要它：每个访问过的 IP 都会在 Map 里留一条记录，公开 API 会被
// 扫描器和爬虫打进来，不清理的话 Map 会无限增长（长期运行的内存泄漏）。
const CLEANUP_THRESHOLD = 10_000;

// 从 Map 里移除窗口已过期的条目；返回清理后的条目数。
// 导出以便单测直接验证清理行为。
export function sweepExpiredEntries(store: Map<string, { count: number; windowStart: number }>, now = Date.now()): number {
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= windowMs) store.delete(key);
  }
  return store.size;
}

export function checkRateLimit(
  store: Map<string, { count: number; windowStart: number }>,
  key: string,
  limit: number,
  now = Date.now(),
): RateLimitDecision {
  // 达到阈值先清一次过期条目，把内存上限压到"一个窗口内的真实访问数"量级。
  // 清理是 O(n)，但只在条目破万时触发，摊薄后可忽略；不在每次请求都扫全表。
  if (store.size >= CLEANUP_THRESHOLD) sweepExpiredEntries(store, now);

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

/**
 * Simple fixed-window rate limiter kept in memory.
 * Good enough for one server; use Redis if you run several instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  bucket.count++;
  return bucket.count > limit
    ? { ok: false, retryAfterMs: bucket.resetAt - now }
    : { ok: true, retryAfterMs: 0 };
}

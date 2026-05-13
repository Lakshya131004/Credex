/**
 * Rate limiting — IP-based in-memory store.
 * Simple and dependency-free for the MVP; swap for Upstash Redis in production.
 *
 * Decision: chose in-memory over Redis to avoid another paid service dependency.
 * Trade-off: resets on server restart and doesn't work across multiple instances.
 * Acceptable for MVP traffic; documented in ARCHITECTURE.md.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Prune expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param identifier  Usually the client IP address
 * @param limit       Max requests per window
 * @param windowMs    Window duration in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

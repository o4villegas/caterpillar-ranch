/**
 * KV-based Rate Limiter
 *
 * Simple rate limiting using Cloudflare KV storage
 * Uses ratelimit: prefix to avoid collisions with other KV data
 *
 * Pattern: ratelimit:{identifier} → count
 * Example: ratelimit:192.168.1.1:newsletter → 3
 */

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether the request is allowed (not rate limited) */
  allowed: boolean;
  /** Number of requests remaining in current window */
  remaining: number;
  /** Total limit for the window */
  limit: number;
}

/**
 * Check rate limit for a given identifier
 *
 * @param kv - Cloudflare KV namespace
 * @param identifier - Unique identifier for the rate limit (e.g., IP address + endpoint)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowSeconds - Time window in seconds (TTL for the counter)
 * @returns Rate limit result with allowed status and remaining count
 *
 * @example
 * ```typescript
 * const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
 * const result = await checkRateLimit(
 *   c.env.CATALOG_CACHE,
 *   `${clientIP}:newsletter`,
 *   5,    // 5 requests
 *   3600  // per hour
 * );
 *
 * if (!result.allowed) {
 *   return c.json({ error: 'Too many requests' }, 429);
 * }
 * ```
 */
export async function checkRateLimit(
  kv: KVNamespace,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;

  // Get current count from KV
  const data = await kv.get(key);
  const currentCount = data ? parseInt(data, 10) : 0;

  // Check if limit exceeded
  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
    };
  }

  // Increment count and store with expiration
  const newCount = currentCount + 1;
  await kv.put(key, newCount.toString(), {
    expirationTtl: windowSeconds,
  });

  return {
    allowed: true,
    remaining: limit - newCount,
    limit,
  };
}

/**
 * A small fixed-window limiter for the credential endpoints, so an attacker
 * cannot grind passwords or mass-create accounts from one address.
 *
 * State is per server instance and held in memory. That is deliberate: it needs
 * no extra infrastructure and still blunts the naive attack. If the storefront
 * is ever scaled to several instances behind a load balancer, move this to
 * Postgres or Redis so the budget is shared.
 */
type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

/** Stops the map growing without bound on a long-lived server. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  return { ok: true, retryAfter: 0 };
}

/**
 * Best-effort client address. `x-forwarded-for` is set by the proxy in front of
 * the app; it is spoofable when the app is reached directly, which is why this
 * only ever tightens a limit and never grants authority.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

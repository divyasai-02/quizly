type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}

export function assertRateLimit(request: Request, options: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const bucketKey = `${options.key}:${getClientIp(request)}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  current.count += 1;
  if (current.count > options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new Response(JSON.stringify({ error: "Too many requests. Try again shortly." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds)
      }
    });
  }
}

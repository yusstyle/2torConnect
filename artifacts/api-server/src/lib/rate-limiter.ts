import type { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up stale records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    // Get client IP address accurately (handling Vercel / proxy headers)
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress) || "unknown";
    const key = `${req.baseUrl || req.path}:${ip}`;

    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      memoryStore.set(key, { count: 1, resetAt: now + options.windowMs });
      res.setHeader("X-RateLimit-Limit", options.max);
      res.setHeader("X-RateLimit-Remaining", options.max - 1);
      next();
      return;
    }

    record.count++;
    const remaining = Math.max(0, options.max - record.count);
    res.setHeader("X-RateLimit-Limit", options.max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetAt / 1000));

    if (record.count > options.max) {
      res.status(429).json({
        error: "Too Many Requests",
        message: options.message,
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Strict Rate Limiter for Authentication endpoints (Login, OTP):
 * Max 10 attempts per 10 minutes per IP
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please wait 10 minutes before trying again.",
});

/**
 * Global Rate Limiter for general API requests:
 * Max 150 requests per minute per IP (prevents automated scraping / denial of service)
 */
export const globalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 150,
  message: "Too many requests. Please slow down.",
});

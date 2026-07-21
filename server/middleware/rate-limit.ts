import type { NextFunction, Request, Response } from "express";
import { query } from "../db/db";
import { env } from "../env";

/**
 * Rate limiting backed by Postgres (`rate_events`), so limits hold across
 * serverless instances and cold starts. One row is written per chat request;
 * the same rows also feed the global daily cap.
 */

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

export async function rateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = Date.now();
    const windowMs = env.rateLimitWindowSec * 1000;
    const ip = clientIp(req);

    const rows = await query<{ n: string; oldest: string | null }>(
      `SELECT COUNT(*) AS n, MIN(ts) AS oldest
         FROM rate_events WHERE scope = 'chat' AND key = $1 AND ts > $2`,
      [ip, now - windowMs]
    );
    const count = Number(rows[0]?.n ?? 0);
    if (count >= env.rateLimitMax) {
      const oldest = Number(rows[0]?.oldest ?? now);
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: `Rate limit reached (${env.rateLimitMax} requests per ${env.rateLimitWindowSec}s).`,
        retryAfter: retryAfterSec,
      });
      return;
    }

    await query("INSERT INTO rate_events (scope, key, ts) VALUES ('chat', $1, $2)", [ip, now]);
    // Opportunistic cleanup of events older than 48h (~1 in 20 requests).
    if (Math.random() < 0.05) {
      await query("DELETE FROM rate_events WHERE ts < $1", [now - 48 * 3600 * 1000]);
    }
    next();
  } catch (err) {
    next(err);
  }
}

/** Global backstop: cap total chat requests per UTC day, across all IPs. */
export async function globalDailyCap(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dayStart = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
    const rows = await query<{ n: string }>(
      "SELECT COUNT(*) AS n FROM rate_events WHERE scope = 'chat' AND ts >= $1",
      [dayStart]
    );
    if (Number(rows[0]?.n ?? 0) > env.globalDailyRequestCap) {
      res.setHeader("Retry-After", "3600");
      res.status(429).json({
        error: "The site's daily request cap has been reached. Try again tomorrow.",
        retryAfter: 3600,
      });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

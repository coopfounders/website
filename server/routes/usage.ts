import { Router } from "express";
import { query } from "../db/db";
import { allBudgetStatuses } from "../middleware/budget-caps";

export const usageRouter = Router();

function parseRange(q: Record<string, unknown>): { from: number; to: number } {
  const now = Date.now();
  const from = typeof q.from === "string" ? Date.parse(q.from) : NaN;
  const to = typeof q.to === "string" ? Date.parse(q.to) : NaN;
  return {
    from: Number.isFinite(from) ? from : now - 30 * 24 * 60 * 60 * 1000,
    // `to` is an inclusive calendar date from the UI — extend to end of day.
    to: Number.isFinite(to) ? to + 24 * 60 * 60 * 1000 - 1 : now,
  };
}

usageRouter.get("/summary", async (req, res, next) => {
  try {
    const { from, to } = parseRange(req.query as Record<string, unknown>);

    const byProvider = await query(
      `SELECT provider,
              COUNT(*)::int            AS requests,
              COALESCE(SUM(input_tokens), 0)::bigint  AS "inputTokens",
              COALESCE(SUM(output_tokens), 0)::bigint AS "outputTokens",
              COALESCE(SUM(cached_tokens), 0)::bigint AS "cachedTokens",
              COALESCE(SUM(cost_usd), 0)   AS "costUsd"
         FROM usage WHERE ts BETWEEN $1 AND $2
        GROUP BY provider ORDER BY "costUsd" DESC`,
      [from, to]
    );

    const byModel = await query(
      `SELECT provider, model,
              COUNT(*)::int AS requests,
              COALESCE(SUM(input_tokens), 0)::bigint  AS "inputTokens",
              COALESCE(SUM(output_tokens), 0)::bigint AS "outputTokens",
              COALESCE(SUM(cost_usd), 0)   AS "costUsd"
         FROM usage WHERE ts BETWEEN $1 AND $2
        GROUP BY provider, model ORDER BY "costUsd" DESC`,
      [from, to]
    );

    // Daily spend for the last 30 days (independent of the date filter).
    const start30 = Date.now() - 29 * 24 * 60 * 60 * 1000;
    const daily = await query(
      `SELECT to_char(to_timestamp(ts / 1000.0) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
              provider,
              COALESCE(SUM(cost_usd), 0) AS "costUsd"
         FROM usage WHERE ts >= $1
        GROUP BY day, provider ORDER BY day ASC`,
      [start30]
    );

    const recent = await query(
      `SELECT ts, conversation_id AS "conversationId", provider, model,
              input_tokens AS "inputTokens", output_tokens AS "outputTokens",
              cached_tokens AS "cachedTokens", cost_usd AS "costUsd"
         FROM usage WHERE ts BETWEEN $1 AND $2
        ORDER BY ts DESC LIMIT 50`,
      [from, to]
    );

    res.json({
      range: { from, to },
      byProvider: byProvider.map(normalizeNumbers),
      byModel: byModel.map(normalizeNumbers),
      daily: daily.map(normalizeNumbers),
      recent: recent.map(normalizeNumbers),
      budgets: await allBudgetStatuses(),
    });
  } catch (err) {
    next(err);
  }
});

/** pg returns BIGINT/NUMERIC aggregates as strings — coerce the numeric fields. */
const NUMERIC_KEYS = new Set([
  "requests", "inputTokens", "outputTokens", "cachedTokens", "costUsd", "ts",
]);

function normalizeNumbers<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const key of Object.keys(out)) {
    const v = out[key];
    if (NUMERIC_KEYS.has(key) && typeof v === "string") out[key] = Number(v);
  }
  return out as T;
}

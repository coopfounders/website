import { Pool } from "pg";
import crypto from "crypto";
import { env } from "../env";

/**
 * Postgres (Neon on Vercel; any DATABASE_URL locally). All access goes through
 * query() with parameterized statements.
 */
let pool: Pool | null = null;

function getPool(): Pool {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Create a (free) Neon Postgres database and put its connection string in the environment."
    );
  }
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      max: 5,
      // Neon requires TLS; local docker Postgres doesn't speak it.
      ssl: /sslmode=require|neon\.tech/.test(env.databaseUrl)
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query(text, params as never[]);
  return result.rows as T[];
}

/**
 * Schema migrations. Append new statements to the end — each entry runs once,
 * tracked in the `migrations` table. Applied automatically on first request
 * (and at local server boot); run manually with `npm run migrate`.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS conversations (
     id         TEXT PRIMARY KEY,
     title      TEXT NOT NULL,
     created_at BIGINT NOT NULL,
     updated_at BIGINT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS messages (
     id              TEXT PRIMARY KEY,
     conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
     role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
     content         TEXT NOT NULL,
     model           TEXT,
     provider        TEXT,
     input_tokens    INTEGER,
     output_tokens   INTEGER,
     cost_usd        DOUBLE PRECISION,
     created_at      BIGINT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation
     ON messages(conversation_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS usage (
     id              BIGSERIAL PRIMARY KEY,
     ts              BIGINT NOT NULL,
     conversation_id TEXT,
     provider        TEXT NOT NULL,
     model           TEXT NOT NULL,
     input_tokens    INTEGER NOT NULL,
     output_tokens   INTEGER NOT NULL,
     cached_tokens   INTEGER NOT NULL DEFAULT 0,
     cost_usd        DOUBLE PRECISION NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_usage_provider_ts ON usage(provider, ts)`,
  `CREATE INDEX IF NOT EXISTS idx_usage_ts ON usage(ts)`,
  // Durable rate-limit events (serverless instances share nothing in memory).
  `CREATE TABLE IF NOT EXISTS rate_events (
     id    BIGSERIAL PRIMARY KEY,
     scope TEXT NOT NULL,
     key   TEXT NOT NULL,
     ts    BIGINT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_rate_events ON rate_events(scope, key, ts)`,
  // Shared context documents injected into every chat request when enabled.
  `CREATE TABLE IF NOT EXISTS context_docs (
     id         TEXT PRIMARY KEY,
     title      TEXT NOT NULL,
     content    TEXT NOT NULL,
     enabled    BOOLEAN NOT NULL DEFAULT TRUE,
     created_at BIGINT NOT NULL,
     updated_at BIGINT NOT NULL
   )`,
];

let migrationPromise: Promise<void> | null = null;

async function applyMigrations(): Promise<void> {
  await query(
    `CREATE TABLE IF NOT EXISTS migrations (
       idx        INTEGER PRIMARY KEY,
       applied_at BIGINT NOT NULL
     )`
  );
  const applied = new Set(
    (await query<{ idx: number }>("SELECT idx FROM migrations")).map((r) => Number(r.idx))
  );
  for (let i = 0; i < MIGRATIONS.length; i++) {
    if (applied.has(i)) continue;
    await query(MIGRATIONS[i]);
    await query("INSERT INTO migrations (idx, applied_at) VALUES ($1, $2)", [i, Date.now()]);
  }
}

/** Idempotent; safe to call per-request (only the first call does work). */
export function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = applyMigrations().catch((err) => {
      migrationPromise = null; // allow retry on next request
      throw err;
    });
  }
  return migrationPromise;
}

export function newId(): string {
  return crypto.randomBytes(12).toString("hex");
}

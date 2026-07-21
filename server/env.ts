import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid numeric env var ${name}=${raw}`);
  }
  return n;
}

function optionalNum(name: string): number | null {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid numeric env var ${name}=${raw}`);
  }
  return n;
}

const isProd = process.env.NODE_ENV === "production";

const sessionSecret = process.env.SESSION_SECRET || "";
if (!sessionSecret || sessionSecret === "change-me-to-a-long-random-hex-string") {
  if (isProd) {
    throw new Error("SESSION_SECRET must be set to a random value in production");
  }
  console.warn("[env] SESSION_SECRET not set — using an ephemeral dev secret");
}

const accessPassword = process.env.GPT_ACCESS_PASSWORD || "";
if (!accessPassword || accessPassword === "change-me") {
  if (isProd) {
    throw new Error("GPT_ACCESS_PASSWORD must be set in production");
  }
  console.warn("[env] GPT_ACCESS_PASSWORD not set — using 'dev' as the dev password");
}

export const env = {
  isProd,
  port: num("PORT", 8790),
  databaseUrl: process.env.DATABASE_URL || "",
  siteOrigin: process.env.SITE_ORIGIN || "",

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  accessPassword: accessPassword || "dev",
  sessionSecret: sessionSecret || crypto.randomBytes(32).toString("hex"),

  monthlyCaps: {
    anthropic: optionalNum("ANTHROPIC_MONTHLY_CAP_USD"),
    openai: optionalNum("OPENAI_MONTHLY_CAP_USD"),
  } as Record<string, number | null>,

  rateLimitMax: num("RATE_LIMIT_MAX", 20),
  rateLimitWindowSec: num("RATE_LIMIT_WINDOW_SEC", 300),
  globalDailyRequestCap: num("GLOBAL_DAILY_REQUEST_CAP", 500),
  maxInputChars: num("MAX_INPUT_CHARS", 32000),
};

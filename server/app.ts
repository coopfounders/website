import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import { ensureMigrated } from "./db/db";
import { env } from "./env";
import { authGate } from "./middleware/auth-gate";
import { globalDailyCap, rateLimit } from "./middleware/rate-limit";
import { authRouter } from "./routes/auth";
import { chatRouter } from "./routes/chat";
import { contextRouter } from "./routes/context";
import { conversationsRouter } from "./routes/conversations";
import { usageRouter } from "./routes/usage";

/**
 * The API app. Exported bare (no static serving, no listen) so it can run
 * both as a Vercel serverless function (api/index.ts) and inside the local
 * server (server/index.ts), which adds static file serving on top.
 */
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// ---- Security headers ----
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (req.path === "/gpt/preview.html") {
    // The artifact-preview bootstrap: framed (sandboxed) by the chat app, it
    // must run the snippet's inline scripts, but may reach nothing else.
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'none'",
        "script-src 'unsafe-inline'",
        "style-src 'unsafe-inline'",
        "img-src data: blob:",
        "font-src data:",
        "media-src data: blob:",
        "frame-ancestors 'self'",
      ].join("; ")
    );
    next();
    return;
  }
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-src 'self' https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join("; ")
  );
  next();
});

// ---- Same-origin enforcement on mutating API requests (CORS stays locked:
// we never emit Access-Control-Allow-Origin, so browsers block cross-origin
// reads; this additionally rejects cross-origin form-style writes). ----
app.use("/api", (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") return next();
  const origin = req.headers.origin;
  if (!origin) return next(); // same-origin fetches may omit Origin; curl has none
  const allowed = new Set(
    [
      env.siteOrigin,
      `http://localhost:${env.port}`,
      "http://localhost:5173",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "",
    ].filter(Boolean)
  );
  if (!allowed.has(origin)) {
    res.status(403).json({ error: "Cross-origin requests are not allowed." });
    return;
  }
  next();
});

// ---- Ensure schema exists before any API work (no-op after first call) ----
app.use("/api", (_req, res, next) => {
  ensureMigrated()
    .then(() => next())
    .catch((err) => {
      console.error("[db] migration/connection failed:", err.message);
      res.status(503).json({
        error: "Database isn't reachable. Check DATABASE_URL on the server.",
      });
    });
});

// ---- API routes ----
app.use("/api/gpt/auth", authRouter);
app.use("/api/gpt/chat", authGate, rateLimit, globalDailyCap, chatRouter);
app.use("/api/gpt/conversations", authGate, conversationsRouter);
app.use("/api/gpt/context", authGate, contextRouter);
app.use("/api/gpt/usage", authGate, usageRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// ---- Error handler: never leak stacks to the client ----
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[api] unhandled error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Something went wrong on the server." });
  } else {
    res.end();
  }
});

import { Router } from "express";
import {
  authGate,
  checkPassword,
  clearSessionCookie,
  setSessionCookie,
} from "../middleware/auth-gate";

export const authRouter = Router();

// Light brute-force protection on the password endpoint.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 15 * 60 * 1000;

authRouter.post("/login", (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?")
    .split(",")[0]
    .trim();
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.count >= MAX_ATTEMPTS && now < entry.resetAt) {
    res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
    return;
  }

  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (password.length === 0 || password.length > 256 || !checkPassword(password)) {
    const next = entry && now < entry.resetAt ? entry.count + 1 : 1;
    attempts.set(ip, { count: next, resetAt: now + LOCKOUT_MS });
    res.status(401).json({ error: "Wrong password." });
    return;
  }

  attempts.delete(ip);
  setSessionCookie(res);
  res.json({ ok: true });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/check", authGate, (_req, res) => {
  res.json({ ok: true });
});

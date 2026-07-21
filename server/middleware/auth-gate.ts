import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../env";

const COOKIE_NAME = "gpt_session";
const SESSION_DAYS = 1;

function sign(payload: string): string {
  return crypto.createHmac("sha256", env.sessionSecret).update(payload).digest("hex");
}

export function createSessionCookieValue(): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function setSessionCookie(res: Response): void {
  res.cookie(COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function hasValidSession(req: Request): boolean {
  const raw: unknown = req.cookies?.[COOKIE_NAME];
  if (typeof raw !== "string") return false;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return false;
  }
  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

export function checkPassword(candidate: string): boolean {
  const expected = Buffer.from(env.accessPassword);
  const given = Buffer.from(candidate);
  // timingSafeEqual requires equal lengths; compare against a same-length
  // digest to avoid leaking length via early return timing.
  const a = crypto.createHash("sha256").update(expected).digest();
  const b = crypto.createHash("sha256").update(given).digest();
  return crypto.timingSafeEqual(a, b);
}

export function authGate(req: Request, res: Response, next: NextFunction): void {
  if (hasValidSession(req)) {
    next();
    return;
  }
  res.status(401).json({ error: "Password required." });
}

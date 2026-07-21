# Coop site + /gpt

The Coop marketing site (static HTML at `/`) plus a password-gated, multi-model
AI chat app at **/gpt**. Deployed on **Vercel** (static files on the CDN, the
API as one serverless function) with **Neon Postgres** for storage.

- **Chat** (`/gpt`): streaming chat across Anthropic and OpenAI models,
  persisted conversations, markdown + code highlighting with copy
  buttons, stop generation, system-prompt presets, temperature/max-tokens
  controls, export to markdown.
- **Context** (`/gpt/context`): shared context documents. Paste transcripts of
  previous chats (from this app, ChatGPT, Claude — anywhere) or notes; enabled
  docs are injected into the system prompt of **every** conversation, so
  context carries across chats. In any chat, "Save to context" snapshots that
  conversation for future ones.
- **Usage** (`/gpt/usage`): spend + tokens per provider and model, a 30-day
  daily-spend chart, the 50 most recent requests, date-range filtering, and
  monthly budget caps per provider.

## Layout

```
index.html, terms.html, privacy.html, assets/   ← marketing site (served as-is)
shared/models.config.ts   ← ALL models, pricing, presets (edit this to add models)
api/index.ts              ← Vercel serverless entrypoint (wraps server/app.ts)
server/app.ts             ← Express API (auth, chat SSE, context, usage)
server/providers/         ← one adapter per provider, normalized streaming
server/index.ts           ← local entrypoint: API + static serving
web/                      ← React SPA for /gpt (Vite, base /gpt/)
scripts/assemble-static.js← builds dist/static for Vercel's CDN
vercel.json               ← build config, function limits, rewrites
```

## Setup

```bash
npm install
cp .env.example .env      # then fill in real values (see below)
npm run dev               # server on :8790 + Vite dev server on :5173
```

Open http://localhost:5173/gpt for development (hot reload; API proxied), or
build and run the production shape locally:

```bash
npm run build && npm start   # everything on http://localhost:8790
```

### Required env vars

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon; free at neon.tech). Same URL for local dev and prod. |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Provider keys (server-side only) |
| `GPT_ACCESS_PASSWORD` | The /gpt password |
| `SESSION_SECRET` | Random hex string for signing session cookies |

Optional: per-provider `*_MONTHLY_CAP_USD`, `RATE_LIMIT_MAX`,
`RATE_LIMIT_WINDOW_SEC`, `GLOBAL_DAILY_REQUEST_CAP`, `MAX_INPUT_CHARS`,
`SITE_ORIGIN`, `PORT`. See `.env.example`.

For local dev without Neon, any Postgres works, e.g.:
`docker run -d --name gpt-pg -e POSTGRES_PASSWORD=dev -p 5433:5432 postgres:16-alpine`
then `DATABASE_URL=postgres://postgres:dev@localhost:5433/postgres`.

### Database & migrations

Migrations are a numbered list in `server/db/db.ts`, tracked in a `migrations`
table. They run automatically on the first API request (and at local boot);
run them manually with `npm run migrate`. To add one, append a SQL statement
to the `MIGRATIONS` array — never edit or reorder existing entries.

### Shared context — how it works

`context_docs` rows marked enabled are concatenated (oldest first, budgeted to
~180k characters ≈ 45k tokens) into a system-prompt block on every chat
request. Manage them at `/gpt/context`: paste in old conversations, toggle
docs on/off, or snapshot a live conversation with "Save to context". Keep the
enabled set focused — everything enabled is sent (and billed as input tokens)
on every message.

## Adding a model or provider

- **New model:** add one entry to `MODELS` in `shared/models.config.ts`.
- **New provider:** one adapter implementing `ProviderAdapter`
  (`server/providers/types.ts`), one entry in `server/providers/registry.ts`,
  config rows in `shared/models.config.ts`, and its key in `server/env.ts`.

## Deploying to Vercel

1. Push this repo to GitHub.
2. **Create the database:** in the Vercel dashboard → Storage → Create
   Database → **Neon Postgres** (free), or directly at neon.tech. Either way
   you get a `DATABASE_URL`; the Vercel integration injects it automatically.
3. **Import the project:** Vercel → Add New → Project → your repo. The
   included `vercel.json` sets everything (build command
   `npm run build:vercel`, static output `dist/static`, the API function with
   a 300s max duration for streaming, and the SPA rewrites) — leave the
   framework preset alone ("Other").
4. **Environment variables** (Project → Settings → Environment Variables):
   `DATABASE_URL` (if not auto-injected by the Neon integration),
   `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
   `GPT_ACCESS_PASSWORD`, `SESSION_SECRET`, the `*_MONTHLY_CAP_USD` caps, and
   `SITE_ORIGIN=https://yourdomain.com`. `NODE_ENV=production` is set by
   Vercel automatically.
5. Deploy. Your site is at `https://<project>.vercel.app` — `/` is the
   marketing site, `/gpt` the chat. Attach a custom domain under Project →
   Settings → Domains (add the DNS record Vercel shows you).

Every push to the connected branch redeploys. Notes for the Vercel runtime:

- Streaming works, but a single response is capped at the function's
  `maxDuration` (300s — plenty for chat).
- Rate limits and daily caps are enforced in Postgres, so they hold across
  serverless instances.

## Test plan (run once after deploying)

1. **One request per provider:** log in at `/gpt`, send a short message with a
   Claude model, then switch to a GPT model in the same conversation. Each
   should stream, with a `model · tokens · cost` line under each reply.
2. **Usage rows:** `/gpt/usage` should show exactly those requests with
   non-zero tokens and cost.
3. **Shared context:** add a doc at `/gpt/context` containing a made-up fact
   ("my cat is named Tuna"), start a NEW chat and ask about it — the model
   should know. Toggle the doc off and ask again in another new chat — it
   shouldn't.
4. **Budget cap:** temporarily set `ANTHROPIC_MONTHLY_CAP_USD=0.001` and
   redeploy; a Claude request should be refused with the cap message.
5. **Rate limit:** temporarily set `RATE_LIMIT_MAX=2`; the third quick message
   should show the rate-limit banner with a countdown (429 + `Retry-After`).
6. **Stop:** start a long generation and hit Stop — streaming halts and the
   partial response is kept.
7. **Gate:** open `/gpt` in a private window — password screen; wrong password
   rejected.

## Security notes

- All provider keys live server-side; every model call goes through the
  backend. The client only ever sees the SSE stream.
- Sessions are HMAC-signed HttpOnly cookies (30 days). Login attempts are
  throttled.
- All SQL is parameterized. Inputs validated and length-capped. Security
  headers + CSP on every response; no Access-Control-Allow-Origin is emitted
  and cross-origin writes are rejected by an Origin check.
- The marketing site remains fully static and cookie-free; the chat app sets
  one first-party session cookie after login.

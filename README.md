# Coop website

A minimal Vercel-hosted landing page for Coop.

## Local preview

Static layout preview:

```bash
python3 -m http.server 4173
```

For the `/api/partner` endpoint, use the Vercel CLI:

```bash
vercel dev
```

## Partner inquiry email setup

The partner form posts to the Vercel serverless function at `api/partner.js`. The function validates the email and sends the inquiry to `founders@cooplabs.com` through Resend.

1. Create a Resend account and verify `cooplabs.com`.
2. Create a Resend API key.
3. Add these environment variables in Vercel Project Settings:
   - `RESEND_API_KEY`
   - `PARTNER_FROM_EMAIL` set to `Coop Website <website@cooplabs.com>`
4. Redeploy.

No private keys are exposed to the browser. The form includes same-site checks, server-side validation, and a honeypot field.

## Launch blog

The launch-blog link is commented out in `index.html`. The existing `launch.html` page remains intact and updated with the current logo. Uncomment the marked navigation block when it is ready to publish.

## Logo assets

- `coop-wordmark-white.png` — dark backgrounds
- `coop-wordmark-navy.png` — light backgrounds
- `coop-wordmark-teal.png` — alternate brand treatment
- `coop-favicon.png` — favicon derived from the fused center of the wordmark

# Coop website handoff

This is a Next.js App Router website, configured for Vercel hosting.

## Run locally

Use Node.js 22 (also specified in `.nvmrc`), then open a terminal in this folder:

```sh
npm ci
npm run dev
```

Open http://localhost:3000 in your browser.

Next.js loads `.env` automatically. The homepage does not require a database or
external services; Resend credentials are needed only to send contact inquiries.

## Main files

- app/page.tsx: homepage content
- app/globals.css: styles, navy palette, and animations
- app/experiment.tsx: interactive experiment loop
- app/scroll-effects.tsx: scroll motion
- public/images/: logo, partner badges, and illustrations
- components/site-chrome.tsx: shared header and footer
- components/legacy-cookie-cleanup.tsx: removes the old consent preference
- components/contact-dialog.tsx and components/contact-form.tsx: shared inquiry pop-up and form
- app/contact/page.tsx: redirects old contact links to the homepage inquiry pop-up
- app/contact-dialog.css: inquiry pop-up and partner credit styles
- app/api/contact/route.ts: validated, server-side inquiry delivery
- app/privacy/ and app/cookies/: policy pages
- public/robots.txt and public/llms.txt: crawler information

## Contact form delivery

The form posts to `/api/contact`, which sends email through Resend. Configure
the local `.env` file, or copy `.env.example` to `.env` if it is missing:

- `RESEND_API_KEY`: a Resend API key with sending permission.
- `RESEND_FROM`: a sender address on a domain verified in Resend.
- `RESEND_TO`: the inbox for inquiries, currently `founders@cooplabs.com`.

The sender can include a name, for example
`RESEND_FROM="Coop Website <website@cooplabs.com>"`. Replies go to the visitor's
email address. Keep `.env` out of source control; `.env.example` contains only
the setup template.

Restart the dev server after changing `.env`. On Vercel, configure the same names
in Project Settings > Environment Variables for Production and Preview. Keep
these names server-only, without a `NEXT_PUBLIC_` prefix. The contact API runs
as a Node.js function with a 30-second maximum duration and a 10-second Resend
request timeout.
The UI never reports success when delivery is unconfigured or fails, and failed
submissions keep the visitor's entries for retry. No inquiry data is logged.

## Production build

```sh
npm run build
npm start
```

The terminal prints the local production preview address. Run `npm test` for
the contact validation and mocked Resend delivery checks, and `npm run lint`
for lint and type checks. Tests do not send email.

## Deploy to Vercel

1. Import this repository into a Vercel project, or use the Vercel CLI from this
   folder with `npx vercel` to link a project and create a preview deployment.
2. Use the Next.js framework preset and Node.js 22.x. The included `vercel.json`
   selects Next.js; keep the default build command (`npm run build`) and output
   directory (`.next`). Do not use a static export, because the contact API
   needs a server function.
3. Set `RESEND_API_KEY`, `RESEND_FROM`, and `RESEND_TO` in the Vercel project
   environment variables. A local `.env` is not uploaded as production config.
4. Redeploy after setting or changing environment variables. Check the homepage,
   `/privacy`, `/cookies`, and contact pop-up in the preview. `/contact` redirects
   to the homepage pop-up; `/robots.txt` and `/llms.txt` are public static files.
5. Promote the reviewed preview to production, or run `npx vercel --prod`.
   Add the production domain in Project Settings > Domains and apply the DNS
   records Vercel provides.

The former Cloudflare/Vinext runtime is no longer required. Secrets, dependencies,
and generated output are excluded from Vercel CLI uploads by `.vercelignore`.

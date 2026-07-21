/**
 * Assembles the static output Vercel serves from its CDN:
 *   dist/static/            ← marketing site (index/terms/privacy + assets)
 *   dist/static/gpt/        ← the built /gpt SPA (from dist/web)
 * Run by `npm run build:vercel` after `vite build`.
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const out = path.join(root, "dist", "static");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of ["index.html", "terms.html", "privacy.html"]) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}
fs.cpSync(path.join(root, "assets"), path.join(out, "assets"), { recursive: true });
fs.cpSync(path.join(root, "dist", "web"), path.join(out, "gpt"), { recursive: true });

console.log("Static output assembled at dist/static");

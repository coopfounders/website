import express from "express";
import fs from "fs";
import path from "path";
import { app } from "./app";
import { ensureMigrated } from "./db/db";
import { env } from "./env";

/**
 * Local entrypoint (`npm run dev:server` / `npm start`): the API app plus
 * static serving for the marketing site and the built /gpt SPA. On Vercel,
 * statics are served by the CDN instead and only api/index.ts runs.
 */

// ---- Static: /gpt SPA (built by Vite into dist/web) ----
const projectRoot = process.cwd();
const webDist = path.resolve(projectRoot, "dist", "web");
const webIndex = path.join(webDist, "index.html");

if (fs.existsSync(webIndex)) {
  app.use("/gpt", express.static(webDist, { index: false, maxAge: "1h" }));
  app.get(["/gpt", "/gpt/", "/gpt/usage", "/gpt/context"], (_req, res) => {
    res.sendFile(webIndex);
  });
} else {
  app.get(["/gpt", "/gpt/usage", "/gpt/context"], (_req, res) => {
    res
      .status(503)
      .send("The /gpt app has not been built yet. Run `npm run build` (or `npm run dev`).");
  });
}

// ---- Static: the marketing site (repo root files, untouched) ----
app.use(
  express.static(projectRoot, {
    index: "index.html",
    extensions: ["html"],
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
    },
  })
);

app.use((_req, res) => {
  res.status(404).send("Not found");
});

ensureMigrated()
  .then(() => console.log("[db] schema ready"))
  .catch((err) => console.warn("[db] not reachable yet:", err.message));

app.listen(env.port, () => {
  console.log(`Coop site + /gpt listening on http://localhost:${env.port}`);
});

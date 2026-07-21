// Vercel serverless entrypoint. vercel.json rewrites every /api/* request to
// this function; the Express app sees the original URL and routes normally.
import { app } from "../server/app";

export default app;

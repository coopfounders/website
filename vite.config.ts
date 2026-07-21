import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The /gpt chat app. Built assets land in dist/web and are served by the
// Express server under the /gpt base path.
export default defineConfig({
  root: "web",
  base: "/gpt/",
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/web"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8790",
      "/assets": "http://localhost:8790",
    },
  },
});

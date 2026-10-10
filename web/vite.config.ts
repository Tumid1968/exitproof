import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// The build is a static replay site (docs/): relative paths and one classic (non-module) script, so it
// works on GitHub Pages / Vercel AND opened from disk (Chrome blocks ES modules on file://).
const classicScript = (): Plugin => ({
  name: "exitproof-classic-script",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler: (html) => html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, '<script defer src="$1"></script>').replace(/ crossorigin/g, ""),
  },
});

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [react(), classicScript()],
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: { output: { format: "iife", inlineDynamicImports: true, entryFileNames: "assets/app.js", assetFileNames: "assets/[name][extname]" } },
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
    fs: { allow: [".."] },
    proxy: { "/api": "http://127.0.0.1:8700" },
  },
});

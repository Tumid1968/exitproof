import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The UI imports the engine's pure modules (verdict, analytic shocks) from ../src so the numbers
// on screen come from the same code as the CLI.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
    fs: { allow: [".."] },
    proxy: { "/api": "http://127.0.0.1:8700" },
  },
});

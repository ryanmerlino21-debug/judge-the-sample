import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the built app work from any static host (e.g. GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __COMMIT__: JSON.stringify((process.env.GITHUB_SHA || "local").slice(0, 7)),
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the built app work from any static host (e.g. GitHub Pages).
export default defineConfig({ base: "./", plugins: [react()] });

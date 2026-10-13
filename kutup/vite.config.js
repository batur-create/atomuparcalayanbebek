import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Inline (empty) PostCSS config: stops Vite from picking up the Tailwind setup
  // of the shop app in the parent folder.
  css: { postcss: { plugins: [] } },
  build: { target: "es2022" },
});

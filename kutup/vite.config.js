import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import darkCss from "./scripts/dark-css.js";

export default defineConfig({
  plugins: [react()],
  // Inline PostCSS config: stops Vite from picking up the Tailwind setup of the
  // shop app in the parent folder. Its one plugin writes the dark twins of the
  // colors (see scripts/dark-css.js); the focus screen and the black hole are
  // dark by design and stay as they are.
  css: { postcss: { plugins: [darkCss({ skipFiles: ["blackhole.css", "focusscreen.css"] })] } },
  build: { target: "es2022" },
});

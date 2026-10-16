import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import darkCss from "./scripts/dark-css.js";
import themeCss from "./scripts/theme-css.js";

export default defineConfig({
  plugins: [react()],
  // Inline PostCSS config: stops Vite from picking up the Tailwind setup of the
  // shop app in the parent folder. Its plugins write the dark twins of the
  // colors (see scripts/dark-css.js; the focus screen and the black hole are
  // dark by design and stay as they are), then tie the neutral literals to the
  // theme's paper and ink (scripts/theme-css.js).
  css: { postcss: { plugins: [darkCss({ skipFiles: ["blackhole.css", "focusscreen.css"] }), themeCss()] } },
  build: { target: "es2022" },
});

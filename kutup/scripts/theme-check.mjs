// Contrast check for the theme packages in src/themes.css (n23).
//
//   node scripts/theme-check.mjs          prints the table, exits 1 if a pair fails
//   node scripts/theme-check.mjs --md F   also writes the table as Markdown to F
//
// WCAG 2 contrast: text at least 4.5:1, interface parts (rings, selected
// borders, the pop on the studio card) at least 3:1. Dev only; no dependency
// beyond PostCSS, which Vite already brings.
import { readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import { parseColor } from "./dark-css.js";

const TEXT = 4.5,
  PART = 3;
// [what, foreground token, background token, minimum]
export const PAIRS = [
  ["Yazı / kart", "ink", "paper", TEXT],
  ["Yazı / zemin", "ink", "canvas", TEXT],
  ["Soluk yazı / kart", "muted", "paper", TEXT],
  ["Soluk yazı / zemin", "muted", "canvas", TEXT],
  ["Yazı / kahraman alanı", "ink", "hero", TEXT],
  ["Vurgu yazısı / vurgu zemini", "accent-deep", "accent-soft", TEXT],
  ["Vurgu rengi yazı / kart", "accent", "paper", TEXT],
  ["Düğme yazısı / vurgu", "on-accent", "accent", TEXT],
  ["Stüdyo yazısı / stüdyo kartı", "studio-ink", "studio", TEXT],
  ["Stüdyo ikincil / stüdyo kartı", "studio-soft", "studio", TEXT],
  ["Stüdyo soluk / stüdyo kartı", "studio-faint", "studio", TEXT],
  ["Pop üstü yazı / pop", "pop-ink", "pop", TEXT],
  ["Vurgu parçası / zemin", "accent", "canvas", PART],
  ["Pop parçası / stüdyo kartı", "pop", "studio", PART],
];
export const NAMES = { lilac: "Lavanta", navy: "Lacivert", teal: "Petrol", clay: "Kiremit", pink: "Gül", graphite: "Grafit" };

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = parseColor(hex).rgb.map((v) => toLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// { theme: { light: {token: hex}, dark: {...} } } from the :root blocks.
export function readThemes(file = new URL("../src/themes.css", import.meta.url)) {
  const themes = {};
  postcss.parse(readFileSync(file, "utf8")).walkRules((rule) => {
    for (const sel of rule.selectors) {
      const m = sel.match(/^:root(\[data-mode="dark"\])?(?:\[data-theme="(\w+)"\])?$/);
      if (!m) continue;
      const id = m[2] || "lilac",
        mode = m[1] ? "dark" : "light";
      const tokens = ((themes[id] ||= {})[mode] ||= {});
      rule.walkDecls((d) => {
        if (d.prop.startsWith("--")) tokens[d.prop.slice(2)] = d.value.trim();
      });
    }
  });
  return themes;
}

export function check(themes = readThemes()) {
  const rows = [];
  for (const [id, modes] of Object.entries(themes))
    for (const [what, fg, bg, min] of PAIRS) {
      const cell = (mode) => {
        const t = modes[mode];
        const ratio = contrast(t[fg], t[bg]);
        return { ratio, ok: ratio >= min, fg: t[fg], bg: t[bg] };
      };
      rows.push({ id, what, fg, bg, min, light: cell("light"), dark: cell("dark") });
    }
  return rows;
}

function markdown(rows) {
  const fmt = (c) => `${c.ratio.toFixed(2)} ${c.ok ? "✔" : "✘"}`;
  const out = [];
  for (const id of [...new Set(rows.map((r) => r.id))]) {
    out.push(`### ${NAMES[id] || id} (\`${id}\`)`, "", "| Çift | Jetonlar | En az | Açık | Koyu |", "|---|---|---|---|---|");
    for (const r of rows.filter((x) => x.id === id))
      out.push(`| ${r.what} | \`${r.fg}\` / \`${r.bg}\` | ${r.min}:1 | ${fmt(r.light)} | ${fmt(r.dark)} |`);
    out.push("");
  }
  return out.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("theme-check.mjs")) {
  const rows = check();
  const failed = rows.flatMap((r) => ["light", "dark"].filter((m) => !r[m].ok).map((m) => `${r.id} ${m}: ${r.what} ${r[m].ratio.toFixed(2)}`));
  const md = markdown(rows);
  const at = process.argv.indexOf("--md");
  if (at > 0) writeFileSync(process.argv[at + 1], md + "\n");
  else console.log(md);
  console.log(failed.length ? `FAIL ${failed.length}:\n${failed.join("\n")}` : `OK: ${rows.length * 2} pairs pass`);
  process.exitCode = failed.length ? 1 : 0;
}

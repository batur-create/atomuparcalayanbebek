// Theme packages for Kütüp's stylesheets (n23).
//
// A theme changes the whole page, not only the accent: page, cards, lines,
// ink and muted text (src/themes.css). The tokens alone would not be enough,
// because the CSS also holds hundreds of hand-picked neutral literals (paper
// greys, warm inks, input fills). Rather than rewrite them, this build step,
// which runs after scripts/dark-css.js, ties each one to the theme's five
// neutrals by where it sits between them:
//
//   .chip { background: #f5f2e8 }
//   .chip { background: #f5f2e8; background: color-mix(in oklab, var(--border) 24%, var(--canvas)) }
//
// With the default tokens the mix lands on (almost) the same color; with
// another theme it follows that theme's paper and ink. The literal stays in
// front as the fallback for browsers without color-mix(). Only what the dark
// build also turns (a light surface, a dark ink: the rule has a dark twin) is
// tied, and the twin is tied to the dark neutrals. Colored literals (member
// pastels, gold, live dots) and dark-by-design widgets keep their colors; the
// focus card and the sky have their own tokens.
//
// Text has a floor: a neutral ink is never lighter (on a dark page, never
// darker) than --muted, which every theme keeps at 4.5:1 on paper and canvas
// (scripts/theme-check.mjs). Soft grey text the dark build leaves alone (it
// reads on both pages) is tied to --muted as well.

import { DARK, COLOR, parseColor, oklch, darkScopes, inScope, marked, keepsLight } from "./dark-css.js";

// The neutrals the literals were hand-picked against (Lavanta before n23). A
// literal's place between them picks its mix.
export const BASE = {
  light: { ink: "#30312f", muted: "#6f7169", border: "#e8e7df", canvas: "#f6f5f0", paper: "#fffefb" },
  dark: { canvas: "#181916", paper: "#22231f", border: "#383933", muted: "#a5a69c", ink: "#ebeae4" },
};
// A literal this colorful is a color, not a paper or ink tone. Text allows a
// little more: the warm sepia greys are this design's soft ink.
const NEUTRAL = 0.03,
  NEUTRAL_TEXT = 0.05;
// With the default tokens a mix may move a literal at most this far (OKLab).
const DRIFT = 0.02;

const lab = (rgb) => {
  const [L, C, h] = oklch(rgb);
  return [L, C * Math.cos(h), C * Math.sin(h)];
};
const anchors = (mode) =>
  Object.entries(BASE[mode])
    .map(([name, hex]) => ({ name, lab: lab(parseColor(hex).rgb) }))
    .sort((a, b) => a.lab[0] - b.lab[0]);
const ANCHORS = { light: anchors("light"), dark: anchors("dark") };
// Inks only: from --ink to --muted.
const INKS = Object.fromEntries(Object.entries(ANCHORS).map(([mode, list]) => [mode, list.filter((a) => a.name === "ink" || a.name === "muted")]));
// Grey text lighter than this is meant for a dark or colored fill; leave it.
const SOFT_TEXT = 0.86;

// The mix for one opaque neutral, or null when it is not one. Text maps
// between --ink and --muted only: past --muted it is pulled back to it.
export function neutralMix(rgb, mode, text = false) {
  const [L, C] = oklch(rgb);
  if (C > (text ? NEUTRAL_TEXT : NEUTRAL)) return null;
  const list = (text ? INKS : ANCHORS)[mode];
  let i = list.findIndex((a) => a.lab[0] >= L);
  if (i === -1) i = list.length - 1;
  const b = list[i],
    a = list[Math.max(0, i - 1)];
  const t = a === b ? 1 : Math.max(0, Math.min(1, (L - a.lab[0]) / (b.lab[0] - a.lab[0])));
  const p = Math.round(t * 100);
  const mixed = a.lab.map((v, k) => v + (b.lab[k] - v) * (p / 100));
  const drift = Math.hypot(...mixed.map((v, k) => v - lab(rgb)[k]));
  // Text softer than --muted is pulled back on purpose; that is no drift.
  const muted = INKS[mode].find((x) => x.name === "muted").lab[0];
  const floored = text && (mode === "light" ? L > muted + 0.01 : L < muted - 0.01);
  if (drift > DRIFT && !floored) return null;
  const css = p >= 98 ? `var(--${b.name})` : p <= 2 ? `var(--${a.name})` : `color-mix(in oklab, var(--${b.name}) ${p}%, var(--${a.name}))`;
  return { css, drift, floored };
}

const TEXT = new Set(["color", "-webkit-text-fill-color", "caret-color", "text-decoration-color"]);

// The themed twin of one declaration value, or null when nothing in it is tied.
export function themeValue(value, mode, report, prop = "") {
  let changed = false;
  const out = value
    .split(/(url\([^)]*\))/)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(COLOR, (token) => {
            const color = parseColor(token);
            if (!color || color.a < 0.5) return token;
            const mix = neutralMix(color.rgb, mode, TEXT.has(prop));
            if (!mix) return token;
            changed = true;
            report?.({ mode, prop, from: token, to: mix.css, drift: mix.drift, floored: mix.floored });
            return color.a >= 1 ? mix.css : `color-mix(in oklab, ${mix.css} ${Math.round(color.a * 100)}%, transparent)`;
          }),
    )
    .join("");
  return changed ? out : null;
}

const isTwin = (rule) => rule?.type === "rule" && rule.selectors.every((s) => s.startsWith(`:where(${DARK})`));

/**
 * PostCSS plugin; list it after scripts/dark-css.js. Options:
 *   skipFiles  – file names to leave alone
 *   report     – called with every tied color, for reviewing the output
 */
export default function themeCss({ skipFiles = [], report } = {}) {
  return {
    postcssPlugin: "kutup-theme",
    Once(root) {
      const file = root.source?.input?.file?.replace(/\\/g, "/") || "";
      if (skipFiles.some((name) => file.endsWith("/" + name))) return;
      const tie = (decl, mode) => {
        const value = themeValue(decl.value, mode, report, decl.prop);
        if (value !== null) decl.cloneAfter({ value });
      };
      const rules = [];
      root.walkRules((rule) => {
        if (!(rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name))) rules.push(rule);
      });
      const scopes = darkScopes(rules.filter((rule) => !isTwin(rule)));
      for (const rule of rules) {
        if (isTwin(rule)) continue;
        const twin = rule.next();
        const turned = new Set(isTwin(twin) ? twin.nodes.filter((n) => n.type === "decl").map((n) => n.prop) : []);
        for (const node of [...rule.nodes]) if (node.type === "decl" && turned.has(node.prop)) tie(node, "light");
        if (turned.size) for (const node of [...twin.nodes]) if (node.type === "decl") tie(node, "dark");
        // Soft grey text the dark build left alone reads on both pages: tie it
        // to --muted, unless it sits on a fill of its own (dark or light).
        if (rule.selectors.some((s) => /^(?::root|html)\b/.test(s) || inScope(s, scopes)) || marked(rule, "keep")) continue;
        if (rule.nodes.some((n) => n.type === "decl" && keepsLight(n))) continue;
        for (const node of [...rule.nodes]) {
          if (node.type !== "decl" || !TEXT.has(node.prop) || turned.has(node.prop)) continue;
          const color = parseColor(node.value);
          if (!color || color.a < 1) continue;
          const [L, C] = oklch(color.rgb);
          if (C > NEUTRAL_TEXT || L <= INKS.light.at(-1).lab[0] + 0.01 || L > SOFT_TEXT) continue;
          report?.({ mode: "both", prop: node.prop, from: node.value, to: "var(--muted)", drift: 0, floored: true });
          node.cloneAfter({ value: "var(--muted)" });
        }
      }
    },
  };
}
themeCss.postcss = true;

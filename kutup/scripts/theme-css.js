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

import { DARK, COLOR, parseColor, oklch } from "./dark-css.js";

// The default theme's neutrals. A literal's place between them picks its mix.
export const BASE = {
  light: { ink: "#30312f", muted: "#6f7169", border: "#e8e7df", canvas: "#f6f5f0", paper: "#fffefb" },
  dark: { canvas: "#181916", paper: "#22231f", border: "#383933", muted: "#a5a69c", ink: "#ebeae4" },
};
// A literal this colorful is a color, not a paper or ink tone.
const NEUTRAL = 0.03;
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

// The mix for one opaque neutral, or null when it is not one.
export function neutralMix(rgb, mode) {
  const [L, C] = oklch(rgb);
  if (C > NEUTRAL) return null;
  const list = ANCHORS[mode];
  let i = list.findIndex((a) => a.lab[0] >= L);
  if (i === -1) i = list.length - 1;
  const b = list[i],
    a = list[Math.max(0, i - 1)];
  const t = a === b ? 1 : Math.max(0, Math.min(1, (L - a.lab[0]) / (b.lab[0] - a.lab[0])));
  const p = Math.round(t * 100);
  const mixed = a.lab.map((v, k) => v + (b.lab[k] - v) * (p / 100));
  const drift = Math.hypot(...mixed.map((v, k) => v - lab(rgb)[k]));
  if (drift > DRIFT) return null;
  const css = p >= 98 ? `var(--${b.name})` : p <= 2 ? `var(--${a.name})` : `color-mix(in oklab, var(--${b.name}) ${p}%, var(--${a.name}))`;
  return { css, drift };
}

// The themed twin of one declaration value, or null when nothing in it is tied.
export function themeValue(value, mode, report) {
  let changed = false;
  const out = value
    .split(/(url\([^)]*\))/)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(COLOR, (token) => {
            const color = parseColor(token);
            if (!color || color.a < 0.5) return token;
            const mix = neutralMix(color.rgb, mode);
            if (!mix) return token;
            changed = true;
            report?.({ mode, from: token, to: mix.css, drift: mix.drift });
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
        const value = themeValue(decl.value, mode, report);
        if (value !== null) decl.cloneAfter({ value });
      };
      root.walkRules((rule) => {
        if (isTwin(rule)) return;
        const twin = rule.next();
        if (!isTwin(twin)) return;
        const turned = new Set(twin.nodes.filter((n) => n.type === "decl").map((n) => n.prop));
        for (const node of [...rule.nodes]) if (node.type === "decl" && turned.has(node.prop)) tie(node, "light");
        for (const node of [...twin.nodes]) if (node.type === "decl") tie(node, "dark");
      });
    },
  };
}
themeCss.postcss = true;

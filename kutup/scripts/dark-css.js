// Dark mode for Kütüp's stylesheets.
//
// The CSS grew thousands of lines with hundreds of hand-picked colors. Rather
// than rewrite them, the build adds a dark twin right after every rule that
// sets a literal color:
//
//   .card { background: #fffefb; color: #30312f }
//   :where(html[data-mode="dark"]) .card { background: #262624; color: #e6e5e1 }
//
// :where() adds no specificity, so a twin overrides exactly its own original
// and every other rule keeps the place it had in the cascade. Light surfaces
// (backgrounds, borders) turn dark, dark text turns light, and colors that
// already suit a dark page (mid tones, translucent tints, night widgets) are
// left alone. The tokens on :root (--paper, --ink…) are tuned by hand in
// src/dark.css.

export const DARK = 'html[data-mode="dark"]';

// ---------- color math (sRGB <-> OKLCH) ----------
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function oklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

function rgbFrom(L, C, h) {
  const A = C * Math.cos(h),
    B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// Keeps hue and lightness, gives up chroma until the color fits in sRGB.
function toRgb(L, C, h) {
  const fits = (c) => rgbFrom(L, c, h).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  if (!fits(C)) {
    let lo = 0,
      hi = C;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    C = lo;
  }
  return rgbFrom(L, C, h).map((v) => Math.round(Math.max(0, Math.min(1, fromLinear(Math.max(0, v)))) * 255));
}

// ---------- parsing and printing ----------
const NAMED = { white: [255, 255, 255], black: [0, 0, 0] };
export const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/g;

export function parseColor(text) {
  const t = text.trim().toLowerCase();
  if (NAMED[t]) return { rgb: NAMED[t], a: 1 };
  if (t[0] === "#") {
    let hex = t.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("");
    if (hex.length !== 6 && hex.length !== 8) return null;
    const n = (i) => parseInt(hex.slice(i, i + 2), 16);
    return { rgb: [n(0), n(2), n(4)], a: hex.length === 8 ? n(6) / 255 : 1 };
  }
  const parts = t
    .replace(/^rgba?\(|\)$/g, "")
    .split(/[\s,/]+/)
    .filter(Boolean);
  if (parts.length < 3) return null;
  const channel = (p) => (p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p));
  const rgb = parts.slice(0, 3).map(channel);
  const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  return rgb.some(Number.isNaN) || Number.isNaN(a) ? null : { rgb, a };
}

const hex2 = (v) => v.toString(16).padStart(2, "0");
const print = (rgb, a) => (a >= 1 ? `#${rgb.map(hex2).join("")}` : `rgba(${rgb.join(", ")}, ${+a.toFixed(3)})`);

// ---------- the mapping ----------
// Surfaces: a light card or chip becomes a dark one of the same hue; the
// lighter it was, the deeper it goes (paper white sits lowest, pastels a step
// above). Lines stay a little lighter than the surfaces they separate. Vivid
// colors (live dots, gold progress, lime highlights) read well on a dark page
// and stay as they are.
const vivid = (L, C, line) => (line ? C >= 0.08 : L <= 0.8 || (C >= 0.08 && L < 0.9));
function surface({ rgb, a }, line) {
  if (a < 0.5) return null;
  const [L, C, h] = oklch(rgb);
  if (L <= 0.72 || vivid(L, C, line)) return null;
  const L2 = line ? 0.34 + (1 - L) * 0.5 : 0.25 + (1 - L) * 0.6;
  return print(toRgb(L2, Math.min(C * 0.7, 0.04), h), a);
}
// Text: dark ink becomes light ink of the same hue; muted grays stay muted.
function text({ rgb, a }) {
  if (a < 0.35) return null;
  const [L, C, h] = oklch(rgb);
  if (L >= 0.66) return null;
  const L2 = Math.max(0.66, Math.min(0.93, 0.97 - 0.85 * (L - 0.25)));
  return print(toRgb(L2, C * 0.9, h), a);
}

const TEXT = new Set(["color", "-webkit-text-fill-color", "caret-color", "text-decoration", "text-decoration-color"]);
const LINE = /^(?:border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|column-rule(?:-color)?)$/;
const SURFACE = /^(?:background(?:-color|-image)?|box-shadow)$/;

// The dark twin of one declaration value, or null when it needs no change.
export function darkValue(prop, value) {
  const kind = TEXT.has(prop) ? "text" : LINE.test(prop) ? "line" : SURFACE.test(prop) ? "surface" : null;
  if (!kind || !COLOR.test(value)) return null;
  COLOR.lastIndex = 0;
  let changed = false;
  // Never touch what sits inside url(…), e.g. an SVG fragment id like #fade.
  const out = value
    .split(/(url\([^)]*\))/)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(COLOR, (token) => {
            const color = parseColor(token);
            const next = color && (kind === "text" ? text(color) : surface(color, kind === "line"));
            if (!next) return token;
            changed = true;
            return next;
          }),
    )
    .join("");
  return changed ? out : null;
}

const backgroundColors = (decl) =>
  /^background(?:-color)?$/.test(decl.prop)
    ? (decl.value.split(/url\([^)]*\)/).join(" ").match(COLOR) || []).map(parseColor).filter((c) => c && c.a >= 0.5)
    : [];
// Does this declaration paint a surface that is already dark (a night widget,
// the dark button)? Such rules, and rules nested under them, stay as they are.
const paintsDark = (decl) => backgroundColors(decl).some((c) => oklch(c.rgb)[0] < 0.42);
// Does it paint a light surface that stays light (a gold chip)? Then its text
// must stay dark too.
const keepsLight = (decl) => backgroundColors(decl).some((c) => oklch(c.rgb)[0] > 0.6 && !surface(c, false));

const inKeyframes = (node) => {
  for (let p = node.parent; p; p = p.parent) if (p.type === "atrule" && /keyframes$/i.test(p.name)) return true;
  return false;
};
const under = (selector, scope) =>
  selector === scope || [" ", ">", ":", ".", "[", "+", "~"].some((c) => selector.startsWith(scope + c));

/**
 * PostCSS plugin. Mark a rule with a comment: dark: keep leaves it alone,
 * dark: scope makes it and everything under it a dark-by-design scope (for a
 * dark fill that is a token, like the studio card). Options:
 *   skipFiles  – file names whose styles are dark by design (focus screen…)
 *   report     – called with every change, for reviewing the output
 */
export default function darkCss({ skipFiles = [], report } = {}) {
  return {
    postcssPlugin: "kutup-dark",
    Once(root) {
      const file = root.source?.input?.file?.replace(/\\/g, "/") || "";
      if (skipFiles.some((name) => file.endsWith("/" + name))) return;
      const rules = [];
      root.walkRules((rule) => {
        if (!inKeyframes(rule)) rules.push(rule);
      });
      // Pass 1: dark-by-design scopes, wherever in the file they are declared.
      const scopes = [];
      // A rule marked /* dark: scope */ counts too: its dark fill is a token.
      for (const rule of rules)
        if (rule.nodes.some((n) => (n.type === "decl" && paintsDark(n)) || (n.type === "comment" && /dark:\s*scope/.test(n.text))))
          scopes.push(...rule.selectors);
      if (report) for (const scope of scopes) report({ file: file.split("/").pop(), scope });
      // Pass 2: the twins.
      for (const rule of rules) {
        const selectors = rule.selectors;
        if (selectors.some((s) => /^(?::root|html)\b/.test(s))) continue;
        if (selectors.every((s) => scopes.some((scope) => under(s, scope)))) continue;
        if (rule.nodes.some((n) => n.type === "comment" && /dark:\s*keep/.test(n.text))) continue;
        const decls = [];
        const light = rule.nodes.some((n) => n.type === "decl" && keepsLight(n));
        for (const node of rule.nodes) {
          if (node.type !== "decl" || node.prop.startsWith("--")) continue;
          if (light && TEXT.has(node.prop)) continue;
          const value = darkValue(node.prop, node.value);
          if (value === null) continue;
          decls.push({ prop: node.prop, value, important: node.important });
          report?.({ file: file.split("/").pop(), selector: rule.selector, prop: node.prop, from: node.value, to: value });
        }
        if (!decls.length) continue;
        const live = selectors.filter((s) => !scopes.some((scope) => under(s, scope)));
        const twin = rule.clone({ nodes: [] });
        twin.selectors = live.map((s) => `:where(${DARK}) ${s}`);
        for (const d of decls) twin.append(d);
        rule.after(twin);
      }
    },
  };
}
darkCss.postcss = true;

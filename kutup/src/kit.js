// Small helpers shared by the special buildings (n37): shading by normal,
// colour mixing, phase progress, cast shadows and common materials.
import { poly } from "./iso.js";

export const clamp = (v) => Math.max(0, Math.min(1, v));
export const M = 1.6,
  V = M * M * M;
export const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};
export const mixAll = (a, b, t) => a.map((c, i) => mix(c, b[i], t));
export const WET = ["#8e9298", "#7a7e85", "#676b71"],
  CONCRETE = ["#cdcac2", "#b2afa7", "#99968f"],
  PLY = ["#e6c383", "#cfa56a", "#b98e55"],
  REBAR = "#8a4b33";
// A face's shade from its outward normal, lit from the upper left on screen.
export const LIGHT = [0.2, 0.6, 0.8].map((v) => v / Math.hypot(0.2, 0.6, 0.8));
export function shade(P, n, faces) {
  const m = P.mirror ? [n[1], n[0], n[2]] : n;
  const t = clamp((m[0] * LIGHT[0] + m[1] * LIGHT[1] + m[2] * LIGHT[2]) / 0.8);
  return t > 0.5 ? mix(faces[1], faces[0], (t - 0.5) * 2) : mix(faces[2], faces[1], t * 2);
}
export const facing = (n) => n[0] + n[1] + n[2] > 0;
export const progress = (plan, shown) => {
  const k = {};
  for (const p of plan) k[p.floor >= 0 ? `${p.key}${p.floor}` : p.key] = clamp((shown - p.a) / (p.b - p.a));
  return k;
};
// A shadow: the outline of the footprint and its copy thrown to the right.
export function castShadow(P, outline, length) {
  const pts = [];
  for (const [x, y] of outline) pts.push(P(x, y, 0.01), P(x + length, y + length * 0.35, 0.01));
  const p = pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [],
    hi = [];
  for (const q of p) {
    while (lo.length >= 2 && turn(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (const q of p.reverse()) {
    while (hi.length >= 2 && turn(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return poly([...lo.slice(0, -1), ...hi.slice(0, -1)], "#344a22", 0.2);
}
export const rectOutline = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// A worker's tuple for the crew layer: [x, y, z, tool].
export const at = (x, y, z, tool) => [x, y, z, tool];

export const ease = (t) => t * t * (3 - 2 * t);
export const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export const unit = (v) => v.map((c) => c / (Math.hypot(...v) || 1));
const sub = (a, b) => a.map((v, i) => v - b[i]);
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// A surface cell: its corners, its depth along the view, its upward normal.
export function cell(a, b, c, d) {
  let n = unit(cross(sub(c, a), sub(d, b)));
  if (n[2] < 0) n = n.map((v) => -v);
  return { pts: [a, b, c, d], n, depth: (a[0] + b[0] + c[0] + d[0] + a[1] + b[1] + c[1] + d[1] + a[2] + b[2] + c[2] + d[2]) / 4 };
}
// Draw a list of { depth, s } far to near.
export const painted = (list) => list.sort((a, b) => a.depth - b.depth).map((e) => e.s).join("");

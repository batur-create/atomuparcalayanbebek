// Details that make the site feel real: the plot itself, stockpiles that are
// delivered and used up as the work goes on, roof trusses before the tiles, and
// the handover ceremony. Pure functions of progress; SVG strings via iso.js.
import { DIRT, GRASS, box, circle, ellipse, outline, poly, rng, seg } from "./iso.js";

const clamp = (v) => Math.max(0, Math.min(1, v));
const n1 = (v) => v.toFixed(1);
const REBAR = ["#9a5a40", "#84492f", "#6f3c26"],
  PLY = ["#e6c383", "#cfa56a", "#b98e55"],
  BLOCK = ["#ecebe6", "#d9d7cf", "#c4c1b8"],
  PALLET = ["#c7a06a", "#ad8754", "#946f42"],
  BAG = ["#f2efe6", "#dcd7ca", "#c7c1b2"];

// The plot: lawn edge, gravel apron around the dug area, a gate gap in front,
// tyre tracks from the gate and a couple of trees left standing at the back.
export function plotSVG(P, sp, seed) {
  const r = rng(seed + 77);
  const w = sp.hw + 0.95;
  let s = box(P, -3.4, -3.4, 3.4, 3.4, -0.5, 0, GRASS);
  s += poly([P(-w - 0.3, -w - 0.3, 0.004), P(w + 0.3, -w - 0.3, 0.004), P(w + 0.3, w + 0.3, 0.004), P(-w - 0.3, w + 0.3, 0.004)], "#cdbb98");
  s += poly([P(-w, -w, 0.006), P(w, -w, 0.006), P(w, w, 0.006), P(-w, w, 0.006)], DIRT[0]);
  // Gravel specks and soil clods.
  for (let i = 0; i < 26; i++) {
    const x = (r() * 2 - 1) * w,
      y = (r() * 2 - 1) * w,
      [px, py] = P(x, y, 0.01);
    s += `<circle cx="${n1(px)}" cy="${n1(py)}" r="${n1(0.8 + r() * 1.2)}" fill="${r() < 0.5 ? "#c4ad85" : "#b39b74"}"/>`;
  }
  // Tyre tracks from the front gate towards the work.
  for (const off of [-0.32, 0.32]) s += seg(P(3.35, 0.9 + off, 0.01), P(w - 0.2, 0.2 + off, 0.01), "#b79f78", 3, 0.7);
  // Trees kept at the back corners, and tufts along the lawn.
  for (const [x, y, k] of [[-3.05, -1.4, 1], [-1.2, -3.05, 0.85], [-3.0, 1.9, 0.9]]) {
    const [bx, by] = P(x, y, 0);
    s += ellipse(bx + 7 * k, by + 1, 11 * k, 4 * k, "#3f5f2a", 0.2);
    s += poly([[bx - 1.6, by], [bx + 1.6, by], [bx + 1, by - 16 * k], [bx - 1, by - 16 * k]], "#8b5e36");
    s += circle(bx + 1, by - 19 * k, 9 * k, "#47793a") + circle(bx - 4 * k, by - 23 * k, 7 * k, "#5c9548") + circle(bx + 4 * k, by - 25 * k, 6 * k, "#5c9548") + circle(bx - 3 * k, by - 27 * k, 3 * k, "#86bf66");
  }
  for (let i = 0; i < 12; i++) {
    const side = i % 2,
      t = -3.2 + (i / 12) * 6.4,
      [px, py] = side ? P(3.3, t, 0) : P(t, 3.3, 0);
    s += seg([px - 2.5, py - 4], [px, py], "#7fb257", 1) + seg([px + 2.5, py - 4.5], [px, py], "#8fbf62", 1);
  }
  return s;
}

// Block pallets along the front. A small building's mobile crane parks at
// the front left, so there they stand further right.
export const blockPallets = (sp) => (sp.kind === "tower" ? [-1.9, -1.15, -0.4] : [-0.45, 0.3, 1.05]);

// Stockpiles: delivered before they are needed, used up while the work goes on,
// formwork plywood coming back after striking. k holds every phase's progress.
export function materialsSVG(P, sp, k, shown) {
  const w = sp.hw,
    edge = w + 0.2 + (2.9 - (w + 0.2)) / 2; // middle of the strip between foundation and fence
  let back = "",
    front = "";
  const sum = (prefix) => Object.keys(k).filter((key) => key.startsWith(prefix)).reduce((n, key) => n + k[key], 0);
  const floors = sp.floors;
  const handover = clamp((shown - 0.93) / 0.05);
  // Rebar bundles along the back-left fence.
  const rebarUsed = (k.footRebar + sum("colRebar") + sum("deckRebar")) / (1 + floors * 2);
  const bundles = shown < 0.08 || shown > 0.56 ? 0 : Math.max(1, Math.ceil(4 * (1 - rebarUsed)));
  for (let i = 0; i < bundles; i++) {
    const z = 0.06 + Math.floor(i / 2) * 0.13,
      y0 = -1.5 + (i % 2) * 0.12;
    back += box(P, -edge - 0.12, y0, -edge + 0.12, y0 + 2.0, z, z + 0.12, REBAR);
    back += seg(P(-edge + 0.13, y0 + 0.3, z + 0.06), P(-edge + 0.13, y0 + 1.7, z + 0.06), "#c07a5a", 0.8);
  }
  if (bundles) back += box(P, -edge - 0.2, -1.55, -edge + 0.2, -1.4, 0, 0.06, PALLET) + box(P, -edge - 0.2, 0.4, -edge + 0.2, 0.55, 0, 0.06, PALLET);
  // Plywood stack: goes out as formwork, comes back after striking.
  const inUse = clamp((k.footForm - (k.footPour > 0.8 ? 1 : 0)) + sum("colForm") - sum("colPour") + sum("deckForm") - sum("deckPour"));
  if (shown > 0.06 && shown < 0.58) {
    const sheets = Math.round(10 * (1 - 0.8 * inUse));
    back += box(P, -edge - 0.3, 0.85, -edge + 0.3, 1.95, 0, 0.08, PALLET);
    for (let i = 0; i < sheets; i++) back += box(P, -edge - 0.27, 0.88, -edge + 0.27, 1.92, 0.08 + i * 0.035, 0.08 + (i + 1) * 0.035, i % 2 ? PLY : [PLY[0], PLY[2], PLY[1]]);
  }
  // Membrane rolls for the foundation waterproofing, by the cement.
  const rolls = shown < 0.03 || k.footWater >= 1 ? 0 : Math.ceil(4 * (1 - k.footWater));
  for (let i = 0; i < rolls; i++) {
    const x = 0.2 + i * 0.24;
    back += box(P, x, -edge - 0.25, x + 0.18, -edge + 0.25, 0, 0.18, ["#3a3d42", "#2b2e33", "#202326"]);
    const [cx, cy] = P(x + 0.09, -edge + 0.25, 0.09);
    back += `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="3" ry="3.4" fill="#55595f"/>`;
  }
  // Cement bags by the container for the pours and the mortar.
  const bagsLeft = shown < 0.12 || handover > 0 ? 0 : Math.ceil(6 * (1 - clamp((shown - 0.12) / 0.6)));
  for (let i = 0; i < bagsLeft; i++) {
    const x = -1.45 + (i % 3) * 0.3,
      z = Math.floor(i / 3) * 0.12;
    back += box(P, x, -edge - 0.13, x + 0.27, -edge + 0.13, 0.06 + z, 0.18 + z, BAG);
  }
  if (bagsLeft) back += box(P, -1.5, -edge - 0.18, -0.55, -edge + 0.18, 0, 0.06, PALLET);
  // Block pallets in front, delivered before the walls and used course by course.
  if (shown > 0.5 && shown < 0.7) {
    const pallets = Math.max(0, Math.ceil(3 * (1 - clamp((shown - 0.55) / 0.13))));
    const xs = blockPallets(sp);
    for (let i = 0; i < pallets; i++) {
      const x = xs[i];
      front += box(P, x, edge - 0.25, x + 0.6, edge + 0.25, 0, 0.07, PALLET);
      front += box(P, x + 0.03, edge - 0.22, x + 0.57, edge + 0.22, 0.07, 0.5, BLOCK);
      front += seg(P(x + 0.03, edge + 0.23, 0.28), P(x + 0.57, edge + 0.23, 0.28), "#c9c6bd", 0.8);
    }
    // Sand for the mortar, and its mixing tub.
    const [sx, sy] = P(-edge, edge - 0.1, 0);
    front += ellipse(sx, sy - 3, 15, 6, "#d8c08a") + ellipse(sx - 3, sy - 6, 9, 4, "#e3cd99");
  }
  // Roof tiles on a pallet, front right, until the roof is on.
  if (shown > 0.62 && shown < 0.78) {
    const stacks = Math.max(1, Math.ceil(3 * (1 - clamp((shown - 0.748) / 0.032))));
    for (let i = 0; i < stacks; i++) {
      const y = 0.2 + i * 0.42;
      front += box(P, edge - 0.25, y, edge + 0.25, y + 0.38, 0, 0.06, PALLET) + box(P, edge - 0.22, y + 0.02, edge + 0.22, y + 0.36, 0.06, 0.34, [sp.roof[2], sp.roof[0], sp.roof[1]]);
    }
  }
  return { back, front };
}

// Roof structure before the tiles: trusses set one by one along the ridge,
// then purlins across them (gable); hip and jack rafters on a pyramid roof.
export function trussesSVG(P, sp, ridgeZ, topZ, t) {
  const w = sp.hw,
    o = 0.32,
    eave = topZ - 0.1,
    wood = "#b5803f",
    dark = "#8f6230";
  let s = "";
  if (sp.roofType === "pyramid") {
    const a = w + o;
    const corners = [[-a, -a], [a, -a], [a, a], [-a, a]];
    corners.forEach(([x, y], i) => {
      if (t * 6 > i) s += seg(P(x, y, eave), P(0, 0, ridgeZ), i % 2 ? dark : wood, 2.2);
    });
    if (t > 0.65)
      for (let k = 1; k < 4; k++) {
        const r = a * (1 - k / 4),
          z = eave + (ridgeZ - eave) * (k / 4);
        if ((t - 0.65) * 3 * 3 > k - 1)
          s += outline([P(-r, -r, z), P(r, -r, z), P(r, r, z), P(-r, r, z)], wood, 1.1);
      }
    return s;
  }
  const trusses = 5,
    placed = Math.min(trusses, Math.ceil(clamp(t / 0.6) * trusses));
  for (let i = 0; i < placed; i++) {
    const x = -w + (2 * w * i) / (trusses - 1);
    s += seg(P(x, -w - o, eave), P(x, 0, ridgeZ), wood, 1.8) + seg(P(x, w + o, eave), P(x, 0, ridgeZ), wood, 1.8);
    s += seg(P(x, -w, topZ), P(x, w, topZ), dark, 1.4) + seg(P(x, 0, topZ), P(x, 0, ridgeZ), dark, 1.2);
    s += seg(P(x, -w * 0.5, topZ), P(x, 0, ridgeZ - 0.3), dark, 1) + seg(P(x, w * 0.5, topZ), P(x, 0, ridgeZ - 0.3), dark, 1);
  }
  if (t > 0.6) {
    const purlins = Math.ceil(clamp((t - 0.6) / 0.4) * 6);
    for (let j = 0; j < purlins; j++) {
      const side = j % 2 ? 1 : -1,
        f = (Math.floor(j / 2) + 1) / 4,
        y = side * (w + o) * (1 - f),
        z = eave + (ridgeZ - eave) * f;
      s += seg(P(-w - o, y, z), P(w + o, y, z), wood, 1.6);
    }
  }
  return s;
}

// Handover: a ribbon across the door is cut, then the occupancy stamp lands.
export function handoverSVG(P, sp, dt) {
  const w = sp.hw;
  let s = "";
  const left = P(-0.7, w + 0.9, 0),
    right = P(0.7, w + 0.9, 0);
  const pole = (q) => `<rect x="${n1(q[0] - 1.5)}" y="${n1(q[1] - 26)}" width="3" height="26" rx="1.5" fill="#d9c9a8"/>`;
  s += pole(left) + pole(right);
  const cut = dt > 0.9;
  const sag = cut ? Math.min(20, (dt - 0.9) * 60) : 0;
  const yTop = left[1] - 18;
  if (!cut) s += `<path d="M${n1(left[0])} ${n1(yTop)} Q${n1((left[0] + right[0]) / 2)} ${n1(yTop + 5)} ${n1(right[0])} ${n1(right[1] - 18)}" fill="none" stroke="#e5484d" stroke-width="3.2"/>`;
  else {
    const mx = (left[0] + right[0]) / 2;
    s += `<path d="M${n1(left[0])} ${n1(yTop)} Q${n1(left[0] + 6)} ${n1(yTop + sag)} ${n1(mx - 4)} ${n1(yTop + 4 + sag)}" fill="none" stroke="#e5484d" stroke-width="3.2"/>`;
    s += `<path d="M${n1(right[0])} ${n1(right[1] - 18)} Q${n1(right[0] - 6)} ${n1(right[1] - 18 + sag)} ${n1(mx + 4)} ${n1(right[1] - 14 + sag)}" fill="none" stroke="#e5484d" stroke-width="3.2"/>`;
  }
  // The bow, and scissors closing on the ribbon.
  const bx = (left[0] + right[0]) / 2,
    by = (yTop + right[1] - 18) / 2 + 3;
  if (!cut) s += `<path d="M${n1(bx)} ${n1(by)} l-7 -5 v10 z M${n1(bx)} ${n1(by)} l7 -5 v10 z" fill="#c9343a"/>`;
  if (dt > 0.3 && dt < 1.3) {
    const close = clamp((dt - 0.3) / 0.6) * 0.5;
    s += `<g transform="translate(${n1(bx)} ${n1(by - 2)})"><line x1="0" y1="0" x2="${n1(-14 * Math.cos(close))}" y2="${n1(-14 * Math.sin(close + 0.4))}" stroke="#6b7480" stroke-width="2.4" stroke-linecap="round"/><line x1="0" y1="0" x2="${n1(-14 * Math.cos(close))}" y2="${n1(14 * Math.sin(close + 0.4) - 6)}" stroke="#6b7480" stroke-width="2.4" stroke-linecap="round"/></g>`;
  }
  // The stamp lands with a thud (scale 1.7 → 1, no fading), slightly tilted.
  if (dt > 1.2) {
    const land = clamp((dt - 1.2) / 0.25),
      scale = 1 + 0.7 * (1 - land) * (1 - land);
    s += `<g transform="translate(560 74) rotate(-9) scale(${scale.toFixed(3)})"><rect x="-82" y="-22" width="164" height="44" rx="8" fill="#fffaf1" stroke="#2f8a57" stroke-width="3.5"/><rect x="-76" y="-16" width="152" height="32" rx="5" fill="none" stroke="#2f8a57" stroke-width="1.4"/><text x="0" y="7" text-anchor="middle" fill="#2f8a57" font-size="19" font-weight="800" font-family="DM Sans, sans-serif" letter-spacing="1">İSKÂN ALINDI ✅</text></g>`;
  }
  return s;
}

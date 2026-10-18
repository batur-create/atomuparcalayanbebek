// Isometric building art shared by the construction site (SVG strings) and the
// village map (Canvas 2D). Every primitive either returns an SVG fragment or, when
// a canvas is bound with useCanvas(), paints straight onto it and returns "".
// Because `a() + b()` evaluates left to right, the same drawing code paints in
// the same order on both backends.

import { BY_ID } from "../shared/catalog.js";
import { specialById, specialOf } from "./special.js";

export const COS = 0.866,
  SIN = 0.5;
export const projector = (o) => (x, y, z) => [
  o.cx + (x - y) * COS * o.s,
  o.cy + (x + y) * SIN * o.s - z * o.s,
];
// Facing 1 draws the building mirrored (door on the screen-right wall).
export const mirrored = (P) => {
  const M = (x, y, z) => P(y, x, z);
  M.mirror = true;
  return M;
};
export const f = (v) => v.toFixed(1);
export const pts = (list) => list.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");

// ---------- backend ----------
let CTX = null,
  TINT = (c) => c,
  LINE = 1;
/** Paint onto `ctx` until useSVG(); `tint` maps every colour (time of day). */
export function useCanvas(ctx, tint = (c) => c, lineScale = 1) {
  CTX = ctx;
  TINT = tint;
  LINE = lineScale;
}
export function useSVG() {
  CTX = null;
  TINT = (c) => c;
  LINE = 1;
}
function trace(list) {
  CTX.beginPath();
  CTX.moveTo(list[0][0], list[0][1]);
  for (let i = 1; i < list.length; i++) CTX.lineTo(list[i][0], list[i][1]);
  CTX.closePath();
}
const alpha = (o) => (o < 1 ? ` opacity="${o}"` : "");
export function poly(list, fill, opacity = 1) {
  if (!CTX) return `<polygon points="${pts(list)}" fill="${fill}"${alpha(opacity)}/>`;
  trace(list);
  CTX.globalAlpha = opacity;
  CTX.fillStyle = TINT(fill);
  CTX.fill();
  CTX.globalAlpha = 1;
  return "";
}
export function outline(list, stroke, w) {
  if (!CTX)
    return `<polygon points="${pts(list)}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
  trace(list);
  CTX.lineJoin = "round";
  CTX.lineWidth = w * LINE;
  CTX.strokeStyle = TINT(stroke);
  CTX.stroke();
  return "";
}
export function seg(a, b, stroke, w, opacity = 1) {
  if (!CTX)
    return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"${alpha(opacity)}/>`;
  CTX.beginPath();
  CTX.moveTo(a[0], a[1]);
  CTX.lineTo(b[0], b[1]);
  CTX.lineCap = "round";
  CTX.lineWidth = Math.max(0.4, w * LINE);
  CTX.globalAlpha = opacity;
  CTX.strokeStyle = TINT(stroke);
  CTX.stroke();
  CTX.globalAlpha = 1;
  return "";
}
export function ellipse(cx, cy, rx, ry, fill, opacity = 1) {
  if (!CTX) return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${alpha(opacity)}/>`;
  CTX.beginPath();
  CTX.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  CTX.globalAlpha = opacity;
  CTX.fillStyle = TINT(fill);
  CTX.fill();
  CTX.globalAlpha = 1;
  return "";
}
export const circle = (cx, cy, r, fill, opacity = 1) => ellipse(cx, cy, r, r, fill, opacity);
/** Text painted along a wall between world points a and b: sheared onto the
 *  face, sized to fit, and never mirrored. */
export function wallText(P, a, b, label, maxSize, fill) {
  let p = P(...a),
    q = P(...b);
  if (q[0] < p[0]) [p, q] = [q, p];
  const span = Math.max(0.01, q[0] - p[0]),
    k = (q[1] - p[1]) / span,
    size = Math.min(maxSize, span / (0.66 * label.length));
  if (size < 2.6) return "";
  const mx = (p[0] + q[0]) / 2,
    my = (p[1] + q[1]) / 2;
  if (!CTX)
    return `<text transform="matrix(1 ${k.toFixed(3)} 0 1 ${f(mx)} ${f(my)})" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-weight="800" font-size="${f(size)}" fill="${fill}">${label}</text>`;
  CTX.save();
  CTX.transform(1, k, 0, 1, mx, my);
  CTX.font = `800 ${size}px system-ui, sans-serif`;
  CTX.textAlign = "center";
  CTX.textBaseline = "middle";
  CTX.fillStyle = TINT(fill);
  CTX.fillText(label, 0, 0);
  CTX.restore();
  return "";
}
export function rect(x, y, w, h, fill, radius = 0) {
  if (!CTX) return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${radius}" fill="${fill}"/>`;
  CTX.beginPath();
  if (CTX.roundRect && radius) CTX.roundRect(x, y, w, h, radius * LINE);
  else CTX.rect(x, y, w, h);
  CTX.fillStyle = TINT(fill);
  CTX.fill();
  return "";
}

// Visible faces of an axis-aligned box: +y side, +x side, top. Mirrored
// buildings swap the side shades so the light always comes from the left.
export function box(P, x0, y0, x1, y1, z0, z1, c) {
  const [left, right] = P.mirror ? [c[2], c[1]] : [c[1], c[2]];
  return (
    poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], left) +
    poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], right) +
    poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], c[0])
  );
}
export const faceY = (P, y, x0, x1, z0, z1) => [P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)];
export const faceX = (P, x, y0, y1, z0, z1) => [P(x, y0, z0), P(x, y1, z0), P(x, y1, z1), P(x, y0, z1)];

// ---------- palette ----------
export const GRASS = ["#a6d37a", "#88b960", "#71a04e"];
export const DIRT = ["#ddc8a4", "#c8ab83", "#b1946c"];
export const STONE = ["#d6d0c4", "#bcb4a5", "#a59c8c"];
export const WOOD = ["#d9a364", "#bd8649", "#a3703a"];
export const CRANE = ["#f8ca4f", "#e4b031", "#c99622"];
const WALLS = {
  brick: { faces: ["#f2a689", "#e3866d", "#c96d55"], grain: "#f9cdb9", pattern: "rows" },
  cream: { faces: ["#f7ecd6", "#ebdbbb", "#d8c5a1"], grain: "#dcc8a2", pattern: "trim" },
  wood: { faces: ["#e2b47e", "#cc965c", "#b07c46"], grain: "#b98249", pattern: "planks" },
  sage: { faces: ["#d7e6cc", "#bfd2b1", "#a5bb96"], grain: "#b2c7a3", pattern: "trim" },
  stone: { faces: ["#e0dacf", "#c8c0b2", "#aea596"], grain: "#b5ad9f", pattern: "blocks" },
  glass: { faces: ["#e2f4f1", "#c4e6e1", "#a9d6d0"], grain: "#ffffff", pattern: "panes" },
};
const ROOFS = [
  ["#7a66d8", "#5c49b6", "#9d8ce6"],
  ["#e07a5f", "#b85a42", "#eb9a83"],
  ["#4f9d8a", "#367a69", "#72b8a6"],
  ["#d4a24c", "#a97c2c", "#e2bb72"],
  ["#c4577a", "#9b3c5c", "#d77b98"],
  ["#4a76b0", "#345d93", "#6f95c8"],
];
export const GLASS = "#3f4d69",
  LIT = "#ffd36e",
  FRAME = "#fff6e6";

// Deterministic randomness: the same seed always draws the same building.
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function baseSpec(kind, seed) {
  const r = rng(seed + 11);
  const roof = ROOFS[Math.floor(r() * ROOFS.length)];
  const pick = (list) => WALLS[list[Math.floor(r() * list.length)]];
  if (kind === "tower")
    return { kind, hw: 1.45, h: 5.6, floors: 3, roofType: "pyramid", roof, wall: pick(["stone", "cream"]), flag: ROOFS[Math.floor(r() * ROOFS.length)][0], lit: r() < 0.4 };
  if (kind === "house")
    return { kind, hw: 2, h: 3.7, floors: 2, roofType: "gable", roof, wall: pick(["brick", "cream", "sage", "wood"]), chimney: r() < 0.85, lit: r() < 0.35 };
  return { kind: "cottage", hw: 1.6, h: 2.2, floors: 1, roofType: "gable", roof, wall: pick(["brick", "wood", "cream", "sage"]), chimney: r() < 0.75, lit: r() < 0.35 };
}
/** Everything needed to draw a building. `model`: its catalogue entry, which
 *  fixes the wall, roof colour and fittings; the seed varies the rest. */
export function spec(kind, seed, model) {
  const base = baseSpec(kind, seed);
  const look = BY_ID[model]?.look;
  if (!look) return base;
  // A building of its own shape (src/special.js) sets its own size and skin.
  if (look.special) return { ...base, model, look, special: look.special, roofType: "special", chimney: false, flag: null, lit: base.lit, ...specialById(look.special).spec(base) };
  return {
    ...base,
    model,
    look,
    wall: look.wall ? WALLS[look.wall] : base.wall,
    roof: look.roofColors || (look.roof != null ? ROOFS[look.roof] : base.roof),
    roofType: look.dome ? "dome" : base.roofType,
    chimney: look.chimney ?? base.chimney,
    flag: look.flag === false ? null : base.flag,
  };
}
export const topOf = (sp) => 0.3 + sp.h;
export const ridgeOf = (sp) => topOf(sp) + (sp.roofType === "special" ? specialOf(sp).ridge : sp.roofType === "pyramid" ? 2.4 : sp.roofType === "dome" ? sp.hw + 0.25 : sp.hw * 0.85);

// ---------- building pieces ----------
export function shadowSVG(P, sp, t = 1) {
  const L = sp.h * 0.42 * t + 0.2,
    w = sp.hw + 0.2;
  return poly([P(w, -w, 0.01), P(w + L, -w + L * 0.35, 0.01), P(w + L, w + L * 0.35, 0.01), P(w, w, 0.01)], "#344a22", 0.2);
}
export const foundationSVG = (P, sp) => {
  const w = sp.hw + 0.2;
  return box(P, -w, -w, w, w, 0, 0.3, STONE);
};
export function wallsSVG(P, sp, t = 1) {
  const w = sp.hw,
    z1 = 0.3 + sp.h * t;
  let s = box(P, -w, -w, w, w, 0.3, z1, sp.wall.faces);
  const g = sp.wall.grain;
  if (sp.wall.pattern === "rows" || sp.wall.pattern === "blocks") {
    const step = sp.wall.pattern === "rows" ? 0.34 : 0.62;
    for (let z = 0.3 + step; z < z1 - 0.05; z += step)
      s += seg(P(-w, w + 0.01, z), P(w, w + 0.01, z), g, 1, 0.75) + seg(P(w + 0.01, -w, z), P(w + 0.01, w, z), g, 1, 0.6);
  } else if (sp.wall.pattern === "panes") {
    for (let x = -w + 0.5; x < w; x += 0.5) s += seg(P(x, w + 0.01, 0.3), P(x, w + 0.01, z1), g, 1.2, 0.9);
    for (let y = -w + 0.5; y < w; y += 0.5) s += seg(P(w + 0.01, y, 0.3), P(w + 0.01, y, z1), g, 1.2, 0.8);
    for (let z = 0.3 + 0.55; z < z1 - 0.05; z += 0.55) s += seg(P(-w, w + 0.01, z), P(w, w + 0.01, z), g, 1, 0.8) + seg(P(w + 0.01, -w, z), P(w + 0.01, w, z), g, 1, 0.7);
  } else if (sp.wall.pattern === "planks") {
    for (let x = -w + 0.4; x < w; x += 0.4) s += seg(P(x, w + 0.01, 0.3), P(x, w + 0.01, z1), g, 1, 0.55);
    for (let y = -w + 0.4; y < w; y += 0.4) s += seg(P(w + 0.01, y, 0.3), P(w + 0.01, y, z1), g, 1, 0.45);
  }
  if (sp.wall.pattern === "trim" || sp.kind === "house")
    s += seg(P(w + 0.01, w + 0.01, 0.3), P(w + 0.01, w + 0.01, z1), "#fffaf0", 1.6, 0.85);
  // A lighthouse's painted bands, every other storey.
  if (sp.look?.bands)
    for (let k = 1; k < sp.floors; k += 2) {
      const fh = sp.h / sp.floors,
        a = 0.3 + k * fh,
        b = Math.min(z1, a + fh);
      if (a < z1) s += poly(faceY(P, w + 0.005, -w, w, a, b), sp.look.bands) + poly(faceX(P, w + 0.005, -w, w, a, b), sp.look.bands, 0.85);
    }
  if (sp.floors > 1 && t > 0.55)
    for (let k = 1; k < sp.floors; k++) {
      const z = 0.3 + (sp.h / sp.floors) * k;
      if (z < z1) s += seg(P(-w, w + 0.02, z), P(w, w + 0.02, z), "#fffaf0", 2, 0.7) + seg(P(w + 0.02, -w, z), P(w + 0.02, w, z), "#fffaf0", 2, 0.55);
    }
  return s;
}
export function doorSVG(P, sp) {
  const w = sp.hw,
    d = sp.kind === "cottage" ? 0.36 : 0.45,
    h = sp.kind === "tower" ? 2.1 : 1.85;
  return (
    box(P, -d - 0.25, w, d + 0.25, w + 0.4, 0, 0.3, STONE) +
    poly(faceY(P, w + 0.01, -d - 0.08, d + 0.08, 0.3, 0.3 + h + 0.08), FRAME) +
    poly(faceY(P, w + 0.02, -d, d, 0.3, 0.3 + h), "#7b4f2c") +
    seg(P(0, w + 0.03, 0.35), P(0, w + 0.03, 0.3 + h - 0.05), "#68411f", 1, 0.6) +
    poly(faceY(P, w + 0.03, d - 0.22, d - 0.1, 0.3 + h * 0.48, 0.3 + h * 0.48 + 0.12), "#f2c14e")
  );
}
// Window spans of floor k on the door wall (front) and the side wall.
function spansOf(sp, k) {
  if ((sp.look?.clock || sp.look?.lamp || sp.look?.dome) && k === sp.floors - 1) return { front: [], side: [] };
  return {
    front: sp.kind === "tower" ? (k ? [[-0.32, 0.32]] : []) : sp.kind === "house" ? [[-1.55, -0.95], [0.95, 1.55]] : [[0.55, 1.12]],
    side: sp.kind === "tower" ? [[-0.32, 0.32]] : sp.kind === "house" ? [[-1.4, -0.8], [0.8, 1.4]] : [[-0.9, -0.32]],
  };
}
// Every window of the building, ordered bottom to top so they light up in turn.
function windowList(P, sp) {
  const w = sp.hw,
    fh = sp.h / sp.floors,
    list = [];
  for (let k = 0; k < sp.floors; k++) {
    const z0 = 0.3 + k * fh + fh * 0.36,
      z1 = z0 + Math.min(0.85, fh * 0.4);
    const { front, side } = spansOf(sp, k);
    front.forEach(([a, b]) => list.push({ face: faceY(P, w + 0.02, a, b, z0, z1), frame: faceY(P, w + 0.015, a - 0.08, b + 0.08, z0 - 0.08, z1 + 0.08), sill: [P(a - 0.14, w + 0.05, z0 - 0.1), P(b + 0.14, w + 0.05, z0 - 0.1)], cross: [[P((a + b) / 2, w + 0.03, z0), P((a + b) / 2, w + 0.03, z1)], [P(a, w + 0.03, (z0 + z1) / 2), P(b, w + 0.03, (z0 + z1) / 2)]] }));
    side.forEach(([a, b]) => list.push({ face: faceX(P, w + 0.02, a, b, z0, z1), frame: faceX(P, w + 0.015, a - 0.08, b + 0.08, z0 - 0.08, z1 + 0.08), sill: [P(w + 0.05, a - 0.14, z0 - 0.1), P(w + 0.05, b + 0.14, z0 - 0.1)], cross: [[P(w + 0.03, (a + b) / 2, z0), P(w + 0.03, (a + b) / 2, z1)], [P(w + 0.03, a, (z0 + z1) / 2), P(w + 0.03, b, (z0 + z1) / 2)]] }));
  }
  return list;
}
// Window and door openings in world terms: { face: "y" | "x", a, b, z0, z1 }.
// Same layout as windowList() and doorSVG(), so masonry leaves the right holes.
export function openingList(sp) {
  const fh = sp.h / sp.floors,
    list = [];
  for (let k = 0; k < sp.floors; k++) {
    const z0 = 0.3 + k * fh + fh * 0.36,
      z1 = z0 + Math.min(0.85, fh * 0.4);
    const { front, side } = spansOf(sp, k);
    front.forEach(([a, b]) => list.push({ face: "y", a, b, z0, z1 }));
    side.forEach(([a, b]) => list.push({ face: "x", a, b, z0, z1 }));
  }
  const d = sp.kind === "cottage" ? 0.36 : 0.45,
    h = sp.kind === "tower" ? 2.1 : 1.85;
  list.push({ face: "y", a: -d, b: d, z0: 0.3, z1: 0.3 + h });
  return list;
}
export function windowsSVG(P, sp, lit, reveal = 1, detail = true) {
  const list = windowList(P, sp);
  return list
    .slice(0, Math.ceil(list.length * reveal - 0.001))
    .map((win) =>
      detail
        ? poly(win.frame, FRAME) + poly(win.face, lit ? LIT : GLASS) + win.cross.map(([a, b]) => seg(a, b, FRAME, 1.1)).join("") + seg(win.sill[0], win.sill[1], "#e8dcc6", 2)
        : poly(win.face, lit ? LIT : GLASS),
    )
    .join("");
}
export function roofSVG(P, sp, detail = true) {
  const w = sp.hw,
    o = 0.32,
    top = topOf(sp),
    ridge = ridgeOf(sp),
    [front, back, light] = sp.roof;
  if (sp.roofType === "dome") return domeSVG(P, sp, detail);
  if (sp.roofType === "pyramid") {
    const a = w + o,
      eave = top - 0.05,
      apex = P(0, 0, ridge);
    let s = poly([P(-a, a, eave), P(a, a, eave), apex], P.mirror ? back : front) + poly([P(a, -a, eave), P(a, a, eave), apex], P.mirror ? front : back);
    if (!detail) return s;
    for (let k = 1; k < 4; k++) {
      const t = k / 4,
        z = eave + (ridge - eave) * t,
        r = a * (1 - t);
      s += seg(P(-r, r, z), P(r, r, z), light, 1.2, 0.7) + seg(P(r, -r, z), P(r, r, z), front, 1.2, 0.5);
    }
    return s + seg(P(-a, a, eave), P(a, a, eave), back, 2) + seg(P(a, -a, eave), P(a, a, eave), back, 2);
  }
  const eave = top - 0.1;
  let s =
    poly([P(-w - o, -w - o, eave), P(w + o, -w - o, eave), P(w + o, 0, ridge), P(-w - o, 0, ridge)], back) +
    poly([P(w, -w, top), P(w, w, top), P(w, 0, ridge - 0.12)], P.mirror ? sp.wall.faces[1] : sp.wall.faces[2]) +
    poly([P(-w - o, w + o, eave), P(w + o, w + o, eave), P(w + o, 0, ridge), P(-w - o, 0, ridge)], front);
  if (!detail) return s;
  for (let k = 1; k < 4; k++) {
    const t = k / 4,
      y = (w + o) * (1 - t),
      z = eave + (ridge - eave) * t;
    s += seg(P(-w - o, y, z), P(w + o, y, z), light, 1.2, 0.75);
  }
  return (
    s +
    seg(P(-w - o, 0, ridge), P(w + o, 0, ridge), back, 2.2) +
    seg(P(-w - o, w + o, eave), P(w + o, w + o, eave), back, 2) +
    poly([P(w + o, w + o, eave), P(w + o, 0, ridge), P(w + o, 0, ridge - 0.14), P(w + o, w + o, eave - 0.14)], back)
  );
}
// An observatory dome on a drum, its shutter slit, and a little black hole
// circling above it.
function domeSVG(P, sp, detail = true) {
  const w = sp.hw,
    top = topOf(sp);
  let s = box(P, -w - 0.1, -w - 0.1, w + 0.1, w + 0.1, top - 0.12, top + 0.05, STONE);
  const [cx, cy] = P(0, 0, top + 0.05),
    unit = Math.abs(P(0, 0, 1)[1] - P(0, 0, 0)[1]),
    r = w + 0.05,
    rx = r * unit * 1.2247,
    ry = r * unit * 0.7071,
    rz = r * unit * 1.05;
  const arc = (from, to, n, f) => Array.from({ length: n + 1 }, (_, i) => f(from + ((to - from) * i) / n));
  const outline = [...arc(Math.PI, 0, 18, (a) => [cx + rx * Math.cos(a), cy - rz * Math.sin(a)]), ...arc(0, Math.PI, 12, (a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)])];
  s += poly(outline, "#dfe3e8");
  // The shaded right half.
  s += poly([...arc(Math.PI / 2, 0, 9, (a) => [cx + rx * Math.cos(a), cy - rz * Math.sin(a)]), ...arc(0, Math.PI / 2, 6, (a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)])], "#b9c0c8");
  if (detail) {
    s += poly([[cx - rx * 0.09, cy + ry * 0.98], [cx + rx * 0.09, cy + ry * 0.98], [cx + rx * 0.07, cy - rz * 0.99], [cx - rx * 0.07, cy - rz * 0.99]], "#3d4552");
    for (const k of [0.35, 0.7]) s += seg([cx - rx * Math.sqrt(1 - k * k), cy - rz * k], [cx + rx * Math.sqrt(1 - k * k), cy - rz * k], "#c9cfd6", 1, 0.8);
  }
  // The black hole in orbit.
  const hy = cy - rz - unit * 0.9;
  s += ellipse(cx, hy, unit * 0.95, unit * 0.32, "#f2a65a", 0.85) + ellipse(cx, hy, unit * 0.6, unit * 0.2, "#ffd08a", 0.9) + circle(cx, hy, unit * 0.34, "#0b0b12");
  return s;
}
export function chimneySVG(P, sp, t = 1) {
  if (!sp.chimney) return "";
  const x = sp.hw - 0.1,
    z1 = 0.3 + (ridgeOf(sp) + 0.55 - 0.3) * t;
  return box(P, x, -0.3, x + 0.55, 0.3, 0.3, z1, ["#b9a99a", "#a08f80", "#86776a"]) + (t >= 1 ? box(P, x - 0.06, -0.36, x + 0.61, 0.36, z1 - 0.18, z1, STONE) : "");
}
// Where smoke leaves the chimney, in building coordinates.
export const chimneyTop = (sp) => [sp.hw + 0.18, 0, ridgeOf(sp) + 0.6];
export function flagSVG(P, sp, t = 1, wave = 0) {
  if (!sp.flag) return "";
  const apex = ridgeOf(sp),
    top = apex + 1.3 * t;
  const a = P(0, 0, top),
    b = P(0, 0, apex);
  const flap = 0.9 + 0.12 * Math.sin(wave);
  return seg(b, a, "#6b5e52", 1.6) + (t >= 1 ? poly([a, P(0.9 * flap, -0.25 * flap, top - 0.25), P(0, 0, top - 0.55)], sp.flag) : "");
}
export function gardenSVG(P, sp, seed = 1) {
  const r = rng(seed + 5),
    w = sp.hw;
  const size = P(1, 0, 0)[0] - P(0, 0, 0)[0];
  const bush = (x, y, rad, c) => {
    const p = P(x, y, 0.15);
    return ellipse(p[0], p[1] - rad * 0.55, rad, rad * 0.78, c) + ellipse(p[0] - rad * 0.25, p[1] - rad * 0.8, rad * 0.45, rad * 0.32, "#9fd07c", 0.7);
  };
  let s = "";
  for (let i = 0; i < 3; i++) {
    const y = w + 0.62 + i * 0.5;
    s += poly([P(-0.24, y - 0.17, 0.012), P(0.24, y - 0.17, 0.012), P(0.24, y + 0.17, 0.012), P(-0.24, y + 0.17, 0.012)], "#e3d8c2");
  }
  if (!sp.look?.tables && !sp.look?.beds) s += bush(-w - 0.1, w + 0.75, Math.abs(size) * 0.42, "#5e9b4c") + bush(-w + 0.5, w + 0.9, Math.abs(size) * 0.3, "#73b05c");
  if (r() < 0.8) s += bush(w + 0.75, w - 0.2, Math.abs(size) * 0.36, "#5e9b4c");
  const flowers = ["#e98aa8", "#ffd36e", "#ffffff", "#b39ddb"];
  for (let i = 0; i < 5; i++) {
    const p = P(w * 0.2 + r() * w * 0.8, w + 0.7 + r() * 0.5, 0.05);
    s += circle(p[0], p[1], Math.abs(size) * 0.07 + 1, flowers[i % flowers.length]);
  }
  return s;
}
// ---------- fittings: what makes a catalogue building itself ----------
const doorTop = (sp) => 0.3 + (sp.kind === "tower" ? 2.1 : 1.85);
const doorHalf = (sp) => (sp.kind === "cottage" ? 0.36 : 0.45);
// A striped canopy over the door, with a scalloped front edge.
function awningSVG(P, sp) {
  const w = sp.hw,
    color = sp.look.awning,
    x0 = -doorHalf(sp) - 0.55,
    x1 = doorHalf(sp) + 0.55,
    zt = doorTop(sp) + 0.32,
    zb = zt - 0.36,
    out = 0.62,
    n = 6;
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n,
      b = x0 + ((x1 - x0) * (i + 1)) / n;
    s += poly([P(a, w + 0.01, zt), P(b, w + 0.01, zt), P(b, w + out, zb), P(a, w + out, zb)], i % 2 ? "#fbf5ea" : color);
    s += poly([P(a, w + out, zb), P(b, w + out, zb), P((a + b) / 2, w + out, zb - 0.13)], i % 2 ? "#e9dfcd" : color);
  }
  return s + seg(P(x0, w + out, zb), P(x1, w + out, zb), "#00000033", 0.8);
}
// Window boxes with flowers under every window.
function flowerBoxesSVG(P, sp, detail) {
  const w = sp.hw,
    colors = ["#e98aa8", "#ffd36e", "#ffffff", "#c4577a"];
  let s = "";
  openingList(sp).forEach((o, i) => {
    if (o.z0 <= 0.3) return; // the door
    const z0 = o.z0 - 0.2,
      z1 = o.z0 - 0.07;
    s += o.face === "y" ? box(P, o.a - 0.06, w, o.b + 0.06, w + 0.17, z0, z1, WOOD) : box(P, w, o.a - 0.06, w + 0.17, o.b + 0.06, z0, z1, WOOD);
    if (detail < 2) return;
    for (let j = 0; j < 3; j++) {
      const t = o.a + ((o.b - o.a) * (j + 0.5)) / 3;
      const [cx, cy] = o.face === "y" ? P(t, w + 0.09, z1 + 0.06) : P(w + 0.09, t, z1 + 0.06);
      s += circle(cx, cy, 1.6, "#5e9b4c") + circle(cx, cy - 1.2, 1.2, colors[(i + j) % colors.length]);
    }
  });
  return s;
}
// Louvred shutters either side of every window.
function shuttersSVG(P, sp) {
  const w = sp.hw,
    c = sp.look.shutters;
  let s = "";
  for (const o of openingList(sp)) {
    if (o.z0 <= 0.3) continue; // the door
    for (const [a, b] of [[o.a - 0.3, o.a - 0.06], [o.b + 0.06, o.b + 0.3]]) {
      s += poly(o.face === "y" ? faceY(P, w + 0.025, a, b, o.z0 - 0.04, o.z1 + 0.04) : faceX(P, w + 0.025, a, b, o.z0 - 0.04, o.z1 + 0.04), c);
      for (let z = o.z0 + 0.1; z < o.z1; z += 0.14)
        s += o.face === "y" ? seg(P(a + 0.03, w + 0.03, z), P(b - 0.03, w + 0.03, z), "#00000030", 0.7) : seg(P(w + 0.03, a + 0.03, z), P(w + 0.03, b - 0.03, z), "#00000030", 0.7);
    }
  }
  return s;
}
// A first-floor balcony on the door wall: slab, French door, railing.
function balconySVG(P, sp) {
  const w = sp.hw,
    z = 0.3 + sp.h / sp.floors;
  let s = poly(faceY(P, w + 0.015, -0.32, 0.32, z, z + 1.25), FRAME) + poly(faceY(P, w + 0.02, -0.26, 0.26, z + 0.04, z + 1.2), GLASS);
  s += seg(P(0, w + 0.03, z + 0.05), P(0, w + 0.03, z + 1.2), FRAME, 1);
  s += box(P, -0.95, w, 0.95, w + 0.52, z - 0.08, z + 0.02, STONE);
  for (let x = -0.9; x <= 0.91; x += 0.3) s += seg(P(x, w + 0.5, z + 0.02), P(x, w + 0.5, z + 0.5), "#3c4146", 1);
  s += seg(P(0.92, w + 0.05, z + 0.5), P(0.92, w + 0.5, z + 0.5), "#3c4146", 1.4);
  return s + seg(P(-0.92, w + 0.5, z + 0.5), P(0.92, w + 0.5, z + 0.5), "#3c4146", 1.4);
}
// Clock faces on both visible walls of the top floor.
function clockSVG(P, sp, detail) {
  const w = sp.hw,
    fh = sp.h / sp.floors,
    zc = 0.3 + fh * (sp.floors - 0.5),
    r = Math.min(0.62, fh * 0.36);
  const ring = (face, rad) =>
    Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2,
        u = Math.cos(a) * rad,
        v = zc + Math.sin(a) * rad;
      return face === "y" ? P(u, w + 0.03, v) : P(w + 0.03, u, v);
    });
  let s = "";
  for (const face of ["y", "x"]) {
    s += poly(ring(face, r + 0.09), "#4a4f55") + poly(ring(face, r), "#fbf5ea");
    if (detail < 2) continue;
    const at = (u, v) => (face === "y" ? P(u, w + 0.04, zc + v) : P(w + 0.04, u, zc + v));
    for (let i = 0; i < 12; i += 3) s += seg(at(Math.cos((i / 12) * Math.PI * 2) * r * 0.8, Math.sin((i / 12) * Math.PI * 2) * r * 0.8), at(Math.cos((i / 12) * Math.PI * 2) * r * 0.92, Math.sin((i / 12) * Math.PI * 2) * r * 0.92), "#4a4f55", 1);
    s += seg(at(0, 0), at(0, r * 0.7), "#2f3338", 1.4) + seg(at(0, 0), at(r * 0.5, -r * 0.1), "#2f3338", 1.4);
  }
  return s;
}
// Windmill sails on an axle from the door wall, turning with `angle`.
export function sailsSVG(P, sp, angle = 0.4, detail = 2, blades = 4) {
  const w = sp.hw,
    zc = 0.3 + sp.h - 0.55,
    y = w + 0.6,
    L = 3.1,
    W = 0.62;
  let s = box(P, -0.12, w, 0.12, y, zc - 0.12, zc + 0.12, WOOD);
  for (let i = 0; i < blades; i++) {
    const a = angle + (i * Math.PI) / 2,
      dx = Math.cos(a),
      dz = Math.sin(a),
      nx = -dz,
      nz = dx;
    const at = (t, o) => P(dx * t + nx * o, y, zc + dz * t + nz * o);
    s += poly([at(0.5, 0.04), at(L, 0.04), at(L, W), at(0.5, W)], "#fffaf0", 0.95);
    if (detail >= 2) {
      for (let t = 0.85; t < L; t += 0.37) s += seg(at(t, 0.04), at(t, W), "#8a6a48", 0.8);
      s += seg(at(0.5, W), at(L, W), "#8a6a48", 1);
    }
    s += seg(at(0.12, 0), at(L + 0.1, 0), "#6b4f34", 2.2);
  }
  const [hx, hy] = P(0, y + 0.02, zc);
  return s + circle(hx, hy, 2.4, "#6b4f34");
}
// A columned porch the height of the ground floor, its name on the entablature.
export function porticoSVG(P, sp, detail = 2) {
  const w = sp.hw,
    z1 = 0.3 + sp.h / sp.floors,
    depth = 0.95;
  const MARBLE = ["#fbf8f1", "#e6dfd0", "#cfc5b2"];
  // The porch floor and its steps; the wall behind the columns lies in shade.
  let s = box(P, -1.8, w, 1.8, w + depth + 0.2, 0, 0.15, STONE) + box(P, -1.7, w, 1.7, w + depth, 0.15, 0.3, STONE);
  s += poly(faceY(P, w + 0.012, -1.7, 1.7, 0.3, z1), "#8f877a", 0.55);
  for (const x of [-1.5, -0.82, 0.82, 1.5]) {
    s += box(P, x - 0.17, w + depth - 0.42, x + 0.17, w + depth - 0.08, 0.3, 0.42, MARBLE);
    s += box(P, x - 0.13, w + depth - 0.38, x + 0.13, w + depth - 0.12, 0.42, z1 - 0.1, MARBLE);
    s += box(P, x - 0.18, w + depth - 0.43, x + 0.18, w + depth - 0.07, z1 - 0.1, z1, MARBLE);
    if (detail >= 2)
      for (const o of [-0.06, 0.05]) s += seg(P(x + o, w + depth - 0.115, 0.45), P(x + o, w + depth - 0.115, z1 - 0.12), "#d3cab8", 0.6);
  }
  // Entablature with the name, and a pediment above it.
  s += box(P, -1.85, w, 1.85, w + depth, z1, z1 + 0.34, MARBLE);
  s += poly([P(-1.85, w + depth, z1 + 0.34), P(1.85, w + depth, z1 + 0.34), P(0, w + depth, z1 + 0.95)], MARBLE[1]);
  s += poly([P(-1.85, w, z1 + 0.34), P(-1.85, w + depth, z1 + 0.34), P(0, w + depth, z1 + 0.95), P(0, w, z1 + 0.95)], MARBLE[0]);
  s += poly([P(0, w, z1 + 0.95), P(0, w + depth, z1 + 0.95), P(1.85, w + depth, z1 + 0.34), P(1.85, w, z1 + 0.34)], MARBLE[2]);
  if (detail >= 2 && sp.look.sign) s += wallText(P, [-1.7, w + depth + 0.01, z1 + 0.17], [1.7, w + depth + 0.01, z1 + 0.17], sp.look.sign, 10, "#5c5246");
  return s;
}
// Two café tables with parasols where the garden would be.
function tablesSVG(P, sp) {
  const w = sp.hw;
  let s = "";
  for (const [x, y] of [[-w + 0.15, w + 1.2], [-w + 0.95, w + 0.75]]) {
    for (const [cx, cy] of [[x - 0.32, y], [x + 0.32, y]]) s += box(P, cx - 0.09, cy - 0.09, cx + 0.09, cy + 0.09, 0, 0.32, WOOD);
    const top = Array.from({ length: 10 }, (_, i) => P(x + Math.cos((i / 10) * Math.PI * 2) * 0.24, y + Math.sin((i / 10) * Math.PI * 2) * 0.24, 0.5));
    s += seg(P(x, y, 0), P(x, y, 0.5), "#6b5e52", 1.2) + poly(top, "#f7ecd6");
    s += seg(P(x, y, 0.5), P(x, y, 1.45), "#6b5e52", 0.9);
    const rim = Array.from({ length: 8 }, (_, i) => [x + Math.cos((i / 8) * Math.PI * 2) * 0.55, y + Math.sin((i / 8) * Math.PI * 2) * 0.55]);
    rim.forEach(([ax, ay], i) => {
      const [bx, by] = rim[(i + 1) % 8];
      s += poly([P(ax, ay, 1.22), P(bx, by, 1.22), P(x, y, 1.52)], i % 2 ? "#fbf5ea" : sp.look.awning);
    });
  }
  return s;
}
// Raised vegetable beds in front, sprouting in rows.
function bedsSVG(P, sp) {
  const w = sp.hw;
  let s = "";
  for (let i = 0; i < 3; i++) {
    const y = w + 0.55 + i * 0.42;
    s += box(P, -w - 0.25, y, -0.42, y + 0.3, 0, 0.14, WOOD) + poly([P(-w - 0.2, y + 0.04, 0.141), P(-0.47, y + 0.04, 0.141), P(-0.47, y + 0.26, 0.141), P(-w - 0.2, y + 0.26, 0.141)], "#7a5a3c");
    for (let x = -w - 0.08; x < -0.5; x += 0.24) {
      const [cx, cy] = P(x, y + 0.15, 0.2);
      s += circle(cx, cy, 1.5, i === 1 ? "#e07a3a" : "#6fae4f") + circle(cx - 0.8, cy - 1.2, 1.1, "#8ccf6a");
    }
  }
  return s;
}
// A painted board on two posts in the front yard.
function yardSignSVG(P, sp) {
  const w = sp.hw,
    x0 = w * 0.62 - 0.62,
    x1 = w * 0.62 + 0.62,
    y = w + 1.15;
  let s = seg(P(x0 + 0.1, y, 0), P(x0 + 0.1, y, 0.95), "#6b4f34", 1.6) + seg(P(x1 - 0.1, y, 0), P(x1 - 0.1, y, 0.95), "#6b4f34", 1.6);
  s += box(P, x0, y - 0.04, x1, y, 0.52, 1.02, ["#f7ecd6", "#ead9b8", "#d8c5a1"]);
  s += poly(faceY(P, y + 0.002, x0 + 0.05, x1 - 0.05, 0.56, 0.98), "#fffaf0");
  return s + wallText(P, [x0 + 0.08, y + 0.005, 0.77], [x1 - 0.08, y + 0.005, 0.77], sp.look.sign, 8, "#4a3a2c");
}
// A lighthouse's lamp room: a lit glass band under the roof with a gallery.
function lampSVG(P, sp) {
  const w = sp.hw,
    top = topOf(sp),
    z0 = top - 1.0,
    z1 = top - 0.15;
  // The gallery floor first; the walls above it stand in front of its far half.
  let s = box(P, -w - 0.22, -w - 0.22, w + 0.22, w + 0.22, z0 - 0.12, z0, ["#4a4f55", "#3c4146", "#2f3338"]);
  s += poly(faceY(P, w, -w, w, z0, top), sp.wall.faces[P.mirror ? 2 : 1]) + poly(faceX(P, w, -w, w, z0, top), sp.wall.faces[P.mirror ? 1 : 2]);
  s += poly(faceY(P, w + 0.02, -w + 0.12, w - 0.12, z0 + 0.05, z1), LIT) + poly(faceX(P, w + 0.02, -w + 0.12, w - 0.12, z0 + 0.05, z1), "#ffc94a");
  for (const t of [-0.5, 0, 0.5]) s += seg(P(t * w, w + 0.03, z0), P(t * w, w + 0.03, z1), "#4a4f55", 1.2) + seg(P(w + 0.03, t * w, z0), P(w + 0.03, t * w, z1), "#4a4f55", 1.2);
  for (let t = -w - 0.2; t <= w + 0.21; t += 0.35) s += seg(P(t, w + 0.22, z0), P(t, w + 0.22, z0 + 0.38), "#4a4f55", 0.8) + seg(P(w + 0.22, t, z0), P(w + 0.22, t, z0 + 0.38), "#4a4f55", 0.8);
  return s + seg(P(-w - 0.22, w + 0.22, z0 + 0.38), P(w + 0.22, w + 0.22, z0 + 0.38), "#4a4f55", 1) + seg(P(w + 0.22, -w - 0.22, z0 + 0.38), P(w + 0.22, w + 0.22, z0 + 0.38), "#4a4f55", 1);
}
// Plants behind a greenhouse's glass.
function plantsSVG(P, sp) {
  const w = sp.hw;
  let s = "";
  for (let i = 0; i < 6; i++) {
    const t = -w + 0.35 + i * ((2 * w - 0.7) / 5);
    const [ax, ay] = P(t, w - 0.05, 0.75 + (i % 2) * 0.25),
      [bx, by] = P(w - 0.05, t, 0.7 + ((i + 1) % 2) * 0.3);
    s += circle(ax, ay, 4.2, i % 3 ? "#5e9b4c" : "#73b05c", 0.85) + circle(bx, by, 3.8, i % 2 ? "#4f8a40" : "#6aa955", 0.8);
    if (i % 2) s += circle(ax + 1.5, ay - 2.5, 1.4, "#e98aa8");
  }
  return s;
}
/** Fittings fixed to the walls and roof (drawn with the walls, before the roof). */
export function wallFittingsSVG(P, sp, detail = 2) {
  const look = sp.look;
  if (!look || !detail) return "";
  let s = "";
  if (look.shutters && detail >= 2) s += shuttersSVG(P, sp);
  if (look.boxes) s += flowerBoxesSVG(P, sp, detail);
  if (look.clock) s += clockSVG(P, sp, detail);
  if (look.lamp) s += lampSVG(P, sp);
  if (look.plants && detail >= 2) s += plantsSVG(P, sp);
  if (look.balcony && detail >= 2) s += balconySVG(P, sp);
  if (look.awning) s += awningSVG(P, sp);
  return s;
}
/** Fittings standing in front of the building (drawn after the roof). */
export function frontFittingsSVG(P, sp, detail = 2, angle = 0.4) {
  const look = sp.look;
  if (!look || !detail) return "";
  let s = "";
  if (look.sails) s += sailsSVG(P, sp, angle, detail);
  if (look.columns) s += porticoSVG(P, sp, detail);
  return s;
}
/** Fittings in the yard (with the garden). */
export function yardFittingsSVG(P, sp, detail = 2) {
  const look = sp.look;
  if (!look || detail < 2) return "";
  let s = "";
  if (look.beds) s += bedsSVG(P, sp);
  if (look.tables) s += tablesSVG(P, sp);
  if (look.sign && !look.columns) s += yardSignSVG(P, sp);
  return s;
}

/** Snow lying on the roof: the upper part of each slope we can see. */
export function snowSVG(P, sp) {
  const w = sp.hw,
    o = 0.32,
    top = topOf(sp),
    ridge = ridgeOf(sp),
    SNOW = "#f4f7fa",
    SHADE = "#dde5ee";
  const along = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  if (sp.roofType === "special") return specialOf(sp).snow?.(P, sp) || "";
  if (sp.roofType === "dome") {
    const [cx, cy] = P(0, 0, ridge - 0.05),
      unit = Math.abs(P(0, 0, 1)[1] - P(0, 0, 0)[1]);
    return ellipse(cx, cy + unit * 0.35, unit * w * 0.85, unit * 0.45, SNOW, 0.95);
  }
  if (sp.roofType === "pyramid") {
    const a = w + o,
      eave = top - 0.05,
      apex = [0, 0, ridge],
      left = [[-a, a, eave], [a, a, eave]],
      right = [[a, -a, eave], [a, a, eave]];
    let s = "";
    for (const [[p0, p1], fill] of [[left, SNOW], [right, SHADE]]) {
      const q0 = along(apex, p0, 0.62),
        q1 = along(apex, p1, 0.62);
      s += poly([P(...apex), P(...q1), P(...along(q1, q0, 0.25)), P(...along(q0, q1, 0.25)), P(...q0)], fill, 0.95);
    }
    return s;
  }
  const eave = top - 0.1,
    edge = (t) => [w + o, (w + o) * (1 - t), eave + (ridge - eave) * t];
  // The front slope down to two thirds, with a soft wavy lower edge.
  const lo = 0.38;
  const wave = [];
  for (let i = 0; i <= 8; i++) {
    const x = -w - o + ((2 * (w + o)) * i) / 8,
      t = lo + (i % 2 ? 0.05 : 0);
    wave.push(P(x, (w + o) * (1 - t), eave + (ridge - eave) * t));
  }
  return poly([P(-w - o, 0, ridge), P(w + o, 0, ridge), ...wave.reverse()], SNOW, 0.95) + seg(P(-w - o, 0, ridge + 0.03), P(w + o, 0, ridge + 0.03), SHADE, 2.4) + poly([P(...edge(1)), P(...edge(lo)), P(w + o, (w + o) * (1 - lo), eave + (ridge - eave) * lo - 0.12), P(w + o, 0, ridge - 0.12)], SHADE, 0.9);
}
/** Ivy climbing the walls of a house left alone for days (drawn over it). */
export function vinesSVG(P, sp, seed = 1) {
  if (sp.roofType === "special") return "";
  const r = rng(seed + 23),
    w = sp.hw,
    top = 0.3 + sp.h * 0.75;
  let s = poly(faceY(P, w + 0.03, -w, w, 0.3, 0.3 + sp.h), "#7d7466", 0.12) + poly(faceX(P, w + 0.03, -w, w, 0.3, 0.3 + sp.h), "#7d7466", 0.16);
  for (let i = 0; i < 5; i++) {
    const side = i % 2,
      t = -w + 0.3 + r() * (2 * w - 0.6),
      at = (z, dt) => (side ? P(w + 0.04, t + dt, z) : P(t + dt, w + 0.04, z));
    let prev = at(0.3, 0);
    for (let z = 0.6; z < top * (0.6 + 0.4 * r()); z += 0.3) {
      const next = at(z, Math.sin(z * 3 + i) * 0.12);
      s += seg(prev, next, "#4f7a3a", 1.2);
      s += circle(next[0] + (i % 3) - 1, next[1], 1.6, "#5e9b4c");
      prev = next;
    }
  }
  return s;
}
/** n40: a building saved once after its site cracked: a fresh lime-plaster
 * patch over the crack on the front wall, with the old crack still running out
 * of it (a repair you can see, like a real one). */
export function patchSVG(P, sp, seed = 1) {
  const r = rng(seed + 41),
    w = sp.hw,
    h = Math.min(sp.h || 2, 3),
    // Low on the back half of the side wall, under the windows and clear of the chimney.
    y0 = -w * (0.55 + r() * 0.1),
    z0 = 0.66,
    a = Math.min(0.6, w * 0.38),
    b = Math.min(0.28, h * 0.12),
    x = w + 0.05;
  const crack = [P(x, y0 + a * 0.8, z0 + b * 0.4), P(x, y0 + a * 1.25, z0 + b * 1.6), P(x, y0 + a * 1.1, z0 + b * 2.6)];
  return (
    seg(crack[0], crack[1], "#5b4a3a", 1.4) + seg(crack[1], crack[2], "#5b4a3a", 1.1) +
    poly([P(x, y0 - a, z0 - b), P(x, y0 + a, z0 - b * 0.8), P(x, y0 + a * 0.9, z0 + b), P(x, y0 - a * 0.85, z0 + b * 0.9)], "#e9e1cf", 0.95) +
    seg(P(x, y0 - a * 0.5, z0 - b * 0.5), P(x, y0 + a * 0.5, z0 + b * 0.5), "#b9ac93", 1) +
    seg(P(x, y0 - a * 0.5, z0 + b * 0.5), P(x, y0 + a * 0.5, z0 - b * 0.5), "#b9ac93", 1)
  );
}
/** A finished building. `detail` 2 = full, 1 = simple (far away), 0 = a block. */
export function buildingSVG(P, sp, seed, { lit = sp.lit, detail = 2, shadowP = P } = {}) {
  if (sp.roofType === "special") return specialOf(sp).building(P, sp, seed, { lit, detail, shadowP });
  if (detail === 0) return box(P, -sp.hw, -sp.hw, sp.hw, sp.hw, 0, topOf(sp), sp.wall.faces) + roofSVG(P, sp, false);
  if (detail === 1)
    return shadowSVG(shadowP, sp) + box(P, -sp.hw, -sp.hw, sp.hw, sp.hw, 0, topOf(sp), sp.wall.faces) + windowsSVG(P, sp, lit, 1, false) + wallFittingsSVG(P, sp, 1) + roofSVG(P, sp, false) + frontFittingsSVG(P, sp, 1, seed);
  return (
    shadowSVG(shadowP, sp) + foundationSVG(P, sp) + wallsSVG(P, sp) + doorSVG(P, sp) + windowsSVG(P, sp, lit) + wallFittingsSVG(P, sp) +
    roofSVG(P, sp) + (sp.roofType === "pyramid" ? flagSVG(P, sp) : chimneySVG(P, sp)) + frontFittingsSVG(P, sp, 2, seed) + gardenSVG(P, sp, seed) + yardFittingsSVG(P, sp)
  );
}

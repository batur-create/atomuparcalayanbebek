// Isometric building art shared by the construction site (SVG strings) and the
// village map (Canvas 2D). Every primitive either returns an SVG fragment or, when
// a canvas is bound with useCanvas(), paints straight onto it and returns "".
// Because `a() + b()` evaluates left to right, the same drawing code paints in
// the same order on both backends.

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
export function spec(kind, seed) {
  const r = rng(seed + 11);
  const roof = ROOFS[Math.floor(r() * ROOFS.length)];
  const pick = (list) => WALLS[list[Math.floor(r() * list.length)]];
  if (kind === "tower")
    return { kind, hw: 1.45, h: 5.6, floors: 3, roofType: "pyramid", roof, wall: pick(["stone", "cream"]), flag: ROOFS[Math.floor(r() * ROOFS.length)][0], lit: r() < 0.4 };
  if (kind === "house")
    return { kind, hw: 2, h: 3.7, floors: 2, roofType: "gable", roof, wall: pick(["brick", "cream", "sage", "wood"]), chimney: r() < 0.85, lit: r() < 0.35 };
  return { kind: "cottage", hw: 1.6, h: 2.2, floors: 1, roofType: "gable", roof, wall: pick(["brick", "wood", "cream", "sage"]), chimney: r() < 0.75, lit: r() < 0.35 };
}
export const topOf = (sp) => 0.3 + sp.h;
export const ridgeOf = (sp) => topOf(sp) + (sp.roofType === "pyramid" ? 2.4 : sp.hw * 0.85);

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
  } else if (sp.wall.pattern === "planks") {
    for (let x = -w + 0.4; x < w; x += 0.4) s += seg(P(x, w + 0.01, 0.3), P(x, w + 0.01, z1), g, 1, 0.55);
    for (let y = -w + 0.4; y < w; y += 0.4) s += seg(P(w + 0.01, y, 0.3), P(w + 0.01, y, z1), g, 1, 0.45);
  }
  if (sp.wall.pattern === "trim" || sp.kind === "house")
    s += seg(P(w + 0.01, w + 0.01, 0.3), P(w + 0.01, w + 0.01, z1), "#fffaf0", 1.6, 0.85);
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
// Every window of the building, ordered bottom to top so they light up in turn.
function windowList(P, sp) {
  const w = sp.hw,
    fh = sp.h / sp.floors,
    list = [];
  for (let k = 0; k < sp.floors; k++) {
    const z0 = 0.3 + k * fh + fh * 0.36,
      z1 = z0 + Math.min(0.85, fh * 0.4);
    const front =
      sp.kind === "tower" ? (k ? [[-0.32, 0.32]] : []) : sp.kind === "house" ? [[-1.55, -0.95], [0.95, 1.55]] : [[0.55, 1.12]];
    const side = sp.kind === "tower" ? [[-0.32, 0.32]] : sp.kind === "house" ? [[-1.4, -0.8], [0.8, 1.4]] : [[-0.9, -0.32]];
    front.forEach(([a, b]) => list.push({ face: faceY(P, w + 0.02, a, b, z0, z1), frame: faceY(P, w + 0.015, a - 0.08, b + 0.08, z0 - 0.08, z1 + 0.08), sill: [P(a - 0.14, w + 0.05, z0 - 0.1), P(b + 0.14, w + 0.05, z0 - 0.1)], cross: [[P((a + b) / 2, w + 0.03, z0), P((a + b) / 2, w + 0.03, z1)], [P(a, w + 0.03, (z0 + z1) / 2), P(b, w + 0.03, (z0 + z1) / 2)]] }));
    side.forEach(([a, b]) => list.push({ face: faceX(P, w + 0.02, a, b, z0, z1), frame: faceX(P, w + 0.015, a - 0.08, b + 0.08, z0 - 0.08, z1 + 0.08), sill: [P(w + 0.05, a - 0.14, z0 - 0.1), P(w + 0.05, b + 0.14, z0 - 0.1)], cross: [[P(w + 0.03, (a + b) / 2, z0), P(w + 0.03, (a + b) / 2, z1)], [P(w + 0.03, a, (z0 + z1) / 2), P(w + 0.03, b, (z0 + z1) / 2)]] }));
  }
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
export function chimneySVG(P, sp, t = 1) {
  if (!sp.chimney) return "";
  const x = sp.hw - 0.1,
    z1 = 0.3 + (ridgeOf(sp) + 0.55 - 0.3) * t;
  return box(P, x, -0.3, x + 0.55, 0.3, 0.3, z1, ["#b9a99a", "#a08f80", "#86776a"]) + (t >= 1 ? box(P, x - 0.06, -0.36, x + 0.61, 0.36, z1 - 0.18, z1, STONE) : "");
}
// Where smoke leaves the chimney, in building coordinates.
export const chimneyTop = (sp) => [sp.hw + 0.18, 0, ridgeOf(sp) + 0.6];
export function flagSVG(P, sp, t = 1, wave = 0) {
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
  s += bush(-w - 0.1, w + 0.75, Math.abs(size) * 0.42, "#5e9b4c") + bush(-w + 0.5, w + 0.9, Math.abs(size) * 0.3, "#73b05c");
  if (r() < 0.8) s += bush(w + 0.75, w - 0.2, Math.abs(size) * 0.36, "#5e9b4c");
  const flowers = ["#e98aa8", "#ffd36e", "#ffffff", "#b39ddb"];
  for (let i = 0; i < 5; i++) {
    const p = P(w * 0.2 + r() * w * 0.8, w + 0.7 + r() * 0.5, 0.05);
    s += circle(p[0], p[1], Math.abs(size) * 0.07 + 1, flowers[i % flowers.length]);
  }
  return s;
}
/** A finished building. `detail` 2 = full, 1 = simple (far away), 0 = a block. */
export function buildingSVG(P, sp, seed, { lit = sp.lit, detail = 2, shadowP = P } = {}) {
  if (detail === 0) return box(P, -sp.hw, -sp.hw, sp.hw, sp.hw, 0, topOf(sp), sp.wall.faces) + roofSVG(P, sp, false);
  if (detail === 1)
    return shadowSVG(shadowP, sp) + box(P, -sp.hw, -sp.hw, sp.hw, sp.hw, 0, topOf(sp), sp.wall.faces) + windowsSVG(P, sp, lit, 1, false) + roofSVG(P, sp, false);
  return shadowSVG(shadowP, sp) + foundationSVG(P, sp) + wallsSVG(P, sp) + doorSVG(P, sp) + windowsSVG(P, sp, lit) + roofSVG(P, sp) + (sp.roofType === "pyramid" ? flagSVG(P, sp) : chimneySVG(P, sp)) + gardenSVG(P, sp, seed);
}

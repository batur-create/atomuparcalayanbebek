// Kütüp köyü: build-mode focus sessions raise a building, stage by stage, on an
// isometric plot; finished ones join their owner's village for good.
// Everything is hand-built SVG driven by one requestAnimationFrame loop, so it
// stays light enough to run for a whole session with the screen kept on.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { get } from "./api.js";
import { reducedMotion } from "./ui.jsx";

export const KINDS = {
  cottage: { label: "Kulübe", emoji: "🏡", minutes: 25 },
  house: { label: "İki katlı ev", emoji: "🏠", minutes: 50 },
  tower: { label: "Kule", emoji: "🏰", minutes: 75 },
};
export const kindFor = (minutes) =>
  minutes >= 70 ? "tower" : minutes >= 40 ? "house" : "cottage";

// ---------- drawing primitives ----------
const COS = 0.866,
  SIN = 0.5;
const projector = (o) => (x, y, z) => [
  o.cx + (x - y) * COS * o.s,
  o.cy + (x + y) * SIN * o.s - z * o.s,
];
const f = (v) => v.toFixed(1);
const pts = (list) => list.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
const poly = (list, fill, extra = "") => `<polygon points="${pts(list)}" fill="${fill}" ${extra}/>`;
const seg = (a, b, stroke, w, extra = "") =>
  `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
// Visible faces of an axis-aligned box: +y side, +x side, top.
function box(P, x0, y0, x1, y1, z0, z1, c) {
  return (
    poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], c[1]) +
    poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], c[2]) +
    poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], c[0])
  );
}
const faceY = (P, y, x0, x1, z0, z1) => [P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)];
const faceX = (P, x, y0, y1, z0, z1) => [P(x, y0, z0), P(x, y1, z0), P(x, y1, z1), P(x, y0, z1)];

const GRASS = ["#a6d37a", "#88b960", "#71a04e"];
const DIRT = ["#ddc8a4", "#c8ab83", "#b1946c"];
const STONE = ["#d6d0c4", "#bcb4a5", "#a59c8c"];
const WOOD = ["#d9a364", "#bd8649", "#a3703a"];
const CRANE = ["#f8ca4f", "#e4b031", "#c99622"];
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
const GLASS = "#3f4d69",
  LIT = "#ffd36e",
  FRAME = "#fff6e6";

// Deterministic randomness: the same seed always draws the same building.
function rng(seed) {
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
const topOf = (sp) => 0.3 + sp.h;
const ridgeOf = (sp) => topOf(sp) + (sp.roofType === "pyramid" ? 2.4 : sp.hw * 0.85);

// ---------- building pieces ----------
function shadowSVG(P, sp, t = 1) {
  const L = sp.h * 0.42 * t + 0.2,
    w = sp.hw + 0.2;
  return poly([P(w, -w, 0.01), P(w + L, -w + L * 0.35, 0.01), P(w + L, w + L * 0.35, 0.01), P(w, w, 0.01)], "rgba(52,74,34,.2)");
}
const foundationSVG = (P, sp) => {
  const w = sp.hw + 0.2;
  return box(P, -w, -w, w, w, 0, 0.3, STONE);
};
function wallsSVG(P, sp, t = 1) {
  const w = sp.hw,
    z1 = 0.3 + sp.h * t;
  let s = box(P, -w, -w, w, w, 0.3, z1, sp.wall.faces);
  const g = sp.wall.grain;
  if (sp.wall.pattern === "rows" || sp.wall.pattern === "blocks") {
    const step = sp.wall.pattern === "rows" ? 0.34 : 0.62;
    for (let z = 0.3 + step; z < z1 - 0.05; z += step)
      s += seg(P(-w, w + 0.01, z), P(w, w + 0.01, z), g, 1, 'opacity=".75"') + seg(P(w + 0.01, -w, z), P(w + 0.01, w, z), g, 1, 'opacity=".6"');
  } else if (sp.wall.pattern === "planks") {
    for (let x = -w + 0.4; x < w; x += 0.4) s += seg(P(x, w + 0.01, 0.3), P(x, w + 0.01, z1), g, 1, 'opacity=".55"');
    for (let y = -w + 0.4; y < w; y += 0.4) s += seg(P(w + 0.01, y, 0.3), P(w + 0.01, y, z1), g, 1, 'opacity=".45"');
  }
  if (sp.wall.pattern === "trim" || sp.kind === "house") {
    s += seg(P(w + 0.01, w + 0.01, 0.3), P(w + 0.01, w + 0.01, z1), "#fffaf0", 1.6, 'opacity=".85"');
  }
  if (sp.floors > 1 && t > 0.55)
    for (let k = 1; k < sp.floors; k++) {
      const z = 0.3 + (sp.h / sp.floors) * k;
      if (z < z1) s += seg(P(-w, w + 0.02, z), P(w, w + 0.02, z), "#fffaf0", 2, 'opacity=".7"') + seg(P(w + 0.02, -w, z), P(w + 0.02, w, z), "#fffaf0", 2, 'opacity=".55"');
    }
  return s;
}
function doorSVG(P, sp) {
  const w = sp.hw,
    d = sp.kind === "cottage" ? 0.36 : 0.45,
    h = sp.kind === "tower" ? 2.1 : 1.85;
  return (
    box(P, -d - 0.25, w, d + 0.25, w + 0.4, 0, 0.3, STONE) +
    poly(faceY(P, w + 0.01, -d - 0.08, d + 0.08, 0.3, 0.3 + h + 0.08), FRAME) +
    poly(faceY(P, w + 0.02, -d, d, 0.3, 0.3 + h), "#7b4f2c") +
    seg(P(0, w + 0.03, 0.35), P(0, w + 0.03, 0.3 + h - 0.05), "#68411f", 1, 'opacity=".6"') +
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
function windowsSVG(P, sp, lit, reveal = 1) {
  const list = windowList(P, sp);
  return list
    .slice(0, Math.ceil(list.length * reveal - 0.001))
    .map((win) => poly(win.frame, FRAME) + poly(win.face, lit ? LIT : GLASS) + win.cross.map(([a, b]) => seg(a, b, FRAME, 1.1)).join("") + seg(win.sill[0], win.sill[1], "#e8dcc6", 2))
    .join("");
}
function roofSVG(P, sp) {
  const w = sp.hw,
    o = 0.32,
    top = topOf(sp),
    ridge = ridgeOf(sp),
    [front, back, light] = sp.roof;
  if (sp.roofType === "pyramid") {
    const a = w + o,
      eave = top - 0.05,
      apex = P(0, 0, ridge);
    let s = poly([P(-a, a, eave), P(a, a, eave), apex], front) + poly([P(a, -a, eave), P(a, a, eave), apex], back);
    for (let k = 1; k < 4; k++) {
      const t = k / 4,
        z = eave + (ridge - eave) * t,
        r = a * (1 - t);
      s += seg(P(-r, r, z), P(r, r, z), light, 1.2, 'opacity=".7"') + seg(P(r, -r, z), P(r, r, z), front, 1.2, 'opacity=".5"');
    }
    return s + seg(P(-a, a, eave), P(a, a, eave), back, 2) + seg(P(a, -a, eave), P(a, a, eave), back, 2);
  }
  const eave = top - 0.1;
  let s =
    poly([P(-w - o, -w - o, eave), P(w + o, -w - o, eave), P(w + o, 0, ridge), P(-w - o, 0, ridge)], back) +
    poly([P(w, -w, top), P(w, w, top), P(w, 0, ridge - 0.12)], sp.wall.faces[2]) +
    poly([P(-w - o, w + o, eave), P(w + o, w + o, eave), P(w + o, 0, ridge), P(-w - o, 0, ridge)], front);
  for (let k = 1; k < 4; k++) {
    const t = k / 4,
      y = (w + o) * (1 - t),
      z = eave + (ridge - eave) * t;
    s += seg(P(-w - o, y, z), P(w + o, y, z), light, 1.2, 'opacity=".75"');
  }
  return (
    s +
    seg(P(-w - o, 0, ridge), P(w + o, 0, ridge), back, 2.2) +
    seg(P(-w - o, w + o, eave), P(w + o, w + o, eave), back, 2) +
    poly([P(w + o, w + o, eave), P(w + o, 0, ridge), P(w + o, 0, ridge - 0.14), P(w + o, w + o, eave - 0.14)], back)
  );
}
function chimneySVG(P, sp, t = 1) {
  if (!sp.chimney) return "";
  const x = sp.hw - 0.1,
    z1 = 0.3 + (ridgeOf(sp) + 0.55 - 0.3) * t;
  return box(P, x, -0.3, x + 0.55, 0.3, 0.3, z1, ["#b9a99a", "#a08f80", "#86776a"]) + (t >= 1 ? box(P, x - 0.06, -0.36, x + 0.61, 0.36, z1 - 0.18, z1, STONE) : "");
}
function flagSVG(P, sp, t = 1, wave = 0) {
  const apex = ridgeOf(sp),
    top = apex + 1.3 * t;
  const a = P(0, 0, top),
    b = P(0, 0, apex);
  const flap = 0.9 + 0.12 * Math.sin(wave);
  return seg(b, a, "#6b5e52", 1.6) + (t >= 1 ? poly([a, P(0.9 * flap, -0.25 * flap, top - 0.25), P(0, 0, top - 0.55)], sp.flag) : "");
}
function gardenSVG(P, sp, seed = 1) {
  const r = rng(seed + 5),
    w = sp.hw;
  const bush = (x, y, rad, c) => {
    const p = P(x, y, 0.15);
    return `<ellipse cx="${f(p[0])}" cy="${f(p[1] - rad * 0.55)}" rx="${f(rad)}" ry="${f(rad * 0.78)}" fill="${c}"/><ellipse cx="${f(p[0] - rad * 0.25)}" cy="${f(p[1] - rad * 0.8)}" rx="${f(rad * 0.45)}" ry="${f(rad * 0.32)}" fill="#9fd07c" opacity=".7"/>`;
  };
  const size = P(1, 0, 0)[0] - P(0, 0, 0)[0];
  let s = "";
  for (let i = 0; i < 3; i++) {
    const y = w + 0.62 + i * 0.5;
    s += poly([P(-0.24, y - 0.17, 0.012), P(0.24, y - 0.17, 0.012), P(0.24, y + 0.17, 0.012), P(-0.24, y + 0.17, 0.012)], "#e3d8c2");
  }
  s += bush(-w - 0.1, w + 0.75, size * 0.42, "#5e9b4c") + bush(-w + 0.5, w + 0.9, size * 0.3, "#73b05c");
  if (r() < 0.8) s += bush(w + 0.75, w - 0.2, size * 0.36, "#5e9b4c");
  const flowers = ["#e98aa8", "#ffd36e", "#ffffff", "#b39ddb"];
  for (let i = 0; i < 5; i++) {
    const p = P(w * 0.2 + r() * w * 0.8, w + 0.7 + r() * 0.5, 0.05);
    s += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(size * 0.07 + 1)}" fill="${flowers[i % flowers.length]}"/>`;
  }
  return s;
}
// A finished building, for the village.
function buildingSVG(P, sp, seed) {
  return shadowSVG(P, sp) + foundationSVG(P, sp) + wallsSVG(P, sp) + doorSVG(P, sp) + windowsSVG(P, sp, sp.lit) + roofSVG(P, sp) + (sp.roofType === "pyramid" ? flagSVG(P, sp) : chimneySVG(P, sp)) + gardenSVG(P, sp, seed);
}

// ---------- construction site ----------
// The crane stands to the left with its arm across the screen, and always lowers
// its load just above whatever is being built.
function craneSVG(P, sp, time, shown) {
  const zc = Math.max(topOf(sp) + 2.3, 4.6),
    mast = [-3.0, 3.0],
    end = [0.6, -0.6];
  const walls = Math.max(0, Math.min(1, (shown - 0.32) / 0.3)),
    roofUp = Math.max(0, Math.min(1, (shown - 0.62) / 0.13));
  const u = 0.72 + 0.14 * Math.sin(time * 0.7),
    x = mast[0] + (end[0] - mast[0]) * u,
    y = mast[1] + (end[1] - mast[1]) * u,
    z = Math.min(zc - 0.9, 0.3 + sp.h * walls + (ridgeOf(sp) - topOf(sp)) * roofUp + 0.9 + 0.2 * Math.sin(time * 1.4));
  const load = shown < 0.32 ? WOOD : shown < 0.62 ? sp.wall.faces : [sp.roof[2], sp.roof[0], sp.roof[1]];
  let s = box(P, mast[0] - 0.16, mast[1] - 0.16, mast[0] + 0.16, mast[1] + 0.16, 0, zc, CRANE);
  for (let k = 0.5; k < zc - 0.3; k += 0.55) s += seg(P(mast[0] - 0.16, mast[1] + 0.17, k), P(mast[0] + 0.16, mast[1] + 0.17, k + 0.5), "#c99622", 1);
  s += box(P, mast[0] - 0.3, mast[1] - 0.3, mast[0] + 0.3, mast[1] + 0.3, zc - 0.05, zc + 0.35, ["#5f6f86", "#4b5a70", "#3c4a5e"]);
  s += seg(P(mast[0], mast[1], zc + 0.4), P(end[0], end[1], zc + 0.4), "#e4b031", 4) + seg(P(mast[0], mast[1], zc + 0.4), P(mast[0] - 1.1, mast[1] + 1.1, zc + 0.4), "#c99622", 4);
  s += box(P, mast[0] - 1.35, mast[1] + 0.85, mast[0] - 0.85, mast[1] + 1.35, zc + 0.05, zc + 0.6, STONE);
  s += seg(P(x, y, zc + 0.4), P(x, y, z + 0.38), "#5f5e5a", 1.1) + box(P, x - 0.38, y - 0.38, x + 0.38, y + 0.38, z, z + 0.38, load);
  return s;
}
function scaffoldSVG(P, sp) {
  const w = sp.hw + 0.45,
    top = topOf(sp) + 0.2,
    pole = "#c79a5a",
    plank = "#ad7f43";
  let s = "";
  [-w + 0.25, 0, w].forEach((y) => (s += seg(P(w, y, 0), P(w, y, top), pole, 2)));
  [-w + 0.25, 0, w].forEach((x) => (s += seg(P(x, w, 0), P(x, w, top), pole, 2)));
  for (let z = 1.2; z <= top; z += 1.2) s += seg(P(w, -w + 0.15, z), P(w, w, z), plank, 3.2) + seg(P(-w + 0.15, w, z), P(w, w, z), plank, 3.2);
  s += seg(P(w, -w + 0.25, 0.1), P(w, 0, 1.2), pole, 1.2, 'opacity=".7"') + seg(P(-w + 0.25, w, 0.1), P(0, w, 1.2), pole, 1.2, 'opacity=".7"');
  return s;
}
function sceneParts(P, sp, seed) {
  const w = sp.hw,
    top = topOf(sp);
  return [
    { a: 0, b: 0.05, kind: "drop", dist: 30, out: [0.1, 0.14], draw: () => [[-w - 0.2, -w - 0.2], [w + 0.2, -w - 0.2], [w + 0.2, w + 0.2], [-w - 0.2, w + 0.2]].map(([x, y]) => box(P, x - 0.08, y - 0.08, x + 0.08, y + 0.08, 0, 0.7, WOOD)).join("") },
    { a: 0.32, b: 0.62, kind: "grow", draw: (t) => shadowSVG(P, sp, t) },
    { a: 0.04, b: 0.12, kind: "drop", dist: -22, draw: () => foundationSVG(P, sp) },
    { a: 0.12, b: 0.28, kind: "grow", draw: (t) => [[-w, -w], [w, -w], [-w, w], [w, w]].map(([x, y], i) => { const k = Math.max(0, Math.min(1, t * 1.6 - i * 0.2)); return k > 0 ? box(P, x - 0.12, y - 0.12, x + 0.12, y + 0.12, 0.3, 0.3 + sp.h * k, WOOD) : ""; }).join("") },
    { a: 0.26, b: 0.32, kind: "drop", dist: 30, draw: () => `<polygon points="${pts([P(-w, -w, top), P(w, -w, top), P(w, w, top), P(-w, w, top)])}" fill="none" stroke="#bd8649" stroke-width="3.5" stroke-linejoin="round"/>` },
    { a: 0.32, b: 0.62, kind: "grow", draw: (t) => wallsSVG(P, sp, t) },
    { a: 0.78, b: 0.82, kind: "pop", anchor: [0, w, 0.3], draw: () => doorSVG(P, sp) },
    { a: 0.82, b: 0.93, kind: "grow", lights: true, draw: (t, lit) => windowsSVG(P, sp, lit, t) },
    { a: 0.1, b: 0.96, kind: "span", draw: () => scaffoldSVG(P, sp) },
    { a: 0.62, b: 0.75, kind: "drop", dist: 80, land: true, draw: () => roofSVG(P, sp) },
    { a: 0.75, b: 0.79, kind: "grow", live: sp.roofType === "pyramid", draw: (t, lit, time) => (sp.roofType === "pyramid" ? flagSVG(P, sp, t, time * 3) : chimneySVG(P, sp, t)) },
    { a: 0.92, b: 0.97, kind: "pop", anchor: [0, w + 0.9, 0], draw: () => gardenSVG(P, sp, seed) },
    { a: 0.05, b: 0.96, kind: "span", live: true, draw: (time, shown) => craneSVG(P, sp, time, shown) },
  ];
}

const springOut = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2));
const clamp = (v) => Math.max(0, Math.min(1, v));
const NS = "http://www.w3.org/2000/svg";

/**
 * Live construction site.
 * run: { endsAt, minutes, kind, seed } while a build-mode session is on.
 * outcome: { type: "built" | "collapsed", kind, seed, at } right after it ends.
 */
export function ConstructionScene({ run, outcome }) {
  const ref = useRef(null);
  const live = useRef({ run, outcome });
  live.current = { run, outcome };
  const subject = run || outcome;
  const kind = subject?.kind || "cottage",
    seed = subject?.seed || 1;
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const sp = spec(kind, seed);
    const s = { cottage: 31, house: 28, tower: 23.5 }[kind];
    const P = projector({ cx: 350, cy: 268, s });
    root.innerHTML = "";
    const layer = (name) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", name);
      root.appendChild(g);
      return g;
    };
    layer("ground").innerHTML =
      box(P, -3.4, -3.4, 3.4, 3.4, -0.5, 0, GRASS) +
      poly([P(-sp.hw - 0.95, -sp.hw - 0.95, 0.006), P(sp.hw + 0.95, -sp.hw - 0.95, 0.006), P(sp.hw + 0.95, sp.hw + 0.95, 0.006), P(-sp.hw - 0.95, sp.hw + 0.95, 0.006)], DIRT[0]) +
      [[-2.9, -1.6], [2.8, -2.9], [-2.4, -3.0], [2.9, 2.2]].map(([x, y]) => { const p = P(x, y, 0); return `<ellipse cx="${f(p[0])}" cy="${f(p[1] - 6)}" rx="9" ry="7" fill="#79b25a"/>`; }).join("");
    const building = layer("site");
    const fx = layer("fx");
    const parts = sceneParts(P, sp, seed).map((p) => ({ ...p, el: building.appendChild(document.createElementNS(NS, "g")) }));
    let shown = 0,
      raf = 0,
      last = 0,
      mode = "build",
      eventAt = 0,
      landed = false,
      puff = null,
      rubble = "";
    const start = performance.now();
    const progressOf = (r) => clamp(1 - (r.endsAt - Date.now()) / (r.minutes * 60000));
    const draw = (now) => {
      const time = (now - start) / 1000;
      const { run: r, outcome: out } = live.current;
      if (mode === "build") {
        if (r) shown += (progressOf(r) - shown) * (shown === 0 ? 1 : 0.15);
        else if (out?.type === "built") {
          shown += (1 - shown) * 0.2;
          if (shown > 0.995) {
            shown = 1;
            mode = "done";
            eventAt = now;
          }
        } else if (out?.type === "collapsed") {
          mode = "collapse";
          eventAt = now;
          parts.forEach((p, i) => {
            const op = +p.el.getAttribute("opacity");
            if (!(op > 0)) return;
            let bb;
            try {
              bb = p.el.getBBox();
            } catch {
              bb = { x: 350, y: 268, width: 0, height: 0 };
            }
            p.fall = { base: p.el.getAttribute("transform") || "", cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2, r: (Math.random() * 2 - 1) * 42, dx: (Math.random() * 2 - 1) * 55, d: (parts.length - i) * 0.03, op };
          });
        }
      }
      if (mode === "collapse") {
        const tau = (now - eventAt) / 1000;
        parts.forEach((p) => {
          if (!p.fall) return p.el.setAttribute("opacity", "0");
          const l = Math.max(0, tau - p.fall.d);
          p.el.setAttribute("transform", `${p.fall.base} translate(${f(p.fall.dx * l)} ${f(320 * l * l)}) rotate(${f(p.fall.r * l)} ${f(p.fall.cx)} ${f(p.fall.cy)})`);
          p.el.setAttribute("opacity", Math.max(0, (1 - l * 1.3) * p.fall.op).toFixed(2));
        });
        if (tau > 0.9 && !rubble)
          rubble = foundationSVG(P, sp) + [[-1, 0.4], [0.3, -0.6], [0.9, 0.8], [-0.2, 1.2], [0.8, -1.3], [-1.3, -0.7]].map(([x, y], i) => box(P, x - 0.35, y - 0.25, x + 0.35, y + 0.25, 0.3, 0.55 + (i % 2) * 0.22, i % 3 ? sp.wall.faces : WOOD)).join("");
        let dust = "";
        const k = clamp(tau / 1.4);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2,
            q = P(Math.cos(a) * (sp.hw + 0.4), Math.sin(a) * (sp.hw + 0.4), 0.3);
          dust += `<circle cx="${f(q[0] + Math.cos(a) * 34 * k)}" cy="${f(q[1] - 16 * k)}" r="${f(7 + 28 * k)}" fill="#ddd3c3" opacity="${(0.75 * (1 - k)).toFixed(2)}"/>`;
        }
        fx.innerHTML = (rubble ? `<g opacity="${clamp((tau - 0.9) / 0.4).toFixed(2)}">${rubble}</g>` : "") + dust;
        return;
      }
      const lit = mode === "done";
      parts.forEach((p) => {
        const l = clamp((shown - p.a) / (p.b - p.a));
        let op = 1;
        if (p.kind === "drop") {
          if (!p.ready) {
            p.el.innerHTML = p.draw();
            p.ready = true;
          }
          const e = springOut(l);
          p.el.setAttribute("transform", `translate(0 ${f(-(1 - e) * p.dist)})`);
          op = l > 0 ? Math.min(1, l * 2.5) : 0;
          if (p.out) op *= 1 - clamp((shown - p.out[0]) / (p.out[1] - p.out[0]));
          if (p.land && l >= 1 && !landed) {
            landed = true;
            puff = now;
          }
        } else if (p.kind === "grow") {
          const key = l.toFixed(3) + (p.lights && lit ? "L" : "") + (p.live && l >= 1 ? Math.floor(time * 15) : "");
          if (key !== p.key) {
            p.el.innerHTML = l > 0 ? p.draw(l, lit, time) : "";
            p.key = key;
          }
        } else if (p.kind === "pop") {
          if (!p.ready) {
            p.el.innerHTML = p.draw();
            p.ready = true;
          }
          const e = springOut(l),
            q = P(...p.anchor);
          p.el.setAttribute("transform", `translate(${f(q[0])} ${f(q[1])}) scale(${Math.max(0.001, e).toFixed(3)}) translate(${f(-q[0])} ${f(-q[1])})`);
          op = l > 0 ? 1 : 0;
        } else if (p.kind === "span") {
          op = clamp((shown - p.a) / 0.04) * clamp((p.b - shown) / 0.04);
          if (op > 0 && (p.live || !p.ready)) {
            p.el.innerHTML = p.draw(time, shown);
            p.ready = true;
          }
        }
        p.el.setAttribute("opacity", op.toFixed(2));
      });
      let effects = "";
      if (puff && now - puff < 700) {
        const k = (now - puff) / 700;
        [[-sp.hw - 0.3, sp.hw + 0.3], [sp.hw + 0.3, -sp.hw - 0.3], [sp.hw + 0.3, sp.hw + 0.3]].forEach(([x, y]) => {
          const q = P(x, y, topOf(sp) - 0.1);
          effects += `<circle cx="${f(q[0])}" cy="${f(q[1] - 10 * k)}" r="${f(5 + 16 * k)}" fill="#efe9dd" opacity="${(0.8 * (1 - k)).toFixed(2)}"/>`;
        });
      }
      if (mode === "done") {
        const dt = (now - eventAt) / 1000,
          base = P(0, 0, 0),
          bounce = 1 + 0.06 * Math.exp(-dt * 5) * Math.cos(dt * 14);
        building.setAttribute("transform", `translate(${f(base[0])} ${f(base[1])}) scale(${bounce.toFixed(4)}) translate(${f(-base[0])} ${f(-base[1])})`);
        const apex = P(0, 0, ridgeOf(sp));
        for (let i = 0; i < 18 && dt < 1.5; i++) {
          const a = -Math.PI / 2 + (i / 17 - 0.5) * 2.5,
            vx = Math.cos(a) * 130,
            vy = Math.sin(a) * 170,
            x = apex[0] + vx * dt,
            y = apex[1] + vy * dt + 170 * dt * dt;
          effects += `<rect x="${f(x)}" y="${f(y)}" width="6" height="6" transform="rotate(45 ${f(x + 3)} ${f(y + 3)})" fill="${["#ffd36e", sp.roof[0], "#e98aa8", "#86b75e"][i % 4]}" opacity="${(1 - dt / 1.5).toFixed(2)}"/>`;
        }
        if (sp.chimney && sp.roofType === "gable")
          for (let i = 0; i < 3; i++) {
            const k = (time * 0.45 + i / 3) % 1,
              c = P(sp.hw + 0.18, 0, ridgeOf(sp) + 0.6);
            effects += `<circle cx="${f(c[0] + 8 * Math.sin(k * 5 + i))}" cy="${f(c[1] - k * 44)}" r="${f(4 + k * 8)}" fill="#ece7dd" opacity="${(0.7 * (1 - k)).toFixed(2)}"/>`;
          }
      }
      fx.innerHTML = effects;
    };
    const loop = (now) => {
      // 30 fps is plenty for a scene that changes in minutes, and spares the battery.
      if (now - last > 33) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };
    if (reducedMotion()) {
      shown = run ? progressOf(run) : 1;
      draw(performance.now());
      const timer = setInterval(() => {
        if (live.current.run) shown = progressOf(live.current.run);
        draw(performance.now());
      }, 5000);
      return () => clearInterval(timer);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // The scene lives for one building; run/outcome are read live through the ref.
  }, [kind, seed]);
  return (
    <svg className="village-scene" viewBox="0 0 680 400" role="img" aria-label={`${KINDS[kind].label} inşaatı`}>
      <g ref={ref} />
    </svg>
  );
}

// ---------- the village ----------
const PER_ROW = 3,
  MAP_W = 520,
  ROW_H = 128;
function treeSVG(x, y, size, r) {
  const dark = r() < 0.5 ? "#5e9b4c" : "#4f8a41";
  return (
    `<ellipse cx="${f(x + size * 0.35)}" cy="${f(y + 2)}" rx="${f(size * 0.9)}" ry="${f(size * 0.32)}" fill="rgba(52,74,34,.18)"/>` +
    `<rect x="${f(x - size * 0.12)}" y="${f(y - size * 0.9)}" width="${f(size * 0.24)}" height="${f(size * 0.9)}" rx="2" fill="#9a6b3f"/>` +
    `<circle cx="${f(x)}" cy="${f(y - size * 1.25)}" r="${f(size * 0.72)}" fill="${dark}"/>` +
    `<circle cx="${f(x - size * 0.22)}" cy="${f(y - size * 1.45)}" r="${f(size * 0.42)}" fill="#7dbb5f"/>`
  );
}
export function VillageMap({ buildings, freshSince = 0 }) {
  const rows = Math.max(1, Math.ceil((buildings.length + 1) / PER_ROW));
  const height = 96 + rows * ROW_H;
  const svg = useMemo(() => {
    let s = `<rect x="14" y="72" width="${MAP_W - 28}" height="${height - 82}" rx="30" fill="${GRASS[1]}"/><rect x="14" y="62" width="${MAP_W - 28}" height="${height - 82}" rx="30" fill="${GRASS[0]}"/>`;
    const deco = rng(buildings.length * 7 + 3);
    for (let i = 0; i < rows * 6; i++) {
      const x = 36 + deco() * (MAP_W - 72),
        y = 88 + deco() * (height - 132);
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(3 + deco() * 3)}" ry="2" fill="${GRASS[2]}" opacity=".35"/>`;
    }
    // Trees between the plots, drawn row by row so nearer things overlap farther ones.
    const trees = [];
    for (let row = 0; row < rows; row++)
      for (let k = 0; k < 2; k++)
        trees.push({ row, x: 46 + (k ? MAP_W - 92 : 0) + deco() * 18 - (row % 2 ? -10 : 10), y: 128 + row * ROW_H + deco() * 40, size: 9 + deco() * 5 });
    const slots = buildings.length + 1;
    for (let row = 0; row < rows; row++) {
      trees.filter((t) => t.row === row && t.y < 144 + row * ROW_H).forEach((t) => (s += treeSVG(t.x, t.y, t.size, deco)));
      for (let col = 0; col < PER_ROW; col++) {
        const i = row * PER_ROW + col;
        if (i >= slots) break;
        const cx = 108 + col * 152 + (row % 2) * 30,
          cy = 144 + row * ROW_H;
        const P = projector({ cx, cy, s: 13.5 });
        if (i === buildings.length) {
          s += `<polygon points="${pts([P(-2.3, -2.3, 0), P(2.3, -2.3, 0), P(2.3, 2.3, 0), P(-2.3, 2.3, 0)])}" fill="rgba(255,255,255,.18)" stroke="${GRASS[2]}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
          continue;
        }
        const b = buildings[i],
          sp = spec(b.kind, b.seed),
          base = P(0, 0, 0);
        const plot = poly([P(-2.7, -2.7, 0), P(2.7, -2.7, 0), P(2.7, 2.7, 0), P(-2.7, 2.7, 0)], "#9ccb72");
        const fresh = b.created > freshSince && freshSince > 0;
        s += `<g class="${fresh ? "village-new" : ""}" style="transform-origin:${f(base[0])}px ${f(base[1])}px">${plot}${buildingSVG(P, sp, b.seed)}</g>`;
      }
      trees.filter((t) => t.row === row && t.y >= 144 + row * ROW_H).forEach((t) => (s += treeSVG(t.x, t.y, t.size, deco)));
    }
    return s;
  }, [buildings, freshSince, rows, height]);
  return (
    <svg
      className="village-map"
      viewBox={`0 0 ${MAP_W} ${height}`}
      role="img"
      aria-label={`Köyde ${buildings.length} bina`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function VillagePanel({ me, members, rev, run, outcome, demo }) {
  const [buildings, setBuildings] = useState(demo || []),
    [owner, setOwner] = useState(me?.id || null),
    [, tick] = useState(0);
  useEffect(() => {
    if (demo) {
      setBuildings(demo);
      return;
    }
    get("/village")
      .then(setBuildings)
      .catch(() => {});
  }, [rev, !!demo]);
  useEffect(() => {
    if (me?.id) setOwner(me.id);
  }, [me?.id]);
  // Keep the finished scene on screen for a moment, then show the village.
  useEffect(() => {
    if (!outcome) return;
    const timer = setTimeout(() => tick((n) => n + 1), Math.max(0, outcome.at + 4200 - Date.now()));
    return () => clearTimeout(timer);
  }, [outcome?.at]);
  const showScene = !!run || (outcome && Date.now() - outcome.at < 4200);
  const counts = new Map();
  buildings.forEach((b) => counts.set(b.memberId, (counts.get(b.memberId) || 0) + 1));
  const people = members.filter((m) => counts.get(m.id) || m.id === me?.id);
  const selected = people.some((m) => m.id === owner) ? owner : people[0]?.id;
  const mine = buildings.filter((b) => b.memberId === selected);
  const who = members.find((m) => m.id === selected);
  const subject = run || outcome;
  const tally = Object.keys(KINDS)
    .map((k) => [k, mine.filter((b) => b.kind === k).length])
    .filter(([, n]) => n)
    .map(([k, n]) => `${n} ${KINDS[k].label.toLocaleLowerCase("tr")}`)
    .join(", ");
  return (
    <section className="panel village-panel">
      <div className="section-heading">
        <h2>{showScene ? "Şantiye" : "Köy"}</h2>
        <span className="count-tag">
          {showScene
            ? `${KINDS[subject.kind].emoji} ${KINDS[subject.kind].label}`
            : `${mine.length} bina`}
        </span>
      </div>
      {showScene ? (
        <>
          <ConstructionScene run={run} outcome={outcome} />
          <p className="village-caption">
            {run
              ? "Odaklandıkça yükseliyor. Uygulamadan çıkarsan yıkılır."
              : outcome?.type === "built"
                ? "Bitti! Köyüne taşınıyor."
                : "İnşaat çöktü. Bir dahakine sonuna kadar."}
          </p>
        </>
      ) : (
        <>
          {people.length > 1 && (
            <div className="filter-row village-people">
              {people.map((m) => (
                <button
                  key={m.id}
                  className={`filter-chip ${m.id === selected ? "selected" : ""}`}
                  aria-pressed={m.id === selected}
                  onClick={() => setOwner(m.id)}
                >
                  {m.avatar} {m.id === me?.id ? "Benim köyüm" : m.name}
                  <span>{counts.get(m.id) || 0}</span>
                </button>
              ))}
            </div>
          )}
          <VillageMap buildings={mine} freshSince={outcome?.type === "built" ? outcome.at - 60000 : 0} />
          <p className="village-caption">
            {mine.length
              ? `${who?.id === me?.id ? "Köyünde" : `${who?.name || "Bu köyde"} ·`} ${tally}.`
              : who?.id === me?.id || !who
                ? "Köyün boş. İnşaat modunda bir seans bitir, ilk kulüben dikilsin."
                : `${who.name} henüz bir şey inşa etmedi.`}
          </p>
        </>
      )}
    </section>
  );
}

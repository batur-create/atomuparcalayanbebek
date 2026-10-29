// n48: seven more 25-minute buildings for the open catalogue and the two
// autumn weekly ones. Not all houses: a fountain, a vine arbour, a garden
// pond bridge, an apiary, a weather station, a garden ornament set and a
// shepherd's hut on wheels; the weeklies are a chestnut cart under its tree
// and a bird hide. Each is drawn once and the same drawing builds the site,
// the catalogue portrait and the village (rareBuildings.js design()).
// One drawing unit is 1.6 m (shared/olcek.js); sizes follow the real thing.
import { box, poly, seg, ellipse, wallText, LIT } from "./iso.js";
import { lathe } from "./kit.js";
import { design, WOOD, STONE, STEEL, TILE, gable, window, plate, quad, beam } from "./rareBuildings.js";

export const MARBLE = ["#eee9dc", "#d8d1c0", "#bdb4a0"],
  LEAD = ["#aab1b5", "#8d959a", "#6f777c"],
  WHITE = ["#f5f3ee", "#dedbd2", "#c5c1b6"],
  RED = ["#d0583f", "#ae4431", "#8c3424"],
  GREEN = ["#8fb36f", "#6f9655", "#557a44"],
  AUTUMN = ["#e9a944", "#cf7f2f", "#a95c25"],
  PAINT = ["#7fa38a", "#628a72", "#4b6f5b"],
  STRAW = ["#dcc583", "#c1a660", "#a2873f"],
  IRON = "#3d3b3a",
  SOOT = ["#55524f", "#45423f", "#363331"],
  WATER = "#8cc0cf",
  CLAY = "#a88f6c";
// A flat circle on the ground (or any height).
export const disc = (P, x, y, z, r, color, n = 18, ry = r) => poly(Array.from({ length: n }, (_, i) => P(x + r * Math.cos((i / n) * 2 * Math.PI), y + ry * Math.sin((i / n) * 2 * Math.PI), z)), color);
// A round bush or tree crown.
export const bush = (P, x, y, z, r, c = GREEN) => lathe(P, x, y, [[0, z - r * 0.5], [r * 0.8, z - r * 0.35], [r, z], [r * 0.75, z + r * 0.5], [0, z + r * 0.72]], c, { n: 9 });
// A wheel standing in the plane y = const: rim, hub and spokes.
export function wheel(P, x, y, z, r, spokes = 8, color = IRON) {
  const at = (a, rr) => P(x + rr * Math.cos(a), y, z + rr * Math.sin(a));
  let s = "";
  for (let i = 0; i < 20; i++) s += seg(at((i / 20) * 2 * Math.PI, r), at(((i + 1) / 20) * 2 * Math.PI, r), color, 1.6);
  for (let i = 0; i < spokes; i++) s += seg(at((i / spokes) * 2 * Math.PI, 0.05), at((i / spokes) * 2 * Math.PI, r), color, 0.7);
  return s + seg(at(0, 0), at(0, 0.001), color, 2.6);
}
// A gently irregular pond outline.
export const pondPts = (P, cx, cy, rx, ry, z) => Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * 2 * Math.PI,
    w = 1 + 0.07 * Math.sin(3 * a) + 0.05 * Math.cos(5 * a);
  return P(cx + rx * w * Math.cos(a), cy + ry * w * Math.sin(a), z);
});
// Reeds: a tuft of thin stems with a brown head on some.
export function reeds(P, x, y, n, detail) {
  let s = "";
  for (let i = 0; i < (detail ? n : 2); i++) {
    const dx = ((i * 37) % 11) / 22 - 0.25,
      dy = ((i * 53) % 7) / 14 - 0.25,
      h = 0.5 + ((i * 29) % 5) * 0.08;
    s += seg(P(x + dx, y + dy, 0), P(x + dx + 0.04, y + dy, h), "#7c9a52", 0.6);
    if (i % 3 === 0) s += seg(P(x + dx + 0.035, y + dy, h - 0.12), P(x + dx + 0.04, y + dy, h - 0.02), "#7a5734", 1.4);
  }
  return s;
}

// ---------- Taş Çeşme ----------
// An Ottoman street fountain: cut-stone body, a pointed niche with the
// mirror stone (ayna taşı) and a bronze spout, the trough, an inscription
// panel, a wide eave and a lead roof; stone benches either side.
function fountain(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -1.9, -1.6, 1.9, 1.6, 0.01, "#ddd6c4");
  if (detail) {
    for (let x = -1.9; x <= 1.9; x += 0.38) s += seg(P(x, -1.6, 0.015), P(x, 1.6, 0.015), "#c8bfaa", 0.45);
    for (let y = -1.6; y <= 1.6; y += 0.38) s += seg(P(-1.9, y, 0.015), P(1.9, y, 0.015), "#c8bfaa", 0.45);
  }
  if (b > 0) {
    s += box(P, -1.3, -1.15, 1.3, -0.25, 0, 0.18 * b, MARBLE);
    // the overflow runs in a stone channel to the garden
    if (b > 0.6) s += quad(P, 0.75, 0.08, 1.9, 0.26, 0.02, "#a89f8b");
  }
  if (fit > 0) s += box(P, -1.8, -1.0, -1.38, -0.15, 0, 0.42, MARBLE);
  if (f > 0) {
    const top = 0.18 + 1.82 * f;
    s += box(P, -1.1, -1.0, 1.1, -0.4, 0.18, top, MARBLE);
    if (detail) for (let z = 0.48; z < top; z += 0.3) s += seg(P(-1.1, -0.399, z), P(1.1, -0.399, z), MARBLE[2], 0.5) + seg(P(1.101, -1.0, z), P(1.101, -0.4, z), MARBLE[2], 0.5);
    for (const x of [-1.1, 0.85]) s += box(P, x, -0.4, x + 0.25, -0.3, 0.18, top, MARBLE);
  }
  if (sk > 0 && f > 0.95) {
    // the pointed niche: two arcs meeting at the apex
    const arc = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      arc.push([-0.55 + 0.55 * Math.sin((t * Math.PI) / 2), 1.2 + 0.5 * Math.sin((t * Math.PI) / 2) ** 0.6]);
    }
    const right = arc.slice(0, -1).reverse().map(([x, z]) => [-x, z]);
    s += poly([P(-0.55, -0.398, 0.35), ...arc.map(([x, z]) => P(x, -0.398, z)), ...right.map(([x, z]) => P(x, -0.398, z)), P(0.55, -0.398, 0.35)], MARBLE[2]);
    if (sk > 0.5) {
      s += plate(P, -0.36, -0.396, 0.62, 0.72, 0.85, MARBLE[0]);
      // the rosette on the mirror stone
      if (detail) for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 2 * Math.PI;
        s += seg(P(0, -0.394, 1.18), P(0.17 * Math.cos(a), -0.394, 1.18 + 0.17 * Math.sin(a)), MARBLE[2], 0.7);
      }
    }
    if (sk > 0.8) {
      s += plate(P, -0.62, -0.397, 1.76, 1.24, 0.2, "#e9e3d3");
      if (detail > 1) for (let i = 0; i < 4; i++) s += seg(P(-0.52 + i * 0.27, -0.395, 1.86), P(-0.32 + i * 0.27, -0.395, 1.86), "#9d917b", 0.7);
    }
  }
  if (r > 0) {
    s += box(P, -1.32, -1.15, 1.32, -0.18, 2.0, 2.0 + 0.1 * Math.min(1, r * 2), MARBLE);
    if (r > 0.5) {
      s += poly([P(-1.22, -0.25, 2.1), P(1.22, -0.25, 2.1), P(0.6, -0.68, 2.45), P(-0.6, -0.68, 2.45)], LEAD[0]);
      s += poly([P(1.22, -1.1, 2.1), P(1.22, -0.25, 2.1), P(0.6, -0.68, 2.45)], LEAD[1]);
      s += lathe(P, 0, -0.68, [[0.05, 2.45], [0.04, 2.6], [0, 2.68]], ["#d3b56a", "#b39548", "#8c7234"], { n: 6 });
    }
  }
  if (fit > 0) {
    s += box(P, -0.04, -0.4, 0.04, -0.2, 0.8, 0.86, ["#c9a24f", "#a6833a", "#86672b"]);
    s += box(P, -0.75, -0.4, 0.75, 0.05, 0.18, 0.62, MARBLE);
    if (fit > 0.5) {
      s += quad(P, -0.67, -0.33, 0.67, -0.02, 0.6, WATER);
      s += seg(P(0, -0.21, 0.82), P(0, -0.17, 0.62), "#d9f0f5", 1.6);
      if (detail) s += disc(P, 0, -0.17, 0.605, 0.07, "#cfe9ef", 10);
    }
    // a copper cup on a chain, and a lamp for the night
    s += ellipse(...P(0.6, -0.3, 1.0), 2.2, 1.6, "#b87a4a");
    s += box(P, 0.93, -0.3, 1.03, -0.2, 1.42, 1.6, lit ? [LIT, "#e8b85a", "#c99a46"] : STEEL);
    s += box(P, 1.38, -1.0, 1.8, -0.15, 0, 0.42, MARBLE);
  }
  return s;
}

// ---------- Asma Çardak ----------
// A timber pergola on steel post bases, knee-braced, with a slatted top the
// vine climbs over; a table and two benches underneath.
function arbour(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -2, -1.65, 2, 1.65, 0.01, "#ddd2b8");
  if (detail) for (let i = 0; i < 40; i++) s += ellipse(...P(-1.9 + ((i * 47) % 38) / 10, -1.55 + ((i * 31) % 31) / 10, 0.012), 0.9, 0.5, "#c3b595");
  const posts = [[-1.25, -0.95], [1.25, -0.95], [-1.25, 0.95], [1.25, 0.95]],
    H = 1.55;
  const post = ([x, y]) => {
    let p = b > 0 ? box(P, x - 0.1, y - 0.1, x + 0.1, y + 0.1, 0, 0.1 * b, ["#c9c6be", "#aeaba3", "#94918a"]) : "";
    if (f > 0) p += box(P, x - 0.045, y - 0.045, x + 0.045, y + 0.045, 0.1, 0.1 + (H - 0.1) * f, WOOD);
    if (sk > 0 && f > 0.95) {
      const dx = x < 0 ? 0.3 : -0.3;
      p += beam(P, [x, y, H - 0.42], [x + dx, y, H - 0.05], 1.1);
    }
    return p;
  };
  s += post(posts[0]) + post(posts[1]);
  // the grape vine: trunk at the back left post
  if (r > 0) s += seg(P(-1.12, -0.85, 0), P(-1.18, -0.9, H * Math.min(1, r * 1.6)), "#6b4a2f", 2.2);
  if (fit > 0) {
    // a 75 cm table and 45 cm benches
    const legs = (x0, y0, x1, y1, z) => [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => box(P, x - 0.03, y - 0.03, x + 0.03, y + 0.03, 0, z, WOOD)).join("");
    s += legs(-0.8, -0.68, 0.8, -0.56, 0.25) + box(P, -0.9, -0.75, 0.9, -0.5, 0.25, 0.29, WOOD);
    s += legs(-0.6, -0.28, 0.6, 0.28, 0.43) + box(P, -0.7, -0.35, 0.7, 0.35, 0.43, 0.47, ["#cfa775", "#ad8452", "#8c663d"]);
    s += legs(-0.8, 0.56, 0.8, 0.68, 0.25) + box(P, -0.9, 0.5, 0.9, 0.75, 0.25, 0.29, WOOD);
    s += lathe(P, 0.3, 0, [[0.05, 0.47], [0.06, 0.59], [0.03, 0.65]], ["#e6eef0", "#bccdd1", "#9eb3b8"], { n: 6 });
  }
  s += post(posts[2]) + post(posts[3]);
  if (f > 0.95) for (const y of [-0.95, 0.95]) s += box(P, -1.55, y - 0.05, 1.55, y + 0.05, H, H + 0.12, WOOD);
  if (sk > 0) {
    const n = Math.round(10 * sk);
    for (let i = 0; i < n; i++) {
      const x = -1.35 + i * 0.3;
      s += box(P, x - 0.03, -1.15, x + 0.03, 1.15, H + 0.12, H + 0.19, WOOD);
    }
  }
  if (r > 0) {
    // the canopy fills in as the vine is trained along the wires
    const spots = [[-1.1, -0.8], [-0.5, -0.9], [0.1, -0.7], [0.7, -0.85], [1.1, -0.4], [-0.9, -0.2], [-0.2, 0.0], [0.5, 0.1], [1.15, 0.3], [-1.0, 0.6], [-0.3, 0.8], [0.6, 0.85]];
    const n = Math.round(spots.length * r);
    for (let i = 0; i < n; i++) s += lathe(P, spots[i][0], spots[i][1], [[0, H + 0.12], [0.4, H + 0.16], [0.44, H + 0.24], [0.28, H + 0.36], [0, H + 0.4]], GREEN, { n: 9 });
    if (fit > 0.5 && detail) for (const [x, y] of [[-0.5, 0.35], [0.4, -0.3], [1.0, 0.6], [-1.05, -0.1]]) {
      for (let j = 0; j < 4; j++) s += ellipse(...P(x + (j % 2) * 0.05, y, H - 0.02 - j * 0.06), 1.6, 1.6, "#6a3d6e");
    }
  }
  if (fit > 0) s += box(P, 0.02, -0.03, 0.12, 0.07, H - 0.35, H - 0.22, lit ? [LIT, "#e8b85a", "#c99a46"] : STEEL) + seg(P(0.07, 0.02, H - 0.22), P(0.07, 0.02, H + 0.12), IRON, 0.5);
  return s;
}

// ---------- Göletli Köprü ----------
// A garden pond, clay-lined with edging stones, crossed by a cambered
// glulam footbridge on two stone abutments; lilies and goldfish.
const deckZ = (x) => 0.3 + 0.42 * (1 - (x / 2.15) ** 2);
function pondBridge(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = "";
  if (b > 0) {
    s += poly(pondPts(P, 0, 0, 1.45, 1.95, 0.01), CLAY);
    if (fit > 0) s += poly(pondPts(P, 0, 0, 1.32, 1.82, 0.02), WATER);
    if (detail && fit > 0) for (let i = 0; i < 4; i++) s += seg(P(-0.8 + i * 0.4, 1.0 - i * 0.55, 0.03), P(-0.5 + i * 0.4, 1.0 - i * 0.55, 0.03), "#c6e4ea", 0.6);
    // edging stones laid round the rim
    const n = Math.round(22 * b);
    for (let i = 0; i < n; i++) {
      const a = (i / 22) * 2 * Math.PI,
        w = 1 + 0.07 * Math.sin(3 * a) + 0.05 * Math.cos(5 * a);
      s += lathe(P, 1.45 * w * Math.cos(a), 1.95 * w * Math.sin(a), [[0.14, 0], [0.12, 0.08], [0, 0.11]], STONE, { n: 6 });
    }
  }
  if (fit > 0) {
    for (const [x, y] of [[-0.7, 0.95], [-0.4, 1.25], [0.7, -0.9], [0.8, 0.8]]) s += disc(P, x, y, 0.035, 0.15, "#6e9a55", 9) + (detail ? ellipse(...P(x + 0.04, y, 0.06), 1.4, 1, "#f2c1d2") : "");
    if (detail) for (const [x, y] of [[0.3, 1.1], [-0.5, -0.8], [0.6, -1.3]]) s += ellipse(...P(x, y, 0.03), 2.2, 1.1, "#e8823a");
    s += reeds(P, -1.25, -1.45, 9, detail) + bush(P, 1.9, -1.05, 0.25, 0.32);
  }
  if (f > 0) {
    for (const x of [-2.35, 1.95]) s += box(P, x, -0.38, x + 0.4, 0.38, 0, 0.3, STONE);
  }
  const L = 2.15,
    span = Math.min(1, f * 1.2);
  const band = (y, color) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const x = -L + (2 * L * i) / 12;
      if (x > -L + 2 * L * span + 1e-6) break;
      pts.push([x, deckZ(x)]);
    }
    if (pts.length < 2) return "";
    return poly([...pts.map(([x, z]) => P(x, y, z)), ...pts.reverse().map(([x, z]) => P(x, y, z - 0.13))], color);
  };
  const rail = (y) => {
    if (!(r > 0)) return "";
    let t = "";
    const n = Math.round(9 * r);
    for (let i = 0; i < n; i++) {
      const x = -2.0 + i * 0.5;
      t += box(P, x - 0.03, y - 0.03, x + 0.03, y + 0.03, deckZ(x), deckZ(x) + 0.55, WOOD);
    }
    if (r > 0.9) for (let i = 0; i < 12; i++) {
      const x0 = -2.0 + (i * 4) / 12, x1 = -2.0 + ((i + 1) * 4) / 12;
      t += seg(P(x0, y, deckZ(x0) + 0.55), P(x1, y, deckZ(x1) + 0.55), WOOD[2], 1.6);
    }
    return t;
  };
  s += band(-0.3, WOOD[1]) + rail(-0.3);
  if (sk > 0) {
    const n = Math.round(14 * sk);
    for (let i = 0; i < n; i++) {
      const x0 = -L + (2 * L * i) / 14, x1 = -L + (2 * L * (i + 1)) / 14;
      s += poly([P(x0, -0.32, deckZ(x0)), P(x1, -0.32, deckZ(x1)), P(x1, 0.32, deckZ(x1)), P(x0, 0.32, deckZ(x0))], WOOD[0]);
      if (detail) s += seg(P(x1, -0.32, deckZ(x1) + 0.005), P(x1, 0.32, deckZ(x1) + 0.005), WOOD[2], 0.5);
    }
  }
  s += band(0.3, WOOD[2]) + rail(0.3);
  if (fit > 0) s += reeds(P, 1.1, 1.55, 8, detail) + (lit ? lathe(P, -2.15, 0.6, [[0.06, 0], [0.05, 0.6], [0.09, 0.62], [0.06, 0.75]], [LIT, "#e8b85a", "#c99a46"], { n: 6 }) : lathe(P, -2.15, 0.6, [[0.06, 0], [0.05, 0.6], [0.09, 0.62], [0.06, 0.75]], STONE, { n: 6 }));
  return s;
}

// ---------- Arılık ----------
// Four Langstroth hives on stands facing the morning sun, each a different
// colour so the bees find their own; a small honey house, a windbreak hedge,
// a lavender strip and a water dish with stones to land on.
const HIVES = [WHITE, ["#a9c9e6", "#86abd0", "#6a8fb5"], ["#f1d77a", "#d9bb58", "#bb9c3f"], ["#b6dcc4", "#93c0a5", "#76a389"]];
function apiary(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -2.05, -1.75, 2.05, 1.6, 0.01, "#b5d48f");
  if (fit > 0) for (let i = 0; i < 9; i++) s += bush(P, -2.0 + i * 0.5, -1.62, 0.32, 0.3, ["#7fa45e", "#62884a", "#4c6e3b"]);
  // honey house
  if (f > 0) for (const [x, y] of [[-1.9, -1.45], [-1.0, -1.45], [-1.9, -0.6], [-1.0, -0.6]]) s += box(P, x - 0.04, y - 0.04, x + 0.04, y + 0.04, 0, 1.25 * f, WOOD);
  if (sk > 0) {
    s += box(P, -1.9, -1.45, -1.0, -0.6, 0, 1.25 * sk, WOOD);
    if (sk > 0.9) {
      s += plate(P, -1.6, -0.598, 0.02, 0.36, 0.85, "#6d4f36");
      if (detail) for (let z = 0.15; z < 1.2; z += 0.16) s += seg(P(-1.0, -0.599, z), P(-1.9, -0.599, z), WOOD[2], 0.45);
      s += window(P, -0.999, -1.25, 0.6, 0.4, 0.35, lit, "x");
    }
  }
  s += gable(P, -1.45, -1.025, 0.6, 0.55, 1.25, 1.7, r, TILE, detail);
  if (fit > 0) for (let i = 0; i < 6; i++) s += bush(P, -0.5 + i * 0.45, -1.0, 0.18, 0.2, ["#ae9bd6", "#8f7bc0", "#7562a3"]);
  HIVES.forEach((c, i) => {
    const x = -1.25 + i * 0.8, y = 0.45;
    if (b > 0) for (const dx of [-0.12, 0.12]) s += box(P, x + dx - 0.05, y - 0.15, x + dx + 0.05, y + 0.15, 0, 0.25 * b, ["#c9c6be", "#aeaba3", "#94918a"]);
    if (sk > 0) {
      s += box(P, x - 0.16, y - 0.13, x + 0.16, y + 0.13, 0.25, 0.25 + 0.17 * sk, c);
      if (sk > 0.9) {
        s += plate(P, x - 0.1, y + 0.131, 0.27, 0.2, 0.025, "#2e2a26");
        s += box(P, x - 0.11, y + 0.13, x + 0.11, y + 0.2, 0.24, 0.26, WOOD);
      }
    }
    if (r > 0) {
      const top = 0.42 + 0.2 * r;
      s += box(P, x - 0.16, y - 0.13, x + 0.16, y + 0.13, 0.42, top, c);
      if (detail) s += seg(P(x - 0.16, y + 0.131, 0.52), P(x + 0.16, y + 0.131, 0.52), c[2], 0.6);
      if (r > 0.9) s += box(P, x - 0.18, y - 0.15, x + 0.18, y + 0.15, top, top + 0.05, STEEL);
    }
    if (fit > 0.5 && detail > 1) for (let j = 0; j < 4; j++) s += ellipse(...P(x - 0.1 + j * 0.07, y + 0.3 + (j % 2) * 0.12, 0.35 + j * 0.05), 0.9, 0.9, "#4a3a1c");
  });
  if (fit > 0) {
    s += disc(P, 1.55, 1.25, 0.03, 0.22, "#c7c1b3", 12) + disc(P, 1.55, 1.25, 0.05, 0.18, WATER, 12);
    if (detail) for (const [dx, dy] of [[-0.06, 0.04], [0.07, -0.03]]) s += ellipse(...P(1.55 + dx, 1.25 + dy, 0.07), 1.4, 0.8, "#a59c8c");
  }
  return s;
}

// ---------- Meteoroloji İstasyonu ----------
// A small climate station on short grass inside a fence: a white louvred
// Stevenson screen with its thermometers 1.25-2 m up, a guyed 10 m mast with
// a cup anemometer and a wind vane at the top, a rain gauge, a sunshine
// recorder's glass ball and a solar-powered data logger.
function weather(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -2, -1.75, 2, 1.75, 0.01, "#a7cf82");
  const fence = (pts) => {
    let t = "";
    for (const [x, y] of pts) t += box(P, x - 0.03, y - 0.03, x + 0.03, y + 0.03, 0, 0.75, WOOD);
    for (let i = 0; i < pts.length - 1; i++) for (const z of [0.35, 0.68]) t += seg(P(pts[i][0], pts[i][1], z), P(pts[i + 1][0], pts[i + 1][1], z), "#7b7f80", 0.55);
    return t;
  };
  if (b > 0.5) s += fence([[-2, 1.75], [-2, 0], [-2, -1.75], [0, -1.75], [2, -1.75]]);
  const mx = -1.1, my = -0.85, H = 6.25;
  if (b > 0) {
    s += box(P, mx - 0.15, my - 0.15, mx + 0.15, my + 0.15, 0, 0.1, ["#c9c6be", "#aeaba3", "#94918a"]);
    for (const a of [0.52, 2.62, 4.71]) {
      const ax = mx + 1.3 * Math.cos(a), ay = my + 1.3 * Math.sin(a);
      s += box(P, ax - 0.06, ay - 0.06, ax + 0.06, ay + 0.06, 0, 0.06, ["#c9c6be", "#aeaba3", "#94918a"]);
      if (f > 0.7) s += seg(P(ax, ay, 0.06), P(mx, my, 4.2), "#59656a", 0.5, 0.85);
    }
  }
  if (f > 0) {
    const top = H * f;
    s += seg(P(mx, my, 0.1), P(mx, my, top), STEEL[2], 2.4) + seg(P(mx, my, 0.1), P(mx, my, top), STEEL[0], 1.2);
    if (f > 0.4) {
      s += box(P, mx + 0.04, my - 0.1, mx + 0.16, my + 0.1, 1.05, 1.35, WHITE);
      s += poly([P(mx + 0.06, my - 0.25, 1.62), P(mx + 0.06, my + 0.25, 1.62), P(mx + 0.4, my + 0.25, 1.42), P(mx + 0.4, my - 0.25, 1.42)], "#2f4767");
      if (detail) s += seg(P(mx + 0.23, my - 0.25, 1.52), P(mx + 0.23, my + 0.25, 1.52), "#7d93b3", 0.5);
    }
  }
  if (r > 0) {
    // the wind vane on a side arm, the cup anemometer at the very top
    s += seg(P(mx, my, H - 0.35), P(mx + 0.4, my, H - 0.35), STEEL[2], 0.9);
    s += poly([P(mx + 0.25, my, H - 0.3), P(mx + 0.55, my, H - 0.2), P(mx + 0.55, my, H - 0.42)], STEEL[1]);
    s += seg(P(mx + 0.25, my, H - 0.31), P(mx + 0.05, my, H - 0.31), STEEL[2], 1.1);
    if (r > 0.5) for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 2 * Math.PI + 0.4,
        cx = mx + 0.28 * Math.cos(a), cy = my + 0.28 * Math.sin(a);
      s += seg(P(mx, my, H + 0.05), P(cx, cy, H + 0.05), STEEL[2], 0.7) + ellipse(...P(cx, cy, H + 0.05), 2.1, 1.7, "#2e3a40");
    }
  }
  if (fit > 0) s += lathe(P, 1.35, -0.6, [[0.1, 0], [0.1, 0.6], [0.11, 0.62], [0.09, 0.62]], STEEL, { n: 10 });
  if (sk > 0) {
    const sx = 0.25, sy = 0.15;
    for (const [x, y] of [[sx + 0.03, sy + 0.03], [sx + 0.47, sy + 0.03], [sx + 0.03, sy + 0.37], [sx + 0.47, sy + 0.37]]) s += box(P, x - 0.025, y - 0.025, x + 0.025, y + 0.025, 0, 0.75, WHITE);
    if (sk > 0.4) {
      s += box(P, sx, sy, sx + 0.5, sy + 0.4, 0.75, 0.75 + 0.45 * Math.min(1, (sk - 0.4) / 0.5), WHITE);
      if (detail && sk > 0.9) for (let z = 0.8; z < 1.18; z += 0.06) s += seg(P(sx + 0.02, sy + 0.401, z), P(sx + 0.48, sy + 0.401, z), WHITE[2], 0.5) + seg(P(sx + 0.501, sy + 0.02, z), P(sx + 0.501, sy + 0.38, z), WHITE[2], 0.5);
    }
    if (sk > 0.9) s += box(P, sx - 0.05, sy - 0.05, sx + 0.55, sy + 0.45, 1.2, 1.23, WHITE) + box(P, sx - 0.07, sy - 0.07, sx + 0.57, sy + 0.47, 1.28, 1.32, WHITE);
  }
  if (fit > 0) {
    s += lathe(P, 1.3, 1.0, [[0.12, 0], [0.08, 0.1], [0.06, 0.55], [0.12, 0.58]], STONE, { n: 8 });
    s += lathe(P, 1.3, 1.0, [[0.001, 0.6], [0.11, 0.7], [0.12, 0.72], [0.11, 0.8], [0.001, 0.86]], lit ? ["#fbf3d8", "#f2e2ae", "#dccb92"] : ["#e7f4f8", "#bcd9e2", "#93bccb"], { n: 10 });
  }
  if (b > 0.5) s += fence([[-2, 1.75], [0, 1.75], [2, 1.75], [2, 0], [2, -1.75]]);
  return s;
}

// ---------- Bahçe Süsleri ----------
// A garden ornament set round a gravel ring: a sundial whose gnomon leans
// at 40° (the latitude of Ankara) and points north, a birdhouse on a pole,
// a stone lantern, terracotta pots and a bench behind a box hedge.
function ornaments(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -2, -2, 2, 1.85, 0.01, "#b0d388");
  if (b > 0) s += disc(P, 0, 0, 0.015, 1.45 * Math.min(1, 0.4 + b), "#ddd2b8", 24) + disc(P, 0, 0, 0.02, 0.95 * Math.min(1, 0.4 + b), "#b0d388", 24);
  if (fit > 0) for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.05 + (0.9 * i) / 8);
    s += bush(P, 1.75 * Math.cos(a), 1.75 * Math.sin(a), 0.22, 0.25);
  }
  // the birdhouse on its pole
  if (f > 0) s += box(P, -1.53, -1.53, -1.47, -1.47, 0, 1.4 * f, WOOD);
  if (r > 0) {
    s += box(P, -1.62, -1.62, -1.38, -1.38, 1.4, 1.62, ["#e4c48f", "#c9a670", "#a98856"]);
    if (detail) s += ellipse(...P(-1.5, -1.379, 1.52), 1.3, 1.5, "#3a2e22");
    s += gable(P, -1.5, -1.5, 0.15, 0.16, 1.62, 1.75, 1, TILE, 0);
  }
  if (fit > 0) {
    s += box(P, -0.55, -1.95, 0.55, -1.7, 0.25, 0.3, WOOD) + box(P, -0.55, -1.98, 0.55, -1.93, 0.3, 0.6, WOOD);
    for (const x of [-0.5, 0.45]) s += box(P, x, -1.95, x + 0.06, -1.7, 0, 0.25, STEEL);
  }
  // the sundial: pedestal, brass dial, hour lines and the 40° gnomon
  if (f > 0) s += lathe(P, 0, 0, [[0.32, 0], [0.3, 0.1], [0.18, 0.15], [0.15, 0.12 + 0.48 * f], [0.26, 0.15 + 0.5 * f], [0.28, 0.15 + 0.55 * f]], STONE, { n: 14 });
  if (sk > 0 && f > 0.95) {
    s += disc(P, 0, 0, 0.705, 0.27, "#c9a85a", 18);
    if (detail) for (let h = -6; h <= 6; h++) {
      const a = Math.PI / 2 + (h * Math.PI) / 12;
      s += seg(P(0.12 * Math.cos(a), 0.12 * Math.sin(a), 0.71), P(0.24 * Math.cos(a), 0.24 * Math.sin(a), 0.71), "#7d6532", 0.6);
    }
    if (sk > 0.6) s += poly([P(0, 0.2, 0.71), P(0, -0.2, 0.71), P(0, -0.2, 0.71 + 0.4 * Math.tan((40 * Math.PI) / 180))], "#8f7135");
  }
  // the stone lantern
  if (f > 0) s += lathe(P, 1.4, -0.55, [[0.2, 0], [0.18, 0.08], [0.07, 0.12], [0.06, 0.15 + 0.35 * f]], STONE, { n: 10 });
  if (r > 0) {
    s += box(P, 1.28, -0.67, 1.52, -0.43, 0.5, 0.72, lit ? [LIT, "#e8b85a", "#c99a46"] : STONE);
    s += lathe(P, 1.4, -0.55, [[0.24, 0.72], [0.22, 0.76], [0.02, 0.92]], STONE, { n: 8 });
  }
  if (fit > 0) for (const [x, y, c] of [[-1.05, 1.2, ["#ef8aa0", "#d76a83", "#b84f68"]], [-0.55, 1.5, ["#f3c95c", "#dcab3c", "#ba8b2a"]], [1.25, 1.05, ["#e46a50", "#c4513a", "#a03d2b"]]]) {
    s += lathe(P, x, y, [[0.14, 0], [0.2, 0.3], [0.22, 0.32]], ["#d58a5e", "#b86c45", "#965335"], { n: 10 });
    s += bush(P, x, y, 0.42, 0.2, c);
  }
  return s;
}

// ---------- Çoban Kulübesi ----------
// A shepherd's hut on four cast-iron wheels: timber chassis and frame,
// painted board cladding, a curved corrugated iron roof, a wood stove
// chimney, a stable door with steps at one end and a drawbar at the other.
const roofZ = (y) => 1.65 + 0.35 * (1 - (y / 0.72) ** 2);
function hut(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -2.1, -1.4, 2.1, 1.4, 0.01, "#b2d38b");
  if (b > 0) {
    for (const x of [-0.8, 0.8]) s += wheel(P, x, -0.62, 0.3, 0.28);
    s += seg(P(-1.25, 0, 0.5), P(-1.95, 0, 0.32), WOOD[2], 2) + box(P, -1.25, -0.55, 1.25, 0.55, 0.42, 0.42 + 0.13 * b, WOOD);
  }
  if (f > 0) for (const [x, y] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]]) s += box(P, x - 0.04, y - 0.04, x + 0.04, y + 0.04, 0.55, 0.55 + 1.1 * f, WOOD);
  if (sk > 0) {
    s += box(P, -1.2, -0.6, 1.2, 0.6, 0.55, 0.55 + 1.1 * sk, PAINT);
    if (sk > 0.9) {
      const end = [];
      for (let i = 0; i <= 10; i++) {
        const y = -0.6 + (1.2 * i) / 10;
        end.push(P(1.2, y, roofZ(y)));
      }
      s += poly([P(1.2, -0.6, 1.65), ...end, P(1.2, 0.6, 1.65)], PAINT[2]);
      if (detail) for (let z = 0.7; z < 1.62; z += 0.11) s += seg(P(-1.2, 0.601, z), P(1.2, 0.601, z), PAINT[2], 0.45) + seg(P(1.201, -0.6, z), P(1.201, 0.6, z), PAINT[1], 0.45);
      s += window(P, -0.75, 0.602, 0.95, 0.5, 0.42, lit) + window(P, 0.25, 0.602, 0.95, 0.5, 0.42, lit);
      s += plate(P, 1.202, -0.22, 0.6, 0.44, 0.92, "#6a4b33", "x") + plate(P, 1.204, -0.18, 1.08, 0.36, 0.38, lit ? LIT : "#8fb0b5", "x");
    }
  }
  if (r > 0) {
    const n = 12,
      x0 = -1.32, x1 = -1.32 + 2.64 * r;
    for (let i = 0; i < n; i++) {
      const y0 = -0.72 + (1.44 * i) / n, y1 = -0.72 + (1.44 * (i + 1)) / n;
      s += poly([P(x0, y0, roofZ(y0)), P(x1, y0, roofZ(y0)), P(x1, y1, roofZ(y1)), P(x0, y1, roofZ(y1))], y1 <= 0 ? LEAD[0] : i > n * 0.75 ? LEAD[2] : LEAD[1]);
    }
    if (detail > 1) for (let x = x0 + 0.1; x < x1; x += 0.12) for (let i = 0; i < n; i++) {
      const y0 = -0.72 + (1.44 * i) / n, y1 = -0.72 + (1.44 * (i + 1)) / n;
      s += seg(P(x, y0, roofZ(y0) + 0.005), P(x, y1, roofZ(y1) + 0.005), LEAD[2], 0.4);
    }
  }
  if (fit > 0) {
    s += box(P, -0.95, -0.3, -0.87, -0.22, 1.9, 2.5, SOOT) + box(P, -0.99, -0.34, -0.83, -0.18, 2.5, 2.56, SOOT);
    for (let i = 0; i < 3; i++) s += box(P, 1.25 + i * 0.16, -0.3, 1.45 + i * 0.16, 0.3, 0, 0.5 - i * 0.16, WOOD);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) s += lathe(P, -1.65, 0.75 + j * 0.16 + i * 0.08, [[0.075, 0.07 + i * 0.13], [0.075, 0.08 + i * 0.13]], WOOD, { n: 6 }) + ellipse(...P(-1.65 + 0.3, 0.75 + j * 0.16 + i * 0.08, 0.075 + i * 0.13), 1.4, 1.4, "#c9a576");
  }
  if (b > 0) for (const x of [-0.8, 0.8]) s += wheel(P, x, 0.62, 0.3, 0.28);
  return s;
}

// ---------- Kestane Kebapçısı (weekly, autumn) ----------
// A chestnut seller's cart under an old chestnut tree: spoked wheels, a red
// sheet-steel body, a charcoal brazier with a perforated pan and a flue,
// a striped awning; stools, sacks and the fallen leaves of October.
function chestnut(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -2, -1.85, 2, 1.6, 0.01, "#d9cfba");
  if (detail) for (let i = 0; i < 26; i++) s += ellipse(...P(-1.9 + ((i * 43) % 38) / 10, -1.7 + ((i * 29) % 32) / 10, 0.015), 1.3, 0.7, AUTUMN[i % 3]);
  // the tree was there first
  const BARK = ["#8a6a4e", "#6e523b", "#56402e"];
  s += beam(P, [-1.3, -1.15, 0], [-1.25, -1.1, 2.0], 7, BARK) + beam(P, [-1.27, -1.12, 1.5], [-0.85, -1.2, 2.3], 3, BARK) + beam(P, [-1.27, -1.12, 1.7], [-1.55, -0.85, 2.4], 3, BARK);
  for (const [x, y, z, rr] of [[-1.6, -1.3, 2.4, 0.75], [-0.85, -1.25, 2.55, 0.7], [-1.3, -0.75, 2.75, 0.75], [-1.3, -1.2, 3.1, 0.6]]) s += bush(P, x, y, z, rr, AUTUMN);
  if (fit > 0) for (const [x, y] of [[-0.95, -0.45], [-0.75, -0.2]]) s += lathe(P, x, y, [[0.16, 0], [0.19, 0.2], [0.13, 0.4], [0.06, 0.45]], ["#d2b68a", "#b49668", "#937750"], { n: 8 });
  const cx = 0.3;
  if (b > 0) for (const x of [cx - 0.4, cx + 0.4]) s += box(P, x - 0.05, -0.45, x + 0.05, 0.45, 0, 0.06, WOOD);
  if (f > 0) {
    s += wheel(P, cx, -0.38, 0.32, 0.32, 10);
    s += seg(P(cx - 0.55, -0.25, 0.75), P(cx - 1.05, -0.3, 0.82), WOOD[2], 1.4) + seg(P(cx - 0.55, 0.25, 0.75), P(cx - 1.05, 0.3, 0.82), WOOD[2], 1.4);
    s += box(P, cx - 0.6, -0.35, cx + 0.6, 0.35, 0.38, 0.45, STEEL);
    s += box(P, cx - 0.55, 0.2, cx - 0.5, 0.25, 0, 0.4, STEEL);
  }
  if (sk > 0) {
    s += box(P, cx - 0.55, -0.32, cx + 0.55, 0.32, 0.45, 0.45 + 0.55 * sk, RED);
    if (sk > 0.9 && detail) s += seg(P(cx - 0.5, 0.321, 0.72), P(cx + 0.5, 0.321, 0.72), "#f2d48a", 0.8) + plate(P, cx - 0.15, 0.322, 0.5, 0.3, 0.32, RED[2]);
  }
  if (r > 0) {
    for (const [x, y] of [[cx - 0.52, -0.3], [cx + 0.52, -0.3], [cx - 0.52, 0.3], [cx + 0.52, 0.3]]) s += box(P, x - 0.015, y - 0.015, x + 0.015, y + 0.015, 1.0, 1.0 + 0.75 * r, STEEL);
    s += box(P, cx + 0.36, -0.22, cx + 0.44, -0.14, 1.0, 1.0 + 0.95 * r, STEEL) + (r > 0.9 ? box(P, cx + 0.33, -0.25, cx + 0.47, -0.11, 1.95, 2.0, STEEL) : "");
  }
  if (fit > 0) {
    s += box(P, cx - 0.35, -0.25, cx + 0.25, 0.25, 1.0, 1.1, ["#4a4744", "#3a3734", "#2c2a28"]);
    s += disc(P, cx - 0.05, 0, 1.12, 0.26, lit ? "#e0662c" : "#3c3a38", 14);
    if (detail) for (let i = 0; i < 9; i++) s += ellipse(...P(cx - 0.2 + (i % 3) * 0.14, -0.12 + Math.floor(i / 3) * 0.12, 1.14), 1.5, 1.1, "#7a4a2a");
    for (const [x, y] of [[cx + 0.42, 0.18], [cx + 0.48, 0.05]]) s += poly([P(x, y, 1.0), P(x + 0.05, y, 1.2), P(x - 0.05, y, 1.2)], "#efe6cf");
  }
  if (r > 0.6) {
    const z0 = 1.75, z1 = 1.68;
    for (let i = 0; i < 8; i++) {
      const x0 = cx - 0.65 + i * 0.1625, x1 = x0 + 0.1625;
      s += poly([P(x0, -0.42, z0), P(x1, -0.42, z0), P(x1, 0.42, z1), P(x0, 0.42, z1)], i % 2 ? "#f4efe4" : "#c94a3c");
    }
    s += plate(P, cx - 0.65, 0.421, 1.52, 1.3, 0.16, "#c94a3c");
    if (detail > 1) s += wallText(P, [cx - 0.6, 0.43, 1.6], [cx + 0.6, 0.43, 1.6], "KESTANE", 8, "#fff7e6");
    if (fit > 0) s += box(P, cx - 0.04, 0.3, cx + 0.04, 0.38, 1.42, 1.52, lit ? [LIT, "#e8b85a", "#c99a46"] : STEEL);
  }
  if (f > 0) s += wheel(P, cx, 0.38, 0.32, 0.32, 10);
  if (fit > 0) for (const [x, y] of [[1.35, 0.85], [0.6, 1.15]]) s += box(P, x - 0.13, y - 0.13, x + 0.13, y + 0.13, 0.32, 0.36, WOOD) + seg(P(x - 0.1, y + 0.1, 0), P(x - 0.1, y + 0.1, 0.32), WOOD[2], 1) + seg(P(x + 0.1, y + 0.1, 0), P(x + 0.1, y + 0.1, 0.32), WOOD[2], 1) + seg(P(x + 0.1, y - 0.1, 0), P(x + 0.1, y - 0.1, 0.32), WOOD[2], 1);
  return s;
}

// ---------- Kuş Gözlem Kulesi (weekly, autumn) ----------
// A bird hide on stilts at the edge of a reed bed: pad footings, four posts
// with X bracing, a platform and a small timber room with long viewing
// slots, a reed-thatched hip roof, and an outside stair. Migrating birds pass.
function birdHide(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -2, -1.9, 2.2, 1.9, 0.01, "#a2c67f");
  s += poly(pondPts(P, 1.15, 1.0, 1.0, 0.75, 0.015), "#7fb0b5");
  if (detail) s += seg(P(0.7, 1.2, 0.02), P(1.1, 1.2, 0.02), "#c7e1e2", 0.6);
  const H = 2.0, q = [[-0.9, -0.9], [0.3, -0.9], [-0.9, 0.3], [0.3, 0.3]];
  const post = ([x, y]) => (b > 0 ? box(P, x - 0.13, y - 0.13, x + 0.13, y + 0.13, 0, 0.1 * b, ["#c9c6be", "#aeaba3", "#94918a"]) : "") + (f > 0 ? box(P, x - 0.05, y - 0.05, x + 0.05, y + 0.05, 0.1, 0.1 + (H - 0.1) * f, WOOD) : "");
  const brace = (a, c) => (f > 0.9 ? beam(P, [a[0], a[1], 0.15], [c[0], c[1], H - 0.1], 0.9) + beam(P, [c[0], c[1], 0.15], [a[0], a[1], H - 0.1], 0.9) : "");
  s += post(q[0]) + brace(q[0], q[1]) + brace(q[0], q[2]) + post(q[1]) + post(q[2]) + brace(q[2], q[3]) + brace(q[1], q[3]) + post(q[3]);
  if (fit > 0) s += reeds(P, -1.5, 0.9, 10, detail) + reeds(P, 0.3, 1.6, 9, detail);
  if (sk > 0) {
    s += box(P, -1.12, -1.12, 0.52, 0.52, H, H + 0.1, WOOD);
    if (sk > 0.3) {
      const top = H + 0.1 + 0.9 * Math.min(1, (sk - 0.3) / 0.6);
      s += box(P, -1.0, -1.0, 0.4, 0.4, H + 0.1, top, ["#b28c62", "#94704a", "#775837"]);
      if (detail) for (let z = H + 0.25; z < top; z += 0.15) s += seg(P(-1.0, 0.401, z), P(0.4, 0.401, z), "#775837", 0.45) + seg(P(0.401, -1.0, z), P(0.401, 0.4, z), "#5f452c", 0.45);
      if (sk > 0.95) s += plate(P, -0.85, 0.402, H + 0.5, 1.1, 0.16, lit ? LIT : "#2f2a24") + plate(P, 0.402, -0.85, H + 0.5, 1.1, 0.16, lit ? LIT : "#2f2a24", "x");
    }
  }
  if (r > 0) {
    const z = H + 0.95, top = z + 0.95 * r, a = 1.2 - 0.9 * (1 - r);
    s += poly([P(-0.3 - a, -0.3 + a, z), P(-0.3 + a, -0.3 + a, z), P(-0.3, -0.3, top)], STRAW[0]);
    s += poly([P(-0.3 + a, -0.3 - a, z), P(-0.3 + a, -0.3 + a, z), P(-0.3, -0.3, top)], STRAW[1]);
    if (detail) for (let i = 1; i < 8; i++) {
      const t = i / 8;
      s += seg(P(-0.3 - a + 2 * a * t, -0.3 + a, z), P(-0.3, -0.3, top), STRAW[2], 0.4) + seg(P(-0.3 + a, -0.3 - a + 2 * a * t, z), P(-0.3, -0.3, top), STRAW[2], 0.4);
    }
  }
  if (fit > 0) {
    // the stair comes down along +x
    const n = Math.round(9 * fit);
    for (let i = 0; i < n; i++) {
      const x = 0.55 + i * 0.17, z = H - i * 0.22;
      s += box(P, x, -0.75, x + 0.17, -0.35, z - 0.04, z, WOOD);
    }
    if (fit > 0.9) {
      s += seg(P(0.55, -0.33, H + 0.55), P(2.07, -0.33, 0.55), WOOD[2], 1.2);
      for (const x of [0.6, 1.3, 2.0]) s += seg(P(x, -0.33, H - (x - 0.55) * 1.29), P(x, -0.33, H - (x - 0.55) * 1.29 + 0.55), WOOD[2], 0.8);
    }
    s += reeds(P, 1.9, 0.4, 7, detail);
    if (detail) for (const [x, y, z] of [[-1.4, 0.2, 4.4], [-1.0, 0.5, 4.6], [-0.6, 0.8, 4.5], [0.6, -0.4, 4.2]]) s += seg(P(x - 0.12, y, z + 0.06), P(x, y, z), "#3a3a3a", 0.9) + seg(P(x, y, z), P(x + 0.12, y, z + 0.06), "#3a3a3a", 0.9);
    if (detail) for (const [x, y] of [[1.3, 1.25], [0.85, 0.75]]) s += ellipse(...P(x, y, 0.04), 2.4, 1.3, "#8a6a45") + ellipse(...P(x + 0.07, y, 0.1), 1, 1, "#2f5a3a");
  }
  return s;
}

const make = (draw, height, wallTop, reach, material, labels, info) => design({ draw, height, wallTop, reach, material, labels, info });
export const SMALL_BUILDINGS = {
  cesme: make(fountain, 2.7, 2.0, 2.0, "stone",
    ["Su yolu, taş temel ve döşeme", "Kesme taş gövde", "Sivri kemerli niş, ayna taşı ve kitabe", "Saçak ve kurşun örtü", "Tunç lüle, yalak ve sekiler"],
    ["Su, yukarıdaki maslaktan (dağıtım haznesi) pişmiş toprak künklerle gelir. Künkler hafif eğimle döşenir ki içlerinde hava kalmasın; gövdenin altına taş temel, önüne taş döşeme yapılır.", "Gövde, harçla bağlanan kesme taş sıralarıyla yükselir. Her sıranın derzi alttakine göre kaydırılır; böylece düşey çatlak bir sıradan ötekine yürümez.", "Sivri kemer nişin üstündeki yükü iki yana, ayaklara aktarır. Nişin içine oymalı ayna taşı oturur; üstüne çeşmeyi yaptıranın kitabesi konur.", "Geniş saçak yağmuru taş yüzden uzak tutar ve çeşmeye gelenleri gölgeler. Üstteki örtü kurşun levhadır: kolay biçim alır, paslanmaz.", "Lüle ayna taşına geçirilir. Taşan su yalaktan, döşemedeki taş oluğa ve bahçeye akar; durgun su bırakılmaz. Yanlara oturmalık taş sekiler konur."]),
  cardak: make(arbour, 2.25, 1.55, 2.0, "timber",
    ["Çakıl zemin ve beton ayaklar", "Ahşap dikmeler ve ana kirişler", "Köşe payandaları ve ızgara mertekler", "Asma telleri ve asma", "Masa, banklar, fener ve üzümler"],
    ["Zemine sıkıştırılmış çakıl serilir; yağmur suyu süzülür, çamur olmaz. Her dikmenin altına küçük beton ayak ve çelik papuç konur, ahşap topraktan 10 cm yukarıda kalır ve çürümez.", "10 × 10 cm dikmeler papuçlara cıvatalanır; şakulden kontrol edilir. Üstlerine iki uzun kiriş oturur ve dikmelerden biraz taşar.", "Kirişle dikme arasına çapraz payandalar takılır; çardağın rüzgârda yana yatmasını bunlar önler. Üstüne aralıklı mertekler dizilir.", "Merteklerin arasına gergin teller çekilir. Asmanın filizleri bu tellere bağlanarak yönlendirilir; yaprakları yazın serin bir gölge yapar.", "Masa ve banklar yerleştirilir, ortaya fener asılır. Asmanın salkımları sonbaharda kızarır; bağlantılar son kez sıkılır."]),
  golkopru: make(pondBridge, 1.4, 0.75, 2.4, "timber",
    ["Gölet kazısı, kil astar ve kenar taşları", "Taş mesnetler ve kavisli kirişler", "Döşeme tahtaları", "Dikmeler ve tırabzan", "Su, nilüfer, balıklar ve kıyı bitkileri"],
    ["Gölet çanak gibi kazılır, kenarları yumuşak eğimli bırakılır. Tabana sıkıştırılmış kil astar serilir; su toprağa sızmaz. Kenarlar taşlarla tutturulur.", "İki kıyıya taş mesnet yapılır. Üstlerine yapıştırılmış katmanlı ahşaptan (lamine) iki kavisli kiriş oturur; kavis kirişi biraz kemer gibi çalıştırır ve suyun üstünde ayak gerekmez.", "Döşeme tahtaları kirişlere enine vidalanır. Aralarında küçük boşluk bırakılır; yağmur suyu akar, ahşap şişince birbirini itmez.", "Dikmeler kirişlere cıvatalanır, üstlerine el tutamağı bağlanır. Korkuluk, birisi yaslandığında gelen yatay itmeye dayanacak sıklıkta konur.", "Gölet doldurulur, nilüferler ve kıyı bitkileri dikilir, kırmızı balıklar bırakılır. Bitkiler suyu süzer ve gölgeler; yosun azalır."]),
  arilik: make(apiary, 1.75, 1.25, 2.1, "timber",
    ["Alan düzleme ve kovan altlıkları", "Bal evinin ahşap iskeleti", "Bal evi duvarları ve kuluçka katları", "Çatı, ballıklar ve kovan kapakları", "Rüzgârkıran, lavanta, sulak ve arılar"],
    ["Kovanlar sabah güneşini alacak biçimde dizilir. Her kovan yerden 40 cm kadar yüksek altlıklara konur: nem ve karınca uzak durur, arıcının beli de rahat eder.", "Bal evi (petek ve aletlerin durduğu kulübe) için dört dikme ve taban kurulur. Kapı kovanlardan uzak yana açılır.", "Bal evinin duvarları kapanır. Kovanların en alttaki kuluçka katı yerleştirilir; ana arı ve yavrular burada yaşar. Uçuş deliği öne bakar.", "Kuluçka katının üstüne ballıklar eklenir, kapaklar kapatılır. Kovanlar farklı renge boyanır; arılar renkleri ayırt eder ve kendi kovanını daha kolay bulur.", "Arkaya rüzgârı kıran çalı çit dikilir, önüne lavanta ekilir. Taşlı sulak konur: arılar suya düşmeden taşlara konup içer."]),
  meteo: make(weather, 6.6, 1.3, 2.0, "steel",
    ["Çim alan, çit ve beton kaideler", "10 m direk ve gergi halatları", "Panjurlu meteoroloji siperi", "Rüzgâr ölçer ve rüzgâr gülü", "Yağış ölçer, güneşlenme küresi ve kayıt cihazı"],
    ["İstasyon açık, kısa çimli düz bir alana kurulur; beton ve asfalt ısıyı tutup ölçümü bozar. Alan çitle çevrilir, direk ve gergiler için beton kaideler dökülür.", "Rüzgâr, uluslararası kurala göre yerden 10 m yükseklikte ölçülür. İnce direk üç yönden 120° arayla gergi halatlarıyla tutturulur; halatlar direği rüzgârda dik tutar.", "Termometreler beyaz, panjurlu bir kafesin içinde yerden 1,25–2 m yüksekte durur. Beyaz boya güneşi geri yansıtır, panjurlar havayı geçirir ama güneşi ve yağmuru içeri almaz; kapı kuzeye açılır.", "Direğin tepesine üç kepçeli rüzgâr ölçer ve yön gösteren rüzgâr gülü takılır. Kepçelerin dönüş hızı rüzgâr hızını verir.", "Yağış ölçer, ağzına dolan suyu ölçer; çevresinde yüksek bir şey olmamalıdır. Cam küre güneşi bir karta odaklayıp yakar; yanık izin uzunluğu günün güneşlenme süresidir. Veriler güneş panelli kayıt cihazına yazılır."]),
  sus: make(ornaments, 1.75, 0.7, 2.0, "stone",
    ["Bahçe düzeni, çakıl halka ve kaideler", "Güneş saati sütunu, kuş evi direği ve taş fener", "Kadran ve 40° gölge çubuğu", "Kuş evi çatısı ve fener başlığı", "Şimşir çit, saksılar ve bank"],
    ["Bahçe ortası işaretlenir, çakıl yürüyüş halkası serilir. Güneş saati ve fenerin kaideleri sağlam zemine oturtulur; eğilirlerse saat yanlış gösterir.", "Taş sütun dik dikilir, kuş evi direği çakılır, taş fener kaidesine konur. Kuş evinin direği kedilerin tırmanamayacağı kadar düz ve yüksek olur.", "Kadran düz olarak terazilenir. Gölge çubuğu tam kuzeye bakar ve yere 40° eğim yapar: bu açı Ankara'nın enlemidir, çubuk Kutup Yıldızı'na doğru uzanır.", "Kuş evinin delik ağzı küçük tutulur, küçük kuşlar girer, iri kuşlar giremez. Taş fenerin başlığı yerine oturur.", "Arka yarıma şimşir çit dikilir, saksılar çiçeklerle doldurulur, bank kurulur. Güneş saati sabah ve akşam en uzun gölgeyi verir."]),
  cobankulube: make(hut, 2.6, 1.65, 2.0, "timber",
    ["Şase, akslar ve döküm demir tekerlekler", "Ahşap karkas", "Boyalı lambri kaplama, kapı ve pencereler", "Kavisli oluklu sac çatı", "Soba bacası, merdiven ve odun yığını"],
    ["Kulübe sürüyle birlikte taşınabilsin diye tekerlekler üstüne kurulur. Ahşap şase iki aksa bağlanır, döküm demir tekerlekler takılır; öne çeki oku eklenir.", "Şasenin üstüne ahşap dikmeler ve kuşaklar kurulur. Köşeler çaprazlanır; çekilirken sallanan kulübe biçimini kaybetmez.", "Dış yüz boyalı tahtalarla kaplanır, arasına yalıtım konur. Bir uca kapı, iki yana pencere açılır.", "Kemerlerin üstüne oluklu sac bükülerek serilir. Kavis hem yağmuru hemen akıtır hem de ince sacı rijit yapar; oluklar sacın eğilmesini zorlaştırır.", "İçeriye küçük odun sobası konur, bacası çatıdan geçen yerde yalıtılır. Kapıya ahşap basamaklar, yanına kışlık odun istiflenir."]),
  kestane: make(chestnut, 3.6, 1.0, 2.0, "steel",
    ["Zemin ve teker takozları", "Şase, tekerlekler ve tutamaklar", "Kırmızı saç gövde ve dolaplar", "Tente direkleri ve baca", "Mangal, delikli tava, tabureler ve çuvallar"],
    ["Araba yaşlı kestane ağacının altına, düz bir yere çekilir. Tekerleklerin önüne takoz konur; araba kaymaz.", "Çelik şase iki büyük tekerleğe bağlanır. Tekerlekler iri olunca araba taşlı yolda kolay itilir.", "Gövde saçtan bükülür, kırmızıya boyanır. Altında kömür ve kese kâğıdı dolabı vardır.", "Tente için ince direkler, mangalın dumanı için baca takılır. Baca dumanı tentenin ve müşterinin üstünden uzaklaştırır.", "Mangala kömür yakılır, üstüne delikli tava konur. Her kestanenin kabuğu çizilir: içindeki su ısınınca buhar olur, çizik yoksa kestane patlar. Tabureler ve çuvallar yerleşir."]),
  kusgozlem: make(birdHide, 4.7, 2.95, 2.1, "timber",
    ["Tekil beton temeller", "Dikmeler ve X çaprazlar", "Platform ve gözlem odası", "Kamış (saz) çatı", "Merdiven, korkuluk ve sazlık"],
    ["Islak zeminde dört tekil beton temel, don derinliğinin altına kadar dökülür; donan su temeli kaldıramaz. Ahşap dikmeler betona değmeden çelik papuçlara oturur.", "Dört dikme dik kurulur, aralarına X çaprazlar çakılır. Çaprazlar kuleyi rüzgârda bir çerçeve gibi kilitler; çaprazsız ince kule sallanır.", "Dikmelerin üstüne platform döşenir, üstüne küçük ahşap oda kurulur. Duvarlara uzun, dar gözlem yarıkları açılır; kuşlar içeridekileri görmez.", "Çatı kamış demetleriyle kaplanır. Demetler aşağıdan yukarı bindirilir; dik eğim yağmuru kamışın içine işlemeden kaydırır. Kamış ayrıca odayı serin ve sessiz tutar.", "Dış merdiven ve korkuluk takılır. Sazlık korunur; sonbaharda göç eden kuşlar burada dinlenir."]),
};

// Famous buildings, third group (n38): the Eiffel Tower, the Sydney Opera
// House and Burj Khalifa, built in their real order. Quantities count the
// real buildings.
import { box, circle, poly, seg } from "./iso.js";
import { at, castShadow, cell, clamp, facing, lathe, mix, mixAll, painted, progress, rectOutline, shade, unit } from "./kit.js";
import { thousands } from "./landmarks1.js";

const WARM = "#ffd36e";
const dotted = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// An upright prism on a convex outline given anticlockwise.
function prism(P, pts, z0, z1, faces, { lines = 0, line = "#00000022" } = {}) {
  let s = "";
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length],
      n = unit([b[1] - a[1], a[0] - b[0], 0]);
    if (!facing(n)) return;
    s += poly([P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)], shade(P, n, faces));
    if (lines) for (let z = z0 + lines; z < z1 - 0.01; z += lines) s += seg(P(a[0], a[1], z), P(b[0], b[1], z), line, 0.5);
  });
  return s + poly(pts.map(([x, y]) => P(x, y, z1)), faces[0]);
}

// =====================================================================
// Eyfel Kulesi (1887-1889): four legs on concrete blocks, the two by the
// Seine sunk with compressed-air caissons; 18,038 pieces drilled in the
// works and joined on site with 2.5 million rivets. The legs leaned out
// over timber scaffolds and met the first-floor girders, set true with
// sand boxes and hydraulic jacks; creeper cranes then climbed the legs.
// 7,300 t of wrought iron, 300 m, opened on 31 March 1889.
// =====================================================================
const EF = { z0: 0.3, B: 1.0, h1: 0.845, h2: 1.7, h3: 4.09, top: 4.45 };
const WIDTH = [[0, 1.0], [0.42, 0.74], [0.845, 0.55], [1.25, 0.41], [1.7, 0.31], [2.5, 0.22], [3.3, 0.17], [4.09, 0.13], [4.45, 0.05]];
const halfW = (h) => {
  for (let i = 1; i < WIDTH.length; i++) if (h <= WIDTH[i][0]) return WIDTH[i - 1][1] + ((WIDTH[i][1] - WIDTH[i - 1][1]) * (h - WIDTH[i - 1][0])) / (WIDTH[i][0] - WIDTH[i - 1][0]);
  return WIDTH.at(-1)[1];
};
const legW = (h) => 0.36 - (0.05 * h) / EF.h2;
const innerW = (h) => Math.max(0, halfW(h) - legW(h));
function latticeFace(P, lo0, lo1, hi0, hi1, col, fill, visible, w = 1) {
  let s = "";
  if (visible) s += poly([P(...lo0), P(...lo1), P(...hi1), P(...hi0)], fill, 0.22);
  s += seg(P(...lo0), P(...hi1), col, 0.5 * w, visible ? 0.9 : 0.45) + seg(P(...lo1), P(...hi0), col, 0.5 * w, visible ? 0.9 : 0.45);
  return s;
}
function eiffelSVG(P, k, lit = false, detail = 2) {
  let s = "";
  const z = (h) => EF.z0 + h;
  const paintT = clamp(k.paint * 1.5);
  const col = lit && k.lights > 0.5 ? "#e8b44e" : mix("#4d4a47", "#7a3f2c", paintT),
    fill = lit && k.lights > 0.5 ? "#f2c766" : mix("#6b6763", "#9b4a36", paintT);
  // Foundations: four blocks; the two by the river sunk as caissons.
  if (k.found > 0) {
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const c = EF.B - legW(0) / 2;
      s += box(P, sx * c - 0.24, sy * c - 0.24, sx * c + 0.24, sy * c + 0.24, 0, EF.z0 * clamp(k.found * 1.4 - (sx > 0 ? 0.3 : 0)), ["#c9c4b8", "#b0ab9f", "#96918a"]);
      if (sx > 0 && k.found < 1) s += lathe(P, sx * c, sy * c, [[0.16, EF.z0], [0.16, EF.z0 + 0.35]], ["#6f7780", "#5b636b", "#4a5158"], { n: 10 });
    }
  }
  // How far the iron has gone up.
  const hLegs = 0.45 * clamp(k.legs0) + (EF.h1 - 0.45) * clamp(k.legs1) + (EF.h2 - EF.h1) * clamp(k.floor2),
    hShaft = EF.h2 + (3.1 - EF.h2) * clamp(k.shaft0) + (EF.h3 - 3.1) * clamp(k.shaft1) + (EF.top - EF.h3) * clamp(k.crown);
  const step = detail >= 2 ? 0.12 : 0.24;
  const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [sx, sy] of legs) {
    // Timber scaffolds hold the legs until the first floor joins them.
    if (k.legs1 > 0 && k.platform1 < 1) {
      const hm = 0.55,
        r = halfW(hm) - legW(hm) / 2;
      for (const [dx, dy] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) s += seg(P(sx * r + dx, sy * r + dy, 0), P(sx * r + dx, sy * r + dy, z(hm)), "#ad7f48", 1);
      s += seg(P(sx * r - 0.08, sy * r, z(0.25)), P(sx * r + 0.08, sy * r, z(0.25)), "#ad7f48", 0.8);
    }
    if (hLegs <= 0) continue;
    for (let h = 0; h < hLegs - 1e-6; h += step) {
      const h1 = Math.min(hLegs, h + step);
      const o0 = halfW(h),
        i0 = innerW(h),
        o1 = halfW(h1),
        i1 = innerW(h1);
      const C = (x, y, hh) => [sx * x, sy * y, z(hh)];
      // Inner faces first, then the outer ones.
      s += latticeFace(P, C(i0, i0, h), C(i0, o0, h), C(i1, i1, h1), C(i1, o1, h1), col, fill, sx < 0, 1);
      s += latticeFace(P, C(i0, i0, h), C(o0, i0, h), C(i1, i1, h1), C(o1, i1, h1), col, fill, sy < 0, 1);
      s += latticeFace(P, C(o0, i0, h), C(o0, o0, h), C(o1, i1, h1), C(o1, o1, h1), col, fill, sx > 0, 1.2);
      s += latticeFace(P, C(i0, o0, h), C(o0, o0, h), C(i1, o1, h1), C(o1, o1, h1), col, fill, sy > 0, 1.2);
      for (const [x0, y0, x1, y1] of [[o0, o0, o1, o1], [i0, o0, i1, o1], [o0, i0, o1, i1]]) s += seg(P(...C(x0, y0, h)), P(...C(x1, y1, h1)), col, 1.3);
    }
    // A creeper crane at the top of the leg while it climbs.
    if (sx + sy >= 0 && hLegs > 0 && hLegs < EF.h2 - 0.01) {
      const hh = hLegs,
        r = halfW(hh) - legW(hh) / 2;
      s += box(P, sx * r - 0.06, sy * r - 0.06, sx * r + 0.06, sy * r + 0.06, z(hh), z(hh) + 0.1, ["#5b5550", "#47423e", "#36322f"]) + seg(P(sx * r, sy * r, z(hh) + 0.1), P(sx * r * 0.6, sy * r * 0.6, z(hh) + 0.4), "#36322f", 1.2);
    }
  }
  // The great arches under the first floor, on the two faces we see.
  if (k.platform1 >= 1 && detail >= 1)
    for (const axis of ["x", "y"]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16,
          hh = 0.12 + 0.62 * Math.sin(Math.PI * t) ** 0.7,
          u = -innerW(hh) - 0.02 + (2 * innerW(hh) + 0.04) * t;
        pts.push(axis === "x" ? P(halfW(hh) - legW(hh) * 0.2, u, z(hh)) : P(u, halfW(hh) - legW(hh) * 0.2, z(hh)));
      }
      s += pts.slice(1).map((p, i) => seg(pts[i], p, col, 1.6)).join("");
    }
  // The floors.
  if (k.platform1 > 0) {
    const a = halfW(EF.h1) + 0.03,
      t = clamp(k.platform1);
    s += box(P, -a, -a, -a + 2 * a * t, a, z(EF.h1) - 0.09, z(EF.h1), [fill, mix(fill, "#000", 0.15), mix(fill, "#000", 0.3)]);
    if (t >= 1 && detail >= 2) s += seg(P(a + 0.005, -a, z(EF.h1) - 0.05), P(a + 0.005, a, z(EF.h1) - 0.05), col, 0.6) + seg(P(-a, a + 0.005, z(EF.h1) - 0.05), P(a, a + 0.005, z(EF.h1) - 0.05), col, 0.6);
  }
  if (hLegs >= EF.h2 - 1e-6) {
    const a = halfW(EF.h2) + 0.03;
    s += box(P, -a, -a, a, a, z(EF.h2) - 0.07, z(EF.h2), [fill, mix(fill, "#000", 0.15), mix(fill, "#000", 0.3)]);
  }
  // The shaft: one tapering lattice from the second floor up.
  if (hShaft > EF.h2 + 0.01) {
    for (let h = EF.h2; h < Math.min(hShaft, EF.h3) - 1e-6; h += step) {
      const h1 = Math.min(hShaft, EF.h3, h + step),
        a = halfW(h),
        b = halfW(h1);
      s += latticeFace(P, [-a, -a, z(h)], [a, -a, z(h)], [-b, -b, z(h1)], [b, -b, z(h1)], col, fill, false);
      s += latticeFace(P, [-a, -a, z(h)], [-a, a, z(h)], [-b, -b, z(h1)], [-b, b, z(h1)], col, fill, false);
      s += latticeFace(P, [a, -a, z(h)], [a, a, z(h)], [b, -b, z(h1)], [b, b, z(h1)], col, fill, true, 1.2);
      s += latticeFace(P, [-a, a, z(h)], [a, a, z(h)], [-b, b, z(h1)], [b, b, z(h1)], col, fill, true, 1.2);
      for (const [x, y] of [[a, a], [a, -a], [-a, a]]) s += seg(P(x, y, z(h)), P((x * b) / a, (y * b) / a, z(h1)), col, 1.2);
    }
    if (hShaft < EF.top - 0.01) s += box(P, -0.05, -0.05, 0.05, 0.05, z(Math.min(hShaft, EF.h3)), z(Math.min(hShaft, EF.h3)) + 0.1, ["#5b5550", "#47423e", "#36322f"]);
  }
  if (hShaft >= EF.h3) {
    const a = halfW(EF.h3) + 0.03;
    s += box(P, -a, -a, a, a, z(EF.h3) - 0.06, z(EF.h3), [fill, mix(fill, "#000", 0.15), mix(fill, "#000", 0.3)]);
    if (k.crown > 0) {
      const t = clamp(k.crown);
      s += box(P, -0.08, -0.08, 0.08, 0.08, z(EF.h3), z(EF.h3) + 0.18 * t, [fill, mix(fill, "#000", 0.15), mix(fill, "#000", 0.3)]);
      if (t >= 1) s += seg(P(0, 0, z(EF.h3) + 0.18), P(0, 0, z(EF.top) + 0.12), col, 1.4);
    }
  }
  // Lifts in the legs, and the beacon at night.
  if (k.lights > 0.5 && detail >= 1) {
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1]]) {
      const hh = 0.5,
        r = halfW(hh) - legW(hh) / 2;
      s += box(P, sx * r - 0.04, sy * r - 0.04, sx * r + 0.04, sy * r + 0.04, z(hh), z(hh) + 0.09, ["#f0e2b6", "#d9c690", "#b9a66f"]);
    }
    if (lit) s += circle(...P(0, 0, z(EF.top) + 0.1), 4, WARM);
  }
  return s;
}
const EIFFEL_DONE = { found: 1, legs0: 1, legs1: 1, platform1: 1, floor2: 1, shaft0: 1, shaft1: 1, crown: 1, paint: 1, lights: 1 };
export const EIFFEL = {
  system: "wroughtiron",
  ridge: 1.3,
  spec: () => ({ hw: 1.45, h: 3.5, floors: 3, wall: { faces: ["#a35a44", "#8a4a36", "#6f3a2a"], grain: "#6f3a2a", pattern: "eiffel" }, roof: ["#a35a44", "#8a4a36", "#6f3a2a"] }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "found", label: "Temel: dört ayağa beton bloklar; Seine yanındakiler basınçlı havalı kesonla", w: 1, cost: 4 },
    { key: "legs", floor: 0, label: "Ayaklar: fabrikada delinmiş 18.038 parça, sahada perçinleniyor", w: 1.2, cost: 6 },
    { key: "legs", floor: 1, label: "Ayaklar dışa eğiliyor: 12 ahşap iskele altta taşıyor", w: 1.2, cost: 6 },
    { key: "platform1", label: "1. kat (57 m): kum kutuları ve krikolarla dört ayak birleşiyor", w: 1, cost: 5, inspect: "dört ayak 1. kat kirişlerinde milimetrik buluştu", next: "yukarı devam" },
    { key: "floor2", label: "2. kat (115 m): yürüyen vinçler ayaklarla tırmanıyor", w: 1.2, cost: 6 },
    { key: "shaft", floor: 0, label: "Gövde: dört ayak tek kulede birleşiyor", w: 1, cost: 5 },
    { key: "shaft", floor: 1, label: "Gövde: 276 m'deki 3. kata", w: 0.9, cost: 4 },
    { key: "crown", label: "Tepe: fener ve bayrak direği, 300 m", w: 0.6, cost: 3, inspect: "2,5 milyon perçin ve düşeylik", next: "boyanabilir" },
  ],
  frameEnd: 0.7,
  later: [
    { key: "paint", label: "Boya: 60 t, Venedik kırmızısı", a: 0.7, b: 0.8, cost: 4 },
    { key: "lights", label: "Asansörler ve ışıklar", a: 0.8, b: 0.9, cost: 3 },
    { key: "handover", label: "Açılış: 31 Mart 1889, Dünya Fuarı", a: 0.9, b: 1, cost: 2 },
  ],
  live: true,
  scene: (P, sp, plan, shown, lit) => eiffelSVG(P, progress(plan, shown), lit, 2),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-0.9, -0.9, 0.9, 0.9), 1.6 * t + 0.1),
  shadowFrom: "legs",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(-0.9, -0.9, 0.9, 0.9), 1.6) : "";
    return s + eiffelSVG(P, EIFFEL_DONE, lit, detail);
  },
  snow: () => "",
  workHeight: () => null,
  crew(sp, p, k) {
    const leg = (h, tool) => at(halfW(h) - 0.05, halfW(h) - legW(h) / 2, EF.z0 + h, tool);
    if (p.key === "found") return [at(0.9, 0.5, 0, "shovel"), at(0.5, 1.1, 0, "carry")];
    if (p.key === "legs") return [leg((p.floor ? 0.45 : 0) + k * (p.floor ? 0.4 : 0.45), "hammer"), at(1.2, 0.2, 0, "carry")];
    if (p.key === "platform1") return [at(0.3, halfW(EF.h1), EF.z0 + EF.h1, "bar"), at(halfW(EF.h1), -0.2, EF.z0 + EF.h1, "hammer")];
    if (p.key === "floor2") return [leg(EF.h1 + k * (EF.h2 - EF.h1), "hammer")];
    if (p.key === "shaft" || p.key === "crown") return [at(halfW(EF.h2), 0.1, EF.z0 + EF.h2, "carry")];
    if (p.key === "paint") return [leg(0.3 + k, "roller")];
    return null;
  },
  metraj(sp, p, k) {
    const add = { legs: { r: 0.4e6, t: 1300 }, platform1: { r: 0.2e6, t: 900 }, floor2: { r: 0.6e6, t: 1900 }, shaft: { r: 0.4e6, t: 850 }, crown: { r: 0.1e6, t: 200 } }[p.key];
    return add ? { rivet: k * add.r, iron: k * add.t } : null;
  },
  items: (q) => [`Perçin ${thousands(q.rivet || 0)}`, `Demir ${dotted(q.iron || 0)} t`],
};

// =====================================================================
// Sidney Opera Binası (1959-1973): 580 concrete piles, the podium of folded
// beams, then Utzon's spherical solution: every rib cut from one sphere of
// 75 m radius, so 2,194 rib segments could be precast on site and lifted
// onto a steel erection arch, then post-tensioned together. 4,253 tile lids
// carry 1,056,006 Swedish tiles; glass walls close the mouths.
// =====================================================================
const SY = { x0: -1.85, x1: 1.6, y: 1.35, top: 0.38 };
const TILE = ["#f8f5ec", "#e7e1d1", "#cbc3ad"],
  RAW = ["#cfccc4", "#b3b0a8", "#97948d"],
  GRANITE = ["#d8b9a4", "#bf9e88", "#a2826e"],
  GLASS_Y = ["#4b5d78", "#5f7591"];
// [x of the base, facing (+1 to the harbour), length, height, half-width, y]
const SHELLS = [
  [-1.25, -1, 0.5, 0.85, 0.42, -0.55],
  [-0.9, 1, 1.0, 1.75, 0.55, -0.55],
  [0.05, 1, 0.8, 1.35, 0.5, -0.55],
  [0.75, 1, 0.55, 0.9, 0.4, -0.55],
  [-1.2, -1, 0.42, 0.72, 0.36, 0.62],
  [-0.9, 1, 0.85, 1.48, 0.47, 0.62],
  [-0.08, 1, 0.68, 1.15, 0.42, 0.62],
  [0.55, 1, 0.47, 0.76, 0.34, 0.62],
  [1.15, 1, 0.38, 0.55, 0.3, 0.05],
];
const quad = (a, b, c, t) => a.map((v, i) => (1 - t) ** 2 * v + 2 * (1 - t) * t * b[i] + t * t * c[i]);
function shellSVG(P, sh, built, tiles, glass, lit, detail) {
  const [xb, d, L, H, hw, y] = sh,
    z0 = SY.top;
  const Bk = [xb - d * 0.15 * L, y, z0],
    A = [xb + d * 0.95 * L, y, z0 + H],
    C = [xb - d * 0.1 * L, y, z0 + H * 0.9];
  const ridge = (s) => quad(Bk, C, A, s),
    edge = (s, side) => quad([xb + d * 0.35 * L, y + side * hw, z0], [xb + d * 0.35 * L, y + side * hw * 1.05, z0 + H * 0.65], A, s);
  const pt = (s, t, side) => {
    const r = ridge(s),
      e = edge(s, side);
    return [r[0] + (e[0] - r[0]) * t, r[1] + (e[1] - r[1]) * t, r[2] + (e[2] - r[2]) * t + 0.12 * H * t * (1 - t) * (1 - s)];
  };
  const NS = detail >= 2 ? 9 : 5,
    NT = detail >= 2 ? 4 : 2;
  const half = (side) => {
    const list = [];
    for (let i = 0; i < NS; i++) {
      if (i / NS >= built) break;
      for (let j = 0; j < NT; j++) {
        const c = cell(pt(i / NS, j / NT, side), pt((i + 1) / NS, j / NT, side), pt((i + 1) / NS, (j + 1) / NT, side), pt(i / NS, (j + 1) / NT, side));
        if (!facing(c.n)) continue;
        let e = poly(c.pts.map((p) => P(...p)), shade(P, c.n, i / NS < tiles ? TILE : RAW));
        if (detail >= 2) e += seg(P(...c.pts[0]), P(...c.pts[3]), i / NS < tiles ? "#d9d2bf" : "#8f8c86", 0.4);
        list.push({ depth: c.depth, s: e });
      }
    }
    return painted(list);
  };
  let s = half(-1);
  // The glass wall filling the shell's mouth.
  if (d > 0 && glass > 0 && built >= 1) {
    const rim = [];
    for (let i = 0; i <= 8; i++) rim.push(edge(i / 8, 1));
    for (let i = 8; i >= 0; i--) rim.push(edge(i / 8, -1));
    const zTop = z0 + H * clamp(glass);
    const clip = rim.map(([x, yy, zz]) => P(x - d * 0.04, yy, Math.min(zz, zTop)));
    s += poly(clip, lit ? mix(GLASS_Y[0], WARM, 0.75) : GLASS_Y[0], 0.95);
    if (detail >= 2) for (let f = 0.25; f < 1; f += 0.25) s += seg(P(xb + d * 0.35 * L - d * 0.04, y - hw * (1 - f) * 0.9, z0), P(A[0] - d * 0.04, y - hw * (1 - f) * 0.05, Math.min(z0 + H * f, zTop)), "#2e3a4a", 0.5);
  }
  s += half(1);
  // The steel erection arch along the ridge while the ribs go up.
  if (built > 0 && built < 1) {
    const pts = Array.from({ length: 9 }, (_, i) => P(...ridge(i / 8)));
    s += pts.slice(1).map((p, i) => seg(pts[i], p, "#c0533e", 1.6)).join("");
  }
  return s;
}
function sydneySVG(P, k, lit = false, detail = 2) {
  let s = "";
  // Harbour water round the point.
  s += poly([P(SY.x1 + 0.12, -1.9, 0.004), P(1.98, -1.9, 0.004), P(1.98, 1.9, 0.004), P(SY.x1 + 0.12, 1.9, 0.004)], "#6fa8d0", 0.85);
  if (k.piles > 0) {
    s += poly([P(SY.x0, -SY.y, 0.005), P(SY.x1, -SY.y, 0.005), P(SY.x1, SY.y, 0.005), P(SY.x0, SY.y, 0.005)], "#9c8463");
    const n = Math.floor(clamp(k.piles) * 40);
    for (let i = 0; i < n; i++) s += circle(...P(SY.x0 + 0.2 + (i % 8) * 0.44, -SY.y + 0.2 + Math.floor(i / 8) * 0.55, 0.01), 1.6, "#c9c6be");
  }
  if (k.podium > 0) {
    const t = clamp(k.podium);
    s += box(P, SY.x0, -SY.y, SY.x1, SY.y, 0, SY.top * t, t < 1 ? RAW : mixAll(RAW, GRANITE, clamp(k.stairs * 2 + 0.6)));
    if (t >= 1 && detail >= 2) for (let z = 0.1; z < SY.top; z += 0.1) s += seg(P(SY.x1 + 0.002, -SY.y, z), P(SY.x1 + 0.002, SY.y, z), "#00000022", 0.6) + seg(P(SY.x0, SY.y + 0.002, z), P(SY.x1, SY.y + 0.002, z), "#00000022", 0.6);
  }
  // Precast yard: rib segments cast on beds beside the podium.
  if (k.precast > 0 && clamp(k.shells0 + k.shells1 + k.shells2) < 1 && !k.tiles)
    for (let i = 0; i < 5 * clamp(k.precast * 2); i++) s += box(P, -1.6 + i * 0.5, 1.55, -1.25 + i * 0.5, 1.75, 0, 0.06, RAW) + box(P, -1.55 + i * 0.5, 1.6, -1.3 + i * 0.5, 1.7, 0.06, 0.12, RAW);
  // The shells, far to near, each rising as its ribs go up.
  const g = ((k.shells0 || 0) + (k.shells1 || 0) + (k.shells2 || 0)) / 3;
  if (k.podium >= 1) {
    const order = SHELLS.map((sh, i) => [sh, i]).sort((a, b) => a[0][0] + a[0][5] - (b[0][0] + b[0][5]));
    for (const [sh, i] of order) {
      const built = clamp(g * SHELLS.length - i);
      if (built <= 0) continue;
      s += shellSVG(P, sh, built, clamp(k.tiles * 1.15), clamp(k.glass), lit, detail);
    }
  }
  return s;
}
const SYDNEY_DONE = { piles: 1, podium: 1, precast: 1, shells0: 1, shells1: 1, shells2: 1, tiles: 1, glass: 1, stairs: 1, done: true };
export const SYDNEY = {
  system: "shells",
  ridge: 0.6,
  spec: () => ({ hw: 2, h: SY.top + 1.75 - 0.3, floors: 2, wall: { faces: TILE, grain: "#cbc3ad", pattern: "sydney" }, roof: TILE }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "piles", label: "Kazıklar: 580 beton kazık", w: 0.9, cost: 4, pour: true },
    { key: "podium", label: "Podyum (1959-63): katlanmış plak kirişler", w: 1.3, cost: 5, pour: true },
    { key: "precast", label: "Küresel çözüm: nervürler sahada prekast dökülüyor", w: 0.8, cost: 3, pour: true, inspect: "nervür kalıpları: hepsi 75 m yarıçaplı tek küreden", next: "kabuklar kurulabilir" },
    { key: "shells", floor: 0, label: "Kabuklar 1/3: çelik kurulum kemeri, nervür parçaları vinçle", w: 1.2, cost: 6, lift: true, liftAs: "rib" },
    { key: "shells", floor: 1, label: "Kabuklar 2/3: parçalar ard germe kablolarıyla birleşiyor", w: 1.2, cost: 6, lift: true, liftAs: "rib" },
    { key: "shells", floor: 2, label: "Kabuklar 3/3: 2.194 parça tamam", w: 1.2, cost: 6, lift: true, liftAs: "rib", inspect: "ard germe ve kabuk birleşimleri", next: "karo kapakları takılabilir" },
  ],
  frameEnd: 0.7,
  later: [
    { key: "tiles", label: "Karo kapakları: 4.253 panel, 1.056.006 İsveç karosu", a: 0.7, b: 0.8, cost: 5 },
    { key: "glass", label: "Cam duvarlar", a: 0.8, b: 0.88, cost: 4 },
    { key: "stairs", label: "Anıtsal merdiven, granit kaplama ve salonlar", a: 0.88, b: 0.93, cost: 2 },
    { key: "handover", label: "Açılış: 20 Ekim 1973", a: 0.93, b: 1, cost: 2 },
  ],
  garden: false,
  live: true,
  scene: (P, sp, plan, shown, lit) => sydneySVG(P, progress(plan, shown), lit, 2),
  shadow: (P, sp, t) => castShadow(P, rectOutline(SY.x0, -SY.y, SY.x1, SY.y), 0.8 * t + 0.1),
  shadowFrom: "podium",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(SY.x0, -SY.y, SY.x1, SY.y), 0.9) : "";
    return s + sydneySVG(P, SYDNEY_DONE, lit, detail);
  },
  snow: () => "",
  workHeight(sp, p, k) {
    if (p.key === "shells") return SY.top + 1.2 * k;
    return null;
  },
  crew(sp, p, k) {
    if (p.key === "piles") return [at(-1.2 + 2.4 * k, 0.6, 0, "bar"), at(0.4, -0.6, 0, "shovel")];
    if (p.key === "podium") return [at(-1.0 + 2 * k, 0.7, SY.top, "hose"), at(0.6, -0.4, SY.top, "trowel")];
    if (p.key === "precast") return [at(-1.2 + 2 * k, 1.65, 0.12, "trowel"), at(0.2, 1.5, 0, "carry")];
    if (p.key === "shells") return [at(0.3, 0.2, SY.top, "bar"), at(-0.4, 1.1, SY.top, "carry")];
    if (p.key === "tiles") return [at(0.2, 0.9, SY.top + 0.4, "hammer")];
    if (p.key === "glass") return [at(1.3, 0.6, SY.top, "carry")];
    return null;
  },
  metraj(sp, p, k) {
    if (p.key === "shells") return { ribs: (k * 2194) / 3 };
    if (p.key === "tiles") return { tiles: k * 1056006 };
    return null;
  },
  items: (q) => [`Nervür ${dotted(Math.floor((q.ribs || 0) + 1e-6))}/2.194`, `Karo ${thousands(q.tiles || 0)}`],
};

// =====================================================================
// Burj Khalifa (2004-2010): 192 bored piles under a 3.7 m raft poured at
// night with iced water, then a Y-shaped buttressed core climbing on
// self-climbing formwork, the three wings stepping back in a spiral, the
// concrete pumped to 600 m. The spire was assembled inside and jacked
// up; 26,000 glass panels clad it. 828 m, opened 4 January 2010.
// =====================================================================
const BK = { z0: 0.3, core: 0.24, w: 0.2, L0: 0.82, dL: 0.07, first: 0.6, step: 0.5, top: 5.3, crown: 5.8, spire: 6.6 };
const SILVER = ["#dbe6f0", "#a9bccf", "#7d93aa"],
  BCONC = ["#cfccc4", "#b3b0a8", "#97948d"];
const WINGS = [Math.PI / 6, (5 * Math.PI) / 6, (3 * Math.PI) / 2];
const wingLen = (i, z) => BK.L0 - BK.dL * Math.max(0, Math.floor((z - BK.z0 - BK.first) / BK.step - i / 3 + 1));
const wingTop = (i) => {
  // The height at which the wing has stepped back into the core.
  let z = BK.z0;
  while (z < BK.top && wingLen(i, z + 1e-6) > BK.core + 0.12) z += 0.02;
  return Math.min(BK.top, z);
};
const WING_TOPS = WINGS.map((_, i) => wingTop(i));
const hexPts = (r) => Array.from({ length: 6 }, (_, i) => [r * Math.cos((i / 6) * Math.PI * 2 + Math.PI / 6), r * Math.sin((i / 6) * Math.PI * 2 + Math.PI / 6)]);
const wingPts = (th, L) => {
  const u = [Math.cos(th), Math.sin(th)],
    v = [-Math.sin(th), Math.cos(th)],
    p = (a, b) => [u[0] * a + v[0] * b, u[1] * a + v[1] * b];
  return [p(0, -BK.w), p(L, -BK.w), p(L + 0.09, 0), p(L, BK.w), p(0, BK.w)];
};
function burjSVG(P, k, lit = false, detail = 2) {
  let s = "";
  // Piles and raft.
  if (k.piles > 0) {
    s += poly(hexPts(1.45).map(([x, y]) => P(x, y, 0.005)), "#9c8463");
    for (let i = 0; i < Math.floor(clamp(k.piles) * 30); i++) {
      const a = i * 2.39996,
        r = 0.25 + 1.05 * Math.sqrt(i / 30);
      s += circle(...P(r * Math.cos(a), r * Math.sin(a), 0.01), 1.7, "#c9c6be");
    }
  }
  if (k.raftRebar > 0 && !(k.raft >= 1)) for (let x = -1.1; x <= 1.1; x += 0.14) s += seg(P(x, -1.1, 0.04), P(x, 1.1, 0.04), "#7a4a2a", 0.6) + seg(P(-1.1, x, 0.04), P(1.1, x, 0.04), "#7a4a2a", 0.6);
  if (k.raft > 0) s += prism(P, hexPts(1.3), 0, BK.z0 * clamp(k.raft), k.raft < 1 ? ["#8e9298", "#7a7e85", "#676b71"] : BCONC);
  // Core and wings, segment by segment from the bottom; glass up to the
  // cladding line, bare concrete above it.
  const core = (clamp(k.core0) + clamp(k.core1) + clamp(k.core2) + clamp(k.core3)) / 4,
    hc = BK.z0 + (BK.top - BK.z0) * core,
    hw = Math.max(BK.z0, hc - 0.25),
    clad = BK.z0 + (BK.top - BK.z0) * clamp(k.cladding);
  const cuts = new Set([BK.z0, hc, hw, clad, BK.top]);
  WINGS.forEach((_, i) => {
    for (let z = BK.z0 + BK.first + (i / 3) * BK.step; z < BK.top; z += BK.step) cuts.add(z);
  });
  const levels = [...cuts].filter((z) => z >= BK.z0 && z <= hc + 1e-9).sort((a, b) => a - b);
  for (let j = 0; j < levels.length - 1; j++) {
    const za = levels[j],
      zb = levels[j + 1];
    if (zb - za < 1e-6) continue;
    const faces = za >= clad - 1e-9 ? BCONC : lit ? mixAll(SILVER, ["#f3dca0", "#d8bd7a", "#b49a5c"], 0.25) : SILVER;
    const list = [{ depth: 0, s: prism(P, hexPts(BK.core), za, zb, faces, { lines: detail >= 2 ? 0.09 : 0, line: "#5f708533" }) }];
    if (zb <= hw + 1e-9)
      WINGS.forEach((th, i) => {
        const L = wingLen(i, za + 1e-6);
        if (za >= WING_TOPS[i] - 1e-9 || L <= BK.core + 0.12) return;
        list.push({ depth: (L / 2) * (Math.cos(th) + Math.sin(th)), s: prism(P, wingPts(th, L), za, zb, faces, { lines: detail >= 2 ? 0.09 : 0, line: "#5f708533" }) });
      });
    s += painted(list);
  }
  // Self-climbing formwork at the top of the core.
  if (core > 0 && core < 1) s += prism(P, hexPts(BK.core + 0.06), hc, hc + 0.14, ["#6b7078", "#565b63", "#43474e"]);
  // Crown and the spire, jacked up from inside.
  if (core >= 1) {
    s += lathe(P, 0, 0, [[BK.core * 0.95, BK.top], [0.1, BK.crown]], k.cladding >= 1 ? SILVER : BCONC, { n: 12 });
    const sp = clamp(k.spire);
    if (sp > 0) {
      const tip = BK.crown + (BK.spire - BK.crown) * sp;
      s += lathe(P, 0, 0, [[0.09, BK.crown - 0.2], [0.012, tip]], ["#d9dee4", "#aab3bd", "#7f8894"], { n: 8 });
      if (lit) s += circle(...P(0, 0, tip), 2.5, "#ff6a5a");
    }
  }
  return s;
}
const BURJ_DONE = { piles: 1, raftRebar: 1, raft: 1, core0: 1, core1: 1, core2: 1, core3: 1, spire: 1, cladding: 1, lights: 1 };
export const BURJ = {
  system: "supertall",
  ridge: BK.spire - 3.3,
  spec: () => ({ hw: 1.45, h: 3.0, floors: 12, wall: { faces: SILVER, grain: "#8798ab", pattern: "burj" }, roof: SILVER }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "piles", label: "Fore kazıklar: 192 adet, 1,5 m çap, 50 m derin", w: 1.1, cost: 5, pour: true },
    { key: "raftRebar", label: "Radye donatısı", w: 0.8, cost: 4, lift: true, liftAs: "footRebar", inspect: "radye donatısı ve kazık başları", next: "beton dökülebilir" },
    { key: "raft", label: "Radye: 3,7 m kalın; gece, buzlu suyla dökülüyor", w: 1, cost: 5, pour: true },
    { key: "core", floor: 0, label: "Gövde 1/4: tırmanır kalıp, Y planlı payandalı çekirdek", w: 1.3, cost: 6, pour: true, lift: true, liftAs: "colRebar" },
    { key: "core", floor: 1, label: "Gövde 2/4: kanatlar sarmal kademelerle geri çekiliyor", w: 1.3, cost: 6, pour: true, lift: true, liftAs: "colRebar" },
    { key: "core", floor: 2, label: "Gövde 3/4: beton 600 m'ye pompalanıyor", w: 1.3, cost: 6, pour: true, lift: true, liftAs: "colRebar" },
    { key: "core", floor: 3, label: "Gövde 4/4: kanatlar bitiyor, çekirdek yükseliyor", w: 1.3, cost: 6, pour: true, lift: true, liftAs: "colRebar", inspect: "çekirdek düşeyliği GPS ile ölçüldü", next: "sivri uca geçilebilir" },
    { key: "spire", label: "Sivri uç: içeride kurulup krikoyla yukarı itiliyor", w: 0.9, cost: 4, inspect: "tepe 828 m", next: "cephe tamamlanabilir" },
  ],
  frameEnd: 0.7,
  later: [
    { key: "cladding", label: "Cephe: 26.000 cam panel", a: 0.7, b: 0.84, cost: 6 },
    { key: "lights", label: "Işıklar ve asansörler", a: 0.84, b: 0.92, cost: 3 },
    { key: "handover", label: "Açılış: 4 Ocak 2010", a: 0.92, b: 1, cost: 2 },
  ],
  live: true,
  scene: (P, sp, plan, shown, lit) => burjSVG(P, progress(plan, shown), lit, 2),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-0.6, -0.6, 0.6, 0.6), 2.2 * t + 0.1),
  shadowFrom: "core",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(-0.6, -0.6, 0.6, 0.6), 2.2) : "";
    return s + burjSVG(P, BURJ_DONE, lit, detail);
  },
  snow: () => "",
  workHeight(sp, p, k) {
    if (p.key === "core") return BK.z0 + ((BK.top - BK.z0) * (p.floor + k)) / 4;
    if (p.key === "raftRebar") return BK.z0;
    return null;
  },
  crew(sp, p, k) {
    if (p.key === "piles") return [at(0.8, 0.5, 0, "bar"), at(-0.4, 0.9, 0, "shovel")];
    if (p.key === "raftRebar") return [at(0.5, 0.3, 0.05, "tie"), at(-0.3, 0.6, 0.05, "tie")];
    if (p.key === "raft") return [at(0.6, 0.4, BK.z0 * k, "hose"), at(-0.2, 0.8, BK.z0 * k, "trowel")];
    if (p.key === "core") {
      const z = BK.z0 + ((BK.top - BK.z0) * (p.floor + k)) / 4;
      return [at(0.2, 0.25, z, "hose"), at(0.35, -0.1, z, "tie")];
    }
    return null;
  },
  metraj(sp, p, k) {
    const add = { piles: { c: 17000 }, raft: { c: 12500 }, core: { c: 75125, h: 148.5 }, spire: { h: 234 } }[p.key];
    return add ? { conc: k * (add.c || 0), height: k * (add.h || 0) } : null;
  },
  items: (q) => [`Yükseklik ${Math.round(q.height || 0)} m`, `Beton ${thousands(q.conc || 0)} m³`],
};

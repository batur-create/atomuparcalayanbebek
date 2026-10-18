// Three buildings built the old way (n37): a stone arch bridge over a
// stream, a Black Sea serender (a granary raised on posts with mouse stones),
// and Harran's corbelled mud-brick beehive houses. Each is drawn from its own
// geometry and goes up in the order a usta would build it; src/special.js
// wires them into the site, the crew, the crane and the quantities.
import { GLASS, LIT, STONE, WOOD, box, circle, ellipse, faceX, faceY, poly, rng, seg } from "./iso.js";

const clamp = (v) => Math.max(0, Math.min(1, v));
const M = 1.6,
  V = M * M * M;
const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};
const mixAll = (a, b, t) => a.map((c, i) => mix(c, b[i], t));
const WET = ["#8e9298", "#7a7e85", "#676b71"],
  CONCRETE = ["#cdcac2", "#b2afa7", "#99968f"],
  PLY = ["#e6c383", "#cfa56a", "#b98e55"],
  REBAR = "#8a4b33",
  WATER = "#7db7d8",
  MUD = "#9c8463";
// A face's shade from its outward normal, lit from the upper left on screen.
const LIGHT = [0.2, 0.6, 0.8].map((v) => v / Math.hypot(0.2, 0.6, 0.8));
function shade(P, n, faces) {
  const m = P.mirror ? [n[1], n[0], n[2]] : n;
  const t = clamp((m[0] * LIGHT[0] + m[1] * LIGHT[1] + m[2] * LIGHT[2]) / 0.8);
  return t > 0.5 ? mix(faces[1], faces[0], (t - 0.5) * 2) : mix(faces[2], faces[1], t * 2);
}
const facing = (n) => n[0] + n[1] + n[2] > 0;
const progress = (plan, shown) => {
  const k = {};
  for (const p of plan) k[p.floor >= 0 ? `${p.key}${p.floor}` : p.key] = clamp((shown - p.a) / (p.b - p.a));
  return k;
};
// A shadow: the outline of the footprint and its copy thrown to the right.
function castShadow(P, outline, length) {
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
const rectOutline = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// A worker's tuple for the crew layer: [x, y, z, tool].
const at = (x, y, z, tool) => [x, y, z, tool];

// =====================================================================
// Taş kemer köprü: a semicircular arch of cut-stone voussoirs over a
// stream, on two abutments with concrete footings, spandrel walls, a
// rubble fill with drainage, cobbled deck and parapets with copings.
// =====================================================================
const B = { L: 2.2, W: 0.7, Ri: 1.25, ring: 0.3, zs: 0.8, deck: 2.5, ends: 1.55, rail: 0.45, ramp: 0.75, n: 17 };
B.Re = B.Ri + B.ring;
// A humped (eşek sırtı) deck: highest over the keystone, falling to both ends.
B.slope = (B.deck - B.ends) / B.L;
const deckZ = (x) => B.deck - B.slope * Math.abs(x);
const ASHLAR = ["#e9dfcc", "#d3c6ae", "#b8aa91"],
  ARCH = ["#efe6d4", "#d9ccb3", "#bfb196"],
  JOINT = "#a39680";
// Where the extrados is at height z (half width of the hole in a course).
const extrados = (z) => (z < B.zs ? B.Ri : z < B.zs + B.Re ? Math.sqrt(B.Re * B.Re - (z - B.zs) ** 2) : 0);
// Voussoirs in the order they are set: from both springings alternately up
// to the crown; the keystone (the middle one) goes in last.
const VOUSSOIR_ORDER = (() => {
  const list = [];
  for (let i = 0; i < (B.n - 1) / 2; i++) list.push(i, B.n - 1 - i);
  return list;
})();
function streamSVG(P, dry = 0, reach = 3.3, time = 0) {
  let s = poly([P(-1.15, -reach, 0.004), P(1.15, -reach, 0.004), P(1.15, reach, 0.004), P(-1.15, reach, 0.004)], "#b59c76");
  s += poly([P(-0.9, -reach, 0.006), P(0.9, -reach, 0.006), P(0.9, reach, 0.006), P(-0.9, reach, 0.006)], dry >= 1 ? MUD : mix(WATER, MUD, dry));
  if (dry < 0.6)
    for (let i = 0; i < 7; i++) {
      const y = -reach + 0.5 + ((i * 0.93 + time * 0.25) % (2 * reach - 1));
      s += seg(P(-0.5 + (i % 3) * 0.25, y, 0.008), P(-0.2 + (i % 3) * 0.25, y + 0.25, 0.008), "#e4f2fa", 1, 0.8 * (1 - dry));
    }
  // Pebbles along both banks.
  for (let i = 0; i < 9; i++) {
    const y = -reach + 0.35 + i * ((2 * reach - 0.7) / 8);
    for (const x of [-1.02, 1.02]) {
      const [cx, cy] = P(x, y + (x > 0 ? 0.2 : 0), 0.01);
      s += ellipse(cx, cy, 2.4, 1.4, i % 2 ? "#c9bca4" : "#a99c86");
    }
  }
  return s;
}
// Courses of the abutments and spandrels on the front face up to `top`,
// leaving the arch opening (and the extrados) clear.
function bridgeCourses(P, top, faces = ASHLAR, y = B.W) {
  let s = "";
  const step = 0.28,
    front = shade(P, [0, 1, 0], faces);
  // One stretch of a course on the front face, its top cut by the deck's slope.
  const piece = (a, b, z0, z1) => {
    const out = (x) => Math.min(z1, deckZ(x));
    const xe = (B.deck - z0) / B.slope; // where the deck meets this course's bed
    const [p, q] = a < 0 ? [Math.max(a, -xe), b] : [a, Math.min(b, xe)];
    if (q - p < 0.02) return "";
    const xc = (B.deck - z1) / B.slope,
      pts = [P(p, y, z0), P(q, y, z0), P(q, y, out(q))];
    if (xc > Math.min(Math.abs(p), Math.abs(q)) && xc < Math.max(Math.abs(p), Math.abs(q))) pts.push(P(Math.sign(p + q) * xc, y, z1));
    pts.push(P(p, y, out(p)));
    let s = poly(pts, front);
    for (let u = p + 0.22; u < q - 0.08; u += 0.42) if (deckZ(u) > z0 + 0.04) s += seg(P(u, y + 0.003, z0), P(u, y + 0.003, Math.min(z1, deckZ(u))), JOINT, 0.5, 0.7);
    if (z1 < top - 1e-6) s += seg(P(p, y + 0.003, z1), P(q, y + 0.003, z1), JOINT, 0.6, 0.8);
    return s;
  };
  for (let z0 = 0; z0 < top - 0.001; z0 += step) {
    const z1 = Math.min(top, z0 + step),
      hole = Math.max(extrados(z0), extrados(z1)) * (z0 < B.zs ? 1 : 0.985);
    for (const [a, b] of hole > 0 ? [[-B.L, -hole], [hole, B.L]] : [[-B.L, 0], [0, B.L]]) s += piece(a, b, z0, z1);
  }
  return s;
}
// A voussoir's extrados (drawn under the spandrels) and its front face.
const vPoint = (P, r, a, y) => P(r * Math.cos(a), y, B.zs + r * Math.sin(a));
const vAngles = (i) => [Math.PI - (i * Math.PI) / B.n, Math.PI - ((i + 1) * Math.PI) / B.n];
function voussoirTop(P, i, faces = ARCH) {
  const [a0, a1] = vAngles(i),
    am = (a0 + a1) / 2,
    out = [Math.cos(am), 0, Math.sin(am)];
  return facing(out) ? poly([vPoint(P, B.Re, a0, -B.W), vPoint(P, B.Re, a1, -B.W), vPoint(P, B.Re, a1, B.W), vPoint(P, B.Re, a0, B.W)], shade(P, out, faces)) : "";
}
function voussoirSVG(P, i, faces = ARCH) {
  const [a0, a1] = vAngles(i),
    key = i === (B.n - 1) / 2,
    r1 = key ? B.Re + 0.06 : B.Re,
    y = B.W + (key ? 0.04 : 0);
  return poly([vPoint(P, B.Ri, a0, y), vPoint(P, r1, a0, y), vPoint(P, r1, a1, y), vPoint(P, B.Ri, a1, y)], key ? faces[0] : shade(P, [0, 1, 0], faces)) + seg(vPoint(P, B.Ri, a1, B.W + 0.004), vPoint(P, r1, a1, B.W + 0.004), JOINT, 0.7);
}
// The arch's underside seen through the opening, and the abutment's inner face.
function soffitSVG(P, faces = ARCH, lagging = false) {
  let s = poly(faceX(P, -B.Ri, -B.W, B.W, 0, B.zs), shade(P, [1, 0, 0], ASHLAR));
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI - (i * Math.PI) / n,
      a1 = Math.PI - ((i + 1) * Math.PI) / n,
      am = (a0 + a1) / 2,
      inward = [-Math.cos(am), 0, -Math.sin(am)];
    if (!facing(inward) && !lagging) continue;
    const pt = (a, y) => P(B.Ri * Math.cos(a), y, B.zs + B.Ri * Math.sin(a));
    s += poly([pt(a0, -B.W), pt(a1, -B.W), pt(a1, B.W), pt(a0, B.W)], lagging ? (i % 2 ? PLY[1] : PLY[2]) : mix(shade(P, inward, faces), "#7d7466", 0.35));
  }
  return s;
}
// Timber centering: posts on sole plates in the stream bed, two arched ribs
// with radial braces, and the lagging boards the voussoirs are set on.
function centeringSVG(P, t, struck = 0) {
  if (t <= 0 || struck >= 1) return "";
  const drop = struck * 0.15; // folding wedges eased first, so the arch takes its load
  let s = "";
  const posts = [-0.9, -0.3, 0.3, 0.9];
  for (const y of [-B.W + 0.08, B.W - 0.08]) {
    for (const x of posts.slice(0, Math.ceil(clamp(t / 0.3) * posts.length))) {
      const top = B.zs + Math.sqrt(B.Ri * B.Ri - x * x) - 0.08 - drop;
      s += box(P, x - 0.05, y - 0.05, x + 0.05, y + 0.05, 0, top, ["#d9b47e", "#c29862", "#a8804c"]);
    }
    if (t > 0.3) {
      const n = 14,
        reach = Math.ceil(clamp((t - 0.3) / 0.35) * n);
      for (let i = 0; i < reach; i++) {
        const a0 = Math.PI - (i * Math.PI) / n,
          a1 = Math.PI - ((i + 1) * Math.PI) / n,
          r = B.Ri - 0.06;
        s += seg(P(r * Math.cos(a0), y, B.zs + r * Math.sin(a0) - drop), P(r * Math.cos(a1), y, B.zs + r * Math.sin(a1) - drop), "#a8793f", 2);
        s += seg(P(r * 0.55 * Math.cos(a0), y, B.zs + r * 0.4 * Math.sin(a0) - drop), P(r * Math.cos(a0), y, B.zs + r * Math.sin(a0) - drop), "#b98d58", 0.9);
      }
    }
  }
  if (t > 0.65) s += soffitSVG(P, ARCH, true).replace(/^.*?\/>/, "");
  return s;
}
function bridgePits(P, dig, foot) {
  let s = "";
  const d = 0.35 * dig;
  for (const [x0, x1] of [[-B.L - 0.1, -B.Ri + 0.1], [B.Ri - 0.1, B.L + 0.1]]) {
    const y0 = -B.W - 0.15,
      y1 = B.W + 0.15;
    if (dig > 0 && foot < 1) {
      s += poly([P(x0, y0, 0.01), P(x1, y0, 0.01), P(x1, y1, 0.01), P(x0, y1, 0.01)], "#7d6142");
      s += poly([P(x0, y0, -d), P(x1, y0, -d), P(x1, y1, -d), P(x0, y1, -d)], "#94744f");
      s += poly([P(x0, y0, 0), P(x0, y1, 0), P(x0, y1, -d), P(x0, y0, -d)], "#8a6a48") + poly([P(x0, y0, 0), P(x1, y0, 0), P(x1, y0, -d), P(x0, y0, -d)], "#735737");
    }
    if (foot > 0) {
      const level = -0.35 + 0.35 * clamp(foot / 0.8);
      s += box(P, x0 + 0.05, y0 + 0.05, x1 - 0.05, y1 - 0.05, -0.35, Math.min(0.02, level), mixAll(WET, CONCRETE, clamp((foot - 0.8) / 0.2)));
    }
  }
  return s;
}
function lampSVG(P, x, lit) {
  const y = B.W - 0.08,
    z = deckZ(x) + B.rail + 0.07;
  const [cx, cy] = P(x, y, z + 0.62);
  return seg(P(x, y, z), P(x, y, z + 0.55), "#3c4146", 1.4) + circle(cx, cy, 3, lit ? LIT : "#e8e2d6") + poly([[cx - 3, cy - 2.6], [cx + 3, cy - 2.6], [cx, cy - 5.5]], "#3c4146");
}
// A strip along the deck from x0 to x1 (split at the crown), lifted by dz,
// between y0 and y1: the fill, the cobbles, a parapet's coping.
function deckStrip(P, x0, x1, y0, y1, dz, fill) {
  let s = "";
  for (const [a, b] of [[x0, Math.min(x1, 0)], [Math.max(x0, 0), x1]]) if (b > a) s += poly([P(a, y0, deckZ(a) + dz), P(b, y0, deckZ(b) + dz), P(b, y1, deckZ(b) + dz), P(a, y1, deckZ(a) + dz)], fill);
  return s;
}
// The face of a parapet at y, from x0 to x1, standing `h` on the deck.
function parapetFace(P, x0, x1, y, h, fill, base = 0) {
  let s = "";
  for (const [a, b] of [[x0, Math.min(x1, 0)], [Math.max(x0, 0), x1]]) if (b > a) s += poly([P(a, y, deckZ(a) + base), P(b, y, deckZ(b) + base), P(b, y, deckZ(b) + h), P(a, y, deckZ(a) + h)], fill);
  return s;
}
/** The bridge at each stage; `k` holds every phase's progress. */
function bridgeSVG(P, k, lit = false, time = 0, detail = 2, reach = 3.3) {
  const dry = clamp(k.divert) * (1 - clamp(k.water));
  let s = streamSVG(P, dry, reach, time);
  // Cofferdam: a sandbag wall across the stream upstream.
  const bags = Math.ceil(clamp(k.divert / 0.6) * 12 * (1 - clamp(k.water)));
  for (let i = 0; i < bags; i++) {
    const x = -1.05 + (i % 6) * 0.36,
      z = Math.floor(i / 6) * 0.12;
    s += box(P, x, -2.75, x + 0.34, -2.5, z, z + 0.12, ["#d9c99e", "#c4b386", "#ab9a6e"]);
  }
  s += bridgePits(P, k.abutDig, k.abutFoot);
  const abut = B.zs * clamp(k.abutWall);
  if (abut > 0) s += poly(faceX(P, -B.Ri, -B.W, B.W, 0, abut), shade(P, [1, 0, 0], ASHLAR));
  const placed = Math.round(clamp(k.voussoir) * (B.n - 1)) + (k.keystone >= 0.6 ? 1 : 0);
  const struck = clamp(k.strike);
  // The arch's underside once its voussoirs are in, then the centering under it.
  if (placed >= B.n && struck > 0.3) s += soffitSVG(P);
  s += centeringSVG(P, clamp(k.centering), struck);
  const set = [...VOUSSOIR_ORDER.slice(0, Math.min(placed, B.n - 1)), ...(placed >= B.n ? [(B.n - 1) / 2] : [])].sort((a, b) => Math.abs(b - 8) - Math.abs(a - 8));
  for (const i of set) s += voussoirTop(P, i);
  // Spandrels and the end of the bridge go up course by course, under the
  // deck's slope: high over the crown, low at the ends.
  const wall = abut + (B.deck - B.zs) * clamp(k.spandrel);
  const end = Math.min(wall, B.ends);
  if (end > 0) s += poly(faceX(P, B.L, -B.W, B.W, 0, end), shade(P, [1, 0, 0], ASHLAR));
  s += bridgeCourses(P, wall);
  for (const i of set) s += voussoirSVG(P, i);
  // Rubble fill and drainage layer, then the cobbled deck.
  if (k.fill > 0) {
    const to = -B.L + 2 * B.L * clamp(k.fill);
    s += deckStrip(P, -B.L, to, -B.W, B.W, 0, "#b9ab93");
    for (let i = 0; i < 14 * clamp(k.fill); i++) {
      const x = -B.L + 0.2 + i * 0.3,
        [cx, cy] = P(x, ((i * 37) % 9) / 9 - 0.45, deckZ(x));
      s += circle(cx, cy, 1.2, "#9a8e78");
    }
  }
  if (k.paving > 0) {
    const to = -B.L + 2 * B.L * clamp(k.paving);
    s += deckStrip(P, -B.L, to, -B.W, B.W, 0.01, "#cfc4b0");
    if (detail >= 2) for (let x = -B.L + 0.25; x < to; x += 0.25) s += seg(P(x, -B.W, deckZ(x) + 0.012), P(x, B.W, deckZ(x) + 0.012), "#b3a78f", 0.6);
  }
  // Parapets with their coping (harpuşta), then the lamps at the crown.
  if (k.parapet > 0) {
    const to = -B.L + 2 * B.L * clamp(k.parapet),
      h = B.rail,
      inner = shade(P, [0, 1, 0], ASHLAR);
    for (const [face, y0, y1] of [[-B.W + 0.16, -B.W - 0.03, -B.W + 0.19], [B.W, B.W - 0.19, B.W + 0.03]])
      s += parapetFace(P, -B.L, to, face, h, inner) + parapetFace(P, -B.L, to, y1, h + 0.07, ARCH[1], h) + deckStrip(P, -B.L, to, y0, y1, h + 0.07, ARCH[0]);
    if (detail >= 2)
      for (const [a, b] of [[-B.L, Math.min(to, 0)], [0, Math.min(to, B.L)]])
        for (let x = a + 0.3; x < b; x += 0.38) s += seg(P(x, B.W + 0.003, deckZ(x)), P(x, B.W + 0.003, deckZ(x) + h), JOINT, 0.5, 0.7);
    if (to >= B.L) s += poly(faceX(P, B.L, -B.W, B.W, B.ends, B.ends + h), shade(P, [1, 0, 0], ASHLAR));
    if (k.parapet >= 1) s += lampSVG(P, -0.35, lit) + lampSVG(P, 0.35, lit);
  }
  // Ramps down to the road at both ends, once the deck is paved.
  if (k.paving >= 1)
    for (const [x0, x1, z0, z1] of [[-B.L - B.ramp, -B.L, 0.02, B.ends], [B.L, B.L + B.ramp, B.ends, 0.02]]) {
      s += poly([P(x0, -B.W, z0), P(x1, -B.W, z1), P(x1, B.W, z1), P(x0, B.W, z0)], "#cfc4b0");
      s += poly([P(x0, B.W, 0), P(x1, B.W, 0), P(x1, B.W, z1), P(x0, B.W, z0)], shade(P, [0, 1, 0], ASHLAR));
    }
  return s;
}
const BRIDGE_DONE = { divert: 1, abutDig: 1, abutFoot: 1, abutWall: 1, centering: 1, voussoir: 1, keystone: 1, spandrel: 1, fill: 1, strike: 1, paving: 1, parapet: 1, water: 1 };
export const ARCH_BRIDGE = {
  system: "arch",
  ridge: B.rail + 0.1,
  spec: () => ({ hw: B.L, h: B.deck - 0.3, floors: 1, wall: { faces: ASHLAR, grain: JOINT, pattern: "arch" }, roof: ARCH }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "divert", label: "Batardo: kum torbalarıyla dere yatağı kurutuluyor", w: 0.9, cost: 2 },
    { key: "abutDig", label: "Ayak temelleri: kazı", w: 0.8, cost: 2 },
    { key: "abutFoot", label: "Ayak temelleri: donatı ve beton", w: 1, cost: 4, pour: true },
    { key: "abutWall", label: "Kesme taş ayaklar: üzengi taşına kadar", w: 1.2, cost: 5, lift: true, liftAs: "wallLay", stock: "stone" },
    { key: "centering", label: "Ahşap kemer iskelesi (merkez kalıbı)", w: 1, cost: 3, lift: true, liftAs: "roofFrame" },
    { key: "voussoir", label: "Kemer taşları: iki üzengiden simetrik", w: 1.6, cost: 7, lift: true, liftAs: "wallLay", stock: "stone" },
    { key: "keystone", label: "Kilit taşı", w: 0.5, cost: 2, lift: true, liftAs: "wallLay", inspect: "kemer taşları, derzler ve kilit taşı", next: "omuz duvarlarına geçilebilir" },
    { key: "spandrel", label: "Omuz duvarları: kesme taş", w: 1.3, cost: 6, lift: true, liftAs: "wallLay", stock: "stone" },
    { key: "fill", label: "Dolgu: kırma taş, drenaj ve su yalıtımı", w: 0.8, cost: 3 },
    { key: "strike", label: "Kemer iskelesi söküm: kemer kendini taşıyor", w: 0.6, cost: 1 },
  ],
  frameEnd: 0.72,
  later: [
    { key: "paving", label: "Kaldırım taşı döşeme", a: 0.72, b: 0.8, cost: 4 },
    { key: "parapet", label: "Korkuluk duvarı ve harpuşta taşları", a: 0.8, b: 0.88, cost: 4, lift: true, liftAs: "wallLay" },
    { key: "water", label: "Batardo söküm: dere yatağına dönüyor", a: 0.88, b: 0.93, cost: 1 },
    { key: "handover", label: "Fenerler ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  liftUntil: 0.88,
  craneEnd: 0.88,
  garden: false,
  live: true,
  scene: (P, sp, plan, shown, lit, time = 0) => bridgeSVG(P, progress(plan, shown), lit, time),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-B.L, -B.W, B.L, B.W), B.deck * 0.5 * t + 0.2),
  shadowFrom: "spandrel",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    let s = detail ? castShadow(shadowP, rectOutline(-B.L, -B.W, B.L, B.W), B.deck * 0.5 + 0.2) : "";
    s += bridgeSVG(P, BRIDGE_DONE, lit, 0, detail, 2.4);
    if (detail < 2) return s;
    // Reeds on the banks.
    const r = rng(seed + 3);
    for (let i = 0; i < 6; i++) {
      const [x, y] = [i % 2 ? 1.2 : -1.2, -2 + r() * 4];
      const [cx, cy] = P(x, y, 0);
      s += seg([cx, cy], [cx - 1.5, cy - 9], "#5e9b4c", 1.1) + seg([cx + 1, cy], [cx + 2, cy - 7], "#73b05c", 1.1);
    }
    return s;
  },
  snow: (P) => deckStrip(P, -B.L, B.L, -B.W + 0.16, B.W - 0.16, 0.02, "#f4f7fa") + deckStrip(P, -B.L, B.L, -B.W - 0.03, -B.W + 0.19, B.rail + 0.02, "#f4f7fa") + deckStrip(P, -B.L, B.L, B.W - 0.19, B.W + 0.03, B.rail + 0.02, "#f4f7fa"),
  workHeight(sp, p, k) {
    if (p.key === "voussoir") return B.zs + B.Re * Math.sin((Math.PI / 2) * k);
    if (p.key === "keystone") return B.zs + B.Re;
    if (p.key === "centering") return B.zs + B.Ri;
    if (p.key === "spandrel") return Math.min(B.zs + (B.deck - B.zs) * k, deckZ(1.6)) + 0.2;
    if (p.key === "abutWall") return B.zs * k + 0.3;
    if (p.key === "parapet") return B.deck + 0.3;
    return null;
  },
  chute: () => [B.Ri + 0.4, -B.W - 0.1, 0.1],
  crew(sp, p, k) {
    const front = B.W + 0.35;
    const list = {
      divert: [at(-0.6 + 0.8 * k, -2.95, 0, "carry"), at(0.9, -2.3, 0, "shovel")],
      abutDig: [at(-1.7, front, -0.3 * k, "shovel"), at(1.7, front, -0.3 * k, "shovel")],
      abutFoot: [at(-1.7, front, 0, "tie"), at(1.7, front, 0, "hose")],
      abutWall: [at(-1.7, front, 0, "trowel"), at(1.7, front, 0, "trowel")],
      centering: [at(-0.6, front, 0, "hammer"), at(0.6, front, 0, "carry")],
      voussoir: [at(-B.Re * Math.cos((Math.PI / 2) * k), B.W - 0.2, B.zs + B.Re * Math.sin((Math.PI / 2) * k) - 0.05, "trowel"), at(0.4, front, 0, "carry")],
      keystone: [at(0, B.W - 0.2, B.zs + B.Re, "hammer"), at(-0.5, front, 0, "survey")],
      spandrel: [-1.6, 1.6].map((x) => at(x, B.W - 0.25, Math.min(B.zs + (B.deck - B.zs) * k, deckZ(x)) - 0.05, "trowel")),
      fill: [at(-B.L + 2 * B.L * k, 0, deckZ(-B.L + 2 * B.L * k), "shovel"), at(1.6, 0, deckZ(1.6), "roller")],
      strike: [at(-0.3, front, 0, "hammer"), at(0.5, front, 0, "carry")],
      paving: [at(-B.L + 2 * B.L * k, 0.1, deckZ(-B.L + 2 * B.L * k), "trowel"), at(-B.L + 2 * B.L * k - 0.6, -0.3, deckZ(-B.L + 2 * B.L * k - 0.6), "carry")],
      parapet: [at(-B.L + 2 * B.L * k, 0.2, deckZ(-B.L + 2 * B.L * k), "trowel"), at(0.5, front, 0, "carry")],
      water: [at(-0.4, -2.95, 0, "carry"), at(0.6, -2.95, 0, "carry")],
    }[p.key];
    return list || null;
  },
  // Footings (two 1.2 × 1.6 × 0.35 slabs), cut stone of the abutments,
  // arch ring and spandrels, less the opening.
  metraj(sp, p, k) {
    const foot = 2 * (B.L - B.Ri + 0.2) * (2 * B.W + 0.3) * 0.35 * V,
      depth = 2 * B.W;
    if (p.key === "abutFoot") return { concrete: k * foot, rebar: k * foot * 0.06 };
    if (p.key === "abutWall") return { stone: k * 2 * (B.L - B.Ri) * B.zs * depth * V };
    if (p.key === "voussoir" || p.key === "keystone") return { stone: k * (p.key === "keystone" ? 1 / B.n : (B.n - 1) / B.n) * (Math.PI / 2) * (B.Re ** 2 - B.Ri ** 2) * depth * V };
    // Two spandrel walls a quarter unit thick; the core between them is fill.
    if (p.key === "spandrel") return { stone: k * (2 * B.L * (B.deck - B.zs) - B.L * (B.deck - B.ends) - (Math.PI / 2) * B.Re ** 2) * 2 * 0.25 * V };
    if (p.key === "parapet") return { stone: k * 2 * 2 * B.L * 0.16 * B.rail * V };
    return null;
  },
  items: (q, num) => (q.stone > 0 ? `Kesme taş ${num(q.stone)} m³` : `Donatı ${num(q.rebar, 2)} t`),
};

// =====================================================================
// Serender: a chestnut granary on four posts set on stone bases, each post
// capped with a flat "mouse stone" so nothing climbs in; a box of grooved
// boards on notched sill beams, wide eaves of timber shingles, a carved
// door and a ladder that is taken away at night.
// =====================================================================
const S = { x: 1.15, y: 0.95, post: 1.35, disc: 0.07, sill: 0.14, wall: 1.15, eave: 0.45, ridge: 0.95 };
S.z0 = S.post + S.disc; // underside of the sill beams
S.z1 = S.z0 + S.sill; // the floor
S.z2 = S.z1 + S.wall; // wall plate
const CHESTNUT = ["#c99a62", "#ad7f48", "#8f6638"],
  AGED = ["#a98a66", "#8f714f", "#77593a"],
  SHINGLE = ["#7d6a55", "#5f4f3e", "#958069"],
  POSTS = [[-0.85, -0.65], [0.85, -0.65], [-0.85, 0.65], [0.85, 0.65]];
function serenderSVG(P, k, lit = false, detail = 2, aged = false) {
  const wood = aged ? AGED : CHESTNUT;
  let s = "";
  // Stone bases.
  POSTS.slice(0, Math.ceil(clamp(k.footing) * 4)).forEach(([x, y]) => (s += box(P, x - 0.2, y - 0.2, x + 0.2, y + 0.2, 0, 0.18, STONE)));
  // Posts, then the mouse stones on them: back ones first.
  const up = S.post * clamp(k.posts);
  POSTS.forEach(([x, y], i) => {
    if (up > 0.18) s += box(P, x - 0.08, y - 0.08, x + 0.08, y + 0.08, 0.18, Math.min(S.post, up), wood);
    if (k.discs * 4 > i) {
      const [cx, cy] = P(x, y, S.post);
      s += ellipse(cx, cy + 0.8, 12, 6.2, "#9c968a") + ellipse(cx, cy - 0.6, 12, 6.2, "#cfc9bd");
    }
  });
  // Sill beams, notched together at the corners and running out past them.
  if (k.sill > 0) {
    const reach = clamp(k.sill);
    s += box(P, -S.x - 0.15, -S.y, -S.x - 0.15 + (2 * S.x + 0.3) * reach, -S.y + 0.14, S.z0, S.z1, wood);
    s += box(P, -S.x, -S.y - 0.15, -S.x + 0.14, -S.y - 0.15 + (2 * S.y + 0.3) * reach, S.z0, S.z1, wood);
    if (reach > 0.5) {
      s += box(P, S.x - 0.14, -S.y - 0.15, S.x, S.y + 0.15, S.z0, S.z1, wood) + box(P, -S.x - 0.15, S.y - 0.14, S.x + 0.15, S.y, S.z0, S.z1, wood);
      s += poly([P(-S.x, -S.y, S.z1), P(S.x, -S.y, S.z1), P(S.x, S.y, S.z1), P(-S.x, S.y, S.z1)], wood[0]);
    }
  }
  // Corner posts and girts, then grooved boards slid in from the top.
  const frame = clamp(k.frame);
  if (frame > 0)
    [[-S.x, -S.y], [S.x, -S.y], [-S.x, S.y], [S.x, S.y]].forEach(([x, y]) => {
      const sx = x < 0 ? 0.12 : -0.12,
        sy = y < 0 ? 0.12 : -0.12;
      s += box(P, Math.min(x, x + sx), Math.min(y, y + sy), Math.max(x, x + sx), Math.max(y, y + sy), S.z1, S.z1 + S.wall * frame, wood);
    });
  const boards = clamp(k.boards),
    zb = S.z1 + S.wall * boards;
  if (boards > 0) {
    s += poly(faceY(P, S.y, -S.x, S.x, S.z1, zb), shade(P, [0, 1, 0], wood)) + poly(faceX(P, S.x, -S.y, S.y, S.z1, zb), shade(P, [1, 0, 0], wood));
    if (detail >= 2) {
      for (let z = S.z1 + 0.16; z < zb; z += 0.16) s += seg(P(-S.x, S.y + 0.003, z), P(S.x, S.y + 0.003, z), "#7a5630", 0.6, 0.7) + seg(P(S.x + 0.003, -S.y, z), P(S.x + 0.003, S.y, z), "#6a4a28", 0.6, 0.7);
      // Corner posts stand proud of the boards.
      for (const [x, y] of [[-S.x, S.y], [S.x, S.y], [S.x, -S.y]]) s += box(P, x - 0.06, y - 0.06, x + 0.06, y + 0.06, S.z1, zb, wood);
    }
  }
  if (boards >= 1) s += box(P, -S.x - 0.04, -S.y - 0.04, S.x + 0.04, S.y + 0.04, S.z2, S.z2 + 0.08, wood);
  return s + serenderTop(P, k, lit, detail, wood);
}
function serenderTop(P, k, lit, detail, wood) {
  let s = "";
  const ridge = S.z2 + S.ridge,
    ex = S.x + S.eave,
    ey = S.y + S.eave;
  // Rafters along the long sides, a ridge beam, then the shingles.
  if (k.roofFrame > 0) {
    const n = 6,
      placed = Math.ceil(clamp(k.roofFrame / 0.7) * n);
    for (let i = 0; i < placed; i++) {
      const x = -ex + (2 * ex * i) / (n - 1);
      s += seg(P(x, -ey, S.z2 - 0.1), P(x, 0, ridge), "#8f6230", 1.6) + seg(P(x, ey, S.z2 - 0.1), P(x, 0, ridge), "#a8793f", 1.6);
    }
    if (k.roofFrame > 0.7) s += seg(P(-ex, 0, ridge), P(ex, 0, ridge), "#8f6230", 2.2);
  }
  if (k.roofTiles > 0) {
    const t = clamp(k.roofTiles),
      zr = S.z2 - 0.1 + (ridge - S.z2 + 0.1) * t,
      yr = ey * (1 - t);
    s += poly([P(-ex, -ey, S.z2 - 0.1), P(ex, -ey, S.z2 - 0.1), P(ex, -yr, zr), P(-ex, -yr, zr)], SHINGLE[1]);
    s += poly([P(-ex, ey, S.z2 - 0.1), P(ex, ey, S.z2 - 0.1), P(ex, yr, zr), P(-ex, yr, zr)], SHINGLE[0]);
    if (detail >= 2)
      for (let f = 0.15; f < t; f += 0.15) {
        const z = S.z2 - 0.1 + (ridge - S.z2 + 0.1) * f,
          y = ey * (1 - f);
        s += seg(P(-ex, y, z), P(ex, y, z), SHINGLE[2], 0.9, 0.8);
        for (let x = -ex + (f * 20) % 0.3; x < ex; x += 0.3) s += seg(P(x, y, z), P(x, y + 0.12, z - 0.07), SHINGLE[1], 0.5, 0.6);
      }
    if (t >= 1) {
      // The gable end: the triangle under the roof, boarded.
      s += poly([P(S.x, -S.y, S.z2 + 0.08), P(S.x, S.y, S.z2 + 0.08), P(S.x, 0, ridge - 0.12)], shade(P, [1, 0, 0], wood));
      s += seg(P(-ex, 0, ridge + 0.02), P(ex, 0, ridge + 0.02), SHINGLE[2], 2.2);
    }
  }
  // Carved door with its lock bar, a vent of turned spindles, the ladder.
  if (k.openings > 0.4) {
    s += poly(faceY(P, S.y + 0.01, -0.3, 0.3, S.z1 + 0.05, S.z1 + 0.9), lit ? LIT : "#6b4423");
    if (detail >= 2) {
      s += poly(faceY(P, S.y + 0.012, -0.24, 0.24, S.z1 + 0.62, S.z1 + 0.84), "#8b5a2b");
      for (let x = -0.2; x <= 0.21; x += 0.08) s += seg(P(x, S.y + 0.014, S.z1 + 0.64), P(x + 0.04, S.y + 0.014, S.z1 + 0.82), "#c99a62", 0.7);
      s += seg(P(-0.28, S.y + 0.015, S.z1 + 0.45), P(0.28, S.y + 0.015, S.z1 + 0.45), "#3c2a18", 1.4);
      for (let y = -0.6; y <= 0.6; y += 0.15) s += seg(P(S.x + 0.012, y, S.z2 - 0.28), P(S.x + 0.012, y, S.z2 - 0.06), "#6a4a28", 1.1);
    }
  }
  if (k.ladder > 0.3) {
    const foot = [0.55, S.y + 1.05],
      head = [0.55, S.y + 0.05];
    for (const dx of [-0.18, 0.18]) s += seg(P(foot[0] + dx, foot[1], 0), P(head[0] + dx, head[1], S.z1), "#8f6638", 1.6);
    for (let t = 0.12; t < 1; t += 0.16) s += seg(P(foot[0] - 0.18, foot[1] + (head[1] - foot[1]) * t, S.z1 * t), P(foot[0] + 0.18, foot[1] + (head[1] - foot[1]) * t, S.z1 * t), "#a8793f", 1.1);
  }
  if (k.ladder > 0.7 && detail >= 2) {
    // Strings of corn drying under the eaves.
    for (const x of [-0.75, -0.55]) {
      const [cx, cy] = P(x, S.y + 0.3, S.z2 - 0.15);
      for (let i = 0; i < 4; i++) s += ellipse(cx, cy + i * 3.5, 2, 2.1, i % 2 ? "#f2c14e" : "#e0a83a");
    }
  }
  return s;
}
const SERENDER_DONE = { footing: 1, posts: 1, discs: 1, sill: 1, frame: 1, boards: 1, roofFrame: 1, roofTiles: 1, openings: 1, ladder: 1 };
export const SERENDER = {
  system: "log",
  ridge: S.ridge + 0.05,
  spec: () => ({ hw: 1.45, h: S.z2 - 0.3, floors: 1, wall: { faces: CHESTNUT, grain: "#7a5630", pattern: "serender" }, roof: SHINGLE }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "footing", label: "Taş kaideler: dört ayağın altına", w: 1, cost: 2, stock: "stone" },
    { key: "posts", label: "Kestane dikmeler", w: 1, cost: 3, lift: true, liftAs: "studs", stock: "timber" },
    { key: "discs", label: "Fare taşları: dikmelerin başına yassı taş", w: 0.6, cost: 1, inspect: "dikmelerin şakulü ve fare taşları", next: "tabana geçilebilir" },
    { key: "sill", label: "Taban kirişleri: köşelerde boğaz geçme", w: 1.1, cost: 3, lift: true, liftAs: "studs", stock: "timber" },
    { key: "frame", label: "Köşe dikmeleri ve kuşaklar", w: 0.9, cost: 3, stock: "timber" },
    { key: "boards", label: "Oluklu tahtalar: yukarıdan kaydırılarak", w: 1.6, cost: 5, stock: "timber" },
  ],
  frameEnd: 0.62,
  later: [
    { key: "roofFrame", label: "Çatı: mertekler ve mahya kirişi", a: 0.62, b: 0.7, cost: 3, lift: true },
    { key: "roofTiles", label: "Çatı: kestane hartama (ahşap pul) kaplama", a: 0.7, b: 0.8, cost: 4 },
    { key: "openings", label: "Oyma kapı ve havalandırma parmaklığı", a: 0.8, b: 0.88, cost: 3 },
    { key: "ladder", label: "Seyyar merdiven ve mısır askıları", a: 0.88, b: 0.93, cost: 1 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  craneEnd: 0.72,
  scene: (P, sp, plan, shown, lit) => serenderSVG(P, progress(plan, shown), lit),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-S.x - S.eave, -S.y - S.eave, S.x + S.eave, S.y + S.eave), (S.z2 + S.ridge) * 0.42 * t + 0.2),
  shadowFrom: "posts",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    let s = detail ? castShadow(shadowP, rectOutline(-S.x - S.eave, -S.y - S.eave, S.x + S.eave, S.y + S.eave), (S.z2 + S.ridge) * 0.42 + 0.2) : "";
    return s + serenderSVG(P, SERENDER_DONE, lit, detail, rng(seed)() < 0.4);
  },
  snow(P) {
    const ridge = S.z2 + S.ridge,
      ex = S.x + S.eave,
      ey = S.y + S.eave;
    return poly([P(-ex, 0, ridge + 0.01), P(ex, 0, ridge + 0.01), P(ex, ey * 0.55, S.z2 - 0.1 + (ridge - S.z2 + 0.1) * 0.45), P(-ex, ey * 0.55, S.z2 - 0.1 + (ridge - S.z2 + 0.1) * 0.45)], "#f4f7fa", 0.95);
  },
  workHeight(sp, p, k) {
    if (["sill", "frame", "boards"].includes(p.key)) return S.z1 + (p.key === "boards" ? S.wall * k : 0.2);
    if (p.key === "posts") return S.post;
    if (p.key === "roofFrame") return S.z2 + S.ridge;
    return null;
  },
  crew(sp, p, k) {
    const f = S.y + 0.6;
    return {
      footing: [at(-0.9, f, 0, "trowel"), at(0.9, f, 0, "carry")],
      posts: [at(-0.85, f - 0.1, 0, "hammer"), at(0.85, f - 0.1, 0, "carry")],
      discs: [at(0.2, f, 0, "carry")],
      sill: [at(-0.8, 0.2, S.z0 - 0.02, "hammer"), at(0.7, f, 0, "carry")],
      frame: [at(0.3, 0.1, S.z1, "hammer"), at(0.7, f, 0, "carry")],
      boards: [at(-0.3, 0, S.z1, "hammer"), at(0.7, f, 0, "carry")],
    }[p.key] || null;
  },
  // Chestnut: posts 16 × 16, sills 14 × 14, boards 4 cm on four walls.
  metraj(sp, p, k) {
    const box3 = (a, b, c) => a * b * c * V;
    if (p.key === "posts") return { timber: k * 4 * box3(0.16, 0.16, S.post) };
    if (p.key === "sill") return { timber: k * 2 * (box3(2 * S.x + 0.3, 0.14, 0.14) + box3(2 * S.y + 0.3, 0.14, 0.14)) };
    if (p.key === "frame") return { timber: k * 4 * box3(0.12, 0.12, S.wall) };
    if (p.key === "boards") return { timber: k * 2 * (2 * S.x + 2 * S.y) * S.wall * 0.025 * M * M };
    if (p.key === "footing") return { stone: k * 4 * box3(0.4, 0.4, 0.18) };
    return null;
  },
  items: (q, num) => [`Kestane ${num(q.timber, 2)} m³`, `Taş ${num(q.stone, 2)} m³`],
};

// =====================================================================
// Kerpiç kubbe evleri (Harran): mud bricks moulded and sun-dried on site,
// stone plinths, square cells of mud-brick walls, and on each cell a
// corbelled cone with no formwork, every course stepping in over the one
// below; mud-and-straw plaster, small doors and vents, a courtyard.
// =====================================================================
const H = { half: 0.95, wall: 1.15, cone: 1.95, top: 0.14, plinth: 0.25 };
const CELLS = [[-1.0, -1.0], [1.0, -1.0], [-1.0, 1.0]];
const BRICK = ["#dcbd90", "#c6a478", "#a98a5f"],
  PLASTER = ["#e7cfa6", "#d2b78b", "#b79b6f"];
// The cone's radius at a height above its springing: a beehive profile.
const coneR = (t) => H.half * (1 - Math.pow(t, 1.35)) * (1 - 0.1 * t) + H.top * Math.pow(t, 1.35);
function cellSVG(P, cx, cy, k, plaster, lit, detail) {
  const faces = plaster > 0 ? mixAll(BRICK, PLASTER, plaster) : BRICK;
  const z0 = 0.3 + H.plinth * 0 + 0.0,
    zw = z0 + H.wall * clamp(k.wall);
  let s = "";
  if (k.plinth > 0) s += box(P, cx - H.half - 0.05, cy - H.half - 0.05, cx + H.half + 0.05, cy + H.half + 0.05, 0, 0.3 * clamp(k.plinth / 0.8), STONE);
  if (k.wall > 0) {
    s += box(P, cx - H.half, cy - H.half, cx + H.half, cy + H.half, 0.3, zw, faces);
    if (detail >= 2 && plaster < 1)
      for (let z = 0.3 + 0.13, c = 0; z < zw; z += 0.13, c++) {
        s += seg(P(cx - H.half, cy + H.half + 0.003, z), P(cx + H.half, cy + H.half + 0.003, z), "#b08c5e", 0.5, 0.8 * (1 - plaster)) + seg(P(cx + H.half + 0.003, cy - H.half, z), P(cx + H.half + 0.003, cy + H.half, z), "#98784e", 0.5, 0.8 * (1 - plaster));
      }
  }
  // The cone, course by course: each ring of bricks steps in a little.
  const courses = 15,
    laid = Math.ceil(clamp(k.cone) * courses - 1e-6);
  const zc = 0.3 + H.wall;
  for (let c = 0; c < laid; c++) {
    const t0 = c / courses,
      t1 = (c + 1) / courses,
      r0 = coneR(t0),
      r1 = coneR(t1),
      za = zc + H.cone * t0,
      zb = zc + H.cone * t1;
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2,
        a1 = ((i + 1) / n) * Math.PI * 2,
        am = (a0 + a1) / 2,
        slope = (r0 - r1) / (zb - za),
        nn = [Math.cos(am), Math.sin(am), slope];
      if (!facing(nn)) continue;
      s += poly([P(cx + r0 * Math.cos(a0), cy + r0 * Math.sin(a0), za), P(cx + r0 * Math.cos(a1), cy + r0 * Math.sin(a1), za), P(cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1), zb), P(cx + r1 * Math.cos(a0), cy + r1 * Math.sin(a0), zb)], shade(P, nn.map((v) => v / Math.hypot(...nn)), faces));
    }
    if (detail >= 2 && plaster < 1) {
      const ring = Array.from({ length: 13 }, (_, i) => {
        const a = -Math.PI / 4 + (i / 12) * Math.PI;
        return P(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), zb);
      });
      for (let i = 1; i < ring.length; i++) s += seg(ring[i - 1], ring[i], "#a88457", 0.5, 0.7 * (1 - plaster));
    }
  }
  // The cap stone over the smoke hole, and the corners' pendentives filled.
  if (laid >= courses) {
    const [tx, ty] = P(cx, cy, zc + H.cone + 0.04);
    s += ellipse(tx, ty, 4, 2, "#8f7a5c");
  }
  if (k.wall >= 1 && k.cone > 0)
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1]]) {
      const x = cx + dx * H.half,
        y = cy + dy * H.half;
      s += poly([P(x, y, zc), P(cx + dx * H.half, cy, zc), P(cx + dx * H.half * 0.8, cy + dy * H.half * 0.8, zc + 0.18)], faces[0]);
      s += poly([P(x, y, zc), P(cx, cy + dy * H.half, zc), P(cx + dx * H.half * 0.8, cy + dy * H.half * 0.8, zc + 0.18)], faces[0]);
    }
  return s;
}
function beehiveSVG(P, k, lit = false, detail = 2) {
  let s = "";
  // Bricks moulded in wooden forms and laid out to dry in rows, then used up.
  const made = clamp(k.mudbrick),
    used = clamp((k.cellWalls + clamp(k.corbel0) + clamp(k.corbel1) + clamp(k.corbel2)) / 4);
  // They dry in the corner the courtyard will take, before it is walled.
  const rows = Math.round(made * 30 * (1 - used));
  for (let i = 0; i < rows; i++) {
    const x = 0.25 + (i % 6) * 0.26,
      y = 0.25 + Math.floor(i / 6) * 0.34;
    s += box(P, x, y, x + 0.2, y + 0.28, 0, 0.07, made < 1 && i > rows - 4 ? ["#a88a62", "#937552", "#7c6143"] : BRICK);
  }
  if (made > 0 && made < 1) {
    const [mx, my] = P(1.55, 1.95, 0);
    s += ellipse(mx, my, 14, 6, "#8f7350") + ellipse(mx - 2, my - 2, 8, 3, "#a4865e");
  }
  const plaster = clamp(k.plaster);
  // Back cells first so the front ones overlap them.
  [...CELLS.keys()].sort((a, b) => CELLS[a][0] + CELLS[a][1] - (CELLS[b][0] + CELLS[b][1])).forEach((i) => {
    const [cx, cy] = CELLS[i];
    s += cellSVG(P, cx, cy, { plinth: k.stoneFoot, wall: k.cellWalls, cone: k[`corbel${i}`] }, plaster, lit, detail);
    if (k.openings > 0.3) {
      // A low door on the front cell faces, a small vent high up.
      s += poly(faceY(P, cy + H.half + 0.01, cx - 0.22, cx + 0.22, 0.3, 0.3 + 0.95 * clamp((k.openings - 0.3) / 0.5)), lit ? LIT : "#5d4128");
      s += poly(faceX(P, cx + H.half + 0.01, cy - 0.12, cy + 0.12, 0.95, 1.12), lit ? LIT : GLASS);
    }
  });
  // The courtyard: a low wall on the open corner, a tandır and a vine arbour.
  const court = clamp(k.court);
  if (court > 0) {
    const reach = 0.05 + 1.95 * clamp(court / 0.5);
    s += box(P, 0.05, 1.95 - 0.12, 0.05 + reach, 1.95, 0, 0.55, faces3(plaster)) + box(P, 1.95 - 0.12, 0.05, 1.95, 0.05 + Math.max(0, reach - 0.4), 0, 0.55, faces3(plaster));
    if (court > 0.5) {
      const [tx, ty] = P(1.0, 1.0, 0.45);
      s += box(P, 0.78, 0.78, 1.22, 1.22, 0, 0.42, ["#c9a77c", "#b08e64", "#957652"]) + ellipse(tx, ty, 7, 3.6, "#4a3424");
    }
    if (court > 0.75) {
      for (const [x, y] of [[0.3, 1.7], [1.7, 0.3]]) s += seg(P(x, y, 0), P(x, y, 1.25), "#6b4f34", 1.5);
      s += seg(P(0.3, 1.7, 1.25), P(1.7, 0.3, 1.25), "#6b4f34", 1.5);
      for (let i = 0; i < 6; i++) {
        const [vx, vy] = P(0.3 + i * 0.28, 1.7 - i * 0.28, 1.27);
        s += circle(vx, vy, 3.2, i % 2 ? "#5e9b4c" : "#73b05c");
      }
    }
  }
  return s;
}
const faces3 = (plaster) => mixAll(BRICK, PLASTER, plaster);
const BEEHIVE_DONE = { mudbrick: 1, stoneFoot: 1, cellWalls: 1, corbel0: 1, corbel1: 1, corbel2: 1, plaster: 1, openings: 1, court: 1 };
export const BEEHIVE = {
  system: "corbel",
  ridge: H.cone + 0.1,
  spec: () => ({ hw: 2, h: H.wall, floors: 1, wall: { faces: PLASTER, grain: "#a88457", pattern: "kerpic" }, roof: PLASTER }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "mudbrick", label: "Kerpiç kesme: çamur, saman, ahşap kalıp ve güneşte kurutma", w: 1.6, cost: 3 },
    { key: "stoneFoot", label: "Moloz taş temel ve subasman", w: 1, cost: 3, stock: "stone" },
    { key: "cellWalls", label: "Kerpiç duvarlar: çamur harçla şaşırtmalı", w: 1.6, cost: 5, stock: "kerpic" },
    ...[0, 1, 2].map((i) => ({ key: "corbel", floor: i, label: `${i + 1}. kubbe: kalıpsız, her sıra içe bindirmeli`, w: 1.2, cost: 4, stock: "kerpic", ...(i === 2 ? { inspect: "üç kubbenin profili ve tepe delikleri", next: "sıvaya geçilebilir" } : {}) })),
  ],
  frameEnd: 0.7,
  later: [
    { key: "plaster", label: "Samanlı çamur sıva: iki kat", a: 0.7, b: 0.8, cost: 3 },
    { key: "openings", label: "Alçak kapılar ve küçük pencereler", a: 0.8, b: 0.87, cost: 3 },
    { key: "court", label: "Avlu duvarı, tandır ve asma çardağı", a: 0.87, b: 0.93, cost: 3 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  garden: false,
  scene: (P, sp, plan, shown, lit) => beehiveSVG(P, progress(plan, shown), lit),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-2, -2, 2, 2), (H.wall + H.cone) * 0.42 * t + 0.2),
  shadowFrom: "cellWalls",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    let s = detail ? castShadow(shadowP, rectOutline(-2, -2, 2, 2), (H.wall + H.cone) * 0.42 + 0.2) : "";
    return s + beehiveSVG(P, BEEHIVE_DONE, lit, detail);
  },
  snow(P) {
    let s = "";
    for (const [cx, cy] of CELLS) {
      const [x, y] = P(cx, cy, 0.3 + H.wall + H.cone * 0.8);
      s += ellipse(x, y, 9, 5, "#f4f7fa", 0.95);
    }
    return s;
  },
  workHeight(sp, p, k) {
    if (p.key === "corbel") return 0.3 + H.wall + H.cone * k;
    if (p.key === "cellWalls") return 0.3 + H.wall * k;
    return null;
  },
  crew(sp, p, k) {
    const f = 2.35;
    if (p.key === "corbel") {
      const [cx, cy] = CELLS[p.floor],
        z = 0.3 + H.wall + H.cone * k * 0.8;
      return [at(cx + coneR(k * 0.8) + 0.05, cy + 0.2, z - 0.45, "trowel"), at(cx + 0.6, f, 0, "carry")];
    }
    return {
      mudbrick: [at(1.6, 2.2, 0, "shovel"), at(0.3 + 1.3 * k, 1.9, 0, "carry")],
      stoneFoot: [at(-1.2, f, 0, "trowel"), at(0.6, f, 0, "carry")],
      cellWalls: [at(-1.0, 0.1, 0.3 + H.wall * k * 0.6, "trowel"), at(1.0, 0.1, 0.3 + H.wall * k * 0.6, "trowel"), at(0.6, f, 0, "carry")],
    }[p.key] || null;
  },
  // Bricks of 40 × 20 × 10 cm laid across a 40 cm wall: about 42 to the m²
  // with mud mortar; the cones thin towards the top, about 35.
  metraj(sp, p, k) {
    const wallArea = 3 * 4 * 2 * H.half * H.wall * M * M,
      coneArea = 3 * Math.PI * H.half * Math.hypot(H.half, H.cone) * M * M;
    if (p.key === "cellWalls") return { wall: k * wallArea * 42 };
    if (p.key === "corbel") return { wall: (k * coneArea * 35) / 3 };
    if (p.key === "stoneFoot") return { stone: k * 3 * (2 * H.half + 0.1) ** 2 * 0.3 * V * 0.4 };
    return null;
  },
  items: (q, num) => [`Kerpiç ${Math.round(q.wall)} adet`, `Taş ${num(q.stone, 1)} m³`],
};

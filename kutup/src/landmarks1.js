// Famous buildings, first group (n38): the Great Pyramid, the Colosseum and
// the Leaning Tower of Pisa, scaled to a village plot and built in the order
// they really were, with the tools of their time. The quantities count the
// real buildings: blocks, cubic metres, tonnes and degrees of lean.
import { box, circle, ellipse, poly, seg } from "./iso.js";
import { at, castShadow, cell, clamp, facing, mix, mixAll, painted, progress, rectOutline, shade, unit } from "./kit.js";

const TIMBER = ["#c99a62", "#ad7f48", "#8f6638"];
const thousands = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2).replace(".", ",")} milyon` : n >= 1e3 ? `${Math.round(n / 1e3)} bin` : `${Math.round(n)}`);
// A treadwheel crane of timber: men walk inside the wheel, the rope runs over
// the jib's head to the stone.
export function treadwheelSVG(P, x, y, tip, load, time = 0) {
  let s = "";
  const r = 0.38,
    zc = r + 0.05,
    turn = time * 0.8;
  const rim = Array.from({ length: 20 }, (_, i) => P(x, y + r * Math.cos((i / 20) * Math.PI * 2), zc + r * Math.sin((i / 20) * Math.PI * 2)));
  s += poly(rim, "none") + rim.map((p, i) => seg(p, rim[(i + 1) % rim.length], "#8f6638", 1.6)).join("");
  for (let i = 0; i < 4; i++) {
    const a = turn + (i * Math.PI) / 4;
    s += seg(P(x, y + r * Math.cos(a), zc + r * Math.sin(a)), P(x, y - r * Math.cos(a), zc - r * Math.sin(a)), "#ad7f48", 0.8);
  }
  // Frame and jib.
  s += seg(P(x - 0.15, y - 0.3, 0), P(x, y, zc + 0.1), "#8f6638", 1.4) + seg(P(x - 0.15, y + 0.3, 0), P(x, y, zc + 0.1), "#8f6638", 1.4);
  s += seg(P(x + 0.1, y, 0), P(...tip), "#7a5630", 2.2) + seg(P(x - 0.25, y, 0), P(...tip), "#8f6638", 1);
  if (load) {
    s += seg(P(...tip), P(load[0], load[1], load[2] + 0.2), "#3c3226", 0.7);
    s += box(P, load[0] - 0.12, load[1] - 0.09, load[0] + 0.12, load[1] + 0.09, load[2], load[2] + 0.16, load[3] || ["#efe6d4", "#d9ccb3", "#bfb196"]);
  }
  return s;
}

// =====================================================================
// Keops piramidi: the bedrock levelled with water channels, the base set
// square to the north by the stars, the core of local limestone hauled up
// on sledges along ramps, Aswan granite for the King's Chamber, the
// capstone, then the white Tura casing dressed from the top down as the
// ramps came away. 146.6 m high, about 2.3 million blocks.
// =====================================================================
const KP = { B: 1.95, H: 2.5, courses: 16, dh: 0.34 };
const CORE = ["#e3cf9e", "#cdb682", "#b39b68"],
  CASING = ["#f8f3e6", "#e9dfc8", "#d2c5a6"],
  GOLD = ["#f2d27a", "#dcb24c", "#b88f2c"],
  GRANITE = ["#d29a8f", "#b87d72", "#9a6158"],
  RAMP = ["#c6a77a", "#ad8f63", "#93764d"];
const halfAt = (z) => KP.B * (1 - z / KP.H);
const heightOf = (v) => KP.H * (1 - Math.cbrt(1 - clamp(v)));
// The zigzag ramp on the north-west face: leg j climbs from j·dh to (j+1)·dh.
const ledge = (j, u, out = 0) => {
  const z = j * KP.dh + KP.dh * u,
    a = halfAt(z) - 0.18,
    x = (j % 2 ? -1 : 1) * a * (1 - 2 * u);
  return [x, halfAt(z) + out, z];
};
function rampSVG(P, top, low = 0) {
  let s = "";
  for (let j = 0; j * KP.dh < top - 0.05; j++) {
    if (j * KP.dh < low) continue;
    for (let i = 0; i < 6; i++) {
      const u0 = i / 6,
        u1 = (i + 1) / 6;
      if (j * KP.dh + KP.dh * u1 > top + 0.02) break;
      const a = ledge(j, u0),
        b = ledge(j, u1),
        c = ledge(j, u1, 0.22),
        d = ledge(j, u0, 0.22);
      s += poly([a, b, c, d].map((p) => P(...p)), RAMP[0]);
      s += poly([P(...d), P(...c), P(c[0], c[1], c[2] - 0.12), P(d[0], d[1], d[2] - 0.12)], RAMP[1]);
    }
  }
  return s;
}
function sledgeSVG(P, p, faces = CORE) {
  const [x, y, z] = p;
  return seg(P(x - 0.16, y - 0.06, z + 0.01), P(x + 0.16, y - 0.06, z + 0.01), "#7a5630", 1.2) + seg(P(x - 0.16, y + 0.06, z + 0.01), P(x + 0.16, y + 0.06, z + 0.01), "#7a5630", 1.2) + box(P, x - 0.12, y - 0.08, x + 0.12, y + 0.08, z + 0.02, z + 0.17, faces);
}
function pyramidSVG(P, k, lit = false, detail = 2, time = 0) {
  let s = "";
  // Bedrock levelled: a grid of water channels, filled in once level.
  if (k.level > 0) {
    s += poly([P(-KP.B - 0.1, -KP.B - 0.1, 0.004), P(KP.B + 0.1, -KP.B - 0.1, 0.004), P(KP.B + 0.1, KP.B + 0.1, 0.004), P(-KP.B - 0.1, KP.B + 0.1, 0.004)], "#d8c39a");
    if (k.level < 1 || k.orient < 1)
      for (let g = -1.6; g <= 1.6; g += 0.8) {
        const o = 0.8 * (1 - clamp(k.level));
        s += seg(P(-KP.B, g, 0.006), P(KP.B, g, 0.006), "#6fa8d0", 1.4, o + 0.2) + seg(P(g, -KP.B, 0.006), P(g, KP.B, 0.006), "#6fa8d0", 1.4, o + 0.2);
      }
  }
  // Corners staked out and the base squared to the north.
  if (k.orient > 0 && k.casing < 1) {
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) s += seg(P(x * KP.B, y * KP.B, 0), P(x * KP.B, y * KP.B, 0.3), "#7a5630", 1.2);
    if (k.courses0 < 0.3) s += seg(P(-KP.B, -KP.B, 0.02), P(KP.B, KP.B, 0.02), "#c0533e", 0.8) + seg(P(KP.B, -KP.B, 0.02), P(-KP.B, KP.B, 0.02), "#c0533e", 0.8);
  }
  const v = (clamp(k.courses0) + clamp(k.courses1) + clamp(k.courses2) + clamp(k.courses3)) / 4,
    top = Math.max(heightOf(v), k.capstone > 0.5 ? KP.H : 0);
  const dressed = KP.H * (1 - clamp(k.casing));
  // Stepped core up to where the casing has been dressed.
  for (let c = 0; c < KP.courses; c++) {
    const z0 = (c * KP.H) / KP.courses,
      z1 = z0 + KP.H / KP.courses;
    if (z0 >= Math.min(heightOf(v), dressed) - 1e-6) break;
    const a = halfAt((z0 + z1) / 2) + 0.02;
    s += box(P, -a, -a, a, a, z0, Math.min(z1, heightOf(v), dressed), mixAll(CORE, CASING, 0.25));
    if (detail >= 2 && a > 0.3) for (let x = -a + 0.18; x < a; x += 0.24) s += seg(P(x, a + 0.002, z0), P(x, a + 0.002, Math.min(z1, dressed)), "#b39b68", 0.5, 0.6) + seg(P(a + 0.002, x, z0), P(a + 0.002, x, Math.min(z1, dressed)), "#a08a5c", 0.5, 0.6);
  }
  // Dressed casing above that line: the two faces we see, smooth and white.
  if (k.casing > 0 || k.done) {
    const z = k.done ? 0 : dressed,
      a = halfAt(z),
      apex = [0, 0, KP.H];
    s += poly([P(-a, a, z), P(a, a, z), P(...apex)], shade(P, unit([0, KP.H, KP.B]), CASING));
    s += poly([P(a, -a, z), P(a, a, z), P(...apex)], shade(P, unit([KP.H, 0, KP.B]), CASING));
  }
  // The capstone, gilded.
  if (k.capstone > 0.5) {
    const a = halfAt(KP.H - 0.22);
    s += poly([P(-a, a, KP.H - 0.22), P(a, a, KP.H - 0.22), P(0, 0, KP.H)], shade(P, unit([0, KP.H, KP.B]), GOLD)) + poly([P(a, -a, KP.H - 0.22), P(a, a, KP.H - 0.22), P(0, 0, KP.H)], shade(P, unit([KP.H, 0, KP.B]), GOLD));
  }
  // The ramp, up to the course being laid; taken down behind the dressing.
  const rampTop = k.casing > 0 ? dressed : Math.min(top, KP.H - 0.2);
  if (!k.done && rampTop > 0.05) s += rampSVG(P, rampTop);
  // A sledge on its way up: limestone, or granite beams for the chamber.
  const hauling = ["courses0", "courses1", "courses2", "courses3", "chamber", "capstone"].find((key) => k[key] > 0 && k[key] < 1);
  if (hauling) {
    const j = Math.max(0, Math.floor((top - 0.05) / KP.dh)),
      u = (time * 0.05) % 1;
    const legs = Math.max(0, Math.min(j, Math.floor(rampTop / KP.dh) - 1));
    s += sledgeSVG(P, ledge(legs, Math.min(0.9, 0.2 + u * 0.6), 0.11), hauling === "chamber" ? GRANITE : hauling === "capstone" ? GOLD : CORE);
  }
  // The entrance high on the north face.
  if (k.entrance > 0.4 || k.done) {
    const z = 0.55,
      a = halfAt(z);
    s += poly([P(-0.08, a + 0.003, z), P(0.08, a + 0.003, z), P(0.08, halfAt(z + 0.16) + 0.003, z + 0.16), P(-0.08, halfAt(z + 0.16) + 0.003, z + 0.16)], "#4a3d2c");
    if (detail >= 2) s += poly([P(-0.12, halfAt(z + 0.16), z + 0.16), P(0.12, halfAt(z + 0.16), z + 0.16), P(0, halfAt(z + 0.26), z + 0.26)], CASING[2]);
  }
  return s;
}
const PYRAMID_DONE = { level: 1, orient: 1, courses0: 1, courses1: 1, courses2: 1, courses3: 1, chamber: 1, capstone: 1, casing: 1, entrance: 1, done: true };
export const KEOPS = {
  system: "pyramid",
  ridge: 0.1,
  spec: () => ({ hw: 2, h: KP.H - 0.3, floors: 1, wall: { faces: CASING, grain: "#b39b68", pattern: "pyramid" }, roof: CASING }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "level", label: "Kaya taban: su kanallarıyla tesviye", w: 1, cost: 3 },
    { key: "orient", label: "Taban karesi yıldızlara göre kuzeye çevriliyor", w: 0.5, cost: 1, inspect: "taban karesi ve kuzey yönü: sapma yalnızca 4 yay dakikası", next: "taş dizilebilir" },
    { key: "courses", floor: 0, label: "Çekirdek taşları: kızakla rampadan çekiliyor 1/4", w: 1.6, cost: 8 },
    { key: "courses", floor: 1, label: "Çekirdek taşları 2/4: önde ıslak kum, sürtünme yarıya iniyor", w: 1.3, cost: 6 },
    { key: "chamber", label: "Kral odası: Asvan'dan granit kirişler ve beş boşaltma odası", w: 0.8, cost: 4, inspect: "kral odası kirişleri ve boşaltma odaları", next: "yükselmeye devam" },
    { key: "courses", floor: 2, label: "Çekirdek taşları 3/4: zikzak rampa", w: 1, cost: 4 },
    { key: "courses", floor: 3, label: "Çekirdek taşları 4/4", w: 0.8, cost: 3 },
    { key: "capstone", label: "Tepe taşı (piramidion)", w: 0.5, cost: 2, inspect: "dört yüzün tepede buluşması", next: "kaplamaya geçilebilir" },
  ],
  frameEnd: 0.7,
  later: [
    { key: "casing", label: "Tura kireçtaşı kaplama: tepeden aşağı perdah, rampa sökülüyor", a: 0.7, b: 0.88, cost: 8 },
    { key: "entrance", label: "Kuzey yüzünde giriş", a: 0.88, b: 0.93, cost: 1 },
    { key: "handover", label: "Teslim", a: 0.93, b: 1, cost: 2 },
  ],
  garden: false,
  live: true,
  scene: (P, sp, plan, shown, lit, time = 0) => pyramidSVG(P, progress(plan, shown), lit, 2, time),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-KP.B, -KP.B, KP.B, KP.B), KP.H * 0.42 * t + 0.1),
  shadowFrom: "courses",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(-KP.B, -KP.B, KP.B, KP.B), KP.H * 0.42 + 0.1) : "";
    return s + pyramidSVG(P, PYRAMID_DONE, lit, detail);
  },
  snow: () => "",
  workHeight(sp, p, k) {
    if (p.key === "courses") return heightOf((p.floor + k) / 4) + 0.2;
    if (p.key === "capstone") return KP.H;
    return null;
  },
  crew(sp, p, k, kk, time = 0) {
    if (p.key === "level") return [at(-1.2 + 2.4 * k, KP.B + 0.3, 0, "shovel"), at(0.8, -0.4, 0, "shovel")];
    if (p.key === "orient") return [at(KP.B + 0.3, KP.B + 0.3, 0, "survey"), at(-KP.B, KP.B + 0.3, 0, "carry")];
    if (["courses", "chamber", "capstone"].includes(p.key)) {
      const v = p.key === "courses" ? (p.floor + k) / 4 : p.key === "chamber" ? 0.5 : 1;
      const top = p.key === "capstone" ? KP.H - 0.2 : heightOf(v);
      const j = Math.max(0, Math.floor((top - 0.05) / KP.dh) - 1),
        u = Math.min(0.9, 0.2 + ((time * 0.05) % 1) * 0.6);
      return [0.1, 0.2, 0.3].map((d, i) => at(...ledge(j, Math.min(0.98, u + d)).map((c, n) => (n === 1 ? c + 0.11 : c)), i ? "carry" : "bar"));
    }
    if (p.key === "casing") {
      const z = KP.H * (1 - k);
      return [at(0.2, halfAt(z) + 0.05, z, "hammer"), at(-0.4, halfAt(z) + 0.05, z, "trowel")];
    }
    return null;
  },
  // The real pyramid: about 2.6 million m³ in some 2.3 million blocks.
  metraj(sp, p, k) {
    if (p.key === "courses") return { vol: k / 4 };
    if (p.key === "chamber") return { granite: k * 8000 };
    return null;
  },
  items: (q, num) => [`Blok ${thousands(2.3e6 * q.vol)}`, `Yükseklik ${num(146.6 * (1 - Math.cbrt(1 - Math.min(1, q.vol))))} m`],
};

// =====================================================================
// Kolezyum: Nero's lake drained, a ring of Roman concrete 12 m deep,
// travertine piers held by iron clamps instead of mortar, radial walls of
// tuff and brick-faced concrete carrying the raking vaults, three tiers of
// arches (Tuscan, Ionic, Corinthian) and the attic with the corbels for the
// velarium masts. Four teams worked a quadrant each, side by side.
// =====================================================================
const CO = { A: 2.15, Bb: 1.78, a: 0.95, b: 0.62, tier: 0.42, attic: 0.36, n: 44 };
CO.top = 3 * CO.tier + CO.attic;
const TRAV = ["#efe3c8", "#d8c9a8", "#bcac8b"],
  TUFA = ["#cbbf9f", "#b3a784", "#988c6b"],
  SEATS = ["#e9e2d2", "#cfc7b4", "#b2aa96"];
const ePt = (t, s, z) => [CO.A * s * Math.cos(t), CO.Bb * s * Math.sin(t), z];
const eNormal = (t) => unit([Math.cos(t) / CO.A, Math.sin(t) / CO.Bb, 0]);
// Four teams, one quadrant each: how far round its quadrant a team has got.
const quadrantDone = (t, k) => ((((t % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2)) / (Math.PI / 2)) < k;
function archOn(P, t0, t1, z0, h, fill, s = 1.001) {
  const p0 = ePt(t0, s, 0),
    p1 = ePt(t1, s, 0),
    w = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const pt = (u, z) => P(p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u, z);
  const r = 0.27 * w,
    zs = z0 + h * 0.78 - r;
  const pts = [pt(0.23, z0 + 0.03), pt(0.77, z0 + 0.03), pt(0.77, zs)];
  for (let i = 1; i < 8; i++) {
    const a = (i / 8) * Math.PI;
    pts.push(pt(0.5 + 0.27 * Math.cos(a), zs + r * Math.sin(a)));
  }
  pts.push(pt(0.23, zs));
  return poly(pts, fill);
}
function colosseumSVG(P, k, lit = false, detail = 2, time = 0) {
  let s = "";
  const n = CO.n,
    T = (i) => (i / n) * Math.PI * 2;
  // Nero's lake, drained.
  if (k.drain < 1) {
    const w = 1 - clamp(k.drain);
    s += poly(Array.from({ length: 32 }, (_, i) => P(...ePt((i / 32) * Math.PI * 2, 0.4 + 0.6 * w, 0.004))), mix("#9c8463", "#7db7d8", w));
  }
  // The ring foundation, quadrant by quadrant.
  if (k.foundation > 0) {
    for (let i = 0; i < n; i++) {
      if (!quadrantDone(T(i), k.foundation)) continue;
      s += poly([P(...ePt(T(i), 0.47, 0.01)), P(...ePt(T(i + 1), 0.47, 0.01)), P(...ePt(T(i + 1), 1.04, 0.01)), P(...ePt(T(i), 1.04, 0.01))], k.foundation < 1 ? "#a8a49b" : "#c4bfb3");
    }
  }
  // Arena: sand on a timber floor over the service rooms.
  if (k.foundation >= 1) s += poly(Array.from({ length: 36 }, (_, i) => P(CO.a * Math.cos((i / 36) * Math.PI * 2), CO.b * Math.sin((i / 36) * Math.PI * 2), 0.05)), k.arena > 0.5 ? "#e2c995" : k.arena > 0 ? "#b58a55" : "#9c8463");
  if (k.arena > 0 && k.arena <= 0.5 && detail >= 2) for (let x = -CO.a + 0.1; x < CO.a; x += 0.12) s += seg(P(x, -CO.b * Math.sqrt(Math.max(0, 1 - (x / CO.a) ** 2)), 0.051), P(x, CO.b * Math.sqrt(Math.max(0, 1 - (x / CO.a) ** 2)), 0.051), "#8f6638", 0.6);
  // Seating: the cavea falls from the attic to the podium round the arena.
  const caveaRings = [CO.a / CO.A + 0.02, 0.58, 0.68, 0.77, 0.85, 0.93];
  const zAt = (sc) => 0.38 + ((sc - caveaRings[0]) / (0.93 - caveaRings[0])) * (CO.top - CO.attic - 0.38);
  const rough = clamp(k.radial),
    seats = clamp(k.cavea);
  if (rough > 0) {
    // The podium wall round the arena, facing in.
    const list = [];
    for (let i = 0; i < n; i++) {
      const tm = T(i + 0.5),
        nn = eNormal(tm).map((v) => -v);
      if (!facing(nn)) continue;
      list.push({ depth: 0, s: poly([P(...ePt(T(i), caveaRings[0], 0.05)), P(...ePt(T(i + 1), caveaRings[0], 0.05)), P(...ePt(T(i + 1), caveaRings[0], 0.38)), P(...ePt(T(i), caveaRings[0], 0.38))], shade(P, nn, TRAV)) });
    }
    for (let r = 0; r < caveaRings.length - 1; r++) {
      if (r / (caveaRings.length - 1) >= rough) break;
      for (let i = 0; i < n; i++) {
        const c = cell(ePt(T(i), caveaRings[r], zAt(caveaRings[r])), ePt(T(i + 1), caveaRings[r], zAt(caveaRings[r])), ePt(T(i + 1), caveaRings[r + 1], zAt(caveaRings[r + 1])), ePt(T(i), caveaRings[r + 1], zAt(caveaRings[r + 1])));
        if (!facing(c.n)) continue;
        const marble = (r + 0.5) / (caveaRings.length - 1) < seats;
        let e = poly(c.pts.map((p) => P(...p)), shade(P, c.n, marble ? SEATS : TUFA));
        if (detail >= 2 && marble) for (const f of [0.33, 0.66]) e += seg(P(...c.pts[0].map((v, j) => v + (c.pts[3][j] - v) * f)), P(...c.pts[1].map((v, j) => v + (c.pts[2][j] - v) * f)), "#a49c88", 0.5);
        if (!marble && detail >= 2 && i % 3 === 0) e += seg(P(...c.pts[0]), P(...c.pts[3]), "#8c8064", 0.7);
        list.push({ depth: 1 + c.depth, s: e });
      }
    }
    s += painted(list);
  }
  // The outer wall: piers first, then tier by tier with arches, then the attic.
  const piers = clamp(k.piers);
  const wallTop = CO.tier * (clamp(k.tiers0) + clamp(k.tiers1) + clamp(k.tiers2)) + CO.attic * clamp(k.attic);
  const top = [];
  for (let i = 0; i < n; i++) {
    const t0 = T(i),
      t1 = T(i + 1),
      nn = eNormal((t0 + t1) / 2);
    // Wall top: a ring all the way round.
    if (wallTop > 0.05) top.push(poly([P(...ePt(t0, 0.93, wallTop)), P(...ePt(t1, 0.93, wallTop)), P(...ePt(t1, 1, wallTop)), P(...ePt(t0, 1, wallTop))], TRAV[0]));
    // The travertine piers stand alone before the arches spring between them.
    if (piers > 0 && wallTop < CO.tier * 0.5 && quadrantDone(t0, piers)) {
      const [x, y] = ePt(t0, 0.985, 0);
      top.push(box(P, x - 0.05, y - 0.05, x + 0.05, y + 0.05, 0, CO.tier * 0.8, TRAV));
    }
    if (!facing(nn)) continue;
    let e = "";
    for (let tier = 0; tier < 4; tier++) {
      const z0 = tier * CO.tier,
        h = tier < 3 ? CO.tier : CO.attic,
        z1 = Math.min(z0 + h, wallTop);
      if (z1 <= z0) break;
      e += poly([P(...ePt(t0, 1, z0)), P(...ePt(t1, 1, z0)), P(...ePt(t1, 1, z1)), P(...ePt(t0, 1, z1))], shade(P, nn, TRAV));
      if (tier < 3 && z1 >= z0 + h * 0.9) {
        const statue = tier > 0 && k.statues > 0.3 && i % 2 === 0;
        e += archOn(P, t0, t1, z0, h, tier === 0 ? "#6b5d48" : "#5b4e3c");
        if (statue) e += circle(...P(...ePt((t0 + t1) / 2, 1.002, z0 + h * 0.35)), 1.6, "#f4f1ea");
        // Half-columns between the arches, and the cornice.
        if (detail >= 2) e += seg(P(...ePt(t0, 1.004, z0)), P(...ePt(t0, 1.004, z0 + h)), TRAV[0], 1.3) + seg(P(...ePt(t0, 1.006, z0 + h - 0.02)), P(...ePt(t1, 1.006, z0 + h - 0.02)), TRAV[2], 1.1);
      } else if (tier < 3 && z1 > z0) {
        // The arch under way, on its timber centering.
        e += archOn(P, t0, t1, z0, h, TIMBER[0]);
      }
      if (tier === 3 && z1 >= z0 + h * 0.9) {
        if (i % 2 === 0) e += archOn(P, t0 + (t1 - t0) * 0.3, t1 - (t1 - t0) * 0.3, z0 + 0.12, 0.16, "#5b4e3c");
        // Corbels for the velarium masts.
        if (detail >= 2) e += seg(P(...ePt((t0 + t1) / 2, 1.01, z0 + 0.06)), P(...ePt((t0 + t1) / 2, 1.04, z0 + 0.06)), TRAV[2], 1.6);
      }
    }
    top.push(e);
  }
  // Masts and the awning over the far seats.
  if (k.velarium > 0) {
    const masts = [];
    for (let i = 0; i < n; i += 2) masts.push(seg(P(...ePt(T(i), 0.97, CO.top)), P(...ePt(T(i), 0.97, CO.top + 0.4 * clamp(k.velarium * 2))), "#7a5630", 1));
    s += top.join("");
    s += masts.join("");
    if (k.velarium > 0.5) {
      const open = clamp((k.velarium - 0.5) * 2);
      for (let i = 0; i < n; i++) {
        const tm = T(i + 0.5);
        if (Math.cos(tm) + Math.sin(tm) > -0.2) continue;
        s += poly([P(...ePt(T(i), 0.97, CO.top + 0.38)), P(...ePt(T(i + 1), 0.97, CO.top + 0.38)), P(...ePt(T(i + 1), 0.97 - 0.32 * open, CO.top + 0.1)), P(...ePt(T(i), 0.97 - 0.32 * open, CO.top + 0.1))], i % 2 ? "#f2e6c8" : "#e8d8b0", 0.92);
      }
    }
  } else s += top.join("");
  // A treadwheel crane at the work, outside the front of the wall.
  if (k.piers > 0 && k.attic < 1 && !k.done) {
    const z = Math.max(0.5, wallTop + 0.35);
    s += treadwheelSVG(P, 2.25, 1.15, [1.85, 1.45, z + 0.3], [1.95, 1.4, Math.max(0.05, wallTop - 0.1), TRAV], time);
  }
  void lit;
  return s;
}
const COLOSSEUM_DONE = { drain: 1, foundation: 1, piers: 1, radial: 1, tiers0: 1, tiers1: 1, tiers2: 1, cavea: 1, attic: 1, arena: 1, velarium: 1, statues: 1, done: true };
export const COLOSSEUM = {
  system: "amphitheatre",
  ridge: 0.45,
  spec: () => ({ hw: 2, h: CO.top - 0.3, floors: 4, wall: { faces: TRAV, grain: "#bcac8b", pattern: "colosseum" }, roof: TRAV }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "drain", label: "Nero'nun yapay gölü boşaltılıyor", w: 0.8, cost: 2 },
    { key: "foundation", label: "Halka temel: 12 m derine Roma betonu, dört ekip dört çeyrekte", w: 1.2, cost: 6 },
    { key: "piers", label: "Traverten ayaklar: harçsız, demir kenetlerle", w: 1, cost: 5 },
    { key: "radial", label: "Işınsal duvarlar ve eğimli tonozlar: tüf ve tuğla kaplı beton", w: 1.2, cost: 6 },
    { key: "tiers", floor: 0, label: "1. kat kemerleri: Toskan düzeni", w: 1, cost: 5 },
    { key: "tiers", floor: 1, label: "2. kat kemerleri: İyon düzeni", w: 1, cost: 5 },
    { key: "tiers", floor: 2, label: "3. kat kemerleri: Korint düzeni", w: 1, cost: 5, inspect: "kemer taşları ve demir kenetler", next: "çatı katına geçilebilir" },
    { key: "attic", label: "Çatı katı: velarium direkleri için konsollar", w: 0.8, cost: 4 },
    { key: "cavea", label: "Oturma sıraları: tonozların üstüne mermer", w: 1, cost: 5 },
  ],
  frameEnd: 0.72,
  later: [
    { key: "arena", label: "Arena: ahşap döşeme ve kum", a: 0.72, b: 0.8, cost: 3 },
    { key: "velarium", label: "Velarium: 240 direk ve gölgelik", a: 0.8, b: 0.88, cost: 3 },
    { key: "statues", label: "Kemerlere heykeller", a: 0.88, b: 0.93, cost: 2 },
    { key: "handover", label: "Açılış: MS 80", a: 0.93, b: 1, cost: 2 },
  ],
  garden: false,
  live: true,
  scene: (P, sp, plan, shown, lit, time = 0) => colosseumSVG(P, progress(plan, shown), lit, 2, time),
  shadow: (P, sp, t) => castShadow(P, Array.from({ length: 16 }, (_, i) => [CO.A * Math.cos((i / 16) * Math.PI * 2), CO.Bb * Math.sin((i / 16) * Math.PI * 2)]), CO.top * 0.42 * t + 0.1),
  shadowFrom: "tiers",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, Array.from({ length: 16 }, (_, i) => [CO.A * Math.cos((i / 16) * Math.PI * 2), CO.Bb * Math.sin((i / 16) * Math.PI * 2)]), CO.top * 0.42 + 0.1) : "";
    return s + colosseumSVG(P, COLOSSEUM_DONE, lit, detail);
  },
  snow: () => "",
  workHeight: () => null,
  crew(sp, p, k) {
    const front = (z, tool, off = 0) => at(...ePt(Math.PI / 4 + off, 1.12, 0).slice(0, 2), z, tool);
    return (
      {
        drain: [front(0, "shovel"), front(0, "carry", 0.3)],
        foundation: [at(...ePt(Math.PI / 4, 0.75, 0).slice(0, 2), 0.02, "shovel"), at(...ePt(-Math.PI / 4, 0.75, 0).slice(0, 2), 0.02, "trowel")],
        piers: [front(0, "bar"), front(0, "carry", 0.3)],
        radial: [at(...ePt(-2.4, 0.7, 0).slice(0, 2), 0.6, "trowel"), front(0, "carry")],
        tiers: [at(...ePt(Math.PI / 4 - 0.2, 0.96, 0).slice(0, 2), CO.tier * (p.floor + k * 0.8), "trowel"), front(0, "carry", 0.35)],
        attic: [at(...ePt(Math.PI / 4 - 0.2, 0.96, 0).slice(0, 2), 3 * CO.tier, "hammer")],
        cavea: [at(...ePt(-2.3, 0.6 + 0.3 * k, 0).slice(0, 2), 0.4 + 0.9 * k, "trowel")],
        arena: [at(0.2, 0.1, 0.05, "carry"), at(-0.3, -0.1, 0.05, "shovel")],
      }[p.key] || null
    );
  },
  // The real Colosseum: about 100,000 m³ of travertine, 300 t of iron clamps.
  metraj(sp, p, k) {
    if (["piers", "tiers", "attic"].includes(p.key)) return { trav: k * ({ piers: 18000, tiers: 16000, attic: 12000 }[p.key]) };
    if (p.key === "cavea") return { trav: k * 22000 };
    return null;
  },
  items: (q) => [`Traverten ${thousands(q.trav || 0)} m³`, `Demir kenet ${Math.round(((q.trav || 0) / 100000) * 300)} t`],
};

// =====================================================================
// Pisa kulesi: a ring foundation only 3 m deep on soft clay. It began to
// lean at the third floor; the work stopped for almost a century, which
// let the clay consolidate and saved it. The masons then built the upper
// floors taller on the low side, so the tower is slightly bent. The bell
// chamber came in 1372; the lean grew to 5.5° until soil was drawn from
// under the north side (1999–2001), bringing it back to 3.97°.
// =====================================================================
const PI_ = { R: 0.62, ground: 0.95, floor: 0.56, floors: 6, bellR: 0.44, bell: 0.55, z0: 0.3 };
PI_.top = PI_.z0 + PI_.ground + PI_.floors * PI_.floor;
const MARBLE = ["#f6f3ec", "#e2ddd1", "#c7c0b1"],
  SHADE_IN = "#7d7466";
// The tower's axis: lean grows with height; floors above the third are bent
// back towards the vertical by the masons' correction.
function axisAt(z, lean, bend) {
  const h = z - PI_.z0,
    third = PI_.ground + 2 * PI_.floor,
    tilt = Math.tan((lean * Math.PI) / 180) * h - (h > third ? bend * ((h - third) / (PI_.top - PI_.z0 - third)) ** 2 * 0.12 : 0);
  // Leaning across the view (south-east on the plot) so the lean reads on screen.
  return [tilt * 0.75, -tilt * 0.66];
}
function ringPts(z, r, lean, bend, n = 24) {
  const [ox, oy] = axisAt(z, lean, bend);
  return Array.from({ length: n + 1 }, (_, i) => [ox + r * Math.cos((i / n) * Math.PI * 2), oy + r * Math.sin((i / n) * Math.PI * 2), z]);
}
function drumSVG(P, z0, z1, r, lean, bend, kind, lit, detail) {
  const n = 24,
    lo = ringPts(z0, r, lean, bend, n),
    hi = ringPts(z1, r, lean, bend, n);
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2,
      nn = [Math.cos(a), Math.sin(a), 0];
    if (!facing(nn)) continue;
    s += poly([P(...lo[i]), P(...lo[i + 1]), P(...hi[i + 1]), P(...hi[i])], shade(P, nn, MARBLE));
    if (detail < 1) continue;
    const pt = (u, f) => P(...lo[i].map((v, j) => v + (lo[i + 1][j] - v) * u + ((hi[i][j] + (hi[i + 1][j] - hi[i][j]) * u) - (v + (lo[i + 1][j] - v) * u)) * f));
    if (kind === "gallery") {
      // An open loggia: dark behind a slender column and its arch.
      s += poly([pt(0.08, 0.12), pt(0.92, 0.12), pt(0.92, 0.62), pt(0.75, 0.8), pt(0.5, 0.86), pt(0.25, 0.8), pt(0.08, 0.62)], lit ? mix(SHADE_IN, "#ffd36e", 0.5) : SHADE_IN);
      s += seg(pt(0.04, 0.1), pt(0.04, 0.66), MARBLE[0], 1.3);
    } else if (kind === "blind") s += poly([pt(0.15, 0.08), pt(0.85, 0.08), pt(0.85, 0.66), pt(0.5, 0.86), pt(0.15, 0.66)], shade(P, nn, ["#e9e4d8", "#d2ccbe", "#b8b1a2"]));
    else if (kind === "bell" && i % 3 === 0) s += poly([pt(0.2, 0.15), pt(0.8, 0.15), pt(0.8, 0.65), pt(0.5, 0.85), pt(0.2, 0.65)], "#4f4537");
    if (detail >= 2) s += seg(pt(0, 0.97), pt(1, 0.97), MARBLE[2], 1);
  }
  return s;
}
function pisaSVG(P, k, lit = false, detail = 2, time = 0) {
  let s = "";
  const lean = 0.2 * clamp(k.floors0) + 1.4 * clamp(k.floors1) + 0.9 * clamp(k.bellChamber) + 2.95 * clamp(k.creep) - 1.48 * clamp(k.stabilize),
    shown = lean * 2.2,
    bend = clamp(k.floors1);
  // Shallow ring foundation on clay.
  if (k.found > 0) {
    const d = 0.25;
    s += poly(Array.from({ length: 24 }, (_, i) => P(0.9 * Math.cos((i / 24) * Math.PI * 2), 0.9 * Math.sin((i / 24) * Math.PI * 2), 0.006)), k.found < 1 ? "#8a6a48" : "#b8b1a2");
    if (k.found < 1) s += poly(Array.from({ length: 24 }, (_, i) => P(0.75 * Math.cos((i / 24) * Math.PI * 2), 0.75 * Math.sin((i / 24) * Math.PI * 2), -d * clamp(k.found * 2))), "#6e5236");
  }
  // Lead counterweights on the north side, and the drill rods drawing soil.
  if (k.stabilize > 0 && k.stabilize < 1) {
    s += box(P, -0.95, 0.35, -0.55, 0.75, 0, 0.3 * clamp(k.stabilize * 3), ["#8a9099", "#737a83", "#5f656d"]);
    for (const d of [-0.35, 0, 0.35]) s += seg(P(-1.35 + d, 1.0 + d, 0.45), P(-0.6 + d * 0.5, 0.6 + d * 0.5, -0.1), "#3c4146", 1.2);
  }
  // Ground floor, six galleried floors, the bell chamber: each as built.
  const floors = [
    [PI_.z0, PI_.z0 + PI_.ground, "blind", clamp(k.floors0 * 3)],
    ...Array.from({ length: PI_.floors }, (_, i) => {
      const z0 = PI_.z0 + PI_.ground + i * PI_.floor,
        built = i < 2 ? clamp(k.floors0 * 3 - (i + 1)) : clamp(k.floors1 * 4 - (i - 2));
      return [z0, z0 + PI_.floor, "gallery", built];
    }),
  ];
  for (const [z0, z1, kind, t] of floors) {
    if (t <= 0) break;
    s += drumSVG(P, z0, z0 + (z1 - z0) * t, PI_.R, shown, bend, t < 1 ? "plain" : kind, lit, detail);
  }
  const bellT = clamp(k.bellChamber);
  if (bellT > 0) {
    const z0 = PI_.top;
    // The roof of the last gallery round the bell chamber's foot.
    s += poly(ringPts(z0, PI_.R + 0.04, shown, bend).map((p) => P(...p)), MARBLE[1]);
    s += drumSVG(P, z0, z0 + PI_.bell * bellT, PI_.bellR, shown, bend, bellT < 1 ? "plain" : "bell", lit, detail);
    if (bellT >= 1) {
      s += poly(ringPts(z0 + PI_.bell, PI_.bellR + 0.03, shown, bend).map((p) => P(...p)), MARBLE[0]);
      if (k.bells > 0.5) {
        const [ox, oy] = axisAt(z0 + PI_.bell * 0.5, shown, bend);
        s += circle(...P(ox + PI_.bellR * 0.72, oy + PI_.bellR * 0.72, z0 + PI_.bell * 0.45), 2.4, "#8f6a2c");
      }
    }
  } else if (floors.at(-1)[3] >= 1) s += poly(ringPts(PI_.top, PI_.R, shown, bend).map((p) => P(...p)), MARBLE[1]);
  // A treadwheel crane lifting the next stones while the tower rises.
  const working = ["floors0", "floors1", "bellChamber"].some((key) => k[key] > 0 && k[key] < 1);
  if (working) {
    const hgt = PI_.z0 + PI_.ground * clamp(k.floors0 * 3) + PI_.floor * (clamp(k.floors0 * 3 - 1) + clamp(k.floors0 * 3 - 2) + clamp(k.floors1) * 4) + PI_.bell * bellT;
    const [ox, oy] = axisAt(hgt, shown, bend);
    s += treadwheelSVG(P, 1.25, 0.9, [ox + 0.45, oy + 0.35, hgt + 0.6], [ox + 0.4, oy + 0.3, hgt - 0.2, MARBLE], time);
  }
  return s;
}
const PISA_DONE = { found: 1, floors0: 1, pause: 1, floors1: 1, bellChamber: 1, bells: 1, creep: 1, stabilize: 1 };
export const PISA = {
  system: "leaning",
  ridge: 0.7,
  spec: () => ({ hw: 1.45, h: PI_.top - 0.3, floors: 8, wall: { faces: MARBLE, grain: "#c7c0b1", pattern: "pisa" }, roof: MARBLE }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "found", label: "Halka temel (1173): yumuşak kil üstünde yalnızca 3 m", w: 0.8, cost: 3 },
    { key: "floors0", label: "Zemin ve ilk iki kat: mermer kaplama, moloz dolgu", w: 1.5, cost: 7 },
    { key: "pause", label: "1178: kule eğildi, savaşlar yüzünden inşaat 94 yıl duruyor", w: 0.8, cost: 1, inspect: "eğim 0,2°: duraklama kilin sıkışmasına zaman verdi", next: "inşaata devam edilebilir" },
    { key: "floors1", label: "4-7. katlar (1272-1278): alçak yan daha yüksek örülerek düzeltme", w: 1.6, cost: 7 },
    { key: "bellChamber", label: "Çan katı (1372)", w: 0.8, cost: 3 },
  ],
  frameEnd: 0.7,
  later: [
    { key: "bells", label: "Yedi çan asılıyor", a: 0.7, b: 0.76, cost: 2 },
    { key: "creep", label: "Altı yüzyıl: eğim yavaş yavaş 5,5°'ye çıkıyor", a: 0.76, b: 0.82, cost: 0 },
    { key: "stabilize", label: "1999-2001: kuzey yanının altından toprak çekiliyor", a: 0.82, b: 0.93, cost: 4, inspect: "eğim 3,97°: kule en az 200 yıl güvende", next: "ziyarete açılabilir" },
    { key: "handover", label: "Mucizeler Meydanı: çimler ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  live: true,
  scene: (P, sp, plan, shown, lit, time = 0) => pisaSVG(P, progress(plan, shown), lit, 2, time),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-0.6, -0.6, 0.6, 0.6), PI_.top * 0.42 * t + 0.2),
  shadowFrom: "floors0",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(-0.6, -0.6, 0.6, 0.6), PI_.top * 0.42 + 0.2) : "";
    return s + pisaSVG(P, PISA_DONE, lit, detail);
  },
  snow: () => "",
  workHeight: () => null,
  crew(sp, p, k) {
    if (p.key === "found") return [at(0.9, 0.9, 0, "shovel"), at(-0.2, 1.0, 0, "carry")];
    if (["floors0", "floors1", "bellChamber"].includes(p.key)) {
      const z = p.key === "floors0" ? PI_.z0 + (PI_.ground + 2 * PI_.floor) * k : p.key === "floors1" ? PI_.z0 + PI_.ground + 2 * PI_.floor + 4 * PI_.floor * k : PI_.top;
      return [at(0.2, 0.25, Math.min(z, PI_.top), "trowel"), at(1.1, 0.4, 0, "carry")];
    }
    if (p.key === "stabilize") return [at(-1.1, 1.15, 0, "survey"), at(-0.3, 1.15, 0, "bar")];
    if (p.key === "pause") return [at(0.9, 0.9, 0, "survey")];
    return null;
  },
  // The real tower: about 14,500 t; the lean, in degrees, as it changed.
  metraj(sp, p, k) {
    const add = { floors0: { t: 5200, lean: 0.2 }, floors1: { t: 6800, lean: 1.4 }, bellChamber: { t: 2500, lean: 0.9 }, creep: { lean: 2.95 }, stabilize: { lean: -1.48 } }[p.key];
    return add ? { weight: k * (add.t || 0), lean: k * add.lean } : null;
  },
  items: (q, num) => [`Eğim ${num(Math.max(0, q.lean || 0), 2)}°`, `Ağırlık ${thousands(q.weight || 0)} t`],
};

// Famous buildings, second group (n38): Süleymaniye, the Galata Tower and
// Anıtkabir, built in their real order. Quantities count the real buildings.
import { box, circle, poly, seg } from "./iso.js";
import { at, castShadow, clamp, domeProfile, facing, lathe, mix, mixAll, painted, progress, rectOutline, shade } from "./kit.js";
import { treadwheelSVG } from "./landmarks1.js";

const WARM = "#ffd36e";
const windowFill = (lit) => (lit ? mix("#5a5246", WARM, 0.7) : "#5a5246");

// =====================================================================
// Süleymaniye (Mimar Sinan, 1550-1557): a deep rubble foundation left to
// settle, walls of küfeki stone held by iron clamps set in lead, four
// elephant piers and four great arches, the two semi-domes on the mihrab
// axis, the side aisles under small domes, then the main dome (26.5 m
// across, 53 m high) on timber centering. Lead sheathing, the courtyard
// and four minarets with ten balconies: Süleyman was the tenth sultan.
// =====================================================================
const SU = { x0: -2.0, x1: 0.5, y: 1.1, wall: 0.75, cx: -0.75, R: 0.62, base: 1.25, drum: 0.14, domeH: 0.5 };
const KUFEKI = ["#efe8da", "#d9cfbd", "#bcb19c"],
  LEAD = ["#a9b1b8", "#8d959d", "#6f777f"],
  BRICK = ["#d39a73", "#b98059", "#9a6643"],
  GOLDEN = "#d9b24a";
const MINARETS = [
  { x: 0.62, y: -0.95, h: 2.3, balconies: [1.35, 1.72, 2.05] },
  { x: 1.85, y: -0.95, h: 1.9, balconies: [1.35, 1.68] },
  { x: 0.62, y: 0.95, h: 2.3, balconies: [1.35, 1.72, 2.05] },
  { x: 1.85, y: 0.95, h: 1.9, balconies: [1.35, 1.68] },
];
function minaretSVG(P, m, t, roof) {
  const top = 0.32 + (m.h - 0.32) * t;
  let s = box(P, m.x - 0.09, m.y - 0.09, m.x + 0.09, m.y + 0.09, 0, Math.min(0.32, top + 0.01), KUFEKI);
  if (t <= 0) return s;
  s += lathe(P, m.x, m.y, [[0.065, 0.32], [0.06, m.h]], KUFEKI, { n: 12, upto: top });
  for (const z of m.balconies) if (z < top) s += lathe(P, m.x, m.y, [[0.06, z - 0.05], [0.11, z], [0.11, z + 0.025], [0.065, z + 0.026]], KUFEKI, { n: 12 });
  if (t >= 1) {
    s += lathe(P, m.x, m.y, [[0.07, m.h], [0.002, m.h + 0.34]], roof, { n: 12 });
    s += seg(P(m.x, m.y, m.h + 0.34), P(m.x, m.y, m.h + 0.42), GOLDEN, 1.2);
  }
  return s;
}
function suleymaniyeSVG(P, k, lit = false, detail = 2, time = 0) {
  let s = "";
  const lead = clamp(k.lead * 1.5),
    roof = mixAll(BRICK, LEAD, lead);
  if (k.found > 0) {
    s += poly([P(SU.x0, -SU.y, 0.005), P(SU.x1, -SU.y, 0.005), P(SU.x1, SU.y, 0.005), P(SU.x0, SU.y, 0.005)], k.found < 1 ? "#8a6a48" : "#cfc5b2");
    if (k.found < 1) for (let x = SU.x0 + 0.2; x < SU.x1; x += 0.45) s += box(P, x, -SU.y, x + 0.25, -SU.y + 0.2, 0, 0.12 * k.found, KUFEKI);
  }
  // Courtyard ground and the far minarets come before the mosque's front.
  if (k.court > 0) s += poly([P(0.55, -0.85, 0.006), P(1.95, -0.85, 0.006), P(1.95, 0.85, 0.006), P(0.55, 0.85, 0.006)], "#e3dccb");
  // Beden duvarları with two rows of windows.
  const h = SU.wall * (clamp(k.walls0) * 0.5 + clamp(k.walls1) * 0.5);
  if (h > 0) {
    s += box(P, SU.x0, -SU.y, SU.x1, SU.y, 0, h, KUFEKI);
    if (detail >= 1)
      for (const z of [0.18, 0.48]) {
        if (h < z + 0.16) continue;
        for (let x = SU.x0 + 0.18; x < SU.x1 - 0.1; x += 0.27) s += poly([P(x, SU.y + 0.002, z), P(x + 0.1, SU.y + 0.002, z), P(x + 0.1, SU.y + 0.002, z + 0.12), P(x + 0.05, SU.y + 0.002, z + 0.16), P(x, SU.y + 0.002, z + 0.12)], windowFill(lit));
        for (let y = -SU.y + 0.18; y < SU.y - 0.1; y += 0.3) s += poly([P(SU.x1 + 0.002, y, z), P(SU.x1 + 0.002, y + 0.1, z), P(SU.x1 + 0.002, y + 0.1, z + 0.12), P(SU.x1 + 0.002, y + 0.05, z + 0.16), P(SU.x1 + 0.002, y, z + 0.12)], windowFill(lit));
      }
    if (h >= SU.wall && detail >= 2) s += seg(P(SU.x0, SU.y + 0.004, SU.wall - 0.03), P(SU.x1, SU.y + 0.004, SU.wall - 0.03), KUFEKI[2], 1.2) + seg(P(SU.x1 + 0.004, -SU.y, SU.wall - 0.03), P(SU.x1 + 0.004, SU.y, SU.wall - 0.03), KUFEKI[2], 1.2);
  }
  const { cx, R, wall, base } = SU;
  const semi = (side) => {
    const t = clamp(k.semi);
    if (t <= 0) return "";
    const from = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    return lathe(P, cx + side * R, 0, domeProfile(R, wall, base - wall), roof, { n: 12, from, to: from + Math.PI, upto: wall + (base - wall) * t });
  };
  // The great arches: a tympanum wall on each side of the central square.
  const archWall = (side, axis) => {
    const t = clamp(k.piers);
    if (t <= 0) return "";
    const z1 = wall + (base - wall) * t,
      pt = (u, z) => (axis === "x" ? P(cx + side * R, u, z) : P(cx + u, side * R, z));
    let e = poly([pt(-R, wall), pt(R, wall), pt(R, z1), pt(-R, z1)], shade(P, axis === "x" ? [side, 0, 0] : [0, side, 0], KUFEKI));
    if (t >= 1 && detail >= 1 && side > 0) for (let i = -2; i <= 2; i++) for (const z of [wall + 0.12, wall + 0.3]) e += poly([pt(i * 0.2 - 0.05, z), pt(i * 0.2 + 0.05, z), pt(i * 0.2 + 0.05, z + 0.1), pt(i * 0.2 - 0.05, z + 0.1)], windowFill(lit));
    return e;
  };
  const turret = (x, y) => {
    const t = clamp(k.piers);
    if (t <= 0) return "";
    const top = wall + (1.42 - wall) * t;
    let e = lathe(P, x, y, [[0.1, wall], [0.1, 1.42]], KUFEKI, { n: 8, upto: top });
    if (t >= 1) e += lathe(P, x, y, domeProfile(0.1, 1.42, 0.09, 3), roof, { n: 8 });
    return e;
  };
  const aisles = (side) => {
    const t = clamp(k.aisles);
    let e = "";
    for (let i = 0, x = SU.x0 + 0.3; x < SU.x1 - 0.1; i++, x += 0.42) if (i / 6 < t) e += lathe(P, x, side * 0.86, domeProfile(0.17, wall, 0.17, 4), roof, { n: 10 });
    return e;
  };
  if (h >= SU.wall) {
    s += semi(-1) + archWall(-1, "x") + archWall(-1, "y") + turret(cx - R, -R) + turret(cx + R, -R) + turret(cx - R, R) + aisles(-1);
    // Drum with its 32 windows, then the dome on its timber centering.
    const dome = clamp(k.dome);
    if (dome > 0) {
      s += lathe(P, cx, 0, [[R * 0.97, base], [R * 0.97, base + SU.drum]], KUFEKI, { n: 32, upto: base + SU.drum * clamp(dome * 4) });
      if (dome > 0.25 && detail >= 1)
        for (let i = 0; i < 32; i++) {
          const a = ((i + 0.5) / 32) * Math.PI * 2;
          if (Math.cos(a) + Math.sin(a) < 0.3) continue;
          const c = (r, z) => P(cx + r * Math.cos(a), r * Math.sin(a), z);
          s += seg(c(R * 0.975, base + 0.03), c(R * 0.975, base + SU.drum - 0.03), windowFill(lit), 2.2);
        }
      const z0 = base + SU.drum;
      if (dome > 0.25) s += lathe(P, cx, 0, domeProfile(R, z0, SU.domeH), roof, { n: 32, upto: z0 + SU.domeH * clamp((dome - 0.25) / 0.75) });
      if (dome < 1)
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          s += seg(P(cx + R * 0.8 * Math.cos(a), R * 0.8 * Math.sin(a), base), P(cx + R * 0.5 * Math.cos(a), R * 0.5 * Math.sin(a), z0 + SU.domeH * dome), "#ad7f48", 1);
        }
      if (lead > 0.5) s += seg(P(cx, 0, z0 + SU.domeH), P(cx, 0, z0 + SU.domeH + 0.16), GOLDEN, 1.6) + circle(...P(cx, 0, z0 + SU.domeH + 0.12), 1.8, GOLDEN);
    }
    s += archWall(1, "y") + archWall(1, "x") + aisles(1) + turret(cx + R, R) + semi(1);
  }
  // Minarets on the far side, the courtyard, then the near minarets.
  const mt = clamp(k.minarets);
  for (const m of MINARETS.slice(0, 2)) if (mt > 0) s += minaretSVG(P, m, mt, roof);
  if (k.court > 0) {
    const c = clamp(k.court * 1.4);
    const revak = (x0, y0, x1, y1) => {
      let e = box(P, x0, y0, x1, y1, 0, 0.28 * c, KUFEKI);
      if (c >= 1) {
        const along = x1 - x0 > y1 - y0;
        for (let u = 0.1; u < (along ? x1 - x0 : y1 - y0) - 0.05; u += 0.2) e += lathe(P, along ? x0 + u : (x0 + x1) / 2, along ? (y0 + y1) / 2 : y0 + u, domeProfile(0.075, 0.28, 0.07, 3), roof, { n: 8 });
      }
      return e;
    };
    s += revak(0.55, -0.85, 1.95, -0.68) + revak(0.55, -0.68, 0.72, 0.68);
    if (c >= 1) s += lathe(P, 1.25, 0, [[0.13, 0], [0.13, 0.12]], KUFEKI, { n: 8 }) + lathe(P, 1.25, 0, domeProfile(0.15, 0.16, 0.1, 3), roof, { n: 8 }) + seg(P(1.25, 0, 0.12), P(1.25, 0, 0.16), KUFEKI[2], 1);
    let near = revak(1.78, -0.68, 1.95, 0.68) + revak(0.55, 0.68, 1.95, 0.85);
    if (c >= 1 && detail >= 1) {
      for (let y = -0.55; y < 0.6; y += 0.2) near += poly([P(1.952, y, 0.03), P(1.952, y + 0.12, 0.03), P(1.952, y + 0.12, 0.17), P(1.952, y + 0.06, 0.22), P(1.952, y, 0.17)], "#6b6152");
      for (let x = 0.65; x < 1.9; x += 0.2) near += poly([P(x, 0.852, 0.03), P(x + 0.12, 0.852, 0.03), P(x + 0.12, 0.852, 0.17), P(x + 0.06, 0.852, 0.22), P(x, 0.852, 0.17)], "#6b6152");
    }
    s += near;
  }
  for (const m of MINARETS.slice(2)) if (mt > 0) s += minaretSVG(P, m, mt, roof);
  // A treadwheel crane while the stone goes up.
  const working = ["walls0", "walls1", "piers", "semi", "dome"].find((key) => k[key] > 0 && k[key] < 1);
  if (working && !k.done) {
    const z = working.startsWith("walls") ? h + 0.3 : working === "dome" ? base + 0.6 : base + 0.2;
    s += treadwheelSVG(P, 1.2, 1.4, [0.4, 1.05, z + 0.3], [0.45, 1.0, Math.max(0.05, z - 0.4), KUFEKI], time);
  }
  return s;
}
const SULEYMANIYE_DONE = { found: 1, walls0: 1, walls1: 1, piers: 1, semi: 1, aisles: 1, dome: 1, minarets: 1, lead: 1, court: 1, interior: 1, done: true };
export const SULEYMANIYE = {
  system: "mosque",
  ridge: 0.6,
  spec: () => ({ hw: 2, h: SU.base + SU.drum + SU.domeH - 0.3, floors: 2, wall: { faces: KUFEKI, grain: "#bcb19c", pattern: "mosque" }, roof: LEAD }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "found", label: "Temel: derin moloz taş, oturması için bekletiliyor", w: 1, cost: 4 },
    { key: "walls", floor: 0, label: "Beden duvarları: küfeki taşı, kurşunla dökülmüş demir kenetler", w: 1.2, cost: 5 },
    { key: "walls", floor: 1, label: "Beden duvarları 2/2: alt ve üst sıra pencereler", w: 1, cost: 4 },
    { key: "piers", label: "Dört fil ayağı ve dört büyük kemer", w: 1.2, cost: 5, inspect: "fil ayakları ve kemer kilit taşları", next: "kubbeye geçilebilir" },
    { key: "semi", label: "İki yarım kubbe: mihrap ekseninde", w: 1, cost: 4 },
    { key: "aisles", label: "Yan sahınlar: küçük kubbeler", w: 0.8, cost: 3 },
    { key: "dome", label: "Ana kubbe: 26,5 m çap, tuğla, ahşap iskele üstünde", w: 1.4, cost: 6, inspect: "kubbe eteğinde çatlak yok, 32 pencere", next: "kurşun kaplanabilir" },
    { key: "minarets", label: "Dört minare, on şerefe: Kanuni onuncu padişah", w: 1.2, cost: 5 },
  ],
  frameEnd: 0.7,
  later: [
    { key: "lead", label: "Kurşun kaplama ve alemler", a: 0.7, b: 0.77, cost: 3 },
    { key: "court", label: "Avlu: revaklar ve şadırvan", a: 0.77, b: 0.85, cost: 3 },
    { key: "interior", label: "İznik çinileri; is odası kandil isinden mürekkep yapıyor", a: 0.85, b: 0.93, cost: 3 },
    { key: "handover", label: "Açılış: 1557", a: 0.93, b: 1, cost: 2 },
  ],
  garden: false,
  live: true,
  scene: (P, sp, plan, shown, lit, time = 0) => suleymaniyeSVG(P, progress(plan, shown), lit, 2, time),
  shadow: (P, sp, t) => castShadow(P, rectOutline(SU.x0, -SU.y, SU.x1, SU.y), 0.9 * t + 0.1),
  shadowFrom: "walls",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(SU.x0, -SU.y, 1.95, SU.y), 1.0) : "";
    return s + suleymaniyeSVG(P, SULEYMANIYE_DONE, lit, detail);
  },
  snow: () => "",
  workHeight: () => null,
  crew(sp, p, k) {
    if (p.key === "found") return [at(-1.2 + 1.4 * k, SU.y + 0.2, 0, "shovel"), at(0.7, 0.4, 0, "carry")];
    if (p.key === "walls") return [at(-1.4 + 1.6 * k, SU.y - 0.05, SU.wall * (p.floor + k) * 0.5, "trowel"), at(0.8, 1.3, 0, "carry")];
    if (["piers", "semi", "aisles"].includes(p.key)) return [at(SU.cx + 0.4, SU.R + 0.1, SU.wall, "trowel"), at(-0.2, 0.9, SU.wall, "carry")];
    if (p.key === "dome") return [at(SU.cx + 0.45, 0.3, SU.base + 0.1 + 0.4 * k, "trowel"), at(SU.cx + 0.6, 0.62, SU.base, "carry")];
    if (p.key === "minarets") return [at(0.75, 0.8, 0, "bar"), at(1.7, 0.8, 0, "carry")];
    if (p.key === "lead") return [at(SU.cx + 0.3, 0.3, SU.base + 0.4, "hammer")];
    if (p.key === "court") return [at(1.25, 0.3, 0, "trowel"), at(1.0, -0.3, 0, "carry")];
    return null;
  },
  // The real mosque: the dome's crown at 53 m; ten balconies on four minarets.
  metraj(sp, p, k) {
    const rise = { walls: 8, piers: 14, semi: 5, dome: 18 }[p.key];
    if (rise) return { height: k * rise };
    if (p.key === "minarets") return { serefe: k * 10 };
    return null;
  },
  items: (q) => [`Kubbe tepesi ${Math.round(q.height || 0)} m`, `Şerefe ${Math.floor((q.serefe || 0) + 1e-9)}/10`],
};

// =====================================================================
// Galata Kulesi: the Genoese Christea Turris (1348), rubble stone 3.75 m
// thick at the foot, timber floors, stone corbels carrying the balcony,
// the arched top floor and the conical cap. The storm of 1875 tore the
// cap off; the 1965-67 restoration put it back on a concrete frame.
// =====================================================================
const GA = { R: 0.58, z0: 0.3, body: 2.55, top: 0.5, roof: 0.95 };
GA.zb = GA.z0 + GA.body;
GA.zt = GA.zb + 0.05 + GA.top;
const RUBBLE = ["#ddd5c6", "#c3baa9", "#a59c8a"],
  SLATE = ["#7f8a94", "#66717b", "#515b64"];
const SLITS = [[0.7, 0.4], [1.0, 1.1], [1.35, 0.25], [1.7, 0.95], [2.05, 0.5], [2.35, 1.2], [0.95, -0.2], [1.85, 1.45], [2.2, 0.1]];
function galataSVG(P, k, lit = false, detail = 2, time = 0) {
  let s = "";
  const { R, z0, zb, zt } = GA;
  if (k.found > 0) {
    s += poly(Array.from({ length: 24 }, (_, i) => P(1.0 * Math.cos((i / 24) * Math.PI * 2), 1.0 * Math.sin((i / 24) * Math.PI * 2), 0.006)), k.found < 1 ? "#8a6a48" : "#b9b0a0");
    s += lathe(P, 0, 0, [[R + 0.1, 0], [R + 0.1, z0]], RUBBLE, { n: 24, upto: z0 * clamp(k.found) });
  }
  const body = (clamp(k.body0) + clamp(k.body1) + clamp(k.body2)) / 3;
  if (body > 0) {
    const top = z0 + GA.body * body;
    s += lathe(P, 0, 0, [[R, z0], [R * 0.97, zb]], RUBBLE, { n: 24, upto: top });
    if (detail >= 1)
      for (const [z, a] of SLITS) {
        if (z0 + z + 0.12 > top || Math.cos(a) + Math.sin(a) < 0.25) continue;
        const r = R * 0.985;
        s += seg(P(r * Math.cos(a), r * Math.sin(a), z0 + z), P(r * Math.cos(a), r * Math.sin(a), z0 + z + 0.13), windowFill(lit), 2.4);
      }
    if (detail >= 2) for (let z = z0 + 0.62; z < top; z += 0.62) s += lathe(P, 0, 0, [[R * 0.99 + 0.012, z], [R * 0.99 + 0.012, z + 0.025]], RUBBLE.map((c) => mix(c, "#8a8172", 0.25)), { n: 24 });
  }
  // Corbels and the balcony round the top floor.
  if (k.gallery > 0) {
    const g = clamp(k.gallery);
    s += lathe(P, 0, 0, [[R * 0.97, zb - 0.14], [R + 0.16, zb], [R + 0.16, zb + 0.04], [R * 0.95, zb + 0.05]], RUBBLE, { n: 24, upto: zb - 0.14 + 0.19 * g });
    if (g >= 1 && detail >= 1)
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        if (Math.cos(a) + Math.sin(a) < -0.2) continue;
        s += seg(P((R + 0.14) * Math.cos(a), (R + 0.14) * Math.sin(a), zb + 0.04), P((R + 0.14) * Math.cos(a), (R + 0.14) * Math.sin(a), zb + 0.15), "#4a4a4a", 0.7);
      }
  }
  if (k.top > 0) {
    const t = clamp(k.top);
    s += lathe(P, 0, 0, [[R * 0.88, zb + 0.05], [R * 0.88, zt]], RUBBLE, { n: 24, upto: zb + 0.05 + GA.top * t });
    if (t >= 1 && detail >= 1)
      for (let i = 0; i < 12; i++) {
        const a = ((i + 0.5) / 12) * Math.PI * 2;
        if (Math.cos(a) + Math.sin(a) < 0.3) continue;
        const r = R * 0.885,
          w = 0.09,
          c = (da, z) => P(r * Math.cos(a + da), r * Math.sin(a + da), z);
        s += poly([c(-w, zb + 0.12), c(w, zb + 0.12), c(w, zb + 0.4), c(0, zb + 0.46), c(-w, zb + 0.4)], windowFill(lit));
      }
  }
  // The cap: built, torn off in 1875, back in 1967.
  const capGone = k.storm > 0.5 && k.restore < 0.6;
  if (k.roof > 0 && !capGone) {
    const t = k.restore > 0 ? clamp((k.restore - 0.6) / 0.4) : clamp(k.roof);
    s += lathe(P, 0, 0, [[R * 0.98, zt], [R * 0.93, zt + 0.06], [0.01, zt + GA.roof]], SLATE, { n: 24, upto: zt + GA.roof * t });
    if (t >= 1) s += seg(P(0, 0, zt + GA.roof), P(0, 0, zt + GA.roof + 0.14), "#c9a84a", 1.4);
  } else if (k.top >= 1) s += poly(Array.from({ length: 24 }, (_, i) => P(R * 0.88 * Math.cos((i / 24) * Math.PI * 2), R * 0.88 * Math.sin((i / 24) * Math.PI * 2), zt)), capGone ? "#8f877a" : RUBBLE[1]);
  // The 1965 scaffold round the top.
  if (k.restore > 0 && k.restore < 1)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2,
        r = R + 0.28;
      s += seg(P(r * Math.cos(a), r * Math.sin(a), zb - 0.4), P(r * Math.cos(a), r * Math.sin(a), zt + 0.5), "#8f6638", 1);
      if (i % 2 === 0) s += seg(P(r * Math.cos(a), r * Math.sin(a), zt + 0.1), P(r * Math.cos(a + Math.PI / 4), r * Math.sin(a + Math.PI / 4), zt + 0.1), "#8f6638", 0.8);
    }
  const working = ["body0", "body1", "body2", "gallery", "top", "roof"].find((key) => k[key] > 0 && k[key] < 1);
  if (working && !k.storm) {
    const hgt = Math.min(zt + 0.2, z0 + GA.body * body + (k.gallery > 0 ? 0.2 : 0) + GA.top * clamp(k.top));
    s += treadwheelSVG(P, 1.2, 0.8, [0.75, 0.55, hgt + 0.5], [0.72, 0.5, Math.max(0.05, hgt - 0.3), RUBBLE], time);
  }
  return s;
}
const GALATA_DONE = { found: 1, body0: 1, body1: 1, body2: 1, gallery: 1, top: 1, roof: 1, storm: 1, restore: 1, lights: 1 };
export const GALATA = {
  system: "genoese",
  ridge: 0.6,
  spec: () => ({ hw: 1.2, h: GA.zt - 0.3, floors: 9, wall: { faces: RUBBLE, grain: "#a59c8a", pattern: "galata" }, roof: SLATE }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "found", label: "Temel (1348): kayaya oturan moloz taş", w: 0.8, cost: 3 },
    { key: "body", floor: 0, label: "Gövde 1/3: dipte 3,75 m kalın moloz taş duvar", w: 1.2, cost: 5 },
    { key: "body", floor: 1, label: "Gövde 2/3: ahşap kat döşemeleri, mazgal pencereler", w: 1.1, cost: 4 },
    { key: "body", floor: 2, label: "Gövde 3/3: Cenevizlilerin Christea Turris'i", w: 1, cost: 4 },
    { key: "gallery", label: "Taş konsollar ve seyir balkonu", w: 0.7, cost: 3, inspect: "konsol taşları ve balkon korkuluğu", next: "seyir katı örülebilir" },
    { key: "top", label: "Seyir katı: kemerli pencereler", w: 0.8, cost: 3 },
    { key: "roof", label: "Konik külah", w: 0.7, cost: 3 },
  ],
  frameEnd: 0.7,
  later: [
    { key: "storm", label: "1875: fırtına külahı uçuruyor", a: 0.7, b: 0.75, cost: 0 },
    { key: "restore", label: "1965-67 restorasyon: külah betonarme iskeletle yeniden", a: 0.75, b: 0.87, cost: 4, inspect: "külah ve iç betonarme", next: "ziyarete açılabilir" },
    { key: "lights", label: "Gece aydınlatması", a: 0.87, b: 0.93, cost: 1 },
    { key: "handover", label: "Teslim", a: 0.93, b: 1, cost: 2 },
  ],
  live: true,
  scene: (P, sp, plan, shown, lit, time = 0) => galataSVG(P, progress(plan, shown), lit, 2, time),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-0.6, -0.6, 0.6, 0.6), GA.zt * 0.42 * t + 0.2),
  shadowFrom: "body",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(-0.6, -0.6, 0.6, 0.6), GA.zt * 0.42 + 0.2) : "";
    return s + galataSVG(P, GALATA_DONE, lit, detail);
  },
  snow: () => "",
  workHeight: () => null,
  crew(sp, p, k) {
    if (p.key === "found") return [at(0.8, 0.6, 0, "shovel"), at(0.2, 1.0, 0, "carry")];
    if (p.key === "body") return [at(0.3, 0.3, GA.z0 + (GA.body * (p.floor + k)) / 3, "trowel"), at(1.0, 0.5, 0, "carry")];
    if (p.key === "gallery" || p.key === "top") return [at(0.45, 0.45, GA.zb + 0.05, "trowel")];
    if (p.key === "roof" || p.key === "restore") return [at(0.45, 0.45, GA.zb + 0.05, "hammer"), at(1.0, 0.6, 0, "carry")];
    return null;
  },
  // The real tower: 66.9 m to the tip of the cap, nine floors.
  metraj(sp, p, k) {
    const add = { body: { h: 13.9, kat: 2 }, gallery: { h: 2.2, kat: 1 }, top: { h: 6, kat: 2 }, roof: { h: 17 }, storm: { h: -17 }, restore: { h: 17 } }[p.key];
    return add ? { height: k * add.h, kat: k * (add.kat || 0) } : null;
  },
  items: (q, num) => [`Yükseklik ${num(Math.max(0, q.height || 0))} m`, `Kat ${Math.floor((q.kat || 0) + 1e-9)}/9`],
};

// =====================================================================
// Anıtkabir (Emin Onat ve Orhan Arda, 1944-1953): Rasattepe levelled (the
// Phrygian tumuli found there were dug and moved to the museum), a
// reinforced concrete raft and frame clad in yellow travertine, the Hall
// of Honour's colonnade and roof, the 40-tonne single-piece marble
// cenotaph, the Ceremonial Square paved like a kilim, the Road of Lions
// with 24 lions, ten towers. Opened 10 November 1953.
// =====================================================================
const AK = { x0: -1.95, x1: -0.35, y: 1.25, pod: 0.45, hx0: -1.75, hx1: -0.55, hy: 0.95, colTop: 1.2, roofT: 1.34, attic: 1.48 };
const TRAVERTINE = ["#f1e3c0", "#dac9a1", "#bba982"],
  CONC = ["#c9c7c1", "#b0aea7", "#96948d"],
  MARBLE_W = ["#fbfaf6", "#e6e3db", "#cbc7bd"];
const TOWERS = [[1.82, 1.13], [1.82, 1.87], [-0.25, -1.18], [0.75, -1.18], [1.75, -1.18], [1.85, -0.45], [1.85, 0.35], [-0.25, 1.02], [0.75, 1.02], [1.85, 1.02]].sort((a, b) => a[0] + a[1] - b[0] - b[1]);
const LIONS = Array.from({ length: 24 }, (_, i) => [1.65 - Math.floor(i / 2) * 0.14, i % 2 ? 1.72 : 1.28]);
function anitkabirSVG(P, k, lit = false, detail = 2) {
  let s = "";
  // Rasattepe: the Phrygian tumuli, dug away as the hill is levelled.
  if (!(k.level >= 1)) for (const [x, y, r] of [[0.7, -0.5, 0.42], [1.3, 0.6, 0.32]]) s += lathe(P, x, y, domeProfile(r, 0, r * 0.55 * (1 - clamp(k.level)) + 0.001, 4), ["#b79a6c", "#9d8256", "#836b44"], { n: 16 });
  // Trees of the Peace Park behind.
  if (k.flag > 0.3)
    for (const [x, y, r] of [[-1.9, -1.75, 4.5], [-1.3, -1.8, 3.5], [-0.5, -1.72, 4], [0.4, -1.8, 3.2], [1.3, -1.74, 3.8], [-2.05, -0.9, 3.6], [-2.05, 0.2, 4.2], [-2.0, 1.3, 3.4]])
      s += seg(P(x, y, 0), P(x, y, 0.13), "#6b4f2e", 1.2) + circle(...P(x, y, 0.19), r, "#4f8a3c");
  // Ground: the square's kilim paving, the Road of Lions.
  if (k.square > 0) {
    const N = 8,
      M = 6,
      cols = ["#d9cdb3", "#b98a6a", "#cfc0a0", "#8f6a55"];
    for (let i = 0; i < N; i++)
      for (let j = 0; j < M; j++) {
        if ((i * M + j) / (N * M) >= k.square) continue;
        const x0 = -0.3 + (2.25 * i) / N,
          x1 = -0.3 + (2.25 * (i + 1)) / N,
          y0 = -1.25 + (2.2 * j) / M,
          y1 = -1.25 + (2.2 * (j + 1)) / M;
        s += poly([P(x0, y0, 0.006), P(x1, y0, 0.006), P(x1, y1, 0.006), P(x0, y1, 0.006)], cols[(i + j) % 2 ? ((i * 3 + j) % 4 === 1 ? 1 : 2) : 0]);
        if (detail >= 2 && (i + j) % 3 === 0) s += poly([P((x0 + x1) / 2, y0 + 0.05, 0.007), P(x1 - 0.05, (y0 + y1) / 2, 0.007), P((x0 + x1) / 2, y1 - 0.05, 0.007), P(x0 + 0.05, (y0 + y1) / 2, 0.007)], "#a5523e", 0.8);
      }
  }
  if (k.lions > 0) s += poly([P(-0.1, 1.33, 0.006), P(1.95, 1.33, 0.006), P(1.95, 1.67, 0.006), P(-0.1, 1.67, 0.006)], "#d4c8ad");
  // Raft and stepped podium.
  if (k.raftRebar > 0) {
    s += poly([P(AK.x0, -AK.y, 0.005), P(AK.x1, -AK.y, 0.005), P(AK.x1, AK.y, 0.005), P(AK.x0, AK.y, 0.005)], k.raft > 0 ? (k.raft < 1 ? "#8e9298" : CONC[0]) : "#8a6a48");
    if (!(k.raft > 0.3) && detail >= 1) for (let x = AK.x0 + 0.1; x < AK.x1; x += 0.15) s += seg(P(x, -AK.y, 0.02), P(x, AK.y, 0.02), "#7a4a2a", 0.7);
  }
  const pod = clamp(k.podium);
  if (pod > 0) {
    const clad = mixAll(CONC, TRAVERTINE, clamp(pod * 1.5 - 0.5));
    for (let i = 0; i < 3; i++) {
      const z0 = i * 0.15,
        z1 = Math.min(z0 + 0.15, AK.pod * pod);
      if (z1 <= z0) break;
      s += box(P, AK.x0 + i * 0.08, -AK.y + i * 0.08, AK.x1 - i * 0.08, AK.y - i * 0.08, z0, z1, clad);
    }
  }
  // Hall of Honour: concrete frame, then travertine columns, roof and attic.
  const frame = clamp(k.frame),
    cols = clamp(k.columns),
    roof = clamp(k.roof);
  if (frame > 0) {
    const list = [];
    const zc = AK.pod + (AK.colTop - AK.pod) * frame;
    list.push({ depth: -1.15, s: box(P, -1.55, -0.75, -0.75, 0.75, AK.pod, zc, mixAll(CONC, TRAVERTINE, cols)) });
    const posts = [];
    for (let x = AK.hx0; x <= AK.hx1 + 1e-6; x += 0.15) posts.push([x, -AK.hy], [x, AK.hy]);
    for (let y = -AK.hy + 0.16; y < AK.hy - 0.1; y += 0.16) posts.push([AK.hx0, y], [AK.hx1, y]);
    posts.forEach(([x, y], i) => {
      const clad = i / posts.length < cols;
      list.push({ depth: x + y, s: box(P, x - 0.035, y - 0.035, x + 0.035, y + 0.035, AK.pod, zc, clad ? TRAVERTINE : CONC) });
    });
    s += painted(list);
    if (k.lahit > 0.5) s += box(P, -0.72, -0.12, -0.6, 0.12, AK.pod, AK.pod + 0.11, MARBLE_W) + box(P, -0.74, -0.14, -0.58, 0.14, AK.pod + 0.11, AK.pod + 0.13, MARBLE_W);
    if (roof > 0) {
      const z1 = AK.colTop + (AK.roofT - AK.colTop) * clamp(roof * 2);
      s += box(P, AK.hx0 - 0.07, -AK.hy - 0.07, AK.hx1 + 0.07, AK.hy + 0.07, AK.colTop, z1, roof < 1 ? CONC : TRAVERTINE);
      if (roof > 0.5) s += box(P, -1.45, -0.55, -0.85, 0.55, AK.roofT, AK.roofT + (AK.attic - AK.roofT) * clamp(roof * 2 - 1), roof < 1 ? CONC : TRAVERTINE);
      if (roof >= 1 && detail >= 2) s += seg(P(AK.hx1 + 0.072, -AK.hy - 0.07, AK.colTop + 0.04), P(AK.hx1 + 0.072, AK.hy + 0.07, AK.colTop + 0.04), TRAVERTINE[2], 1.2) + seg(P(AK.hx0 - 0.07, AK.hy + 0.072, AK.colTop + 0.04), P(AK.hx1 + 0.07, AK.hy + 0.072, AK.colTop + 0.04), TRAVERTINE[2], 1.2);
    }
  }
  // Front stairs down to the square.
  if (pod >= 1) for (let i = 0; i < 4; i++) s += box(P, AK.x1 - 0.16 + i * 0.07, -0.5, AK.x1 - 0.09 + i * 0.07, 0.5, 0, AK.pod - i * 0.11, TRAVERTINE);
  // Towers and lions, far to near.
  const built = (k.towers || 0) * TOWERS.length;
  TOWERS.forEach(([x, y], i) => {
    const t = clamp(built - i);
    if (t <= 0) return;
    s += box(P, x - 0.1, y - 0.1, x + 0.1, y + 0.1, 0, 0.42 * t, TRAVERTINE);
    if (t >= 1) {
      s += poly([P(x - 0.11, y + 0.11, 0.42), P(x + 0.11, y + 0.11, 0.42), P(x, y, 0.52)], shade(P, [0, 0.7, 0.7], TRAVERTINE)) + poly([P(x + 0.11, y - 0.11, 0.42), P(x + 0.11, y + 0.11, 0.42), P(x, y, 0.52)], shade(P, [0.7, 0, 0.7], TRAVERTINE));
      if (detail >= 1) s += poly([P(x + 0.102, y - 0.035, 0.02), P(x + 0.102, y + 0.035, 0.02), P(x + 0.102, y + 0.035, 0.16), P(x + 0.102, y - 0.035, 0.16)], windowFill(lit));
    }
  });
  const lions = Math.floor((k.lions || 0) * 24 + 1e-9);
  LIONS.slice(0, lions)
    .map((p, i) => [p, i])
    .sort((a, b) => a[0][0] + a[0][1] - b[0][0] - b[0][1])
    .forEach(([[x, y]]) => {
      s += box(P, x - 0.05, y - 0.035, x + 0.05, y + 0.035, 0, 0.05, TRAVERTINE) + box(P, x - 0.045, y - 0.025, x + 0.04, y + 0.025, 0.05, 0.11, ["#d8c59c", "#c0ac82", "#a38f66"]);
      if (detail >= 1) s += box(P, x - 0.035, y - 0.02, x + 0.0, y + 0.02, 0.11, 0.14, ["#d8c59c", "#c0ac82", "#a38f66"]);
    });
  // The flag on its pole by the square.
  if (k.flag > 0.5) {
    const top = 1.7;
    s += seg(P(1.45, 0.6, 0), P(1.45, 0.6, top), "#d8d8d8", 1.4);
    s += poly([P(1.45, 0.6, top - 0.02), P(1.45, 0.98, top - 0.06), P(1.45, 0.98, top - 0.3), P(1.45, 0.6, top - 0.26)], "#d32f2f");
    s += circle(...P(1.45, 0.74, top - 0.15), 2.6, "#ffffff") + circle(...P(1.45, 0.755, top - 0.15), 2.1, "#d32f2f");
  }
  return s;
}
const ANITKABIR_DONE = { level: 1, raftRebar: 1, raft: 1, podium: 1, frame: 1, columns: 1, roof: 1, lahit: 1, square: 1, lions: 1, towers: 1, flag: 1, done: true };
export const ANITKABIR = {
  system: "monument",
  ridge: 0.2,
  spec: () => ({ hw: 2, h: AK.attic - 0.3, floors: 1, wall: { faces: TRAVERTINE, grain: "#bba982", pattern: "anitkabir" }, roof: TRAVERTINE }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "level", label: "Rasattepe tesviye: kazıda Frig tümülüsleri çıkıyor, müzeye taşınıyor", w: 1, cost: 3 },
    { key: "raftRebar", label: "Radye temel donatısı", w: 0.7, cost: 3, inspect: "radye donatısı ve paspayı", next: "beton dökülebilir" },
    { key: "raft", label: "Radye temel betonu", w: 0.8, cost: 4, pour: true },
    { key: "podium", label: "Kademeli kaide: betonarme, sarı traverten kaplama", w: 1, cost: 4 },
    { key: "frame", label: "Şeref Holü betonarme iskeleti", w: 1.2, cost: 5, pour: true },
    { key: "columns", label: "Kolonlar: sarı traverten kaplama", w: 1.1, cost: 5 },
    { key: "roof", label: "Çatı: betonarme kirişler, kesme taş korniş", w: 0.9, cost: 4, inspect: "çatı kirişleri ve korniş", next: "lahit taşı konabilir" },
    { key: "lahit", label: "Lahit taşı: 40 tonluk tek parça mermer", w: 0.6, cost: 3 },
    { key: "square", label: "Tören Meydanı: halı desenli taş döşeme", w: 1, cost: 4 },
  ],
  frameEnd: 0.72,
  later: [
    { key: "lions", label: "Aslanlı Yol: 12 çift aslan heykeli", a: 0.72, b: 0.8, cost: 3 },
    { key: "towers", label: "On kule ve kabartmalar", a: 0.8, b: 0.87, cost: 3 },
    { key: "flag", label: "Bayrak direği ve Barış Parkı", a: 0.87, b: 0.93, cost: 2 },
    { key: "handover", label: "10 Kasım 1953: Anıtkabir açılıyor", a: 0.93, b: 1, cost: 2 },
  ],
  garden: false,
  live: true,
  scene: (P, sp, plan, shown, lit) => anitkabirSVG(P, progress(plan, shown), lit, 2),
  shadow: (P, sp, t) => castShadow(P, rectOutline(AK.x0, -AK.y, AK.x1, AK.y), 0.6 * t + 0.1),
  shadowFrom: "frame",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(AK.x0, -AK.y, AK.x1, AK.y), 0.7) : "";
    return s + anitkabirSVG(P, ANITKABIR_DONE, lit, detail);
  },
  snow: () => "",
  workHeight: () => null,
  crew(sp, p, k) {
    if (p.key === "level") return [at(0.4 + 0.6 * k, -0.2, 0, "shovel"), at(1.2, 0.2, 0, "carry")];
    if (p.key === "raftRebar") return [at(-1.2, 0.6, 0, "tie"), at(-0.8, -0.4, 0, "tie")];
    if (p.key === "raft") return [at(-1.1, 0.4, 0, "hose"), at(-0.7, 0.8, 0, "trowel")];
    if (p.key === "podium") return [at(-0.3, 0.8, 0, "trowel")];
    if (p.key === "frame" || p.key === "columns") return [at(-0.45, 0.6, AK.pod, p.key === "frame" ? "hose" : "trowel"), at(-0.2, 1.1, 0, "carry")];
    if (p.key === "roof") return [at(-1.0, 0.6, AK.roofT, "hammer")];
    if (p.key === "lahit") return [at(-0.45, 0.25, AK.pod, "bar")];
    if (p.key === "square") return [at(-0.1 + 1.8 * k, -0.6, 0, "trowel"), at(1.0, 0.3, 0, "carry")];
    if (p.key === "lions") return [at(1.6 - 1.4 * k, 1.5, 0, "carry")];
    return null;
  },
  metraj(sp, p, k) {
    if (p.key === "lions") return { lions: k * 24 };
    if (p.key === "towers") return { towers: k * 10 };
    return null;
  },
  items: (q) => [`Aslan ${Math.floor((q.lions || 0) + 1e-9)}/24`, `Kule ${Math.floor((q.towers || 0) + 1e-9)}/10`],
};

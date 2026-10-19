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
// Anıtkabir (Emin Onat ve Orhan Arda, 1944-1953). Rasattepe is levelled
// (the Phrygian tumuli found there are dug and moved to the museum), a
// reinforced concrete raft and frame go up and are clad in travertine.
// The Hall of Honour (Şeref Holü, 41.65 × 57.35 m) stands on a terrace
// reached by 42 steps with the speaker's platform (kürsü) half way; it is
// ringed by square pillars of white Kayseri travertine, 8 at the front and
// back and 14 down each side, 14.4 m tall, under a cornice with Seljuk
// sawtooth (testere dişi) ornament. Inside, the 40-tonne cenotaph of one
// piece of red marble. The Ceremonial Square (129 × 84 m) is paved with
// 373 kilim motifs in red, black, yellow and white travertine; the Road of
// Lions (262 m) enters it opposite the hall's flank, lined by 12 pairs of
// seated Hittite-style lions. Ten towers with low tent-like roofs and
// bronze spearhead finials, porticoes round the square, the 33.5 m
// flagpole on its east stairs, the Peace Park all around.
//
// Local plan: x runs from the hall (back) to the square's east edge, y is
// the Road of Lions' axis. 1 local unit ≈ 30 m in plan; heights are drawn
// ×1.5 (1 unit ≈ 20 m), as the village's houses are. The square and the
// road are shortened to fit, the buildings keep their own proportions.
// =====================================================================
const AK = {
  // terrace (podium) under the hall, and its top
  tx0: -2.1, tx1: 0.05, ty0: -1.55, ty1: 0.15, zt: 0.325,
  // the hall's colonnade and the inner hall (cella)
  hx0: -2.05, hx1: -0.14, hy0: -1.395, hy1: -0.005,
  cx0: -1.92, cx1: -0.27, cy0: -1.265, cy1: -0.135,
  zs: 0.35, zc: 1.07, ze: 1.175, za: 1.29,
  // the front stairs (42 steps) and the square
  sx1: 0.45, sy0: -1.15, sy1: -0.25,
  qx0: 0.45, qx1: 1.92, qy0: -1.82, qy1: 0.42, yc: -0.7,
  // the Road of Lions
  rx0: 1.08, rx1: 1.32,
  pole: [1.99, -0.7], poleTop: 1.75,
};
const TRAVERTINE = ["#f1e3c0", "#dac9a1", "#bba982"],
  WHITE_TRAV = ["#faf5ea", "#e7dfcc", "#cbc0a8"],
  CONC = ["#c9c7c1", "#b0aea7", "#96948d"],
  MARBLE_W = ["#fbfaf6", "#e6e3db", "#cbc7bd"],
  RED_MARBLE = ["#c0604c", "#a24a39", "#86392b"],
  LION = ["#efe7d6", "#d7cdb7", "#b9ae96"],
  FLOODLIT = ["#fff1cc", "#f4dba4", "#dcc08a"],
  BRONZE = "#7c5a32",
  GOLD = "#d9b24a",
  FLAG_RED = "#e30a17";
// Ten towers: İstiklal and Hürriyet at the head of the road, four on the
// north side of the square (two flanking the road), four on the south.
const T = 0.13;
const TOWER_LIST = [
  [0.95, 1.96], [1.45, 1.96],
  [0.55, 0.56], [0.95, 0.56], [1.45, 0.56], [1.85, 0.56],
  [0.55, -1.96], [0.95, -1.96], [1.45, -1.96], [1.85, -1.96],
];
// Built in this order: the square's towers, then the two at the road's head.
const TOWERS = [...TOWER_LIST.slice(2), ...TOWER_LIST.slice(0, 2)];
// 12 pairs of lions, facing each other across the road.
const LIONS = Array.from({ length: 24 }, (_, i) => [i % 2 ? AK.rx1 + 0.05 : AK.rx0 - 0.05, 0.8 + Math.floor(i / 2) * 0.075, i % 2 ? -1 : 1]);
const PARK = [
  [-1.95, 0.55, 0.09], [-1.6, 0.75, 0.1], [-1.2, 0.6, 0.085], [-0.8, 0.8, 0.1], [-0.4, 0.62, 0.08], [-1.9, 1.15, 0.1], [-1.45, 1.25, 0.09],
  [-1.0, 1.2, 0.1], [-0.55, 1.15, 0.09], [-0.1, 1.05, 0.08], [0.3, 1.15, 0.08], [-1.75, 1.7, 0.1], [-1.25, 1.75, 0.09], [-0.75, 1.65, 0.1],
  [-0.3, 1.6, 0.09], [0.15, 1.55, 0.08], [0.5, 1.4, 0.07], [-1.5, 2.0, 0.08], [-0.95, 2.0, 0.09], [-0.45, 2.02, 0.08], [0.1, 1.95, 0.08],
  [0.55, 1.85, 0.07], [1.72, 0.95, 0.07], [1.95, 1.2, 0.07], [1.7, 1.45, 0.07], [1.95, 1.75, 0.07], [-2.0, -1.75, 0.08], [-1.4, -1.85, 0.08],
  [-0.8, -1.8, 0.08], [-0.2, -1.95, 0.07], [0.2, -1.6, 0.07],
];
const TUMULI = [[0.9, -0.7, 0.42], [1.5, 0.3, 0.32]];
// Screen radius of a ball of world radius r at (x, y, z), so it scales with the projection.
const ballR = (P, x, y, z, r) => Math.abs(P(x, y, z + r)[1] - P(x, y, z)[1]);
const tree = (P, x, y, r) => seg(P(x, y, 0), P(x, y, r * 1.3), "#6b4f2e", 1.2) + circle(...P(x, y, r * 1.9), ballR(P, x, y, r * 1.9, r), "#4f8a3c") + circle(...P(x - r * 0.25, y + r * 0.25, r * 2.15), ballR(P, x, y, r * 2.1, r * 0.5), "#64a04c");
// Seljuk sawtooth ornament under an eave, along a visible face: x = const
// (axis "y") or y = const (axis "x"), points hanging down from z.
function sawtooth(P, axis, at, a, b, z, faces, w = 0.035) {
  let s = "";
  const n = Math.max(1, Math.round((b - a) / w)),
    step = (b - a) / n,
    q = axis === "y" ? (u, zz) => P(at, u, zz) : (u, zz) => P(u, at, zz);
  s += poly([q(a, z), q(b, z), q(b, z - 0.012), q(a, z - 0.012)], faces[2]);
  for (let i = 0; i < n; i++) s += poly([q(a + i * step, z - 0.012), q(a + (i + 1) * step, z - 0.012), q(a + (i + 0.5) * step, z - 0.04)], faces[2]);
  return s;
}
// Text set in gold leaf: rows of short strokes on a face x = const.
function inscription(P, x, y0, y1, z0, z1, rows) {
  let s = "";
  for (let r = 0; r < rows; r++) {
    const z = z1 - ((z1 - z0) * (r + 0.5)) / rows;
    let y = y0;
    for (let w = 0; y > y1 + 0.01; w++) {
      const len = 0.03 + ((r * 7 + w * 13) % 5) * 0.012,
        end = Math.max(y1, y - len);
      s += seg(P(x, y, z), P(x, end, z), GOLD, 0.7);
      y = end - 0.012;
    }
  }
  return s;
}
// The Turkish flag, by the Türk Bayrağı Kanunu: G is its height, 1.5 G its
// length; the crescent's outer circle (Ø G/2) sits G/2 from the hoist, the
// inner one (Ø 2G/5) G/16 further, the star's circle (Ø G/4) G/3 beyond the
// inner circle, with one point towards the hoist; a white sleeve G/30 wide.
const flagShapes = (() => {
  const G = 1,
    M = G / 30,
    cy = G / 2,
    co = M + G / 2,
    ro = G / 4,
    d = G / 16,
    ri = G / 5,
    a = (ro * ro - ri * ri + d * d) / (2 * d),
    h = Math.sqrt(ro * ro - a * a),
    to = Math.atan2(h, a),
    ti = Math.atan2(h, a - d),
    crescent = [];
  for (let i = 0; i <= 28; i++) {
    const t = to + ((2 * Math.PI - 2 * to) * i) / 28;
    crescent.push([co + ro * Math.cos(t), cy + ro * Math.sin(t)]);
  }
  for (let i = 0; i <= 24; i++) {
    const t = 2 * Math.PI - ti - ((2 * Math.PI - 2 * ti) * i) / 24;
    crescent.push([co + d + ri * Math.cos(t), cy + ri * Math.sin(t)]);
  }
  const cs = co + d + ri + G / 3 + G / 8,
    R = G / 8,
    star = Array.from({ length: 10 }, (_, i) => {
      const t = Math.PI + (i * Math.PI) / 5,
        r = i % 2 ? R * 0.381966 : R;
      return [cs + r * Math.cos(t), cy + r * Math.sin(t)];
    });
  return { M, crescent, star };
})();
// The flag flying from a pole at (px, py), top at z, height G; it streams
// towards the screen's right whichever way the building faces, so it never
// reads mirrored. `wave` is the phase of the ripple.
function flagSVG(P, px, py, z, G, wave = 0) {
  const L = 1.5 * G,
    amp = G * 0.07,
    off = (u) => amp * Math.sin((u / L) * 2 * Math.PI * 1.15 - wave) * (u / L),
    q = P.mirror ? (u, v) => P(px - u, py + off(u), z - v) : (u, v) => P(px + off(u), py - u, z - v),
    at = ([u, v]) => q(u * G, v * G);
  let s = "";
  const N = 8;
  for (let i = 0; i < N; i++) {
    const u0 = (L * i) / N,
      u1 = (L * (i + 1)) / N,
      slope = (off(u1) - off(u0)) / (u1 - u0);
    const fill = i === 0 ? null : slope > 0 ? mix(FLAG_RED, "#ff5a4f", clamp(slope * 2.2)) : mix(FLAG_RED, "#8e0710", clamp(-slope * 2.2));
    if (fill) s += poly([q(u0, 0), q(Math.min(L, u1 + L * 0.01), 0), q(Math.min(L, u1 + L * 0.01), G), q(u0, G)], fill);
  }
  const m = flagShapes.M * G;
  s += poly([q(m, 0), q(L / N, 0), q(L / N, G), q(m, G)], FLAG_RED) + poly([q(0, 0), q(m, 0), q(m, G), q(0, G)], "#f4f1ea");
  s += poly(flagShapes.crescent.map(at), "#ffffff") + poly(flagShapes.star.map(at), "#ffffff");
  return s;
}
// A seated Hittite-style lion on its plinth, looking across the road (dir ±1 along x).
function lionSVG(P, x, y, dir, detail) {
  let s = box(P, x - 0.035, y - 0.026, x + 0.035, y + 0.026, 0, 0.03, TRAVERTINE);
  const b = x - dir * 0.012;
  s += box(P, b - 0.024, y - 0.017, b + 0.024, y + 0.017, 0.03, 0.06, LION);
  if (detail >= 1) {
    const hx = x + dir * 0.016;
    s += box(P, hx - 0.016, y - 0.016, hx + 0.016, y + 0.016, 0.03, 0.1, LION);
    s += box(P, hx + dir * 0.008 - 0.012, y - 0.013, hx + dir * 0.008 + 0.012, y + 0.013, 0.1, 0.12, LION);
  }
  return s;
}
// A statue group of three on a plinth (the men's and the women's groups).
function groupSVG(P, x, y, women) {
  let s = box(P, x - 0.09, y - 0.035, x + 0.09, y + 0.035, 0, 0.045, TRAVERTINE);
  for (const [dx, h] of [[-0.05, 0.1], [0, women ? 0.105 : 0.115], [0.05, 0.1]]) {
    s += box(P, x + dx - 0.012, y - 0.012, x + dx + 0.012, y + 0.012, 0.045, 0.045 + h, WHITE_TRAV);
    s += circle(...P(x + dx, y, 0.045 + h + 0.012), ballR(P, x + dx, y, 0.045 + h + 0.012, 0.012), WHITE_TRAV[1]);
  }
  if (women) s += box(P, x - 0.07, y + 0.012, x + 0.07, y + 0.02, 0.06, 0.08, ["#e3cf8f", "#cdb672", "#b39b5a"]);
  return s;
}
// A tower: travertine walls, a relief on its face, the Seljuk sawtooth under
// the eave, a low pyramidal roof like a Turkish tent and a bronze spearhead.
function towerSVG(P, x, y, t, lit, detail, trav) {
  const H = 0.55,
    top = H * t;
  let s = box(P, x - T, y - T, x + T, y + T, 0, top, trav);
  if (t < 1) return s;
  if (detail >= 1) {
    // relief panel on the +x face, door on the +y face
    s += poly([P(x + T + 0.002, y - 0.08, 0.16), P(x + T + 0.002, y + 0.08, 0.16), P(x + T + 0.002, y + 0.08, 0.45), P(x + T + 0.002, y - 0.08, 0.45)], mix(trav[2], "#ffffff", 0.25));
    if (detail >= 2)
      for (const [a, b, c, d] of [[-0.05, 0.2, -0.03, 0.4], [-0.01, 0.2, 0.0, 0.42], [0.03, 0.2, 0.05, 0.38], [-0.06, 0.33, 0.06, 0.33]]) s += seg(P(x + T + 0.003, y + a, b), P(x + T + 0.003, y + c, d), trav[2], 0.8);
    s += poly([P(x - 0.035, y + T + 0.002, 0), P(x + 0.035, y + T + 0.002, 0), P(x + 0.035, y + T + 0.002, 0.13), P(x - 0.035, y + T + 0.002, 0.13)], lit ? mix(BRONZE, "#ffd36e", 0.6) : BRONZE);
  }
  if (detail >= 2) s += sawtooth(P, "y", x + T + 0.001, y - T, y + T, H - 0.005, trav, 0.03) + sawtooth(P, "x", y + T + 0.001, x - T, x + T, H - 0.005, trav, 0.03);
  const e = T + 0.025;
  s += box(P, x - e, y - e, x + e, y + e, H, H + 0.025, trav);
  const apex = P(x, y, H + 0.13),
    rf = ["#d9c497", "#c2ad80", "#a8936a"];
  s += poly([P(x - e, y + e, H + 0.025), P(x + e, y + e, H + 0.025), apex], shade(P, [0, 0.62, 0.78], rf)) + poly([P(x + e, y - e, H + 0.025), P(x + e, y + e, H + 0.025), apex], shade(P, [0.62, 0, 0.78], rf));
  s += seg(apex, P(x, y, H + 0.19), BRONZE, 1.2);
  if (detail >= 1) s += poly([P(x, y, H + 0.25), P(x + 0.012, y - 0.012, H + 0.205), P(x, y, H + 0.18), P(x - 0.012, y + 0.012, H + 0.205)], "#a07a3c");
  return s;
}
// A portico: square pillars under a flat roof, open both sides; x0..x1 by y0..y1.
function porticoSVG(P, x0, y0, x1, y1, t, trav, detail) {
  const H = 0.36,
    alongY = y1 - y0 > x1 - x0,
    len = alongY ? y1 - y0 : x1 - x0,
    n = Math.max(2, Math.round(len / 0.12) + 1),
    p = 0.016,
    top = H * t;
  let s = "";
  const pillars = [];
  for (let i = 0; i < n; i++) {
    const u = (alongY ? y0 : x0) + 0.02 + ((len - 0.04) * i) / (n - 1);
    for (const side of [0, 1]) {
      const [px, py] = alongY ? [side ? x1 - 0.02 : x0 + 0.02, u] : [u, side ? y1 - 0.02 : y0 + 0.02];
      pillars.push({ depth: px + py, s: box(P, px - p, py - p, px + p, py + p, 0, top, WHITE_TRAV) });
    }
  }
  s += box(P, x0 + 0.03, y0 + 0.03, x1 - 0.03, y1 - 0.03, 0, 0.01, ["#e3d6b8", "#cfc09f", "#b5a684"]) + painted(pillars);
  if (t < 1) return s;
  s += box(P, x0, y0, x1, y1, H, H + 0.05, trav);
  if (detail >= 2) s += sawtooth(P, "y", x1 + 0.001, y0, y1, H + 0.045, trav, 0.03) + sawtooth(P, "x", y1 + 0.001, x0, x1, H + 0.045, trav, 0.03);
  return s;
}
// The kilim of the Ceremonial Square: a border and rows of diamond medallions.
function squareSVG(P, k, detail) {
  let s = "";
  const NX = 6,
    NY = 9,
    { qx0, qx1, qy0, qy1 } = AK,
    total = NX * NY;
  const red = "#b0503c",
    black = "#4b4440",
    yellow = "#e6d1a2",
    white = "#f3ecdc",
    flat = (x0, y0, x1, y1, c) => poly([P(x0, y0, 0.006), P(x1, y0, 0.006), P(x1, y1, 0.006), P(x0, y1, 0.006)], c),
    // the kilim "göz": a hexagon pointed along the road's axis, so it reads as a lozenge on screen
    diamond = (cx, cy, rx, ry, c, z = 0.007) => poly([P(cx, cy - ry, z), P(cx + rx, cy - ry * 0.45, z), P(cx + rx, cy + ry * 0.45, z), P(cx, cy + ry, z), P(cx - rx, cy + ry * 0.45, z), P(cx - rx, cy - ry * 0.45, z)], c);
  if (k >= 1) s += flat(qx0 - 0.03, qy0 - 0.03, qx1 + 0.03, qy1 + 0.03, red);
  for (let n = 0; n < total; n++) {
    if (n / total >= k) break;
    const i = n % NX,
      j = Math.floor(n / NX),
      x0 = qx0 + ((qx1 - qx0) * i) / NX,
      x1 = qx0 + ((qx1 - qx0) * (i + 1)) / NX,
      y0 = qy0 + ((qy1 - qy0) * j) / NY,
      y1 = qy0 + ((qy1 - qy0) * (j + 1)) / NY,
      cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2,
      rx = (x1 - x0) / 2,
      ry = (y1 - y0) / 2;
    s += flat(x0, y0, x1, y1, (i + j) % 2 ? yellow : white);
    if (detail >= 1) s += diamond(cx, cy, rx * 0.78, ry * 0.78, (i * 3 + j) % 2 ? red : black);
    if (detail >= 2) {
      s += diamond(cx, cy, rx * 0.5, ry * 0.5, (i + j) % 2 ? white : yellow, 0.008);
      s += diamond(cx, cy, rx * 0.22, ry * 0.22, (i * 3 + j) % 2 ? black : red, 0.009);
      // the kilim's little hooks at the medallion's tips
      for (const [dx, dy] of [[rx * 0.86, 0], [-rx * 0.86, 0], [0, ry * 0.86], [0, -ry * 0.86]]) s += diamond(cx + dx, cy + dy, rx * 0.07, ry * 0.07, (i * 3 + j) % 2 ? red : black, 0.008);
    }
  }
  return s;
}
// The 40-tonne cenotaph: red marble on a white Afyon marble base.
const lahitSVG = (P, x, y, z) => box(P, x - 0.09, y - 0.045, x + 0.09, y + 0.045, z, z + 0.025, MARBLE_W) + box(P, x - 0.075, y - 0.032, x + 0.075, y + 0.032, z + 0.025, z + 0.075, RED_MARBLE);
// Where the cenotaph is while it is hauled in: across the square, up the
// 42 steps on rollers, through the bronze door to its niche.
function lahitAt(t) {
  const path = [[0.95, AK.yc, 0], [AK.sx1, AK.yc, 0], [AK.tx1, AK.yc, AK.zt], [AK.hx1, AK.yc, AK.zs], [-1.7, AK.yc, AK.zs]];
  const u = clamp(t) * (path.length - 1),
    i = Math.min(path.length - 2, Math.floor(u)),
    f = u - i;
  return path[i].map((v, j) => v + (path[i + 1][j] - v) * f);
}
function hallSVG(P, k, trav, lit, detail) {
  const { tx0, tx1, ty0, ty1, zt, hx0, hx1, hy0, hy1, cx0, cx1, cy0, cy1, zs, zc, ze, za, sx1, sy0, sy1, yc } = AK;
  let s = "";
  // Raft: rebar mesh, then concrete.
  if (k.raftRebar > 0) {
    s += poly([P(tx0, ty0, 0.005), P(tx1, ty0, 0.005), P(tx1, ty1, 0.005), P(tx0, ty1, 0.005)], k.raft > 0 ? (k.raft < 1 ? "#8e9298" : CONC[0]) : "#8a6a48");
    if (!(k.raft > 0.3) && detail >= 1)
      for (let x = tx0 + 0.1; x < tx1; x += 0.15) s += seg(P(x, ty0, 0.02), P(x, ty1, 0.02), "#7a4a2a", 0.7);
    if (!(k.raft > 0.3) && detail >= 2)
      for (let y = ty0 + 0.1; y < ty1; y += 0.15) s += seg(P(tx0, y, 0.02), P(tx1, y, 0.02), "#7a4a2a", 0.6);
  }
  // Terrace: concrete, then travertine; the stairs and the kürsü once it is up.
  const pod = clamp(k.podium);
  if (pod > 0) {
    const clad = mixAll(CONC, trav, clamp(pod * 1.5 - 0.5));
    s += box(P, tx0, ty0, tx1, ty1, 0, zt * pod, clad);
    if (pod >= 1 && detail >= 2)
      for (const z of [0.08, 0.16, 0.24]) s += seg(P(tx1 + 0.002, ty0, z), P(tx1 + 0.002, ty1, z), trav[2], 0.6, 0.7) + seg(P(tx0, ty1 + 0.002, z), P(tx1, ty1 + 0.002, z), trav[2], 0.6, 0.7);
  }
  if (pod >= 1) {
    const N = 12,
      run = sx1 - tx1;
    // the far cheek wall, the steps bottom up, then the near cheek
    const cheek = (y) => poly([P(tx1, y, zt + 0.035), P(sx1, y, 0.035), P(sx1, y, 0), P(tx1, y, 0)], trav[1]) + poly([P(tx1, y - 0.04, zt + 0.035), P(sx1, y - 0.04, 0.035), P(sx1, y, 0.035), P(tx1, y, zt + 0.035)], trav[0]);
    s += cheek(sy0);
    for (let i = 0; i < N; i++) s += box(P, tx1 - 0.01, sy0, tx1 + (run * (N - i)) / N, sy1, (zt * i) / N, (zt * (i + 1)) / N, WHITE_TRAV);
    // the speaker's platform half way up: "Hakimiyet kayıtsız şartsız milletindir"
    const kz = zt * 0.5;
    s += box(P, tx1 + run * 0.3, yc - 0.13, tx1 + run * 0.62, yc + 0.13, kz - 0.01, kz + 0.07, MARBLE_W);
    if (detail >= 2) s += seg(P(tx1 + run * 0.62 + 0.003, yc + 0.09, kz + 0.035), P(tx1 + run * 0.62 + 0.003, yc - 0.09, kz + 0.035), GOLD, 0.9);
    s += cheek(sy1 + 0.04);
  }
  // Hall of Honour.
  const frame = clamp(k.frame),
    cols = clamp(k.columns),
    roof = clamp(k.roof);
  const lahit = k.lahit > 0 && k.lahit < 1 ? lahitAt(k.lahit) : null;
  if (k.lahit >= 1 || (lahit && lahit[0] < cx1)) s += lahitSVG(P, ...(lahit || [-1.7, yc, zs]));
  if (frame > 0) {
    if (frame >= 1) s += box(P, hx0, hy0, hx1, hy1, zt, zs, WHITE_TRAV);
    const zTop = zs + (zc - zs) * frame,
      zWall = zs + (ze - zs) * frame,
      pillar = (x, y, clad) => box(P, x - 0.026, y - 0.026, x + 0.026, y + 0.026, zs, zTop, clad ? WHITE_TRAV : CONC);
    const posts = [];
    for (let i = 0; i < 8; i++) {
      const y = hy0 + 0.03 + ((hy1 - hy0 - 0.06) * i) / 7;
      posts.push([hx0 + 0.03, y, "back"], [hx1 - 0.03, y, "front"]);
    }
    for (let i = 1; i < 13; i++) {
      const x = hx0 + 0.03 + ((hx1 - hx0 - 0.06) * i) / 13;
      posts.push([x, hy0 + 0.03, "back"], [x, hy1 - 0.03, "front"]);
    }
    // cladding goes on pillar by pillar, back to front
    const order = posts.map((p, i) => [p[0] + p[1], i]).sort((a, b) => a[0] - b[0]);
    const clad = new Set(order.slice(0, Math.round(cols * posts.length)).map(([, i]) => i));
    const behind = [],
      front = [];
    posts.forEach(([x, y, side], i) => (side === "back" ? behind : front).push({ depth: x + y, s: pillar(x, y, clad.has(i)) }));
    s += painted(behind);
    // the inner hall's walls; on its front the bronze door and, in gold
    // leaf, the Address to the Youth (left) and the Tenth Year Speech (right)
    s += box(P, cx0, cy0, cx1, cy1, zs, zWall, mixAll(CONC, trav, cols));
    if (cols >= 1 && detail >= 1) {
      s += poly([P(cx1 + 0.002, yc - 0.1, zs), P(cx1 + 0.002, yc + 0.1, zs), P(cx1 + 0.002, yc + 0.1, zs + 0.46), P(cx1 + 0.002, yc - 0.1, zs + 0.46)], GOLD);
      s += poly([P(cx1 + 0.004, yc - 0.085, zs), P(cx1 + 0.004, yc + 0.085, zs), P(cx1 + 0.004, yc + 0.085, zs + 0.44), P(cx1 + 0.004, yc - 0.085, zs + 0.44)], lit ? mix(BRONZE, "#ffd36e", 0.55) : BRONZE);
      if (detail >= 2) {
        s += seg(P(cx1 + 0.005, yc, zs), P(cx1 + 0.005, yc, zs + 0.44), "#5a3f20", 0.8);
        s += inscription(P, cx1 + 0.003, cy1 - 0.07, yc + 0.17, zs + 0.18, zs + 0.62, 7);
        s += inscription(P, cx1 + 0.003, yc - 0.17, cy0 + 0.07, zs + 0.18, zs + 0.62, 7);
      }
    }
    if (lahit && lahit[0] >= cx1) s += lahitSVG(P, ...lahit);
    s += painted(front);
    if (roof > 0) {
      // the colonnade's entablature, then the raised roof of the inner hall
      const e = 0.02,
        z1 = zc + (ze - zc) * clamp(roof * 2);
      s += box(P, hx0 - e, hy0 - e, hx1 + e, hy1 + e, zc, z1, roof < 1 ? CONC : trav);
      if (roof > 0.5) s += box(P, cx0 + 0.04, cy0 + 0.04, cx1 - 0.04, cy1 - 0.04, ze, ze + (za - ze) * clamp(roof * 2 - 1), roof < 1 ? CONC : trav);
      if (roof >= 1 && detail >= 2) {
        s += sawtooth(P, "y", hx1 + e + 0.001, hy0 - e, hy1 + e, ze - 0.012, trav) + sawtooth(P, "x", hy1 + e + 0.001, hx0 - e, hx1 + e, ze - 0.012, trav);
        s += sawtooth(P, "y", cx1 - 0.039, cy0 + 0.04, cy1 - 0.04, za - 0.01, trav, 0.03) + sawtooth(P, "x", cy1 - 0.039, cx0 + 0.04, cx1 - 0.04, za - 0.01, trav, 0.03);
        s += seg(P(hx1 + e + 0.002, hy0 - e, zc + 0.03), P(hx1 + e + 0.002, hy1 + e, zc + 0.03), trav[2], 1) + seg(P(hx0 - e, hy1 + e + 0.002, zc + 0.03), P(hx1 + e, hy1 + e + 0.002, zc + 0.03), trav[2], 1);
      }
    }
  }
  return s;
}
function anitkabirSVG(P, k, lit = false, detail = 2, time = 0) {
  let s = "";
  const trav = lit ? mixAll(TRAVERTINE, FLOODLIT, 0.4) : TRAVERTINE;
  // Rasattepe: the Phrygian tumuli, dug away as the hill is levelled.
  if (!(k.level >= 1)) for (const [x, y, r] of TUMULI) s += lathe(P, x, y, domeProfile(r, 0, r * 0.55 * (1 - clamp(k.level)) + 0.001, 4), ["#b79a6c", "#9d8256", "#836b44"], { n: 16 });
  // Ground: the square's kilim and the paved Road of Lions.
  if (k.square > 0) s += squareSVG(P, clamp(k.square), detail);
  if (k.lions > 0) {
    s += poly([P(AK.rx0, AK.qy1 + 0.1, 0.006), P(AK.rx1, AK.qy1 + 0.1, 0.006), P(AK.rx1, 2.1, 0.006), P(AK.rx0, 2.1, 0.006)], "#e4d8bd");
    if (detail >= 2) for (let y = AK.qy1 + 0.16; y < 2.1; y += 0.06) s += seg(P(AK.rx0, y, 0.007), P(AK.rx1, y, 0.007), "#cbbd9c", 0.6);
  }
  // Everything standing, far to near.
  const list = [];
  const park = k.flag > 0.3;
  if (park) for (const [x, y, r] of PARK) list.push({ depth: x + y, s: tree(P, x, y, r) });
  list.push({ depth: AK.tx1 + AK.ty1, s: hallSVG(P, k, trav, lit, detail) });
  const built = (k.towers || 0) * (TOWERS.length + 3);
  TOWERS.forEach(([x, y], i) => {
    const t = clamp(built - i);
    if (t > 0) list.push({ depth: x + y, s: towerSVG(P, x, y, t, lit, detail, trav) });
  });
  // Porticoes round the square go up with the towers.
  const por = clamp(built - TOWERS.length);
  if (por > 0) {
    const pg = AK.pole[1];
    for (const [x0, y0, x1, y1] of [[1.92, -1.83, 2.06, pg - 0.18], [1.92, pg + 0.18, 2.06, 0.43], [0.68, 0.49, 0.82, 0.63], [1.58, 0.49, 1.72, 0.63], [0.68, -2.03, 0.82, -1.89], [1.58, -2.03, 1.72, -1.89], [0.33, 0.15, 0.47, 0.43], [0.33, -1.83, 0.47, -1.55]])
      list.push({ depth: x1 + y1 - 0.05, s: porticoSVG(P, x0, y0, x1, y1, por, trav, detail) });
  }
  const lions = Math.floor((k.lions || 0) * 24 + 1e-9);
  LIONS.slice(0, lions).forEach(([x, y, dir]) => list.push({ depth: x + y, s: lionSVG(P, x, y, dir, detail) }));
  if (k.lions >= 1) list.push({ depth: 0.82 + 1.76, s: groupSVG(P, 0.82, 1.76, false) }, { depth: 1.58 + 1.76, s: groupSVG(P, 1.58, 1.76, true) });
  // The flagpole on the square's east stairs: 33.5 m of one-piece steel;
  // the flag goes up as the step finishes.
  if (k.flag > 0.5) {
    const [px, py] = AK.pole,
      top = AK.poleTop,
      raise = clamp(k.flag * 2 - 1);
    let f = "";
    for (let i = 0; i < 3; i++) f += box(P, px - 0.08 + i * 0.02, py - 0.1 + i * 0.02, px + 0.08 - i * 0.02, py + 0.1 - i * 0.02, i * 0.02, (i + 1) * 0.02, WHITE_TRAV);
    f += box(P, px - 0.03, py - 0.03, px + 0.03, py + 0.03, 0.06, 0.12, ["#9c7a45", "#7c5a32", "#634626"]);
    f += seg(P(px, py, 0.12), P(px, py, top), "#8d949b", 1.8) + seg(P(px - 0.004, py + 0.004, 0.12), P(px - 0.004, py + 0.004, top), "#e9edf0", 0.6);
    f += circle(...P(px, py, top + 0.012), ballR(P, px, py, top + 0.012, 0.012), GOLD);
    const G = 0.26,
      ftop = 0.3 + (top - 0.33) * raise;
    f += flagSVG(P, px, py, ftop, G, time * 2.2);
    list.push({ depth: px + py + 0.2, s: f });
  }
  s += painted(list);
  return s;
}
const ANITKABIR_DONE = { level: 1, raftRebar: 1, raft: 1, podium: 1, frame: 1, columns: 1, roof: 1, lahit: 1, square: 1, lions: 1, towers: 1, flag: 1, done: true };
const HALL_OUTLINE = rectOutline(AK.tx0, AK.ty0, AK.tx1, AK.ty1);
export const ANITKABIR = {
  system: "monument",
  ridge: AK.poleTop - AK.za,
  spec: () => ({ hw: 2, h: AK.za - 0.3, floors: 1, wall: { faces: TRAVERTINE, grain: "#bba982", pattern: "anitkabir" }, roof: TRAVERTINE }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "level", label: "Rasattepe tesviye: kazıda Frig tümülüsleri çıkıyor, müzeye taşınıyor", w: 1, cost: 3 },
    { key: "raftRebar", label: "Radye temel donatısı", w: 0.7, cost: 3, inspect: "radye donatısı ve paspayı", next: "beton dökülebilir" },
    { key: "raft", label: "Radye temel betonu", w: 0.8, cost: 4, pour: true },
    { key: "podium", label: "Kaide ve 42 basamak: betonarme, traverten kaplama, ortada hitabet kürsüsü", w: 1, cost: 4 },
    { key: "frame", label: "Şeref Holü betonarme iskeleti: 44 kolon ve iç hol", w: 1.2, cost: 5, pour: true },
    { key: "columns", label: "Kolonlar beyaz Kayseri traverteni; cephede altın varaklı yazılar", w: 1.1, cost: 5 },
    { key: "roof", label: "Çatı: betonarme döşeme, Selçuklu testere dişi saçak", w: 0.9, cost: 4, inspect: "çatı kirişleri ve korniş", next: "lahit taşı konabilir" },
    { key: "lahit", label: "Lahit: 40 tonluk tek parça kırmızı mermer", w: 0.6, cost: 3 },
    { key: "square", label: "Tören Meydanı: 373 kilim desenli traverten döşeme", w: 1, cost: 4 },
  ],
  frameEnd: 0.72,
  later: [
    { key: "lions", label: "Aslanlı Yol: 12 çift Hitit üslubu aslan, iki heykel grubu", a: 0.72, b: 0.8, cost: 3 },
    { key: "towers", label: "On kule, kabartmalar ve revaklar", a: 0.8, b: 0.87, cost: 3 },
    { key: "flag", label: "33,5 m'lik bayrak direği ve Barış Parkı", a: 0.87, b: 0.93, cost: 2 },
    { key: "handover", label: "10 Kasım 1953: Anıtkabir açılıyor", a: 0.93, b: 1, cost: 2 },
  ],
  garden: false,
  live: true,
  scene: (P, sp, plan, shown, lit, time = 0) => anitkabirSVG(P, progress(plan, shown), lit, 2, time),
  shadow: (P, sp, t) => castShadow(P, HALL_OUTLINE, AK.za * 0.5 * t + 0.1),
  shadowFrom: "frame",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, HALL_OUTLINE, AK.za * 0.5 + 0.1) : "";
    return s + anitkabirSVG(P, ANITKABIR_DONE, lit, detail);
  },
  snow: () => "",
  workHeight: () => null,
  crew(sp, p, k) {
    if (p.key === "level") return [at(0.5 + 0.9 * k, -0.6, 0, "shovel"), at(1.3, 0.2, 0, "carry")];
    if (p.key === "raftRebar") return [at(-1.5, -0.4, 0, "tie"), at(-0.6, -1.1, 0, "tie")];
    if (p.key === "raft") return [at(-1.2, -0.3, 0, "hose"), at(-0.5, -1.0, 0, "trowel")];
    if (p.key === "podium") return [at(0.2, -0.05, 0, "trowel")];
    if (p.key === "frame" || p.key === "columns") return [at(-0.05, -0.4, AK.zt, p.key === "frame" ? "hose" : "trowel"), at(0.4, 0.1, 0, "carry")];
    if (p.key === "roof") return [at(-0.9, -0.3, AK.ze, "hammer")];
    if (p.key === "lahit") {
      const [x, y, z] = lahitAt(k);
      return [at(x + 0.16, y + 0.12, z, "bar"), at(x + 0.16, y - 0.16, z, "bar")];
    }
    if (p.key === "square") return [at(0.6 + 1.2 * k, -1.2, 0, "trowel"), at(1.5, 0.1, 0, "carry")];
    if (p.key === "lions") return [at(1.2, 0.8 + 0.9 * k, 0, "carry")];
    if (p.key === "towers") return [at(1.2, 0.3, 0, "trowel")];
    return null;
  },
  metraj(sp, p, k) {
    if (p.key === "lions") return { lions: k * 24 };
    if (p.key === "towers") return { towers: Math.min(10, k * 13) };
    return null;
  },
  items: (q) => [`Aslan ${Math.floor((q.lions || 0) + 1e-9)}/24`, `Kule ${Math.floor((q.towers || 0) + 1e-9)}/10`],
};

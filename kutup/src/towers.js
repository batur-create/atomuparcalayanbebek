// Three towers (n37): a capsule tower of factory-made rooms bolted to a
// concrete core, a tower whose floors each turn a few degrees on the one
// below, and an Intze water tower. All go up with the tower crane; src/special.js
// wires them into the site, the crew, the crane and the quantities.
import { GLASS, LIT, box, circle, faceX, faceY, poly, rng, seg } from "./iso.js";
import { CONCRETE, M, PLY, REBAR, V, WET, at, castShadow, clamp, facing, mix, mixAll, progress, rectOutline, shade } from "./kit.js";

const painted = (list) => list.sort((a, b) => a.depth - b.depth).map((e) => e.s).join("");
const STEEL = ["#7d8995", "#66727e", "#525d68"];

// =====================================================================
// Kapsül kule: a concrete core with stairs and lifts, climbed in three
// lifts; capsules made in a factory like shipping containers, trucked in,
// craned up and each held by four high-strength bolts, so any one can be
// unbolted and replaced. A round window on every capsule's end.
// =====================================================================
const Q = { core: 0.4, len: 0.8, half: 0.25, h: 0.46, z0: 0.9, step: 0.52, floors: 10 };
const CAPSULE = ["#f2efe6", "#dcd8cc", "#c2bdb0"],
  PORT = "#2e3a4a";
// Three capsules a floor on three of the core's four sides, turning a side
// each floor, and slid along their side so the stack looks piled up.
const CAPSULES = (() => {
  const list = [];
  for (let f = 0; f < Q.floors; f++)
    for (let j = 0; j < 3; j++) {
      const side = (f + j) % 4,
        off = ((f * 7 + j * 3) % 5) * 0.06 - 0.12,
        z0 = Q.z0 + f * Q.step;
      const [ox, oy] = [[1, 0], [0, 1], [-1, 0], [0, -1]][side];
      const along = [off - Q.half, off + Q.half];
      const out = [Q.core, Q.core + Q.len].map((v) => v * (ox || oy));
      const [x0, x1] = ox ? [Math.min(...out), Math.max(...out)] : along;
      const [y0, y1] = oy ? [Math.min(...out), Math.max(...out)] : along;
      list.push({ f, side, x0, x1, y0, y1, z0, z1: z0 + Q.h });
    }
  return list;
})();
const capsuleTop = Q.z0 + Q.floors * Q.step;
function portSVG(P, c, lit) {
  // The round window on the capsule's outer end, where that end faces us.
  const r = 0.16,
    zc = (c.z0 + c.z1) / 2;
  let pts;
  if (c.side === 0) pts = Array.from({ length: 16 }, (_, i) => P(c.x1 + 0.004, (c.y0 + c.y1) / 2 + r * Math.cos((i / 16) * Math.PI * 2), zc + r * Math.sin((i / 16) * Math.PI * 2)));
  else if (c.side === 1) pts = Array.from({ length: 16 }, (_, i) => P((c.x0 + c.x1) / 2 + r * Math.cos((i / 16) * Math.PI * 2), c.y1 + 0.004, zc + r * Math.sin((i / 16) * Math.PI * 2)));
  else return "";
  return poly(pts, lit ? LIT : PORT) + (lit ? "" : poly(pts.slice(0, 5).concat([pts[0]]), "#ffffff", 0.12));
}
function capsuleTowerSVG(P, k, lit = false, detail = 2, seed = 1) {
  const list = [];
  const r = rng(seed);
  // Core, lift by lift, then the lobby glass under it.
  const core = (clamp(k.core0) + clamp(k.core1) + clamp(k.core2)) / 3,
    top = 0.3 + (capsuleTop + 0.3 - 0.3) * core,
    wetLift = [k.core0, k.core1, k.core2].find((v) => v > 0 && v < 1);
  for (let z = 0.3; z < top - 1e-6; z += Q.step) {
    const z1 = Math.min(top, z + Q.step),
      fresh = wetLift !== undefined && z1 > top - Q.step * 3.4;
    const faces = fresh ? mixAll(WET, CONCRETE, clamp((wetLift - 0.6) / 0.4)) : CONCRETE;
    let s = box(P, -Q.core, -Q.core, Q.core, Q.core, z, z1, faces);
    if (detail >= 2 && k.plates > 0 && z > Q.z0 - 0.1) for (const y of [-0.2, 0.2]) s += circle(...P(Q.core + 0.005, y, z + 0.4), 0.9, "#3c4146") + circle(...P(y, Q.core + 0.005, z + 0.4), 0.9, "#3c4146");
    list.push({ depth: z * 0.999, s });
  }
  // The climbing form and the rebar standing out of the lift under way.
  if (wetLift !== undefined) {
    let s = "";
    for (const [x, y] of [[-0.3, Q.core], [0, Q.core], [0.3, Q.core], [Q.core, -0.3], [Q.core, 0], [Q.core, 0.3]]) s += seg(P(x, y, top), P(x, y, top + 0.35), REBAR, 0.9);
    if (wetLift < 0.6) s += box(P, -Q.core - 0.05, -Q.core - 0.05, Q.core + 0.05, Q.core + 0.05, top - 0.5, top, PLY);
    s += box(P, -Q.core - 0.2, -Q.core - 0.2, Q.core + 0.2, Q.core + 0.2, top - 0.62, top - 0.58, STEEL);
    list.push({ depth: top + 1, s });
  }
  // Capsules, bottom up.
  const placed = Math.round(((clamp(k.capsules0) + clamp(k.capsules1) + clamp(k.capsules2)) / 3) * CAPSULES.length);
  CAPSULES.slice(0, placed).forEach((c) => {
    let s = box(P, c.x0, c.y0, c.x1, c.y1, c.z0, c.z1, CAPSULE);
    s += portSVG(P, c, lit && r() < 0.55 && k.services > 0.5);
    if (detail >= 2) {
      // The joint between the shell's two halves, and the bolt plates.
      if (c.side === 0 || c.side === 2) s += seg(P(c.x0, c.y1 + 0.003, c.z0 + 0.06), P(c.x1, c.y1 + 0.003, c.z0 + 0.06), "#b3ad9f", 0.6);
      if (c.side === 1 || c.side === 3) s += seg(P(c.x1 + 0.003, c.y0, c.z0 + 0.06), P(c.x1 + 0.003, c.y1, c.z0 + 0.06), "#b3ad9f", 0.6);
    }
    list.push({ depth: (c.x0 + c.x1) / 2 + (c.y0 + c.y1) / 2 + (c.z0 + c.z1) / 2, s });
  });
  let s = "";
  // Glass lobby on the ground floor, under the capsules.
  if (k.lobby > 0) {
    const zl = 0.3 + 0.55 * clamp(k.lobby / 0.6);
    s += box(P, -0.95, -0.95, 0.95, 0.95, 0.3, zl, [lit ? "#ffe39a" : "#8fa4bf", lit ? LIT : GLASS, lit ? "#e8b84f" : "#33405a"]);
    if (k.lobby >= 1) s += box(P, -1.0, -1.0, 1.0, 1.0, 0.85, 0.9, CONCRETE) + poly(faceY(P, 0.951, -0.2, 0.2, 0.3, 0.75), lit ? LIT : "#22303f");
  }
  s += painted(list);
  // On the roof: the water tank and the mast with its warning light.
  if (k.roof > 0.3) {
    const zt = capsuleTop + 0.3;
    s += box(P, -0.3, -0.3, 0.2, 0.2, zt, zt + 0.32, ["#e2ded4", "#c9c4b8", "#aea99c"]);
    s += seg(P(0.25, 0.25, zt), P(0.25, 0.25, zt + 0.9), "#3c4146", 1.2);
    s += circle(...P(0.25, 0.25, zt + 0.92), 1.8, lit ? "#ff5a4a" : "#a33a30");
  }
  return s;
}
const CAPSULE_DONE = { core0: 1, core1: 1, core2: 1, plates: 1, capsules0: 1, capsules1: 1, capsules2: 1, torque: 1, lobby: 1, services: 1, roof: 1 };
export const CAPSULE_TOWER = {
  system: "capsule",
  ridge: 1.0,
  spec: () => ({ hw: 1.45, h: capsuleTop, floors: Q.floors, wall: { faces: CAPSULE, grain: "#b3ad9f", pattern: "capsule" }, roof: CONCRETE }),
  steps: [
    ...[0, 1, 2].map((i) => ({ key: "core", floor: i, label: `Çekirdek: tırmanır kalıpla ${i + 1}/3`, w: 1.1, cost: 4, lift: true, liftAs: "colRebar", pour: true })),
    { key: "plates", label: "Kapsül bağlantı plakaları ve bulon şablonları", w: 0.6, cost: 2, inspect: "bulon şablonları ve çekirdeğin düşeyliği", next: "kapsüller takılabilir" },
    ...[0, 1, 2].map((i) => ({ key: "capsules", floor: i, label: `Kapsüller ${i + 1}/3: fabrikadan geliyor, dört bulonla takılıyor`, w: 1.2, cost: 6, lift: true, liftAs: "capsule" })),
    { key: "torque", label: "Bulon sıkma", w: 0.5, cost: 1, inspect: "her kapsülün dört bulonunda tork kontrolü", next: "tesisata geçilebilir" },
  ],
  frameEnd: 0.72,
  later: [
    { key: "lobby", label: "Zemin kat: cam giriş holü", a: 0.72, b: 0.8, cost: 4 },
    { key: "services", label: "Kapsüllere su ve elektrik bağlantıları", a: 0.8, b: 0.88, cost: 4 },
    { key: "roof", label: "Çatı: su deposu ve uyarı ışıklı direk", a: 0.88, b: 0.93, cost: 2 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  liftUntil: 0.68,
  craneEnd: 0.72,
  scene: (P, sp, plan, shown, lit) => capsuleTowerSVG(P, progress(plan, shown), lit),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-1.2, -1.2, 1.2, 1.2), capsuleTop * 0.4 * t + 0.2),
  shadowFrom: "capsules",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(-1.2, -1.2, 1.2, 1.2), capsuleTop * 0.4 + 0.2) + box(P, -1.25, -1.25, 1.25, 1.25, 0, 0.3, CONCRETE) : "";
    return s + capsuleTowerSVG(P, CAPSULE_DONE, lit, detail, seed);
  },
  snow: (P) => poly([P(-Q.core, -Q.core, capsuleTop + 0.31), P(Q.core, -Q.core, capsuleTop + 0.31), P(Q.core, Q.core, capsuleTop + 0.31), P(-Q.core, Q.core, capsuleTop + 0.31)], "#f4f7fa", 0.95),
  workHeight(sp, p, k) {
    if (p.key === "core") return 0.3 + (capsuleTop * (p.floor + k)) / 3 + 0.2;
    if (p.key === "capsules") return Q.z0 + Q.floors * Q.step * ((p.floor + k) / 3) + 0.4;
    if (p.key === "plates" || p.key === "torque") return capsuleTop;
    return null;
  },
  chute: () => [1.2, -1.3, 0.6],
  crew(sp, p, k) {
    if (p.key === "core") {
      const z = 0.3 + (capsuleTop * (p.floor + Math.min(k, 0.95))) / 3;
      return [at(0, 0, z, k < 0.4 ? "tie" : k < 0.6 ? "hammer" : "hose"), at(1.1, 1.3, 0.3, "carry")];
    }
    if (p.key === "capsules") {
      const f = Math.min(Q.floors - 1, Math.floor(Q.floors * ((p.floor + k) / 3)));
      return [at(0.1, 0.1, Q.z0 + f * Q.step + Q.h + 0.01, "hammer"), at(1.2, 1.3, 0.3, "carry")];
    }
    if (p.key === "plates" || p.key === "torque") return [at(0, 0, 0.3 + capsuleTop * clamp(k), "hammer"), at(1.3, 1.1, 0.3, "survey")];
    if (p.key === "lobby") return [at(0.6, 1.25, 0.3, "carry"), at(-0.6, 1.25, 0.3, "hammer")];
    return null;
  },
  // Core walls 25 cm round a 1.3 m shaft; capsules about 4 t of steel shell
  // and fit-out each (here, the steel only: about 1.2 t).
  metraj(sp, p, k) {
    const ring = (4 * 2 * Q.core * M - 4 * 0.25) * 0.25 * capsuleTop * M;
    if (p.key === "core") return { concrete: (k * ring) / 3, rebar: (k * ring * 0.14) / 3 };
    if (p.key === "capsules") return { steel: (k * CAPSULES.length * 1.2) / 3, capsules: (k * CAPSULES.length) / 3 };
    return null;
  },
  items: (q, num) => (q.capsules > 0 ? `Kapsül ${Math.round(q.capsules)}/${CAPSULES.length}` : `Donatı ${num(q.rebar, 2)} t`),
};

// =====================================================================
// Burgulu kule: a concrete core climbs ahead; each floor is a square plate
// turned 9° on the one below, on table forms, with eight perimeter columns
// that lean to follow the turn (so each storey's columns are cast at their
// own angle and checked before the pour); then the glass skin.
// =====================================================================
const T = { s: 1.0, h: 0.5, floors: 11, turn: (9 * Math.PI) / 180, core: 0.34 };
const twistTop = 0.3 + T.floors * T.h;
const corner = (i, f, z, s = T.s) => {
  const a = f * T.turn + (i * Math.PI) / 2 + Math.PI / 4;
  return [Math.SQRT2 * s * Math.cos(a), Math.SQRT2 * s * Math.sin(a), z];
};
// Perimeter columns: four corners and four mid-sides.
const colPt = (i, f, z) => {
  const c = corner(Math.floor(i / 2), f, z),
    d = corner((Math.floor(i / 2) + 1) % 4, f, z);
  return i % 2 ? [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2, z] : c;
};
const SKIN = ["#a8bfd8", "#7f9dbd", "#5d7a9b"];
function twistSVG(P, k, lit = false, detail = 2, seed = 3) {
  const r = rng(seed);
  let s = "";
  const core = (clamp(k.core0) + clamp(k.core1)) / 2,
    coreTop = 0.3 + (twistTop + 0.4 - 0.3) * core;
  const built = ((clamp(k.floors0) + clamp(k.floors1) + clamp(k.floors2) + clamp(k.floors3)) / 4) * T.floors;
  const glazed = clamp(k.glazing) * T.floors;
  for (let f = 0; f < T.floors; f++) {
    const z0 = 0.3 + f * T.h,
      z1 = z0 + T.h;
    // The core inside this storey (seen until the glass closes it).
    if (coreTop > z0 && glazed < f + 1) s += box(P, -T.core, -T.core, T.core, T.core, z0, Math.min(z1, coreTop), CONCRETE);
    if (built <= f) continue;
    const part = clamp(built - f);
    // Slab on its table forms, then the leaning columns to the floor above.
    const slab = Array.from({ length: 4 }, (_, i) => P(...corner(i, f, z0 + 0.06)));
    // The floor in the shade of the slab above, its edge catching the light.
    s += poly(slab, part < 0.6 ? PLY[0] : f === Math.floor(built) && part < 1 ? mix(WET[0], CONCRETE[0], (part - 0.6) / 0.4) : f < Math.floor(built) - 1 || part >= 1 ? "#9f9b92" : CONCRETE[0]);
    for (let i = 0; i < 4; i++) s += seg(slab[i], slab[(i + 1) % 4], "#ebe8e1", 1.3);
    if (glazed >= f + 1) {
      // The glass skin of the storey: four twisted faces, those facing us.
      const faces = [];
      for (let i = 0; i < 4; i++) {
        const a = corner(i, f, z0),
          b = corner((i + 1) % 4, f, z0),
          c = corner((i + 1) % 4, f + 1, z1),
          d = corner(i, f + 1, z1);
        const mid = (f + 0.5) * T.turn + (i * Math.PI) / 2 + Math.PI / 2 + Math.PI / 4 - Math.PI / 4;
        const n = [Math.cos(mid), Math.sin(mid), 0];
        if (!facing(n)) continue;
        const on = lit && r() < 0.6;
        let e = poly([P(...a), P(...b), P(...c), P(...d)], on ? mix(LIT, shade(P, n, SKIN), 0.25) : shade(P, n, SKIN));
        e += seg(P(...a), P(...b), "#eef2f6", 1.4);
        if (detail >= 2) for (const t of [0.25, 0.5, 0.75]) e += seg(P(...a.map((v, j) => v + (b[j] - v) * t)), P(...d.map((v, j) => v + (c[j] - v) * t)), "#4c6886", 0.6, 0.8);
        faces.push({ depth: n[0] + n[1], s: e });
      }
      s += painted(faces);
    } else if (part >= 1 || f < Math.floor(built)) {
      for (let i = 0; i < 8; i++) s += seg(P(...colPt(i, f, z0 + 0.06)), P(...colPt(i, f + 1, z1)), part >= 1 ? "#b9b5ac" : REBAR, part >= 1 ? 2.2 : 1);
    }
  }
  // The roof and its crown of fins once the skin is up.
  if (glazed >= T.floors) {
    const top = Array.from({ length: 4 }, (_, i) => P(...corner(i, T.floors, twistTop)));
    s += poly(top, "#d9dde2");
    if (k.crown > 0)
      for (let i = 0; i < 8; i++) {
        const p = colPt(i, T.floors, twistTop);
        s += seg(P(...p), P(p[0] * 0.9, p[1] * 0.9, twistTop + 0.55 * clamp(k.crown)), "#eef2f6", 2);
      }
    if (k.crown >= 1) {
      s += seg(P(0, 0, twistTop), P(0, 0, twistTop + 1.0), "#3c4146", 1.2);
      s += circle(...P(0, 0, twistTop + 1.02), 1.8, lit ? "#ff5a4a" : "#a33a30");
    }
  }
  if (k.openings > 0.4) {
    const [a, b] = [corner(1, 0, 0.3), corner(2, 0, 0.3)];
    s += poly([P(...a.map((v, i) => (i < 2 ? v * 0.35 + b[i] * 0.65 : 0.3))), P(...a.map((v, i) => (i < 2 ? v * 0.55 + b[i] * 0.45 : 0.3))), P(...a.map((v, i) => (i < 2 ? v * 0.55 + b[i] * 0.45 : 0.72))), P(...a.map((v, i) => (i < 2 ? v * 0.35 + b[i] * 0.65 : 0.72)))], lit ? LIT : "#22303f");
  }
  return s;
}
const TWIST_DONE = { core0: 1, core1: 1, floors0: 1, floors1: 1, floors2: 1, floors3: 1, glazing: 1, crown: 1, openings: 1 };
export const TWIST_TOWER = {
  system: "twist",
  ridge: 1.1,
  spec: () => ({ hw: 1.45, h: twistTop - 0.3, floors: T.floors, wall: { faces: SKIN, grain: "#4c6886", pattern: "twist" }, roof: SKIN }),
  steps: [
    ...[0, 1].map((i) => ({ key: "core", floor: i, label: `Çekirdek perdeleri: tırmanır kalıp ${i + 1}/2`, w: 1.1, cost: 4, lift: true, liftAs: "colRebar", pour: true })),
    ...[0, 1, 2, 3].map((i) => ({ key: "floors", floor: i, label: `Katlar ${i + 1}/4: masa kalıp, eğik kolonlar, döşeme betonu`, w: 1.2, cost: 6, lift: true, liftAs: "deckForm", pour: true, ...(i === 0 ? { inspect: "kolon eğimleri ve dönme açısı: her kat 9°", next: "üst katlara geçilebilir" } : {}) })),
  ],
  frameEnd: 0.66,
  later: [
    { key: "glazing", label: "Cam cephe: kat kat, bükülen yüzeye panel panel", a: 0.66, b: 0.8, cost: 9, lift: true },
    { key: "crown", label: "Çatı tacı ve uyarı ışığı", a: 0.8, b: 0.87, cost: 2 },
    { key: "openings", label: "Giriş ve lobi", a: 0.87, b: 0.93, cost: 3 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  liftUntil: 0.8,
  craneEnd: 0.82,
  scene: (P, sp, plan, shown, lit) => twistSVG(P, progress(plan, shown), lit),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-1.2, -1.2, 1.2, 1.2), twistTop * 0.4 * t + 0.2),
  shadowFrom: "floors",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(-1.2, -1.2, 1.2, 1.2), twistTop * 0.4 + 0.2) + box(P, -1.25, -1.25, 1.25, 1.25, 0, 0.3, CONCRETE) : "";
    return s + twistSVG(P, TWIST_DONE, lit, detail, seed);
  },
  snow: (P) => poly(Array.from({ length: 4 }, (_, i) => P(...corner(i, T.floors, twistTop + 0.01))), "#f4f7fa", 0.95),
  workHeight(sp, p, k) {
    if (p.key === "core") return 0.3 + ((twistTop + 0.4) * (p.floor + k)) / 2 + 0.2;
    if (p.key === "floors") return 0.3 + T.floors * T.h * ((p.floor + k) / 4) + 0.3;
    if (p.key === "glazing") return 0.3 + T.floors * T.h * k + 0.3;
    return null;
  },
  chute: () => [1.2, -1.3, 0.6],
  crew(sp, p, k) {
    if (p.key === "core") return [at(0, 0, 0.3 + ((twistTop + 0.4) * (p.floor + Math.min(k, 0.95))) / 2, "tie"), at(1.2, 1.3, 0.3, "carry")];
    if (p.key === "floors") {
      const f = Math.min(T.floors - 1, Math.floor(T.floors * ((p.floor + k) / 4)));
      const [x, y] = corner(0, f, 0);
      return [at(x * 0.6, y * 0.6, 0.36 + f * T.h, k % 0.25 < 0.15 ? "hose" : "tie"), at(-x * 0.5, -y * 0.5, 0.36 + f * T.h, "survey")];
    }
    if (p.key === "glazing") {
      const f = Math.min(T.floors - 1, Math.floor(T.floors * k));
      return [at(0, 0.5, 0.36 + f * T.h, "carry")];
    }
    return null;
  },
  // Core walls 25 cm; slabs 22 cm flat plates; columns 40 × 40.
  metraj(sp, p, k) {
    if (p.key === "core") {
      const vol = 4 * 2 * T.core * M * 0.25 * (twistTop + 0.4) * M;
      return { concrete: (k * vol) / 2, rebar: (k * vol * 0.14) / 2 };
    }
    if (p.key === "floors") {
      const per = (2 * T.s * M) ** 2 * 0.22 + 8 * 0.4 * 0.4 * T.h * M * 1.02;
      return { concrete: (k * per * T.floors) / 4, rebar: (k * per * T.floors * 0.11) / 4, turn: (k * (T.floors * 9)) / 4 };
    }
    return null;
  },
  items: (q, num) => (q.turn > 0 ? `Dönüş ${Math.round(q.turn)}°` : `Donatı ${num(q.rebar, 2)} t`),
};

// =====================================================================
// Su kulesi (Intze): six columns with ring beams every few metres, a ring
// beam under the tank, a conical bottom ring and a cylindrical wall cast in
// one go (no cold joint in a water-retaining wall), a domed roof, then the
// tank filled and watched for a day before it is accepted.
// =====================================================================
const W = { col: 0.95, n: 6, ring: [1.55, 2.75], base: 3.8, cone: 4.3, wall: 5.2, dome: 0.36, R: 1.35 };
const TANK = ["#e8e4dc", "#cdc9c0", "#b0aca3"],
  BAND = ["#5d8fc7", "#4a76b0", "#345d93"];
// The tank's outside, as a profile turned round the axis.
const PROFILE = [
  [W.col + 0.12, W.base],
  [W.R, W.cone],
  [W.R, W.wall],
  [W.R * 0.92, W.wall + W.dome * 0.42],
  [W.R * 0.66, W.wall + W.dome * 0.8],
  [W.R * 0.34, W.wall + W.dome * 0.98],
  [0.22, W.wall + W.dome],
];
function revolve(P, prof, faces, { n = 28, paint = null, upto = Infinity, wet = 0 } = {}) {
  let s = "";
  for (let j = 0; j < prof.length - 1; j++) {
    const [r0, z0] = prof[j],
      [r1, z1] = prof[j + 1];
    if (z0 >= upto) break;
    const zt = Math.min(z1, upto),
      rt = r0 + ((r1 - r0) * (zt - z0)) / (z1 - z0 || 1);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2,
        a1 = ((i + 1) / n) * Math.PI * 2,
        am = (a0 + a1) / 2,
        dz = zt - z0,
        dr = rt - r0,
        nn = [Math.cos(am) * dz, Math.sin(am) * dz, -dr],
        l = Math.hypot(...nn) || 1;
      const nu = nn.map((v) => v / l);
      if (!facing(nu)) continue;
      const col = paint ? paint(j, i, (z0 + zt) / 2) : faces;
      s += poly([P(r0 * Math.cos(a0), r0 * Math.sin(a0), z0), P(r0 * Math.cos(a1), r0 * Math.sin(a1), z0), P(rt * Math.cos(a1), rt * Math.sin(a1), zt), P(rt * Math.cos(a0), rt * Math.sin(a0), zt)], shade(P, nu, wet > 0 ? mixAll(col, WET, wet) : col));
    }
  }
  return s;
}
const colAt = (i) => [W.col * Math.cos((i / W.n) * Math.PI * 2 + Math.PI / 6), W.col * Math.sin((i / W.n) * Math.PI * 2 + Math.PI / 6)];
function ringBeam(P, z, faces) {
  return revolve(P, [[W.col + 0.12, z - 0.22], [W.col + 0.12, z]], faces, { n: 30 }) + revolve(P, [[W.col + 0.12, z], [W.col - 0.12, z]], faces, { n: 30 });
}
function waterTowerSVG(P, k, lit = false, detail = 2) {
  let s = "";
  const shaft = (clamp(k.shaft0) + clamp(k.shaft1) + clamp(k.shaft2)) / 3,
    top = 0.3 + (W.base - 0.3) * shaft;
  const curShaft = [k.shaft0, k.shaft1, k.shaft2].find((v) => v > 0 && v < 1);
  const columns = (front) => {
    let t = "";
    for (let i = 0; i < W.n; i++) {
      const [x, y] = colAt(i);
      if (x + y >= 0 !== front) continue;
      if (curShaft !== undefined && curShaft < 0.5 && top > 0.35) for (const d of [-0.07, 0.07]) t += seg(P(x + d, y, 0.3), P(x + d, y, top + 0.3), REBAR, 0.8);
      const ztop = curShaft !== undefined && curShaft < 0.5 ? top - (W.base - 0.3) / 3 + 0.0 : top;
      if (ztop > 0.3) t += box(P, x - 0.12, y - 0.12, x + 0.12, y + 0.12, 0.3, Math.max(0.3, ztop), curShaft !== undefined && curShaft < 0.8 ? mixAll(WET, CONCRETE, clamp(curShaft / 0.8)) : CONCRETE);
      if (curShaft !== undefined && curShaft >= 0.5 && curShaft < 0.8) t += box(P, x - 0.15, y - 0.15, x + 0.15, y + 0.15, top - 0.6, top, PLY);
    }
    return t;
  };
  s += columns(false);
  for (const z of [...W.ring, W.base]) if (top >= z) s += ringBeam(P, z, ["#c3bfb6", "#a9a59c", "#8f8b83"]);
  s += columns(true);
  // Staging and formwork for the tank, then the one continuous pour.
  const form = clamp(k.tankForm),
    pour = clamp(k.tankPour);
  if (form > 0 && pour < 1) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2,
        r = 0.55;
      s += seg(P(r * Math.cos(a), r * Math.sin(a), W.ring[1]), P(r * Math.cos(a), r * Math.sin(a), W.base + 0.2), "#9aa4ae", 1.2);
    }
    if (form > 0.3) s += revolve(P, PROFILE.slice(0, 3), PLY, { upto: W.base + (W.wall - W.base) * clamp((form - 0.3) / 0.5) });
    if (form > 0.8 && detail >= 2) for (let z = W.cone + 0.1; z < W.wall; z += 0.18) s += revolve(P, [[W.R + 0.01, z], [W.R + 0.01, z + 0.02]], [REBAR, REBAR, REBAR], { n: 20 });
  }
  if (pour > 0) s += revolve(P, PROFILE.slice(0, 3), TANK, { upto: W.base + (W.wall - W.base) * clamp(pour / 0.7), wet: 1 - clamp((pour - 0.7) / 0.3) });
  const painted = clamp(k.paint);
  const tankColor = (j) => (j === 1 && painted > 0 ? mixAll(TANK, BAND, painted) : TANK);
  if (pour >= 1) s += revolve(P, PROFILE.slice(0, 3), TANK, { paint: tankColor });
  if (k.dome > 0) s += revolve(P, PROFILE.slice(2), TANK, { upto: W.wall + W.dome * clamp(k.dome), wet: 1 - clamp((k.dome - 0.6) / 0.4) });
  // Lantern and vent on the dome.
  if (k.dome >= 1) s += box(P, -0.18, -0.18, 0.18, 0.18, W.wall + W.dome - 0.02, W.wall + W.dome + 0.22, TANK) + box(P, -0.22, -0.22, 0.22, 0.22, W.wall + W.dome + 0.22, W.wall + W.dome + 0.27, STEEL);
  // The level gauge on the tank during the water test, and after.
  if (k.waterTest > 0) {
    const x = W.R * Math.cos(Math.PI / 4) + 0.03,
      level = W.cone + (W.wall - W.cone - 0.1) * clamp(k.waterTest / 0.4);
    s += seg(P(x, x, W.cone), P(x, x, W.wall - 0.05), "#3c4146", 2.6) + seg(P(x + 0.01, x + 0.01, W.cone), P(x + 0.01, x + 0.01, level), "#5aa3d9", 1.8);
    if (k.waterTest < 0.4) s += seg(P(0.3, 1.6, 0.05), P(0.1, 0.1, 0.35), "#c0533e", 1.6);
  }
  // Gallery round the tank and the stair up a column.
  const stair = clamp(k.stair);
  if (stair > 0) {
    const [x, y] = colAt(0);
    const up = 0.3 + (W.cone - 0.3) * stair;
    for (let z = 0.5; z < up; z += 0.2) s += seg(P(x + 0.16, y + 0.1, z), P(x + 0.16, y - 0.1, z), "#3c4146", 0.9);
    s += seg(P(x + 0.16, y + 0.1, 0.3), P(x + 0.16, y + 0.1, up), "#3c4146", 1) + seg(P(x + 0.16, y - 0.1, 0.3), P(x + 0.16, y - 0.1, up), "#3c4146", 1);
    if (stair >= 1) {
      s += revolve(P, [[W.R + 0.25, W.cone - 0.02], [W.R + 0.25, W.cone + 0.02]], STEEL, { n: 30 });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        if (Math.cos(a) + Math.sin(a) < -0.3) continue;
        s += seg(P((W.R + 0.25) * Math.cos(a), (W.R + 0.25) * Math.sin(a), W.cone), P((W.R + 0.25) * Math.cos(a), (W.R + 0.25) * Math.sin(a), W.cone + 0.3), "#3c4146", 0.8);
      }
      s += revolve(P, [[W.R + 0.25, W.cone + 0.29], [W.R + 0.25, W.cone + 0.31]], STEEL, { n: 30 });
    }
  }
  if (k.openings > 0.5) s += circle(...P(0, 0, W.wall + W.dome + 0.45), 2.2, lit ? "#ff5a4a" : "#a33a30") + seg(P(0, 0, W.wall + W.dome + 0.27), P(0, 0, W.wall + W.dome + 0.43), "#3c4146", 1);
  return s;
}
const WATER_DONE = { shaft0: 1, shaft1: 1, shaft2: 1, tankForm: 1, tankPour: 1, dome: 1, waterTest: 1, stair: 1, paint: 1, openings: 1 };
// The tank's capacity in m³: the conical ring and the cylinder.
export const TANK_M3 = Math.round((Math.PI * (W.R * M) ** 2 * (W.wall - W.cone) * M + (Math.PI * (W.cone - W.base) * M * ((W.col * M) ** 2 + W.col * M * W.R * M + (W.R * M) ** 2)) / 3) * 0.85);
export const WATER_TOWER = {
  system: "watertower",
  ridge: 0.5,
  spec: () => ({ hw: 1.45, h: W.wall + W.dome - 0.3, floors: 3, wall: { faces: TANK, grain: "#b0aca3", pattern: "intze" }, roof: TANK }),
  steps: [
    ...[0, 1, 2].map((i) => ({ key: "shaft", floor: i, label: `Kolonlar ve kuşak kirişleri ${i + 1}/3`, w: 1.1, cost: 4, lift: true, liftAs: "colRebar", pour: true })),
    { key: "tankForm", label: "Hazne kalıbı ve donatısı: konik halka ve silindir", w: 1.3, cost: 5, lift: true, liftAs: "deckForm", inspect: "hazne donatısı, pas payı ve su tutucu bantlar", next: "hazne betonu dökülebilir" },
    { key: "tankPour", label: "Hazne betonu: soğuk derz olmasın diye tek seferde", w: 1, cost: 5, pour: true },
    { key: "dome", label: "Üst kubbe ve havalandırma feneri", w: 0.8, cost: 3, pour: true, lift: true, liftAs: "deckForm" },
    { key: "waterTest", label: "Sızdırmazlık testi: hazne dolduruluyor", w: 1, cost: 1, inspect: "24 saatte su seviyesi düşmedi, sızıntı yok", next: "su verilebilir" },
  ],
  frameEnd: 0.7,
  later: [
    { key: "stair", label: "Çelik merdiven ve hazne balkonu", a: 0.7, b: 0.8, cost: 4 },
    { key: "paint", label: "Boya: hazne gövdesi mavi", a: 0.8, b: 0.88, cost: 3 },
    { key: "openings", label: "Borular ve uçak uyarı ışığı", a: 0.88, b: 0.93, cost: 2 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  liftUntil: 0.6,
  craneEnd: 0.62,
  scene: (P, sp, plan, shown, lit) => waterTowerSVG(P, progress(plan, shown), lit),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-W.R, -W.R, W.R, W.R), (W.wall + 0.2) * 0.4 * t + 0.2),
  shadowFrom: "tankPour",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(-W.R, -W.R, W.R, W.R), (W.wall + 0.2) * 0.4 + 0.2) + box(P, -1.25, -1.25, 1.25, 1.25, 0, 0.3, CONCRETE) : "";
    return s + waterTowerSVG(P, WATER_DONE, lit, detail);
  },
  snow: (P) => revolve(P, PROFILE.slice(3), ["#f4f7fa", "#eef2f6", "#e4e9ef"]),
  workHeight(sp, p, k) {
    if (p.key === "shaft") return 0.3 + ((W.base - 0.3) * (p.floor + k)) / 3 + 0.3;
    if (["tankForm", "tankPour", "dome"].includes(p.key)) return W.wall + 0.4;
    return null;
  },
  chute: () => [1.2, -1.3, 0.6],
  crew(sp, p, k) {
    if (p.key === "shaft") {
      const z = 0.3 + ((W.base - 0.3) * (p.floor + Math.min(k, 0.9))) / 3;
      return [at(...colAt(1), z, k < 0.5 ? "tie" : "hose"), at(1.2, 1.3, 0.3, "carry")];
    }
    if (p.key === "tankForm" || p.key === "tankPour") return [at(0.5, 0.5, W.base + 0.05 + (W.wall - W.base) * 0.6 * k, p.key === "tankPour" ? "hose" : "hammer"), at(-0.4, 0.3, W.base + 0.05, "tie")];
    if (p.key === "dome") return [at(0.2, 0.3, W.wall + W.dome * 0.8, "trowel")];
    if (p.key === "waterTest") return [at(0.4, 1.7, 0.3, "hose"), at(1.3, 0.4, 0.3, "survey")];
    if (p.key === "paint") return [at(W.R * 0.72, W.R * 0.72, W.cone, "roller")];
    return null;
  },
  // Columns 30 × 30; ring beams 25 × 30; tank walls 20 cm, cone 25 cm,
  // dome 12 cm; water-retaining concrete with about 120 kg/m³ of rebar.
  metraj(sp, p, k) {
    const colVol = W.n * 0.3 * 0.3 * (W.base - 0.3) * M + 3 * 2 * Math.PI * W.col * M * 0.25 * 0.3;
    if (p.key === "shaft") return { concrete: (k * colVol) / 3, rebar: (k * colVol * 0.16) / 3 };
    const wall = 2 * Math.PI * W.R * M * (W.wall - W.cone) * M * 0.2 + Math.PI * (W.col + W.R) * M * Math.hypot(W.R - W.col, W.cone - W.base) * M * 0.25;
    if (p.key === "tankForm") return { rebar: (k * wall * 120) / 1000 };
    if (p.key === "tankPour") return { concrete: k * wall };
    if (p.key === "dome") return { concrete: k * Math.PI * (W.R * M) ** 2 * 1.1 * 0.12 };
    if (p.key === "waterTest") return { water: k * TANK_M3 };
    return null;
  },
  items: (q, num) => (q.water > 0 ? `Su ${Math.round(q.water)} m³` : `Donatı ${num(q.rebar, 2)} t`),
};

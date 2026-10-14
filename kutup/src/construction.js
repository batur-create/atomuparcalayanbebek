// The construction site, built the way a reinforced-concrete building is built:
// mobilisation, setting out, excavation, blinding, foundation rebar, formwork and
// pour, then for every storey column rebar → column formwork → pour and strike →
// props and deck → slab rebar → slab pour. Everything is drawn straight from the
// session's progress: pieces are placed, laid or poured, never faded in.
import { STONE, WOOD, box, outline, poly, seg } from "./iso.js";

// Share of the session for the substructure and the frame; the rest is walls,
// roof, openings, finishes and handover (drawn by the scene's later parts).
export const FRAME_END = 0.55;
export const LATER = [
  ["walls", "Duvar örme", FRAME_END, 0.68],
  ["roof", "Çatı: makas, aşık, kiremit", 0.68, 0.78],
  ["openings", "Doğrama ve kapı", 0.78, 0.86],
  ["finish", "Cephe: mantolama, sıva ve boya", 0.86, 0.93],
  ["handover", "Peyzaj ve teslim", 0.93, 1],
];

export function sitePlan(sp) {
  const steps = [
    ["mobilize", "Mobilizasyon: çit ve konteyner", 1],
    ["layout", "Aplikasyon: kazık ve ip iskelesi", 1.2],
    ["dig", "Hafriyat", 2.2],
    ["lean", "Grobeton", 0.9],
    ["footRebar", "Temel donatısı", 1.6],
    ["footForm", "Temel kalıbı", 0.9],
    ["footPour", "Temel betonu ve kür", 1.4],
  ].map(([key, label, w]) => ({ key, label, w, floor: -1 }));
  for (let i = 0; i < sp.floors; i++)
    for (const [key, label, w] of [
      ["colRebar", "kolon donatısı", 0.8],
      ["colForm", "kolon kalıbı", 0.5],
      ["colPour", "kolon betonu ve kalıp söküm", 0.6],
      ["deckForm", "dikmeler ve döşeme kalıbı", 0.8],
      ["deckRebar", "döşeme donatısı", 0.7],
      ["deckPour", "döşeme betonu", 0.8],
    ])
      steps.push({ key, label: `${i + 1}. kat ${label}`, w, floor: i });
  const total = steps.reduce((n, s) => n + s.w, 0);
  let at = 0;
  const phases = steps.map((s) => {
    const a = at;
    at += (s.w / total) * FRAME_END;
    return { ...s, a, b: at };
  });
  for (const [key, label, a, b] of LATER) phases.push({ key, label, a, b, floor: -1 });
  return phases;
}

const clamp = (v) => Math.max(0, Math.min(1, v));
export function phaseAt(plan, shown) {
  return plan.find((p) => shown < p.b) || plan[plan.length - 1];
}
// Height the crane hook works at: the storey being built, or the roof later.
export function workHeight(plan, sp, shown) {
  const hf = sp.h / sp.floors;
  const p = phaseAt(plan, shown);
  if (p.floor >= 0) return 0.3 + (p.floor + 1) * hf;
  return shown < FRAME_END ? 0.4 : 0.3 + sp.h;
}

// ---------- colours ----------
const SOIL = "#7d6142",
  SOIL_WALLS = ["#8a6a48", "#735737"],
  PIT_FLOOR = "#94744f",
  LEAN = "#b8b4ab",
  REBAR = "#8a4b33",
  PLY = ["#e6c383", "#cfa56a", "#b98e55"],
  WET = ["#8e9298", "#7a7e85", "#676b71"],
  CONCRETE = ["#cdcac2", "#b2afa7", "#99968f"],
  PROP = "#6e7c8c",
  FENCE = "#9aa3ad",
  BARRIER = ["#f2c14e", "#d9a930", "#bf9322"];
const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};
const mixAll = (a, b, t) => a.map((c, i) => mix(c, b[i], t));

let clipSerial = 0;

/** SVG for everything up to the finished frame, at progress `shown` (0…1): { yard, rest }. */
export function siteSVG(P, sp, plan, shown) {
  const k = {};
  for (const p of plan) k[p.floor >= 0 ? `${p.key}${p.floor}` : p.key] = clamp((shown - p.a) / (p.b - p.a));
  const w = sp.hw,
    wf = w + 0.2,
    E = wf + 0.25,
    D = 0.6,
    hf = sp.h / sp.floors;
  const bottom = -D + 0.08;
  let back = "",
    pit = "",
    above = "",
    front = "";

  // Mobilisation: wire-mesh panels on the far sides, a low barrier in front so
  // the work stays in view, and the site container. All gone at handover.
  const handover = clamp((shown - 0.93) / 0.05);
  const panels = Math.round(10 * k.mobilize * (1 - handover));
  const F = 2.95;
  for (let i = 0; i < panels; i++) {
    const t0 = -F + (i % 5) * 1.18,
      t1 = t0 + 1.12;
    if (i < 5) {
      back += box(P, -F - 0.04, t0, -F, t1, 0, 0.9, [FENCE, "#8a939d", "#7a838d"]);
      for (let z = 0.15; z < 0.9; z += 0.25) back += seg(P(-F + 0.01, t0, z), P(-F + 0.01, t1, z), "#c4cbd3", 0.6);
    } else {
      back += box(P, t0, -F - 0.04, t1, -F, 0, 0.9, [FENCE, "#8a939d", "#7a838d"]);
      for (let z = 0.15; z < 0.9; z += 0.25) back += seg(P(t0, -F + 0.01, z), P(t1, -F + 0.01, z), "#c4cbd3", 0.6);
    }
  }
  if (k.mobilize > 0.5 && handover < 1) {
    back += box(P, -2.85, -2.85, -1.75, -2.25, 0, 0.75, ["#eef1f4", "#d7dde3", "#c1c8d0"]);
    back += box(P, -2.6, -2.27, -2.2, -2.24, 0.3, 0.55, ["#6f8fb3", "#5d7ea3", "#4c6c90"]);
    // "İş güvenliği önce!" board on the fence.
    back += box(P, -2.93, 1.2, -2.9, 2.1, 0.45, 0.85, BARRIER);
  }
  if (k.mobilize > 0.8 && handover < 1)
    for (const [x0, y0, x1, y1] of [[2.6, -2.6, 2.7, 2.7], [-2.6, 2.6, 2.6, 2.7]]) front += box(P, x0, y0, x1, y1, 0.15, 0.32, BARRIER);

  // Setting out: corner stakes first, then batter boards with strings along
  // the footprint lines; they stay until the foundation is poured.
  if (k.layout > 0 && k.footPour < 1) {
    const corners = [[-wf, -wf], [wf, -wf], [wf, wf], [-wf, wf]];
    corners.slice(0, Math.ceil(clamp(k.layout / 0.4) * 4)).forEach(([x, y]) => {
      const stake = box(P, x - 0.03, y - 0.03, x + 0.03, y + 0.03, 0, 0.3, WOOD);
      if (x + y > 0) front += stake;
      else back += stake;
    });
    if (k.layout > 0.4) {
      const o = wf + 0.7;
      const lines = [
        [[-o, -wf], [o, -wf]], [[-o, wf], [o, wf]], [[-wf, -o], [-wf, o]], [[wf, -o], [wf, o]],
      ].slice(0, Math.ceil(clamp((k.layout - 0.4) / 0.6) * 4));
      for (const [[ax, ay], [bx, by]] of lines) {
        for (const [x, y] of [[ax, ay], [bx, by]]) {
          const board = box(P, x - 0.05, y - 0.05, x + 0.05, y + 0.05, 0, 0.55, WOOD);
          if (x + y > 0) front += board;
          else back += board;
        }
        above += seg(P(ax, ay, 0.48), P(bx, by, 0.48), "#fbfaf6", 0.8, 0.9);
      }
    }
    if (k.dig < 1) {
      // Total station on its tripod.
      const [tx, ty] = [wf + 1.25, -wf - 0.4];
      for (const [dx, dy] of [[-0.25, -0.15], [0.2, -0.2], [0, 0.25]]) front += seg(P(tx + dx, ty + dy, 0), P(tx, ty, 0.75), "#c9a227", 1.3);
      front += box(P, tx - 0.1, ty - 0.08, tx + 0.1, ty + 0.08, 0.75, 0.97, ["#f6d24a", "#e0b92a", "#c49f1d"]);
    }
  }

  // Excavation: the pit deepens and the spoil heap grows; the spoil goes back
  // as backfill once the foundation is cast.
  const backfilled = k.footPour >= 1;
  const d = D * k.dig;
  const cols = columnsOf(sp);
  const formZ = bottom + (0.32 - bottom) * k.footForm,
    struck = k.footPour > 0.8,
    level = bottom + (0.3 - bottom) * clamp(k.footPour / 0.6),
    cured = mixAll(WET, STONE, clamp((k.footPour - 0.6) / 0.4));
  const bars = Math.floor((2 * wf) / 0.32);
  const mesh = (z, count) => {
    let s = "";
    for (let i = 0; i < count; i++) {
      const t = -wf + 0.16 + (Math.floor(i / 2) % bars) * 0.32;
      s += i % 2
        ? seg(P(t, -wf + 0.05, z), P(t, wf - 0.05, z), REBAR, 1)
        : seg(P(-wf + 0.05, t, z), P(wf - 0.05, t, z), REBAR, 1);
    }
    return s;
  };
  const starters = k.footRebar > 0.5 ? Math.ceil(clamp((k.footRebar - 0.5) / 0.25) * cols.length) : 0;
  if (k.dig > 0 && !backfilled) {
    const id = `pit${++clipSerial}`;
    const rim = [P(-E, -E, 0), P(E, -E, 0), P(E, E, 0), P(-E, E, 0)];
    pit += `<clipPath id="${id}"><polygon points="${rim.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/></clipPath><g clip-path="url(#${id})">`;
    pit += poly(rim, SOIL);
    pit += poly([P(-E, -E, -d), P(E, -E, -d), P(E, E, -d), P(-E, E, -d)], PIT_FLOOR);
    pit += poly([P(-E, -E, 0), P(-E, E, 0), P(-E, E, -d), P(-E, -E, -d)], SOIL_WALLS[0]);
    pit += poly([P(-E, -E, 0), P(E, -E, 0), P(E, -E, -d), P(-E, -E, -d)], SOIL_WALLS[1]);
    // Blinding concrete spreads across the bottom, then the bottom mesh, bar by bar.
    if (k.lean > 0) pit += poly([P(-wf, -wf, -d + 0.06), P(-wf + 2 * wf * k.lean, -wf, -d + 0.06), P(-wf + 2 * wf * k.lean, wf, -d + 0.06), P(-wf, wf, -d + 0.06)], LEAN);
    pit += mesh(-d + 0.15, clamp(k.footRebar / 0.5) * bars * 2);
    for (let i = 0; i < starters; i++) pit += cage(P, cols[i][0], cols[i][1], bottom + 0.1, 0, false);
    if (k.footForm > 0 && !struck) {
      const top = Math.min(0, formZ);
      pit += box(P, -wf - 0.06, -wf - 0.06, -wf, wf + 0.06, bottom, top, PLY) + box(P, -wf - 0.06, -wf - 0.06, wf + 0.06, -wf, bottom, top, PLY);
    }
    if (k.footPour > 0) pit += box(P, -wf, -wf, wf, wf, bottom, Math.min(0, level), cured);
    if (k.footForm > 0 && !struck) {
      const top = Math.min(0, formZ);
      pit += box(P, wf, -wf - 0.06, wf + 0.06, wf + 0.06, bottom, top, PLY) + box(P, -wf - 0.06, wf, wf + 0.06, wf + 0.06, bottom, top, PLY);
    }
    pit += "</g>";
  }
  const spoil = Math.max(0, k.dig - (k.footPour > 0.8 ? (k.footPour - 0.8) * 5 : 0));
  if (spoil > 0 && !backfilled) {
    const [sx, sy] = P(-2.3, 2.2, 0);
    const r = 34 * Math.sqrt(spoil);
    back += `<ellipse cx="${sx.toFixed(1)}" cy="${(sy - r * 0.18).toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.42).toFixed(1)}" fill="#a07e58"/>`;
    back += `<ellipse cx="${(sx - r * 0.15).toFixed(1)}" cy="${(sy - r * 0.32).toFixed(1)}" rx="${(r * 0.55).toFixed(1)}" ry="${(r * 0.28).toFixed(1)}" fill="#b38f66"/>`;
  }

  // Above ground: starter bars, the back of the formwork, the top mesh, the
  // concrete as it rises (wet grey curing to pale), then the front formwork.
  for (let i = 0; i < starters; i++) above += cage(P, cols[i][0], cols[i][1], 0, 0.95, false);
  if (k.footForm > 0 && !struck && formZ > 0)
    above += box(P, -wf - 0.06, -wf - 0.06, -wf, wf + 0.06, 0, formZ, PLY) + box(P, -wf - 0.06, -wf - 0.06, wf + 0.06, -wf, 0, formZ, PLY);
  if (k.footRebar > 0.75) above += mesh(0.2, clamp((k.footRebar - 0.75) / 0.25) * bars * 2);
  if (k.footPour > 0 && level > 0) above += box(P, -wf, -wf, wf, wf, 0, level, cured);
  if (k.footForm > 0 && !struck && formZ > 0)
    above += box(P, wf, -wf - 0.06, wf + 0.06, wf + 0.06, 0, formZ, PLY) + box(P, -wf - 0.06, wf, wf + 0.06, wf + 0.06, 0, formZ, PLY);

  // The frame, storey by storey.
  let frame = "";
  for (let i = 0; i < sp.floors; i++) {
    const z0 = 0.3 + i * hf,
      zs = 0.3 + (i + 1) * hf,
      soffit = zs - 0.14;
    const cr = k[`colRebar${i}`],
      cf = k[`colForm${i}`],
      cp = k[`colPour${i}`],
      df = k[`deckForm${i}`],
      dr = k[`deckRebar${i}`],
      dp = k[`deckPour${i}`];
    if (!(cr > 0)) break;
    // Props under the deck stay until the walls go in.
    if (df > 0 && shown < FRAME_END + 0.02) {
      const n = Math.ceil(clamp(df / 0.5) * 9);
      for (let j = 0; j < n; j++) {
        const x = -w + 0.5 + (j % 3) * (w - 0.5),
          y = -w + 0.5 + Math.floor(j / 3) * (w - 0.5);
        frame += seg(P(x, y, z0), P(x, y, soffit), PROP, 1.3);
      }
    }
    cols.forEach(([x, y], j) => {
      const order = (j + 0.5) / cols.length;
      if (cp >= order) frame += box(P, x - 0.11, y - 0.11, x + 0.11, y + 0.11, z0, soffit, CONCRETE);
      else if (cf >= order) frame += box(P, x - 0.15, y - 0.15, x + 0.15, y + 0.15, z0, soffit, PLY);
      else if (cr >= order) frame += cage(P, x, y, z0, soffit + 0.3, true);
    });
    // Deck: plywood panels, then rebar, then the slab poured from the back.
    if (df > 0.5 && !(dp >= 1)) {
      const n = Math.ceil(clamp((df - 0.5) / 0.5) * 9),
        cell = (2 * w) / 3;
      for (let j = 0; j < n; j++) {
        const x0 = -w + (j % 3) * cell,
          y0 = -w + Math.floor(j / 3) * cell;
        frame += poly([P(x0, y0, soffit), P(x0 + cell, y0, soffit), P(x0 + cell, y0 + cell, soffit), P(x0, y0 + cell, soffit)], PLY[0]);
        frame += outline([P(x0, y0, soffit), P(x0 + cell, y0, soffit), P(x0 + cell, y0 + cell, soffit), P(x0, y0 + cell, soffit)], "#b98e55", 0.6);
      }
    }
    if (dr > 0 && !(dp >= 1)) {
      const bars = Math.floor((2 * w) / 0.3),
        n = dr * bars * 2;
      for (let j = 0; j < n; j++) {
        const t = -w + 0.15 + (Math.floor(j / 2) % bars) * 0.3;
        frame += j % 2
          ? seg(P(t, -w + 0.05, soffit + 0.03), P(t, w - 0.05, soffit + 0.03), REBAR, 0.9)
          : seg(P(-w + 0.05, t, soffit + 0.03), P(w - 0.05, t, soffit + 0.03), REBAR, 0.9);
      }
    }
    if (dp > 0) {
      const edge = -w + 2 * w * Math.min(1, dp / 0.85);
      const faces = mixAll(WET, CONCRETE, clamp((dp - 0.85) / 0.15));
      frame += box(P, -w, -w, edge, w, soffit, zs, faces);
    }
  }
  // The yard (fence, container, spoil) sits under the machines; the rest above them.
  return { yard: back, rest: pit + above + frame + front };
}

// Columns: the corners, and mid-side columns on a wider plan.
export function columnsOf(sp) {
  const c = sp.hw - 0.14;
  const list = [[-c, -c], [c, -c], [-c, c], [c, c]];
  if (sp.hw >= 1.8) list.push([0, -c], [-c, 0], [c, 0], [0, c]);
  return list.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
}
// A column's rebar cage: four longitudinal bars and stirrups.
function cage(P, x, y, z0, z1, stirrups) {
  let s = "";
  for (const [dx, dy] of [[-0.07, -0.07], [0.07, -0.07], [-0.07, 0.07], [0.07, 0.07]])
    s += seg(P(x + dx, y + dy, z0), P(x + dx, y + dy, z1), REBAR, 1);
  if (stirrups)
    for (let z = z0 + 0.15; z < z1 - 0.2; z += 0.28)
      s += outline([P(x - 0.08, y - 0.08, z), P(x + 0.08, y - 0.08, z), P(x + 0.08, y + 0.08, z), P(x - 0.08, y + 0.08, z)], "#a5654a", 0.7);
  return s;
}

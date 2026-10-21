// n46 köy v2: turns a planned layout (shared/koy2/planner.js) into the same
// drawable world the village map already paints (src/villageView.js): ground
// items in passes, standing items sorted back to front, each with a screen box,
// indexed in a coarse grid. Terrain first (river, pond, railway), then the
// squares, streets and door paths, then buildings at their pinned scale (the
// model contract's own size, never squeezed), sites, trees and lamps.
//
// Nothing here reads the server's v1 rows: the caller hands in the layout and
// what stands on each plot (things: subjectKey → { kind, seed, model, memberId,
// site }). The live map draws with this once a team's v2 layout is switched on
// (package D); every other team keeps buildWorld().
import { BY_ID } from "../../shared/catalog.js";
import { hash, lengthOf, along, linePoint, inPolygon, pointRect, rng as rand, screenOf } from "../../shared/koy2/geom.js";
import { modelSpec } from "../../shared/koy2/models.js";
import { buildingSVG, mirrored, ridgeOf, spec, box, poly, seg, ellipse, WOOD, STONE } from "../iso.js";
import { sitePlan, siteSVG } from "../construction.js";
import { specialOf } from "../special.js";
import {
  COATS, HATS, PALETTE, SKINS, boxOf, detailFor, fillShape, lampArt, lineBox, meadowDetail, plazaArt, rockArt, bushArt, spotArt, strokeLine, treeArt, MEMBER_COLORS, focusing, skyAt,
} from "../villageWorld.js";
import { createLife, lookOf } from "./life.js";

const { ROAD, ROAD_EDGE, WATER, PLAZA_STONE, PLAZA_RING } = PALETTE;
const BANK = "#b9d08f",
  WATER_EDGE = "#78aebf",
  BALLAST = "#b5aa97",
  SLEEPER = "#8a6d4f",
  RAIL = "#6f7378",
  PATH = "#f1e6cc";
const subjectKey = (s) => `${s.type}:${s.id}`;
const AUTUMN_FLOWERS = ["#d9a441", "#c8743c"],
  SPRING_FLOWERS = ["#ffffff", "#f7d154", "#f29bb8", "#b9a3ea"];

// Smooth value noise in [0, 1]: groves, meadows and fields follow it instead
// of falling evenly everywhere.
function noise(seed) {
  const cell = (i, j) => (hash(`${seed}:${i}:${j}`) % 1000) / 1000;
  return (x, y) => {
    const i = Math.floor(x),
      j = Math.floor(y),
      fx = x - i,
      fy = y - j,
      sx = fx * fx * (3 - 2 * fx),
      sy = fy * fy * (3 - 2 * fy);
    const a = cell(i, j),
      b = cell(i + 1, j),
      c = cell(i, j + 1),
      d = cell(i + 1, j + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

/** Building drawing parameters of a plot: the model contract's pinned scale. */
export function plotSpec(plot, thing) {
  const look = BY_ID[plot.model]?.look;
  const kind = thing?.kind || modelSpec(plot.model, plot.gv)?.kind || "house";
  return spec(kind, thing?.seed ?? hash(plot.id) % 9973, plot.model, look?.special ? { scale: plot.scale } : {});
}

// Splits a long line into pieces with their own boxes, so a tile draws only what it shows.
function pieces(line, every = 24) {
  const out = [];
  let cur = [line[0]],
    run = 0;
  for (let i = 1; i < line.length; i++) {
    cur.push(line[i]);
    run += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    if (run >= every) {
      out.push(cur);
      cur = [line[i]];
      run = 0;
    }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}
function railArt(v, line, w, detail) {
  strokeLine(v, line, w, BALLAST);
  if (detail >= 1) {
    const len = lengthOf(line);
    for (let s = 0.3; s < len; s += 0.62) {
      const { p, dir } = along(line, s);
      const n = [-dir[1], dir[0]];
      strokeLine(v, [[p[0] - n[0] * 0.55, p[1] - n[1] * 0.55], [p[0] + n[0] * 0.55, p[1] + n[1] * 0.55]], 0.16, SLEEPER);
    }
  }
  // Rails at the gauge the station drawing uses (0.62 units, about 1 m: a metre-gauge branch line).
  for (const side of [-0.31, 0.31]) {
    const off = line.map((p, i) => {
      const a = line[Math.max(0, i - 1)],
        b = line[Math.min(line.length - 1, i + 1)];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [p[0] - ((b[1] - a[1]) / d) * side, p[1] + ((b[0] - a[0]) / d) * side];
    });
    strokeLine(v, off, 0.09, RAIL);
  }
}
// A steel girder bridge carries the railway over the river.
function railBridgeArt(v, at, dir, span) {
  const P = v.at(at[0], at[1]);
  const n = [-dir[1], dir[0]];
  const pt = (s, o, z) => P(dir[0] * s + n[0] * o, dir[1] * s + n[1] * o, z);
  poly([pt(-span, -0.75, 0.6), pt(span, -0.75, 0.6), pt(span, 0.75, 0.6), pt(-span, 0.75, 0.6)], "#8b8f94");
  for (const o of [-0.75, 0.75]) {
    seg(pt(-span, o, 0.6), pt(span, o, 0.6), "#55595e", 1.6);
    seg(pt(-span, o, 1.5), pt(span, o, 1.5), "#55595e", 1.4);
    for (let s = -span; s <= span + 0.01; s += span / 3) seg(pt(s, o, 0.6), pt(s, o, 1.5), "#62676c", 1);
    for (let s = -span; s < span - 0.01; s += span / 3) seg(pt(s, o, 0.6), pt(s + span / 3, o, 1.5), "#62676c", 0.8);
  }
  for (const s of [-span, span]) box(P, dir[0] * s - 0.35, dir[1] * s - 0.35, dir[0] * s + 0.35, dir[1] * s + 0.35, 0, 0.6, STONE);
}
function fountainArt(v, x, y) {
  const P = v.at(x, y);
  box(P, -0.9, -0.9, 0.9, 0.9, 0, 0.35, STONE);
  const [cx, cy] = P(0, 0, 0.36);
  ellipse(cx, cy, v.s * 1.2, v.s * 0.6, WATER);
  box(P, -0.18, -0.18, 0.18, 0.18, 0.35, 1.05, STONE);
}
function benchArt(v, x, y, along) {
  const P = v.at(x, y);
  const [a, b] = along ? [0.6, 0.18] : [0.18, 0.6];
  box(P, -a, -b, a, b, 0.3, 0.38, WOOD);
  for (const [dx, dy] of [[-a + 0.1, -b + 0.06], [a - 0.1, b - 0.06]]) box(P, dx - 0.05, dy - 0.05, dx + 0.05, dy + 0.05, 0, 0.3, WOOD);
}
function figureArt(v, x, y, coat) {
  // A person for scale: 1.75 m ≈ 1.09 units.
  const P = v.at(x, y);
  const [fx, fy] = P(0, 0, 0),
    [hx, hy] = P(0, 0, 1.0);
  ellipse(fx, fy, v.s * 0.32, v.s * 0.14, "#2c3324", 0.25);
  seg([fx - v.s * 0.08, fy], [fx - v.s * 0.08, fy - v.s * 0.5], "#4b4458", Math.max(1, v.s * 0.09));
  seg([fx + v.s * 0.08, fy], [fx + v.s * 0.08, fy - v.s * 0.5], "#4b4458", Math.max(1, v.s * 0.09));
  seg([fx, fy - v.s * 0.48], [fx, fy - v.s * 0.86], coat, Math.max(2, v.s * 0.3));
  ellipse(hx, hy, v.s * 0.12, v.s * 0.12, "#e2b48e");
}

/**
 * world: the same shape buildWorld() returns (items, query, bounds, area, …).
 * layout: a v2 layout; things: Map subjectKey → { kind, seed, model, memberId, site: { shown } }.
 * spots: while moving a building, the planned plots it may go to ({ x, y, facing }).
 */
export function buildWorld2({ layout, things = new Map(), members = [], me = null, sky = skyAt(), monument = 0, references = [], extras = [], spots = [] }) {
  const season = sky.season;
  const t = layout.terrain;
  const people = new Map(members.map((m) => [m.id, m]));
  const ground = [],
    standing = [];
  const add = (list, item) => list.push(item);

  // ---------- terrain ----------
  for (const piece of pieces(t.river.pts)) {
    const bbox = lineBox(piece, t.river.w * 2);
    add(ground, { pass: 0, bbox, draw: (v) => strokeLine(v, piece, t.river.w + 1.4, BANK, 0.8) });
    add(ground, { pass: 1, bbox, draw: (v) => strokeLine(v, piece, t.river.w + 0.35, WATER_EDGE) });
    add(ground, { pass: 1.1, bbox, draw: (v) => strokeLine(v, piece, t.river.w, WATER) });
  }
  const pond = [...t.lake.poly];
  add(ground, { pass: 1, bbox: lineBox(pond, 3), draw: (v) => {
    fillShape(v, pond, BANK);
    fillShape(v, pond.map(([x, y]) => [t.lake.cx + (x - t.lake.cx) * 0.97, t.lake.cy + (y - t.lake.cy) * 0.97]), WATER, WATER_EDGE, 0.25);
  } });
  if (t.rail) {
    for (const piece of pieces(t.rail.pts)) {
      add(ground, { pass: 1.2, bbox: lineBox(piece, 3), draw: (v) => railArt(v, piece, t.rail.w, v.detail) });
    }
    // Where the railway meets the river: a girder bridge.
    for (let i = 1; i < t.rail.pts.length; i++) {
      const a = t.rail.pts[i - 1],
        b = t.rail.pts[i];
      const near = linePoint(t.river.pts, a);
      if (near.d > 12) continue;
      const hit = linePoint([a, b], near.point);
      if (hit.d > t.river.w) continue;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      const at = hit.point;
      add(standing, { type: "bridge", depth: at[0] + at[1], x: at[0], y: at[1], bbox: boxOf(at[0], at[1], 6, 6, 3, 3), draw: (v) => railBridgeArt(v, at, dir, t.river.w / 2 + 1.1) });
      break;
    }
  }

  // ---------- squares ----------
  for (const f of layout.foci) {
    if (f.status === "reserved") continue;
    if (f.id === "f0") {
      add(ground, { pass: 2.5, bbox: boxOf(0, 0, f.r * 1.8, f.r * 1.8, f.r, f.r), draw: (v) => {
        const ring = [];
        for (let i = 0; i < 32; i++) ring.push([Math.cos((i / 32) * Math.PI * 2) * f.r, Math.sin((i / 32) * Math.PI * 2) * f.r]);
        fillShape(v, ring, PLAZA_STONE, PLAZA_RING, 0.35);
      } });
      add(standing, { type: "plaza", depth: 0, x: 0, y: 0, bbox: boxOf(0, 0, 6, 6, 6.5, 4), draw: (v) => plazaArt(v, monument) });
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i * Math.PI) / 2,
          x = Math.cos(a) * (f.r - 0.6),
          y = Math.sin(a) * (f.r - 0.6);
        add(standing, { type: "lamp", depth: x + y, x, y, bbox: boxOf(x, y, 1, 1, 3, 1), draw: (v) => lampArt(v, x, y, sky.lamps) });
      }
      continue;
    }
    const ring = [];
    for (let i = 0; i < 24; i++) ring.push([f.x + Math.cos((i / 24) * Math.PI * 2) * f.r, f.y + Math.sin((i / 24) * Math.PI * 2) * f.r]);
    add(ground, { pass: 2.5, bbox: boxOf(f.x, f.y, f.r * 1.8, f.r * 1.8, f.r, f.r), draw: (v) => fillShape(v, ring, PLAZA_STONE, PLAZA_RING, 0.3) });
    if (f.landmark) continue;
    if (f.kind === "cesme") add(standing, { type: "fountain", depth: f.x + f.y, x: f.x, y: f.y, bbox: boxOf(f.x, f.y, 2, 2, 2, 1.2), draw: (v) => fountainArt(v, f.x, f.y) });
    else if (f.kind === "bahce") add(standing, { type: "tree", depth: f.x + f.y, x: f.x, y: f.y, bbox: boxOf(f.x, f.y, 2, 2, 3.4, 1), draw: (v) => treeArt(v, f.x, f.y, 1.3, (hash(f.id) % 100) / 100, season) });
    else {
      for (const [dx, dy, al] of [[-1.4, 0, false], [1.4, 0, false], [0, -1.4, true]]) {
        const x = f.x + dx,
          y = f.y + dy;
        add(standing, { type: "bench", depth: x + y, x, y, bbox: boxOf(x, y, 1.2, 1.2, 1, 0.6), draw: (v) => benchArt(v, x, y, al) });
      }
    }
  }

  // ---------- streets and door paths ----------
  const open = layout.roads.filter((r) => r.status === "usable" && r.type !== "kopru");
  for (const r of open) {
    const bbox = lineBox(r.pts, r.w * 2);
    add(ground, { pass: 2, bbox, draw: (v) => strokeLine(v, r.pts, r.w + 0.25, ROAD_EDGE) });
    add(ground, { pass: 3, bbox, draw: (v) => strokeLine(v, r.pts, r.w, ROAD) });
  }
  for (const p of layout.plots) {
    if (p.door) {
      const line = p.jetty ? p.door.slice(1) : p.door;
      add(ground, { pass: 4, bbox: lineBox(line, 1), draw: (v) => strokeLine(v, line, 0.5, PATH, 0.95, [0.34, 0.24]) });
    }
    if (p.jetty) {
      const j = p.jetty;
      add(ground, { pass: 4, bbox: lineBox(j, 1.5), draw: (v) => {
        strokeLine(v, j, 0.95, WOOD[1]);
        strokeLine(v, j, 0.8, WOOD[0], 1, [0.12, 0.1]);
      } });
    }
  }

  // ---------- buildings and sites ----------
  const newest = new Map();
  for (const p of layout.plots) if (p.subject.type === "building" && p.owner) newest.set(p.owner, p);
  const now = Date.now();
  const lit = new Set();
  for (const m of members) if ((m.status === "here" || focusing(m, now)) && newest.has(m.id)) lit.add(newest.get(m.id).id);
  const specs = new Map();
  for (const p of layout.plots) {
    const thing = things.get(subjectKey(p.subject));
    const sp = plotSpec(p, thing);
    specs.set(p.id, sp);
    const owner = people.get(p.owner);
    const seed = thing?.seed ?? hash(p.id) % 9973;
    const up = ridgeOf(sp) + 1.2;
    const half = Math.max(p.over[2] - p.over[0], p.over[3] - p.over[1]);
    // A personal site, or the shared Anıtkabir while its 2,000 minutes are still being built.
    const site = p.subject.type === "site" || (p.subject.type === "imece" && !!thing?.site && thing.site.shown < 1);
    const plan = site ? sitePlan(sp) : null;
    // A site is fenced from its first minute (mobilisation comes first on a real
    // site), so a session or a shared project that just began is already visible.
    const fenced = site ? plan.find((k) => k.key === "mobilize")?.b ?? 0 : 0;
    const shown = site ? Math.max(fenced, thing?.site?.shown ?? 0.35) : 1;
    add(standing, {
      type: "building", id: p.subject.id, plotId: p.id, building: { ...thing, id: p.subject.id, model: p.model, memberId: p.owner, site }, owner, sp,
      depth: p.x + p.y, x: p.x, y: p.y,
      bbox: [screenOf(p.over[0], p.over[3])[0] - 1, screenOf(p.over[0], p.over[1], Math.max(up, p.height + 1))[1] - 1, screenOf(p.over[2], p.over[1])[0] + 1, screenOf(p.over[2], p.over[3])[1] + 1.5],
      hit: boxOf(p.x, p.y, half * 0.9, half * 0.9, p.height * 0.9, half * 0.5),
      top: p.height,
      draw: (v) => {
        const base = v.at(p.x, p.y);
        const P = p.facing ? mirrored(base) : base;
        if (site) {
          siteSVG(P, sp, plan, shown);
          // A building of its own grows from its own construction scene; the
          // others show their frame rising (the detailed site stays on the site page).
          const own = specialOf(sp);
          if (own?.scene) own.scene(P, sp, plan, shown, false, 0);
          else if (shown > 0.25) box(P, -sp.hw, -sp.hw, sp.hw, sp.hw, 0.3, 0.3 + sp.h * Math.min(1, (shown - 0.25) / 0.45), ["#d3cdc1", "#bdb7aa", "#a6a093"]);
        }
        else buildingSVG(P, sp, seed, { lit: lit.has(p.id) || (sky.night > 0.5 && sp.lit), detail: v.detail, shadowP: base });
      },
    });
  }

  // Move mode: the planned plots the picked building can go to (same marker as today's map).
  spots.forEach((s, i) => {
    add(standing, {
      type: "building", id: `spot-${i}`, building: { spot: true, ...s }, sp: { hw: 1.7 }, depth: s.x + s.y + 0.01, x: s.x, y: s.y,
      bbox: boxOf(s.x, s.y, 4, 4, 3.4, 2.6), hit: boxOf(s.x, s.y, 2.6, 2.6, 2.6, 1.8), top: 2.2,
      draw: (v) => spotArt(v, s),
    });
  });

  // ---------- trees, bushes, lamps: deterministic, kept clear of everything ----------
  const extent = [Infinity, Infinity, -Infinity, -Infinity];
  const grow = (x, y) => {
    extent[0] = Math.min(extent[0], x);
    extent[1] = Math.min(extent[1], y);
    extent[2] = Math.max(extent[2], x);
    extent[3] = Math.max(extent[3], y);
  };
  grow(-14, -14);
  grow(14, 14);
  for (const p of layout.plots) grow(p.plot[0], p.plot[1]), grow(p.plot[2], p.plot[3]);
  for (const r of open) for (const q of r.pts) grow(q[0], q[1]);
  const pad = 24;
  const H = 8,
    cells = new Map();
  const put = (x0, y0, x1, y1, item) => {
    for (let i = Math.floor(x0 / H); i <= Math.floor(x1 / H); i++)
      for (let j = Math.floor(y0 / H); j <= Math.floor(y1 / H); j++) {
        const k = `${i},${j}`;
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push(item);
      }
  };
  for (const p of layout.plots) put(p.plot[0], p.plot[1], p.plot[2], p.plot[3], { plot: p.plot });
  for (const r of layout.roads) {
    if (r.status !== "usable") continue;
    let b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const q of r.pts) b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[0]), Math.max(b[3], q[1])];
    put(b[0] - r.w, b[1] - r.w, b[2] + r.w, b[3] + r.w, { road: r });
  }
  for (const p of layout.plots) if (p.door) put(Math.min(...p.door.map((q) => q[0])) - 1, Math.min(...p.door.map((q) => q[1])) - 1, Math.max(...p.door.map((q) => q[0])) + 1, Math.max(...p.door.map((q) => q[1])) + 1, { path: p.door });
  const clear = (x, y, gap) => {
    for (const it of cells.get(`${Math.floor(x / H)},${Math.floor(y / H)}`) || []) {
      if (it.plot && pointRect([x, y], it.plot) < gap) return false;
      if (it.road && linePoint(it.road.pts, [x, y]).d < it.road.w / 2 + gap + 0.4) return false;
      if (it.path && linePoint(it.path, [x, y]).d < gap + 0.4) return false;
    }
    if (layout.foci.some((f) => f.status !== "reserved" && Math.hypot(f.x - x, f.y - y) < f.r + gap + 0.5)) return false;
    if (linePoint(t.river.pts, [x, y]).d < t.river.w / 2 + 0.9 + gap) return false;
    if (inPolygon([x, y], t.lake.poly) || linePoint([...t.lake.poly, t.lake.poly[0]], [x, y]).d < 0.9 + gap) return false;
    if (t.rail && linePoint(t.rail.pts, [x, y]).d < t.rail.w / 2 + 0.8 + gap) return false;
    return true;
  };
  const R = rand(hash(`${layout.seed}:trees`));
  const step = 2.6;
  // Landscape (plan §3.1): woods gather in groves out in the country and
  // around the squares where people sit; along the streets they thin out, and
  // open fields lie between the groves.
  const grove = noise(`${layout.seed}:grove`);
  const squares = layout.foci.filter((f) => f.status === "open" && !f.landmark);
  const lifeTrees = [];
  for (let x = extent[0] - pad; x <= extent[2] + pad; x += step)
    for (let y = extent[1] - pad; y <= extent[3] + pad; y += step) {
      const jx = x + (R() - 0.5) * step,
        jy = y + (R() - 0.5) * step;
      const roll = R(),
        size = 0.75 + R() * 0.55,
        tone = R();
      // Thicker towards the fields, sparse among the houses.
      const edge = Math.min(jx - extent[0], extent[2] - jx, jy - extent[1], extent[3] - jy);
      const woods = Math.max(0, Math.min(1, (grove(jx / 22, jy / 22) - 0.48) / 0.22));
      const bySquare = edge >= 0 && squares.some((f) => Math.hypot(f.x - jx, f.y - jy) < f.r + 4.5);
      const keep = edge < 0 ? 0.06 + 0.62 * woods : bySquare ? 0.3 : 0.03 + 0.1 * woods;
      if (roll > keep || !clear(jx, jy, 0.5)) continue;
      if (roll < keep * 0.18) add(standing, { type: "rock", depth: jx + jy, x: jx, y: jy, bbox: boxOf(jx, jy, 0.9, 0.9, 0.6, 0.5), draw: (v) => rockArt(v, jx, jy, size) });
      else if (roll < keep * 0.4) add(standing, { type: "bush", depth: jx + jy, x: jx, y: jy, bbox: boxOf(jx, jy, 1, 1, 1, 0.5), draw: (v) => bushArt(v, jx, jy, size, tone, tone < 0.4) });
      else {
        add(standing, { type: "tree", depth: jx + jy, x: jx, y: jy, bbox: boxOf(jx, jy, 1.3 * size, 1.3 * size, 2.4 * size, 0.6), draw: (v) => treeArt(v, jx, jy, size, tone, season) });
        lifeTrees.push({ x: jx, y: jy, size });
      }
    }
  // Meadows: softer, flowering patches of grass on the open ground (none on streets or plots).
  const meadow = noise(`${layout.seed}:meadow`);
  const MR = rand(hash(`${layout.seed}:meadows`));
  const blooms = season === "winter" ? null : season === "autumn" ? AUTUMN_FLOWERS : SPRING_FLOWERS;
  for (let x = extent[0] - pad; x <= extent[2] + pad; x += 9)
    for (let y = extent[1] - pad; y <= extent[3] + pad; y += 9) {
      const cx = x + (MR() - 0.5) * 6,
        cy = y + (MR() - 0.5) * 6,
        rx = 2.4 + MR() * 2.2,
        ry = 1.6 + MR() * 1.4;
      if (meadow(cx / 14, cy / 14) < 0.58 || !clear(cx, cy, 1.2)) continue;
      const spots = [];
      for (let k = 0; k < 14; k++) {
        const a = MR() * Math.PI * 2,
          d = Math.sqrt(MR()),
          sx = cx + Math.cos(a) * rx * d,
          sy = cy + Math.sin(a) * ry * d,
          size = 0.7 + MR() * 0.6,
          bloom = blooms && MR() < 0.35 ? blooms[Math.floor(MR() * blooms.length)] : null;
        if (clear(sx, sy, 0.1)) spots.push({ x: sx, y: sy, size, flower: bloom });
      }
      add(ground, { pass: 0.4, bbox: boxOf(cx, cy, rx * 2, rx * 2, rx, rx), draw: (v) => {
        const [px, py] = v.at(cx, cy)(0, 0, 0);
        ellipse(px, py, rx * v.s * 1.2, ry * v.s * 0.6, PALETTE.MEADOW, 0.4);
        meadowDetail(v, spots);
      } });
    }
  // Low hills on the horizon, beyond the fields: soft relief only, nothing stands on a slope.
  const span = Math.max(extent[2] - extent[0], extent[3] - extent[1]) / 2 + pad + 10;
  const [ox, oy] = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  const HR = rand(hash(`${layout.seed}:hills`));
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + HR() * 0.5,
      d = span + HR() * 12,
      r = 7 + HR() * 7,
      hx = ox + Math.cos(a) * d,
      hy = oy + Math.sin(a) * d;
    if (!clear(hx, hy, r * 0.4)) continue;
    add(ground, { pass: 0.3, bbox: boxOf(hx, hy, r * 1.8, r * 1.8, r, r), draw: (v) => {
      const [px, py] = v.at(hx, hy)(0, 0, 0);
      // A low mound: its shade on the far side, then lighter rings rising towards the top.
      ellipse(px + v.s * r * 0.18, py + v.s * r * 0.1, v.s * r * 1.5, v.s * r * 0.7, "#8db866", 0.3);
      ["#a8cb82", "#b3d38c", "#bedb97"].forEach((c, i) => ellipse(px - v.s * r * 0.08 * i, py - v.s * r * 0.11 * i, v.s * r * 1.45 * (1 - 0.24 * i), v.s * r * 0.68 * (1 - 0.24 * i), c, 0.55));
    } });
  }
  // Street lamps every dozen units on alternating sides.
  for (const r of open) {
    const len = lengthOf(r.pts);
    for (let s = 6, k = 0; s < len - 2; s += 12, k++) {
      const { p, dir } = along(r.pts, s);
      const side = k % 2 ? 1 : -1;
      const x = p[0] - dir[1] * side * (r.w / 2 + 0.45),
        y = p[1] + dir[0] * side * (r.w / 2 + 0.45);
      if (layout.plots.some((q) => pointRect([x, y], q.ground) < 0.3 || (q.door && linePoint(q.door, [x, y]).d < 0.6))) continue;
      add(standing, { type: "lamp", depth: x + y, x, y, bbox: boxOf(x, y, 1, 1, 3, 1), draw: (v) => lampArt(v, x, y, sky.lamps) });
    }
  }
  // Hand-placed trees (scale and depth experiments).
  for (const e of extras) {
    const size = e.size || 1;
    add(standing, { type: "tree", depth: e.x + e.y, x: e.x, y: e.y, bbox: boxOf(e.x, e.y, 1.3 * size, 1.3 * size, 2.4 * size, 0.6), draw: (v) => treeArt(v, e.x, e.y, size, 0.5, season) });
  }
  for (const ref of references) add(standing, { type: "figure", depth: ref.x + ref.y, x: ref.x, y: ref.y, bbox: boxOf(ref.x, ref.y, 1, 1, 2, 0.6), draw: (v) => figureArt(v, ref.x, ref.y, ref.coat || "#c98577") });

  // ---------- order and index (as buildWorld) ----------
  ground.sort((a, b) => a.pass - b.pass);
  standing.sort((a, b) => a.depth - b.depth);
  const items = [...ground, ...standing];
  items.forEach((item, i) => (item.order = i));
  const CELL = 24,
    grid = new Map();
  let bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const item of items) {
    const [x0, y0, x1, y1] = item.bbox;
    if (item.pass === undefined || item.pass > 1.2) bounds = [Math.min(bounds[0], x0), Math.min(bounds[1], y0), Math.max(bounds[2], x1), Math.max(bounds[3], y1)];
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++)
      for (let gy = Math.floor(y0 / CELL); gy <= Math.floor(y1 / CELL); gy++) {
        const k = `${gx},${gy}`;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(item);
      }
  }
  bounds = [bounds[0] - 30, bounds[1] - 30, bounds[2] + 30, bounds[3] + 30];
  function query(x0, y0, x1, y1) {
    const found = new Set();
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++)
      for (let gy = Math.floor(y0 / CELL); gy <= Math.floor(y1 / CELL); gy++)
        for (const item of grid.get(`${gx},${gy}`) || []) {
          const b = item.bbox;
          if (b[2] >= x0 && b[0] <= x1 && b[3] >= y0 && b[1] <= y1) found.add(item);
        }
    return [...found].sort((a, b) => a.order - b.order);
  }
  // What the village covers on screen: plots, open streets and squares.
  let area = [-10, -8, 10, 6];
  const take = (x, y, z = 0) => {
    const [sx, sy] = screenOf(x, y, z);
    area = [Math.min(area[0], sx), Math.min(area[1], sy), Math.max(area[2], sx), Math.max(area[3], sy)];
  };
  for (const p of layout.plots) {
    take(p.over[0], p.over[3]);
    take(p.over[2], p.over[1]);
    take(p.over[2], p.over[3]);
    take(p.over[0], p.over[1], p.height);
  }
  for (const r of open) for (const q of r.pts) take(q[0], q[1]);

  // Neighbours' visits, birds, butterflies and weather: the shared life (src/koy2/life.js).
  const life = createLife({ layout, trees: lifeTrees });
  const meMember = people.get(me);
  const looks = new Map();
  // A figure seen behind something taller in front: the standing items that cover a screen box.
  function occludersAt(x, y, w = 0.8, h = 1.4) {
    const [sx, sy] = screenOf(x, y);
    const d = x + y;
    return query(sx - w, sy - h, sx + w, sy).filter((it) => it.depth !== undefined && it.depth > d + 0.05 && ["building", "tree", "bridge", "bush", "lamp", "fountain"].includes(it.type));
  }
  return {
    items, query, bounds, area, districts: [], walkingLinks: [], balloons: [], walkers: [], villagers: [], glows: [], smoke: [], buildings: layout.plots, lit,
    life,
    // While I am focusing the village stays quieter (plan §6.4: at most four people).
    lifeFocus: !!meMember && focusing(meMember, now),
    lookOf: (plotId) => {
      if (!looks.has(plotId)) looks.set(plotId, lookOf(layout.seed, plotId, { COATS, SKINS, HATS }));
      return looks.get(plotId);
    },
    farLabels: new Set(),
    lamps: standing.filter((item) => item.type === "lamp"),
    byId: new Map(standing.filter((item) => item.id).map((item) => [item.id, item])),
    names: new Map(members.map((m) => [m.id, m.name])),
    count: layout.plots.length,
    focusOf(memberId) {
      const own = layout.plots.filter((p) => p.owner === memberId);
      return own.length ? screenOf(own.at(-1).x, own.at(-1).y) : null;
    },
    mineFocus: null,
    activeBounds: () => area,
    detailFor,
    occludersAt,
    specs,
    me,
  };
}

function pathBox(path) {
  let b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of path.points) {
    const [sx, sy] = screenOf(x, y);
    b = [Math.min(b[0], sx - 3), Math.min(b[1], sy - 4), Math.max(b[2], sx + 3), Math.max(b[3], sy + 1)];
  }
  return b;
}
/** From a plot's door along its street and the streets before it, back to the square. */
export function pathToSquare(layout, plot) {
  const roads = new Map(layout.roads.map((r) => [r.id, r]));
  const nodes = new Map(layout.nodes.map((n) => [n.id, n]));
  const into = new Map();
  for (const r of layout.roads) if (r.status === "usable") into.set(r.b, r);
  const pts = [...plot.door];
  let road = layout.roads.find((r) => r.status === "usable" && r.type !== "kopru" && linePoint(r.pts, plot.door.at(-1)).d <= r.w / 2 + 0.05);
  let from = plot.door.at(-1);
  for (let guard = 0; road && guard < 60; guard++) {
    const n = linePoint(road.pts, from);
    // Walk back along the street to its start.
    pts.push(n.point, ...road.pts.slice(0, n.seg).reverse());
    if (road.a === "n0") {
      const s = road.pts[0];
      pts.push([s[0] * 0.4, s[1] * 0.4]);
      break;
    }
    const node = nodes.get(road.a);
    if (node?.on && roads.has(node.on)) {
      from = [node.x, node.y];
      road = roads.get(node.on);
      continue;
    }
    const before = into.get(road.a);
    if (!before) return null;
    from = before.pts.at(-1);
    road = before;
  }
  if (!road) return null;
  let total = 0;
  const lengths = [0];
  for (let i = 1; i < pts.length; i++) lengths.push((total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])));
  return { points: pts, lengths, total };
}
export { MEMBER_COLORS };

// n46 köy v2 planner: where the next building (or the site it is being built
// on) goes, from the street front, with its door path, never moving anything
// already placed (plan §5).
//
// A layout is plain JSON: terrain, nodes, roads, public spaces (foci) and
// plots. planPlacement() reads it and returns a mutation plan (one plot and
// only the streets that plot needs); applyPlan() writes the plan into a copy.
// Order: model context → usable street fronts → candidates → hard rules →
// normalised preference score → stable choice. When no front fits: a short
// connected street (a new stub or an extended dead end), then a new focus
// with its own small square, bounded so a search always ends. A landmark
// gets a plot of its own with a forecourt and an approach road; a model that
// needs a river, the lake or the railway opens a connected street towards it.
//
// Deterministic: same layout + request → same plan, on any host. No clock,
// no Math.random, no locale-dependent ordering.
import {
  along, bend, centre, cmp, createIndex, grow, hash, inPolygon, inside, lengthOf, lineBounds, lineLine, linePoint, lineRect, overlap,
  pointRect, pointSeg, q, rect, rectPolygon, rectWithin, rectsHit, rng, screenBox, segRect,
} from "./geom.js";
import { GEOMETRY_VERSION, doorsAt, modelSpec, shapeAt } from "./models.js";
import { TERRAIN_VERSION, makeTerrain } from "./terrain.js";

export const GENERATOR_VERSION = 1;
export const PLAZA_R = 6.5;
export const WIDTH = { omurga: 2.4, sokak: 2.0, yaklasim: 2.4, kopru: 1.8, patika: 0.8, iskele: 0.9 };
// Calibration starting values (plan §5.1, §5.3, §5.4); B sahneleri tuned them.
export const LIMITS = { candidates: 96, total: 256, expansions: 3, foci: 3, streetsPerFocus: 5, plazaStreets: 6 };
export const WEIGHTS = { owner: 0.3, infra: 0.25, view: 0.2, ground: 0.15, focus: 0.1 };
const PLOT_DIAMETER = 6; // a typical house plot, the yardstick for distances
const OWNER_SATURATE = 8 * PLOT_DIAMETER;
const FOCUS_SATURATE = 30;
const STREET_STEP = 1.3;
const FOCUS_KINDS = ["cesme", "cay", "sahaf", "pazar", "bahce"];

// ---------- the layout ----------
export function emptyLayout(seed) {
  return {
    generator: GENERATOR_VERSION,
    terrainVersion: TERRAIN_VERSION,
    seed,
    terrain: makeTerrain(seed),
    nodes: [{ id: "n0", x: 0, y: 0 }],
    roads: [],
    foci: [{ id: "f0", x: 0, y: 0, r: PLAZA_R, kind: "meydan", node: "n0", parent: null }],
    plots: [],
    seq: { n: 1, r: 0, f: 1, p: 0 },
  };
}
const subjectKey = (s) => `${s.type}:${s.id}`;
export const plotOf = (layout, subject) => layout.plots.find((p) => subjectKey(p.subject) === subjectKey(subject)) || null;

// ---------- context: indexes over what is already there ----------
function contextOf(layout, { exclude = null } = {}) {
  const plots = layout.plots.filter((p) => !exclude || p.id !== exclude);
  const plotIndex = createIndex(16),
    roadIndex = createIndex(16),
    doorIndex = createIndex(16);
  for (const p of plots) {
    plotIndex.add(p.plot, p);
    if (p.door) doorIndex.add(lineBounds(p.door, 1), p);
  }
  for (const r of layout.roads) roadIndex.add(lineBounds(r.pts, r.w), r);
  const nodes = new Map(layout.nodes.map((n) => [n.id, n]));
  return { layout, plots, plotIndex, roadIndex, doorIndex, nodes, terrain: layout.terrain };
}

// ---------- hard rules (plan §5.2) ----------
// Each returns a reason code or null. A failed rule is never made up for by score.
function groundReason(ctx, spec, shape, { own = new Set(), allowWater = false, allowRail = false, self = null } = {}) {
  const { plot, ground } = shape;
  if (Math.abs(plot[0]) > 900 || Math.abs(plot[2]) > 900 || Math.abs(plot[1]) > 900 || Math.abs(plot[3]) > 900) return "out_of_bounds";
  for (const other of ctx.plotIndex.near(plot)) if (rectsHit(plot, other.plot)) return "footprint_conflict";
  for (const r of ctx.roadIndex.near(grow(plot, 3))) {
    if (own.has(r.id)) continue;
    if (lineRect(r.pts, plot) < r.w / 2 + 0.15) return r.status === "reserved" ? "reserved_corridor" : "road_conflict";
  }
  for (const other of ctx.doorIndex.near(grow(plot, 1))) if (lineRect(other.door, plot) < 0.3) return "entrance_blocked";
  for (const f of ctx.layout.foci) {
    if (self && f.of === self) continue;
    if (pointRect([f.x, f.y], plot) < f.r + 0.5) return "public_space_pressure";
  }
  const t = ctx.terrain;
  if (!allowWater) {
    if (lineRect(t.river.pts, ground) < t.river.w / 2 + 1.0) return "wrong_water_context";
    if (rectPolygon(ground, t.lake.poly) < 1.0) return "wrong_water_context";
  }
  if (!allowRail && t.rail && lineRect(t.rail.pts, plot) < t.rail.w / 2 + 0.8) return "rail_conflict";
  return null;
}
function pathReason(ctx, pts, { self = null, ownPlot = null } = {}) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    for (const other of ctx.plotIndex.near(grow(rect(a[0], a[1], b[0], b[1]), 1))) if (segRect(a, b, other.ground) < 0.2) return "entrance_unconnected";
    if (ownPlot && segRect(a, b, grow(ownPlot, -0.05)) <= 0) return "entrance_unconnected";
  }
  const t = ctx.terrain;
  if (lineLine(pts, t.river.pts) < t.river.w / 2 + 0.3) return "entrance_unconnected";
  if (pts.some((p) => inPolygon(p, t.lake.poly))) return "entrance_unconnected";
  if (t.rail && lineLine(pts, t.rail.pts) < t.rail.w / 2 + 0.2) return "entrance_unconnected";
  return null;
}
// A new street: off every plot and door path, clear of water, rail and the other streets.
function roadReason(ctx, pts, w, { skip = new Set(), startOn = null } = {}) {
  const bounds = lineBounds(pts, w + 1);
  for (const p of ctx.plotIndex.near(bounds)) if (lineRect(pts, p.plot) < w / 2 + 0.2) return "footprint_conflict";
  for (const p of ctx.doorIndex.near(bounds)) if (lineLine(pts, p.door) < w / 2 + 0.4) return "entrance_blocked";
  const tail = pts.slice(2);
  for (const r of ctx.roadIndex.near(bounds)) {
    if (skip.has(r.id)) continue;
    const gap = lineLine(r.id === startOn ? pts.slice(3) : tail, r.pts);
    if (gap < (r.w + w) / 2 + 1.2) return "road_conflict";
  }
  for (const f of ctx.layout.foci) {
    if (skip.has(f.id)) continue;
    if (Math.min(...tail.map((p) => Math.hypot(p[0] - f.x, p[1] - f.y))) < f.r + w / 2 + 0.3) return "public_space_pressure";
  }
  const t = ctx.terrain;
  if (lineLine(pts, t.river.pts) < t.river.w / 2 + w / 2 + 0.8) return "wrong_water_context";
  if (pts.some((p) => inPolygon(p, t.lake.poly)) || lineLine(pts, [...t.lake.poly, t.lake.poly[0]]) < w / 2 + 0.6) return "wrong_water_context";
  if (t.rail && lineLine(pts, t.rail.pts) < t.rail.w / 2 + w / 2 + 0.8) return "rail_conflict";
  return null;
}

// ---------- scoring (plan §5.3) ----------
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function scoreOf(ctx, cand, req) {
  const [cx, cy] = [cand.x, cand.y];
  const mine = ctx.plots.filter((p) => p.owner && p.owner === req.owner);
  const owner = mine.length ? 1 - clamp01(Math.min(...mine.map((p) => Math.hypot(p.x - cx, p.y - cy))) / OWNER_SATURATE) : 0.5;
  const doorLen = cand.door ? lengthOf(cand.door) : 0;
  const infra = clamp01(1 - 0.8 * clamp01(cand.newRoad / 40) - 0.3 * clamp01(doorLen / 6));
  // Visual openness: a new building should not hide a neighbour's front, nor hide behind one.
  const box = screenBox(cand.shape.over, cand.spec.height);
  let cover = 0,
    hidden = 0;
  for (const n of ctx.plotIndex.near(grow(cand.shape.plot, 14))) {
    const nb = screenBox(n.over, n.height || 4);
    const o = overlap(box, nb);
    if (!o) continue;
    if (cx + cy > n.x + n.y) cover = Math.max(cover, o / ((nb[2] - nb[0]) * (nb[3] - nb[1]) || 1));
    else hidden = Math.max(hidden, o / ((box[2] - box[0]) * (box[3] - box[1]) || 1));
  }
  const view = clamp01(1 - 1.5 * cover - 0.5 * hidden);
  const ground = 1; // level ground everywhere in terrain version 1
  const f = ctx.layout.foci.reduce((best, x) => Math.min(best, Math.hypot(x.x - cx, x.y - cy) - x.r), Infinity);
  const focus = 1 - clamp01(f / FOCUS_SATURATE);
  const terms = { owner, infra, view, ground, focus };
  const total = Object.entries(WEIGHTS).reduce((t, [k, w]) => t + w * terms[k], 0);
  return { total: Math.round(total * 1e6) / 1e6, terms: Object.fromEntries(Object.entries(terms).map(([k, v]) => [k, Math.round(v * 1000) / 1000])) };
}
// Equal scores: fewer new streets, then less ground work, then a stable hash order.
const better = (a, b) => b.score.total - a.score.total || a.newRoad - b.newRoad || cmp(a.order, b.order);

// ---------- candidates on a street front (plan §5.1) ----------
function frontCandidates(ctx, spec, road, req, extra = {}) {
  const out = [];
  const len = lengthOf(road.pts);
  for (const facing of spec.facings) {
    const local = shapeAt(spec, 0, 0, facing);
    for (const side of [1, -1]) {
      for (let s = 1.2; s <= len - 1.2; s += STREET_STEP) {
        const { p, dir } = along(road.pts, s);
        const n = [-dir[1] * side, dir[0] * side];
        // How far the plot reaches from its centre towards the street.
        const sup = Math.max(...[[local.plot[0], local.plot[1]], [local.plot[2], local.plot[1]], [local.plot[2], local.plot[3]], [local.plot[0], local.plot[3]]].map(([x, y]) => -(x * n[0] + y * n[1])));
        const off = road.w / 2 + 0.2 + sup;
        const x = q(p[0] + n[0] * off),
          y = q(p[1] + n[1] * off);
        const door = doorsAt(spec, x, y, facing)[0];
        // Doors face the street, or open to the side next to it; never away from it.
        if (door.dir[0] * -n[0] + door.dir[1] * -n[1] < -0.3) continue;
        out.push({ ...extra, spec, road, facing, x, y, side, s, door, order: `${road.id}:${side}:${facing}:${Math.round(s * 10)}:${hash(`${req.subject.id}:${road.id}:${s}:${side}:${facing}`)}` });
      }
    }
  }
  return out;
}
// Finishes a candidate: its shape, door path, hard rules, score.
function judge(ctx, cand, req, own = new Set()) {
  const spec = cand.spec;
  cand.shape = shapeAt(spec, cand.x, cand.y, cand.facing);
  const reason = groundReason(ctx, spec, cand.shape, { own });
  if (reason) return reason;
  if (!cand.door) {
    const road = cand.road;
    const near = linePoint(road.pts, cand.doorPoint.point);
    const toward = [cand.doorPoint.point[0] - near.point[0], cand.doorPoint.point[1] - near.point[1]];
    const d = Math.hypot(...toward) || 1;
    const edge = [q(near.point[0] + (toward[0] / d) * (road.w / 2 - 0.1)), q(near.point[1] + (toward[1] / d) * (road.w / 2 - 0.1))];
    cand.door = [cand.doorPoint.point.map(q), edge];
  }
  if (lengthOf(cand.door) > 7) return "entrance_unconnected";
  const pr = pathReason(ctx, cand.door, { ownPlot: cand.shape.ground });
  if (pr) return pr;
  cand.score = scoreOf(ctx, cand, req);
  return null;
}
const tally = (rejected, reason) => (rejected[reason] = (rejected[reason] || 0) + 1);

/** Usable streets near the anchor: the nearest foci's streets, nearest first. */
function nearbyRoads(ctx, anchor) {
  const foci = [...ctx.layout.foci].sort((a, b) => Math.hypot(a.x - anchor[0], a.y - anchor[1]) - Math.hypot(b.x - anchor[0], b.y - anchor[1]) || cmp(a.id, b.id)).slice(0, LIMITS.foci);
  const ids = new Set(foci.map((f) => f.id));
  return {
    foci,
    roads: ctx.layout.roads.filter((r) => r.status === "usable" && ["omurga", "sokak", "yaklasim"].includes(r.type) && (ids.has(r.focus) || linePoint(r.pts, anchor).d < 30)),
  };
}
function anchorOf(ctx, owner) {
  const mine = ctx.plots.filter((p) => p.owner && p.owner === owner);
  if (!mine.length) return [0, 0];
  return [mine.reduce((t, p) => t + p.x, 0) / mine.length, mine.reduce((t, p) => t + p.y, 0) / mine.length];
}

function bestOf(ctx, cands, req, budget, rejected, own) {
  // Cheap pass first (plot overlap through the index); only the survivors spend the budget.
  let best = null,
    spent = 0;
  for (const c of cands) {
    if (spent >= budget) break;
    const plot = shapeAt(c.spec, c.x, c.y, c.facing).plot;
    if (ctx.plotIndex.near(plot).some((o) => rectsHit(plot, o.plot))) {
      tally(rejected, "footprint_conflict");
      continue;
    }
    spent++;
    c.doorPoint = c.door;
    c.door = null;
    c.newRoad = c.newRoad || 0;
    const reason = judge(ctx, c, req, own);
    if (reason) {
      tally(rejected, reason);
      continue;
    }
    if (!best || better(c, best) < 0) best = c;
  }
  return { best, spent };
}

// ---------- growth: new streets and foci (plan §5.4) ----------
function streetsOf(layout, focus) {
  return layout.roads.filter((r) => r.focus === focus.id && r.type === "sokak").length;
}
function stubOptions(ctx, foci, req) {
  const out = [];
  const L = ctx.layout;
  for (const f of foci) {
    if (streetsOf(L, f) >= (f.id === "f0" ? LIMITS.plazaStreets : LIMITS.streetsPerFocus)) continue;
    const R = rng(hash(`${L.seed}:stub:${f.id}:${streetsOf(L, f)}`));
    const base = (hash(`${L.seed}:${f.id}`) % 360) * (Math.PI / 180);
    for (let i = 0; i < 10; i++) {
      const a = base + (i * Math.PI * 2) / 10;
      const d = [Math.cos(a), Math.sin(a)];
      const start = [q(f.x + d[0] * (f.r + 0.3)), q(f.y + d[1] * (f.r + 0.3))];
      const len = f.id === "f0" ? 18 : 15;
      const end = [start[0] + d[0] * len, start[1] + d[1] * len];
      const pts = bend(start, end, (R() * 2 - 1) * 2.2, 8);
      out.push({ kind: "stub", focus: f, start, pts, a: f.node, order: `${f.id}:${i}` });
    }
  }
  // Dead ends near the anchor may run on a little further.
  const used = new Map();
  for (const r of L.roads) for (const id of [r.a, r.b]) used.set(id, (used.get(id) || 0) + 1);
  for (const r of L.roads) {
    if (r.type !== "sokak" || used.get(r.b) !== 1 || lengthOf(r.pts) > 34) continue;
    const end = r.pts[r.pts.length - 1],
      prev = r.pts[r.pts.length - 3] || r.pts[0];
    const d0 = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
    for (const turn of [0, 0.4, -0.4]) {
      const d = [Math.cos(d0 + turn), Math.sin(d0 + turn)];
      const to = [end[0] + d[0] * 12, end[1] + d[1] * 12];
      out.push({ kind: "extension", from: r, start: end, pts: bend(end, to, turn * 2, 6), a: r.b, focus: L.foci.find((f) => f.id === r.focus) || L.foci[0], order: `${r.id}:x:${turn}` });
    }
  }
  return out;
}
function focusOptions(ctx, foci) {
  const L = ctx.layout;
  const out = [];
  for (const parent of foci)
    for (const dist of [26, 32])
      for (let i = 0; i < 12; i++) {
        const a = ((hash(`${L.seed}:focus:${parent.id}`) % 360) * Math.PI) / 180 + (i * Math.PI * 2) / 12;
        const d = [Math.cos(a), Math.sin(a)];
        const c = [q(parent.x + d[0] * dist), q(parent.y + d[1] * dist)];
        out.push({ parent, c, d, order: `${parent.id}:${dist}:${i}` });
      }
  return out;
}
function clearCircle(ctx, c, r) {
  const box = [c[0] - r, c[1] - r, c[0] + r, c[1] + r];
  if (ctx.plotIndex.near(box).some((p) => pointRect(c, p.plot) < r)) return false;
  if (ctx.roadIndex.near(box).some((x) => linePoint(x.pts, c).d < r * 0.75)) return false;
  if (ctx.layout.foci.some((f) => Math.hypot(f.x - c[0], f.y - c[1]) < f.r + r + 8)) return false;
  const t = ctx.terrain;
  if (linePoint(t.river.pts, c).d < r + t.river.w || inPolygon(c, t.lake.poly) || linePoint([...t.lake.poly, t.lake.poly[0]], c).d < r) return false;
  if (t.rail && linePoint(t.rail.pts, c).d < r + t.rail.w) return false;
  return true;
}

// A plan reserves ids from the layout's counters, so two plans on the same
// revision collide on purpose (only one can be committed).
function ids(layout) {
  const seq = { ...layout.seq };
  return {
    seq,
    node: () => `n${seq.n++}`,
    road: () => `r${seq.r++}`,
    focus: () => `f${seq.f++}`,
    plot: () => `p${seq.p++}`,
  };
}
function plotRecord(cand, req, id) {
  const { spec, shape } = cand;
  return {
    id,
    subject: { ...req.subject },
    owner: req.owner || null,
    model: spec.id,
    gv: spec.version,
    scale: spec.scale,
    height: spec.height,
    x: cand.x,
    y: cand.y,
    z: 0,
    facing: cand.facing,
    ground: shape.ground.map(q),
    over: shape.over.map(q),
    plot: shape.plot.map(q),
    door: cand.door,
    road: cand.road?.id || null,
  };
}

/**
 * Where `req.model` goes for `req.subject` ({type, id}) of `req.owner`.
 * Returns { ok, plot, roads, nodes, foci, how, score, tried, rejected } or { ok: false, error, tried, rejected }.
 * `req.exclude`: a plot id to ignore (the building's own plot when moving it).
 */
export function planPlacement(layout, req) {
  const spec = modelSpec(req.model, req.version ?? GEOMETRY_VERSION);
  if (!spec) return { ok: false, error: "unknown_model", tried: 0, rejected: {} };
  if (plotOf(layout, req.subject) && !req.exclude) return { ok: false, error: "already_placed", tried: 0, rejected: {} };
  const ctx = contextOf(layout, { exclude: req.exclude });
  const rejected = {};
  const anchor = req.anchor || anchorOf(ctx, req.owner);
  const id = ids(layout);
  if (spec.context !== "dry") return finish(contextPlan(ctx, spec, req, anchor, id, rejected), rejected, req);
  if (spec.landmark) return finish(landmarkPlan(ctx, spec, req, anchor, id, rejected), rejected, req);
  let tried = 0;
  // 1. Existing street fronts near the owner.
  const { foci, roads } = nearbyRoads(ctx, anchor);
  const cands = roads.flatMap((r) => frontCandidates(ctx, spec, r, req));
  cands.sort((a, b) => Math.hypot(a.x - anchor[0], a.y - anchor[1]) - Math.hypot(b.x - anchor[0], b.y - anchor[1]) || cmp(a.order, b.order));
  const first = bestOf(ctx, cands, req, LIMITS.candidates, rejected, new Set());
  tried += first.spent;
  if (first.best) return finish({ how: "front", cand: first.best, roads: [], nodes: [], foci: [], id, tried }, rejected, req);
  // 2. A short connected street: a new stub from a nearby focus, or a dead end run on.
  let expansions = 0;
  let best = null;
  for (const opt of stubOptions(ctx, foci, req)) {
    if (expansions >= LIMITS.expansions || tried >= LIMITS.total) break;
    const why = roadReason(ctx, opt.pts, WIDTH.sokak, { skip: new Set([opt.focus?.id, opt.from?.id].filter(Boolean)), startOn: opt.from?.id });
    if (why) {
      tally(rejected, `street_${why}`);
      continue;
    }
    expansions++;
    const road = { id: "(new)", a: opt.a, b: "(end)", pts: opt.pts, w: WIDTH.sokak, type: "sokak", status: "usable", focus: opt.focus.id };
    const local = contextOf({ ...layout, roads: [...layout.roads, road] }, { exclude: req.exclude });
    const sub = frontCandidates(local, spec, road, req, { newRoad: lengthOf(opt.pts), how: opt.kind, opt });
    const found = bestOf(local, sub, req, LIMITS.total - tried, rejected, new Set());
    tried += found.spent;
    if (found.best && (!best || better(found.best, best) < 0)) best = found.best;
  }
  if (best) {
    const node = { id: id.node(), x: best.opt.pts.at(-1)[0], y: best.opt.pts.at(-1)[1] };
    const road = { id: id.road(), a: best.opt.a, b: node.id, pts: best.opt.pts, w: WIDTH.sokak, type: "sokak", status: "usable", focus: best.opt.focus.id };
    best.road = road;
    return finish({ how: best.how, cand: best, roads: [road], nodes: [node], foci: [], id, tried }, rejected, req);
  }
  // 3. A new focus: its own small square, joined to the nearest one by a street.
  for (const opt of focusOptions(ctx, foci)) {
    if (tried >= LIMITS.total + 64) break;
    if (!clearCircle(ctx, opt.c, 9)) {
      tally(rejected, "focus_no_room");
      continue;
    }
    const start = [q(opt.parent.x + opt.d[0] * (opt.parent.r + 0.3)), q(opt.parent.y + opt.d[1] * (opt.parent.r + 0.3))];
    const end = [q(opt.c[0] - opt.d[0] * 3.4), q(opt.c[1] - opt.d[1] * 3.4)];
    const pts = bend(start, end, ((hash(opt.order) % 100) / 100 - 0.5) * 4, 10);
    const why = roadReason(ctx, pts, WIDTH.omurga, { skip: new Set([opt.parent.id]) });
    if (why) {
      tally(rejected, `focus_${why}`);
      continue;
    }
    const focus = { id: "(new)", x: opt.c[0], y: opt.c[1], r: 3.2 };
    const road = { id: "(new)", a: opt.parent.node, b: "(f)", pts, w: WIDTH.omurga, type: "omurga", status: "usable", focus: opt.parent.id };
    const local = contextOf({ ...layout, roads: [...layout.roads, road], foci: [...layout.foci, focus] }, { exclude: req.exclude });
    const sub = frontCandidates(local, spec, road, req, { newRoad: lengthOf(pts), how: "focus", opt, pts });
    const found = bestOf(local, sub, req, 48, rejected, new Set());
    tried += found.spent;
    if (!found.best) continue;
    const c = found.best;
    const node = { id: id.node(), x: opt.c[0], y: opt.c[1] };
    const newFocus = { id: id.focus(), x: opt.c[0], y: opt.c[1], r: 3.2, kind: FOCUS_KINDS[layout.foci.length % FOCUS_KINDS.length], node: node.id, parent: opt.parent.id };
    const newRoad = { id: id.road(), a: opt.parent.node, b: node.id, pts, w: WIDTH.omurga, type: "omurga", status: "usable", focus: opt.parent.id };
    c.road = newRoad;
    return finish({ how: "focus", cand: c, roads: [newRoad], nodes: [node], foci: [newFocus], id, tried }, rejected, req);
  }
  return { ok: false, error: "no_plot", tried, rejected };
}

function finish(found, rejected, req) {
  if (!found || !found.cand) return { ok: false, error: found?.error || "no_plot", tried: found?.tried || 0, rejected };
  const { cand, id } = found;
  const plot = plotRecord(cand, req, found.plotId || id.plot());
  for (const f of found.foci) if (f.landmark) f.of = plot.id;
  return { ok: true, how: found.how, plot, roads: found.roads, nodes: found.nodes, foci: found.foci, seq: id.seq, score: cand.score, tried: found.tried, rejected, extra: found.extra || null };
}

// ---------- landmarks ----------
function landmarkPlan(ctx, spec, req, anchor, id, rejected) {
  const L = ctx.layout;
  const foci = [...L.foci].sort((a, b) => Math.hypot(a.x - anchor[0], a.y - anchor[1]) - Math.hypot(b.x - anchor[0], b.y - anchor[1]) || cmp(a.id, b.id)).slice(0, 4);
  const half = Math.max(...spec.over.map(Math.abs)) + spec.front + spec.side;
  let tried = 0;
  let best = null;
  for (const parent of foci)
    for (const extra of [8, 14, 22])
      for (let i = 0; i < 12; i++) {
        const a = ((hash(`${L.seed}:mark:${parent.id}`) % 360) * Math.PI) / 180 + (i * Math.PI * 2) / 12;
        const d = [Math.cos(a), Math.sin(a)];
        const dist = parent.r + half + extra;
        const c = [q(parent.x + d[0] * dist), q(parent.y + d[1] * dist)];
        // The door looks back to where people come from.
        const facing = -d[0] > -d[1] ? 1 : 0;
        const cand = { spec, facing, x: c[0], y: c[1], newRoad: 0, order: `${parent.id}:${extra}:${i}` };
        cand.shape = shapeAt(spec, c[0], c[1], facing);
        tried++;
        const why = groundReason(ctx, spec, cand.shape);
        if (why) {
          tally(rejected, why);
          continue;
        }
        const door = doorsAt(spec, c[0], c[1], facing)[0];
        // The approach: from the parent square's edge to the forecourt's front edge.
        const out = spec.front + spec.side + WIDTH.yaklasim / 2 + 0.5;
        const front = [q(door.point[0] + door.dir[0] * out), q(door.point[1] + door.dir[1] * out)];
        const toward = [front[0] - parent.x, front[1] - parent.y],
          len = Math.hypot(...toward);
        const start = [q(parent.x + (toward[0] / len) * (parent.r + 0.3)), q(parent.y + (toward[1] / len) * (parent.r + 0.3))];
        const pts = bend(start, front, 0, 8);
        const rr = roadReason({ ...ctx, plotIndex: ctx.plotIndex }, pts, WIDTH.yaklasim, { skip: new Set([parent.id]) });
        if (rr) {
          tally(rejected, `approach_${rr}`);
          continue;
        }
        cand.door = [door.point.map(q), front];
        cand.newRoad = lengthOf(pts);
        cand.pts = pts;
        cand.parent = parent;
        cand.score = scoreOf(ctx, cand, req);
        if (!best || better(cand, best) < 0) best = cand;
      }
  if (!best) return { error: "no_plot", tried };
  const node = { id: id.node(), x: best.pts.at(-1)[0], y: best.pts.at(-1)[1] };
  const road = { id: id.road(), a: best.parent.node, b: node.id, pts: best.pts, w: WIDTH.yaklasim, type: "yaklasim", status: "usable", focus: best.parent.id };
  best.road = road;
  // The forecourt becomes a public space of its own: later houses line the approach, not the court.
  const door = best.door[0];
  const fc = [q((door[0] + best.door[1][0]) / 2), q((door[1] + best.door[1][1]) / 2)];
  const focus = { id: id.focus(), x: fc[0], y: fc[1], r: Math.max(1.5, spec.front * 0.5), kind: "eser", node: node.id, parent: best.parent.id, landmark: true };
  return { how: "landmark", cand: best, roads: [road], nodes: [node], foci: [focus], id, tried };
}

// ---------- models that need water or rails ----------
// A street from the nearest usable road to `point`, when the door is not next to one.
function connector(ctx, point, id, { skipPlot = null } = {}) {
  let best = null;
  for (const r of ctx.layout.roads) {
    if (r.status !== "usable" || r.type === "kopru") continue;
    const n = linePoint(r.pts, point);
    if (!best || n.d < best.n.d - 1e-9 || (Math.abs(n.d - best.n.d) < 1e-9 && cmp(r.id, best.r.id) < 0)) best = { r, n };
  }
  // The square itself is reachable too.
  const plaza = ctx.layout.foci[0];
  const toPlaza = Math.hypot(point[0] - plaza.x, point[1] - plaza.y) - plaza.r;
  if (!best || toPlaza < best.n.d) {
    const d = [(point[0] - plaza.x) / (toPlaza + plaza.r), (point[1] - plaza.y) / (toPlaza + plaza.r)];
    best = { r: null, n: { d: toPlaza, point: [plaza.x + d[0] * (plaza.r + 0.3), plaza.y + d[1] * (plaza.r + 0.3)] }, plaza };
  }
  if (best.n.d <= 4.5 && best.r) {
    const toward = [point[0] - best.n.point[0], point[1] - best.n.point[1]],
      d = Math.hypot(...toward) || 1;
    return { door: [point.map(q), [q(best.n.point[0] + (toward[0] / d) * (best.r.w / 2 - 0.1)), q(best.n.point[1] + (toward[1] / d) * (best.r.w / 2 - 0.1))]], roads: [], nodes: [], length: 0, road: best.r };
  }
  if (best.n.d > 70) return null;
  const from = best.n.point.map(q);
  const dir = [point[0] - from[0], point[1] - from[1]],
    d = Math.hypot(...dir) || 1;
  const end = [q(point[0] - (dir[0] / d) * 1.6), q(point[1] - (dir[1] / d) * 1.6)];
  const pts = bend(from, end, 0, Math.max(4, Math.ceil(d / 4)));
  const skip = new Set([best.r?.id, best.plaza?.id].filter(Boolean));
  const scoped = skipPlot ? { ...ctx, plotIndex: { near: (r) => ctx.plotIndex.near(r).filter((p) => p !== skipPlot) } } : ctx;
  const why = roadReason(scoped, pts, WIDTH.sokak, { skip, startOn: best.r?.id });
  if (why) return { error: why };
  const junction = { id: id.node(), x: from[0], y: from[1], on: best.r?.id || null };
  const a = best.plaza ? best.plaza.node : junction.id;
  const endNode = { id: id.node(), x: end[0], y: end[1] };
  const focus = best.r ? best.r.focus : best.plaza.id;
  const road = { id: id.road(), a, b: endNode.id, pts, w: WIDTH.sokak, type: "sokak", status: "usable", focus };
  return { door: [point.map(q), end], roads: [road], nodes: best.plaza ? [endNode] : [junction, endNode], length: lengthOf(pts), road };
}

function contextPlan(ctx, spec, req, anchor, id, rejected) {
  const t = ctx.terrain;
  const kind = spec.context;
  const tries = [];
  const push = (x, y, facing, extra = {}) => tries.push({ spec, x: q(x), y: q(y), facing, ...extra });
  const local = (facing) => shapeAt(spec, 0, 0, facing);
  const reach = (shape, n) => Math.max(...[[shape[0], shape[1]], [shape[2], shape[1]], [shape[2], shape[3]], [shape[0], shape[3]]].map(([x, y]) => x * n[0] + y * n[1]));
  const near = (line, step) => {
    const out = [];
    const len = lengthOf(line);
    for (let s = 0; s <= len; s += step) out.push(along(line, s));
    return out.sort((a, b) => Math.hypot(a.p[0] - anchor[0], a.p[1] - anchor[1]) - Math.hypot(b.p[0] - anchor[0], b.p[1] - anchor[1])).slice(0, 36);
  };
  if (kind === "bank" || kind === "rail") {
    const line = kind === "bank" ? t.river : t.rail;
    if (!line) return { error: "no_context" };
    for (const { p, dir } of near(line.pts, 3))
      for (const side of [1, -1])
        for (const facing of spec.facings) {
          const n = [-dir[1] * side, dir[0] * side];
          // The wall towards the water (or the platform towards the track) stands at its edge.
          const sh = local(facing).ground;
          const off = line.w / 2 + (kind === "bank" ? -0.35 : 0.5) + reach(sh, [-n[0], -n[1]]);
          push(p[0] + n[0] * off, p[1] + n[1] * off, facing, { n, line });
        }
  } else if (kind === "lake" || kind === "shore") {
    const poly = t.lake.poly;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const out = [m[0] - t.lake.cx, m[1] - t.lake.cy],
        d = Math.hypot(...out) || 1;
      const n = [out[0] / d, out[1] / d];
      for (const facing of spec.facings) {
        const sh = local(facing).ground;
        const off = kind === "lake" ? -(reach(sh, n) + 1.0) : reach(sh, [-n[0], -n[1]]) + 0.4;
        push(m[0] + n[0] * off, m[1] + n[1] * off, facing, { n });
      }
    }
    tries.sort((a, b) => Math.hypot(a.x - anchor[0], a.y - anchor[1]) - Math.hypot(b.x - anchor[0], b.y - anchor[1]));
  } else if (kind === "bridge") {
    for (const { p, dir } of near(t.river.pts, 2.5))
      for (const facing of spec.facings) {
        const axis = facing ? [0, 1] : [1, 0];
        if (Math.abs(axis[0] * dir[0] + axis[1] * dir[1]) > 0.5) continue;
        push(p[0], p[1], facing, { dir });
      }
  }
  let best = null,
    tried = 0;
  for (const c of tries) {
    if (tried >= LIMITS.total) break;
    c.shape = shapeAt(spec, c.x, c.y, c.facing);
    const why = groundReason(ctx, spec, c.shape, { allowWater: kind !== "rail", allowRail: kind === "rail" });
    tried++;
    if (why) {
      tally(rejected, why);
      continue;
    }
    // The context itself, checked on the real shape.
    const g = c.shape.ground;
    const river = lineRect(t.river.pts, g),
      lake = rectPolygon(g, t.lake.poly);
    let ok = true;
    if (kind === "bank") ok = river < t.river.w / 2 + 0.2 && river >= 0 && lineRect(t.river.pts, grow(g, -1.2)) > t.river.w / 2 - 0.2 && lake > 1.5;
    else if (kind === "lake") ok = rectWithin(g, t.lake.poly, 0.4) && lineRect([...t.lake.poly, t.lake.poly[0]], g) < 3.2 && river > t.river.w / 2 + 0.6;
    else if (kind === "shore") ok = lake > 0.1 && lake < 1.6 && river > t.river.w / 2 + 1;
    else if (kind === "rail") {
      const rd = lineRect(t.rail.pts, g);
      ok = rd > t.rail.w / 2 + 0.2 && rd < t.rail.w / 2 + 1.2 && river > t.river.w / 2 + 1 && lake > 1;
    } else if (kind === "bridge") {
      const ends = doorsAt(spec, c.x, c.y, c.facing);
      ok = ends.every((e) => linePoint(t.river.pts, e.point).d > t.river.w / 2 + 0.6 && !inPolygon(e.point, t.lake.poly)) && lake > 2;
    }
    if (!ok) {
      tally(rejected, "wrong_water_context");
      continue;
    }
    if (kind !== "bank" && kind !== "lake" && kind !== "bridge" && rectPolygon(g, t.lake.poly) < 0.1) {
      tally(rejected, "wrong_water_context");
      continue;
    }
    const sub = ids(ctx.layout);
    // Same counters as the outer plan: copy them so ids stay in one sequence.
    Object.assign(sub.seq, id.seq);
    let roads = [],
      nodes = [],
      door = null,
      length = 0,
      road = null,
      extra = null;
    const doors = doorsAt(spec, c.x, c.y, c.facing);
    if (kind === "bridge") {
      // The deck is a street itself; the near landing joins the village, the far one leads on.
      const [e0, e1] = [...doors].sort((a, b) => Math.hypot(a.point[0] - anchor[0], a.point[1] - anchor[1]) - Math.hypot(b.point[0] - anchor[0], b.point[1] - anchor[1]));
      const link = connector(ctx, e0.point, sub);
      if (!link || link.error) {
        tally(rejected, `connect_${link?.error || "far"}`);
        continue;
      }
      const deckA = { id: sub.node(), x: q(e0.point[0]), y: q(e0.point[1]) },
        deckB = { id: sub.node(), x: q(e1.point[0]), y: q(e1.point[1]) };
      const deck = { id: sub.road(), a: deckA.id, b: deckB.id, pts: [[deckA.x, deckA.y], [deckB.x, deckB.y]], w: WIDTH.kopru, type: "kopru", status: "usable", focus: link.road?.focus || "f0" };
      const onward = [q(e1.point[0] + e1.dir[0] * 8), q(e1.point[1] + e1.dir[1] * 8)];
      const farPts = bend([deckB.x, deckB.y], onward, 0, 4);
      const farWhy = roadReason(ctx, farPts, WIDTH.sokak, {});
      const farNode = { id: sub.node(), x: onward[0], y: onward[1] };
      const far = farWhy ? null : { id: sub.road(), a: deckB.id, b: farNode.id, pts: farPts, w: WIDTH.sokak, type: "sokak", status: "usable", focus: deck.focus };
      // The landing joins the connector's end (or the road it touches).
      const tail = link.roads.length ? [[deckA.x, deckA.y], link.door[1]] : [[deckA.x, deckA.y], link.door[1]];
      const ramp = { id: sub.road(), a: link.roads.length ? link.roads[0].b : sub.node(), b: deckA.id, pts: tail, w: WIDTH.sokak, type: "sokak", status: "usable", focus: deck.focus };
      if (!link.roads.length) nodes.push({ id: ramp.a, x: q(link.door[1][0]), y: q(link.door[1][1]), on: link.road.id });
      roads = [...link.roads, ramp, deck, ...(far ? [far] : [])];
      nodes = [...link.nodes, ...nodes, deckA, deckB, ...(far ? [farNode] : [])];
      length = link.length + lengthOf(tail) + (far ? 8 : 0);
      road = deck;
      door = null;
    } else {
      const d = doors[0];
      let start = d.point;
      if (kind === "lake") {
        // A jetty from the door to the shore.
        let best = null;
        const poly = t.lake.poly;
        for (let i = 0; i < poly.length; i++) {
          const n = linePoint([poly[i], poly[(i + 1) % poly.length]], d.point);
          if (!best || n.d < best.d) best = n;
        }
        const out = [best.point[0] - t.lake.cx, best.point[1] - t.lake.cy],
          len = Math.hypot(...out) || 1;
        const shore = [q(best.point[0] + (out[0] / len) * 0.9), q(best.point[1] + (out[1] / len) * 0.9)];
        extra = { jetty: [d.point.map(q), shore] };
        if (pathReasonNoWater(ctx, extra.jetty)) {
          tally(rejected, "entrance_unconnected");
          continue;
        }
        start = shore;
      }
      const link = connector(ctx, start, sub);
      if (!link || link.error) {
        tally(rejected, `connect_${link?.error || "far"}`);
        continue;
      }
      if (kind === "lake") door = [...extra.jetty, ...link.door.slice(1)];
      else door = link.door;
      if (kind !== "lake" && pathReason(ctx, door, { ownPlot: c.shape.ground })) {
        tally(rejected, "entrance_unconnected");
        continue;
      }
      if (lengthOf(door) > 12) {
        tally(rejected, "entrance_unconnected");
        continue;
      }
      // The new street must stay off this very plot too.
      if (link.roads.some((r) => lineRect(r.pts, c.shape.plot) < r.w / 2 + 0.1)) {
        tally(rejected, "road_conflict");
        continue;
      }
      roads = link.roads;
      nodes = link.nodes;
      length = link.length;
      road = link.road;
    }
    c.door = door;
    c.newRoad = length;
    c.road = road;
    c.score = scoreOf(ctx, c, req);
    c.order = `${kind}:${c.x}:${c.y}:${c.facing}`;
    c.plan = { roads, nodes, extra, seq: sub.seq };
    if (!best || better(c, best) < 0) best = c;
  }
  if (!best) return { error: "no_context_plot", tried };
  Object.assign(id.seq, best.plan.seq);
  return { how: `context:${kind}`, cand: best, roads: best.plan.roads, nodes: best.plan.nodes, foci: [], id, tried, extra: best.plan.extra };
}
function pathReasonNoWater(ctx, pts) {
  for (let i = 1; i < pts.length; i++)
    for (const other of ctx.plotIndex.near(grow(rect(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]), 1))) if (segRect(pts[i - 1], pts[i], other.ground) < 0.2) return "entrance_unconnected";
  return null;
}

// ---------- writing a plan ----------
/** A copy of the layout with the plan applied (nothing already there changes). */
export function applyPlan(layout, plan) {
  if (!plan.ok) throw new Error(`cannot apply ${plan.error}`);
  const plot = { ...plan.plot, ...(plan.extra?.jetty ? { jetty: plan.extra.jetty } : {}) };
  const seq = { ...layout.seq };
  for (const k of ["n", "r", "f", "p"]) seq[k] = Math.max(seq[k], plan.seq[k]);
  return {
    ...layout,
    nodes: [...layout.nodes, ...plan.nodes],
    roads: [...layout.roads, ...plan.roads],
    foci: [...layout.foci, ...plan.foci],
    plots: [...layout.plots, plot],
    seq,
  };
}
/** The subject's plot is let go (a cancelled site, a deleted building); streets stay. */
export function releaseSubject(layout, subject) {
  return { ...layout, plots: layout.plots.filter((p) => subjectKey(p.subject) !== subjectKey(subject)) };
}
/** A finished site becomes its building on the very same plot. */
export function convertSubject(layout, from, to) {
  return { ...layout, plots: layout.plots.map((p) => (subjectKey(p.subject) === subjectKey(from) ? { ...p, subject: { ...to } } : p)) };
}
/** Where an existing building could move: up to `limit` plans, spread apart, its own plot ignored. */
export function movePlans(layout, subject, limit = 6) {
  const current = plotOf(layout, subject);
  if (!current) return [];
  const out = [];
  let rest = layout;
  for (let i = 0; i < limit * 2 && out.length < limit; i++) {
    const plan = planPlacement(rest, { subject, model: current.model, version: current.gv, owner: current.owner, exclude: current.id, anchor: [current.x, current.y] });
    if (!plan.ok) break;
    const far = Math.hypot(plan.plot.x - current.x, plan.plot.y - current.y) > 2;
    if (far && !out.some((o) => Math.hypot(o.plot.x - plan.plot.x, o.plot.y - plan.plot.y) < 4)) out.push(plan);
    // Block this spot for the next proposal (a scratch subject, never stored).
    rest = applyPlan(rest, { ...plan, plot: { ...plan.plot, id: `${plan.plot.id}~`, subject: { type: "scratch", id: `${i}` } } });
  }
  return out;
}

// ---------- checking a whole layout ----------
/** Roads reachable from the square (shared nodes, junctions on a road). */
export function reachableRoads(layout) {
  const byNode = new Map();
  for (const r of layout.roads)
    for (const n of [r.a, r.b]) {
      if (!byNode.has(n)) byNode.set(n, []);
      byNode.get(n).push(r);
    }
  const nodes = new Map(layout.nodes.map((n) => [n.id, n]));
  const seen = new Set();
  const stack = layout.roads.filter((r) => r.a === "n0" || r.b === "n0");
  // Roads starting at a focus join the roads that reach that focus's node.
  while (stack.length) {
    const r = stack.pop();
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    for (const n of [r.a, r.b]) for (const o of byNode.get(n) || []) if (!seen.has(o.id)) stack.push(o);
    for (const o of layout.roads) if (!seen.has(o.id) && [o.a, o.b].some((n) => nodes.get(n)?.on === r.id)) stack.push(o);
  }
  return seen;
}
/** Every broken rule in a layout (empty when it is sound). */
export function validateLayout(layout) {
  const problems = [];
  const ctx = contextOf(layout);
  const reach = reachableRoads(layout);
  for (const p of layout.plots) {
    const spec = modelSpec(p.model, p.gv);
    const shape = { ground: p.ground, over: p.over, plot: p.plot };
    const others = contextOf({ ...layout, plots: layout.plots.filter((o) => o !== p) });
    const deck = layout.roads.find((r) => r.type === "kopru" && lineRect(r.pts, p.ground) === 0);
    const own = new Set(deck ? layout.roads.filter((r) => r === deck || [r.a, r.b].some((n) => n === deck.a || n === deck.b)).map((r) => r.id) : []);
    const why = groundReason(others, spec, shape, { allowWater: spec.context !== "dry" && spec.context !== "rail", allowRail: spec.context === "rail", own, self: p.id });
    if (why) problems.push([p.id, why]);
    if (p.door) {
      const end = p.door.at(-1);
      const road = layout.roads.find((r) => linePoint(r.pts, end).d <= r.w / 2 + 0.05 && r.status === "usable");
      if (!road) problems.push([p.id, "entrance_unconnected"]);
      else if (!reach.has(road.id)) problems.push([p.id, "network_unreachable"]);
      const pr = p.jetty ? pathReasonNoWater(others, p.door) : pathReason(others, p.door, { ownPlot: p.ground });
      if (pr) problems.push([p.id, pr]);
    } else if (spec.context === "bridge") {
      const deck = layout.roads.find((r) => r.type === "kopru" && lineRect(r.pts, p.ground) === 0);
      if (!deck || !reach.has(deck.id)) problems.push([p.id, "network_unreachable"]);
    } else problems.push([p.id, "entrance_unconnected"]);
  }
  for (const r of layout.roads) if (!reach.has(r.id)) problems.push([r.id, "network_unreachable"]);
  return problems;
}
export { centre, inside };

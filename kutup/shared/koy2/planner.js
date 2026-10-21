// n46 köy v2 planner: where the next building (or the site it is being built
// on) goes, from the street front, with its door path, never moving anything
// already placed (plan §5).
//
// A layout is plain JSON: terrain, nodes, roads, public spaces (foci) and
// plots. planPlacement() reads it and returns a mutation plan (one plot and
// only the streets that plot needs); applyPlan() writes the plan into a copy.
// Order: model context → usable street fronts → candidates → hard rules →
// normalised preference score → stable choice.
//
// Growth is planned a step ahead. The square starts with six reserved street
// corridors; no house may stand on a reserved corridor or a reserved square.
// When no open street front fits, the nearest reserved corridor opens, and
// opening it reserves what comes after it: every other generation a small
// square with three streets of its own, otherwise a straight run and one
// side branch. So the village grows as a tree of streets and squares, and a
// house never closes the way on. Reservations are soft: a landmark, a water
// or a rail model may drop the reserved pieces in its way (nothing stands on
// them). Every search is bounded (LIMITS), so a request always ends.
//
// Deterministic: same layout + request → same plan, on any host. No clock,
// no Math.random, no locale-dependent ordering.
import {
  along, bend, cmp, createIndex, grow, hash, inPolygon, inside, lengthOf, lineBounds, lineLine, linePoint, lineRect, linesCross, overlap,
  pointRect, q, rect, rectPolygon, rectWithin, rectsHit, rng, screenBox, segRect,
} from "./geom.js";
import { GEOMETRY_VERSION, doorsAt, modelSpec, shapeAt, turn, worldRect } from "./models.js";
import { TERRAIN_VERSION, makeTerrain } from "./terrain.js";

export const GENERATOR_VERSION = 1;
export const PLAZA_R = 6.5;
export const SQUARE_R = 3.2;
export const WIDTH = { omurga: 2.4, sokak: 2.0, yaklasim: 2.4, kopru: 1.8, patika: 0.8, iskele: 0.9 };
// Calibration values (plan §5.1, §5.3, §5.4), tuned on the B scenes.
export const LIMITS = { candidates: 96, total: 320, expansions: 8, foci: 3 };
export const WEIGHTS = { owner: 0.3, infra: 0.25, view: 0.2, ground: 0.15, focus: 0.1 };
const PLOT_DIAMETER = 6; // a typical house plot, the yardstick for distances
const OWNER_SATURATE = 8 * PLOT_DIAMETER;
const FOCUS_SATURATE = 30;
const STREET_STEP = 1.3;
const FOCUS_KINDS = ["cesme", "cay", "sahaf", "pazar", "bahce"];
const PLAZA_STREET = 22,
  SQUARE_STREET = 16,
  RUN = 16;

// ---------- the layout ----------
export function emptyLayout(seed) {
  const layout = {
    generator: GENERATOR_VERSION,
    terrainVersion: TERRAIN_VERSION,
    seed,
    terrain: makeTerrain(seed),
    nodes: [{ id: "n0", x: 0, y: 0 }],
    roads: [],
    foci: [{ id: "f0", x: 0, y: 0, r: PLAZA_R, kind: "meydan", node: "n0", parent: null, status: "open" }],
    plots: [],
    seq: { n: 1, r: 0, f: 1, p: 0 },
  };
  const id = ids(layout);
  const R = rng(hash(`${seed}:plaza`));
  const base = (hash(`${seed}:f0`) % 360) * (Math.PI / 180);
  const dirs = [0, 1, 2, 3, 4, 5].map((i) => base + (i * Math.PI) / 3 + (R() * 2 - 1) * 0.14);
  const res = reserveFrom(layout, { x: 0, y: 0, r: PLAZA_R, node: "n0", id: "f0" }, dirs, PLAZA_STREET, "omurga", 0, id, []);
  layout.nodes.push(...res.nodes);
  layout.roads.push(...res.roads);
  layout.seq = id.seq;
  return layout;
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
  return { layout, plots, plotIndex, roadIndex, doorIndex, terrain: layout.terrain };
}
const withAdded = (layout, { roads = [], foci = [], plots = [] }, exclude) =>
  contextOf({ ...layout, roads: [...layout.roads, ...roads], foci: [...layout.foci, ...foci], plots: [...layout.plots, ...plots] }, { exclude });

// ---------- hard rules (plan §5.2) ----------
// Each returns a reason code or null. A failed rule is never made up for by
// score. With `soft`, reserved pieces in the way are collected instead.
function groundReason(ctx, spec, shape, { own = new Set(), allowWater = false, allowRail = false, self = null, soft = null } = {}) {
  const { plot, ground } = shape;
  if (Math.abs(plot[0]) > 900 || Math.abs(plot[2]) > 900 || Math.abs(plot[1]) > 900 || Math.abs(plot[3]) > 900) return "out_of_bounds";
  for (const other of ctx.plotIndex.near(plot)) if (rectsHit(plot, other.plot)) return "footprint_conflict";
  for (const r of ctx.roadIndex.near(grow(plot, 3))) {
    if (own.has(r.id)) continue;
    if (lineRect(r.pts, plot) < r.w / 2 + 0.15) {
      if (r.status !== "reserved") return "road_conflict";
      if (!soft) return "reserved_corridor";
      soft.add(r.id);
    }
  }
  for (const other of ctx.doorIndex.near(grow(plot, 1))) if (lineRect(other.door, plot) < 0.3) return "entrance_blocked";
  for (const f of ctx.layout.foci) {
    if (self && f.of === self) continue;
    if (pointRect([f.x, f.y], plot) < f.r + 0.5) {
      if (f.status !== "reserved") return "public_space_pressure";
      if (!soft) return "reserved_corridor";
      soft.add(f.id);
    }
  }
  const t = ctx.terrain;
  if (!allowWater) {
    if (lineRect(t.river.pts, ground) < t.river.w / 2 + 1.0) return "wrong_water_context";
    if (rectPolygon(ground, t.lake.poly) < 1.0) return "wrong_water_context";
  }
  if (!allowRail && t.rail && lineRect(t.rail.pts, plot) < t.rail.w / 2 + 0.8) return "rail_conflict";
  return null;
}
function pathReason(ctx, pts, { ownPlot = null, water = true } = {}) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    for (const other of ctx.plotIndex.near(grow(rect(a[0], a[1], b[0], b[1]), 1))) if (segRect(a, b, other.ground) < 0.2) return "entrance_unconnected";
    if (ownPlot && segRect(a, b, grow(ownPlot, -0.05)) <= 0) return "entrance_unconnected";
  }
  if (!water) return null;
  const t = ctx.terrain;
  if (lineLine(pts, t.river.pts) < t.river.w / 2 + 0.3) return "entrance_unconnected";
  if (pts.some((p) => inPolygon(p, t.lake.poly))) return "entrance_unconnected";
  if (t.rail && lineLine(pts, t.rail.pts) < t.rail.w / 2 + 0.2) return "entrance_unconnected";
  return null;
}
// Crossing angle of two polylines that cross (radians, 0..π/2), or 0.
function crossAngle(l1, l2) {
  for (let i = 1; i < l1.length; i++)
    for (let j = 1; j < l2.length; j++) {
      const a = l1[i - 1],
        b = l1[i],
        c = l2[j - 1],
        d = l2[j];
      if (!linesCross([a, b], [c, d])) continue;
      const u = [b[0] - a[0], b[1] - a[1]],
        v = [d[0] - c[0], d[1] - c[1]];
      const cos = Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v) || 1);
      return Math.acos(Math.min(1, cos));
    }
  return 0;
}
// A new street: off every plot and door path, clear of water, rail and the
// other streets. `cross`: it may cross an open street at a fair angle (a
// crossroads). `soft`: reserved pieces in the way are collected, not refused.
function roadReason(ctx, pts, w, { skip = new Set(), startOn = null, cross = false, soft = null, extra = [], clear = 0.2 } = {}) {
  const bounds = lineBounds(pts, w + 1 + clear);
  for (const p of ctx.plotIndex.near(bounds)) if (lineRect(pts, p.plot) < w / 2 + clear) return "footprint_conflict";
  for (const p of ctx.doorIndex.near(bounds)) if (lineLine(pts, p.door) < w / 2 + 0.4) return "entrance_blocked";
  const tail = pts.slice(2);
  for (const r of [...ctx.roadIndex.near(bounds), ...extra]) {
    if (skip.has(r.id)) continue;
    const gap = lineLine(r.id === startOn ? pts.slice(3) : tail, r.pts);
    if (gap >= (r.w + w) / 2 + 1.2) continue;
    if (r.status === "reserved" && soft) {
      soft.add(r.id);
      continue;
    }
    if (cross && r.status === "usable" && r.type !== "kopru" && crossAngle(pts, r.pts) > 0.6) continue;
    return r.status === "reserved" ? "reserved_corridor" : "road_conflict";
  }
  for (const f of ctx.layout.foci) {
    if (skip.has(f.id)) continue;
    if (Math.min(...tail.map((p) => Math.hypot(p[0] - f.x, p[1] - f.y))) < f.r + w / 2 + 0.3) {
      if (f.status === "reserved" && soft) {
        soft.add(f.id);
        continue;
      }
      return "public_space_pressure";
    }
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
  const f = ctx.layout.foci.reduce((best, x) => (x.status === "reserved" ? best : Math.min(best, Math.hypot(x.x - cx, x.y - cy) - x.r)), Infinity);
  const focus = 1 - clamp01(f / FOCUS_SATURATE);
  const terms = { owner, infra, view, ground, focus };
  const total = Object.entries(WEIGHTS).reduce((t, [k, w]) => t + w * terms[k], 0);
  return { total: Math.round(total * 1e6) / 1e6, terms: Object.fromEntries(Object.entries(terms).map(([k, v]) => [k, Math.round(v * 1000) / 1000])) };
}
// Equal scores: fewer new streets, then a stable hash order.
const better = (a, b) => b.score.total - a.score.total || a.newRoad - b.newRoad || cmp(a.order, b.order);

// ---------- candidates on a street front (plan §5.1) ----------
const reach = (r, n) => Math.max(...[[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]].map(([x, y]) => x * n[0] + y * n[1]));
function frontCandidates(spec, road, req, extra = {}) {
  const out = [];
  const len = lengthOf(road.pts);
  for (const facing of spec.facings) {
    const local = shapeAt(spec, 0, 0, facing);
    for (const side of [1, -1]) {
      for (let s = 1.2; s <= len - 1.2; s += STREET_STEP) {
        const { p, dir } = along(road.pts, s);
        const n = [-dir[1] * side, dir[0] * side];
        // How far the plot reaches from its centre towards the street.
        const off = road.w / 2 + 0.2 + reach(local.plot, [-n[0], -n[1]]);
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
function judge(ctx, cand, req) {
  const spec = cand.spec;
  cand.shape = shapeAt(spec, cand.x, cand.y, cand.facing);
  const reason = groundReason(ctx, spec, cand.shape);
  if (reason) return reason;
  const road = cand.road;
  const near = linePoint(road.pts, cand.doorPoint.point);
  const toward = [cand.doorPoint.point[0] - near.point[0], cand.doorPoint.point[1] - near.point[1]];
  const d = Math.hypot(...toward) || 1;
  const edge = [q(near.point[0] + (toward[0] / d) * (road.w / 2 - 0.1)), q(near.point[1] + (toward[1] / d) * (road.w / 2 - 0.1))];
  cand.door = [cand.doorPoint.point.map(q), edge];
  if (lengthOf(cand.door) > 7) return "entrance_unconnected";
  const pr = pathReason(ctx, cand.door, { ownPlot: cand.shape.ground });
  if (pr) return pr;
  cand.score = scoreOf(ctx, cand, req);
  return null;
}
const tally = (rejected, reason) => (rejected[reason] = (rejected[reason] || 0) + 1);

function bestOf(ctx, cands, req, budget, rejected) {
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
    c.newRoad = c.newRoad || 0;
    const reason = judge(ctx, c, req);
    if (reason) {
      tally(rejected, reason);
      continue;
    }
    if (!best || better(c, best) < 0) best = c;
  }
  return { best, spent };
}
function byDistance(anchor) {
  return (a, b) => Math.hypot(a.x - anchor[0], a.y - anchor[1]) - Math.hypot(b.x - anchor[0], b.y - anchor[1]) || cmp(a.order, b.order);
}
const nearFirst = (anchor) => (a, b) => Math.hypot(a.x - anchor[0], a.y - anchor[1]) - Math.hypot(b.x - anchor[0], b.y - anchor[1]) || cmp(a.id, b.id);
/** Open streets near the anchor: the nearest squares' streets and anything within reach. */
function nearbyRoads(ctx, anchor) {
  const foci = ctx.layout.foci.filter((f) => f.status !== "reserved").sort(nearFirst(anchor)).slice(0, LIMITS.foci);
  const ids = new Set(foci.map((f) => f.id));
  return { foci, roads: ctx.layout.roads.filter((r) => r.status === "usable" && ["omurga", "sokak", "yaklasim"].includes(r.type) && (ids.has(r.focus) || linePoint(r.pts, anchor).d < 30)) };
}
function anchorOf(ctx, owner) {
  const mine = ctx.plots.filter((p) => p.owner && p.owner === owner);
  if (!mine.length) return [0, 0];
  return [mine.reduce((t, p) => t + p.x, 0) / mine.length, mine.reduce((t, p) => t + p.y, 0) / mine.length];
}

// ---------- growth: reserved corridors and squares (plan §5.4) ----------
// A plan reserves ids from the layout's counters, so two plans on the same
// revision collide on purpose (only one can be committed).
function ids(layout) {
  const seq = { ...layout.seq };
  return { seq, node: () => `n${seq.n++}`, road: () => `r${seq.r++}`, focus: () => `f${seq.f++}`, plot: () => `p${seq.p++}` };
}
/** Reserved streets from a square's edge (or a street end when r = 0), one per direction that has room. */
function reserveFrom(layout, from, dirs, len, type, depth, id, extraPlots) {
  const roads = [],
    nodes = [];
  const R = rng(hash(`${layout.seed}:reserve:${from.id}:${depth}`));
  const ctx = withAdded(layout, { plots: extraPlots });
  for (const a of dirs) {
    const d = [Math.cos(a), Math.sin(a)];
    const start = [q(from.x + d[0] * (from.r ? from.r + 0.3 : 0)), q(from.y + d[1] * (from.r ? from.r + 0.3 : 0))];
    const curve = (R() * 2 - 1) * 2;
    for (const f of [1, 0.65, 0.4]) {
      const end = [start[0] + d[0] * len * f, start[1] + d[1] * len * f];
      const pts = bend(start, end, curve * f, 8);
      // A reserved street keeps a house depth clear of the plots beside it, so it can be built on.
      const why = roadReason(ctx, pts, WIDTH[type], { skip: new Set([from.id, from.road].filter(Boolean)), extra: roads, clear: 2.2 });
      if (why) continue;
      const node = { id: id.node(), x: pts.at(-1)[0], y: pts.at(-1)[1] };
      nodes.push(node);
      roads.push({ id: id.road(), a: from.node, b: node.id, pts, w: WIDTH[type], type, status: "reserved", focus: from.square || from.id, depth });
      break;
    }
  }
  return { roads, nodes };
}
/** What opening `road` reserves next, beyond its end. */
function reserveAfter(layout, road, id) {
  const end = road.pts.at(-1),
    prev = road.pts.at(-3) || road.pts[0];
  const a = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  const d = [Math.cos(a), Math.sin(a)];
  const depth = (road.depth || 0) + 1;
  const side = (hash(`${layout.seed}:${road.id}:side`) & 1 ? 1 : -1) * 1.1;
  if (depth % 2 === 1) {
    // A small square at the end of the street, with three streets of its own.
    const c = [q(end[0] + d[0] * (SQUARE_R + 0.3)), q(end[1] + d[1] * (SQUARE_R + 0.3))];
    if (squareRoom(contextOf(layout), c, road)) {
      const seq = { ...id.seq };
      const fid = id.focus();
      const focus = { id: fid, x: c[0], y: c[1], r: SQUARE_R, kind: FOCUS_KINDS[hash(`${layout.seed}:${fid}`) % FOCUS_KINDS.length], node: road.b, parent: road.focus, status: "reserved" };
      const res = reserveFrom({ ...layout, foci: [...layout.foci, focus] }, { ...focus, road: road.id }, [a - 1.05, a, a + 1.05], SQUARE_STREET, "sokak", depth, id, []);
      if (res.roads.length) return { roads: res.roads, nodes: res.nodes, foci: [focus] };
      Object.assign(id.seq, seq);
    }
  }
  const node = layout.nodes.find((n) => n.id === road.b);
  const res = reserveFrom(layout, { x: node.x, y: node.y, r: 0, node: road.b, id: road.id, road: road.id, square: road.focus }, [a, a + side], RUN, "sokak", depth, id, []);
  return { roads: res.roads, nodes: res.nodes, foci: [] };
}
function squareRoom(ctx, c, road) {
  const r = SQUARE_R;
  const box = [c[0] - r - 2, c[1] - r - 2, c[0] + r + 2, c[1] + r + 2];
  if (ctx.plotIndex.near(box).some((p) => pointRect(c, p.plot) < r + 1)) return false;
  if (ctx.roadIndex.near(box).some((x) => x.id !== road.id && linePoint(x.pts, c).d < r + x.w / 2 + 0.5)) return false;
  if (ctx.layout.foci.some((f) => Math.hypot(f.x - c[0], f.y - c[1]) < f.r + r + 6)) return false;
  const t = ctx.terrain;
  if (linePoint(t.river.pts, c).d < r + t.river.w + 1 || inPolygon(c, t.lake.poly) || linePoint([...t.lake.poly, t.lake.poly[0]], c).d < r + 1) return false;
  if (t.rail && linePoint(t.rail.pts, c).d < r + t.rail.w + 1) return false;
  return true;
}
/** Reserved pieces that go with `start` (a reserved square takes its streets, a street what lies beyond it). */
function dropClosure(layout, start) {
  const out = new Set(start);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of layout.foci)
      if (f.status === "reserved" && !out.has(f.id) && layout.roads.some((r) => out.has(r.id) && r.b === f.node)) {
        out.add(f.id);
        grew = true;
      }
    const ends = new Set([...layout.roads.filter((r) => out.has(r.id)).map((r) => r.b), ...layout.foci.filter((f) => out.has(f.id)).map((f) => f.node)]);
    for (const r of layout.roads)
      if (r.status === "reserved" && !out.has(r.id) && ends.has(r.a)) {
        out.add(r.id);
        grew = true;
      }
  }
  // Never an open piece.
  for (const x of [...out]) if (layout.roads.some((r) => r.id === x && r.status !== "reserved") || layout.foci.some((f) => f.id === x && f.status !== "reserved")) out.delete(x);
  return out;
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
 * Returns { ok, plot, roads, nodes, foci, open, drop, how, score, tried, rejected } or { ok: false, error, tried, rejected }.
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
  if (spec.context !== "dry") return finish(layout, contextPlan(ctx, spec, req, anchor, id, rejected), rejected, req);
  if (spec.landmark) return finish(layout, landmarkPlan(ctx, spec, req, anchor, id, rejected), rejected, req);
  let tried = 0;
  // 1. Open street fronts near the owner.
  const { roads } = nearbyRoads(ctx, anchor);
  const cands = roads.flatMap((r) => frontCandidates(spec, r, req)).sort(byDistance(anchor));
  const first = bestOf(ctx, cands, req, LIMITS.candidates, rejected);
  tried += first.spent;
  if (first.best) return finish(layout, { how: "front", cand: first.best, id, tried }, rejected, req);
  // 2. Open the nearest reserved corridor; it reserves what comes after it.
  const reserved = layout.roads
    .filter((r) => r.status === "reserved")
    .map((r) => ({ r, d: linePoint(r.pts, anchor).d }))
    .sort((a, b) => a.d - b.d || cmp(a.r.id, b.r.id));
  let best = null,
    expansions = 0;
  for (const { r } of reserved) {
    if (expansions >= LIMITS.expansions || tried >= LIMITS.total) break;
    expansions++;
    const sub = ids(layout);
    Object.assign(sub.seq, id.seq);
    const opened = { ...r, status: "usable" };
    const base = { ...layout, roads: layout.roads.map((x) => (x.id === r.id ? opened : x)) };
    const next = reserveAfter(base, opened, sub);
    const local = withAdded(base, next, req.exclude);
    const cands2 = frontCandidates(spec, opened, req, { newRoad: lengthOf(r.pts) * 0.5, how: "open", opened, next, seq: sub.seq }).sort(byDistance(anchor));
    const found = bestOf(local, cands2, req, Math.min(32, LIMITS.total - tried), rejected);
    tried += found.spent;
    if (found.best && (!best || better(found.best, best) < 0)) best = found.best;
  }
  if (best) {
    // The reservations were made before the house; it was judged against them, so they stay clear.
    Object.assign(id.seq, best.seq);
    const square = layout.foci.find((f) => f.status === "reserved" && f.node === best.opened.a);
    return finish(layout, { how: "open", cand: best, roads: best.next.roads, nodes: best.next.nodes, foci: best.next.foci, open: [best.opened.id, ...(square ? [square.id] : [])], id, tried }, rejected, req);
  }
  // 3. Nothing reserved fits: a short street of its own from a nearby open square.
  const fallback = fallbackStreet(ctx, spec, req, anchor, id, rejected, tried);
  if (fallback) return finish(layout, fallback, rejected, req);
  return { ok: false, error: "no_plot", tried, rejected };
}
function fallbackStreet(ctx, spec, req, anchor, id, rejected, tried) {
  const L = ctx.layout;
  const foci = L.foci.filter((f) => f.status !== "reserved" && !f.landmark).sort(nearFirst(anchor)).slice(0, LIMITS.foci);
  let best = null;
  for (const f of foci) {
    const base = (hash(`${L.seed}:stub:${f.id}`) % 360) * (Math.PI / 180);
    for (let i = 0; i < 12 && tried < LIMITS.total; i++) {
      const a = base + (i * Math.PI) / 6;
      const sub = ids(L);
      Object.assign(sub.seq, id.seq);
      const res = reserveFrom(L, { x: f.x, y: f.y, r: f.r, node: f.node, id: f.id }, [a], 12, "sokak", 9, sub, []);
      if (!res.roads.length) {
        tally(rejected, "street_no_room");
        continue;
      }
      const road = { ...res.roads[0], status: "usable" };
      const local = withAdded(L, { roads: [road] }, req.exclude);
      const found = bestOf(local, frontCandidates(spec, road, req, { newRoad: lengthOf(road.pts), how: "street", nodes: res.nodes, seq: sub.seq }).sort(byDistance(anchor)), req, 24, rejected);
      tried += found.spent;
      if (found.best && (!best || better(found.best, best) < 0)) best = found.best;
    }
    if (best) break;
  }
  if (!best) return null;
  Object.assign(id.seq, best.seq);
  return { how: "street", cand: best, roads: [best.road], nodes: best.nodes, foci: [], id, tried };
}

function finish(layout, found, rejected, req) {
  if (!found || !found.cand) return { ok: false, error: found?.error || "no_plot", tried: found?.tried || 0, rejected };
  const { cand, id } = found;
  const plot = plotRecord(cand, req, id.plot());
  const foci = found.foci || [];
  for (const f of foci) if (f.landmark) f.of = plot.id;
  const opened = new Set(found.open || []);
  const drop = found.soft?.size ? [...dropClosure(layout, [...found.soft].filter((x) => !opened.has(x)))].filter((x) => !opened.has(x)) : [];
  return {
    ok: true,
    how: found.how,
    plot,
    roads: found.roads || [],
    nodes: found.nodes || [],
    foci,
    open: found.open || [],
    drop,
    seq: id.seq,
    score: cand.score,
    tried: found.tried,
    rejected,
    extra: found.extra || null,
  };
}

// ---------- landmarks ----------
function landmarkPlan(ctx, spec, req, anchor, id, rejected) {
  const L = ctx.layout;
  const foci = L.foci.filter((f) => f.status !== "reserved" && !f.landmark).sort(nearFirst(anchor)).slice(0, 4);
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
        const soft = new Set();
        const why = groundReason(ctx, spec, cand.shape, { soft });
        if (why) {
          tally(rejected, why);
          continue;
        }
        const door = doorsAt(spec, c[0], c[1], facing)[0];
        // The approach: from the parent square's edge to just past the plot's front edge.
        const p = cand.shape.plot;
        const edge = door.dir[0] > 0 ? p[2] - door.point[0] : door.dir[0] < 0 ? door.point[0] - p[0] : door.dir[1] > 0 ? p[3] - door.point[1] : door.point[1] - p[1];
        const out = edge + WIDTH.yaklasim / 2 + 0.5;
        const front = [q(door.point[0] + door.dir[0] * out), q(door.point[1] + door.dir[1] * out)];
        const toward = [front[0] - parent.x, front[1] - parent.y],
          len = Math.hypot(...toward);
        const start = [q(parent.x + (toward[0] / len) * (parent.r + 0.3)), q(parent.y + (toward[1] / len) * (parent.r + 0.3))];
        const pts = bend(start, front, 0, 8);
        const rr = roadReason(ctx, pts, WIDTH.yaklasim, { skip: new Set([parent.id]), cross: true, soft });
        if (rr || lineRect(pts, cand.shape.plot) < WIDTH.yaklasim / 2 + 0.15) {
          tally(rejected, `approach_${rr || "own_plot"}`);
          continue;
        }
        cand.door = [door.point.map(q), front];
        cand.newRoad = lengthOf(pts) + soft.size * 4;
        cand.pts = pts;
        cand.parent = parent;
        cand.soft = soft;
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
  const focus = { id: id.focus(), x: fc[0], y: fc[1], r: Math.max(1.5, spec.front * 0.5), kind: "eser", node: node.id, parent: best.parent.id, landmark: true, status: "open" };
  return { how: "landmark", cand: best, roads: [road], nodes: [node], foci: [focus], id, tried, soft: best.soft };
}

// ---------- models that need water or rails ----------
/** Ways from `point` to the open street network: a door path when a street is
 * within reach, else a new street from one of the nearest points on it. */
function connectors(ctx, point, id, soft, gap = 1.6) {
  const L = ctx.layout;
  const targets = [];
  for (const r of L.roads) {
    // A reserved street already in the plot's way is no way in.
    if (r.type === "kopru" || (r.status !== "usable" && r.status !== "reserved") || soft.has(r.id)) continue;
    const len = lengthOf(r.pts);
    for (let s = 0; s <= len; s += 2) {
      const { p } = along(r.pts, s);
      targets.push({ r, p, d: Math.hypot(p[0] - point[0], p[1] - point[1]), k: `${r.id}:${s}` });
    }
    const n = linePoint(r.pts, point);
    targets.push({ r, p: n.point, d: n.d, direct: true, k: `${r.id}:n` });
  }
  for (const f of L.foci) {
    if (f.status === "reserved" || f.landmark) continue;
    const d0 = Math.hypot(point[0] - f.x, point[1] - f.y) || 1;
    const p = [f.x + ((point[0] - f.x) / d0) * (f.r + 0.3), f.y + ((point[1] - f.y) / d0) * (f.r + 0.3)];
    targets.push({ f, p, d: d0 - f.r, k: f.id });
  }
  targets.sort((a, b) => a.d - b.d || cmp(a.k, b.k));
  // A reserved street used as the way in opens with it (and the reserved square it leaves from).
  const opening = (r) => (r.status !== "reserved" ? [] : [r.id, ...L.foci.filter((f) => f.status === "reserved" && f.node === r.a).map((f) => f.id)]);
  const out = [];
  for (const t of targets.slice(0, 40)) {
    if (t.d > 70) break;
    if (t.d <= 4.5) {
      if (!t.r || !t.direct) continue;
      const toward = [point[0] - t.p[0], point[1] - t.p[1]],
        d = Math.hypot(...toward) || 1;
      out.push({ door: [point.map(q), [q(t.p[0] + (toward[0] / d) * (t.r.w / 2 - 0.1)), q(t.p[1] + (toward[1] / d) * (t.r.w / 2 - 0.1))]], roads: [], nodes: [], length: t.r.status === "reserved" ? lengthOf(t.r.pts) * 0.5 : 0, road: t.r, soft: new Set(soft), open: opening(t.r) });
      continue;
    }
    const from = t.p.map(q);
    const dir = [point[0] - from[0], point[1] - from[1]],
      d = Math.hypot(...dir) || 1;
    const end = [q(point[0] - (dir[0] / d) * gap), q(point[1] - (dir[1] / d) * gap)];
    const pts = bend(from, end, 0, Math.max(4, Math.ceil(d / 4)));
    const mine = new Set(soft);
    const why = roadReason(ctx, pts, WIDTH.sokak, { skip: new Set([t.r?.id, t.f?.id].filter(Boolean)), startOn: t.r?.id, cross: true, soft: mine });
    if (!why && t.r && mine.has(t.r.id)) mine.delete(t.r.id);
    if (why) {
      out.push({ error: why });
      continue;
    }
    const sub = ids(L);
    Object.assign(sub.seq, id.seq);
    const junction = t.r ? { id: sub.node(), x: from[0], y: from[1], on: t.r.id } : null;
    const endNode = { id: sub.node(), x: end[0], y: end[1] };
    const road = { id: sub.road(), a: t.f ? t.f.node : junction.id, b: endNode.id, pts, w: WIDTH.sokak, type: "sokak", status: "usable", focus: t.r ? t.r.focus : t.f.id };
    out.push({ door: [point.map(q), end], roads: [road], nodes: junction ? [junction, endNode] : [endNode], length: lengthOf(pts) + (t.r?.status === "reserved" ? lengthOf(t.r.pts) * 0.5 : 0), road, seq: sub.seq, soft: mine, open: t.r ? opening(t.r) : [] });
  }
  return out;
}

function contextPlan(ctx, spec, req, anchor, id, rejected) {
  const t = ctx.terrain;
  const kind = spec.context;
  const fit = spec.fit;
  const tries = [];
  const push = (x, y, facing, extra = {}) => tries.push({ spec, x: q(x), y: q(y), facing, ...extra });
  const nearest = (line, step, keep = 40) => {
    const out = [];
    const len = lengthOf(line);
    for (let s = 0; s <= len; s += step) out.push(along(line, s));
    return out.sort((a, b) => Math.hypot(a.p[0] - anchor[0], a.p[1] - anchor[1]) - Math.hypot(b.p[0] - anchor[0], b.p[1] - anchor[1])).slice(0, keep);
  };
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
  if (kind === "bank") {
    // The wheel stands in the stream at its near edge, the body on the bank.
    const w = t.river.w;
    for (const { p, dir } of nearest(t.river.pts, 1.5, 60))
      for (const side of [1, -1])
        for (const facing of spec.facings) {
          const n = [-dir[1] * side, dir[0] * side];
          if (Math.abs(dot(turn([1, 0], facing), dir)) < 0.9) continue; // the mill's long side along the stream
          if (dot(turn([0, -1], facing), n) < 0.8) continue; // the body away from the water
          const wheel = turn(fit.wet[0], facing);
          // The wheel just inside the near edge; then the stone base is slid to the water's edge.
          const at = [p[0] + n[0] * (w / 2 - 0.35), p[1] + n[1] * (w / 2 - 0.35)];
          let x = at[0] - wheel[0],
            y = at[1] - wheel[1];
          const dry = lineRect(t.river.pts, worldRect(fit.dry, x, y, facing));
          const slide = w / 2 - 0.2 - dry;
          push(x + n[0] * slide, y + n[1] * slide, facing);
        }
  } else if (kind === "rail") {
    // The platform's own rails lie on the railway; the building on the village side.
    if (!t.rail) return { error: "no_context", tried: 0 };
    for (const { p, dir } of nearest(t.rail.pts, 1, 80))
      for (const side of [1, -1])
        for (const facing of spec.facings) {
          const n = [-dir[1] * side, dir[0] * side];
          if (Math.abs(dot(turn([1, 0], facing), dir)) < 0.995) continue;
          if (dot(turn([0, -1], facing), n) < 0.9) continue;
          const track = turn([0, fit.track.y], facing);
          push(p[0] - track[0], p[1] - track[1], facing);
        }
  } else if (kind === "lake" || kind === "shore") {
    const poly = t.lake.poly;
    for (let i = 0; i < poly.length; i++)
      for (const u of [0.25, 0.5, 0.75]) {
        const a = poly[i],
          b = poly[(i + 1) % poly.length];
        const m = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
        const out = [m[0] - t.lake.cx, m[1] - t.lake.cy],
          d = Math.hypot(...out) || 1;
        const n = [out[0] / d, out[1] / d];
        for (const facing of spec.facings) {
          const door = spec.entrances[0];
          if (dot(turn(door.dir, facing), n) < 0.6) continue; // the door (the jetty) looks to the shore
          if (kind === "lake") {
            // The jetty's end 1.4 short of the shore line.
            const dp = turn([door.x, door.y], facing);
            push(m[0] - n[0] * 1.4 - dp[0], m[1] - n[1] * 1.4 - dp[1], facing, { n });
          } else {
            const sh = shapeAt(spec, 0, 0, facing).ground;
            const off = reach(sh, [-n[0], -n[1]]) + 0.5;
            push(m[0] + n[0] * off, m[1] + n[1] * off, facing, { n });
          }
        }
      }
    tries.sort((a, b) => Math.hypot(a.x - anchor[0], a.y - anchor[1]) - Math.hypot(b.x - anchor[0], b.y - anchor[1]) || a.facing - b.facing);
  } else if (kind === "bridge") {
    for (const { p, dir } of nearest(t.river.pts, 2, 60))
      for (const facing of spec.facings) {
        if (Math.abs(dot(turn([1, 0], facing), dir)) > 0.5) continue; // the deck across the stream
        push(p[0], p[1], facing, { dir });
      }
  }
  let best = null,
    tried = 0,
    sound = 0;
  for (const c of tries) {
    if (tried >= LIMITS.total || sound >= 6) break;
    c.shape = shapeAt(spec, c.x, c.y, c.facing);
    const soft = new Set();
    const why = groundReason(ctx, spec, c.shape, { allowWater: kind !== "rail", allowRail: kind === "rail", soft });
    tried++;
    if (why) {
      tally(rejected, why);
      continue;
    }
    if (kind === "bridge" && ctx.layout.roads.some((r) => r.type === "kopru" && linePoint(r.pts, [c.x, c.y]).d < 18)) {
      tally(rejected, "bridge_too_close");
      continue;
    }
    if (!contextFits(t, spec, c)) {
      tally(rejected, "wrong_water_context");
      continue;
    }
    const doors = doorsAt(spec, c.x, c.y, c.facing);
    let plan = null;
    if (kind === "bridge") plan = bridgeLinks(ctx, c, doors, anchor, id, soft, rejected);
    else plan = doorLinks(ctx, kind, c, doors[0], id, soft, rejected);
    if (!plan) continue;
    sound++;
    c.door = plan.door;
    c.newRoad = plan.length + plan.soft.size * 4;
    c.road = plan.road;
    c.score = scoreOf(ctx, c, req);
    c.order = `${kind}:${c.x}:${c.y}:${c.facing}`;
    c.plan = plan;
    if (!best || better(c, best) < 0) best = c;
  }
  if (!best) return { error: "no_context_plot", tried };
  if (best.plan.seq) Object.assign(id.seq, best.plan.seq);
  return { how: `context:${kind}`, cand: best, roads: best.plan.roads, nodes: best.plan.nodes, foci: [], open: best.plan.open, id, tried, extra: best.plan.extra, soft: best.plan.soft };
}
function doorLinks(ctx, kind, c, door0, id, soft, rejected) {
  const t = ctx.terrain;
  // The way out starts past the plot's edge, so a new street never cuts the plot.
  const out = toEdge(c.shape.plot, door0.point, door0.dir) + WIDTH.sokak / 2 + 0.3;
  let start = [q(door0.point[0] + door0.dir[0] * out), q(door0.point[1] + door0.dir[1] * out)],
    jetty = null;
  if (kind === "lake") {
    jetty = [door0.point.map(q), shorePoint(t, door0.point)];
    if (pathReason(ctx, jetty, { water: false })) {
      tally(rejected, "entrance_unconnected");
      return null;
    }
    start = jetty[1];
  }
  // A mill's door opens along the bank: its way turns inland at once.
  if (kind === "bank") {
    const away = turn([0, -1], c.facing);
    start = [q(start[0] + away[0] * 2.5), q(start[1] + away[1] * 2.5)];
  }
  for (const link of connectors(ctx, start, id, soft, jetty ? 1.6 : 0)) {
    if (link.error) {
      tally(rejected, `connect_${link.error}`);
      continue;
    }
    const door = jetty ? [...jetty, ...link.door.slice(1)] : [door0.point.map(q), ...link.door].filter((p, i, a) => !i || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 0.05);
    if (!jetty && pathReason(ctx, door, { ownPlot: ownBody(c.spec, c) })) {
      tally(rejected, "entrance_unconnected");
      continue;
    }
    if (lengthOf(link.door) > 6) {
      tally(rejected, "entrance_unconnected");
      continue;
    }
    // The new street must stay off this very plot too.
    if (link.roads.some((r) => lineRect(r.pts, c.shape.plot) < r.w / 2 + 0.1)) {
      tally(rejected, "road_conflict");
      continue;
    }
    return { roads: link.roads, nodes: link.nodes, door, length: link.length, road: link.road, seq: link.seq, soft: link.soft, open: link.open, extra: jetty ? { jetty } : null };
  }
  return null;
}
/** Distance from a point inside a rectangle to its edge along an axis direction. */
function toEdge(r, p, dir) {
  return dir[0] > 0 ? r[2] - p[0] : dir[0] < 0 ? p[0] - r[0] : dir[1] > 0 ? r[3] - p[1] : p[1] - r[1];
}
/** What a door path may not cross: the walls (the dry body when the drawing has a yard or a channel). */
function ownBody(spec, c) {
  return spec.fit.dry ? worldRect(spec.fit.dry, c.x, c.y, c.facing) : c.shape?.ground || c.ground;
}
/** The context itself, checked on the real shape (plan §4.4). */
function contextFits(t, spec, c) {
  const kind = spec.context;
  const g = c.shape.ground;
  const river = lineRect(t.river.pts, g),
    lake = rectPolygon(g, t.lake.poly);
  const world = (r) => {
    const l = c.facing ? [r[1], r[0], r[3], r[2]] : r;
    return [c.x + l[0], c.y + l[1], c.x + l[2], c.y + l[3]];
  };
  if (kind === "bank") {
    const wheel = turn(spec.fit.wet[0], c.facing);
    const wet = linePoint(t.river.pts, [c.x + wheel[0], c.y + wheel[1]]).d < t.river.w / 2 - 0.1;
    return wet && lineRect(t.river.pts, world(spec.fit.dry)) > t.river.w / 2 - 0.3 && lake > 1.5;
  }
  if (kind === "lake") return rectWithin(g, t.lake.poly, 0.3) && river > t.river.w / 2 + 0.5;
  if (kind === "shore") return lake > 0.2 && lake < 1.2 && river > t.river.w / 2 + 1;
  if (kind === "rail") {
    const tr = spec.fit.track;
    const ends = [turn([tr.x0, tr.y], c.facing), turn([tr.x1, tr.y], c.facing)].map((e) => linePoint(t.rail.pts, [c.x + e[0], c.y + e[1]]).d);
    // The platform edge may meet the ballast, never the track itself.
    return ends.every((d) => d < 0.35) && lineRect(t.rail.pts, world(spec.fit.dry)) > 0.4 && river > t.river.w / 2 + 1 && lake > 1;
  }
  if (kind === "bridge") {
    const ends = doorsAt(spec, c.x, c.y, c.facing);
    return ends.every((e) => linePoint(t.river.pts, e.point).d > t.river.w / 2 + 0.6 && !inPolygon(e.point, t.lake.poly)) && lake > 2;
  }
  return false;
}
function shorePoint(t, p) {
  const poly = t.lake.poly;
  let best = null;
  for (let i = 0; i < poly.length; i++) {
    const n = linePoint([poly[i], poly[(i + 1) % poly.length]], p);
    if (!best || n.d < best.d) best = n;
  }
  const out = [best.point[0] - t.lake.cx, best.point[1] - t.lake.cy],
    len = Math.hypot(...out) || 1;
  return [q(best.point[0] + (out[0] / len) * 0.9), q(best.point[1] + (out[1] / len) * 0.9)];
}
// The deck is a street itself; the near landing joins the village, the far one leads on.
function bridgeLinks(ctx, c, doors, anchor, id, soft, rejected) {
  const [e0, e1] = [...doors].sort((a, b) => Math.hypot(a.point[0] - anchor[0], a.point[1] - anchor[1]) - Math.hypot(b.point[0] - anchor[0], b.point[1] - anchor[1]));
  // The landing runs straight out from the deck end, then the connector joins it.
  const ramp0 = [q(e0.point[0] + e0.dir[0] * 2.5), q(e0.point[1] + e0.dir[1] * 2.5)];
  for (const link of connectors(ctx, ramp0, id, soft, 0)) {
    if (link.error) {
      tally(rejected, `connect_${link.error}`);
      continue;
    }
    if (link.roads.some((r) => lineRect(r.pts, c.shape.plot) < r.w / 2 + 0.15)) {
      tally(rejected, "road_conflict");
      continue;
    }
    const sub = ids(ctx.layout);
    Object.assign(sub.seq, link.seq || id.seq);
    const deckA = { id: sub.node(), x: q(e0.point[0]), y: q(e0.point[1]) },
      deckB = { id: sub.node(), x: q(e1.point[0]), y: q(e1.point[1]) };
    const deck = { id: sub.road(), a: deckA.id, b: deckB.id, pts: [[deckA.x, deckA.y], [deckB.x, deckB.y]], w: WIDTH.kopru, type: "kopru", status: "usable", focus: link.road?.focus || "f0" };
    const joinAt = link.roads.length ? link.roads[0] : null;
    const rampPts = [[deckA.x, deckA.y], ramp0, link.door[1]].filter((p, i, a) => !i || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 0.05);
    const rampA = joinAt ? joinAt.b : sub.node();
    const nodes = [...link.nodes];
    if (!joinAt) nodes.push({ id: rampA, x: q(link.door[1][0]), y: q(link.door[1][1]), on: link.road.id });
    const ramp = { id: sub.road(), a: rampA, b: deckA.id, pts: rampPts, w: WIDTH.sokak, type: "sokak", status: "usable", focus: deck.focus };
    const onward = [q(e1.point[0] + e1.dir[0] * 8), q(e1.point[1] + e1.dir[1] * 8)];
    const farPts = bend([deckB.x, deckB.y], onward, 0, 4);
    const farSoft = new Set(link.soft);
    const farWhy = roadReason(ctx, farPts, WIDTH.sokak, { soft: farSoft });
    const farNode = { id: sub.node(), x: onward[0], y: onward[1] };
    const far = farWhy ? null : { id: sub.road(), a: deckB.id, b: farNode.id, pts: farPts, w: WIDTH.sokak, type: "sokak", status: "usable", focus: deck.focus };
    return {
      roads: [...link.roads, ramp, deck, ...(far ? [far] : [])],
      nodes: [...nodes, deckA, deckB, ...(far ? [farNode] : [])],
      door: null,
      length: link.length + lengthOf(rampPts) + (far ? 8 : 0),
      road: deck,
      seq: sub.seq,
      soft: far ? farSoft : link.soft,
      open: link.open,
      extra: null,
    };
  }
  return null;
}

// ---------- writing a plan ----------
/** A copy of the layout with the plan applied: new pieces added, reserved pieces opened or dropped; nothing placed moves. */
export function applyPlan(layout, plan) {
  if (!plan.ok) throw new Error(`cannot apply ${plan.error}`);
  const plot = { ...plan.plot, ...(plan.extra?.jetty ? { jetty: plan.extra.jetty } : {}) };
  const seq = { ...layout.seq };
  for (const k of ["n", "r", "f", "p"]) seq[k] = Math.max(seq[k], plan.seq[k]);
  const open = new Set(plan.open || []),
    drop = new Set(plan.drop || []);
  const roads = [...layout.roads.filter((r) => !drop.has(r.id)).map((r) => (open.has(r.id) ? { ...r, status: "usable" } : r)), ...plan.roads];
  const foci = [...layout.foci.filter((f) => !drop.has(f.id)).map((f) => (open.has(f.id) ? { ...f, status: "open" } : f)), ...plan.foci];
  let nodes = [...layout.nodes, ...plan.nodes];
  if (drop.size) {
    const used = new Set(["n0", ...roads.flatMap((r) => [r.a, r.b]), ...foci.map((f) => f.node)]);
    nodes = nodes.filter((n) => used.has(n.id) || roads.some((r) => n.on === r.id));
  }
  return { ...layout, nodes, roads, foci, plots: [...layout.plots, plot], seq };
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
  const reach = reachableRoads(layout);
  const open = layout.roads.filter((r) => r.status === "usable");
  for (const p of layout.plots) {
    const spec = modelSpec(p.model, p.gv);
    const shape = { ground: p.ground, over: p.over, plot: p.plot };
    const others = contextOf({ ...layout, plots: layout.plots.filter((o) => o !== p) });
    const deck = open.find((r) => r.type === "kopru" && lineRect(r.pts, p.ground) === 0);
    const own = new Set(deck ? open.filter((r) => r === deck || [r.a, r.b].some((n) => n === deck.a || n === deck.b)).map((r) => r.id) : []);
    const why = groundReason(others, spec, shape, { allowWater: spec.context !== "dry" && spec.context !== "rail", allowRail: spec.context === "rail", own, self: p.id });
    if (why) problems.push([p.id, why]);
    if (p.door) {
      const end = p.door.at(-1);
      const road = open.find((r) => linePoint(r.pts, end).d <= r.w / 2 + 0.05);
      if (!road) problems.push([p.id, "entrance_unconnected"]);
      else if (!reach.has(road.id)) problems.push([p.id, "network_unreachable"]);
      const pr = p.jetty ? pathReason(others, p.door, { water: false }) : pathReason(others, p.door, { ownPlot: ownBody(spec, p) });
      if (pr) problems.push([p.id, pr]);
    } else if (spec.context === "bridge") {
      if (!deck || !reach.has(deck.id)) problems.push([p.id, "network_unreachable"]);
    } else problems.push([p.id, "entrance_unconnected"]);
    if (spec.context !== "dry" && !contextFits(layout.terrain, spec, { ...p, shape })) problems.push([p.id, "wrong_water_context"]);
  }
  for (const r of layout.roads) if (!reach.has(r.id)) problems.push([r.id, "network_unreachable"]);
  return problems;
}
export { inside };

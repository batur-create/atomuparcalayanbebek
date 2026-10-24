// n49-2: a living village's railway re-laid in bends, every house where it
// stands. Villages made before n49 (terrain version 2) keep the nearly
// straight line they were planned around; terrain version 4 is the same
// ground (river, pond, meadows: the same numbers) with a railway laid for that
// village and stored with its layout. Planned in the owner's browser, checked
// by the server (server/villageSwitch.js): the ground but the railway must be
// the team's own, the line a sound railway (railProblem), and the layout must
// keep every rule with it, nothing that stood moved.
//
// The line follows the old one and swings off it in short runs joined by easy
// S-bends, the way windingRail (terrain.js) lays a new village's line: each
// run at its own distance off the old line, tried in turn and kept only where
// it clears every plot, door path, square, street, the water and the meadows
// with the planner's own margins. Where nothing else fits (among the houses
// that grew up beside the line) it stays on the old line, which is known to
// fit. A station's platform pins the line where it stands.
import { along, createIndex, hash, inPolygon, lengthOf, lineBounds, lineLineNear, linePoint, pointSeg, q, rng, segRect, segsCross } from "./geom.js";
import { modelSpec } from "./models.js";
import { railCrossing, validateLayout } from "./planner.js";
import { RAIL_WIDTH, railProblem, watercourses } from "./terrain.js";

export const RERAIL_TERRAIN = 4;
const RUN = 30,
  BEND = 40,
  STEP = 2.5; // between the new line's points
// The planner's own margins (planner.js groundReason / roadReason), a little wider.
const PLOT_KEEP = RAIL_WIDTH / 2 + 0.85,
  DOOR_KEEP = RAIL_WIDTH / 2 + 0.3,
  ROAD_KEEP = RAIL_WIDTH / 2 + 0.85;

/** Whether a layout's railway can be re-laid this way (a new village on the old straight line). */
export const canRerail = (layout) => !!layout?.terrain?.rail && layout.generator >= 3 && layout.terrainVersion === 2;

/**
 * The layout with its railway re-laid: { layout } (terrain version 4, level
 * crossings where streets now meet the line), or { error } when no bend fits
 * anywhere (the village keeps its line).
 */
export function rerailLayout(layout) {
  if (!canRerail(layout)) return { error: "no_old_line" };
  const old = layout.terrain.rail.pts;
  const total = lengthOf(old);
  const ctx = contextOf(layout, old);
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = [1, 1, 0.8, 0.8, 0.6, 0.45][attempt];
    const levels = levelsFor(layout, ctx, total, attempt, scale);
    if (!levels) continue;
    if (levels.every((l) => l === 0)) return { error: "no_room" };
    const pts = lineOf(old, total, levels);
    const terrain = { ...layout.terrain, version: RERAIL_TERRAIN, rail: { pts, w: layout.terrain.rail.w } };
    if (railProblem(terrain)) continue;
    const roads = [];
    let crossingsSound = true;
    for (const r of layout.roads) {
      const { railCrossing: _was, ...rest } = r;
      if (r.status === "dropped" || r.type === "kopru" || r.type === "iskele") {
        roads.push(rest);
        continue;
      }
      const meets = segsMeet(r.pts, pts);
      const rc = meets ? railCrossing(terrain, r.pts) : null;
      if (meets && !rc) crossingsSound = false;
      roads.push(rc ? { ...rest, railCrossing: rc } : rest);
    }
    if (!crossingsSound) continue;
    const next = { ...layout, terrainVersion: RERAIL_TERRAIN, terrain, roads };
    if (validateLayout(next).length) continue;
    return { layout: next, bends: levels.filter((l) => l !== 0).length };
  }
  return { error: "no_room" };
}

function segsMeet(a, b) {
  const [ax0, ay0, ax1, ay1] = lineBounds(a);
  for (let i = 1; i < b.length; i++) {
    const p = b[i - 1],
      r = b[i];
    if (Math.max(p[0], r[0]) < ax0 || Math.min(p[0], r[0]) > ax1 || Math.max(p[1], r[1]) < ay0 || Math.min(p[1], r[1]) > ay1) continue;
    for (let j = 1; j < a.length; j++) if (segsCross(p, r, a[j - 1], a[j])) return true;
  }
  return false;
}

// What the new line must keep clear of, indexed.
function contextOf(layout, old) {
  const t = layout.terrain;
  const plots = createIndex(16),
    doors = createIndex(16),
    roads = createIndex(16),
    foci = createIndex(16);
  for (const p of layout.plots) {
    // The plot's whole rectangle, its yard too (the planner's rail rule, groundReason).
    const r = p.plot || p.ground;
    if (r) plots.add(r, { ...p, keep: r });
    if (p.door?.length >= 2) doors.add(lineBounds(p.door, 1), p);
  }
  for (const r of layout.roads) if (r.status !== "dropped") roads.add(lineBounds(r.pts, r.w), r);
  for (const f of layout.foci) foci.add([f.x - f.r, f.y - f.r, f.x + f.r, f.y + f.r], f);
  // A station's platform holds the line where it is (8 units either side of
  // it), and so does the bridge over the river (14 either side), far out
  // where it was laid.
  const pinned = layout.plots
    .filter((p) => modelSpec(p.model)?.context === "rail")
    .map((p) => {
      const at = linePoint(old, [p.x, p.y]).at;
      return [at - 8, at + 8];
    });
  let run = 0;
  for (let i = 1; i < old.length; i++) {
    const len = Math.hypot(old[i][0] - old[i - 1][0], old[i][1] - old[i - 1][1]);
    for (let j = 1; j < t.river.pts.length; j++)
      if (segsCross(old[i - 1], old[i], t.river.pts[j - 1], t.river.pts[j])) pinned.push([run - 14, run + len + 14]);
    run += len;
  }
  return { t, plots, doors, roads, foci, pinned };
}

// The old line's point and its unit normal at distance s (the normal over a
// 12-unit chord, so the gentle bend of the old line never kinks the new one).
function frameAt(old, total, s) {
  const p = along(old, Math.max(0, Math.min(total, s))).p;
  const a = along(old, Math.max(0, s - 6)).p,
    b = along(old, Math.min(total, s + 6)).p;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { p, n: [-(b[1] - a[1]) / len, (b[0] - a[0]) / len] };
}
// How far off the old line at distance s: run k (RUN long) at levels[k], then
// an eased S-bend (BEND long) to levels[k + 1].
function offsetAt(levels, s) {
  const period = RUN + BEND;
  const k = Math.min(levels.length - 1, Math.floor(s / period)),
    u = s - k * period;
  if (u <= RUN || k + 1 >= levels.length) return levels[k];
  const e = (1 - Math.cos((Math.PI * (u - RUN)) / BEND)) / 2;
  return levels[k] + (levels[k + 1] - levels[k]) * e;
}
function lineOf(old, total, levels) {
  const pts = [];
  const steps = Math.ceil(total / STEP);
  for (let i = 0; i <= steps; i++) {
    const s = (total * i) / steps;
    const { p, n } = frameAt(old, total, s),
      o = offsetAt(levels, s);
    pts.push([q(p[0] + n[0] * o), q(p[1] + n[1] * o)]);
  }
  return pts;
}

// One level per run, front to back, each tried in turn and kept when the run
// and the bend into it are clear; a dead end goes back a run. A run at level
// 0 lies on the old line and needs no check.
function levelsFor(layout, ctx, total, attempt, scale) {
  const R = rng(hash(`rerail:${layout.seed}:${attempt}`));
  const runs = Math.ceil(total / (RUN + BEND)) + 1;
  const flip = R() < 0.5 ? 1 : -1;
  const options = Array.from({ length: runs }, (_, k) => {
    const big = (7 + R() * 3) * scale,
      small = (4 + R()) * scale,
      sign = (k % 2 ? 1 : -1) * flip;
    return [sign * big, -sign * big, sign * small, -sign * small, sign * 2.5, -sign * 2.5, 0];
  });
  const levels = new Array(runs).fill(0);
  let budget = 3000;
  const place = (k) => {
    if (k >= runs) return true;
    for (const level of options[k]) {
      if (--budget < 0) return false;
      levels[k] = level;
      if (stretchClear(layout, ctx, total, levels, k) && place(k + 1)) return true;
    }
    levels[k] = 0;
    return false;
  };
  return place(0) ? levels : null;
}
// The bend from run k-1 into run k, and run k itself.
function stretchClear(layout, ctx, total, levels, k) {
  const period = RUN + BEND;
  const from = Math.max(0, k * period - BEND),
    to = Math.min(total, k * period + RUN);
  if (from >= total) return true;
  const pts = [];
  for (let s = from; s <= to + 1e-6; s += STEP / 2) {
    const o = offsetAt(levels, s);
    const { p, n } = frameAt(layout.terrain.rail.pts, total, s);
    pts.push({ s, o, p: [p[0] + n[0] * o, p[1] + n[1] * o] });
  }
  for (const [a, b] of ctx.pinned) if (pts.some((x) => x.s >= a && x.s <= b && Math.abs(x.o) > 1e-6)) return false;
  // Pieces off the old line only.
  const off = [];
  for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i - 1].o) > 1e-6 || Math.abs(pts[i].o) > 1e-6) off.push([pts[i - 1].p, pts[i].p]);
  if (!off.length) return true;
  const t = ctx.t;
  const crossed = new Set();
  for (const [a, b] of off) {
    const box = [Math.min(a[0], b[0]) - 3, Math.min(a[1], b[1]) - 3, Math.max(a[0], b[0]) + 3, Math.max(a[1], b[1]) + 3];
    if (ctx.plots.near(box).some((p) => segRect(a, b, p.keep) < PLOT_KEEP)) return false;
    for (const p of ctx.doors.near(box)) for (let i = 1; i < p.door.length; i++) if (segSeg(a, b, p.door[i - 1], p.door[i]) < DOOR_KEEP) return false;
    if (ctx.foci.near(box).some((f) => pointSeg([f.x, f.y], a, b) < f.r + RAIL_WIDTH + 1)) return false;
    // A street may be crossed (square enough to it: checked on the whole line), never run alongside.
    for (const r of ctx.roads.near(box))
      for (let i = 1; i < r.pts.length; i++) {
        const c = r.pts[i - 1],
          d = r.pts[i];
        if (segsCross(a, b, c, d)) {
          crossed.add(r);
          continue;
        }
        if (segSeg(a, b, c, d) < ROAD_KEEP + r.w / 2 && !crossesNearby(a, b, r.pts)) return false;
      }
    if ([a, b].some((p) => inPolygon(p, t.lake.poly)) || t.lake.poly.some((p) => pointSeg(p, a, b) < 3)) return false;
    // Off the old line it never meets the river or a stream (the one bridge stays where it was).
    if (watercourses(t).some((w) => lineLineNear([a, b], w.pts) < w.w / 2 + RAIL_WIDTH / 2 + 1)) return false;
    if ((t.nature || []).some((n) => [a, b].some((p) => inPolygon(p, n.poly)))) return false;
  }
  // Every street crossed here meets the line square enough for a level crossing.
  if (crossed.size) {
    const local = { version: RERAIL_TERRAIN, rail: { pts: pts.map((x) => x.p), w: RAIL_WIDTH } };
    for (const r of crossed) if (r.status !== "dropped" && r.type !== "kopru" && r.type !== "iskele" && !railCrossing(local, r.pts)) return false;
  }
  return true;
}
// A street that the line crosses close by is near the line where it crosses; that is the crossing, not a street alongside.
const crossesNearby = (a, b, road) => {
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  for (let i = 1; i < road.length; i++) {
    if (pointSeg(mid, road[i - 1], road[i]) > 4) continue;
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy) || 1;
    // Extend the piece a little both ways and look for the crossing.
    const a2 = [a[0] - (dx / len) * 3, a[1] - (dy / len) * 3],
      b2 = [b[0] + (dx / len) * 3, b[1] + (dy / len) * 3];
    if (segsCross(a2, b2, road[i - 1], road[i])) return true;
  }
  return false;
};
function segSeg(a, b, c, d) {
  if (segsCross(a, b, c, d)) return 0;
  return Math.min(pointSeg(a, c, d), pointSeg(b, c, d), pointSeg(c, a, b), pointSeg(d, a, b));
}

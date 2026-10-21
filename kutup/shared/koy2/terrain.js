// n46 köy v2 terrain: one river with a lake on it and one country railway,
// drawn from the layout's seed, laid out before any house so that a
// watermill, a floating house, a bridge or a station always has somewhere
// true to stand. The village starts on dry ground around the square; water
// and rails lie a short walk away, and a model that needs them opens a
// connected street towards them (plan §4.4, §5.4).
//
// Same seed + version → the same numbers on every host. Ground is level
// (z = 0) in version 1; heightAt() is where terraces come in later.
import { bend, hash, linePoint, q, rng } from "./geom.js";

export const TERRAIN_VERSION = 1;
export const RIVER_WIDTH = 3.2; // about 5 m
export const RAIL_WIDTH = 1.7; // one track and its ballast
const REACH = 320; // half length of the river and railway

function meander(base, dir, normal, R) {
  const p1 = R() * Math.PI * 2,
    p2 = R() * Math.PI * 2,
    a1 = 4 + R() * 3,
    a2 = 1.5 + R() * 1.5;
  const pts = [];
  for (let s = -REACH; s <= REACH; s += 6) {
    const n = a1 * Math.sin(s / 41 + p1) + a2 * Math.sin(s / 17 + p2);
    pts.push([q(base[0] + dir[0] * s + normal[0] * n), q(base[1] + dir[1] * s + normal[1] * n)]);
  }
  return pts;
}

export function makeTerrain(seed, version = TERRAIN_VERSION) {
  const R = rng(hash(`terrain:${version}:${seed}`));
  // The river passes 44–52 units (70–85 m) from the square.
  const a = R() * Math.PI * 2,
    dist = 44 + R() * 8;
  const normal = [Math.cos(a), Math.sin(a)],
    dir = [-Math.sin(a), Math.cos(a)];
  const river = meander([normal[0] * dist, normal[1] * dist], dir, normal, R);
  // A lake where the river widens, a little up or down stream of the closest point.
  const along = (R() * 2 - 1) * 24;
  const at = linePoint(river, [normal[0] * dist + dir[0] * along, normal[1] * dist + dir[1] * along]).point;
  const rx = 10 + R() * 3,
    ry = 6.5 + R() * 2;
  const cx = at[0] + normal[0] * 2.5,
    cy = at[1] + normal[1] * 2.5;
  const lake = [];
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2,
      wob = 1 + 0.07 * Math.sin(3 * t + a) + 0.05 * Math.sin(5 * t + 2 * a);
    // The long axis lies along the river.
    const u = Math.cos(t) * rx * wob,
      v = Math.sin(t) * ry * wob;
    lake.push([q(cx + dir[0] * u + normal[0] * v), q(cy + dir[1] * u + normal[1] * v)]);
  }
  // The railway runs on the other side of the square, 58–70 units out,
  // never crossing the river near the village.
  let rail = null;
  for (let tries = 0; tries < 8 && !rail; tries++) {
    const b = a + Math.PI + (R() * 2 - 1) * 0.7,
      d2 = 58 + R() * 12;
    const n2 = [Math.cos(b), Math.sin(b)],
      t2 = [-Math.sin(b), Math.cos(b)];
    const start = [n2[0] * d2 - t2[0] * REACH, n2[1] * d2 - t2[1] * REACH],
      end = [n2[0] * d2 + t2[0] * REACH, n2[1] * d2 + t2[1] * REACH];
    const line = bend(start, end, (R() * 2 - 1) * 18, 40);
    const near = line.filter((p) => Math.hypot(p[0], p[1]) < 160);
    if (near.every((p) => linePoint(river, p).d > RIVER_WIDTH + 6)) rail = line;
  }
  return { version, seed, river: { pts: river, w: RIVER_WIDTH }, lake: { poly: lake, cx: q(cx), cy: q(cy) }, rail: rail ? { pts: rail, w: RAIL_WIDTH } : null };
}

/** Ground height at a point (level ground in version 1). */
export const heightAt = () => 0;

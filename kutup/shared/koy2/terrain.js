// n46 köy v2 terrain: one river, one pond and one country railway, drawn
// from the layout's seed, laid out before any house so that a watermill, a
// floating house, a bridge or a station always has somewhere true to stand.
// The village starts on dry ground around the square; water and rails lie a
// short walk away, and a model that needs them opens a connected street
// towards them (plan §4.4, §5.4).
//
// Where each lies follows the drawings. The isometric camera looks from the
// +x/+y side, so a model shows only its +x and +y faces: the mill's wheel,
// the station's platform rails and the floating house's jetty are all drawn
// there. So the river and the railway run in front of the village (towards
// +y and +x, one each), where a mill or a station on the village side turns
// its wheel or its platform to them; the pond lies behind (towards −x or −y),
// where a floating house's jetty and a lighthouse's door look back to the
// houses. The railway crosses the river on its own bridge well outside the
// village (≥ 70 units, about 110 m, from the square).
//
// Version 3 (n49) lays the railway in long S-bends instead of a nearly straight
// line, and lets it swing in once towards the village, where a train can be
// seen arriving; layouts made before keep the line they were made with (their
// terrain is stored with them).
//
// Same seed + version → the same numbers on every host. Ground is level
// (z = 0) in version 1; heightAt() is where terraces come in later.
import { bend, hash, linesCross, q, rng } from "./geom.js";

export const TERRAIN_VERSION = 3;
/** The terrain versions a layout of each planner generation may stand on. */
export const TERRAINS = { 2: [1], 3: [2, 3] };
export const RIVER_WIDTH = 3.2; // about 5 m
export const RAIL_WIDTH = 1.7; // one track and its ballast
const REACH = 320; // half length of the river and railway

function smoothRoute(points) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b, c, d] = [points[Math.max(0, i - 1)], points[i], points[i + 1], points[Math.min(points.length - 1, i + 2)]];
    for (let j = 0; j < 12; j++) {
      const t = j / 12;
      out.push([0, 1].map((k) => q(0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t ** 3))));
    }
  }
  out.push(points.at(-1).map(q));
  return out;
}

function meander(base, dir, normal, R, version) {
  const p1 = R() * Math.PI * 2,
    p2 = R() * Math.PI * 2,
    a1 = (version >= 2 ? 8 : 3) + R() * 2.5,
    a2 = (version >= 2 ? 2.5 : 1) + R() * 1.2;
  const pts = [];
  for (let s = -REACH; s <= REACH; s += 6) {
    const n = a1 * Math.sin(s / 41 + p1) + a2 * Math.sin(s / 17 + p2);
    pts.push([q(base[0] + dir[0] * s + normal[0] * n), q(base[1] + dir[1] * s + normal[1] * n)]);
  }
  return pts;
}

const crossesNear = (line, river, within) => {
  for (let i = 1; i < line.length; i++)
    for (let j = 1; j < river.length; j++)
      if (linesCross([line[i - 1], line[i]], [river[j - 1], river[j]]) && Math.hypot(line[i][0], line[i][1]) < within) return true;
  return false;
};
// Version 3: the way a real branch line is laid. Straight runs about 50 units
// long, square to the axis so a station's platform fits on any of them (the
// planner turns a model only in right angles), joined by easy S-bends about 45
// units long at a different distance each time. The run in front of the
// village swings in closer (48–52 units), so the train is seen arriving. The
// sharpest bend keeps a radius of about 25 units; nowhere nearer than 38 units
// to the square, and the river is crossed at least 70 units out.
const RUN_LEN = 50,
  BEND_LEN = 45;
function windingRail(seed, version, tn, river) {
  const R = rng(hash(`rail:${version}:${seed}`));
  const t2 = [-tn[1], tn[0]];
  const period = RUN_LEN + BEND_LEN;
  // Measured so that the river lies ahead (+s): which way along the line it is.
  const mid = river[Math.floor(river.length / 2)];
  const side = mid[0] * t2[0] + mid[1] * t2[1] >= 0 ? 1 : -1;
  for (let tries = 0; tries < 41; tries++) {
    // Late tries bend less; the very last is straight and far out, so a line is always found.
    const calm = tries >= 40 ? 0 : tries >= 30 ? 0.5 : 1;
    const d = calm ? 60 + R() * 6 : 70,
      s0 = -55 + R() * 15, // the village's run starts here (ends before the river)
      first = Math.floor((-REACH - s0) / period) - 1,
      flip = R() < 0.5 ? 1 : -1;
    const levels = new Map();
    const level = (k) => {
      // In by the village; the next run, where the line meets the river, swings out so the bridge stays far from the houses.
      if (!levels.has(k)) levels.set(k, k === 0 ? d - (8 + R() * 4) * calm : d + (k === 1 ? 1 : (k % 2 ? 1 : -1) * flip) * (6 + R() * 4) * calm);
      return levels.get(k);
    };
    for (let k = first; k * period + s0 <= REACH + period; k++) level(k);
    const offset = (s) => {
      const k = Math.floor((s - s0) / period),
        u = s - s0 - k * period;
      if (u <= RUN_LEN) return level(k);
      const e = (1 - Math.cos((Math.PI * (u - RUN_LEN)) / BEND_LEN)) / 2;
      return level(k) + (level(k + 1) - level(k)) * e;
    };
    const line = [];
    for (let s = -REACH; s <= REACH; s += 5) {
      const n = offset(s * side);
      line.push([q(tn[0] * n + t2[0] * s), q(tn[1] * n + t2[1] * s)]);
    }
    if (line.some(([x, y]) => Math.hypot(x, y) < 38)) continue;
    if (!crossesNear(line, river, 70)) return line;
  }
  return null;
}

export function makeTerrain(seed, version = TERRAIN_VERSION) {
  // Version 3 keeps the ground of version 2 (same numbers); only its railway is new.
  const R = rng(hash(`terrain:${Math.min(version, 2)}:${seed}`));
  // The river in front, 44–52 units (70–85 m) from the square, nearly square to an axis.
  const front = R() < 0.5 ? 0 : 1;
  const rn = front ? [1, 0] : [0, 1],
    tn = front ? [0, 1] : [1, 0];
  const tilt = (R() * 2 - 1) * 0.12;
  const normal = [rn[0] * Math.cos(tilt) - rn[1] * Math.sin(tilt), rn[0] * Math.sin(tilt) + rn[1] * Math.cos(tilt)];
  const dir = [-normal[1], normal[0]];
  const dist = 44 + R() * 8;
  const river = meander([normal[0] * dist, normal[1] * dist], dir, normal, R, version);
  // The railway along the other front axis, 58–70 units out, gently bent so a
  // station finds a straight run; it crosses the river far from the houses.
  let rail = null;
  for (let tries = 0; tries < 8 && !rail; tries++) {
    const d2 = 58 + R() * 12;
    const t2 = [-tn[1], tn[0]];
    const start = [tn[0] * d2 - t2[0] * REACH, tn[1] * d2 - t2[1] * REACH],
      end = [tn[0] * d2 + t2[0] * REACH, tn[1] * d2 + t2[1] * REACH];
    const line = bend(start, end, (R() * 2 - 1) * 12, 80);
    let ok = true;
    for (let i = 1; i < line.length && ok; i++)
      for (let j = 1; j < river.length && ok; j++)
        if (linesCross([line[i - 1], line[i]], [river[j - 1], river[j]]) && Math.hypot(line[i][0], line[i][1]) < 70) ok = false;
    if (ok) rail = line;
  }
  // Version 3 lays its own winding line from its own numbers; the river, pond
  // and meadows stay exactly those of version 2.
  if (version >= 3) rail = windingRail(seed, version, tn, river);
  // The pond behind the village, opposite the railway, 30–38 units out.
  const pa = Math.atan2(-tn[1], -tn[0]) + (R() * 2 - 1) * 0.5;
  const pd = 30 + R() * 8;
  const cx = Math.cos(pa) * pd,
    cy = Math.sin(pa) * pd;
  const rx = 10 + R() * 3,
    ry = 6.5 + R() * 2;
  const lake = [];
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2,
      wob = 1 + 0.07 * Math.sin(3 * t + pa) + 0.05 * Math.sin(5 * t + 2 * pa);
    // The long side faces the village.
    const u = Math.cos(t) * rx * wob,
      v = Math.sin(t) * ry * wob;
    lake.push([q(cx - Math.sin(pa) * u + Math.cos(pa) * v), q(cy + Math.cos(pa) * u + Math.sin(pa) * v)]);
  }
  const terrain = { version, seed, river: { pts: river, w: RIVER_WIDTH }, lake: { poly: lake, cx: q(cx), cy: q(cy) }, rail: rail ? { pts: rail, w: RAIL_WIDTH } : null };
  if (version >= 2) {
    // The lake drains around the back of the settlement into the river. Both
    // ends join real water; it is not a decorative line ending on the lawn.
    const join = river.reduce((best, p) => Math.hypot(p[0] - (-tn[0] * 65 + normal[0] * dist), p[1] - (-tn[1] * 65 + normal[1] * dist)) < best.d
      ? { p, d: Math.hypot(p[0] - (-tn[0] * 65 + normal[0] * dist), p[1] - (-tn[1] * 65 + normal[1] * dist)) } : best, { p: river[0], d: Infinity }).p;
    const elbow = [q(-tn[0] * 65 - normal[0] * 20), q(-tn[1] * 65 - normal[1] * 20)];
    terrain.streams = [{ id: "lake-outlet", w: 1.5, pts: smoothRoute([[cx, cy], [q(cx - tn[0] * 20), q(cy - tn[1] * 20)], elbow, [q(join[0] - normal[0] * 16), q(join[1] - normal[1] * 16)], join]) }];
    // A small number of genuine protected patches. They never follow owner
    // boundaries or change with the building count. Every other empty plot
    // remains buildable subject to access and spacing.
    terrain.nature = Array.from({ length: 5 }, (_, i) => {
      const a = R() * Math.PI * 2, d = 42 + R() * 55;
      const x = Math.cos(a) * d, y = Math.sin(a) * d, rx = 4 + R() * 4, ry = 3 + R() * 3;
      const poly = Array.from({ length: 14 }, (_, j) => {
        const t = j / 14 * Math.PI * 2, wob = 1 + 0.14 * Math.sin(t * 3 + a);
        return [q(x + Math.cos(t) * rx * wob), q(y + Math.sin(t) * ry * wob)];
      });
      return { id: `nature-${i}`, kind: i % 3 === 0 ? "meadow" : "grove", poly };
    });
  }
  return terrain;
}

export const watercourses = (terrain) => [terrain.river, ...(terrain.streams || [])];

/** Ground height at a point (level ground in version 1). */
export const heightAt = () => 0;

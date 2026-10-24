// n49: the v2 village's little train. Like the rest of the village's life
// (src/koy2/life.js) nothing is simulated frame by frame: where the train is
// comes from the shared clock, the team's seed and the layout alone, so two
// phones see the same train and a phone that looks away and back finds it
// where it should be. Now and then a train runs the whole line; a passenger
// train slows down and stops at the village's station (or, with no station,
// at a small halt beside the track), people get off and on, and it pulls out
// again. A goods train slows through the village and passes. Level crossings
// close their barriers while it goes by.
//
// Decoration only: it never reads or writes rewards, minutes, places or
// members, and costs the server nothing (all of it runs in the browser).
import { cmp, hash, lengthOf, linePoint, rng } from "../../shared/koy2/geom.js";
import { LIFE, routeOf, walkGraph, walksFrom } from "./life.js";

export const TRAIN = {
  slot: 480, // one chance of a train in every 8 minutes
  chance: 0.85, // and sometimes none: a timetable, not a metronome
  cruise: 6.5, // world units per second (≈ 37 km/h on a branch line)
  slow: 3.2, // a goods train through the village
  brake: 0.5, // u/s²
  accel: 0.35,
  dwell: [24, 40], // seconds at the platform
  zone: 28, // half the stretch a goods train takes slowly
  puffEvery: 0.5,
  puffLife: 4,
};
// What a train is made of, front to back (lengths in world units; a person is 1.09 tall).
export const CARS = { loco: 2.8, coach: 3.2, logs: 2.8, tank: 2.8, box: 3 };
const GAP = 0.3;
const KINDS = [
  { id: "yolcu", stops: true, cars: ["loco", "coach", "coach"], p: 0.6 },
  { id: "kisa", stops: true, cars: ["loco", "coach"], p: 0.15 },
  { id: "yuk", stops: false, cars: ["loco", "logs", "tank", "box"], p: 0.25 },
];

/** Cumulative lengths of a polyline, for fast lookups by distance. */
function measured(pts) {
  const run = [0];
  for (let i = 1; i < pts.length; i++) run.push(run[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, run, total: run.at(-1) || 0 };
}
/** The point at distance s (clamped) along a measured line. */
export function pointAt(line, s) {
  s = Math.max(0, Math.min(line.total, s));
  let lo = 1,
    hi = line.run.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (line.run[mid] < s) lo = mid + 1;
    else hi = mid;
  }
  const a = line.pts[lo - 1],
    b = line.pts[lo],
    len = line.run[lo] - line.run[lo - 1] || 1;
  const t = (s - line.run[lo - 1]) / len;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// ---------- the timetable ----------
/** Phases of one run: { t0, dur, u0, v0, a } (time from the run's start, head position along the way). */
export function profile({ stop, stops, length, total, dwell }) {
  const { cruise: v, brake: b, accel: a, slow, zone } = TRAIN;
  const phases = [];
  let t = 0,
    u = 0;
  const go = (dur, v0, acc) => {
    if (dur <= 0) return;
    phases.push({ t0: t, dur, u0: u, v0, a: acc });
    t += dur;
    u += v0 * dur + (acc * dur * dur) / 2;
  };
  const end = total + length; // the last car has left the line
  if (stop === null) go(end / v, v, 0);
  else if (stops) {
    // The head stops so that the train stands centred on the platform.
    const at = stop + length / 2;
    go((at - (v * v) / (2 * b)) / v, v, 0);
    go(v / b, v, -b);
    go(dwell, 0, 0);
    go(v / a, 0, a);
    go((end - u) / v, v, 0);
  } else {
    const from = Math.max(0, stop - zone);
    go((from - (v * v - slow * slow) / (2 * b)) / v, v, 0);
    go((v - slow) / b, v, -b);
    go((stop + zone + length - u) / slow, slow, 0);
    go((v - slow) / a, slow, a);
    go((end - u) / v, v, 0);
  }
  return { phases, duration: t };
}
/** Head position and speed at time tau into a run. */
export function headAt(run, tau) {
  for (const p of run.phases) {
    if (tau > p.t0 + p.dur) continue;
    const d = Math.max(0, tau - p.t0);
    return { u: p.u0 + p.v0 * d + (p.a * d * d) / 2, v: p.v0 + p.a * d, a: p.a, phase: p };
  }
  const last = run.phases.at(-1);
  return { u: last.u0 + last.v0 * last.dur + (last.a * last.dur * last.dur) / 2, v: last.v0 + last.a * last.dur, a: 0, phase: last };
}

// ---------- where it stops ----------
/** The village's station on the line (a finished Tren İstasyonu), or null. */
function stationOf(layout, rail) {
  let best = null;
  for (const p of layout.plots) {
    if (p.model !== "istasyon" || p.subject?.type !== "building") continue;
    const hit = linePoint(rail.pts, [p.x, p.y]);
    if (hit.d > 4) continue;
    const key = Math.hypot(p.x, p.y);
    if (!best || key < best.key || (key === best.key && cmp(p.id, best.plot.id) < 0)) best = { key, plot: p, hit };
  }
  return best;
}
const pointSegD = (p, a, b) => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    len = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
const lineD = (line, p) => {
  let d = Infinity;
  for (let i = 1; i < line.length; i++) d = Math.min(d, pointSegD(p, line[i - 1], line[i]));
  return d;
};
/**
 * With no station, a small halt beside the track: on the village's side, as
 * near the square as the line comes, on the free strip the planner keeps
 * along the railway (nothing is planned within 1.65 of its middle), clear of
 * level crossings, streets, door paths and water.
 */
export const HALT = { half: 2.6, from: 0.95, to: 1.55 };
function haltOf(layout, rail, line, crossings) {
  const t = layout.terrain;
  const water = [t.river, ...(t.streams || [])].filter(Boolean);
  const cands = [];
  for (let s = 6; s < line.total - 6; s += 2) {
    const p = pointAt(line, s);
    cands.push({ s, p, d: Math.hypot(p[0], p[1]) });
  }
  cands.sort((a, b) => a.d - b.d || a.s - b.s);
  for (const c of cands.slice(0, 80)) {
    if (crossings.some((x) => Math.abs(x.s - c.s) < 9)) continue;
    const a = pointAt(line, c.s - 1),
      b = pointAt(line, c.s + 1),
      len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1,
      dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    // The side towards the square.
    let n = [-dir[1], dir[0]];
    if (n[0] * -c.p[0] + n[1] * -c.p[1] < 0) n = [-n[0], -n[1]];
    const spots = [];
    for (const along of [-HALT.half, 0, HALT.half])
      for (const off of [HALT.from, HALT.to]) spots.push([c.p[0] + dir[0] * along + n[0] * off, c.p[1] + dir[1] * along + n[1] * off]);
    if (water.some((w) => spots.some((q) => lineD(w.pts, q) < w.w / 2 + 3))) continue;
    if (layout.roads.some((r) => r.status !== "dropped" && spots.some((q) => lineD(r.pts, q) < r.w / 2 + 0.6))) continue;
    if (layout.plots.some((p) => (p.door && spots.some((q) => lineD(p.door, q) < 0.8)) || spots.some((q) => q[0] > p.ground[0] - 0.3 && q[0] < p.ground[2] + 0.3 && q[1] > p.ground[1] - 0.3 && q[1] < p.ground[3] + 0.3))) continue;
    return { s: c.s, p: c.p, dir, n };
  }
  return null;
}

/**
 * The train of a v2 layout, or null when the layout has no railway.
 * at(clockMs, { motion }) → what to draw now (see below); nextIn(clockMs) → ms
 * until the next train enters the line (0 while one is on it).
 */
export function createTrain(layout, graph = null) {
  const rail = layout.terrain?.rail;
  if (!rail || rail.pts.length < 2) return null;
  const seed = `${layout.seed}:train`;
  const line = measured(rail.pts);
  const total = line.total;
  // Level crossings: where a street crosses the line.
  const crossings = [];
  for (const r of layout.roads) {
    if (!r.railCrossing || r.status !== "usable") continue;
    const c = r.railCrossing.pts[Math.floor(r.railCrossing.pts.length / 2)];
    const hit = linePoint(rail.pts, c);
    const i = Math.max(1, Math.min(r.pts.length - 1, linePoint(r.pts, c).seg));
    const a = r.pts[i - 1],
      b = r.pts[i],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    crossings.push({ id: r.id, s: hit.at, x: hit.point[0], y: hit.point[1], w: r.w, dir: [(b[0] - a[0]) / len, (b[1] - a[1]) / len], usable: r.status === "usable" });
  }
  // Where passenger trains stop.
  const station = stationOf(layout, rail);
  let stop = null;
  if (station) {
    const p = station.hit.point;
    const a = pointAt(line, station.hit.at - 1),
      b = pointAt(line, station.hit.at + 1),
      len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1,
      dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    let n = [-dir[1], dir[0]];
    if (n[0] * (station.plot.x - p[0]) + n[1] * (station.plot.y - p[1]) < 0) n = [-n[0], -n[1]];
    stop = { kind: "station", s: station.hit.at, p, dir, n, plot: station.plot.id, edge: 0.95 };
  } else {
    const halt = haltOf(layout, rail, line, crossings);
    if (halt) stop = { kind: "halt", ...halt, edge: (HALT.from + HALT.to) / 2 };
  }
  // Those who get off at the station walk into the village by its door path.
  let walkIn = null;
  if (stop?.kind === "station") {
    graph = graph || walkGraph(layout);
    const door = graph.doors.get(stop.plot);
    let best = null;
    for (const [fid, key] of graph.squares) {
      const tree = walksFrom(graph, key, 80);
      const path = door && tree.dist.has(door) ? routeOf(tree, door) : null;
      if (path && (!best || path.total < best.total || (path.total === best.total && cmp(fid, best.id) < 0))) best = { ...path, id: fid };
    }
    if (best) walkIn = best;
    else if (door) walkIn = { pts: [[graph.V.get(door).x, graph.V.get(door).y]], total: 0 };
  }

  const lengthOf_ = (cars) => cars.reduce((t, c) => t + CARS[c], 0) + GAP * (cars.length - 1);
  // A standing train keeps the level crossings open: it pulls up a little short
  // of one, or a little past it (at most 7 units off the platform's middle).
  function standAt(at, length, dir) {
    for (const c of crossings) {
      const uc = dir > 0 ? c.s : total - c.s;
      const lo = at - length / 2 - c.w / 2 - 1,
        hi = at + length / 2 + c.w / 2 + 1;
      if (uc < lo || uc > hi) continue;
      const shift = uc - lo < hi - uc ? uc - lo : -(hi - uc);
      if (Math.abs(shift) <= 7) at += shift;
    }
    return at;
  }
  const runs = new Map();
  // The train of slot n, or null when that slot has none.
  function runOf(n) {
    if (runs.has(n)) return runs.get(n);
    const r = rng(hash(`${seed}:${n}`));
    let run = null;
    if (r() < TRAIN.chance) {
      let k = r(),
        kind = KINDS[0];
      for (const x of KINDS) {
        if (k < x.p) {
          kind = x;
          break;
        }
        k -= x.p;
      }
      const dir = r() < 0.5 ? 1 : -1,
        dwell = TRAIN.dwell[0] + r() * (TRAIN.dwell[1] - TRAIN.dwell[0]);
      const length = lengthOf_(kind.cars);
      // Where the stop is, measured from the end the train comes in at.
      const stops = kind.stops && !!stop;
      let at = stop ? (dir > 0 ? stop.s : total - stop.s) : null;
      if (stops) at = standAt(at, length, dir);
      const p = profile({ stop: at, stops, length, total, dwell });
      const start = n * TRAIN.slot + r() * Math.max(0, TRAIN.slot - p.duration - 10);
      run = { n, kind: kind.id, cars: kind.cars, dir, length, stops, at, dwell, start, ...p, riders: [1 + Math.floor(r() * 2), Math.floor(r() * 3)], look: r() };
      if (stops) {
        const brake = p.phases[1];
        run.arrive = start + brake.t0 + brake.dur; // standing from here
        run.depart = run.arrive + dwell;
      }
    }
    runs.set(n, run);
    if (runs.size > 8) runs.delete(runs.keys().next().value);
    return run;
  }
  // The run on the line at clock t (seconds), if any.
  function current(t) {
    const n = Math.floor(t / TRAIN.slot);
    for (const k of [n, n - 1]) {
      const run = runOf(k);
      if (run && t >= run.start && t < run.start + run.duration) return run;
    }
    return null;
  }
  const toS = (run, u) => (run.dir > 0 ? u : total - u);
  // A car's middle and its heading from its two bogies, so it follows the curve.
  function carAt(run, centre, len) {
    const half = Math.max(0.3, len / 2 - 0.45);
    const f = toS(run, centre + half),
      b = toS(run, centre - half);
    const pf = pointAt(line, f),
      pb = pointAt(line, b);
    const dx = pf[0] - pb[0],
      dy = pf[1] - pb[1],
      d = Math.hypot(dx, dy) || 1;
    return { x: (pf[0] + pb[0]) / 2, y: (pf[1] + pb[1]) / 2, dx: dx / d, dy: dy / d };
  }
  function carsAt(run, head) {
    const out = [];
    let back = 0;
    run.cars.forEach((kind, i) => {
      const len = CARS[kind];
      const centre = head - back - len / 2;
      back += len + GAP;
      if (centre + len / 2 < 0 || centre - len / 2 > total) return;
      out.push({ kind, i, len, ...carAt(run, centre, len), lit: run.look });
    });
    return out;
  }
  // The chimney sits a little behind the locomotive's front.
  const chimneyAt = (run, tau) => {
    const h = headAt(run, tau);
    const u = h.u - 0.65;
    if (u < 0 || u > total) return null;
    const p = pointAt(line, toS(run, u));
    return { x: p[0], y: p[1], v: h.v, a: h.a };
  };
  function puffsAt(run, tau) {
    const out = [];
    const last = Math.floor(tau / TRAIN.puffEvery);
    for (let k = last; k > last - Math.ceil(TRAIN.puffLife / TRAIN.puffEvery); k--) {
      const te = k * TRAIN.puffEvery;
      if (te < 0) break;
      const c = chimneyAt(run, te);
      if (!c) continue;
      // Standing, it only breathes now and then; pulling away, it chuffs hard.
      const working = c.a > 0 ? 1.4 : c.v > 0.2 ? 1 : 0.45;
      if (working < 1 && k % 3) continue;
      out.push({ x: c.x, y: c.y, age: tau - te, size: working });
    }
    return out;
  }
  // People at the platform: some wait and board, some get off and walk away.
  function ridersAt(run, t) {
    if (!run.stops) return [];
    const out = [];
    const spot = (along, off = stop.edge) => [stop.p[0] + stop.dir[0] * along + stop.n[0] * off, stop.p[1] + stop.dir[1] * along + stop.n[1] * off];
    const facing = [-stop.n[0], -stop.n[1]];
    // Waiting from a minute before the train comes; on board a few seconds after it stands.
    for (let k = 0; k < run.riders[0]; k++) {
      const boards = run.arrive + 4 + k * 1.8;
      if (t >= run.arrive - 60 && t < boards) out.push({ id: `train:${run.n}:w${k}`, home: `train:${run.n}:w${k}`, x: spot(-1.2 + k * 1.7)[0], y: spot(-1.2 + k * 1.7)[1], walking: false, face: facing, step: null });
    }
    for (let k = 0; k < run.riders[1]; k++) {
      const off = run.arrive + 3 + k * 2.2;
      let u = t - off;
      if (u < 0) continue;
      const from = spot(0.6 - k * 1.4);
      let pts;
      if (stop.kind === "station" && walkIn) {
        // Off the train, into the station, and out of its front door a few seconds later.
        const inside = [from, spot(0.6 - k * 1.4, stop.edge + 0.45)];
        const first = measured(inside).total / LIFE.speed;
        if (u < first) pts = inside;
        else if (u < first + 5) continue;
        else [pts, u] = [walkIn.pts, u - first - 5];
      } else pts = [from, spot(HALT.half * (k % 2 ? -1 : 1) * 1.1, HALT.to - 0.2)];
      const path = measured(pts);
      const s = u * LIFE.speed;
      if (s >= path.total) continue; // arrived: they are in the village now
      const p = pointAt(path, s),
        q = pointAt(path, s + 0.3);
      out.push({ id: `train:${run.n}:a${k}`, home: `train:${run.n}:a${k}`, x: p[0], y: p[1], walking: true, face: [q[0] - p[0], q[1] - p[1]], step: (t - off) * 7 });
    }
    return out;
  }
  // Down from when the train is 26 units off until its tail is 9 past. A train
  // standing clear of the crossing lets it open a few seconds after it stops
  // and closes it again a few seconds before it pulls out.
  function crossingsAt(run, head, t) {
    const clamp = (v) => Math.max(0, Math.min(1, v));
    return crossings.map((c) => {
      if (!run) return { ...c, close: 0 };
      const uc = run.dir > 0 ? c.s : total - c.s;
      const tail = head - run.length;
      let close = Math.min(clamp((head - (uc - 26)) / 5), clamp((uc + 9 - tail) / 6));
      const clear = uc < tail - c.w / 2 - 0.5 || uc > head + c.w / 2 + 0.5;
      if (close > 0 && clear && run.stops && t >= run.arrive && t < run.depart) close = Math.min(close, Math.max(1 - clamp((t - run.arrive - 2) / 3), clamp((t - run.depart + 6) / 3)));
      return { ...c, close };
    });
  }

  return {
    stop,
    crossings,
    line,
    walkIn,
    runOf,
    /**
     * opts.motion: "full" | "calm" | "still". Returns { run, state, cars,
     * puffs, whistle, riders, crossings, moving }. With motion off only a train
     * standing at the platform is shown (a still picture), never one moving.
     */
    at(clockMs, { motion = "full" } = {}) {
      const t = clockMs / 1000;
      const run = current(t);
      if (!run) return { run: null, state: null, cars: [], puffs: [], whistle: null, riders: [], crossings: crossingsAt(null, 0, t), moving: false };
      const tau = t - run.start;
      const h = headAt(run, tau);
      const standing = run.stops && t >= run.arrive && t < run.depart;
      const state = standing ? "standing" : h.a < 0 ? "braking" : h.a > 0 ? "leaving" : run.stops && t > run.depart ? "leaving" : run.stops ? "coming" : "passing";
      if (motion !== "full" && !standing) return { run: null, state: null, cars: [], puffs: [], whistle: null, riders: [], crossings: crossingsAt(null, 0, t), moving: false };
      const full = motion === "full";
      // Two short blasts as it pulls out; a goods train whistles as it slows for the village.
      let whistle = null;
      if (full && run.stops && t >= run.depart - 1.2 && t < run.depart + 0.6) whistle = (t - run.depart + 1.2) / 1.8;
      else if (full && !run.stops && run.phases[1] && tau >= run.phases[1].t0 && tau < run.phases[1].t0 + 1.8) whistle = (tau - run.phases[1].t0) / 1.8;
      return {
        run,
        state,
        cars: carsAt(run, h.u),
        puffs: full ? puffsAt(run, tau) : [],
        whistle,
        riders: full ? ridersAt(run, t) : [],
        crossings: crossingsAt(run, h.u, t),
        moving: full,
        speed: h.v,
      };
    },
    nextIn(clockMs) {
      const t = clockMs / 1000;
      if (current(t)) return 0;
      const n = Math.floor(t / TRAIN.slot);
      for (let k = n; k < n + 6; k++) {
        const run = runOf(k);
        if (run && run.start > t) return (run.start - t) * 1000;
      }
      return TRAIN.slot * 1000;
    },
  };
}

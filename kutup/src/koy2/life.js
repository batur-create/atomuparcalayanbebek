// n46 F: the v2 village's shared life (plan §6.4). Nothing here is simulated
// frame by frame: where every neighbour, bird and raindrop is comes from the
// shared clock, the team's life seed and the layout alone, so two phones see
// the same village and a part of it that comes back into view is already in
// the right state. A visit only exists where its place really is (a kahve's
// door, a sahaf, a square's bench) and only walks the village's own streets
// and door paths, so nobody is ever drawn inside a wall.
//
// Life is decoration: it never reads or writes rewards, minutes, places or
// members, and no figure carries a name or an online mark.
import { along, cmp, hash, inPolygon, lengthOf, linePoint, pointRect, rng } from "../../shared/koy2/geom.js";

export const LIFE = {
  speed: 0.9, // walking pace, world units per second (≈ 1.4 m/s)
  maxWalk: 45, // nobody walks farther than this to a visit (≈ 50 s)
  people: 12, // decorative people in view, at most
  focusPeople: 4, // while the viewer is focusing
  lodPeople: [0, 8, 6], // village / neighbourhood / close-up (a group event may add up to the 12)
};
// The first calibration of plan §6.4 (seconds): how long a visit stays, how
// long the place rests before the next one, and how many lanes (people at once).
export const EVENTS = {
  cay: { stay: [30, 60], gap: [240, 480], lanes: 2 },
  sahaf: { stay: [45, 90], gap: [300, 600], lanes: 2 },
  bench: { stay: [40, 90], gap: [180, 360], lanes: 1, dry: true },
  greet: { stay: [4, 8], gap: [120, 240], lanes: 1, dry: true },
  market: { stay: [120, 180], gap: [1800, 1800], lanes: 1, dry: true },
  birds: { stay: [15, 30], gap: [120, 300] },
  butterflies: { stay: [10, 20], gap: [120, 240] },
  wind: { stay: [2, 4], gap: [20, 40] },
  // n49: summer nights by the water and in the groves; ducks paddle a lap of the
  // pond now and then and rest near the shore between; a rowing boat on the river.
  fireflies: { stay: [40, 70], gap: [60, 150] },
  ducks: { stay: [0, 0], gap: [150, 330] },
  boat: { stay: [0, 0], gap: [420, 780] },
};
export const DUCKS = { speed: 0.35, inset: 0.55, brood: 3 };
export const BOAT = { speed: 0.7, reach: 55 };
// Shared weather: in each 24-minute window it may rain (or snow) once, for 1–3
// minutes, starting in the window's first 5 minutes, so two showers are always
// at least 16 minutes apart. Puddles stay 3–6 minutes after the rain.
export const WEATHER = { window: 24 * 60, startIn: 5 * 60, rain: [60, 180], puddles: [180, 360], chance: { winter: 0.35, spring: 0.3, summer: 0.15, autumn: 0.35 } };

const pick = (r, [lo, hi]) => lo + r() * (hi - lo);
// People also need time to walk there and back; birds and wind do not.
const slotOf = (spec) => spec.gap[1] + spec.stay[1] + (spec.lanes ? (2 * LIFE.maxWalk) / LIFE.speed : 0);

// ---------- the walking graph: usable streets, bridges, door paths, squares ----------
export function walkGraph(layout) {
  const V = new Map();
  const vert = (key, p) => {
    let v = V.get(key);
    if (!v) V.set(key, (v = { key, x: p[0], y: p[1], out: [] }));
    return v;
  };
  const link = (a, b, pts) => {
    const len = lengthOf(pts);
    a.out.push({ to: b.key, len, pts });
    b.out.push({ to: a.key, len, pts: [...pts].reverse() });
  };
  const roads = layout.roads.filter((r) => r.status === "usable");
  const byId = new Map(roads.map((r) => [r.id, r]));
  const nodes = new Map(layout.nodes.map((n) => [n.id, n]));
  const runs = new Map(); // road id → cumulative lengths
  const att = new Map();
  for (const r of roads) {
    const run = [0];
    for (let i = 1; i < r.pts.length; i++) run.push(run[i - 1] + Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]));
    runs.set(r.id, run);
    att.set(r.id, [
      { s: 0, key: `R:${r.id}:a`, p: r.pts[0] },
      { s: run.at(-1), key: `R:${r.id}:b`, p: r.pts.at(-1) },
    ]);
    // A street's ends meet at its nodes (across the main square for the first streets).
    // (A street's points may run either way between its two nodes.)
    const ends = [["a", r.pts[0]], ["b", r.pts.at(-1)]];
    for (const end of [r.a, r.b]) {
      const n = nodes.get(end);
      const [side, p] = !n ? ends[end === r.a ? 0 : 1] : ends.reduce((m, e) => (Math.hypot(e[1][0] - n.x, e[1][1] - n.y) < Math.hypot(m[1][0] - n.x, m[1][1] - n.y) ? e : m));
      const hub = vert(`N:${end}`, n ? [n.x, n.y] : p);
      link(vert(`R:${r.id}:${side}`, p), hub, [p, [hub.x, hub.y]]);
    }
  }
  const attach = (road, p, key) => {
    const hit = linePoint(road.pts, p);
    const run = runs.get(road.id);
    const a = road.pts[hit.seg - 1];
    att.get(road.id).push({ s: run[hit.seg - 1] + Math.hypot(hit.point[0] - a[0], hit.point[1] - a[1]), key, p: hit.point });
    return hit.point;
  };
  // Junctions in the middle of another street.
  for (const n of layout.nodes) if (n.on && byId.has(n.on)) attach(byId.get(n.on), [n.x, n.y], `N:${n.id}`);
  // Door paths: from the building's door to its street.
  const doors = new Map();
  for (const p of layout.plots) {
    if (!p.door || p.door.length < 2) continue;
    const end = p.door.at(-1);
    let road = byId.get(p.road);
    if (!road || linePoint(road.pts, end).d > road.w / 2 + 0.3) road = roads.find((r) => linePoint(r.pts, end).d <= r.w / 2 + 0.3);
    if (!road) continue;
    const on = attach(road, end, `D:${p.id}`);
    // A jetty's first point is out on the water; its walk starts on the boards.
    const line = p.door;
    const front = vert(`F:${p.id}`, line[0]);
    link(front, vert(`D:${p.id}`, on), [...line, on]);
    doors.set(p.id, front.key);
  }
  for (const r of roads) {
    const list = att.get(r.id).sort((a, b) => a.s - b.s || cmp(a.key, b.key));
    const run = runs.get(r.id);
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1],
        b = list[i];
      const pts = [a.p];
      for (let k = 0; k < r.pts.length; k++) if (run[k] > a.s && run[k] < b.s) pts.push(r.pts[k]);
      pts.push(b.p);
      link(vert(a.key, a.p), vert(b.key, b.p), pts);
    }
  }
  // Squares: their centre is reached from the node they open onto.
  const squares = new Map();
  for (const f of layout.foci) {
    if (f.status !== "open" || !f.node || !V.has(`N:${f.node}`)) continue;
    const hub = V.get(`N:${f.node}`);
    const c = vert(`Q:${f.id}`, [f.x, f.y]);
    const forecourt = f.landmark && layout.plots.find((p) => p.id === f.of && p.door && doors.has(p.id));
    if (forecourt) {
      // An approach may bend round the building. Follow its real door path
      // to the court rather than drawing a diagonal from the street node.
      const on = linePoint(forecourt.door, [f.x, f.y]);
      link(V.get(doors.get(forecourt.id)), c, [...forecourt.door.slice(0, on.seg), on.point, [f.x, f.y]]);
    } else if (hub !== c) link(hub, c, [[hub.x, hub.y], [f.x, f.y]]);
    squares.set(f.id, c.key);
  }
  return { V, doors, squares };
}

/** Shortest walks from one vertex to every other within `limit` (Dijkstra on a small graph). */
export function walksFrom(graph, from, limit) {
  const dist = new Map([[from, 0]]),
    prev = new Map();
  const open = [[0, from]];
  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[best][0] || (open[i][0] === open[best][0] && cmp(open[i][1], open[best][1]) < 0)) best = i;
    const [d, key] = open.splice(best, 1)[0];
    if (d > (dist.get(key) ?? Infinity)) continue;
    for (const e of graph.V.get(key).out) {
      const nd = d + e.len;
      if (nd > limit || nd >= (dist.get(e.to) ?? Infinity)) continue;
      dist.set(e.to, nd);
      prev.set(e.to, { from: key, e });
      open.push([nd, e.to]);
    }
  }
  return { dist, prev };
}
/** The walk from `home` to the venue the tree was grown from, as a polyline with lengths. */
export function routeOf(tree, home) {
  if (!tree.dist.has(home)) return null;
  const parts = [];
  for (let k = home; tree.prev.has(k); k = tree.prev.get(k).from) parts.push([...tree.prev.get(k).e.pts].reverse());
  const pts = [];
  for (const part of parts) for (const p of part) if (!pts.length || Math.hypot(p[0] - pts.at(-1)[0], p[1] - pts.at(-1)[1]) > 1e-6) pts.push(p);
  return pathOf(pts);
}
function pathOf(pts) {
  const lengths = [0];
  for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, lengths, total: lengths.at(-1) || 0 };
}
/** Point at distance s along a path (clamped), and the direction there. */
function at(path, s) {
  s = Math.max(0, Math.min(path.total, s));
  let i = 1;
  while (i < path.lengths.length - 1 && path.lengths[i] < s) i++;
  const a = path.pts[i - 1] || path.pts[0],
    b = path.pts[i] || a,
    len = path.lengths[i] - path.lengths[i - 1] || 1;
  const t = Math.max(0, Math.min(1, (s - path.lengths[i - 1]) / len));
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dx: b[0] - a[0], dy: b[1] - a[1] };
}

// ---------- level of detail (plan §6.3), with ±15 % hysteresis ----------
// From how wide an ordinary house is on screen: under ~45 px the whole
// village, 45–120 px a neighbourhood, above that a close-up.
export const LOD_EDGES = [45, 120];
export const HOUSE_SCREEN = 9.47; // iso screen width of an "ev" plot's ground, in units
export function lodFor(prev, housePx) {
  const [a, b] = LOD_EDGES;
  const level = housePx < a ? 0 : housePx < b ? 1 : 2;
  if (prev === null || prev === undefined || prev === level) return level;
  // Only change once the width is clearly past the edge that separates them.
  const edge = level > prev ? LOD_EDGES[level - 1] * 1.15 : LOD_EDGES[level] * 0.85;
  if (level > prev ? housePx >= edge : housePx <= edge) return level;
  return Math.abs(level - prev) > 1 ? prev + Math.sign(level - prev) : prev;
}

// ---------- weather ----------
export function weatherAt(seed, clockMs, season) {
  const t = clockMs / 1000,
    n = Math.floor(t / WEATHER.window);
  // The current window and the one before (puddles can outlast a window's end).
  for (const k of [n, n - 1]) {
    const r = rng(hash(`${seed}:weather:${k}`));
    if (r() >= (WEATHER.chance[season] ?? 0.25)) continue;
    const start = k * WEATHER.window + r() * WEATHER.startIn,
      rain = pick(r, WEATHER.rain),
      puddles = pick(r, WEATHER.puddles);
    const snow = season === "winter";
    const u = t - start;
    if (u >= 0 && u < rain) {
      const fade = Math.min(1, u / 12, (rain - u) / 12);
      return { kind: snow ? "snow" : "rain", strength: fade, puddles: 0, start, end: start + rain };
    }
    if (!snow && u >= rain && u < rain + puddles) return { kind: null, strength: 0, puddles: 1 - (u - rain) / puddles, start, end: start + rain };
  }
  return { kind: null, strength: 0, puddles: 0 };
}

// ---------- venues: real places only ----------
function venuesOf(layout, graph) {
  const venues = [];
  const sites = layout.plots.filter((p) => p.subject.type !== "building");
  for (const p of layout.plots) {
    if (p.subject.type !== "building" || !graph.doors.has(p.id)) continue;
    if (p.model === "kahve") venues.push({ id: `cay:${p.id}`, kind: "cay", target: graph.doors.get(p.id), plot: p.id, x: p.x, y: p.y });
    if (p.model === "sahaf" || p.model === "kutuphane") venues.push({ id: `sahaf:${p.id}`, kind: "sahaf", target: graph.doors.get(p.id), plot: p.id, x: p.x, y: p.y });
  }
  for (const f of layout.foci) {
    if (f.status !== "open" || !graph.squares.has(f.id)) continue;
    const target = graph.squares.get(f.id);
    if (f.landmark) {
      const pazar = layout.plots.find((p) => p.id === f.of && p.model === "pazar" && p.subject.type === "building");
      if (pazar) {
        const spots = [0, 1, 2, 3].map((k) => [f.x + Math.cos(Math.PI / 4 + k * Math.PI / 2) * f.r * .55, f.y + Math.sin(Math.PI / 4 + k * Math.PI / 2) * f.r * .55]);
        venues.push({ id: `market:${f.id}`, kind: "market", target, spots, x: f.x, y: f.y, plot: pazar.id });
      }
      continue;
    }
    // Benches stand on the squares that are not a fountain's or a garden's (as drawn in world2).
    if (f.id !== "f0" && f.kind !== "cesme" && f.kind !== "bahce") {
      const seats = [[f.x - 1.4, f.y], [f.x + 1.4, f.y], [f.x, f.y - 1.4]];
      venues.push({ id: `bench:${f.id}`, kind: "bench", target, seats, x: f.x, y: f.y });
    }
    // Meeting spots on the diagonals: clear of the benches (on the axes) and the fountain or tree in the middle.
    const spots = [0, 1, 2, 3].map((k) => {
      const a = Math.PI / 4 + (k * Math.PI) / 2,
        r = f.id === "f0" ? f.r * 0.62 : f.r * 0.55;
      return [f.x + Math.cos(a) * r, f.y + Math.sin(a) * r];
    });
    venues.push({ id: `greet:${f.id}`, kind: "greet", target, spots, x: f.x, y: f.y, r: f.r });
    // A small market: a real pazar close to an open square with no site on it.
    const pazar = layout.plots.find((p) => p.model === "pazar" && p.subject.type === "building" && Math.hypot(p.x - f.x, p.y - f.y) < f.r + 14);
    const busy = sites.some((s) => pointRect([f.x, f.y], s.ground) < f.r + 2);
    if (pazar && !busy && f.id !== "f0") venues.push({ id: `market:${f.id}`, kind: "market", target, spots, x: f.x, y: f.y, plot: pazar.id });
  }
  // A market on a street can still receive visitors. Use its actual entrance
  // path rather than inventing an inaccessible square or walking over walls.
  for (const p of layout.plots) {
    if (p.model !== "pazar" || p.subject.type !== "building" || !p.door || !graph.doors.has(p.id) || venues.some((v) => v.kind === "market" && v.plot === p.id)) continue;
    const len = lengthOf(p.door), spots = [.2, .4, .6, .8].map((t) => along(p.door, len * t).p);
    venues.push({ id: `market:${p.id}`, kind: "market", target: graph.doors.get(p.id), spots, x: p.door.at(-1)[0], y: p.door.at(-1)[1], plot: p.id });
  }
  return venues;
}
function natureOf(layout, trees) {
  const out = [];
  const t = layout.terrain;
  // Birds on the bank: river spots near the village, and the pond's shore.
  let ext = [-20, -20, 20, 20];
  for (const p of layout.plots) ext = [Math.min(ext[0], p.plot[0]), Math.min(ext[1], p.plot[1]), Math.max(ext[2], p.plot[2]), Math.max(ext[3], p.plot[3])];
  const near = (x, y, m = 12) => x > ext[0] - m && x < ext[2] + m && y > ext[1] - m && y < ext[3] + m;
  if (t?.river) {
    let run = 0;
    for (let i = 1; i < t.river.pts.length; i++) {
      const a = t.river.pts[i - 1],
        b = t.river.pts[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = (18 - run % 18) % 18; s < len; s += 18) {
        const u = s / len,
          x = a[0] + (b[0] - a[0]) * u,
          y = a[1] + (b[1] - a[1]) * u,
          nx = -(b[1] - a[1]) / len,
          ny = (b[0] - a[0]) / len;
        // The bank on the village's side of the water.
        const side = nx * -x + ny * -y > 0 ? 1 : -1,
          off = t.river.w / 2 + 0.45;
        const bx = x + nx * side * off,
          by = y + ny * side * off;
        if (near(bx, by) && !layout.plots.some((p) => pointRect([bx, by], p.ground) < 1.2)) out.push({ id: `birds:r${i}:${Math.round(s)}`, kind: "birds", x: bx, y: by, dir: [b[0] - a[0], b[1] - a[1]] });
      }
      run += len;
    }
  }
  if (t?.lake) {
    const poly = t.lake.poly;
    for (let i = 0; i < poly.length; i += Math.max(1, Math.floor(poly.length / 6))) {
      const [px, py] = poly[i];
      const x = px + (px - t.lake.cx) * 0.06,
        y = py + (py - t.lake.cy) * 0.06;
      if (near(x, y) && !layout.plots.some((p) => pointRect([x, y], p.ground) < 1.2)) out.push({ id: `birds:l${i}`, kind: "birds", x, y, dir: [-(py - t.lake.cy), px - t.lake.cx] });
    }
  }
  // Fireflies on summer nights: over the pond's banks, in the groves, in garden squares.
  if (t?.lake) {
    const poly = t.lake.poly;
    for (let i = 0; i < poly.length; i += Math.max(1, Math.floor(poly.length / 4))) {
      const [px, py] = poly[i];
      const x = px + (px - t.lake.cx) * 0.18,
        y = py + (py - t.lake.cy) * 0.18;
      if (near(x, y, 30)) out.push({ id: `fireflies:l${i}`, kind: "fireflies", x, y, r: 3 });
    }
  }
  for (const n of t?.nature || []) {
    if (n.kind !== "grove") continue;
    const x = n.poly.reduce((a, p) => a + p[0], 0) / n.poly.length,
      y = n.poly.reduce((a, p) => a + p[1], 0) / n.poly.length;
    out.push({ id: `fireflies:${n.id}`, kind: "fireflies", x, y, r: 3.5 });
  }
  for (const f of layout.foci) if (f.status === "open" && f.kind === "bahce") out.push({ id: `fireflies:${f.id}`, kind: "fireflies", x: f.x, y: f.y, r: f.r * 0.8 });
  // Butterflies over flowering gardens.
  for (const p of layout.plots) if (p.subject.type === "building" && (p.model === "bostan" || p.model === "cicekci")) out.push({ id: `butterflies:${p.id}`, kind: "butterflies", x: (p.plot[0] + p.plot[2]) / 2, y: (p.plot[1] + p.plot[3]) / 2, box: p.plot });
  for (const f of layout.foci) if (f.status === "open" && f.kind === "bahce") out.push({ id: `butterflies:${f.id}`, kind: "butterflies", x: f.x, y: f.y, box: [f.x - f.r, f.y - f.r, f.x + f.r, f.y + f.r] });
  return out;
}

/** The look of the person who lives in a plot: the same neighbour every time. */
export function lookOf(seed, plotId, palette) {
  const r = rng(hash(`${seed}:${plotId}:person`));
  const hat = Math.floor(r() * 3);
  return {
    coat: palette.COATS[Math.floor(r() * palette.COATS.length)],
    skin: palette.SKINS[Math.floor(r() * palette.SKINS.length)],
    hat,
    hatColor: palette.HATS[hat][Math.floor(r() * palette.HATS[hat].length)],
  };
}

/**
 * The village's life. `trees`: [{x, y}] standing trees that can rustle in the wind.
 * at(clockMs, rect, opts) → { people, nature, weather, moving }.
 */
export function createLife({ layout, trees = [] }) {
  const seed = `${layout.seed}:life`;
  const graph = walkGraph(layout);
  const venues = venuesOf(layout, graph);
  const wild = natureOf(layout, trees);
  const homes = layout.plots.filter((p) => p.subject.type === "building" && p.owner && graph.doors.has(p.id) && !p.jetty);
  const trees2 = [...trees].sort((a, b) => hash(`${seed}:${a.x}:${a.y}`) - hash(`${seed}:${b.x}:${b.y}`));
  const reach = new Map();
  // Who can walk to a venue, and by which way (worked out the first time that venue is in view).
  function reachOf(venue) {
    let r = reach.get(venue.id);
    if (r) return r;
    const tree = walksFrom(graph, venue.target, LIFE.maxWalk);
    const list = homes.filter((h) => h.id !== venue.plot && tree.dist.has(graph.doors.get(h.id))).map((h) => h.id);
    r = { tree, homes: list, routes: new Map() };
    reach.set(venue.id, r);
    return r;
  }
  function route(venue, homeId) {
    const r = reachOf(venue);
    if (!r.routes.has(homeId)) r.routes.set(homeId, routeOf(r.tree, graph.doors.get(homeId)));
    return r.routes.get(homeId);
  }
  // One lane's event at clock t (seconds), or null between events.
  function eventOf(id, spec, lane, t) {
    const L = slotOf(spec),
      off = hash(`${seed}:${id}:${lane}`) % Math.round(L),
      n = Math.floor((t + off) / L),
      slotStart = n * L - off;
    const r = rng(hash(`${seed}:${id}:${lane}:${n}`));
    const stay = pick(r, spec.stay);
    const start = slotStart + r() * (spec.gap[1] - spec.gap[0]);
    return { r, n, start, stay, u: t - start };
  }
  // A walk to the venue, a stay at `spot` and the same way home.
  function walker(venue, homeId, ev, spot, extra = 0) {
    const path = route(venue, homeId);
    if (!path) return null;
    const full = spot ? pathOf([...path.pts, spot]) : path;
    const walk = full.total / LIFE.speed;
    const u = ev.u - extra;
    const total = 2 * walk + ev.stay;
    if (u < 0 || u >= total) return null;
    let s,
      walking = true,
      back = false;
    if (u < walk) s = u * LIFE.speed;
    else if (u < walk + ev.stay) [s, walking] = [full.total, false];
    else [s, back] = [full.total - (u - walk - ev.stay) * LIFE.speed, true];
    const p = at(full, s);
    return { home: homeId, x: p.x, y: p.y, walking, face: back ? [-p.dx, -p.dy] : [p.dx, p.dy], step: walking ? ev.u * 7 : null };
  }
  function peopleAt(t, rect, opts) {
    const out = [];
    const shown = ([x, y]) => x > rect[0] && x < rect[2] && y > rect[1] && y < rect[3];
    let group = null;
    for (const v of venues) {
      if (v.x < rect[0] - LIFE.maxWalk || v.x > rect[2] + LIFE.maxWalk || v.y < rect[1] - LIFE.maxWalk || v.y > rect[3] + LIFE.maxWalk) continue;
      const spec = EVENTS[v.kind];
      if (spec.dry && opts.wet) continue;
      if (v.kind === "market" && !opts.group) continue;
      for (let lane = 0; lane < spec.lanes; lane++) {
        const ev = eventOf(v.id, spec, lane, t);
        if (ev.u < 0) continue;
        const r = reachOf(v);
        if (!r.homes.length) continue;
        const choose = (k) => r.homes[Math.floor(ev.r() * r.homes.length + k) % r.homes.length];
        const found = [];
        if (v.kind === "cay" || v.kind === "sahaf") {
          const home = choose(0);
          const w = walker(v, home, ev);
          if (w) {
            // Waiting a step back from the door, the second lane a little behind the first.
            if (!w.walking) {
              const path = route(v, home);
              const p = at(path, path.total - (0.45 + lane * 0.6));
              Object.assign(w, { x: p.x, y: p.y });
            }
            found.push({ ...w, kind: v.kind, id: `${v.id}:${lane}:${ev.n}` });
          }
        } else if (v.kind === "bench") {
          const seat = v.seats[Math.floor(ev.r() * v.seats.length)];
          const w = walker(v, choose(0), ev, seat);
          if (w) found.push({ ...w, kind: "bench", seated: !w.walking, id: `${v.id}:${ev.n}` });
        } else if (v.kind === "greet") {
          if (r.homes.length < 2) continue;
          const spot = v.spots[Math.floor(ev.r() * 4)];
          const a = choose(0),
            b = choose(1 + Math.floor(ev.r() * (r.homes.length - 1)));
          if (a === b) continue;
          // They meet face to face on screen: a little apart along the screen's horizontal.
          const [pa, pb] = [route(v, a), route(v, b)];
          if (!pa || !pb) continue;
          const wa = pa.total / LIFE.speed,
            wb = pb.total / LIFE.speed;
          // The nearer one leaves later so both arrive together.
          const lead = Math.max(wa, wb);
          const A = walker(v, a, { ...ev, u: ev.u - (lead - wa) }, [spot[0] + 0.3, spot[1] - 0.3]);
          const B = walker(v, b, { ...ev, u: ev.u - (lead - wb) }, [spot[0] - 0.3, spot[1] + 0.3]);
          if (A && B) found.push({ ...A, kind: "greet", id: `${v.id}:${ev.n}:a` }, { ...B, kind: "greet", id: `${v.id}:${ev.n}:b` });
        } else if (v.kind === "market") {
          if (r.homes.length < 4) continue;
          const first = Math.floor(ev.r() * r.homes.length);
          const crowd = [];
          for (let k = 0; k < 4; k++) {
            const home = r.homes[(first + k * Math.max(1, Math.floor(r.homes.length / 4))) % r.homes.length];
            const w = walker(v, home, { ...ev, u: ev.u - k * 6 }, v.spots[k]);
            if (w) crowd.push({ ...w, kind: "market", id: `${v.id}:${ev.n}:${k}` });
          }
          if (crowd.length && (!group || cmp(v.id, group.id) < 0) && crowd.some((w) => shown([w.x, w.y]))) group = { id: v.id, crowd };
          continue;
        }
        for (const f of found) if (shown([f.x, f.y])) out.push(f);
      }
    }
    // One neighbour is in one place at a time; the oldest visit keeps them.
    const seen = new Set();
    const order = (a, b) => cmp(a.id, b.id);
    const keep = [];
    for (const f of [...(group?.crowd || []), ...out.sort(order)]) {
      if (seen.has(f.home)) continue;
      seen.add(f.home);
      keep.push(f);
    }
    const crowd = keep.filter((f) => f.kind === "market");
    const capped = [];
    for (const f of keep) {
      if (f.kind === "market" || capped.includes(f)) continue;
      // A greeting pair is kept or dropped together.
      const twin = f.kind === "greet" ? keep.find((g) => g !== f && g.kind === "greet" && g.id.slice(0, -2) === f.id.slice(0, -2)) : null;
      if (capped.length + (twin ? 2 : 1) > opts.cap) continue;
      capped.push(f);
      if (twin) capped.push(twin);
    }
    return [...capped, ...crowd].slice(0, LIFE.people);
  }
  function natureAt(t, rect, sky, weather) {
    if (weather.kind) return null;
    const shown = (x, y) => x > rect[0] && x < rect[2] && y > rect[1] && y < rect[3];
    if (sky.night >= 0.5 && (sky.season === "spring" || sky.season === "summer")) {
      let best = null;
      for (const w of wild) {
        if (w.kind !== "fireflies" || !shown(w.x, w.y)) continue;
        const ev = eventOf(w.id, EVENTS.fireflies, 0, t);
        if (ev.u < 0 || ev.u >= ev.stay) continue;
        if (!best || cmp(w.id, best.w.id) < 0) best = { w, ev };
      }
      if (best) return { kind: "fireflies", id: best.w.id, x: best.w.x, y: best.w.y, r: best.w.r, u: best.ev.u, stay: best.ev.stay, count: 8 };
    }
    if (sky.night < 0.5) {
      for (const kind of ["birds", "butterflies"]) {
        if (kind === "butterflies" && sky.season !== "spring" && sky.season !== "summer") continue;
        let best = null;
        for (const w of wild) {
          if (w.kind !== kind || !shown(w.x, w.y)) continue;
          const ev = eventOf(w.id, EVENTS[kind], 0, t);
          if (ev.u < 0 || ev.u >= ev.stay) continue;
          if (!best || cmp(w.id, best.w.id) < 0) best = { w, ev };
        }
        if (best) return { kind, id: best.w.id, x: best.w.x, y: best.w.y, dir: best.w.dir, box: best.w.box, u: best.ev.u, stay: best.ev.stay, count: kind === "birds" ? 3 : 2 };
      }
    }
    // A breath of wind: up to six trees in view rustle together.
    const ev = eventOf("wind", EVENTS.wind, 0, t);
    if (ev.u >= 0 && ev.u < ev.stay) {
      const list = trees2.filter((tr) => shown(tr.x, tr.y)).slice(0, 6);
      if (list.length) return { kind: "wind", trees: list, u: ev.u, stay: ev.stay };
    }
    return null;
  }
  // Where rain leaves puddles: the paved squares (a low, hard surface), clear of the benches and fountains.
  const puddles = [];
  for (const f of layout.foci) {
    if (f.status !== "open") continue;
    const r = rng(hash(`${seed}:${f.id}:puddles`));
    for (let k = 0; k < 3; k++) {
      const a = r() * Math.PI * 2,
        d = f.r * (0.3 + r() * 0.45),
        size = 0.4 + r() * 0.5;
      const x = f.x + Math.cos(a) * d,
        y = f.y + Math.sin(a) * d;
      if (d - size < 1.2 || [[-1.4, 0], [1.4, 0], [0, -1.4]].some(([bx, by]) => Math.hypot(x - f.x - bx, y - f.y - by) < size + 0.8)) continue;
      puddles.push({ x, y, size });
    }
  }
  // ---------- n49: ducks on the pond, a rowing boat on the river ----------
  const lake = layout.terrain?.lake;
  let lap = null,
    home = 0;
  if (lake) {
    const pts = lake.poly.map(([x, y]) => [lake.cx + (x - lake.cx) * DUCKS.inset, lake.cy + (y - lake.cy) * DUCKS.inset]);
    lap = pathOf([...pts, pts[0]]);
    // They rest at the point of their lap nearest the village.
    let best = Infinity;
    pts.forEach(([x, y], i) => {
      if (Math.hypot(x, y) < best) [best, home] = [Math.hypot(x, y), lap.lengths[i]];
    });
  }
  // A lap of the pond now and then; in between (and with motion off) a still row by the shore.
  function ducksAt(t, motion) {
    if (!lap) return null;
    const swim = lap.total / DUCKS.speed;
    const ev = eventOf("ducks", { ...EVENTS.ducks, stay: [swim, swim] }, 0, t);
    const moving = motion === "full" && ev.u >= 0 && ev.u < swim;
    const lead = home + (moving ? ev.u * DUCKS.speed : 0);
    const brood = [];
    for (let k = 0; k <= DUCKS.brood; k++) {
      const s = (((lead - k * 0.55 - (k ? 0.25 : 0)) % lap.total) + lap.total) % lap.total;
      const p = at(lap, s),
        q = at(lap, Math.min(lap.total, s + 0.3));
      brood.push({ x: p.x, y: p.y, dx: q.x - p.x, dy: q.y - p.y, big: k === 0 });
    }
    return { moving, brood, u: moving ? ev.u : 0 };
  }
  const river = layout.terrain?.river;
  let reachLine = null;
  if (river) {
    const near = linePoint(river.pts, [0, 0]),
      len = lengthOf(river.pts);
    const pts = [];
    for (let s = Math.max(0, near.at - BOAT.reach); s <= Math.min(len, near.at + BOAT.reach); s += 2) pts.push(along(river.pts, s).p);
    if (pts.length > 1) reachLine = pathOf(pts);
  }
  // Someone rows past the village by day, up or down the river.
  function boatAt(t, sky, weather) {
    if (!reachLine || weather.kind || sky.night >= 0.6) return null;
    const trip = reachLine.total / BOAT.speed;
    const ev = eventOf("boat", { ...EVENTS.boat, stay: [trip, trip] }, 0, t);
    if (ev.u < 0 || ev.u >= trip) return null;
    const down = ev.r() < 0.5;
    const s = down ? ev.u * BOAT.speed : reachLine.total - ev.u * BOAT.speed;
    const p = at(reachLine, s),
      q = at(reachLine, s + (down ? 0.5 : -0.5));
    return { id: `boat:${ev.n}`, x: p.x, y: p.y, dx: q.x - p.x, dy: q.y - p.y, u: ev.u };
  }
  return {
    graph,
    venues,
    wild,
    puddles,
    /**
     * rect: the world rectangle in view [x0, y0, x1, y1]. opts: { cap, lod,
     * motion: "full"|"calm"|"still", sky: { night, season }, focus }.
     */
    at(clockMs, rect, { lod = 1, motion = "full", sky = { night: 0, season: "summer" }, focus = false } = {}) {
      const t = clockMs / 1000;
      const weather = weatherAt(seed, clockMs, sky.season);
      // Calm and still rest the ambient life; the weather stays as a still state.
      if (motion !== "full" || lod === 0) return { people: [], nature: null, weather, ducks: lod > 0 ? ducksAt(t, "still") : null, boat: null, moving: motion === "full" && !!weather.kind };
      const cap = Math.min(focus ? LIFE.focusPeople : LIFE.lodPeople[lod], LIFE.people);
      // Rain, and late at night, keeps people off the benches and squares; tea and books carry on.
      const people = peopleAt(t, rect, { cap, wet: !!weather.kind || sky.night >= 0.75, group: !focus });
      const nature = natureAt(t, rect, sky, weather);
      const inView = ({ x, y }) => x > rect[0] - 2 && x < rect[2] + 2 && y > rect[1] - 2 && y < rect[3] + 2;
      const ducks = ducksAt(t, motion);
      const boat = boatAt(t, sky, weather);
      const shownBoat = boat && inView(boat) ? boat : null;
      return { people, nature, weather, ducks, boat: shownBoat, moving: !!weather.kind || !!nature || people.some((p) => p.walking) || (!!ducks?.moving && ducks.brood.some(inView)) || !!shownBoat };
    },
  };
}

/** Whether a point is on the village's walkable ground (streets, door paths, squares) and inside no building. */
export function walkable(layout, [x, y], slack = 0.06) {
  const roads = new Map(layout.roads.map((r) => [r.id, r]));
  for (const p of layout.plots) {
    const g = p.ground;
    if (!(x > g[0] + slack && x < g[2] - slack && y > g[1] + slack && y < g[3] - slack)) continue;
    // Inside a plot's ground only on its own porch (the door path) or a bridge's deck.
    const deck = !p.door && roads.get(p.road);
    if (deck && linePoint(deck.pts, [x, y]).d <= deck.w / 2 + slack) continue;
    if (p.door && linePoint(p.door, [x, y]).d <= 0.3 + slack) continue;
    return false;
  }
  for (const r of layout.roads) if (r.status === "usable" && linePoint(r.pts, [x, y]).d <= r.w / 2 + slack) return true;
  for (const p of layout.plots) if (p.door && linePoint(p.door, [x, y]).d <= 0.3 + slack) return true;
  for (const f of layout.foci) if (f.status === "open" && Math.hypot(f.x - x, f.y - y) <= f.r + slack) return true;
  if (layout.terrain?.lake && inPolygon([x, y], layout.terrain.lake.poly)) return false;
  return false;
}

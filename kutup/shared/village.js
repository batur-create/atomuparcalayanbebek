// Kütüp köyü layout. Deterministic and shared: the server uses it once, when a
// building is finished, to choose a spot that is then stored for good; the client
// uses it to draw the ground, lanes, ponds and trees from the same seeds.
//
// The village grows around the central square (the future Milli Kütüphane
// monument). Districts sit on a jittered hex lattice and fill ring by ring. Every
// lattice cell — built or not — owns a fixed lane network: a curved lane from the
// gate facing the square to a small hub, and lanes on to the cells further out.
// Roads therefore never cut through houses that were placed earlier.

export const CAPACITY = 9; // buildings per district
export const SPACING = 31; // between neighbouring district centres (world units)
export const RADIUS = 13; // district radius before its edge wobbles
export const PLAZA = 6.5; // radius of the central square
export const LANE = 1.05; // half width of a lane
// Space a finished building claims around its centre (walls, garden, a bit of air).
export const FOOTPRINT = { cottage: 2.35, house: 2.85, tower: 2.55 };

export const kindFor = (minutes) =>
  minutes >= 70 ? "tower" : minutes >= 40 ? "house" : "cottage";

export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1000000000;
}
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- the lattice ----------
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const ROOT2 = Math.SQRT2;
export const cellKey = (q, r) => `${q},${r}`;
export const ringOf = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
// Hex centre, turned 45° so that the first neighbours lie left and right on screen.
function baseCenter(q, r) {
  const hx = SPACING * (q + r / 2),
    hy = SPACING * ((r * Math.sqrt(3)) / 2);
  return [(hx + hy) / ROOT2, (hy - hx) / ROOT2];
}
// Screen position of a world point (isometric, unit scale).
export const screenOf = (x, y, z = 0) => [(x - y) * 0.866, (x + y) * 0.5 - z];

// Cells nearer the square first; within a ring, the ones lying most to the
// left/right of the screen first, because phones show a wide strip of the village.
function orderKey(q, r) {
  const [x, y] = baseCenter(q, r);
  const [sx, sy] = screenOf(x, y);
  const angle = Math.atan2(sy, sx);
  return [ringOf(q, r), Math.round(Math.abs(Math.sin(angle)) * 1000), sx > 0 ? 0 : 1, angle];
}
const compareKeys = (a, b) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};
const spiralCache = [];
export function spiral(maxRing) {
  if (spiralCache.length && spiralCache.maxRing >= maxRing) return spiralCache;
  const list = [];
  for (let q = -maxRing; q <= maxRing; q++)
    for (let r = -maxRing; r <= maxRing; r++) {
      const ring = ringOf(q, r);
      if (ring >= 1 && ring <= maxRing) list.push({ q, r, key: orderKey(q, r) });
    }
  list.sort((a, b) => compareKeys(a.key, b.key));
  spiralCache.length = 0;
  spiralCache.push(...list.map(({ q, r }) => [q, r]));
  spiralCache.maxRing = maxRing;
  return spiralCache;
}
// The neighbour one step closer to the square (the square itself for ring 1).
export function parentOf(q, r) {
  const ring = ringOf(q, r);
  if (ring <= 1) return [0, 0];
  let best = null;
  for (const [dq, dr] of DIRS) {
    const nq = q + dq,
      nr = r + dr;
    if (ringOf(nq, nr) !== ring - 1) continue;
    const [x, y] = baseCenter(nq, nr);
    const d = x * x + y * y;
    if (!best || d < best.d - 1e-6) best = { q: nq, r: nr, d };
  }
  return [best.q, best.r];
}
export const neighbours = (q, r) => DIRS.map(([dq, dr]) => [q + dq, r + dr]);
const childrenOf = (q, r) =>
  neighbours(q, r).filter(([nq, nr]) => {
    if (ringOf(nq, nr) !== ringOf(q, r) + 1) return false;
    const [pq, pr] = parentOf(nq, nr);
    return pq === q && pr === r;
  });

// ---------- one cell ----------
function bezier(a, c, b, steps = 10) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}
function curve(a, b, bend) {
  const mx = (a[0] + b[0]) / 2,
    my = (a[1] + b[1]) / 2,
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    len = Math.hypot(dx, dy) || 1;
  return bezier(a, [mx - (dy / len) * bend, my + (dx / len) * bend], b);
}
function segDistance(p, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
export function lineDistance(p, line) {
  let best = Infinity,
    at = 0;
  for (let i = 1; i < line.length; i++) {
    const d = segDistance(p, line[i - 1], line[i]);
    if (d < best) {
      best = d;
      at = i;
    }
  }
  return { d: best, at };
}
export function nearestOnLine(p, line) {
  let best = { d: Infinity, point: line[0] };
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i],
      dx = b[0] - a[0],
      dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const q = [a[0] + t * dx, a[1] + t * dy],
      d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < best.d) best = { d, point: q };
  }
  return best;
}

const layoutCache = new Map();
export function cellLayout(groupKey, q, r) {
  const cacheKey = `${groupKey}|${q},${r}`;
  if (layoutCache.has(cacheKey)) return layoutCache.get(cacheKey);
  if (layoutCache.size > 600) layoutCache.clear();
  const seed = hashSeed(`${groupKey}:${q}:${r}`);
  const R = rng(seed);
  const [bx, by] = baseCenter(q, r);
  const plaza = q === 0 && r === 0;
  const center = plaza ? [0, 0] : [bx + (R() * 2 - 1) * 2.2, by + (R() * 2 - 1) * 2.2];
  const waves = [2, 3, 5].map((freq, i) => ({ freq, amp: [0.85, 0.55, 0.35][i] * (0.7 + R() * 0.6), phase: R() * Math.PI * 2 }));
  const radiusAt = (angle) =>
    plaza ? PLAZA : RADIUS + waves.reduce((s, w) => s + w.amp * Math.sin(w.freq * angle + w.phase), 0);
  const edge = (angle, inset = 0) => [
    center[0] + Math.cos(angle) * (radiusAt(angle) - inset),
    center[1] + Math.sin(angle) * (radiusAt(angle) - inset),
  ];
  const towards = ([q2, r2]) => {
    const other = q2 === 0 && r2 === 0 ? [0, 0] : cellCenter(groupKey, q2, r2);
    return Math.atan2(other[1] - center[1], other[0] - center[0]);
  };
  const boundary = [];
  for (let i = 0; i < 40; i++) boundary.push(edge((i / 40) * Math.PI * 2));
  const layout = { q, r, seed, center, radiusAt, boundary, plaza, lanes: [], gates: {}, trees: [], pond: null, hill: null };
  const children = childrenOf(q, r);
  if (plaza) {
    for (const child of children) layout.gates[cellKey(...child)] = edge(towards(child));
    layoutCache.set(cacheKey, layout);
    return layout;
  }
  const parent = parentOf(q, r);
  const entranceAngle = towards(parent);
  layout.entrance = edge(entranceAngle);
  layout.entranceAngle = entranceAngle;
  const hub = [center[0] + (R() * 2 - 1) * 1.6, center[1] + (R() * 2 - 1) * 1.6];
  layout.hub = hub;
  layout.lanes.push(curve(layout.entrance, hub, (R() * 2 - 1) * 2.6));
  for (const child of children) {
    const gate = edge(towards(child));
    layout.gates[cellKey(...child)] = gate;
    layout.lanes.push(curve(hub, gate, (R() * 2 - 1) * 2.6));
  }
  // A cell on the rim of a ring may have no cell beyond it: give it a short
  // garden lane anyway so the hub never looks like a dead end.
  if (!children.length) {
    const a = entranceAngle + Math.PI + (R() * 2 - 1) * 0.7;
    layout.lanes.push(curve(hub, edge(a, 3.2), (R() * 2 - 1) * 1.8));
  }
  const laneDistance = (p) => Math.min(...layout.lanes.map((l) => lineDistance(p, l).d));
  // The name sign stands just inside the entrance, beside the lane.
  const side = R() < 0.5 ? 1 : -1;
  const inward = entranceAngle + Math.PI;
  layout.sign = [
    layout.entrance[0] + Math.cos(entranceAngle) * -1.6 + Math.cos(inward + Math.PI / 2) * 2.0 * side,
    layout.entrance[1] + Math.sin(entranceAngle) * -1.6 + Math.sin(inward + Math.PI / 2) * 2.0 * side,
  ];
  // A pond in about half of the districts, away from the lanes.
  if (R() < 0.55)
    for (let tries = 0; tries < 8; tries++) {
      const a = R() * Math.PI * 2,
        d = RADIUS * (0.35 + R() * 0.3),
        rx = 1.7 + R() * 1.1,
        p = [center[0] + Math.cos(a) * d, center[1] + Math.sin(a) * d];
      if (laneDistance(p) > rx + LANE + 0.9 && Math.hypot(p[0] - center[0], p[1] - center[1]) + rx < radiusAt(a) - 1) {
        layout.pond = { x: p[0], y: p[1], rx, ry: rx * (0.62 + R() * 0.25), seed: Math.floor(R() * 1e6) };
        break;
      }
    }
  // Tree clumps fill whatever the houses leave free; the client drops any tree
  // that would stand on a lane, a pond or a building.
  const clumps = 2 + Math.floor(R() * 3);
  for (let k = 0; k < clumps; k++) {
    const a = R() * Math.PI * 2,
      d = RADIUS * (0.45 + R() * 0.5),
      cx = center[0] + Math.cos(a) * d,
      cy = center[1] + Math.sin(a) * d,
      n = 3 + Math.floor(R() * 5);
    for (let i = 0; i < n; i++)
      layout.trees.push({ x: cx + (R() * 2 - 1) * 2.4, y: cy + (R() * 2 - 1) * 2.4, size: 0.75 + R() * 0.5, tone: R() });
  }
  if (R() < 0.6) {
    const a = R() * Math.PI * 2;
    layout.hill = { x: center[0] + Math.cos(a) * RADIUS * 0.5, y: center[1] + Math.sin(a) * RADIUS * 0.5, r: 4 + R() * 3 };
  }
  layout.laneDistance = laneDistance;
  layoutCache.set(cacheKey, layout);
  return layout;
}
function cellCenter(groupKey, q, r) {
  // Only the centre is needed for gate directions; cheap and recursion-free.
  const R = rng(hashSeed(`${groupKey}:${q}:${r}`));
  const [bx, by] = baseCenter(q, r);
  return [bx + (R() * 2 - 1) * 2.2, by + (R() * 2 - 1) * 2.2];
}

// ---------- placing a building ----------
const candidateCache = new Map();
function candidates(layout) {
  if (candidateCache.has(layout.seed)) return candidateCache.get(layout.seed);
  if (candidateCache.size > 300) candidateCache.clear();
  const R = rng(layout.seed + 7);
  const list = [];
  for (let i = 0; i < 420; i++) {
    const a = R() * Math.PI * 2,
      d = Math.sqrt(R()) * RADIUS * 1.05;
    const p = [layout.center[0] + Math.cos(a) * d, layout.center[1] + Math.sin(a) * d];
    const lane = Math.min(...layout.lanes.map((l) => lineDistance(p, l).d));
    list.push({ p, a, d, lane, jitter: R() });
  }
  candidateCache.set(layout.seed, list);
  return list;
}
// Door towards the lane: facing 0 puts it on the screen-left wall, 1 on the right.
function facingFor(layout, p) {
  let best = { d: Infinity, point: p };
  for (const lane of layout.lanes) {
    const n = nearestOnLine(p, lane);
    if (n.d < best.d) best = n;
  }
  return best.point[1] - p[1] >= best.point[0] - p[0] ? 0 : 1;
}
// Every candidate spot for a footprint, best first, that is free of the edge,
// the lanes, the pond, the sign and the buildings already standing.
function* freeIn(layout, existing, kind) {
  if (layout.plaza) return;
  const fp = FOOTPRINT[kind] || FOOTPRINT.cottage;
  const ideal = fp * 0.72 + LANE + 0.5;
  const ranked = candidates(layout)
    .map((c) => ({ c, score: Math.abs(c.lane - ideal) + 0.05 * c.d + c.jitter * 1.6 }))
    .sort((a, b) => a.score - b.score);
  for (const { c } of ranked) {
    const [x, y] = c.p;
    if (c.d + fp > layout.radiusAt(c.a) - 0.25) continue;
    if (c.lane < fp * 0.72 + LANE + 0.1) continue;
    if (layout.pond && Math.hypot(x - layout.pond.x, y - layout.pond.y) < fp + layout.pond.rx + 0.4) continue;
    if (Math.hypot(x - layout.sign[0], y - layout.sign[1]) < fp + 0.9) continue;
    if (existing.some((b) => Math.hypot(x - b.x, y - b.y) < fp + (FOOTPRINT[b.kind] || 2.4) + 0.25)) continue;
    const round = (v) => Math.round(v * 100) / 100;
    yield { x: round(x), y: round(y), facing: facingFor(layout, c.p) };
  }
}
/** First free, natural-looking spot for `kind`, or null when the district is full. */
export function placeIn(layout, existing, kind) {
  for (const spot of freeIn(layout, existing, kind)) return spot;
  return null;
}
/** Up to `limit` free spots for `kind`, spread apart: where a building can be moved. */
export function freeSpots(layout, existing, kind, limit = 6) {
  const fp = FOOTPRINT[kind] || FOOTPRINT.cottage,
    out = [];
  for (const spot of freeIn(layout, existing, kind)) {
    if (out.some((o) => Math.hypot(o.x - spot.x, o.y - spot.y) < fp * 1.6)) continue;
    out.push(spot);
    if (out.length >= limit) break;
  }
  return out;
}

// ---------- districts ----------
/**
 * Picks a lattice cell for a member. `cells` maps "q,r" → { memberId } for every
 * existing district (memberId null = an empty plot left by someone who quit).
 * A newcomer takes the free cell closest to the square; someone whose districts
 * are full gets a cell next to their own, so the village grows outward.
 */
export function chooseCell(cells, own = []) {
  const free = (q, r) => {
    const cell = cells.get(cellKey(q, r));
    return ringOf(q, r) >= 1 && (!cell || !cell.memberId);
  };
  let maxRing = 3;
  for (const key of cells.keys()) {
    const [q, r] = key.split(",").map(Number);
    maxRing = Math.max(maxRing, ringOf(q, r) + 2);
  }
  const order = spiral(maxRing);
  const rank = new Map(order.map(([q, r], i) => [cellKey(q, r), i]));
  if (own.length) {
    const next = [];
    for (const [q, r] of own)
      for (const [nq, nr] of neighbours(q, r))
        if (free(nq, nr) && rank.has(cellKey(nq, nr))) next.push([nq, nr]);
    if (next.length) return next.sort((a, b) => rank.get(cellKey(...a)) - rank.get(cellKey(...b)))[0];
    // Boxed in: the free cell nearest to their newest district.
    const [lq, lr] = own[own.length - 1];
    const [lx, ly] = baseCenter(lq, lr);
    let best = null;
    for (const [q, r] of order) {
      if (!free(q, r)) continue;
      const [x, y] = baseCenter(q, r);
      const d = Math.hypot(x - lx, y - ly);
      if (!best || d < best.d) best = { cell: [q, r], d };
    }
    return best.cell;
  }
  return order.find(([q, r]) => free(q, r));
}

/**
 * In-memory view of one group's districts and buildings that hands out spots.
 * districts: [{ id, memberId, q, r }] oldest first; buildings: [{ districtId, kind, x, y }].
 * Every decision updates the view, so several placements in one go never collide.
 */
export function createPlanner(groupKey, districts, buildings, fullIds = []) {
  const list = districts.map((d) => ({ ...d }));
  const byCell = () => new Map(list.map((d) => [cellKey(d.q, d.r), d]));
  const inside = new Map(list.map((d) => [d.id, []]));
  for (const b of buildings) if (inside.has(b.districtId)) inside.get(b.districtId).push(b);
  // Full districts are only counted, never loaded.
  for (const id of fullIds) if (inside.has(id)) inside.set(id, { length: CAPACITY });
  const mine = (memberId) => list.filter((d) => d.memberId === memberId);
  // Returns { district, change } where change is "insert", "claim" or null.
  function takeCell(memberId, newId) {
    const own = mine(memberId).map((d) => [d.q, d.r]);
    const [q, r] = chooseCell(byCell(), own);
    const existing = list.find((d) => d.q === q && d.r === r);
    if (existing) {
      existing.memberId = memberId;
      // Move it to the end: districts are tried oldest first.
      list.splice(list.indexOf(existing), 1);
      list.push(existing);
      return { district: existing, change: "claim" };
    }
    const district = { id: newId(), memberId, q, r, seed: hashSeed(`${groupKey}:${q}:${r}`) };
    list.push(district);
    inside.set(district.id, []);
    return { district, change: "insert" };
  }
  return {
    districts: list,
    /** A district for someone who just joined (or had none yet). */
    ensure(memberId, newId) {
      const own = mine(memberId);
      if (own.length) return { district: own[own.length - 1], change: null };
      return takeCell(memberId, newId);
    },
    /** Where the next building of `kind` goes; opens a new district when needed. */
    place(memberId, kind, newId, { allocate = true } = {}) {
      const changes = [];
      for (const district of mine(memberId)) {
        const placed = inside.get(district.id);
        if (placed.length >= CAPACITY) continue;
        const spot = placeIn(cellLayout(groupKey, district.q, district.r), placed, kind);
        if (spot) {
          placed.push({ districtId: district.id, kind, ...spot });
          return { ...spot, district, changes };
        }
      }
      if (!allocate) return null;
      for (let tries = 0; tries < 4; tries++) {
        const taken = takeCell(memberId, newId);
        changes.push(taken);
        const spot = placeIn(cellLayout(groupKey, taken.district.q, taken.district.r), inside.get(taken.district.id), kind);
        if (spot) {
          inside.get(taken.district.id).push({ districtId: taken.district.id, kind, ...spot });
          return { ...spot, district: taken.district, changes };
        }
      }
      return null;
    },
  };
}

/** Every lane and road that links the given districts to the square. */
export function roadNetwork(groupKey, cells) {
  const seen = new Set(),
    lanes = [],
    links = [],
    stubs = [];
  for (const [q, r] of cells) {
    let cq = q,
      cr = r;
    while (!(cq === 0 && cr === 0) && !seen.has(cellKey(cq, cr))) {
      seen.add(cellKey(cq, cr));
      const layout = cellLayout(groupKey, cq, cr);
      const [pq, pr] = parentOf(cq, cr);
      const parent = cellLayout(groupKey, pq, pr);
      links.push([parent.gates[cellKey(cq, cr)] || parent.center, layout.entrance]);
      lanes.push(...layout.lanes);
      cq = pq;
      cr = pr;
    }
  }
  return { lanes, links, stubs, cells: seen };
}

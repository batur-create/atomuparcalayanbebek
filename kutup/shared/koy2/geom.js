// n46 köy v2: plain plane geometry shared by the server (placement checks) and
// the app (drawing). World units (1 = 1.6 m); x and y on the ground, z up.
// Every building stands axis-aligned (the drawings support two facings), so
// ground shapes are rectangles [x0, y0, x1, y1]; roads, rivers and rails are
// polylines with a width. Nothing here reads a clock or Math.random.

/** Coordinates are kept on a 1/1024 grid so the same input always stores the same numbers. */
export const Q = 1024;
export const q = (v) => Math.round(v * Q) / Q;

export const rect = (x0, y0, x1, y1) => [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
export const grow = (r, m) => [r[0] - m, r[1] - m, r[2] + m, r[3] + m];
export const union = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
export const centre = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
export const area = (r) => Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
/** Positive overlap of two rectangles (0 when they only touch or are apart). */
export const overlap = (a, b) => area([Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]);
export const rectsHit = (a, b, margin = 0) => a[0] < b[2] + margin && b[0] < a[2] + margin && a[1] < b[3] + margin && b[1] < a[3] + margin;
export const inside = (p, r) => p[0] >= r[0] && p[0] <= r[2] && p[1] >= r[1] && p[1] <= r[3];

export function pointRect(p, r) {
  const dx = Math.max(r[0] - p[0], 0, p[0] - r[2]),
    dy = Math.max(r[1] - p[1], 0, p[1] - r[3]);
  return Math.hypot(dx, dy);
}
export function pointSeg(p, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
export function segsCross(a, b, c, d) {
  const d1 = cross(c, d, a),
    d2 = cross(c, d, b),
    d3 = cross(a, b, c),
    d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
/** Shortest distance between a segment and a rectangle (0 when they meet). */
export function segRect(a, b, r) {
  if (inside(a, r) || inside(b, r)) return 0;
  const c = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
  for (let i = 0; i < 4; i++) if (segsCross(a, b, c[i], c[(i + 1) % 4])) return 0;
  return Math.min(pointRect(a, r), pointRect(b, r), ...c.map((p) => pointSeg(p, a, b)));
}
export function lineRect(line, r) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    best = Math.min(best, segRect(line[i - 1], line[i], r));
    if (best === 0) return 0;
  }
  return best;
}
export function linePoint(line, p) {
  let best = { d: Infinity, at: 0, point: line[0], seg: 1 };
  let run = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy) || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (len * len)));
    const point = [a[0] + t * dx, a[1] + t * dy],
      d = Math.hypot(p[0] - point[0], p[1] - point[1]);
    if (d < best.d) best = { d, at: run + t * len, point, seg: i };
    run += len;
  }
  return best;
}
export function linesCross(l1, l2) {
  for (let i = 1; i < l1.length; i++) for (let j = 1; j < l2.length; j++) if (segsCross(l1[i - 1], l1[i], l2[j - 1], l2[j])) return true;
  return false;
}
export function lineLine(l1, l2) {
  if (linesCross(l1, l2)) return 0;
  let best = Infinity;
  for (const p of l1) best = Math.min(best, linePoint(l2, p).d);
  for (const p of l2) best = Math.min(best, linePoint(l1, p).d);
  return best;
}
export const lengthOf = (line) => line.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) : 0), 0);
/** Point and unit direction at distance `s` along a polyline. */
export function along(line, s) {
  let run = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (run + len >= s || i === line.length - 1) {
      const t = len ? Math.max(0, Math.min(1, (s - run) / len)) : 0;
      return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dir: len ? [(b[0] - a[0]) / len, (b[1] - a[1]) / len] : [1, 0] };
    }
    run += len;
  }
  return { p: line[0], dir: [1, 0] };
}
export function bend(a, b, amount, steps = 8) {
  const mx = (a[0] + b[0]) / 2,
    my = (a[1] + b[1]) / 2,
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    len = Math.hypot(dx, dy) || 1;
  const c = [mx - (dy / len) * amount, my + (dx / len) * amount];
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      u = 1 - t;
    out.push([q(u * u * a[0] + 2 * u * t * c[0] + t * t * b[0]), q(u * u * a[1] + 2 * u * t * c[1] + t * t * b[1])]);
  }
  return out;
}
export function inPolygon(p, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1] || 1e-12) + a[0]) hit = !hit;
  }
  return hit;
}
/** Distance from a rectangle to a polygon's area (0 when they meet). */
export function rectPolygon(r, poly) {
  const corners = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
  if (corners.some((c) => inPolygon(c, poly)) || poly.some((p) => inside(p, r))) return 0;
  return lineRect([...poly, poly[0]], r);
}
/** True when the whole rectangle lies inside the polygon, at least `inset` from its edge. */
export function rectWithin(r, poly, inset = 0) {
  const corners = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
  if (!corners.every((c) => inPolygon(c, poly))) return false;
  return lineRect([...poly, poly[0]], r) >= inset;
}

// ---------- deterministic numbers ----------
/** FNV-1a over a string: stable across hosts and runs. */
export function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Byte-order string comparison (never localeCompare: hosts differ). */
export const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ---------- isometric screen ----------
export const screenOf = (x, y, z = 0) => [(x - y) * 0.866, (x + y) * 0.5 - z];
/** Screen box of a rectangle standing `h` tall: [sx0, sy0, sx1, sy1]. */
export function screenBox(r, h = 0, z = 0) {
  const pts = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]].flatMap(([x, y]) => [screenOf(x, y, z), screenOf(x, y, z + h)]);
  return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
}

// ---------- spatial index ----------
/** A coarse grid of rectangles (cell `size` world units) for neighbourhood queries. */
export function createIndex(size = 16) {
  const cells = new Map();
  const keys = (r) => {
    const out = [];
    for (let i = Math.floor(r[0] / size); i <= Math.floor(r[2] / size); i++) for (let j = Math.floor(r[1] / size); j <= Math.floor(r[3] / size); j++) out.push(`${i},${j}`);
    return out;
  };
  return {
    add(r, item) {
      for (const k of keys(r)) {
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push(item);
      }
    },
    near(r) {
      const seen = new Set();
      for (const k of keys(r)) for (const item of cells.get(k) || []) seen.add(item);
      return [...seen];
    },
  };
}
/** Bounding rectangle of a polyline. */
export const lineBounds = (line, pad = 0) => [
  Math.min(...line.map((p) => p[0])) - pad,
  Math.min(...line.map((p) => p[1])) - pad,
  Math.max(...line.map((p) => p[0])) + pad,
  Math.max(...line.map((p) => p[1])) + pad,
];

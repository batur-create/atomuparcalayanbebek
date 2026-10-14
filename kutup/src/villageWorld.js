// Turns the /api/village rows into a drawable world: ground, lanes, ponds, trees,
// buildings, signs and lamps, each with a screen-space box and a depth, indexed
// in a coarse grid so the map only draws what a tile or the viewport needs.
import {
  FOOTPRINT, LANE, PLAZA, cellKey, cellLayout, lineDistance, nearestOnLine, parentOf, roadNetwork, screenOf,
} from "../shared/village.js";
import {
  LIT, STONE, WOOD, box, buildingSVG, chimneyTop, circle, ellipse, mirrored, poly, ridgeOf, rng, seg, spec,
} from "./iso.js";

export const GROUND = "#a4d078";
const MEADOW = "#b3da88",
  // A soft, wide band instead of a hard outline where a district meets the fields.
  MEADOW_EDGE = "#a8d07d",
  FLOWERS = ["#ffffff", "#f7d154", "#f29bb8", "#b9a3ea"],
  PLOT = "#c9d98f",
  ROAD = "#ecdcb9",
  ROAD_EDGE = "#cfb98f",
  TRACK = "#d8c69f",
  WATER = "#8ec8dc",
  PLAZA_STONE = "#e7dece",
  PLAZA_RING = "#d2c5ae";
export const MEMBER_COLORS = {
  lilac: "#a99be0", mint: "#86bf98", peach: "#efac85", blue: "#8ab2da", pink: "#eca0b7", lemon: "#e3cc5c",
};

// ---------- data ----------
const row = ([id, memberId, kind, seed, x, y, facing, minutes, created, likes, mine]) => ({
  id, memberId, kind, seed, x, y, facing, minutes, created, likes, mine: !!mine,
});
/** Merges an /api/village answer into what we already have (it may be partial). */
export function mergeVillage(prev, raw) {
  if (!raw || raw.unchanged) return prev;
  if (prev && raw.rev < prev.rev) return prev;
  const buildings = new Map(raw.partial && prev ? prev.buildings.map((b) => [b.id, b]) : []);
  for (const r of raw.buildings) buildings.set(r[0], row(r));
  const districts = raw.districts.map(([id, memberId, q, r, seed]) => ({ id, memberId, q, r, seed }));
  // Buildings of someone who left vanish with them; their district stays empty.
  const owners = new Set(districts.map((d) => d.memberId).filter(Boolean));
  return {
    rev: raw.rev,
    until: raw.until,
    districts,
    buildings: [...buildings.values()].filter((b) => owners.has(b.memberId)).sort((a, b) => a.created - b.created),
    ruins: raw.ruins.map(([memberId, kind, x, y, until]) => ({ memberId, kind, x, y, until })),
  };
}

// ---------- time of day (Türkiye, Ankara sun) ----------
const clamp = (v) => Math.max(0, Math.min(1, v));
export function skyAt(now = Date.now()) {
  const local = new Date(now + 3 * 3600000);
  const hour = local.getUTCHours() + local.getUTCMinutes() / 60;
  const start = Date.UTC(local.getUTCFullYear(), 0, 0);
  const day = (local.getTime() - start) / 86400000;
  const length = 12 + 2.9 * Math.sin((2 * Math.PI * (day - 80)) / 365);
  const sunrise = 12.8 - length / 2,
    sunset = 12.8 + length / 2;
  const evening = clamp((hour - (sunset - 0.2)) / 1.2),
    morning = clamp((sunrise + 0.4 - hour) / 1.2);
  const night = Math.max(evening, morning);
  const warm = Math.max(0, 1 - Math.abs(hour - (sunset - 0.3)) / 1.1, 1 - Math.abs(hour - (sunrise + 0.3)) / 1.0);
  const q = (v) => Math.round(v * 8) / 8;
  return { night: q(night), warm: q(warm * (1 - night)), lamps: night > 0.3, key: `${q(night)}|${q(warm)}` };
}
const EMISSIVE = new Set([LIT, "#fff4c8", "#ffe9a8"]);
export function tinter(sky) {
  const cache = new Map();
  if (!sky.night && !sky.warm) return (c) => c;
  return (color) => {
    if (EMISSIVE.has(color)) return color;
    let out = cache.get(color);
    if (out) return out;
    const n = parseInt(color.slice(1), 16);
    let r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b = n & 255;
    const w = sky.warm * 0.2;
    r += (255 - r) * w;
    g += (178 - g) * w;
    b += (120 - b) * w;
    const k = sky.night;
    r *= 1 - k * 0.55;
    g *= 1 - k * 0.47;
    b *= 1 - k * 0.2;
    out = `rgb(${r | 0},${g | 0},${b | 0})`;
    cache.set(color, out);
    return out;
  };
}

// ---------- the world ----------
const detailFor = (s) => (s >= 9 ? 2 : s >= 4.2 ? 1 : 0);
const boxOf = (x, y, left, right, up, down) => {
  const [sx, sy] = screenOf(x, y);
  return [sx - left, sy - up, sx + right, sy + down];
};
const lineBox = (line, pad) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of line) {
    const [sx, sy] = screenOf(x, y);
    x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
  }
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
};
function strokeLine(view, line, width, color, alpha = 1, dash = null) {
  const { ctx, at } = view;
  const P = at(0, 0);
  ctx.beginPath();
  line.forEach(([x, y], i) => {
    const [px, py] = P(x, y, 0);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width * view.s;
  ctx.strokeStyle = view.tint(color);
  ctx.globalAlpha = alpha;
  if (dash) ctx.setLineDash(dash.map((d) => d * view.s));
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
function fillShape(view, points, color, edge = null, edgeWidth = 0) {
  const { ctx, at } = view;
  const P = at(0, 0);
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    const [px, py] = P(x, y, 0);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = view.tint(color);
  ctx.fill();
  if (edge) {
    ctx.lineWidth = edgeWidth * view.s;
    ctx.strokeStyle = view.tint(edge);
    ctx.stroke();
  }
}
// Trees of the Ankara steppe edge: broadleaf (layered crown, lit from the
// upper left like the houses), black pine (Karaçam) and poplar (kavak). In
// autumn some broadleaves and poplars turn. Species and tone come from the seed.
const LEAVES = [
  ["#47793a", "#5c9548", "#86bf66"],
  ["#41703a", "#538b45", "#79b25c"],
];
const AUTUMN = [
  ["#b5602c", "#d6843a", "#f0ad57"],
  ["#bf9426", "#dcb33a", "#f1d270"],
];
const PINE = ["#355f3e", "#46784d", "#5d9160"];
const frac = (v) => v - Math.floor(v);
function treeKind(tone) {
  const p = frac(tone * 997.31);
  return p < 0.2 ? "pine" : p < 0.34 ? "poplar" : "broad";
}
function treeColors(kind, tone, autumn) {
  if (kind === "pine") return PINE;
  if (autumn && frac(tone * 53.7) < (kind === "poplar" ? 0.7 : 0.42)) return AUTUMN[kind === "poplar" ? 1 : frac(tone * 7.1) < 0.5 ? 0 : 1];
  return LEAVES[tone < 0.5 ? 0 : 1];
}
function treeArt(view, x, y, size, tone, autumn) {
  const P = view.at(x, y);
  const s = view.s * size;
  const [bx, by] = P(0, 0, 0);
  const kind = treeKind(tone),
    [dark, mid, light] = treeColors(kind, tone, autumn);
  // Soft shadow toward the lower right, like the buildings'.
  ellipse(bx + s * 0.32, by + s * 0.05, s * (kind === "poplar" ? 0.5 : 0.78), s * 0.24, "#3f5f2a", 0.2);
  if (view.detail === 0) {
    if (kind === "pine") return poly([[bx - s * 0.5, by - s * 0.3], [bx + s * 0.5, by - s * 0.3], [bx, by - s * 1.7]], mid);
    if (kind === "poplar") return ellipse(bx, by - s * 1.2, s * 0.3, s * 0.95, mid);
    return circle(bx, by - s * 1.0, s * 0.62, mid);
  }
  const trunk = (w, h) => poly([[bx - w, by], [bx + w, by], [bx + w * 0.6, by - h], [bx - w * 0.6, by - h]], "#8b5e36");
  if (kind === "pine") {
    trunk(s * 0.07, s * 0.45);
    // Three tiers; the left half catches the light.
    [[0.62, 0.32, 1.05], [0.5, 0.72, 1.42], [0.36, 1.1, 1.78]].forEach(([w, base, tip]) => {
      poly([[bx - s * w, by - s * base], [bx, by - s * base + s * 0.08], [bx, by - s * tip]], mid);
      poly([[bx, by - s * base + s * 0.08], [bx + s * w, by - s * base], [bx, by - s * tip]], dark);
    });
    return "";
  }
  if (kind === "poplar") {
    trunk(s * 0.05, s * 0.5);
    ellipse(bx, by - s * 1.25, s * 0.32, s * 0.92, dark);
    ellipse(bx - s * 0.07, by - s * 1.33, s * 0.22, s * 0.8, mid);
    ellipse(bx - s * 0.13, by - s * 1.5, s * 0.09, s * 0.45, light, 0.85);
    return "";
  }
  trunk(s * 0.09, s * 0.82);
  circle(bx + s * 0.08, by - s * 0.98, s * 0.58, dark);
  circle(bx - s * 0.22, by - s * 1.1, s * 0.46, mid);
  circle(bx + s * 0.26, by - s * 1.2, s * 0.4, mid);
  circle(bx - s * 0.02, by - s * 1.42, s * 0.42, mid);
  circle(bx - s * 0.2, by - s * 1.45, s * 0.2, light, 0.9);
  circle(bx + s * 0.12, by - s * 1.6, s * 0.12, light, 0.7);
  return "";
}
function bushArt(view, x, y, size, tone, flowering) {
  const P = view.at(x, y);
  const s = view.s * size;
  const [bx, by] = P(0, 0, 0);
  const [dark, mid, light] = LEAVES[tone < 0.5 ? 0 : 1];
  ellipse(bx + s * 0.2, by + s * 0.04, s * 0.62, s * 0.2, "#3f5f2a", 0.18);
  circle(bx + s * 0.18, by - s * 0.24, s * 0.3, dark);
  circle(bx - s * 0.16, by - s * 0.26, s * 0.32, mid);
  circle(bx + 0, by - s * 0.42, s * 0.28, mid);
  if (view.detail > 0) circle(bx - s * 0.16, by - s * 0.44, s * 0.12, light, 0.9);
  if (flowering && view.detail > 0)
    for (const [dx, dy] of [[-0.3, -0.3], [0.05, -0.55], [0.3, -0.25], [-0.05, -0.18]])
      circle(bx + s * dx, by + s * dy, s * 0.06, tone < 0.5 ? "#f6d6e3" : "#fff3c2");
}
function rockArt(view, x, y, size) {
  const P = view.at(x, y);
  const k = size;
  box(P, -0.35 * k, -0.28 * k, 0.35 * k, 0.28 * k, 0, 0.28 * k, ["#cfc9bd", "#b3ac9f", "#9a9386"]);
  box(P, -0.15 * k, -0.2 * k, 0.2 * k, 0.15 * k, 0.28 * k, 0.42 * k, ["#dcd6ca", "#c2bbae", "#a8a194"]);
}
// Grass tufts and wildflowers on a district's meadow, painted once into tiles.
function meadowDetail(view, spots) {
  if (view.detail === 0) return;
  const P = view.at(0, 0);
  const { ctx } = view;
  ctx.lineCap = "round";
  for (const t of spots) {
    const [px, py] = P(t.x, t.y, 0);
    const h = view.s * 0.28 * t.size;
    if (t.flower) {
      circle(px, py - h * 0.6, view.s * 0.07, t.flower);
      circle(px + view.s * 0.16, py - h * 0.35, view.s * 0.06, t.flower);
      continue;
    }
    ctx.strokeStyle = view.tint(t.size > 1 ? "#7fb257" : "#8fbf62");
    ctx.lineWidth = Math.max(0.6, view.s * 0.05);
    ctx.beginPath();
    ctx.moveTo(px - h * 0.5, py - h);
    ctx.lineTo(px, py);
    ctx.lineTo(px + h * 0.1, py - h * 1.2);
    ctx.moveTo(px, py);
    ctx.lineTo(px + h * 0.6, py - h * 0.85);
    ctx.stroke();
  }
}
// A proper village name board: two posts, a framed plank with a little roof,
// the owner's colour on the end and a flower box at its feet.
const SIGN_POST = ["#a87447", "#8d5f37", "#744c2b"];
function signArt(view, x, y, label, vacant, color) {
  const P = view.at(x, y);
  const frame = vacant ? ["#cfc6b4", "#b9af9b", "#a39883"] : SIGN_POST;
  const panel = vacant ? "#e3dccd" : "#f4e5c6";
  // Flower box (or a tuft of weeds on an empty plot).
  box(P, 0.15, -0.55, 0.45, 0.55, 0, 0.22, vacant ? ["#c9c0ad", "#b3a991", "#9d927a"] : ["#c98d55", "#ad7543", "#925f35"]);
  if (view.detail > 0)
    for (const [py, c] of [[-0.35, vacant ? "#9fb47a" : "#f29bb8"], [0, vacant ? "#a9bd84" : "#fff3c2"], [0.33, vacant ? "#9fb47a" : "#b9a3ea"]]) {
      const [fx, fy] = P(0.3, py, 0.3);
      circle(fx, fy, view.s * 0.11, "#6a9f4a");
      circle(fx, fy - view.s * 0.07, view.s * 0.07, c);
    }
  for (const py of [-0.82, 0.82]) box(P, -0.06, py - 0.06, 0.06, py + 0.06, 0, 1.62, frame);
  box(P, 0.02, -1.0, 0.13, 1.0, 0.84, 1.52, frame);
  // The lighter panel inset on the face (the face runs along the y axis).
  poly([P(0.131, -0.92, 0.9), P(0.131, 0.92, 0.9), P(0.131, 0.92, 1.46), P(0.131, -0.92, 1.46)], panel);
  if (color) poly([P(0.132, 0.74, 0.9), P(0.132, 0.92, 0.9), P(0.132, 0.92, 1.46), P(0.132, 0.74, 1.46)], color);
  // Little roof.
  box(P, -0.08, -1.12, 0.24, 1.12, 1.62, 1.7, frame);
  if (view.s < 9 || !label) return;
  const [cx, cy] = P(0.16, -0.08, 1.18);
  const { ctx } = view;
  ctx.save();
  ctx.translate(cx, cy);
  // The board's face runs along the y axis, which climbs to the right on
  // screen: skew the text up the same slope so it sits on the plank.
  ctx.transform(1, -0.577, 0, 1, 0, 0);
  ctx.fillStyle = view.tint(vacant ? "#8a8070" : "#5e3f22");
  ctx.font = `700 ${Math.max(10, view.s * 0.4).toFixed(1)}px "DM Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const max = view.s * 1.5;
  let text = label;
  while (text.length > 3 && ctx.measureText(text).width > max) text = text.slice(0, -2) + "…";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
function lampArt(view, x, y, on) {
  const P = view.at(x, y);
  box(P, -0.06, -0.06, 0.06, 0.06, 0, 1.9, ["#5b6474", "#4a5262", "#3b4251"]);
  const [hx, hy] = P(0, 0, 2.0);
  circle(hx, hy, view.s * 0.2, on ? "#fff4c8" : "#d9d4c4");
}
function ruinArt(view, x, y, seed) {
  const P = view.at(x, y);
  const r = rng(seed);
  box(P, -1.7, -1.7, 1.7, 1.7, 0, 0.22, STONE);
  for (let i = 0; i < 7; i++) {
    const px = (r() * 2 - 1) * 1.2,
      py = (r() * 2 - 1) * 1.2,
      w = 0.25 + r() * 0.3,
      h = 0.2 + r() * 0.45;
    box(P, px - w, py - w * 0.7, px + w, py + w * 0.7, 0.22, 0.22 + h, i % 3 ? ["#e8a58a", "#d4876e", "#bb6e57"] : WOOD);
  }
  seg(P(-1.9, 1.9, 0.6), P(1.9, 1.9, 0.6), "#f2c14e", 2.2);
  seg(P(1.9, -1.9, 0.6), P(1.9, 1.9, 0.6), "#f2c14e", 2.2);
}
function plazaArt(view) {
  const P = view.at(0, 0);
  // The Milli Kütüphane's foundation: the monument rises here later.
  box(P, -2.6, -2.6, 2.6, 2.6, 0, 0.35, ["#e9e2d4", "#d6ccb9", "#c2b6a0"]);
  box(P, -1.7, -1.7, 1.7, 1.7, 0.35, 0.6, ["#f2ece0", "#e2d8c6", "#cfc3ad"]);
  box(P, 2.9, 1.4, 3.05, 1.55, 0, 1.2, WOOD);
  box(P, 3.05, 0.6, 3.12, 2.3, 0.8, 1.5, ["#f3e3c3", "#e9d2a8", "#d2b685"]);
}

/**
 * world: { items, bounds, query(x0,y0,x1,y1), districts, … }
 * members: state.members; me: my id; sky: skyAt().
 */
export function buildWorld({ groupKey, village, members, me, sky }) {
  const people = new Map(members.map((m) => [m.id, m]));
  // September to November in Ankara: some leaves turn.
  const month = new Date(Date.now() + 3 * 3600000).getUTCMonth(),
    autumn = month >= 8 && month <= 10;
  const districts = village.districts.map((d) => ({ ...d, layout: cellLayout(groupKey, d.q, d.r) }));
  const network = roadNetwork(groupKey, districts.map((d) => [d.q, d.r]));
  const linkSet = new Set(network.links);
  const built = new Set(districts.map((d) => cellKey(d.q, d.r)));
  const ground = [],
    standing = [];
  const add = (list, item) => list.push(item);
  // Newest building per member: the "home" that lights up when they are in the library.
  const newest = new Map();
  for (const b of village.buildings) newest.set(b.memberId, b);
  const lit = new Set();
  for (const m of members) if (m.status === "here" && newest.has(m.id)) lit.add(newest.get(m.id).id);

  // Plaza
  add(ground, { pass: 0, bbox: boxOf(0, 0, PLAZA * 1.8, PLAZA * 1.8, PLAZA, PLAZA), draw: (v) => {
    const ring = [];
    for (let i = 0; i < 32; i++) ring.push([Math.cos((i / 32) * Math.PI * 2) * PLAZA, Math.sin((i / 32) * Math.PI * 2) * PLAZA]);
    fillShape(v, ring, PLAZA_STONE, PLAZA_RING, 0.35);
  } });
  add(standing, { type: "plaza", depth: 0, x: 0, y: 0, bbox: boxOf(0, 0, 6, 6, 3, 4), draw: plazaArt });
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2,
      x = Math.cos(a) * (PLAZA - 0.6),
      y = Math.sin(a) * (PLAZA - 0.6);
    add(standing, { type: "lamp", depth: x + y, x, y, bbox: boxOf(x, y, 1, 1, 3, 1), draw: (v) => lampArt(v, x, y, sky.lamps) });
  }

  // Meadows, hills, ponds and trees of every district (and of the empty cells a road crosses)
  const cellsDrawn = new Map();
  for (const d of districts) cellsDrawn.set(cellKey(d.q, d.r), d);
  for (const key of network.cells) if (!cellsDrawn.has(key)) {
    const [q, r] = key.split(",").map(Number);
    cellsDrawn.set(key, { q, r, layout: cellLayout(groupKey, q, r), passThrough: true });
  }
  const homes = village.buildings.filter((b) => b.x !== null);
  // Coarse spatial hashes keep the checks below cheap in a village of thousands.
  const H = 16,
    hk = (x, y) => `${Math.floor(x / H)},${Math.floor(y / H)}`;
  const homeGrid = new Map();
  for (const b of homes) {
    const k = hk(b.x, b.y);
    if (!homeGrid.has(k)) homeGrid.set(k, []);
    homeGrid.get(k).push(b);
  }
  const around = (grid, x, y) => {
    const out = [];
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const list = grid.get(`${Math.floor(x / H) + i},${Math.floor(y / H) + j}`);
        if (list) for (const v of list) out.push(v);
      }
    return out;
  };
  const blockedByHome = (x, y, pad) =>
    around(homeGrid, x, y).some((b) => Math.hypot(b.x - x, b.y - y) < (FOOTPRINT[b.kind] || 2.4) + pad);
  const lineGrid = new Map();
  for (const line of [...network.lanes, ...network.links]) {
    const keys = new Set();
    for (let i = 0; i < line.length; i++) {
      const [x, y] = line[i];
      keys.add(hk(x, y));
      if (i) {
        const [px, py] = line[i - 1],
          n = Math.ceil(Math.hypot(x - px, y - py) / 4);
        for (let k = 1; k < n; k++) keys.add(hk(px + ((x - px) * k) / n, py + ((y - py) * k) / n));
      }
    }
    for (const k of keys) {
      if (!lineGrid.has(k)) lineGrid.set(k, new Set());
      lineGrid.get(k).add(line);
    }
  }
  const linesNear = (x, y) => {
    const out = new Set();
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (const l of lineGrid.get(`${Math.floor(x / H) + i},${Math.floor(y / H) + j}`) || []) out.add(l);
    return out;
  };
  const cellList = [...cellsDrawn.values()];
  for (const d of cellsDrawn.values()) {
    const L = d.layout;
    const [cx, cy] = L.center;
    const owner = d.memberId ? people.get(d.memberId) : null;
    if (!d.passThrough)
      add(ground, { pass: 0, bbox: boxOf(cx, cy, 24, 24, 13, 13), draw: (v) => fillShape(v, L.boundary, owner ? MEADOW : PLOT, MEADOW_EDGE, 0.9) });
    if (L.hill && !d.passThrough) {
      const { x, y, r } = L.hill;
      add(ground, { pass: 1, bbox: boxOf(x, y, r * 1.8, r * 1.8, r, r), draw: (v) => {
        const P = v.at(x, y);
        const [px, py] = P(0, 0, 0);
        ellipse(px + v.s * r * 0.15, py + v.s * r * 0.12, v.s * r * 1.5, v.s * r * 0.72, "#8fbe63", 0.35);
        ellipse(px, py, v.s * r * 1.45, v.s * r * 0.68, "#c4e59c", 0.45);
      } });
    }
    if (L.pond && !blockedByHome(L.pond.x, L.pond.y, L.pond.rx)) {
      const { x, y, rx, ry } = L.pond;
      add(ground, { pass: 1, bbox: boxOf(x, y, rx * 1.8, rx * 1.8, rx, rx), draw: (v) => {
        const P = v.at(x, y);
        const [px, py] = P(0, 0, 0);
        ellipse(px, py, v.s * rx * 1.05, v.s * ry * 0.62, "#d7eac0");
        ellipse(px, py + v.s * 0.06, v.s * rx * 0.92, v.s * ry * 0.52, WATER);
        ellipse(px - v.s * rx * 0.3, py - v.s * ry * 0.12, v.s * rx * 0.28, v.s * ry * 0.08, "#c7e7f0", 0.8);
      } });
    }
    const r = rng(L.seed + 3);
    const trees = [...L.trees];
    // A few wild trees just outside the edge soften where the village meets the fields.
    for (let i = 0; i < 6; i++) {
      const a = r() * Math.PI * 2,
        dist = L.radiusAt(a) + 0.8 + r() * 3.2;
      trees.push({ x: cx + Math.cos(a) * dist, y: cy + Math.sin(a) * dist, size: 0.7 + r() * 0.5, tone: r(), wild: true });
    }
    for (const t of trees) {
      if ([...linesNear(t.x, t.y)].some((l) => lineDistance([t.x, t.y], l).d < LANE + 0.7)) continue;
      if (L.pond && Math.hypot(t.x - L.pond.x, t.y - L.pond.y) < L.pond.rx + 0.5) continue;
      if (L.sign && Math.hypot(t.x - L.sign[0], t.y - L.sign[1]) < 1.3) continue;
      if (blockedByHome(t.x, t.y, 0.3)) continue;
      if (!t.wild && Math.hypot(t.x - cx, t.y - cy) > L.radiusAt(Math.atan2(t.y - cy, t.x - cx)) - 0.5) continue;
      if (t.wild && cellList.some((o) => o !== d && Math.abs(t.x - o.layout.center[0]) < 16 && Math.abs(t.y - o.layout.center[1]) < 16 && Math.hypot(t.x - o.layout.center[0], t.y - o.layout.center[1]) < o.layout.radiusAt(0) + 1)) continue;
      if (Math.hypot(t.x, t.y) < PLAZA + 1.2) continue;
      add(standing, { type: "tree", depth: t.x + t.y, x: t.x, y: t.y, bbox: boxOf(t.x, t.y, 1.3 * t.size, 1.3 * t.size, 2.4 * t.size, 0.6), draw: (v) => treeArt(v, t.x, t.y, t.size, t.tone, autumn) });
    }
    // Landscaping on settled districts: grass and wildflowers on the meadow,
    // bushes along the edge and a few field stones, all from the district seed
    // and kept off lanes, the pond and the houses.
    if (!d.passThrough) {
      const rr = rng(L.seed + 11);
      // One lookup for the whole district (the 3×3 hash cells cover it).
      const lanesHere = [...linesNear(cx, cy)];
      const clear = (x, y, pad) =>
        Math.hypot(x - cx, y - cy) < L.radiusAt(Math.atan2(y - cy, x - cx)) - 0.4 &&
        !lanesHere.some((l) => lineDistance([x, y], l).d < LANE + pad) &&
        !(L.pond && Math.hypot(x - L.pond.x, y - L.pond.y) < L.pond.rx + pad) &&
        !(L.sign && Math.hypot(x - L.sign[0], y - L.sign[1]) < 1.4) &&
        !blockedByHome(x, y, pad);
      const spots = [];
      for (let i = 0; i < 40; i++) {
        const a = rr() * Math.PI * 2,
          dist = Math.sqrt(rr()) * L.radiusAt(a),
          x = cx + Math.cos(a) * dist,
          y = cy + Math.sin(a) * dist,
          size = 0.7 + rr() * 0.7,
          flower = rr() < 0.3 ? FLOWERS[Math.floor(rr() * FLOWERS.length)] : null;
        if (clear(x, y, 0.15)) spots.push({ x, y, size, flower });
      }
      if (spots.length) add(ground, { pass: 1, bbox: boxOf(cx, cy, 24, 24, 13, 13), draw: (v) => meadowDetail(v, spots) });
      for (let i = 0; i < 7; i++) {
        const a = rr() * Math.PI * 2,
          dist = L.radiusAt(a) - 1 - rr() * 1.6,
          x = cx + Math.cos(a) * dist,
          y = cy + Math.sin(a) * dist,
          size = 0.8 + rr() * 0.6,
          tone = rr(),
          flowering = rr() < 0.4;
        if (!clear(x, y, 0.7)) continue;
        if (i < 5)
          add(standing, { type: "bush", depth: x + y, x, y, bbox: boxOf(x, y, 1, 1, 1, 0.5), draw: (v) => bushArt(v, x, y, size, tone, flowering) });
        else add(standing, { type: "rock", depth: x + y, x, y, bbox: boxOf(x, y, 0.9, 0.9, 0.6, 0.5), draw: (v) => rockArt(v, x, y, size) });
      }
    }
    if (!d.passThrough && L.sign) {
      const [x, y] = L.sign;
      const label = owner ? owner.name : "Boş arsa";
      const color = owner ? MEMBER_COLORS[owner.color] || MEMBER_COLORS.lilac : null;
      add(standing, { type: "sign", depth: x + y, x, y, district: d, bbox: boxOf(x, y, 1.8, 1.8, 2.2, 1), draw: (v) => signArt(v, x, y, label, !owner, color) });
      // A lamp on the other side of the entrance.
      const [ex, ey] = L.entrance;
      const lx = ex + (ex - x) * 0.55 + (cx - ex) * 0.06,
        ly = ey + (ey - y) * 0.55 + (cy - ey) * 0.06;
      add(standing, { type: "lamp", depth: lx + ly, x: lx, y: ly, bbox: boxOf(lx, ly, 1, 1, 3, 1), draw: (v) => lampArt(v, lx, ly, sky.lamps) });
    }
  }

  // Roads: edges first, then the surface, so junctions melt together.
  const roads = [];
  for (const link of network.links) roads.push({ line: link, kind: "road" });
  for (const key of network.cells) {
    const [q, r] = key.split(",").map(Number);
    const L = cellLayout(groupKey, q, r);
    const childKeys = Object.keys(L.gates);
    L.lanes.forEach((line, i) => {
      // Lanes towards cells nobody has settled yet are only a dirt track.
      const leadsTo = i > 0 ? childKeys[i - 1] : null;
      const live = i === 0 || (leadsTo && (network.cells.has(leadsTo) || built.has(leadsTo)));
      roads.push({ line, kind: live ? "road" : "track" });
    });
  }
  for (const r of roads) {
    const bbox = lineBox(r.line, 3);
    if (r.kind === "road") {
      add(ground, { pass: 2, bbox, draw: (v) => strokeLine(v, r.line, LANE * 1.7 + 0.3, ROAD_EDGE) });
      add(ground, { pass: 3, bbox, draw: (v) => strokeLine(v, r.line, LANE * 1.7, ROAD) });
    } else add(ground, { pass: 3, bbox, draw: (v) => strokeLine(v, r.line, LANE * 1.1, TRACK, 0.75) });
  }
  // Lamps halfway along the roads between districts.
  for (const link of network.links) {
    const [ax, ay] = link[0],
      [bx, by] = link[1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 6) continue;
    const mx = (ax + bx) / 2 + ((by - ay) / len) * (LANE + 0.5),
      my = (ay + by) / 2 - ((bx - ax) / len) * (LANE + 0.5);
    add(standing, { type: "lamp", depth: mx + my, x: mx, y: my, bbox: boxOf(mx, my, 1, 1, 3, 1), draw: (v) => lampArt(v, mx, my, sky.lamps) });
  }

  // Buildings, each with a stepping-stone path from its door to the nearest lane.
  for (const b of homes) {
    const sp = spec(b.kind, b.seed);
    const owner = people.get(b.memberId);
    const door = b.facing ? [b.x + sp.hw + 0.7, b.y] : [b.x, b.y + sp.hw + 0.7];
    let best = { d: Infinity, point: door };
    for (const l of linesNear(door[0], door[1])) {
      if (linkSet.has(l)) continue;
      const n = nearestOnLine(door, l);
      if (n.d < best.d) best = n;
    }
    if (best.d < 9) {
      const line = [door, best.point];
      add(ground, { pass: 4, bbox: lineBox(line, 1), draw: (v) => strokeLine(v, line, 0.42, "#f1e6cc", 0.95, [0.32, 0.26]) });
    }
    const up = ridgeOf(sp) + (sp.roofType === "pyramid" ? 1.6 : 0.8);
    const half = (sp.hw + 1.4) * 1.75;
    add(standing, {
      type: "building", id: b.id, building: b, owner, sp, depth: b.x + b.y, x: b.x, y: b.y,
      bbox: boxOf(b.x, b.y, half, half, up + 0.3, sp.hw + 1.9),
      hit: boxOf(b.x, b.y, sp.hw * 1.8, sp.hw * 1.8, up - 0.6, sp.hw * 1.05),
      top: ridgeOf(sp),
      draw: (v) => {
        const base = v.at(b.x, b.y);
        const P = b.facing ? mirrored(base) : base;
        buildingSVG(P, sp, b.seed, { lit: lit.has(b.id) || (sky.night > 0.5 && sp.lit), detail: v.detail, shadowP: base });
      },
    });
  }
  for (const ruin of village.ruins) {
    if (ruin.until <= Date.now()) continue;
    let { x, y } = ruin;
    const d = districts.find((dd) => dd.memberId === ruin.memberId);
    if (x === null && d) [x, y] = [d.layout.sign[0] + 2.2, d.layout.sign[1] + 2.2];
    if (x === null || x === undefined) continue;
    const seed = Math.round(x * 31 + y * 17);
    add(standing, { type: "ruin", depth: x + y, x, y, memberId: ruin.memberId, bbox: boxOf(x, y, 4, 4, 2, 2.5), draw: (v) => ruinArt(v, x, y, seed) });
  }

  // Draw order: ground passes, then everything standing from back to front.
  ground.sort((a, b) => a.pass - b.pass);
  standing.sort((a, b) => a.depth - b.depth);
  const items = [...ground, ...standing];
  items.forEach((item, i) => (item.order = i));
  const CELL = 24,
    grid = new Map();
  let bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const item of items) {
    const [x0, y0, x1, y1] = item.bbox;
    bounds = [Math.min(bounds[0], x0), Math.min(bounds[1], y0), Math.max(bounds[2], x1), Math.max(bounds[3], y1)];
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++)
      for (let gy = Math.floor(y0 / CELL); gy <= Math.floor(y1 / CELL); gy++) {
        const k = `${gx},${gy}`;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(item);
      }
  }
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

  // Live things: who is in the library, on a break, or on the way.
  const anchorOf = (memberId) => {
    const home = newest.get(memberId);
    if (home && home.x !== null) return { x: home.x, y: home.y, z: ridgeOf(spec(home.kind, home.seed)) + 1.2, building: home };
    const d = districts.find((dd) => dd.memberId === memberId);
    return d ? { x: d.layout.sign[0], y: d.layout.sign[1], z: 2.4 } : null;
  };
  const balloons = [],
    walkers = [],
    smoke = [];
  for (const m of members) {
    if (m.status === "here" || m.status === "break") {
      const a = anchorOf(m.id);
      if (!a) continue;
      balloons.push({ member: m, ...a });
      if (m.status === "here" && a.building) {
        const sp = spec(a.building.kind, a.building.seed);
        if (sp.chimney) {
          const [cx, cy, cz] = chimneyTop(sp);
          const [wx, wy] = a.building.facing ? [cy, cx] : [cx, cy];
          smoke.push({ x: a.building.x + wx, y: a.building.y + wy, z: cz, seed: a.building.seed });
        }
      }
    } else if (m.status === "coming") {
      const d = districts.find((dd) => dd.memberId === m.id);
      if (d) walkers.push({ member: m, path: pathToPlaza(groupKey, d) });
    }
  }
  const mine = districts.filter((d) => d.memberId === me);
  // One name per person at distant zoom; repeating it on every district hides
  // the buildings once a friend owns dozens of neighbourhoods.
  const farLabels = new Set();
  for (const member of members) {
    const own = districts.filter((d) => d.memberId === member.id);
    if (!own.length) continue;
    const x = own.reduce((n, d) => n + d.layout.center[0], 0) / own.length;
    const y = own.reduce((n, d) => n + d.layout.center[1], 0) / own.length;
    const nearest = own.reduce((best, d) => Math.hypot(d.layout.center[0] - x, d.layout.center[1] - y) < Math.hypot(best.layout.center[0] - x, best.layout.center[1] - y) ? d : best);
    farLabels.add(nearest.id);
  }
  // What the village actually covers on screen (item boxes are padded for drawing).
  let area = [-PLAZA * 1.3, -PLAZA, PLAZA * 1.3, PLAZA * 0.8];
  for (const d of cellsDrawn.values())
    for (const [x, y] of d.layout.boundary) {
      const [sx, sy] = screenOf(x, y);
      area = [Math.min(area[0], sx), Math.min(area[1], sy - 4), Math.max(area[2], sx), Math.max(area[3], sy)];
    }
  return {
    items, query, bounds, area, districts, balloons, walkers, smoke, buildings: homes, lit, farLabels,
    lamps: standing.filter((item) => item.type === "lamp"),
    byId: new Map(standing.filter((item) => item.id).map((item) => [item.id, item])),
    names: new Map(members.map((m) => [m.id, m.name])),
    count: homes.length,
    focusOf(memberId) {
      const own = districts.filter((d) => d.memberId === memberId);
      const d = own[own.length - 1];
      return d ? screenOf(...d.layout.center) : null;
    },
    mineFocus: mine.length ? screenOf(...mine[mine.length - 1].layout.center) : null,
    activeBounds() {
      // The plaza plus the districts of everyone who is around right now (or mine).
      const ids = new Set(members.filter((m) => m.status !== "away").map((m) => m.id));
      if (me) ids.add(me);
      let b = [-10, -8, 10, 6];
      for (const d of districts)
        if (ids.has(d.memberId)) {
          const [sx, sy] = screenOf(...d.layout.center);
          b = [Math.min(b[0], sx - 12), Math.min(b[1], sy - 10), Math.max(b[2], sx + 12), Math.max(b[3], sy + 8)];
        }
      return b;
    },
    detailFor,
  };
}

// From a district's hub, along its lanes and the roads, to the plaza.
function pathToPlaza(groupKey, district) {
  const path = [];
  let L = cellLayout(groupKey, district.q, district.r);
  path.push(...[...L.lanes[0]].reverse());
  let q = district.q,
    r = district.r;
  while (!(q === 0 && r === 0)) {
    const [pq, pr] = parentOf(q, r);
    const parent = cellLayout(groupKey, pq, pr);
    const gate = parent.gates[cellKey(q, r)];
    if (pq === 0 && pr === 0) {
      path.push(gate, [gate[0] * 0.35, gate[1] * 0.35]);
      break;
    }
    const keys = Object.keys(parent.gates);
    const lane = parent.lanes[1 + keys.indexOf(cellKey(q, r))];
    if (lane) path.push(...[...lane].reverse());
    path.push(...[...parent.lanes[0]].reverse());
    q = pq;
    r = pr;
    L = parent;
  }
  let total = 0;
  const lengths = [0];
  for (let i = 1; i < path.length; i++) lengths.push((total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])));
  return { points: path, lengths, total };
}
export function pointOnPath(path, t) {
  const target = t * path.total;
  let i = 1;
  while (i < path.lengths.length - 1 && path.lengths[i] < target) i++;
  const a = path.points[i - 1],
    b = path.points[i],
    span = path.lengths[i] - path.lengths[i - 1] || 1,
    k = (target - path.lengths[i - 1]) / span;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

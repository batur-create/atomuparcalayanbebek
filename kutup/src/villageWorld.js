// Turns the /api/village rows into a drawable world: ground, lanes, ponds, trees,
// buildings, signs and lamps, each with a screen-space box and a depth, indexed
// in a coarse grid so the map only draws what a tile or the viewport needs.
import {
  FOOTPRINT, LANE, LANE_SHARE, PLAZA, RADIUS, SPACING,cellKey, cellLayout, lineDistance, monumentCells, nearestOnLine, parentOf, roadNetwork, screenOf,
} from "../shared/village.js";
import {
  LIT, STONE, WOOD, box, buildingSVG, chimneyTop, circle, drawnSize, ellipse, mirrored, poly, patchSVG, ridgeOf, rng, seg, snowSVG, spec, vinesSVG,
} from "./iso.js";
import { BY_ID } from "../shared/catalog.js";

export const GROUND = "#a4c481";
const MEADOW = "#accb8c",
  FLOWERS = ["#ffffff", "#f7d154", "#f29bb8", "#b9a3ea"],
  ROAD = "#dfcfaf",
  ROAD_EDGE = "#c5b590",
  TRACK = "#d8c69f",
  WATER = "#8ec8dc",
  PLAZA_STONE = "#e7dece",
  PLAZA_RING = "#d2c5ae";
export const MEMBER_COLORS = {
  lilac: "#a99be0", mint: "#86bf98", peach: "#efac85", blue: "#8ab2da", pink: "#eca0b7", lemon: "#e3cc5c",
  slate: "#98a4b6", sand: "#d2b98f", olive: "#a8ad72",
};
// Villagers dress in calm village colours (none of them green enough to turn white under the winter tint).
const COATS = ["#7f93b8", "#b98a64", "#c98577", "#9c8bbf", "#6e9e9b", "#d0a54f", "#a3a06a"],
  SKINS = ["#f3d2b3", "#e2b48e", "#c68e66", "#9c6a4a"],
  HATS = [["#e6c77c"], ["#e9a0a8", "#f2d07a", "#a7c7e7", "#f5f0e6"], ["#6d625a", "#8a7a6a", "#5f6b7d"]];
/** In a session right now (a tea break inside the session counts too). */
export const focusing = (m, now = Date.now()) => m.focusEnd > now || (m.focusEnd > 0 && m.focusPausedAt > 0);

// ---------- data ----------
const row = ([id, memberId, kind, seed, x, y, facing, minutes, created, likes, mine, model, patched, gift]) => ({
  id, memberId, kind, seed, x, y, facing, minutes, created, likes, mine: !!mine, model: model || null, patched: !!patched, gift: gift || null,
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
    // n43: fewer rows here than the server counts means one was taken back.
    stale: !!raw.partial && raw.total != null && buildings.size !== raw.total,
    districts,
    buildings: [...buildings.values()].filter((b) => owners.has(b.memberId)).sort((a, b) => a.created - b.created),
    ruins: raw.ruins.map(([memberId, kind, x, y, until]) => ({ memberId, kind, x, y, until })),
    monument: raw.monument ?? prev?.monument ?? 0,
  };
}

// ---------- time of day (Türkiye, Ankara sun) ----------
const clamp = (v) => Math.max(0, Math.min(1, v));
// Local hour now, and that day's sunrise and sunset in hours (public/mode.js
// repeats this formula to pick the page's look before the first paint).
export function sunTimes(now = Date.now()) {
  const local = new Date(now + 3 * 3600000);
  const hour = local.getUTCHours() + local.getUTCMinutes() / 60;
  const start = Date.UTC(local.getUTCFullYear(), 0, 0);
  const day = (local.getTime() - start) / 86400000;
  const length = 12 + 2.9 * Math.sin((2 * Math.PI * (day - 80)) / 365);
  return { local, hour, sunrise: 12.8 - length / 2, sunset: 12.8 + length / 2 };
}
// The page goes dark at sunset in "auto" mode and light again at sunrise.
export function darkAt(mode, now = Date.now()) {
  if (mode !== "auto") return mode === "dark";
  const { hour, sunrise, sunset } = sunTimes(now);
  return hour < sunrise || hour >= sunset;
}
export function skyAt(now = Date.now()) {
  const { local, hour, sunrise, sunset } = sunTimes(now);
  const evening = clamp((hour - (sunset - 0.2)) / 1.2),
    morning = clamp((sunrise + 0.4 - hour) / 1.2);
  const night = Math.max(evening, morning);
  const warm = Math.max(0, 1 - Math.abs(hour - (sunset - 0.3)) / 1.1, 1 - Math.abs(hour - (sunrise + 0.3)) / 1.0);
  const q = (v) => Math.round(v * 8) / 8;
  const month = local.getUTCMonth(),
    season = month === 11 || month <= 1 ? "winter" : month <= 4 ? "spring" : month <= 7 ? "summer" : "autumn";
  return { night: q(night), warm: q(warm * (1 - night)), lamps: night > 0.3, season, key: `${q(night)}|${q(warm)}|${season}` };
}
const EMISSIVE = new Set([LIT, "#fff4c8", "#ffe9a8"]);
export function tinter(sky) {
  const cache = new Map();
  const snow = sky.season === "winter";
  if (!sky.night && !sky.warm && !snow) return (c) => c;
  return (color) => {
    if (EMISSIVE.has(color)) return color;
    let out = cache.get(color);
    if (out) return out;
    const n = parseInt(color.slice(1), 16);
    let r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b = n & 255;
    if (snow && g > r + 12 && g > b + 8) {
      // Grass and leaves under snow: a cool white that keeps a hint of the shade.
      const s = 0.78;
      r += (236 - r) * s;
      g += (242 - g) * s;
      b += (246 - b) * s;
    }
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
const BLOSSOM = [
  ["#d98aa3", "#ecaec2", "#f9d9e3"],
  ["#d9c9cf", "#efe3e7", "#ffffff"],
];
const frac = (v) => v - Math.floor(v);
function treeKind(tone) {
  const p = frac(tone * 997.31);
  return p < 0.2 ? "pine" : p < 0.34 ? "poplar" : "broad";
}
function treeColors(kind, tone, season) {
  if (kind === "pine") return PINE;
  if (season === "autumn" && frac(tone * 53.7) < (kind === "poplar" ? 0.7 : 0.42)) return AUTUMN[kind === "poplar" ? 1 : frac(tone * 7.1) < 0.5 ? 0 : 1];
  if (season === "spring" && kind === "broad" && frac(tone * 41.3) < 0.5) return BLOSSOM[frac(tone * 9.7) < 0.55 ? 0 : 1];
  return LEAVES[tone < 0.5 ? 0 : 1];
}
function treeArt(view, x, y, size, tone, season) {
  const P = view.at(x, y);
  const s = view.s * size;
  const [bx, by] = P(0, 0, 0);
  const kind = treeKind(tone),
    [dark, mid, light] = treeColors(kind, tone, season);
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
// The Milli Kütüphane monument on the square: every week the team reaches its
// shared goal adds a stage (columns, entablature, a tier, the roof, the gold
// finial), so the monument is a record of the weeks done together.
function plazaArt(view, stages = 0) {
  const P = view.at(0, 0);
  const MARBLE = ["#f4efe6", "#ddd6c8", "#c6bdad"];
  box(P, -2.6, -2.6, 2.6, 2.6, 0, 0.35, ["#e9e2d4", "#d6ccb9", "#c2b6a0"]);
  box(P, -1.7, -1.7, 1.7, 1.7, 0.35, 0.6, ["#f2ece0", "#e2d8c6", "#cfc3ad"]);
  if (stages >= 1) for (const [x, y] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3], [0, 1.3], [1.3, 0]]) box(P, x - 0.16, y - 0.16, x + 0.16, y + 0.16, 0.6, 2.2, MARBLE);
  if (stages >= 2) box(P, -1.65, -1.65, 1.65, 1.65, 2.2, 2.5, MARBLE);
  if (stages >= 3) {
    box(P, -1.05, -1.05, 1.05, 1.05, 2.5, 3.3, ["#efe8da", "#d9cfbd", "#c3b7a1"]);
    for (const t of [-0.5, 0, 0.5]) poly([P(t - 0.12, 1.06, 2.7), P(t + 0.12, 1.06, 2.7), P(t + 0.12, 1.06, 3.1), P(t - 0.12, 1.06, 3.1)], "#5c5246");
  }
  if (stages >= 4) {
    const apex = P(0, 0, 4.4);
    poly([P(-1.25, 1.25, 3.3), P(1.25, 1.25, 3.3), apex], "#b9a68a");
    poly([P(1.25, -1.25, 3.3), P(1.25, 1.25, 3.3), apex], "#a08d72");
  }
  if (stages >= 5) {
    seg(P(0, 0, 4.4), P(0, 0, 5.1), "#c99622", 2);
    const [gx, gy] = P(0, 0, 5.2);
    circle(gx, gy, Math.abs(P(0, 0, 1)[1] - P(0, 0, 0)[1]) * 0.28, "#f2c14e");
  }
  box(P, 2.9, 1.4, 3.05, 1.55, 0, 1.2, WOOD);
  box(P, 3.05, 0.6, 3.12, 2.3, 0.8, 1.5, ["#f3e3c3", "#e9d2a8", "#d2b685"]);
}

/**
 * world: { items, bounds, query(x0,y0,x1,y1), districts, … }
 * members: state.members; me: my id; sky: skyAt().
 */
// A free plot while moving a building: a glowing footprint and a pin.
function spotArt(v, s) {
  const P = v.at(s.x, s.y),
    r = 1.7,
    unit = Math.abs(P(0, 0, 1)[1] - P(0, 0, 0)[1]);
  const corners = [P(-r, -r, 0.03), P(r, -r, 0.03), P(r, r, 0.03), P(-r, r, 0.03)];
  poly(corners, "#f2c14e", 0.4);
  corners.forEach((a, i) => seg(a, corners[(i + 1) % 4], "#d99a1e", 1.6));
  const [cx, cy] = P(0, 0, 0.03),
    [px, py] = P(0, 0, 2.2);
  seg([cx, cy], [px, py], "#8a5a12", 1.4);
  circle(px, py, unit * 0.5, "#f2c14e");
  circle(px, py, unit * 0.22, "#fffaf0");
}
export function buildWorld({ groupKey, village, members, me, sky, spots = [] }) {
  const people = new Map(members.map((m) => [m.id, m]));
  // September to November in Ankara: some leaves turn.
  const season = (sky || skyAt()).season;
  // A monument's district (n44) has a ring road round its centre.
  const monuments = monumentCells(groupKey, village.districts.map((d) => [d.q, d.r]), village.buildings);
  const layoutOf = (q, r) => cellLayout(groupKey, q, r, monuments.has(cellKey(q, r)));
  const occupied=new Set(village.buildings.filter(b=>b.x!=null).map(b=>b.districtId));
  const legacyOwners=new Set(village.buildings.filter(b=>b.x!=null&&!b.districtId).map(b=>b.memberId));
  const ruins=new Set(village.ruins.filter(r=>r.until>Date.now()).map(r=>r.memberId));
  // Empty signup reservations stay on the server, not in the camera's bounds.
  // My own plot and a neighbour currently studying are still discoverable.
  const districts = village.districts.filter(d=>occupied.has(d.id)||legacyOwners.has(d.memberId)||d.memberId===me||ruins.has(d.memberId)||focusing(people.get(d.memberId)||{})).map((d) => ({ ...d, layout: layoutOf(d.q, d.r) }));
  const network = roadNetwork(groupKey, districts.map((d) => [d.q, d.r]), monuments);
  const linkSet = new Set(network.links);
  const built = new Set(districts.map((d) => cellKey(d.q, d.r)));
  const ground = [],
    standing = [];
  const add = (list, item) => list.push(item);
  // Newest building per member: the "home" that lights up when they are in the library.
  const newest = new Map();
  for (const b of village.buildings) newest.set(b.memberId, b);
  const lit = new Set();
  const now = Date.now();
  // Lit windows: whoever is in the library, and whoever is focusing (also from home).
  for (const m of members) if ((m.status === "here" || focusing(m, now)) && newest.has(m.id)) lit.add(newest.get(m.id).id);

  // Plaza
  add(ground, { pass: 0, bbox: boxOf(0, 0, PLAZA * 1.8, PLAZA * 1.8, PLAZA, PLAZA), draw: (v) => {
    const ring = [];
    for (let i = 0; i < 32; i++) ring.push([Math.cos((i / 32) * Math.PI * 2) * PLAZA, Math.sin((i / 32) * Math.PI * 2) * PLAZA]);
    fillShape(v, ring, PLAZA_STONE, PLAZA_RING, 0.35);
  } });
  add(standing, { type: "plaza", depth: 0, x: 0, y: 0, bbox: boxOf(0, 0, 6, 6, 6.5, 4), draw: (v) => plazaArt(v, village.monument || 0) });
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
    cellsDrawn.set(key, { q, r, layout: layoutOf(q, r), passThrough: true });
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
  // Space each building takes: its kind's footprint, or what an enlarged
  // building of its own reaches (filled in below, once the lanes are known).
  const claim = new Map();
  const claimOfHome = (b) => claim.get(b.id) ?? (FOOTPRINT[b.kind] || 2.4);
  const blockedByHome = (x, y, pad) =>
    around(homeGrid, x, y).some((b) => Math.hypot(b.x - x, b.y - y) < claimOfHome(b) + pad);
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
  // n44: a building of its own is drawn as big as its real size allows
  // (shared/olcek.js), but never over a neighbour, a lane, a pond or a sign:
  // buildings placed before n44 had only a box's footprint. Two enlarged
  // neighbours share the gap between them in proportion to what each wants.
  const PAD = 0.25;
  const grow = (b) => {
    const look = BY_ID[b.model]?.look;
    if (!look?.special) return null;
    const size = drawnSize(b.model);
    return { r1: size.reach, want: size.reach * size.k };
  };
  const wants = new Map();
  for (const b of homes) {
    const g = grow(b);
    if (g) wants.set(b.id, g);
  }
  const homeSpec = new Map();
  for (const b of homes) {
    const g = wants.get(b.id);
    if (!g || g.want <= g.r1 + 0.01) {
      homeSpec.set(b.id, spec(b.kind, b.seed, b.model, { scale: g ? 1 : undefined }));
      continue;
    }
    let room = g.want;
    for (const n of around(homeGrid, b.x, b.y)) {
      if (n === b) continue;
      const d = Math.hypot(n.x - b.x, n.y - b.y),
        o = wants.get(n.id);
      if (!o) room = Math.min(room, d - PAD - (FOOTPRINT[n.kind] || 2.4));
      else {
        const gap = d - PAD - g.r1 - o.r1,
          mine = g.want - g.r1,
          theirs = Math.max(0, o.want - o.r1);
        room = Math.min(room, gap <= 0 ? g.r1 : g.r1 + (mine + theirs > gap ? (gap * mine) / (mine + theirs) : mine));
      }
    }
    // Off the lanes as the planner keeps a building of its own.
    for (const l of linesNear(b.x, b.y)) room = Math.min(room, (lineDistance([b.x, b.y], l).d - LANE - 0.1) / LANE_SHARE.own);
    for (const d of districts) {
      const L = d.layout;
      if (Math.abs(L.center[0] - b.x) > 20 || Math.abs(L.center[1] - b.y) > 20) continue;
      if (L.pond) room = Math.min(room, Math.hypot(b.x - L.pond.x, b.y - L.pond.y) - L.pond.rx - 0.4);
      if (L.sign) room = Math.min(room, Math.hypot(b.x - L.sign[0], b.y - L.sign[1]) - 0.9);
    }
    const sp = spec(b.kind, b.seed, b.model, { room });
    homeSpec.set(b.id, sp);
    claim.set(b.id, Math.max(FOOTPRINT[b.kind] || 2.4, sp.reach));
  }
  const specOf = (b) => homeSpec.get(b.id) || spec(b.kind, b.seed, b.model);
  const cellList = [...cellsDrawn.values()];
  for (const d of cellsDrawn.values()) {
    const L = d.layout;
    const [cx, cy] = L.center;
    const owner = d.memberId ? people.get(d.memberId) : null;
    // Terrain has no ownership border. Offset, translucent meadow patches
    // blend into the common ground instead of one outlined island per district.
    const field=rng(L.seed+101),patches=Array.from({length:4},()=>({x:cx+(field()-.5)*17,y:cy+(field()-.5)*17,rx:4+field()*6,ry:2+field()*4}));
    add(ground,{pass:0,bbox:boxOf(cx,cy,28,28,16,16),draw:v=>{
      const P=v.at(0,0);
      for(const p of patches){const [x,y]=P(p.x,p.y);ellipse(x,y,p.rx*v.s,p.ry*v.s*.5,MEADOW,.16);}
    }});
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
    const grove=r()*Math.PI*2;
    for (let i = 0; i < 6; i++) {
      const a = grove+(r()-.5)*1.5,
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
      add(standing, { type: "tree", depth: t.x + t.y, x: t.x, y: t.y, bbox: boxOf(t.x, t.y, 1.3 * t.size, 1.3 * t.size, 2.4 * t.size, 0.6), draw: (v) => treeArt(v, t.x, t.y, t.size, t.tone, season) });
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
          dist = Math.sqrt(rr())*(L.radiusAt(a)-1),
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
    if (!d.passThrough && L.sign && owner) {
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
  for (const link of network.links) {
    // A tiny bend stays inside the already reserved road corridor.
    const [a,b]=link,len=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(2,Math.ceil(len/1.5));
    if(len<.001)continue;
    const line=Array.from({length:steps+1},(_,i)=>{const t=i/steps,w=.24*Math.sin(Math.PI*t)**2*Math.sin(Math.PI*2*t);return[a[0]+(b[0]-a[0])*t-(b[1]-a[1])/len*w,a[1]+(b[1]-a[1])*t+(b[0]-a[0])/len*w];});
    roads.push({line,kind:"road"});
  }
  // A few soft walking links join neighbouring clusters without making every
  // trip go back through the square. They avoid every saved house and pond;
  // later buildings can make a path change, never the other way around.
  const cellMap=new Map(districts.map(d=>[cellKey(d.q,d.r),d]));
  for(const d of districts)for(const [dq,dr] of [[1,0],[0,1],[1,-1]]){
    const neighbour=cellMap.get(cellKey(d.q+dq,d.r+dr));if(!neighbour)continue;
    const a=d.layout.entrance,b=neighbour.layout.entrance,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    if(len<6||len>SPACING*1.35)continue;
    for(const bend of [.18,-.18,0]){
      const mid=[(a[0]+b[0])/2-dy*bend,(a[1]+b[1])/2+dx*bend],steps=Math.ceil(len/.65);
      const line=Array.from({length:steps+1},(_,i)=>{const t=i/steps,u=1-t;return[u*u*a[0]+2*u*t*mid[0]+t*t*b[0],u*u*a[1]+2*u*t*mid[1]+t*t*b[1]];});
      if(line.some(([x,y])=>Math.hypot(x,y)<PLAZA+1||blockedByHome(x,y,.7)||[d,neighbour].some(c=>c.layout.pond&&Math.hypot(x-c.layout.pond.x,y-c.layout.pond.y)<c.layout.pond.rx+.6)))continue;
      roads.push({line,kind:"footpath"});break;
    }
  }
  for (const key of network.cells) {
    const [q, r] = key.split(",").map(Number);
    const L = layoutOf(q, r);
    const childKeys = Object.keys(L.gates);
    L.lanes.forEach((line, i) => {
      // Lanes towards cells nobody has settled yet are only a dirt track.
      const leadsTo = i > 0 ? childKeys[i - 1] : null;
      const live = L.monument || i === 0 || (leadsTo && (network.cells.has(leadsTo) || built.has(leadsTo)));
      if(live)roads.push({ line, kind: "road" });
    });
  }
  for (const r of roads) {
    const bbox = lineBox(r.line, 3);
    if (r.kind === "road") {
      add(ground, { pass: 2, bbox, draw: (v) => strokeLine(v, r.line, LANE * 1.25 + 0.25, ROAD_EDGE) });
      add(ground, { pass: 3, bbox, draw: (v) => strokeLine(v, r.line, LANE * 1.25, ROAD) });
    } else add(ground, { pass: 3, bbox, draw: (v) => strokeLine(v, r.line, LANE * .72, TRACK, 0.72) });
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
    const sp = specOf(b);
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
    // An enlarged building of its own may reach past its box (sp.reach).
    const half = Math.max((sp.hw + 1.4) * 1.75, (sp.reach || 0) * 1.25 + 1);
    add(standing, {
      type: "building", id: b.id, building: b, owner, sp, depth: b.x + b.y, x: b.x, y: b.y,
      bbox: boxOf(b.x, b.y, half, half, up + 0.3, Math.max(sp.hw + 1.9, (sp.reach || 0) * 0.75 + 1)),
      hit: boxOf(b.x, b.y, sp.hw * 1.8, sp.hw * 1.8, up - 0.6, sp.hw * 1.05),
      top: ridgeOf(sp),
      draw: (v) => {
        const base = v.at(b.x, b.y);
        const P = b.facing ? mirrored(base) : base;
        buildingSVG(P, sp, b.seed, { lit: lit.has(b.id) || (sky.night > 0.5 && sp.lit), detail: v.detail, shadowP: base });
        if (season === "winter" && v.detail >= 1) snowSVG(P, sp);
        // Five days without a finished session and the ivy creeps in; the next one clears it.
        if (v.detail === 2 && owner?.chainEnd && Date.now() - owner.chainEnd > 5 * 86400000) vinesSVG(P, sp, b.seed);
        if (v.detail === 2 && b.patched) patchSVG(P, sp, b.seed);
      },
    });
  }
  // Move mode: the free plots the picked building can go to.
  spots.forEach((s, i) => {
    add(standing, {
      type: "building", id: `spot-${i}`, building: { spot: true, ...s }, sp: { hw: 1.7 }, depth: s.x + s.y + 0.01, x: s.x, y: s.y,
      bbox: boxOf(s.x, s.y, 4, 4, 3.4, 2.6), hit: boxOf(s.x, s.y, 2.6, 2.6, 2.6, 1.8), top: 2.2,
      draw: (v) => spotArt(v, s),
    });
  });
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
    if (home && home.x !== null) return { x: home.x, y: home.y, z: ridgeOf(specOf(home)) + 1.2, building: home };
    const d = districts.find((dd) => dd.memberId === memberId);
    return d ? { x: d.layout.sign[0], y: d.layout.sign[1], z: 2.4 } : null;
  };
  const balloons = [],
    walkers = [],
    smoke = [],
    glows = [];
  for (const m of members) {
    const focus = focusing(m, now);
    // A warm, breathing window light at the home of whoever is focusing.
    const home = newest.get(m.id);
    if (focus && home && home.x !== null) {
      const sp = specOf(home);
      glows.push({ member: m, x: home.x, y: home.y, z: ridgeOf(sp) * 0.42, r: sp.hw + 1.6, seed: home.seed % 97 });
    }
    if (m.status === "here" || m.status === "break" || (focus && m.status !== "coming")) {
      const a = anchorOf(m.id);
      if (!a) continue;
      balloons.push({ member: m, ...a, focus });
      if (m.status === "here" && a.building) {
        const sp = specOf(a.building);
        if (sp.chimney) {
          const [cx, cy, cz] = chimneyTop(sp);
          const [wx, wy] = a.building.facing ? [cy, cx] : [cx, cy];
          smoke.push({ x: a.building.x + wx, y: a.building.y + wy, z: cz, seed: a.building.seed });
        }
      }
    } else if (m.status === "coming") {
      const d = districts.find((dd) => dd.memberId === m.id);
      if (d) {
        const path = pathToPlaza(groupKey, d, monuments);
        walkers.push({ member: m, path, box: pathBox(path) });
      }
    }
  }
  // Villagers: in up to six lived-in districts (an owner and at least one
  // building) one neighbour strolls along the lanes to the square and back.
  // Buildings only know their owner, so each goes to the owner's nearest district.
  const ownDistricts = new Map(),
    homesIn = new Map();
  for (const d of districts)
    if (d.memberId && people.has(d.memberId)) {
      if (!ownDistricts.has(d.memberId)) ownDistricts.set(d.memberId, []);
      ownDistricts.get(d.memberId).push(d);
    }
  for (const b of homes) {
    let best = null,
      gap = RADIUS + 4;
    for (const d of ownDistricts.get(b.memberId) || []) {
      const dist = Math.hypot(b.x - d.layout.center[0], b.y - d.layout.center[1]);
      if (dist < gap) [best, gap] = [d, dist];
    }
    if (best) homesIn.set(best.id, (homesIn.get(best.id) || 0) + 1);
  }
  // The busiest district of each neighbour first, then the next ones, so six
  // villagers spread over six people before anyone gets a second.
  const turns = new Map();
  const villagers = [...ownDistricts.values()]
    .flat()
    .filter((d) => homesIn.get(d.id))
    .sort((a, b) => homesIn.get(b.id) - homesIn.get(a.id))
    .map((d) => {
      const turn = turns.get(d.memberId) || 0;
      turns.set(d.memberId, turn + 1);
      return { d, turn };
    })
    .sort((a, b) => a.turn - b.turn)
    .slice(0, 6)
    .map(({ d }) => villagerOf(groupKey, d, monuments));
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
    items, query, bounds, area, districts, walkingLinks:roads.filter(r=>r.kind==="footpath").map(r=>r.line),balloons, walkers, villagers, glows, smoke, buildings: homes, lit, farLabels,
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

// Where a path lies on screen (iso units, with room for a figure): the map
// keeps its loop running for a walker only while their road can be seen.
function pathBox(path) {
  let box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of path.points) {
    const [sx, sy] = screenOf(x, y);
    box = [Math.min(box[0], sx - 3), Math.min(box[1], sy - 4), Math.max(box[2], sx + 3), Math.max(box[3], sy + 1)];
  }
  return box;
}
// A neighbour of a lived-in district: how they look, how fast they stroll and
// where they stand when nothing moves.
function villagerOf(groupKey, district, monuments) {
  const r = rng(district.layout.seed + 41);
  const path = pathToPlaza(groupKey, district, monuments);
  const hat = Math.floor(r() * 3);
  return {
    id: district.id,
    path,
    box: pathBox(path),
    coat: COATS[Math.floor(r() * COATS.length)],
    skin: SKINS[Math.floor(r() * SKINS.length)],
    hat,
    hatColor: HATS[hat][Math.floor(r() * HATS[hat].length)],
    speed: 0.95 + r() * 0.35, // world units a second: a stroll, slower than a friend on the way
    phase: r(),
    rest: 0.15 + r() * 0.5,
  };
}

// From a district's hub, along its lanes and the roads, to the plaza.
function pathToPlaza(groupKey, district, monuments = new Set()) {
  const path = [];
  const layoutOf = (q, r) => cellLayout(groupKey, q, r, monuments.has(cellKey(q, r)));
  let L = layoutOf(district.q, district.r);
  path.push(...[...L.lanes[0]].reverse());
  let q = district.q,
    r = district.r;
  while (!(q === 0 && r === 0)) {
    const [pq, pr] = parentOf(q, r);
    const parent = layoutOf(pq, pr);
    const gate = parent.gates[cellKey(q, r)];
    if (pq === 0 && pr === 0) {
      path.push(gate, [gate[0] * 0.35, gate[1] * 0.35]);
      break;
    }
    const keys = Object.keys(parent.gates);
    // A monument's ring lanes run from its entrance straight to each gate.
    const lane = parent.lanes[(parent.monument ? 0 : 1) + keys.indexOf(cellKey(q, r))];
    if (lane) path.push(...[...lane].reverse());
    if (!parent.monument) path.push(...[...parent.lanes[0]].reverse());
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

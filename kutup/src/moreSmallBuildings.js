// n52: four more builds, one for each corner of the catalogue: a log cabin
// with a turf roof (Konut), a village smithy (İşlevsel), an octagonal garden
// pavilion (Süs) and Kız Kulesi on its rock (Ünlü Yapı). Same rules as n48:
// each is drawn once and the same drawing builds the site, the catalogue
// portrait and the village (rareBuildings.js design()); one drawing unit is
// 1.6 m (shared/olcek.js) and every stage is a real step of the real trade.
import { box, poly, seg, ellipse, LIT } from "./iso.js";
import { lathe, shade, unit } from "./kit.js";
import { design, WOOD, STONE, STEEL, TILE, window, plate, quad, beam } from "./rareBuildings.js";
import { MARBLE, LEAD, RED, GREEN, STRAW, IRON, SOOT, WATER, CLAY, disc, bush, pondPts } from "./smallBuildings.js";

const LOGS = [["#c99d66", "#a98048", "#8a6537"], ["#be9159", "#9d7342", "#7f5b30"], ["#d1a671", "#b08650", "#916c3c"]],
  FIREBRICK = ["#d9b97c", "#bf9c5c", "#a07f43"],
  BRICK = ["#c4684a", "#a5543b", "#864330"],
  SOD = ["#8cb15d", "#729946", "#5a7e37"],
  CREAM = ["#f1e8d0", "#dccfaf", "#bfb08c"],
  ROCK = ["#b9b2a3", "#9b9384", "#7e7769"],
  SEA = "#7eb4c6",
  FOAM = "#e4f2f4";
const clamp01 = (v) => Math.max(0, Math.min(1, v));
// A vertical stake or post standing on the ground.
const stake = (P, x, y, z0, z1, w, c = WOOD) => box(P, x - w, y - w, x + w, y + w, z0, z1, c);

// ---------- Kütük Ev ----------
// A scribe-fit log cabin: stone pier footings, sill log and floor joists,
// twelve log courses with saddle-notched corners that overlap and lock,
// sliding door and window frames, a gable roof with rafters, boards, a
// waterproof membrane and a turf layer, a stove pipe, steps and a woodpile.
const CAB = { X: 1.25, Y: 0.95, T: 0.075, Z0: 0.3, C: 0.125, N: 12 };
function cabin(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  const { X, Y, T, Z0, C, N } = CAB, zj = Z0 + 0.07, zt = zj + N * C;
  let s = quad(P, -2.2, -1.7, 2.2, 1.7, 0.01, "#b4d78d");
  if (detail) for (let i = 0; i < 26; i++) s += seg(P(-2 + ((i * 53) % 40) / 10, -1.5 + ((i * 37) % 30) / 10, 0.015), P(-1.96 + ((i * 53) % 40) / 10, -1.5 + ((i * 37) % 30) / 10, 0.1), "#7ea352", 0.6);
  // stone piers: the cabin never touches the ground
  const piers = [[-1.1, -0.8], [0, -0.8], [1.1, -0.8], [-1.1, 0.8], [0, 0.8], [1.1, 0.8]],
    np = Math.round(piers.length * Math.min(1, b / 0.6));
  for (let i = 0; i < np; i++) s += box(P, piers[i][0] - 0.14, piers[i][1] - 0.14, piers[i][0] + 0.14, piers[i][1] + 0.14, 0, Z0, STONE);
  // floor joists across the piers
  if (b > 0.6) for (const x of [-1.1, 0, 1.1]) s += box(P, x - 0.05, -0.93, x + 0.05, 0.93, Z0, zj, WOOD);
  if (sk > 0.5) {
    // the floor boards
    s += box(P, -X + 0.08, -Y + 0.08, X - 0.08, Y - 0.08, zj - 0.01, zj, ["#d6aa72", "#b78a52", "#996f3b"]);
    if (detail) for (let x = -1.1; x < 1.2; x += 0.22) s += seg(P(x, -Y + 0.08, zj + 0.002), P(x, Y - 0.08, zj + 0.002), "#8c6a3d", 0.45);
  }
  // the log courses: the sill log is the last step of the footing
  const courses = b > 0.85 ? 1 + Math.floor(f * (N - 1) + 1e-6) : 0;
  for (let i = 0; i < courses; i++) {
    const z0 = zj + i * C, z1 = z0 + C - 0.008, long = i % 2 === 0, ex = long ? 0.17 : -0.05, ey = long ? -0.05 : 0.17, c = LOGS[i % 3];
    s += box(P, -X - ex, -Y - T, X + ex, -Y + T, z0, z1, c);
    s += box(P, -X - T, -Y - ey, -X + T, Y + ey, z0, z1, LOGS[(i + 1) % 3]);
    s += box(P, X - T, -Y - ey, X + T, Y + ey, z0, z1, LOGS[(i + 1) % 3]);
    s += box(P, -X - ex, Y - T, X + ex, Y + T, z0, z1, c);
    if (detail && long) s += ellipse(...P(X + ex, Y, (z0 + z1) / 2), 1.7, 1.7, "#7a5530") + ellipse(...P(-X - ex, Y, (z0 + z1) / 2), 1.7, 1.7, "#7a5530");
  }
  // the gable ends are laid up in shortening logs once the walls are done
  if (f > 0.99) {
    const peak = 0.78;
    s += poly([P(X + T, -Y, zt), P(X + T, Y, zt), P(X + T, 0, zt + peak)], LOGS[1][2]);
    if (detail) for (let z = zt + 0.12; z < zt + peak - 0.05; z += 0.12) {
      const w = Y * (1 - (z - zt) / peak);
      s += seg(P(X + T + 0.002, -w, z), P(X + T + 0.002, w, z), "#6a4826", 0.55);
    }
  }
  if (sk > 0) {
    // door and window frames slide on the wall, never nailed to the logs
    const wall = Y + T + 0.004;
    s += window(P, -0.95, wall, 0.78, 0.55, 0.5, lit) + plate(P, 0.35, wall, zj, 0.5, 1.05, "#5d4128") + plate(P, 0.4, wall + 0.003, zj + 0.05, 0.4, 0.95, "#7a5636");
    if (sk > 0.8) s += window(P, X + T + 0.004, -0.35, 0.85, 0.55, 0.5, lit, "x") + box(P, 0.28, wall - 0.02, 0.92, wall + 0.03, zj + 1.05, zj + 1.12, WOOD);
    if (detail && sk > 0.8) s += seg(P(0.75, wall + 0.004, zj + 0.5), P(0.78, wall + 0.004, zj + 0.52), "#2f2a24", 1.6);
  }
  if (r > 0) {
    // roof plane: ridge at y = 0, eave at y = +/-1.25
    const zr = zt + 0.78, ze = zt - 0.18, Ye = 1.25, Xe = 1.65,
      zy = (y) => zr - (y / Ye) * (zr - ze);
    const strip = (prog, z0, color, y0 = 0, y1 = Ye) => {
      if (prog <= 0) return "";
      const x1 = -Xe + 2 * Xe * Math.min(1, prog);
      return poly([P(-Xe, y1, zy(y1) + z0), P(x1, y1, zy(y1) + z0), P(x1, y0, zy(y0) + z0), P(-Xe, y0, zy(y0) + z0)], color);
    };
    const nR = Math.round(12 * clamp01(r / 0.3));
    for (let i = 0; i < nR; i++) {
      const x = -Xe + (2 * Xe * i) / 11;
      s += seg(P(x, Ye, ze), P(x, 0, zr), WOOD[2], 1.6);
    }
    if (r > 0.3) s += strip((r - 0.3) / 0.25, 0, "#c5a06b");
    if (r > 0.55) s += strip((r - 0.55) / 0.2, 0.012, "#3e3f43");
    if (r > 0.75) {
      const prog = (r - 0.75) / 0.25;
      s += strip(prog, 0.05, SOD[0]);
      const x1 = -Xe + 2 * Xe * Math.min(1, prog);
      // the turf slab's edge and the board that holds it at the eave
      s += poly([P(-Xe, Ye, zy(Ye) + 0.05), P(x1, Ye, zy(Ye) + 0.05), P(x1, Ye, zy(Ye) - 0.08), P(-Xe, Ye, zy(Ye) - 0.08)], "#7a5732");
      if (detail) for (let i = 0; i < 70 * Math.min(1, prog); i++) {
        const x = -Xe + ((i * 41) % 100) / 100 * (x1 + Xe), y = 0.05 + (((i * 67) % 100) / 100) * (Ye - 0.1);
        s += seg(P(x, y, zy(y) + 0.05), P(x + 0.015, y, zy(y) + 0.13), SOD[2], 0.6);
      }
      if (detail && prog > 0.6) for (const [x, y, c] of [[-0.9, 0.5, "#f2f0e6"], [0.2, 0.9, "#f4d36a"], [1.1, 0.35, "#f2f0e6"]]) s += ellipse(...P(x, y, zy(y) + 0.1), 1.3, 1.3, c);
    }
    if (r > 0.9) s += seg(P(-Xe, 0, zr + 0.03), P(Xe, 0, zr + 0.03), SOD[2], 1.6);
  }
  if (fit > 0) {
    // stove pipe through the roof with a fire-safe collar
    const px = 0.85, py = 0.4, zy0 = zt + 0.78 - (py / 1.25) * 0.96;
    s += lathe(P, px, py, [[0.05, zy0 - 0.02], [0.05, zy0 + 0.75], [0.07, zy0 + 0.77], [0.07, zy0 + 0.82]], STEEL, { n: 8 });
    s += lathe(P, px, py, [[0.12, zy0], [0.1, zy0 + 0.06], [0.05, zy0 + 0.1]], LEAD, { n: 8 });
    // steps to the door
    for (let j = 0; j < 3; j++) s += box(P, 0.28, Y + T + 0.05 + j * 0.2, 0.92, Y + T + 0.25 + j * 0.2, 0, 0.3 - j * 0.1 + (j === 2 ? 0.0 : 0), WOOD);
    // woodpile against the front wall
    for (let row = 0; row < 3; row++) for (let c = 0; c < 6 - row; c++) s += ellipse(...P(-1.3 + c * 0.14 + row * 0.07, Y + T + 0.12, 0.08 + row * 0.13), 2.6, 2.6, LOGS[(c + row) % 3][0]) + (detail ? ellipse(...P(-1.3 + c * 0.14 + row * 0.07, Y + T + 0.12, 0.08 + row * 0.13), 1.1, 1.1, "#7a5530") : "");
    // a chopping block with an axe
    s += lathe(P, 1.55, 0.95, [[0.17, 0], [0.16, 0.34], [0, 0.35]], LOGS[0], { n: 10 }) + seg(P(1.55, 0.95, 0.35), P(1.6, 0.9, 0.62), WOOD[2], 1.3) + poly([P(1.59, 0.9, 0.6), P(1.66, 0.9, 0.66), P(1.64, 0.9, 0.54)], STEEL[1]);
    if (lit) s += box(P, 0.52, Y + T + 0.006, 0.6, Y + T + 0.02, 1.05, 1.13, [LIT, "#e8b85a", "#c99a46"]);
  }
  return s;
}

// ---------- Demirci Atölyesi ----------
// A village smithy: stone paving and plinth, a firebrick forge on its own
// foundation backed by a stone wall (nothing that burns near the fire),
// timber posts under a single-pitch tiled roof, a tall brick chimney, a
// bellows, the anvil on a buried oak stump at knuckle height, a quench
// trough, a tool rack and a pile of charcoal.
const roofS = (y) => 2.1 - 0.28 * (y + 1.05);
function smithy(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = quad(P, -2.1, -1.55, 2.1, 1.9, 0.01, "#cdb98f");
  if (detail) for (let i = 0; i < 44; i++) s += ellipse(...P(-2 + ((i * 47) % 40) / 10, -1.4 + ((i * 31) % 33) / 10, 0.012), 1.0, 0.6, "#b9a27a");
  if (b > 0) {
    s += quad(P, -1.45, -1.0, 1.45, 0.75, 0.03, "#aaa392");
    if (detail) {
      for (let x = -1.45; x < 1.46; x += 0.35) s += seg(P(x, -1.0, 0.035), P(x, 0.75, 0.035), "#8e887a", 0.5);
      for (let y = -1.0; y < 0.76; y += 0.35) s += seg(P(-1.45, y, 0.035), P(1.45, y, 0.035), "#8e887a", 0.5);
    }
    s += box(P, -1.5, -1.12, 1.5, -0.9, 0, 0.12 * Math.min(1, b * 1.5), STONE);
    // the forge stands on its own foundation, not on the paving
    s += box(P, 0.25, -0.88, 1.3, -0.25, 0.03, 0.5 * Math.min(1, b * 1.2), STONE);
    if (b > 0.6) s += lathe(P, -0.35, 0.3, [[0.2, 0.03], [0.2, 0.08], [0, 0.09]], STONE, { n: 10 });
  }
  const posts = [[-1.4, -0.95, 2.05], [0, -0.95, 2.05], [1.4, -0.95, 2.05], [-1.4, 0.5, 1.65], [1.4, 0.5, 1.65]];
  if (sk > 0) {
    // the back wall is stone, courses breaking joint; the left wall is boards
    const top = 1.75 * Math.min(1, sk * 1.4);
    s += box(P, -1.5, -1.05, 1.5, -0.88, 0.12, top, STONE);
    if (detail) for (let z = 0.3, i = 0; z < top; z += 0.18, i++) {
      s += seg(P(-1.5, -0.879, z), P(1.5, -0.879, z), STONE[2], 0.5);
      for (let x = -1.45 + (i % 2) * 0.22; x < 1.5; x += 0.44) s += seg(P(x, -0.879, z), P(x, -0.879, z + 0.18), STONE[2], 0.45);
    }
    s += box(P, -1.5, -0.88, -1.42, 0.5, 0.0, 1.7 * Math.min(1, sk * 1.4), WOOD);
    if (detail) for (let y = -0.8; y < 0.5; y += 0.14) s += seg(P(-1.419, y, 0.05), P(-1.419, y, 1.7 * Math.min(1, sk * 1.4)), WOOD[2], 0.5);
  }
  // forge body: firebrick hearth, then the hood (davlumbaz) narrowing into the flue
  if (sk > 0.2) {
    s += box(P, 0.35, -0.86, 1.25, -0.32, 0.5, 0.86, FIREBRICK);
    s += quad(P, 0.45, -0.8, 1.15, -0.4, 0.87, lit ? "#ff7a2a" : "#7b3b1c");
    if (detail) for (let i = 0; i < 12; i++) s += ellipse(...P(0.5 + (i % 4) * 0.2, -0.76 + Math.floor(i / 4) * 0.13, 0.875), 1.7, 1.2, lit ? (i % 2 ? "#ffd05a" : "#ff5d1c") : (i % 2 ? "#a14a22" : "#4e2b1b"));
    if (detail) for (let z = 0.58; z < 0.86; z += 0.1) s += seg(P(0.35, -0.319, z), P(1.25, -0.319, z), FIREBRICK[2], 0.45) + seg(P(1.251, -0.86, z), P(1.251, -0.32, z), FIREBRICK[2], 0.45);
    if (sk > 0.6) {
      const h = Math.min(1, (sk - 0.6) / 0.4);
      const hoodTop = 0.87 + 0.55 * h;
      s += poly([P(0.35, -0.32, 1.08), P(1.25, -0.32, 1.08), P(1.25, -0.32, 1.08 + 0.34 * h)], FIREBRICK[0], 0) +
        poly([P(0.35, -0.32, 1.12), P(1.25, -0.32, 1.12), P(0.95, -0.7, hoodTop), P(0.65, -0.7, hoodTop)], FIREBRICK[1]) +
        poly([P(1.25, -0.32, 1.12), P(1.25, -0.86, 1.12), P(0.95, -0.86, hoodTop), P(0.95, -0.7, hoodTop)], FIREBRICK[2]);
    }
  }
  for (const [x, y, hh] of posts) if (f > 0) s += stake(P, x, y, 0.1, 0.1 + (hh - 0.1) * f, 0.06);
  if (f > 0.9) {
    s += box(P, -1.5, -1.04, 1.5, -0.86, 2.0, 2.1, WOOD) + box(P, -1.5, 0.45, 1.5, 0.56, 1.6, 1.68, WOOD);
    s += box(P, 1.36, -0.95, 1.46, 0.5, 1.64, 1.72, WOOD);
  }
  if (r > 0) {
    // single-pitch roof running down to the front; tiles are laid from the eave up
    const rows = Math.round(10 * Math.min(1, r * 1.1)), y0 = 0.85, y1 = -1.1;
    const rafters = Math.round(9 * Math.min(1, r / 0.25));
    for (let i = 0; i < rafters; i++) {
      const x = -1.55 + (3.1 * i) / 8;
      s += seg(P(x, y0, roofS(y0)), P(x, y1, roofS(y1)), WOOD[2], 1.5);
    }
    for (let i = 0; i < rows; i++) {
      const ya = y0 - (i * (y0 - y1)) / 10, yb = y0 - ((i + 1) * (y0 - y1)) / 10;
      s += poly([P(-1.58, ya, roofS(ya) + 0.02), P(1.58, ya, roofS(ya) + 0.02), P(1.58, yb, roofS(yb) + 0.02), P(-1.58, yb, roofS(yb) + 0.02)], TILE[i % 2 ? 0 : 1]);
      if (detail) for (let x = -1.58 + (i % 2) * 0.1; x < 1.58; x += 0.2) s += seg(P(x, ya, roofS(ya) + 0.025), P(x, yb, roofS(yb) + 0.025), TILE[2], 0.45);
    }
    if (rows >= 10) s += seg(P(-1.58, y0, roofS(y0) + 0.03), P(1.58, y0, roofS(y0) + 0.03), TILE[2], 1.6);
  }
  if (sk > 0.6) {
    // the brick chimney rises well above the ridge so the draught pulls
    const ct = 3.15 * Math.min(1, 0.45 + (sk - 0.6) * 1.4);
    s += box(P, 0.7, -0.82, 0.98, -0.58, 1.5, ct, BRICK);
    if (detail) for (let z = 1.62; z < ct; z += 0.14) s += seg(P(0.7, -0.579, z), P(0.98, -0.579, z), BRICK[2], 0.45) + seg(P(0.981, -0.82, z), P(0.981, -0.58, z), BRICK[2], 0.45);
    if (sk > 0.95) s += box(P, 0.66, -0.86, 1.02, -0.54, ct, ct + 0.06, STONE) + box(P, 0.74, -0.78, 0.94, -0.62, ct + 0.06, ct + 0.1, SOOT);
  }
  if (r > 0.5) for (const [x, y, hh] of posts.slice(3)) s += stake(P, x, y, 0.1, hh, 0.06);
  if (fit > 0) {
    // the anvil: a stump and an anvil with its horn pointing at the forge
    s += lathe(P, -0.35, 0.3, [[0.18, 0.08], [0.16, 0.3], [0.17, 0.52], [0, 0.53]], LOGS[0], { n: 12 });
    s += box(P, -0.5, 0.2, -0.2, 0.4, 0.53, 0.63, SOOT) + box(P, -0.44, 0.24, -0.26, 0.36, 0.63, 0.7, SOOT);
    s += poly([P(-0.2, 0.2, 0.63), P(-0.2, 0.4, 0.63), P(-0.06, 0.3, 0.66)], SOOT[0]);
    if (lit && detail) s += ellipse(...P(-0.4, 0.3, 0.72), 2.2, 1.5, "#ff8d3a");
    // bellows: a wedge of leather on the forge's side
    s += poly([P(-0.2, -0.72, 0.5), P(0.3, -0.7, 0.55), P(0.3, -0.5, 0.55), P(-0.2, -0.52, 0.5)], "#7a5a3a") + poly([P(-0.2, -0.72, 0.5), P(-0.2, -0.52, 0.5), P(-0.2, -0.52, 0.72), P(-0.2, -0.72, 0.62)], "#5e4329") + seg(P(-0.2, -0.62, 0.62), P(-0.55, -0.62, 0.9), WOOD[2], 1.2);
    // the quench trough
    s += box(P, -1.3, 0.05, -0.75, 0.35, 0, 0.3, WOOD) + quad(P, -1.27, 0.08, -0.78, 0.32, 0.27, WATER);
    if (detail) s += seg(P(-1.2, 0.15, 0.272), P(-1.0, 0.15, 0.272), "#d4eaf0", 0.6);
    // charcoal heap and sacks beside the forge
    s += lathe(P, 1.2, -0.12, [[0.34, 0.03], [0.26, 0.2], [0.08, 0.3], [0, 0.32]], SOOT, { n: 9 });
    // tool rack on the left wall: hammers, tongs, chisels
    if (sk > 0.6) {
      s += box(P, -1.41, -0.7, -1.36, 0.1, 1.15, 1.2, WOOD);
      for (let i = 0; i < 6; i++) s += seg(P(-1.355, -0.62 + i * 0.13, 1.15), P(-1.355, -0.62 + i * 0.13, 0.86 + (i % 3) * 0.05), i % 2 ? STEEL[2] : IRON, 1.2) + (i % 2 ? "" : seg(P(-1.355, -0.66 + i * 0.13, 0.9), P(-1.355, -0.58 + i * 0.13, 0.9), IRON, 1.8));
    }
    // sign: a horseshoe on an iron bracket at the open front
    s += seg(P(1.36, 0.5, 1.5), P(1.36, 0.88, 1.5), IRON, 1.1) + seg(P(1.36, 0.88, 1.5), P(1.36, 0.88, 1.35), IRON, 0.7);
    for (let i = 0; i < 9; i++) {
      const a0 = Math.PI * (0.2 + (1.6 * i) / 9), a1 = Math.PI * (0.2 + (1.6 * (i + 1)) / 9);
      s += seg(P(1.37, 0.88 + 0.09 * Math.cos(a0), 1.26 + 0.09 * Math.sin(a0)), P(1.37, 0.88 + 0.09 * Math.cos(a1), 1.26 + 0.09 * Math.sin(a1)), IRON, 1.4);
    }
  }
  return s;
}

// ---------- Sekizgen Köşk ----------
// An octagonal garden pavilion: a stone plinth, eight posts on steel shoes,
// a ring beam that ties the plan together, rails and balusters on seven
// sides (the eighth is the way in), a plank floor laid out from the centre,
// a hipped roof of eight triangular facets, a finial and a hanging lamp.
const OCT_R = 1.25, OCT_H = 1.5, OCT_PEAK = 2.45;
const oct = (i, r = OCT_R) => [r * Math.cos(((22.5 + 45 * i) * Math.PI) / 180), r * Math.sin(((22.5 + 45 * i) * Math.PI) / 180)];
function kiosk(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  const zf = 0.16;
  let s = quad(P, -2.1, -1.75, 2.1, 2.2, 0.01, "#b3d68a");
  if (b > 0) {
    const hp = zf * Math.min(1, b * 1.4);
    s += lathe(P, 0, 0, [[OCT_R + 0.18, 0], [OCT_R + 0.18, hp]], STONE, { n: 8, from: (22.5 * Math.PI) / 180 });
    s += poly(Array.from({ length: 8 }, (_, i) => P(...oct(i, OCT_R + 0.18), hp)), STONE[0]);
    // two stone steps up through the open side
    for (let j = 0; j < 2; j++) s += box(P, -0.42, OCT_R * 0.924 + 0.18 + j * 0.2, 0.42, OCT_R * 0.924 + 0.38 + j * 0.2, 0, Math.max(0.02, hp * (1 - 0.5 * (j + 1) / 2)), STONE);
  }
  if (sk > 0.3) {
    s += poly(Array.from({ length: 8 }, (_, i) => P(...oct(i, OCT_R + 0.03), zf + 0.015)), "#d6aa72");
    if (detail) for (let i = 0; i < 16; i++) {
      const [x, y] = oct(i / 2 + 0.5 * (i % 2), OCT_R + 0.03);
      s += seg(P(0, 0, zf + 0.02), P(x, y, zf + 0.02), "#8c6a3d", 0.45);
    }
  }
  // draw order: far to near
  const order = [...Array(8).keys()].sort((a, c) => oct(a).reduce((u, v) => u + v) - oct(c).reduce((u, v) => u + v));
  const edges = [...Array(8).keys()].sort((a, c) => {
    const mid = (e) => [(oct(e)[0] + oct(e + 1)[0]) / 2, (oct(e)[1] + oct(e + 1)[1]) / 2];
    return mid(a)[0] + mid(a)[1] - (mid(c)[0] + mid(c)[1]);
  });
  const nSide = Math.round(7 * sk);
  let seatOn = 0;
  const drawEdge = (e) => {
    if (e === 1) return "";
    let t = "";
    const [x0, y0] = oct(e), [x1, y1] = oct(e + 1);
    const idx = [0, 2, 3, 4, 5, 6, 7].indexOf(e);
    if (idx >= nSide) return "";
    t += seg(P(x0, y0, 0.92), P(x1, y1, 0.92), WOOD[2], 2.6) + seg(P(x0, y0, 0.92), P(x1, y1, 0.92), WOOD[0], 1.5);
    t += seg(P(x0, y0, 0.34), P(x1, y1, 0.34), WOOD[2], 2) + seg(P(x0, y0, 0.34), P(x1, y1, 0.34), WOOD[0], 1);
    // balusters at 10 cm clear spacing (a child's head must not pass)
    const n = detail ? 7 : 3;
    for (let j = 1; j <= n; j++) {
      const u = j / (n + 1);
      t += seg(P(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 0.34), P(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 0.92), WOOD[1], 0.8);
    }
    return t;
  };
  const seat = (e) => {
    if (fit <= 0 || ![4, 5, 6].includes(e)) return "";
    const [x0, y0] = oct(e, OCT_R - 0.08), [x1, y1] = oct(e + 1, OCT_R - 0.08), [x2, y2] = oct(e + 1, OCT_R - 0.42), [x3, y3] = oct(e, OCT_R - 0.42);
    return poly([P(x0, y0, 0.46), P(x1, y1, 0.46), P(x2, y2, 0.46), P(x3, y3, 0.46)], "#cfa775") + poly([P(x3, y3, 0.46), P(x2, y2, 0.46), P(x2, y2, 0.34), P(x3, y3, 0.34)], WOOD[1]);
  };
  const post = (i) => {
    const [x, y] = oct(i);
    let t = b > 0.4 ? box(P, x - 0.09, y - 0.09, x + 0.09, y + 0.09, zf, zf + 0.06, ["#c9c6be", "#aeaba3", "#94918a"]) : "";
    if (f > 0) t += box(P, x - 0.055, y - 0.055, x + 0.055, y + 0.055, zf + 0.06, zf + 0.06 + (OCT_H - zf - 0.06) * f, WOOD);
    return t;
  };
  // back posts and rails first, the near ones after
  const backEdges = edges.filter((e) => [4, 5, 6].includes(e));
  for (const e of backEdges) s += drawEdge(e) + seat(e);
  const backPosts = order.slice(0, 4), frontPosts = order.slice(4);
  for (const i of backPosts) s += post(i);
  for (const e of edges.filter((e) => ![4, 5, 6].includes(e))) s += drawEdge(e);
  if (f > 0.9) {
    // the ring beam: one continuous tie round the tops of the posts
    for (let i = 0; i < 8; i++) { const [x0, y0] = oct(i), [x1, y1] = oct(i + 1); s += beam(P, [x0, y0, OCT_H], [x1, y1, OCT_H], 3.1); }
  }
  for (const i of frontPosts) s += post(i);
  if (fit > 0) {
    for (const [x, y] of [[-1.15, 1.75], [1.15, 1.75]]) s += lathe(P, x, y, [[0.14, 0], [0.2, 0.3], [0.22, 0.32]], ["#d58a5e", "#b86c45", "#965335"], { n: 10 }) + bush(P, x, y, 0.45, 0.2, GREEN);
    for (const [x, y] of [[-0.25, 1.85], [0.2, 2.0], [-0.1, 2.12]]) s += disc(P, x, y, 0.025, 0.14, "#cfc7b4", 9);
  }
  if (r > 0) {
    // hipped roof: 8 rafters meet at the peak, the facets are laid back to front
    const E = (i) => [...oct(i, OCT_R * 1.28), OCT_H - 0.03], apex = [0, 0, OCT_PEAK];
    const nR = Math.round(8 * Math.min(1, r / 0.28));
    for (let i = 0; i < nR; i++) s += beam(P, E(i), apex, 2.1);
    const facetOrder = [...Array(8).keys()].sort((a, c) => {
      const am = (e) => ((22.5 + 45 * e + 22.5) * Math.PI) / 180;
      return Math.cos(am(a)) + Math.sin(am(a)) - (Math.cos(am(c)) + Math.sin(am(c)));
    });
    const nF = Math.round(8 * clamp01((r - 0.28) / 0.62));
    for (let q = 0; q < nF; q++) {
      const e = facetOrder[q], a = E(e), c = E((e + 1) % 8), am = ((22.5 + 45 * e + 22.5) * Math.PI) / 180;
      const n = unit([(OCT_PEAK - OCT_H) * Math.cos(am), (OCT_PEAK - OCT_H) * Math.sin(am), OCT_R * 1.28 * 0.924]);
      s += poly([P(...a), P(...c), P(...apex)], shade(P, n, TILE));
      if (detail) for (let j = 1; j < 7; j++) {
        const t = j / 7;
        s += seg(P(a[0] + (apex[0] - a[0]) * t, a[1] + (apex[1] - a[1]) * t, a[2] + (apex[2] - a[2]) * t), P(c[0] + (apex[0] - c[0]) * t, c[1] + (apex[1] - c[1]) * t, c[2] + (apex[2] - c[2]) * t), TILE[2], 0.45);
      }
      s += seg(P(...a), P(...c), WOOD[2], 1.6);
      s += seg(P(...a), P(...apex), TILE[2], 0.9);
    }
    if (r > 0.92) s += lathe(P, 0, 0, [[0.05, OCT_PEAK - 0.02], [0.06, OCT_PEAK + 0.1], [0.03, OCT_PEAK + 0.22], [0.09, OCT_PEAK + 0.3], [0.09, OCT_PEAK + 0.38], [0, OCT_PEAK + 0.48]], ["#d3b56a", "#b39548", "#8c7234"], { n: 8 });
  }
  if (fit > 0) {
    // the hanging lamp over the entrance
    const [lx, ly] = [0, OCT_R * 0.924 - 0.02];
    s += seg(P(lx, ly, OCT_H), P(lx, ly, OCT_H - 0.2), IRON, 0.7) + box(P, lx - 0.06, ly - 0.06, lx + 0.06, ly + 0.06, OCT_H - 0.38, OCT_H - 0.2, lit ? [LIT, "#e8b85a", "#c99a46"] : STEEL);
  }
  return s;
}

// ---------- Kız Kulesi ----------
// Kız Kulesi (the Maiden's Tower) on its islet off Üsküdar: a rock edged by
// a sea wall of dressed stone, a round cut-stone tower with courses and
// arched windows, a corbelled gallery, a narrower upper stage under a lead
// cone and a small lantern, a landing stage on the rock. Drawn as the
// original Kütüp miniature of the landmark, not a survey.
const ISLET = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * 2 * Math.PI, w = 1 + 0.08 * Math.sin(2 * a + 0.6) + 0.05 * Math.cos(5 * a);
  return [2.15 * w * Math.cos(a), 1.05 * w * Math.sin(a)];
});
function wallRing(P, pts, z0, z1, colors) {
  // vertical faces of a polygon outline (counter-clockwise), far to near
  let s = "";
  const faces = pts.map((a, i) => ({ a, c: pts[(i + 1) % pts.length] })).filter(({ a, c }) => (c[1] - a[1]) + (a[0] - c[0]) > 0)
    .sort((u, v) => u.a[0] + u.a[1] + u.c[0] + u.c[1] - (v.a[0] + v.a[1] + v.c[0] + v.c[1]));
  for (const { a, c } of faces) {
    const nx = c[1] - a[1], ny = a[0] - c[0];
    s += poly([P(a[0], a[1], z0), P(c[0], c[1], z0), P(c[0], c[1], z1), P(a[0], a[1], z1)], shade(P, unit([nx, ny, 0.001]), colors));
  }
  return s;
}
function maiden(P, k, lit, detail) {
  const b = k.base || 0, f = k.frame || 0, sk = k.skin || 0, r = k.roof || 0, fit = k.fit || 0;
  let s = poly(pondPts(P, 0.1, 0, 3.1, 1.95, 0.01), SEA);
  if (detail) for (const [x, y, w] of [[-2.7, 0.9, 0.5], [2.6, -0.2, 0.45], [-1.9, -1.5, 0.55], [2.3, 1.4, 0.5], [0.3, 1.75, 0.6], [-2.8, -0.3, 0.35]]) s += seg(P(x - w, y, 0.02), P(x + w, y, 0.02), FOAM, 0.9, 0.8);
  if (b > 0) {
    // the natural rock first, then the sea wall that wraps it
    s += poly(ISLET.map(([x, y]) => P(x * 1.03, y * 1.03, 0.02)), ROCK[2]);
    s += wallRing(P, ISLET.map(([x, y]) => [x * 0.97, y * 0.97]), 0.01, 0.1 + 0.28 * Math.min(1, b), ROCK);
    const zt = 0.1 + 0.28 * Math.min(1, b);
    s += poly(ISLET.map(([x, y]) => P(x * 0.97, y * 0.97, zt)), "#cfc7b3");
    if (detail) for (const rr of [0.78, 0.55]) s += poly(ISLET.map(([x, y]) => P(x * rr, y * rr, zt + 0.002)), rr > 0.6 ? "#c9c0a8" : "#d7cfbc", 0.55);
    if (detail && b > 0.5) for (let i = 0; i < ISLET.length; i++) {
      const [x0, y0] = ISLET[i], [x1, y1] = ISLET[(i + 1) % ISLET.length];
      if (x0 + y0 + x1 + y1 > 0) for (let z = 0.1; z < zt; z += 0.1) s += seg(P(x0 * 0.97, y0 * 0.97, z), P(x1 * 0.97, y1 * 0.97, z), ROCK[2], 0.45);
    }
  }
  const zp = 0.38, tx = -0.35, ty = 0;
  const bodyTop = 2.95, gal = 3.05, upTop = 4.2;
  if (f > 0) {
    // lower stage r = 0.85 to the gallery, then the narrower upper stage
    const h = f * (upTop - zp);
    s += lathe(P, tx, ty, [[0.9, zp], [0.85, zp + 0.1], [0.83, bodyTop], [0.9, gal], [0.9, gal + 0.08], [0.66, gal + 0.08], [0.62, upTop]], CREAM, { n: 24, upto: zp + h });
    if (detail) {
      for (let z = zp + 0.25; z < Math.min(zp + h, upTop); z += 0.2) {
        const rr = z < gal ? 0.84 : 0.63;
        for (let i = 0; i < 18; i++) {
          const a0 = -0.8 + (i / 18) * Math.PI * 1.1, a1 = -0.8 + ((i + 1) / 18) * Math.PI * 1.1;
          s += seg(P(tx + rr * Math.cos(a0), ty + rr * Math.sin(a0), z), P(tx + rr * Math.cos(a1), ty + rr * Math.sin(a1), z), CREAM[2], 0.4, 0.8);
        }
      }
    }
  }
  if (sk > 0 && f > 0.95) {
    // door facing the landing, arched windows round the front half, the gallery with its railing
    const arch = (a, z, w, hgt, rr) => {
      const x = tx + rr * Math.cos(a), y = ty + rr * Math.sin(a);
      return ellipse(...P(x, y, z), w, hgt, "#3b3d44") + ellipse(...P(x, y, z + 0.05), w, w * 0.9, lit ? "#f3cf86" : "#3b3d44");
    };
    s += arch(Math.PI / 2, zp + 0.25, 3.2, 4.6, 0.84);
    const nW = Math.round(5 * sk);
    for (let i = 0; i < nW; i++) s += arch(-0.65 + (i * Math.PI) / 4.3, 1.55, 1.7, 3.2, 0.83);
    for (let i = 0; i < Math.round(4 * sk); i++) s += arch(-0.4 + (i * Math.PI) / 3.4, 3.55, 1.5, 2.8, 0.63);
    if (sk > 0.5) {
      s += lathe(P, tx, ty, [[0.83, bodyTop - 0.12], [0.98, bodyTop - 0.06], [0.98, gal], [0.9, gal]], CREAM, { n: 24 });
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * 2 * Math.PI;
        if (Math.cos(a) + Math.sin(a) > -0.3) s += seg(P(tx + 0.95 * Math.cos(a), ty + 0.95 * Math.sin(a), gal), P(tx + 0.95 * Math.cos(a), ty + 0.95 * Math.sin(a), gal + 0.3), CREAM[2], 0.8);
      }
      for (let i = 0; i < 24; i++) {
        const a0 = (i / 24) * 2 * Math.PI, a1 = ((i + 1) / 24) * 2 * Math.PI;
        if (Math.cos(a0) + Math.sin(a0) > -0.3) s += seg(P(tx + 0.95 * Math.cos(a0), ty + 0.95 * Math.sin(a0), gal + 0.3), P(tx + 0.95 * Math.cos(a1), ty + 0.95 * Math.sin(a1), gal + 0.3), CREAM[1], 1.1);
      }
    }
  }
  if (r > 0) {
    const t = Math.min(1, r * 1.1);
    s += lathe(P, tx, ty, [[0.78, upTop - 0.02], [0.76, upTop + 0.1], [0.5, upTop + 0.5], [0.22, upTop + 0.9], [0.1, upTop + 1.05]], ["#9a4a3a", "#7d3a2e", "#5f2b22"], { n: 24, upto: upTop + 1.1 * t });
    if (r > 0.6) {
      s += lathe(P, tx, ty, [[0.1, upTop + 1.0], [0.1, upTop + 1.5]], CREAM, { n: 10 });
      s += lathe(P, tx, ty, [[0.14, upTop + 1.0], [0.16, upTop + 1.02], [0.16, upTop + 1.36], [0.14, upTop + 1.38]], lit ? ["#fff2b8", "#f4d37a", "#d8b350"] : ["#d6eaf0", "#a9cbd6", "#86abb9"], { n: 10 });
      s += lathe(P, tx, ty, [[0.18, upTop + 1.38], [0.12, upTop + 1.48], [0.01, upTop + 1.62]], LEAD, { n: 10 });
    }
  }
  if (fit > 0) {
    // the landing stage runs out from the rock to the east
    s += box(P, 1.75, -0.12, 2.8, 0.12, 0.2, 0.26, WOOD);
    for (const x of [1.95, 2.35, 2.75]) s += stake(P, x, -0.14, 0.01, 0.34, 0.025) + stake(P, x, 0.14, 0.01, 0.34, 0.025);
    // a small boat tied alongside
    s += poly([P(2.2, 0.28, 0.04), P(2.75, 0.28, 0.04), P(2.85, 0.4, 0.1), P(2.1, 0.4, 0.1)], "#f1f0ea") + poly([P(2.1, 0.4, 0.1), P(2.85, 0.4, 0.1), P(2.75, 0.5, 0.03), P(2.2, 0.5, 0.03)], RED[1]);
    // steps from the stage up to the sea wall
    for (let j = 0; j < 3; j++) s += box(P, 1.5 - j * 0.1, -0.15, 1.6 - j * 0.1, 0.15, 0.2 + j * 0.06, 0.26 + j * 0.06, ROCK);
    if (lit) s += ellipse(...P(tx, ty, upTop + 1.2), 11, 7, "#ffe9a8", 0.35);
    // a gull on the wall
    if (detail) s += seg(P(-1.9, 0.55, 0.62), P(-1.85, 0.55, 0.66), "#f4f4f2", 1.8) + seg(P(-1.85, 0.55, 0.66), P(-1.8, 0.55, 0.6), "#f4f4f2", 1.8);
  }
  return s;
}

const make = (draw, height, wallTop, reach, material, labels, info) => design({ draw, height, wallTop, reach, material, labels, info });
export const MORE_SMALL_BUILDINGS = {
  kutukev: make(cabin, 3.35, 1.87, 1.95, "timber",
    ["Taş ayaklar, ilk kütük ve zemin kirişleri", "Kütük duvarlar ve geçme köşeler", "Zemin tahtaları, kapı ve pencere kasaları", "Mertekler, tahta, örtü ve çimli dam", "Soba borusu, basamaklar ve odun yığını"],
    ["Kütük ev betona gömülmez: altı tekil taş ayaklara oturur, ayaklar don çizgisinin altına kadar iner. İlk (sıra) kütük topraktan en az 30 cm yukarıda tutulur ki yağmur sıçraması ve nem kütüğü çürütmesin. Zemin kirişleri ayakların üstüne dizilir; ayak araları açık kalır, altından hava geçip döşemeyi kuru tutar.", "Kütükler kabuğu soyulup kurutulmuş çam gövdeleridir. Her kütüğün alt yüzüne bir oluk açılır ve altındakinin yuvarlak sırtına oturur (oluk geçme); böylece rüzgâr geçmez. Köşelerde kütük uçları eyer biçimli çentiklerle birbirine kilitlenir ve duvardan taşar: köşe, çivisiz bir geçme gibi çalışır. Kütük sıraları bir uzun, bir kısa kenar olacak biçimde ördürülür.", "Kapı ve pencere boşlukları kütüklerin arasından kesilir. Ahşap duvar kuruyup oturdukça birkaç santim alçalır; bu yüzden kasalar duvara çakılmaz, kayar geçmeyle takılır ve üstte kasanın üstüne boşluk bırakılır. Aksi halde kapı sıkışır, cam çatlar. Döşeme tahtaları kirişlere çakılır, kütük derzlerine keten ya da yün keçe sıkıştırılır.", "Mertekler mahyada buluşur, üstlerine tahta çakılır. Tahtanın üstüne bitümlü örtü serilir (su geçirmez tabaka), onun üstüne çim kütleleri (çimli dam) yerleştirilir. Toprak kışın yalıtım, yazın serinlik verir; ama ıslakken metrekareye yüzlerce kilo bindirdiği için merteklerin kesiti bu yük için seçilir. Saçaktaki tahta toprağın kaymasını tutar.", "Soba borusu çatıdan yanmaz bir yalıtım yakasıyla geçer; boru ile ahşap arasında güvenli boşluk bırakılır. Kapının önüne üç basamak, yanına kış odunu istiflenir. Odun yığını duvardan ayrık durursa kütükleri rutubetle ıslatmaz."]),
  demirci: make(smithy, 3.3, 2.1, 2.0, "timber",
    ["Taş döşeme, ocak temeli ve örs kütüğü", "Meşe dikmeler ve kirişler", "Taş arka duvar, şamot ocak ve davlumbaz", "Tek eğimli kiremit çatı ve tuğla baca", "Körük, örs, söndürme yalağı ve takım rafı"],
    ["Demircinin zemini sıkıştırılmış toprak üstüne taş döşemedir; ahşap zemin kıvılcımdan yanar. Ocağın kaidesi döşemeden ayrı, kendi temeline oturur çünkü ağır örs ve ocak hiç sallanmamalıdır. Örsün altına toprağa gömülü bir meşe kütük yerleştirilir: darbe böylece toprağa iner.", "Çatıyı taşıyan dikmeler meşe ve kestane gibi sert ve çürümeye dayanıklı ağaçtan seçilir. Ocağın arkası ve yanı taş duvardır; ahşap kiriş ve dikmeler ocak ağzından yeterince uzakta tutulur. Dikmeler taş döşemeye kadar iner, çürümemesi için toprağa değmez.", "Ocak şamot (ateş tuğlası) ile örülür; demir 1100–1200 °C civarında dövüldüğü için sıradan tuğla bu ısıda çatlar. Ocağın üstünde davlumbaz, dumanı toplayarak bacaya yönlendirir. Arka duvar taştır; çünkü ocağın ısısı ahşabı kömürleştirir.", "Çatı tek eğimli, tüm suyu öne akıtır. Kiremit yanmaz ve kıvılcımı geri sektirmez. Baca çatıdan ve kirişlerden güvenli aralıkla geçer ve mahyanın en az bir metre üstüne çıkar; yüksek baca daha güçlü çekiş (baca etkisi) demektir. Başlık yağmuru ve rüzgâr geri tepmesini keser.", "Körük kömüre hava üfler ve ateşi demir kızdıracak sıcaklığa çıkarır. Örs, duran elin yumruğunun hizasında (bileğin yanında) yükseklikte durur. Söndürme yalağı su doludur ve ocağa yakındır: sıçrayan kıvılcım ve kızgın parça hemen söner. Kıskaç, çekiç ve keskiler takım rafına asılır."]),
  kosk: make(kiosk, 3.0, 1.5, 1.7, "timber",
    ["Sekizgen taş kaide, basamaklar ve çelik papuçlar", "Sekiz dikme ve halka kiriş", "Korkuluk, balusterler ve ışınsal zemin", "Sekiz parçalı kırma çatı", "Oturma sekileri, asma fener ve bitkiler"],
    ["Sekizgenin sekiz kenarı tam eşit olmalıdır; yoksa çatı oturmaz. Merkezden ip ve sabit yarıçapla köşeler işaretlenir: yarıçap kenarın yaklaşık 1,31 katıdır (kenar = 0,765 × yarıçap). Kaide su toplamasın diye kenara doğru hafif eğimle döşenir.", "Sekiz dikme çelik papuçlara oturur; papuç ahşabı taş kaideden ayırır ve nemden korur. Üstlerine sekiz parçalı bir halka kiriş geçirilir. Çatı mertekleri dikmeleri dışa devirmeye çalışır; halka kiriş bunu bir çekme çemberi gibi çeker ve çerçeveyi kapatır.", "Korkuluk elemanları arasında yaklaşık 10 cm boşluk bırakılır: bir çocuğun başı geçmez. Kenarlardan biri açık bırakılır, giriş burasıdır. Zemin tahtaları merkezden dışa ışınsal döşenir; böylece sekiz parçanın hepsi aynı açıyla biter ve su kenara akar.", "Sekiz mertek (kırma çatının köşe kirişleri) tepede tek noktada buluşur. Aralarına alt alta sıralı kiremit dizilir; her çatı yüzü ikizkenar bir üçgendir. Köşelerdeki kirişler suyun toplandığı oluk çizgileridir, bu yüzden kiremit en dikkatli oraya bindirilir.", "Duvar boyunca oturma seki konur, girişe fener asılır, saksılara çiçek dikilir. Tepedeki ucu (alem) rüzgârda yön gösterir ve yıldırımı topraklayacak şekilde bir iletkenle bağlanabilir."]),
  kizkulesi: make(maiden, 5.8, 4.2, 2.45, "stone",
    ["Kayalığı saran deniz duvarı ve temel kuşağı", "Yuvarlak kesme taş kule gövdesi", "Kapı, kemerli pencereler ve konsollu seyir galerisi", "Üst kat, kurşun kaplı konik çatı ve fener odası", "Fener ışığı, iskele, sandal ve basamaklar"],
    ["Kule, Boğaz'da küçük bir kayalığın üzerinde durur. İşe, dalgaya ve akıntıya karşı kayalığın çevresine iri kesme taşlardan bir deniz duvarı örmekle başlanır. İç boşluk moloz ve kireç harçla doldurulur, böylece kuleye sağlam, düz bir kaide kazandırılır. Taşlar denizin sakin günlerinde sandallarla taşınır.", "Gövde yuvarlak planlıdır. Dairesel bir duvar rüzgâr ve dalga yükünü her yöne eşit dağıtır, köşe olmadığı için kuvvet birikmez. Taş sıraları derzler kaydırılarak örülür; taşlar demir kenetlerle, kurşunla bağlanarak birbirine kilitlenir.", "Açıklıkların üstü kemerle taşınır; kemer üstündeki yükü iki yana, duvara aktarır. Seyir galerisi duvardan çıkan konsol taşlarla tutulur. Dış yüz, kireç sıva ile örtülür; kireç nefes alır ve tuzlu havadaki nemi taşın içinde hapsetmez.", "Duvar yukarı çıktıkça incelir ve üst kat daha dar yapılır; ağırlığı azaltmak için. Konik çatının iskeleti ahşap mertektir, üzeri kurşun levhayla kaplanır: kurşun tuzlu havada paslanmaz ve yağmuru hızla aşağı akıtır. Tepeye cam fener odası oturur.", "Fener, geceleyin gemilere yol gösterir: cam ve mercek ışığı toplayıp yatay bir demete çevirir. Kule kapısı iskeleye bakar, sandallar buraya bağlanır. Taş basamaklar iskeleyi deniz duvarına bağlar. Tepede bir paratoner, yıldırım yükünü kulenin dışından toprağa (denize) iletir."]),
};

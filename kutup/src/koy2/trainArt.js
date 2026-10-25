// n49: how the little train, its halt and the level crossings look. Drawn with
// the same polygon kit as the buildings (src/iso.js), so the time-of-day tint
// applies; lights that glow at night are painted untinted on top. `A` maps a
// world point (x, y, z) to the screen.
import { ellipse, poly, seg } from "../iso.js";
import { HALT } from "./train.js";

const DARK = ["#4a4a52", "#3a3a41", "#2c2c32"],
  BLACK = ["#34343a", "#26262b", "#1c1c20"],
  GREEN = ["#5c8a5f", "#46714b", "#365b3b"],
  RED = ["#cf5545", "#b14438", "#93372e"],
  MAROON = ["#ad4a42", "#923c35", "#7a322c"],
  CREAM = ["#f6ead0", "#e9d8b2", "#d3c099"],
  ROOF = ["#94969a", "#7c7e83", "#66686d"],
  BRASS = ["#e1b75a", "#c99d42", "#ad8434"],
  WOOD = ["#c48b52", "#a87542", "#8b5f35"],
  LOGS = ["#b98552", "#9c6d40", "#7f5732"],
  STEEL = ["#d4d8db", "#b9bdc1", "#9ea2a6"],
  RUST = ["#bf6c4e", "#a35a40", "#874a35"],
  STONE = ["#dcd5c7", "#c3bba9", "#a9a08e"],
  BRICK = ["#d5704f", "#b55a40", "#944834"],
  PALLET = ["#c9a274", "#ab8558", "#8e6c45"],
  SACK = ["#eee6d3", "#d8ceb6", "#bfb398"],
  GLASS = "#3f4d69",
  LIT = "rgba(255,214,128,.95)";

/**
 * A box turned to any heading: centre (cx, cy), unit heading (dx, dy), the
 * span [a0, a1] along the heading and [b0, b1] across it, from z0 to z1.
 * Only the faces turned to the camera (+x/+y) are drawn, then the top.
 */
export function obox(A, cx, cy, dx, dy, a0, a1, b0, b1, z0, z1, c) {
  const nx = -dy,
    ny = dx;
  const at = (a, b, z) => A(cx + dx * a + nx * b, cy + dy * a + ny * b, z);
  const faces = [
    { n: [dx, dy], q: [[a1, b0], [a1, b1]] },
    { n: [-dx, -dy], q: [[a0, b1], [a0, b0]] },
    { n: [nx, ny], q: [[a1, b1], [a0, b1]] },
    { n: [-nx, -ny], q: [[a0, b0], [a1, b0]] },
  ];
  for (const f of faces) {
    const view = f.n[0] + f.n[1];
    if (view <= 0.02) continue;
    // Faces towards +y take the left shade, towards +x the right one, blended between.
    const k = Math.max(0, Math.min(1, (f.n[0] - f.n[1] + 1) / 2));
    const [p, q] = f.q;
    poly([at(p[0], p[1], z0), at(q[0], q[1], z0), at(q[0], q[1], z1), at(p[0], p[1], z1)], k < 0.5 ? c[1] : c[2]);
  }
  poly([at(a0, b0, z1), at(a1, b0, z1), at(a1, b1, z1), at(a0, b1, z1)], c[0]);
}
// The long side the camera sees (+1 or -1 across the heading).
const seenSide = (dx, dy) => (-dy + dx >= 0 ? 1 : -1);
// Window panes on the seen long side.
function panes(A, car, list, z0, z1, half, lit, ctx) {
  const side = seenSide(car.dx, car.dy) * half;
  const nx = -car.dy,
    ny = car.dx;
  for (const [a0, a1] of list) {
    const at = (a, z) => A(car.x + car.dx * a + nx * side * 1.01, car.y + car.dy * a + ny * side * 1.01, z);
    const quad = [at(a0, z0), at(a1, z0), at(a1, z1), at(a0, z1)];
    if (lit && ctx) {
      ctx.fillStyle = LIT;
      ctx.beginPath();
      ctx.moveTo(...quad[0]);
      for (const p of quad.slice(1)) ctx.lineTo(...p);
      ctx.fill();
    } else poly(quad, GLASS);
  }
}
function wheels(A, car, list, half, s) {
  const side = seenSide(car.dx, car.dy) * half;
  for (const a of list) {
    const [x, y] = A(car.x + car.dx * a - car.dy * side * 1.02, car.y + car.dy * a + car.dx * side * 1.02, 0.24);
    ellipse(x, y, s * 0.2, s * 0.2, "#2a2a30");
    ellipse(x, y, s * 0.1, s * 0.1, "#b84a3c");
  }
}

/** One car. opts: { s: pixels per unit, night: 0..1, ctx (for lights) }. */
export function drawCar(A, car, { s, night = 0, ctx = null } = {}) {
  const { x, y, dx, dy } = car;
  const B = (a0, a1, b, z0, z1, c, b0 = -b) => obox(A, x, y, dx, dy, a0, a1, b0, b, z0, z1, c);
  const lit = night > 0.5;
  // A soft shadow on the ballast.
  const [sx, sy] = A(x, y, 0);
  ellipse(sx, sy, s * car.len * 0.75, s * car.len * 0.32, "#2c3324", 0.18);
  if (car.kind === "loco") {
    // Parts back to front for the camera: draw the far ones first.
    const parts = [
      () => B(-1.4, 1.4, 0.48, 0.16, 0.42, DARK),
      () => B(1.28, 1.42, 0.5, 0.18, 0.42, RED),
      () => B(-0.35, 1.0, 0.36, 0.42, 1.08, GREEN),
      () => B(1.0, 1.3, 0.37, 0.42, 1.1, BLACK),
      () => B(0.3, 0.56, 0.15, 1.08, 1.3, BRASS),
      () => B(0.95, 1.15, 0.11, 1.08, 1.58, BLACK),
      () => B(0.92, 1.18, 0.15, 1.58, 1.66, BLACK),
      () => B(-1.35, -0.35, 0.5, 0.42, 1.52, RED),
      () => B(-1.46, -0.24, 0.57, 1.52, 1.63, ROOF),
    ];
    // The cab hides the boiler when it is nearer the camera, and the other way round.
    const front = dx + dy > 0;
    const order = front ? [0, 1, 7, 8, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (const i of order) parts[i]();
    wheels(A, car, [-0.95, -0.15, 0.65], 0.48, s);
    panes(A, car, [[-1.15, -0.6]], 1.0, 1.32, 0.5, lit, ctx);
    // The headlamp, warm and bright at night.
    const [hx, hy] = A(x + dx * 1.33, y + dy * 1.33, 0.86);
    if (ctx && lit) {
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, s * 1.6);
      g.addColorStop(0, "rgba(255,236,170,.75)");
      g.addColorStop(1, "rgba(255,236,170,0)");
      ctx.fillStyle = g;
      ctx.fillRect(hx - s * 1.6, hy - s * 1.6, s * 3.2, s * 3.2);
    }
    ellipse(hx, hy, s * 0.09, s * 0.09, lit ? "#fff3c4" : "#f2e3a6");
    return;
  }
  if (car.kind === "coach") {
    const h = car.len / 2;
    B(-h + 0.1, h - 0.1, 0.46, 0.16, 0.36, DARK);
    B(-h, h, 0.5, 0.36, 0.8, MAROON);
    B(-h, h, 0.5, 0.8, 1.45, CREAM);
    B(-h - 0.06, h + 0.06, 0.56, 1.45, 1.58, ROOF);
    wheels(A, car, [-h + 0.55, -h + 1.0, h - 1.0, h - 0.55], 0.46, s);
    panes(A, car, [[-1.25, -0.8], [-0.55, -0.1], [0.1, 0.55], [0.8, 1.25]], 0.95, 1.3, 0.5, lit, ctx);
    return;
  }
  const h = car.len / 2;
  // What is left of a materials wagon's load once a worker has taken theirs (1 = full).
  const full = (car.left ?? 1) >= 1;
  // Loads along the wagon, the ones farther from the camera first.
  const along = (list) => [...list].sort((a, b) => (a - b) * (dx + dy));
  if (car.kind === "logs") {
    B(-h, h, 0.48, 0.16, 0.42, WOOD);
    for (const b of [-0.27, 0, 0.27]) obox(A, x - dy * b, y + dx * b, dx, dy, -h + 0.15, h - 0.15, -0.12, 0.12, 0.42, 0.66, LOGS);
    if (full) for (const b of [-0.14, 0.14]) obox(A, x - dy * b, y + dx * b, dx, dy, -h + 0.25, h - 0.25, -0.12, 0.12, 0.66, 0.9, LOGS);
    wheels(A, car, [-h + 0.5, h - 0.5], 0.48, s);
    return;
  }
  if (car.kind === "bricks") {
    // A flat wagon with brick pallets: three full, one once a load is off.
    B(-h, h, 0.48, 0.16, 0.42, DARK);
    for (const a of along(full ? [-0.85, 0, 0.85] : [0])) {
      B(a - 0.38, a + 0.38, 0.4, 0.42, 0.5, PALLET);
      B(a - 0.34, a + 0.34, 0.36, 0.5, 0.98, BRICK);
    }
    wheels(A, car, [-h + 0.5, h - 0.5], 0.48, s);
    return;
  }
  if (car.kind === "cement") {
    // Cement sacks, two layers; the top one goes first.
    B(-h, h, 0.48, 0.16, 0.42, DARK);
    const sacks = [-0.9, -0.3, 0.3, 0.9].flatMap((a) => [-0.2, 0.2].map((b) => [a, b])).sort((p, q) => p[0] * (dx + dy) + p[1] * (dx - dy) - (q[0] * (dx + dy) + q[1] * (dx - dy)));
    for (const layer of full ? [0, 1] : [0])
      for (const [a, b] of sacks) obox(A, x - dy * b, y + dx * b, dx, dy, a - 0.27, a + 0.27, -0.17, 0.17, 0.42 + layer * 0.2, 0.6 + layer * 0.2, SACK);
    wheels(A, car, [-h + 0.5, h - 0.5], 0.48, s);
    return;
  }
  if (car.kind === "tank") {
    B(-h, h, 0.46, 0.16, 0.4, DARK);
    B(-h + 0.2, h - 0.2, 0.42, 0.4, 1.12, STEEL);
    B(-0.2, 0.2, 0.16, 1.12, 1.26, STEEL);
    wheels(A, car, [-h + 0.5, h - 0.5], 0.46, s);
    return;
  }
  // A covered goods van.
  B(-h, h, 0.46, 0.16, 0.36, DARK);
  B(-h, h, 0.5, 0.36, 1.4, RUST);
  B(-h - 0.05, h + 0.05, 0.54, 1.4, 1.5, ROOF);
  wheels(A, car, [-h + 0.55, h - 0.55], 0.46, s);
}

/** Steam from the chimney: each puff stays where it left the train and rises. */
export function drawPuffs(ctx, A, puffs, s, tint) {
  ctx.fillStyle = tint("#f3efe7");
  for (const p of puffs) {
    const k = p.age / 4;
    if (k >= 1) continue;
    const [x, y] = A(p.x + k * 0.8, p.y - k * 0.5, 1.7 + k * 2.6);
    ctx.globalAlpha = 0.5 * (1 - k) * Math.min(1, p.size);
    ctx.beginPath();
    ctx.arc(x, y, s * (0.2 + k * 0.55) * Math.min(1.3, p.size), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
/** The whistle: two short white jets from the cab roof (q: 0..1 of the blast). */
export function drawWhistle(ctx, A, car, q, s) {
  const [x, y] = A(car.x - car.dx * 0.3, car.y - car.dy * 0.3, 1.75);
  ctx.fillStyle = "rgba(255,255,255,.9)";
  for (let i = 0; i < 2; i++) {
    const u = (q * 2 - i * 0.55) % 1;
    if (u < 0 || q * 2 - i * 0.55 > 1.4) continue;
    ctx.globalAlpha = 0.85 * (1 - u);
    ctx.beginPath();
    ctx.arc(x, y - u * s * 1.4, s * (0.12 + u * 0.32), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * A level crossing: on each side of the line, a post with a crossbuck and two
 * red lamps, and a striped half barrier that swings down across the
 * approaching lane (close: 0 up … 1 down). blink: whether the lamps flash now.
 */
export function drawCrossing(A, c, close, blink, s, ctx, railW) {
  const [rx, ry] = c.dir; // along the street
  const nx = -ry,
    ny = rx;
  for (const side of [-1, 1]) {
    // Before the track on this side, at the street's right-hand edge.
    const along = side * (railW / 2 + 1.0);
    const off = -side * (c.w / 2 + 0.3);
    const px = c.x + rx * along + nx * off,
      py = c.y + ry * along + ny * off;
    const base = A(px, py, 0),
      top = A(px, py, 1.25);
    seg(base, top, "#e9e6df", Math.max(1, s * 0.12));
    // The crossbuck.
    const arm = 0.32;
    seg(A(px + rx * arm, py + ry * arm, 1.42), A(px - rx * arm, py - ry * arm, 1.12), "#d9483b", Math.max(1, s * 0.09));
    seg(A(px - rx * arm, py - ry * arm, 1.42), A(px + rx * arm, py + ry * arm, 1.12), "#d9483b", Math.max(1, s * 0.09));
    // Two lamps, flashing in turn while the barrier is down.
    for (const k of [0, 1]) {
      const [lx, ly] = A(px + rx * (k ? 0.12 : -0.12), py + ry * (k ? 0.12 : -0.12), 0.9);
      const on = close > 0 && (blink === null ? true : blink === k);
      ellipse(lx, ly, s * 0.08, s * 0.08, on ? "#ff4b3a" : "#5a2a28");
      if (on && ctx) {
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, s * 0.5);
        g.addColorStop(0, "rgba(255,90,70,.6)");
        g.addColorStop(1, "rgba(255,90,70,0)");
        ctx.fillStyle = g;
        ctx.fillRect(lx - s * 0.5, ly - s * 0.5, s, s);
      }
    }
    // The barrier: from the pivot across the lane, striped red and white.
    const angle = (1 - close) * (Math.PI / 2) * 0.92;
    const len = c.w / 2 + 0.15,
      pivot = 0.95;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * len,
        b = ((i + 1) / n) * len;
      const P = (d) => A(px + nx * side * d * Math.cos(angle), py + ny * side * d * Math.cos(angle), pivot + d * Math.sin(angle));
      seg(P(a), P(b), i % 2 ? "#ffffff" : "#d9483b", Math.max(1.2, s * 0.13));
    }
  }
}

/** The halt beside the track (a still part of the map): platform, sign, bench and lamp. */
export function drawHalt(A, halt, detail) {
  const { p, dir, n } = halt;
  const [dx, dy] = dir;
  const sideways = n[0] * -dy + n[1] * dx > 0 ? 1 : -1; // n as seen in the heading's frame
  const b0 = sideways > 0 ? HALT.from : -HALT.to,
    b1 = sideways > 0 ? HALT.to : -HALT.from;
  obox(A, p[0], p[1], dx, dy, -HALT.half, HALT.half, b0, b1, 0, 0.26, STONE);
  // The platform edge, painted.
  const edge = sideways > 0 ? HALT.from + 0.08 : -HALT.from - 0.08;
  seg(A(p[0] + dx * -HALT.half - dy * edge, p[1] + dy * -HALT.half + dx * edge, 0.27), A(p[0] + dx * HALT.half - dy * edge, p[1] + dy * HALT.half + dx * edge, 0.27), "#f0c64a", 1.2);
  const at = (a, b) => [p[0] + dx * a + n[0] * b, p[1] + dy * a + n[1] * b];
  // A name board on two legs.
  const [sx, sy] = at(1.6, 1.38);
  for (const a of [-0.3, 0.3]) seg(A(sx + dx * a, sy + dy * a, 0.26), A(sx + dx * a, sy + dy * a, 1.2), "#6c6f73", 1.2);
  obox(A, sx, sy, dx, dy, -0.45, 0.45, -0.04, 0.04, 0.95, 1.35, ["#f4f1e8", "#2f6fae", "#2a609a"]);
  if (detail >= 1) {
    // A bench and a lamp post.
    const [bx, by] = at(-0.9, 1.38);
    obox(A, bx, by, dx, dy, -0.45, 0.45, -0.1, 0.1, 0.5, 0.58, WOOD);
    const [lx, ly] = at(-2.1, 1.4);
    seg(A(lx, ly, 0.26), A(lx, ly, 2.0), "#55585c", 1.3);
    obox(A, lx, ly, dx, dy, -0.12, 0.12, -0.12, 0.12, 2.0, 2.2, ["#fff1c2", "#e9d48f", "#d5bd70"]);
  }
}

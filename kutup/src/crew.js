// Machines and crew on the construction site. Each machine drives in from the
// edge of the plot at the start of its phase, works, and drives off at the end;
// the scene clips this layer to the plot so they seem to arrive from beyond it.
// Drawn every frame (things move), so every piece is a handful of shapes.
import { box, poly, seg } from "./iso.js";
import { phaseAt } from "./construction.js";

const YELLOW = ["#f6c945", "#dcae2c", "#c0951f"],
  STEEL = ["#9aa4ae", "#7f8994", "#68727c"],
  TYRE = "#2f3338",
  CAB = ["#e9eef2", "#cdd5dc", "#b3bcc5"],
  GLASS = ["#5b7a96", "#5b7a96", "#5b7a96"];
const clamp = (v) => Math.max(0, Math.min(1, v));
// 0 → off the plot, 1 → in position: in over the first 15 % of the phase, out over the last 15 %.
const arrival = (k) => (k <= 0 || k >= 1 ? 0 : Math.min(1, k / 0.15, (1 - k) / 0.15));
const ease = (t) => t * t * (3 - 2 * t);
const n1 = (v) => v.toFixed(1);

function wheels(P, x, y, n, gap) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const [cx, cy] = P(x + i * gap, y, 0.16);
    s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="5.2" fill="${TYRE}"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="2" fill="#8c939a"/>`;
  }
  return s;
}
// A worker: helmet, hi-vis vest, and the tool of the trade, moving with the work.
// tool: hammer | shovel | bar (rebar on the shoulder) | tie | hose | trowel |
// roller | survey | carry (a plank) | none.
function worker(P, x, y, z, time, phase, helmet, tool = "none") {
  const beat = time * 5 + phase;
  const bob = Math.sin(beat) * (tool === "survey" ? 0.3 : 1.2);
  const [fx, fy] = P(x, y, z);
  const top = fy - 22 + bob;
  const shoulder = [fx + 3, top + 6];
  let hand = [fx + 6, top + 13],
    gear = "";
  const swing = Math.sin(beat * 1.6);
  if (tool === "hammer") {
    const a = -1.9 + 1.2 * (0.5 + 0.5 * swing);
    hand = [shoulder[0] + Math.cos(a) * 7, shoulder[1] + Math.sin(a) * 7];
    gear = `<line x1="${n1(hand[0])}" y1="${n1(hand[1])}" x2="${n1(hand[0] + Math.cos(a + 1.4) * 4)}" y2="${n1(hand[1] + Math.sin(a + 1.4) * 4)}" stroke="#7a828c" stroke-width="2.6" stroke-linecap="round"/>`;
  } else if (tool === "shovel") {
    const dip = 2.5 * (0.5 + 0.5 * swing);
    hand = [fx + 5, top + 12 + dip];
    gear = `<line x1="${n1(fx + 1)}" y1="${n1(top + 7 + dip)}" x2="${n1(fx + 10)}" y2="${n1(top + 21 + dip)}" stroke="#8b5e36" stroke-width="1.4"/><path d="M${n1(fx + 8.5)} ${n1(top + 20 + dip)} l4 -1 l1 4 l-4 1 z" fill="#7a828c"/>`;
  } else if (tool === "bar") {
    hand = [fx + 4, top + 6];
    gear = `<line x1="${n1(fx - 12)}" y1="${n1(top + 5)}" x2="${n1(fx + 14)}" y2="${n1(top + 3)}" stroke="#8a4b33" stroke-width="1.6"/>`;
  } else if (tool === "carry") {
    hand = [fx + 4, top + 6];
    gear = `<rect x="${n1(fx - 11)}" y="${n1(top + 1.5)}" width="24" height="3" fill="#d9a364"/>`;
  } else if (tool === "tie") {
    hand = [fx + 5 + swing, top + 15];
  } else if (tool === "hose") {
    hand = [fx + 6, top + 14];
    gear = `<path d="M${n1(fx + 6)} ${n1(top + 14)} q4 8 0 12" fill="none" stroke="#2f3338" stroke-width="2.4"/>`;
  } else if (tool === "trowel") {
    hand = [fx + 7, top + 9 + swing * 2];
    gear = `<path d="M${n1(hand[0])} ${n1(hand[1])} l4 -1 l-1 3 z" fill="#9aa4ae"/>`;
  } else if (tool === "roller") {
    hand = [fx + 6, top + 4 + swing * 4];
    gear = `<line x1="${n1(hand[0])}" y1="${n1(hand[1])}" x2="${n1(hand[0] + 4)}" y2="${n1(hand[1] - 9)}" stroke="#6b7480" stroke-width="1.2"/><rect x="${n1(hand[0] + 1)}" y="${n1(hand[1] - 13)}" width="7" height="3.5" rx="1.5" fill="#f4f2ea"/>`;
  } else if (tool === "survey") {
    hand = [fx + 5, top + 8];
    gear = `<rect x="${n1(fx + 4)}" y="${n1(top + 6)}" width="5" height="6" rx="1" fill="#f4f2ea" stroke="#6b7480" stroke-width="0.6"/>`;
  }
  const step = tool === "none" ? 0 : Math.sin(beat) * 1.2;
  return `<ellipse cx="${n1(fx)}" cy="${n1(fy)}" rx="5" ry="2" fill="#2d3a1f" opacity="0.25"/>` +
    `<rect x="${n1(fx - 2.6 + step * 0.3)}" y="${n1(top + 12)}" width="2.2" height="${n1(10 - bob)}" fill="#3d4e6b"/>` +
    `<rect x="${n1(fx + 0.4 - step * 0.3)}" y="${n1(top + 12)}" width="2.2" height="${n1(10 - bob)}" fill="#34445e"/>` +
    `<rect x="${n1(fx - 3.4)}" y="${n1(fy - 1.4)}" width="3" height="1.6" rx="0.6" fill="#4a3a2c"/><rect x="${n1(fx + 0.4)}" y="${n1(fy - 1.4)}" width="3" height="1.6" rx="0.6" fill="#4a3a2c"/>` +
    `<line x1="${n1(fx - 3)}" y1="${n1(top + 6)}" x2="${n1(fx - 4.5)}" y2="${n1(top + 12)}" stroke="#f28b2c" stroke-width="2" stroke-linecap="round"/>` +
    `<rect x="${n1(fx - 3.6)}" y="${n1(top + 4)}" width="7.2" height="9" rx="2" fill="#f28b2c"/>` +
    `<rect x="${n1(fx - 3.6)}" y="${n1(top + 8)}" width="7.2" height="1.4" fill="#f5e9a8"/>` +
    `<line x1="${n1(shoulder[0])}" y1="${n1(shoulder[1])}" x2="${n1(hand[0])}" y2="${n1(hand[1])}" stroke="#e8822a" stroke-width="2" stroke-linecap="round"/>` +
    `<circle cx="${n1(hand[0])}" cy="${n1(hand[1])}" r="1.1" fill="#e7b99a"/>` + gear +
    `<circle cx="${n1(fx)}" cy="${n1(top + 1.5)}" r="3" fill="#e7b99a"/>` +
    `<path d="M${n1(fx - 3.8)} ${n1(top + 0.8)} a3.8 3.4 0 0 1 7.6 0 h1 v0.8 h-9.6 z" fill="${helmet}"/>`;
}
// A labourer pushing a wheelbarrow between two points, there and back.
function barrow(P, from, to, z, time, load) {
  const t = (time / 7) % 1,
    go = t < 0.5,
    u = go ? t * 2 : 2 - t * 2;
  const x = from[0] + (to[0] - from[0]) * u,
    y = from[1] + (to[1] - from[1]) * u;
  const [bx, by] = P(x + (go ? 0.35 : -0.35), y, z);
  const dir = go ? 1 : -1;
  const tub = `<path d="M${n1(bx - 6)} ${n1(by - 9)} h12 l-2 5 h-8 z" fill="#3f6fb0"/>` +
    (go && load ? `<path d="M${n1(bx - 5)} ${n1(by - 9)} q5 -4 10 0 z" fill="${load}"/>` : "") +
    `<circle cx="${n1(bx + 5 * dir)}" cy="${n1(by - 2.5)}" r="2.6" fill="#2f3338"/>` +
    `<line x1="${n1(bx - 6 * dir)}" y1="${n1(by - 6)}" x2="${n1(bx - 11 * dir)}" y2="${n1(by - 9)}" stroke="#6b7480" stroke-width="1.2"/>`;
  return tub + worker(P, x - (go ? 0.35 : -0.35), y, z, time * 1.4, 0.7, "#f6d24a", "none");
}
function excavator(P, x, y, time) {
  // Crawler tracks with links and sprockets, the upper structure with its
  // counterweight and glazed cab, then boom → stick → toothed bucket, each with
  // its hydraulic cylinder, digging into the pit and swinging out to dump.
  let s = "";
  for (const side of [-1, 1]) {
    const ty = y + side * 0.32;
    s += box(P, x - 0.62, ty - 0.11, x + 0.62, ty + 0.11, 0, 0.24, ["#3c4146", "#30353a", "#25292d"]);
    for (let i = 0; i < 9; i++) s += seg(P(x - 0.56 + i * 0.14, ty + 0.115, 0.02), P(x - 0.56 + i * 0.14, ty + 0.115, 0.22), "#5b6168", 0.8);
    for (const sx of [-0.5, 0.5]) {
      const [cx, cy] = P(x + sx, ty + 0.12, 0.12);
      s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="3" fill="#6b7178"/>`;
    }
  }
  s += box(P, x - 0.15, y - 0.15, x + 0.15, y + 0.15, 0.24, 0.32, STEEL);
  s += box(P, x - 0.45, y - 0.38, x + 0.42, y + 0.38, 0.32, 0.68, YELLOW);
  s += box(P, x + 0.42, y - 0.36, x + 0.6, y + 0.36, 0.32, 0.62, ["#4a4f55", "#3c4146", "#2f3338"]); // counterweight
  s += box(P, x - 0.42, y - 0.36, x - 0.02, y + 0.02, 0.68, 1.1, YELLOW);
  s += poly([P(x - 0.425, y - 0.3, 0.74), P(x - 0.425, y - 0.02, 0.74), P(x - 0.425, y - 0.02, 1.04), P(x - 0.425, y - 0.3, 1.04)], "#4f6f8c");
  s += poly([P(x - 0.38, y + 0.025, 0.74), P(x - 0.06, y + 0.025, 0.74), P(x - 0.06, y + 0.025, 1.04), P(x - 0.38, y + 0.025, 1.04)], "#5b7a96");
  const swing = Math.sin(time * 0.9),
    dig = Math.max(0, swing),
    reach = 1.15 + 0.25 * swing,
    lift = 0.95 + 0.5 * dig;
  const shoulder = [x - 0.4, y + 0.2, 0.62],
    elbow = [x - 0.4 - reach * 0.7, y + 0.05, 0.62 + lift],
    wrist = [x - 0.4 - reach * 1.3, y - 0.05, 0.15 + 0.65 * dig];
  s += seg(P(...shoulder), P(...elbow), YELLOW[1], 5) + seg(P(...elbow), P(...wrist), YELLOW[2], 3.8);
  s += seg(P(x - 0.25, y + 0.2, 0.7), P(elbow[0] * 0.55 + shoulder[0] * 0.45, y + 0.12, elbow[2] * 0.6 + shoulder[2] * 0.4), "#c8cdd2", 1.8);
  s += seg(P(elbow[0] + 0.1, y + 0.05, elbow[2] + 0.12), P(wrist[0] * 0.4 + elbow[0] * 0.6, y, wrist[2] * 0.4 + elbow[2] * 0.6 + 0.1), "#c8cdd2", 1.6);
  const [bx, by] = P(...wrist);
  s += `<path d="M${n1(bx - 6)} ${n1(by - 4)} q6 -4 11 1 l-1 7 l-2 -2 l-1 3 l-2 -2 l-1 3 l-2 -2 l-1 3 z" fill="#555b62"/>`;
  if (dig > 0.6) s += `<ellipse cx="${n1(bx)}" cy="${n1(by - 3)}" rx="5" ry="2" fill="#8a6a48"/>`;
  return s;
}
function dumpTruck(P, x, y, fill) {
  // A tipper: rimmed wheels, the shared cab, a ribbed body that fills with spoil.
  let s = tyre(P, x - 0.62, y + 0.32) + tyre(P, x - 0.22, y + 0.32) + tyre(P, x + 0.78, y + 0.32);
  s += box(P, x - 0.9, y - 0.27, x + 0.55, y + 0.27, 0.2, 0.32, ["#4a5058", "#3c4148", "#30353b"]);
  s += box(P, x - 0.88, y - 0.32, x + 0.42, y + 0.32, 0.32, 0.8, ["#d0573b", "#b4472f", "#963a26"]);
  for (let i = 0; i < 4; i++) s += seg(P(x - 0.7 + i * 0.32, y + 0.325, 0.36), P(x - 0.7 + i * 0.32, y + 0.325, 0.78), "#963a26", 1.2);
  if (fill > 0) {
    s += box(P, x - 0.82, y - 0.27, x + 0.36, y + 0.27, 0.8, 0.8 + 0.12 * fill, ["#a07e58", "#8b6c48", "#755a3b"]);
    const [mx, my] = P(x - 0.2, y, 0.95 + 0.25 * fill);
    s += `<ellipse cx="${n1(mx)}" cy="${n1(my + 4)}" rx="${n1(10 + 6 * fill)}" ry="${n1(3 + 2 * fill)}" fill="#a88560"/>`;
  }
  s += cab(P, x + 0.45, x + 0.95, y, ["#e9eef2", "#cdd5dc", "#b3bcc5"]);
  return s;
}
// Truck parts shared by the mixer and the pump: rimmed wheels and a cab with
// windscreen, side window, mirror, headlight and bumper (the cab faces +x).
function tyre(P, x, y) {
  const [cx, cy] = P(x, y, 0.17);
  return `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="5.6" fill="${TYRE}"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="3" fill="#a9b0b7"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="1.2" fill="#5b6168"/>`;
}
function cab(P, x0, x1, y, faces) {
  let s = box(P, x0, y - 0.3, x1, y + 0.3, 0.22, 0.98, faces);
  s += poly([P(x1 + 0.005, y - 0.23, 0.62), P(x1 + 0.005, y + 0.23, 0.62), P(x1 + 0.005, y + 0.23, 0.9), P(x1 + 0.005, y - 0.23, 0.9)], "#4f6f8c");
  s += poly([P(x0 + 0.1, y + 0.305, 0.62), P(x1 - 0.08, y + 0.305, 0.62), P(x1 - 0.08, y + 0.305, 0.88), P(x0 + 0.1, y + 0.305, 0.88)], "#5b7a96");
  s += box(P, x1, y - 0.3, x1 + 0.07, y + 0.3, 0.22, 0.36, ["#3c4146", "#2f3338", "#25292d"]);
  const [lx, ly] = P(x1 + 0.075, y + 0.2, 0.42);
  s += `<circle cx="${n1(lx)}" cy="${n1(ly)}" r="1.6" fill="#fff4c8"/>`;
  s += seg(P(x1 - 0.05, y + 0.31, 0.86), P(x1 - 0.05, y + 0.45, 0.8), "#2f3338", 1) + box(P, x1 - 0.08, y + 0.44, x1 - 0.02, y + 0.48, 0.66, 0.82, ["#3c4146", "#2f3338", "#25292d"]);
  return s;
}
function mixerTruck(P, x, y, time) {
  let s = tyre(P, x - 0.78, y + 0.32) + tyre(P, x - 0.38, y + 0.32) + tyre(P, x + 0.78, y + 0.32);
  s += box(P, x - 1.05, y - 0.27, x + 0.55, y + 0.27, 0.2, 0.34, ["#4a5058", "#3c4148", "#30353b"]);
  s += box(P, x + 0.42, y - 0.2, x + 0.55, y + 0.2, 0.34, 0.78, STEEL); // water tank
  s += cab(P, x + 0.56, x + 1.05, y, ["#f08b3c", "#d77428", "#bb601d"]);
  // The drum: a tapered barrel rising towards the back, drawn in screen space
  // around its axis, with spiral fins that turn while it mixes.
  const c0 = P(x + 0.32, y, 0.86),
    c1 = P(x - 0.92, y, 1.12),
    unit = Math.hypot(...P(0, 0, 1).map((v, i) => v - P(0, 0, 0)[i]));
  const r0 = 0.44 * unit,
    r1 = 0.28 * unit;
  const ax = c1[0] - c0[0],
    ay = c1[1] - c0[1],
    al = Math.hypot(ax, ay),
    px = -ay / al,
    py = ax / al;
  const edge = (t, side) => {
    const r = r0 + (r1 - r0) * t;
    return [c0[0] + ax * t + px * r * side, c0[1] + ay * t + py * r * side];
  };
  const top = [0, 0.25, 0.5, 0.75, 1].map((t) => edge(t, -1)),
    bottom = [1, 0.75, 0.5, 0.25, 0].map((t) => edge(t, 1));
  s += `<polygon points="${[...top, ...bottom].map((q) => q.map(n1).join(",")).join(" ")}" fill="#ebe6da"/>`;
  s += `<polygon points="${[0, 0.5, 1].map((t) => edge(t, 0.35)).concat([1, 0.5, 0].map((t) => edge(t, 1))).map((q) => q.map(n1).join(",")).join(" ")}" fill="#d4cdbd"/>`;
  for (let i = 0; i < 5; i++) {
    const t = (time * 0.25 + i / 5) % 1;
    const a = edge(Math.max(0, t - 0.08), -1),
      b = edge(Math.min(1, t + 0.08), 1);
    s += `<line x1="${n1(a[0])}" y1="${n1(a[1])}" x2="${n1(b[0])}" y2="${n1(b[1])}" stroke="#e08a2e" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  s += `<ellipse cx="${n1(c0[0])}" cy="${n1(c0[1])}" rx="${n1(r0 * 0.35)}" ry="${n1(r0)}" transform="rotate(${n1((Math.atan2(ay, ax) * 180) / Math.PI)} ${n1(c0[0])} ${n1(c0[1])})" fill="#d9d2c3"/>`;
  // Hopper, chute and the ladder at the back.
  s += poly([P(x - 1.0, y - 0.18, 1.2), P(x - 1.0, y + 0.18, 1.2), P(x - 1.18, y + 0.26, 1.42), P(x - 1.18, y - 0.26, 1.42)], "#8a929b");
  s += seg(P(x - 1.05, y, 0.92), P(x - 1.42, y - 0.3, 0.55), "#7f8994", 3) + seg(P(x - 1.42, y - 0.3, 0.55), P(x - 1.55, y - 0.36, 0.38), "#68727c", 2.6);
  for (let z = 0.4; z < 1.25; z += 0.17) s += seg(P(x - 1.08, y + 0.2, z), P(x - 1.08, y + 0.32, z), "#9aa4ae", 0.9);
  s += seg(P(x - 1.08, y + 0.2, 0.34), P(x - 1.08, y + 0.2, 1.3), "#9aa4ae", 0.9) + seg(P(x - 1.08, y + 0.32, 0.34), P(x - 1.08, y + 0.32, 1.3), "#9aa4ae", 0.9);
  return s;
}
// One outrigger: a beam out from the chassis, a hydraulic jack, a pad on the ground.
function outrigger(P, x, y, side) {
  const fy = y + side * 1.05;
  return seg(P(x, y + side * 0.28, 0.3), P(x, fy, 0.28), "#7f8994", 3.2) + seg(P(x, y + side * 0.28, 0.36), P(x, fy, 0.34), "#d9a930", 1) +
    box(P, x - 0.05, fy - 0.05, x + 0.05, fy + 0.05, 0.04, 0.32, STEEL) + box(P, x - 0.14, fy - 0.14, x + 0.14, fy + 0.14, 0, 0.04, ["#5b6168", "#4a4f55", "#3c4146"]);
}
// A section of the boom: a tapered steel arm with its hydraulic cylinder.
function boomSection(P, a, b, wa, wb, color) {
  const pa = P(...a),
    pb = P(...b);
  const dx = pb[0] - pa[0],
    dy = pb[1] - pa[1],
    l = Math.hypot(dx, dy) || 1,
    nx = -dy / l,
    ny = dx / l;
  const quad = [[pa[0] + nx * wa, pa[1] + ny * wa], [pb[0] + nx * wb, pb[1] + ny * wb], [pb[0] - nx * wb, pb[1] - ny * wb], [pa[0] - nx * wa, pa[1] - ny * wa]];
  let s = `<polygon points="${quad.map((q) => q.map(n1).join(",")).join(" ")}" fill="${color}"/>`;
  s += `<line x1="${n1(pa[0] + nx * (wa + 2.2))}" y1="${n1(pa[1] + ny * (wa + 2.2))}" x2="${n1(pa[0] + dx * 0.45 + nx * (wb + 2))}" y2="${n1(pa[1] + dy * 0.45 + ny * (wb + 2))}" stroke="#c8cdd2" stroke-width="1.6" stroke-linecap="round"/>`;
  s += `<circle cx="${n1(pa[0])}" cy="${n1(pa[1])}" r="${n1(wa * 0.8)}" fill="#2b4a73"/>`;
  return s;
}
function pumpTruck(P, x, y, target, time) {
  // Far-side outriggers, then the truck, then the near side.
  let s = outrigger(P, x + 0.35, y, -1) + outrigger(P, x - 0.95, y, -1);
  s += tyre(P, x - 0.9, y + 0.32) + tyre(P, x - 0.5, y + 0.32) + tyre(P, x + 0.8, y + 0.32);
  s += box(P, x - 1.15, y - 0.28, x + 0.55, y + 0.28, 0.2, 0.42, ["#e9eef2", "#cdd5dc", "#b3bcc5"]);
  s += box(P, x - 0.2, y - 0.22, x + 0.45, y + 0.22, 0.42, 0.6, STEEL); // hopper and pump
  s += cab(P, x + 0.56, x + 1.05, y, ["#3f6fb0", "#325d97", "#284c7e"]);
  s += outrigger(P, x + 0.35, y, 1) + outrigger(P, x - 0.95, y, 1);
  // Turret and a four-section boom arching over to the pour point.
  const base = [x - 0.65, y, 0.95];
  s += box(P, x - 0.82, y - 0.17, x - 0.48, y + 0.17, 0.42, 0.95, ["#3f6fb0", "#325d97", "#284c7e"]);
  const [tx, ty, tz] = target;
  const sway = 0.06 * Math.sin(time * 0.8);
  const at = (f, lift) => [base[0] + (tx - base[0]) * f + sway * f, base[1] + (ty - base[1]) * f, tz + lift];
  const j1 = at(0.12, 2.5),
    j2 = at(0.45, 2.9),
    j3 = at(0.8, 2.2),
    tip = [tx + sway, ty, tz + 1.15];
  s += boomSection(P, base, j1, 4.2, 3.6, "#2f62a6") + boomSection(P, j1, j2, 3.6, 3.1, "#3a6fb5") + boomSection(P, j2, j3, 3.1, 2.6, "#4a7fc2") + boomSection(P, j3, tip, 2.6, 2.1, "#5a8bcc");
  // End hose with concrete coming out at the pour front.
  const [hx, hy] = P(...tip),
    [fx, fy] = P(tx, ty, tz + 0.12);
  s += `<path d="M${n1(hx)} ${n1(hy)} Q${n1(hx + 4)} ${n1((hy + fy) / 2)} ${n1(fx)} ${n1(fy)}" fill="none" stroke="#2f3338" stroke-width="3.4" stroke-linecap="round"/>`;
  for (let i = 0; i < 3; i++) {
    const t = (time * 2 + i / 3) % 1;
    s += `<circle cx="${n1(fx + Math.sin(i * 2) * 1.5)}" cy="${n1(fy + 2 + t * 6)}" r="${n1(1.6 - t * 0.6)}" fill="#7a7e85"/>`;
  }
  s += `<ellipse cx="${n1(fx)}" cy="${n1(fy + 9)}" rx="9" ry="3.4" fill="#7a7e85"/><ellipse cx="${n1(fx - 2)}" cy="${n1(fy + 8)}" rx="4" ry="1.4" fill="#9a9ea4"/>`;
  return s;
}

/** Live layer: the machines and workers the work under way needs. */
export function crewSVG(P, sp, plan, shown, time) {
  const p = phaseAt(plan, shown);
  const k = clamp((shown - p.a) / (p.b - p.a));
  const w = sp.hw,
    hf = sp.h / sp.floors;
  const away = 1 - ease(arrival(k));
  let behind = "",
    machines = "";
  const crew = [];
  let extra = "";
  const top = 0.3 + sp.h;
  const strip = w + 0.2 + (2.9 - (w + 0.2)) / 2;
  if (p.key === "dig") {
    // Trucks shuttle the spoil away: in, filled bucket by bucket, out again.
    const cycle = (time / 9) % 1;
    const out = cycle < 0.2 ? 1 - cycle / 0.2 : cycle > 0.85 ? (cycle - 0.85) / 0.15 : 0;
    behind += dumpTruck(P, 1.2 + (out + away) * 4.5, -w - 0.65, cycle < 0.2 ? 0 : Math.min(1, (cycle - 0.2) / 0.6));
    machines += excavator(P, w + 1.1 + away * 4, w + 0.6, time);
    crew.push([-w - 0.9, w + 0.9, 0, "shovel"], [-w - 0.6, -w - 0.6, 0, "survey"]);
  } else if (["lean", "footPour", "colPour", "deckPour"].includes(p.key)) {
    behind += mixerTruck(P, 1.3 + away * 4.5, -w - 0.62, time);
    if (p.key === "footPour" || p.key === "deckPour") {
      const z = p.key === "footPour" ? 0.3 : 0.3 + (p.floor + 1) * hf;
      const edge = p.key === "deckPour" ? -w + 2 * w * Math.min(1, k / 0.85) : 0;
      machines += pumpTruck(P, 0.9 + away * 4.5, w + 1.0, [edge, 0.2 * Math.sin(time * 0.5), z], time);
      // Hose man, vibrator man and a screeder at the pour front.
      crew.push([edge - 0.35, 0.6, z, "hose"], [edge + 0.15, -0.7, z, "shovel"], [edge - 0.8, -0.2, z, "trowel"]);
    } else if (p.key === "lean") crew.push([-w + 0.4, w + 0.5, -0.5, "shovel"], [w - 0.2, -w + 0.3, -0.5, "trowel"]);
    else crew.push([-w + 0.4, w + 0.5, 0.3 + p.floor * hf, "hammer"], [w - 0.4, w - 0.4, 0.3 + p.floor * hf, "hose"]);
  } else if (p.key === "mobilize") crew.push([1.8, 2.2, 0, "carry"], [-1.6, 1.9, 0, "hammer"]);
  else if (p.key === "layout") crew.push([w + 1.0, -w - 0.2, 0, "survey"], [-w - 0.7, w + 0.6, 0, "hammer"]);
  else if (p.key === "footRebar") crew.push([-w + 0.3, w + 0.4, -0.4, "tie"], [w + 0.4, -w + 0.2, 0, "bar"], [0.2, 0.1, -0.4, "tie"]);
  else if (p.key === "footForm") crew.push([-w + 0.3, w + 0.4, 0, "hammer"], [w + 0.4, -w + 0.2, 0, "carry"]);
  else if (p.floor >= 0) {
    // Fixers and carpenters on the storey under way.
    const z = 0.3 + p.floor * hf;
    const tools = { colRebar: ["tie", "bar"], colForm: ["hammer", "carry"], deckForm: ["hammer", "carry"], deckRebar: ["tie", "bar"] }[p.key] || ["hammer", "none"];
    crew.push([-w + 0.6, w - 0.3, p.key === "deckRebar" ? z + hf - 0.14 : z, tools[0]], [w - 0.5, -w + 0.7, z, tools[1]]);
  } else if (p.key === "walls") {
    // Masons on the courses; a labourer brings blocks from the pallets.
    crew.push([w + 0.35, w * 0.2, 0, "trowel"], [-w * 0.3, w + 0.35, 0, "trowel"]);
    extra += barrow(P, [-1.4, strip], [w + 0.5, w + 0.5], 0, time, "#e4e2db");
  } else if (p.key === "roof") crew.push([0.4, 0.2, top + 0.1, "hammer"], [-0.6, -0.4, top + 0.1, "carry"]);
  else if (p.key === "openings") crew.push([w + 0.7, w * 0.3, 0, "carry"], [-w * 0.3, w + 0.7, 0, "hammer"]);
  else if (p.key === "finish") crew.push([w + 0.6, -w * 0.2, 0.3 + sp.h * 0.45, "roller"], [-w * 0.4, w + 0.6, 1.25, "trowel"]);
  else if (p.key === "handover") crew.push([w + 1.0, w + 1.2, 0, "shovel"]);
  let people = "";
  crew.forEach(([x, y, z, tool], i) => (people += worker(P, x, y, z, time, i * 1.7, i % 2 ? "#f4f2ea" : "#f6d24a", tool)));
  return { behind, front: machines + people + extra };
}

// When a build collapses the crew runs clear of it.
export function fleeSVG(P, sp, tau) {
  const w = sp.hw,
    run = Math.min(2.4, tau * 2.6);
  let s = "";
  [[w + 0.4, w * 0.2, 1, 0.35], [-w * 0.3, w + 0.4, -0.25, 1], [w + 0.3, -w + 0.4, 1, -0.7]].forEach(([x, y, dx, dy], i) => {
    s += worker(P, x + dx * run, y + dy * run, 0, tau * 2.5, i * 1.3, i % 2 ? "#f4f2ea" : "#f6d24a");
  });
  return s;
}

// Machines and crew on the construction site. Each machine drives in from the
// edge of the plot at the start of its phase, works, and drives off at the end;
// the scene clips this layer to the plot so they seem to arrive from beyond it.
// Drawn every frame (things move), so every piece is a handful of shapes.
import { box, seg } from "./iso.js";
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
// A worker: helmet, hi-vis vest, a small bob while working (hammering, tying, raking).
function worker(P, x, y, z, time, phase, helmet) {
  const bob = Math.sin(time * 5 + phase) * 1.4;
  const [fx, fy] = P(x, y, z);
  const top = fy - 22 + bob;
  return `<ellipse cx="${n1(fx)}" cy="${n1(fy)}" rx="5" ry="2" fill="#2d3a1f" opacity="0.25"/>` +
    `<rect x="${n1(fx - 2.6)}" y="${n1(top + 12)}" width="2.2" height="${n1(10 - bob)}" fill="#3d4e6b"/>` +
    `<rect x="${n1(fx + 0.4)}" y="${n1(top + 12)}" width="2.2" height="${n1(10 - bob)}" fill="#34445e"/>` +
    `<rect x="${n1(fx - 3.6)}" y="${n1(top + 4)}" width="7.2" height="9" rx="2" fill="#f28b2c"/>` +
    `<rect x="${n1(fx - 3.6)}" y="${n1(top + 8)}" width="7.2" height="1.4" fill="#f5e9a8"/>` +
    `<circle cx="${n1(fx)}" cy="${n1(top + 1.5)}" r="3" fill="#e7b99a"/>` +
    `<path d="M${n1(fx - 3.6)} ${n1(top + 0.6)} a3.6 3.2 0 0 1 7.2 0 z" fill="${helmet}"/>`;
}
function excavator(P, x, y, time) {
  // Tracks, turntable, cab, then boom → arm → bucket swinging into the pit.
  let s = box(P, x - 0.55, y - 0.3, x + 0.55, y + 0.3, 0, 0.22, ["#4a4f55", "#3c4146", "#2f3338"]);
  s += box(P, x - 0.4, y - 0.36, x + 0.4, y + 0.36, 0.22, 0.6, YELLOW);
  s += box(P, x - 0.38, y - 0.34, x - 0.02, y + 0.04, 0.6, 1.0, YELLOW);
  s += box(P, x - 0.36, y + 0.03, x - 0.05, y + 0.05, 0.66, 0.95, GLASS);
  const swing = Math.sin(time * 0.9),
    reach = 1.1 + 0.25 * swing,
    lift = 0.9 + 0.5 * Math.max(0, swing);
  const shoulder = [x - 0.45, y, 0.75],
    elbow = [x - 0.45 - reach * 0.7, y - 0.15, 0.75 + lift],
    wrist = [x - 0.45 - reach * 1.3, y - 0.25, 0.25 + 0.6 * Math.max(0, swing)];
  s += seg(P(...shoulder), P(...elbow), YELLOW[1], 4.2) + seg(P(...elbow), P(...wrist), YELLOW[2], 3.2);
  s += box(P, wrist[0] - 0.16, wrist[1] - 0.14, wrist[0] + 0.12, wrist[1] + 0.14, wrist[2] - 0.22, wrist[2], ["#5a5f66", "#4a4f55", "#3c4146"]);
  return s;
}
function dumpTruck(P, x, y, fill) {
  let s = wheels(P, x - 0.5, y + 0.33, 3, 0.55);
  s += box(P, x - 0.8, y - 0.32, x + 0.45, y + 0.32, 0.2, 0.75, ["#d0573b", "#b4472f", "#963a26"]);
  if (fill > 0) s += box(P, x - 0.72, y - 0.26, x + 0.38, y + 0.26, 0.6, 0.6 + 0.3 * fill, ["#a07e58", "#8b6c48", "#755a3b"]);
  s += box(P, x + 0.5, y - 0.3, x + 0.95, y + 0.3, 0.2, 0.95, CAB);
  s += box(P, x + 0.93, y - 0.24, x + 0.96, y + 0.24, 0.6, 0.88, GLASS);
  return s;
}
function mixerTruck(P, x, y, time) {
  let s = wheels(P, x - 0.55, y + 0.33, 3, 0.55);
  s += box(P, x - 0.95, y - 0.3, x + 0.5, y + 0.3, 0.2, 0.36, STEEL);
  // The drum: a fat tilted barrel with stripes that turn.
  const a0 = P(x - 0.85, y, 0.85),
    a1 = P(x + 0.35, y, 1.0);
  s += `<line x1="${n1(a0[0])}" y1="${n1(a0[1])}" x2="${n1(a1[0])}" y2="${n1(a1[1])}" stroke="#e7e2d6" stroke-width="17" stroke-linecap="round"/>`;
  for (let i = 0; i < 4; i++) {
    const t = (time * 0.6 + i / 4) % 1,
      p = P(x - 0.85 + 1.2 * t, y, 0.85 + 0.15 * t);
    s += `<line x1="${n1(p[0] - 3)}" y1="${n1(p[1] - 8)}" x2="${n1(p[0] + 3)}" y2="${n1(p[1] + 8)}" stroke="#e08a2e" stroke-width="2.4"/>`;
  }
  s += box(P, x + 0.55, y - 0.3, x + 1.0, y + 0.3, 0.2, 0.95, ["#f08b3c", "#d77428", "#bb601d"]);
  s += box(P, x + 0.98, y - 0.24, x + 1.01, y + 0.24, 0.6, 0.88, GLASS);
  s += seg(P(x - 1.0, y, 0.7), P(x - 1.35, y - 0.25, 0.45), "#8a929b", 2.4);
  return s;
}
function pumpTruck(P, x, y, target, time) {
  let s = wheels(P, x - 0.6, y + 0.35, 3, 0.6);
  s += box(P, x - 1.0, y - 0.34, x + 0.5, y + 0.34, 0.2, 0.55, CAB);
  s += box(P, x + 0.55, y - 0.32, x + 1.0, y + 0.32, 0.2, 0.95, ["#3f6fb0", "#325d97", "#284c7e"]);
  // Outriggers down while pumping.
  s += box(P, x - 0.9, y - 0.75, x - 0.8, y + 0.75, 0.05, 0.2, STEEL) + box(P, x + 0.3, y - 0.75, x + 0.4, y + 0.75, 0.05, 0.2, STEEL);
  // A three-section boom from the turret to just above the pour point, then the hose.
  const base = [x - 0.3, y, 0.75];
  const [tx, ty, tz] = target;
  const sway = 0.08 * Math.sin(time * 0.8);
  const j1 = [base[0] + (tx - base[0]) * 0.3, base[1] + (ty - base[1]) * 0.3, tz + 2.4],
    j2 = [base[0] + (tx - base[0]) * 0.75 + sway, base[1] + (ty - base[1]) * 0.75, tz + 2.0],
    tip = [tx + sway, ty, tz + 1.1];
  s += seg(P(...base), P(...j1), "#2f62a6", 4) + seg(P(...j1), P(...j2), "#3f74ba", 3.4) + seg(P(...j2), P(...tip), "#5687c6", 2.8);
  s += seg(P(...tip), P(tx + sway, ty, tz + 0.15), "#2f3338", 2.4);
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
  if (p.key === "dig") {
    // Trucks shuttle the spoil away: in, filled bucket by bucket, out again.
    const cycle = (time / 9) % 1;
    const out = cycle < 0.2 ? 1 - cycle / 0.2 : cycle > 0.85 ? (cycle - 0.85) / 0.15 : 0;
    behind += dumpTruck(P, 1.2 + (out + away) * 4.5, -w - 0.65, cycle < 0.2 ? 0 : Math.min(1, (cycle - 0.2) / 0.6));
    machines += excavator(P, w + 1.1 + away * 4, w + 0.6, time);
    crew.push([-w - 0.9, w + 0.9, 0]);
  } else if (["lean", "footPour", "colPour", "deckPour"].includes(p.key)) {
    behind += mixerTruck(P, 1.3 + away * 4.5, -w - 0.62, time);
    if (p.key === "footPour" || p.key === "deckPour") {
      const z = p.key === "footPour" ? 0.3 : 0.3 + (p.floor + 1) * hf;
      const edge = p.key === "deckPour" ? -w + 2 * w * Math.min(1, k / 0.85) : 0;
      machines += pumpTruck(P, 0.9 + away * 4.5, w + 1.0, [edge, 0.2 * Math.sin(time * 0.5), z], time);
      // Hose man and vibrator man at the pour front.
      crew.push([edge - 0.35, 0.6, z], [edge + 0.15, -0.7, z]);
    } else crew.push([-w + 0.4, w + 0.5, p.floor >= 0 ? 0.3 + p.floor * hf : 0]);
  } else if (p.key === "mobilize") crew.push([1.8, 2.2, 0], [-1.6, 1.9, 0]);
  else if (p.key === "layout") crew.push([w + 1.0, -w - 0.2, 0], [-w - 0.7, w + 0.6, 0]);
  else if (p.key === "footRebar" || p.key === "footForm") crew.push([-w + 0.3, w + 0.4, 0], [w + 0.4, -w + 0.2, 0]);
  else if (p.floor >= 0) {
    // Fixers and carpenters on the storey under way.
    const z = 0.3 + p.floor * hf;
    crew.push([-w + 0.6, w - 0.3, z], [w - 0.5, -w + 0.7, z]);
  } else if (p.key === "walls" || p.key === "openings" || p.key === "finish") crew.push([w + 0.7, w * 0.3, 0], [-w * 0.3, w + 0.7, 0]);
  else if (p.key === "handover") crew.push([w + 1.0, w + 1.2, 0]);
  let people = "";
  crew.forEach(([x, y, z], i) => (people += worker(P, x, y, z, time, i * 1.7, i % 2 ? "#f4f2ea" : "#f6d24a")));
  return { behind, front: machines + people };
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

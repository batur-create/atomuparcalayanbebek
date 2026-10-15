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

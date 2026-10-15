// The tower crane: its own concrete footing and ballast, a lattice mast, the
// slewing unit with the operator's cab, tower head and pendant ties, a lattice
// jib with a trolley, a counter-jib with counterweights, and a hook block that
// carries what the work under way needs on a four-leg sling.
import { box, outline, poly, seg } from "./iso.js";
import { FRAME_END, phaseAt } from "./construction.js";

const YELLOW = ["#f6c945", "#dcae2c", "#c0951f"],
  LACE = "#c99622",
  STEEL = ["#9aa4ae", "#7f8994", "#68727c"],
  CONCRETE = ["#cdcac2", "#b2afa7", "#99968f"],
  REBAR = ["#9a5a40", "#84492f", "#6f3c26"],
  PLY = ["#e6c383", "#cfa56a", "#b98e55"],
  BLOCK = ["#ecebe6", "#d9d7cf", "#c4c1b8"],
  PALLET = ["#c7a06a", "#ad8754", "#946f42"];
const n1 = (v) => v.toFixed(1);

// What hangs on the hook, phase by phase. Returns the drawing and the four
// sling points on top of the load.
function loadFor(P, key, sp, x, y, z, roofT) {
  if (["lean", "footRebar", "colRebar", "deckRebar"].includes(key)) {
    let s = box(P, x - 0.75, y - 0.13, x + 0.75, y + 0.13, z - 0.2, z, REBAR);
    for (const dz of [0.06, 0.13]) s += seg(P(x - 0.75, y + 0.14, z - dz), P(x + 0.75, y + 0.14, z - dz), "#c07a5a", 0.7);
    return { s, at: [[x - 0.5, y, z], [x - 0.5, y, z], [x + 0.5, y, z], [x + 0.5, y, z]] };
  }
  if (["footForm", "colForm", "deckForm"].includes(key)) {
    let s = box(P, x - 0.45, y - 0.3, x + 0.45, y + 0.3, z - 0.24, z, PLY);
    for (let i = 1; i < 5; i++) s += seg(P(x - 0.45, y + 0.31, z - 0.048 * i), P(x + 0.45, y + 0.31, z - 0.048 * i), "#b98e55", 0.6);
    return { s, at: [[x - 0.4, y - 0.25, z], [x + 0.4, y - 0.25, z], [x + 0.4, y + 0.25, z], [x - 0.4, y + 0.25, z]] };
  }
  if (["footPour", "colPour", "deckPour"].includes(key)) {
    // Concrete skip: a steel bucket with fresh concrete on top and a gate below.
    let s = box(P, x - 0.24, y - 0.24, x + 0.24, y + 0.24, z - 0.55, z, STEEL);
    s += poly([P(x - 0.21, y - 0.21, z + 0.01), P(x + 0.21, y - 0.21, z + 0.01), P(x + 0.21, y + 0.21, z + 0.01), P(x - 0.21, y + 0.21, z + 0.01)], "#8e9298");
    s += box(P, x - 0.08, y - 0.08, x + 0.08, y + 0.08, z - 0.7, z - 0.55, ["#68727c", "#555e67", "#454c54"]);
    return { s, at: [[x - 0.22, y - 0.22, z], [x + 0.22, y - 0.22, z], [x + 0.22, y + 0.22, z], [x - 0.22, y + 0.22, z]] };
  }
  if (key === "walls") {
    let s = box(P, x - 0.32, y - 0.27, x + 0.32, y + 0.27, z - 0.58, z - 0.5, PALLET) + box(P, x - 0.29, y - 0.24, x + 0.29, y + 0.24, z - 0.5, z, BLOCK);
    s += seg(P(x - 0.29, y + 0.25, z - 0.25), P(x + 0.29, y + 0.25, z - 0.25), "#c9c6bd", 0.7) + seg(P(x + 0.3, y - 0.24, z - 0.25), P(x + 0.3, y + 0.24, z - 0.25), "#c9c6bd", 0.7);
    return { s, at: [[x - 0.29, y - 0.24, z], [x + 0.29, y - 0.24, z], [x + 0.29, y + 0.24, z], [x - 0.29, y + 0.24, z]] };
  }
  if (key === "roof") {
    if (roofT < 0.6) {
      // A truss, slung at two points.
      const w = sp.hw + 0.32,
        h = sp.roofType === "pyramid" ? 0.9 : sp.hw * 0.85;
      const s = seg(P(x, y - w * 0.6, z - h * 0.6), P(x, y, z), "#b5803f", 1.6) + seg(P(x, y + w * 0.6, z - h * 0.6), P(x, y, z), "#b5803f", 1.6) + seg(P(x, y - w * 0.6, z - h * 0.6), P(x, y + w * 0.6, z - h * 0.6), "#8f6230", 1.3);
      return { s, at: [[x, y - w * 0.3, z - h * 0.3], [x, y - w * 0.3, z - h * 0.3], [x, y + w * 0.3, z - h * 0.3], [x, y + w * 0.3, z - h * 0.3]] };
    }
    const s = box(P, x - 0.3, y - 0.25, x + 0.3, y + 0.25, z - 0.4, z - 0.33, PALLET) + box(P, x - 0.27, y - 0.22, x + 0.27, y + 0.22, z - 0.33, z, [sp.roof[2], sp.roof[0], sp.roof[1]]);
    return { s, at: [[x - 0.27, y - 0.22, z], [x + 0.27, y - 0.22, z], [x + 0.27, y + 0.22, z], [x - 0.27, y + 0.22, z]] };
  }
  return null;
}

export function craneSVG(P, sp, plan, time, shown, built, workZ) {
  const topOf = 0.3 + sp.h;
  const zc = Math.max(topOf + (sp.roofType === "pyramid" ? 3.2 : 2.6), 4.8),
    [mx, my] = [-3.0, 3.0],
    end = [0.75, -0.75],
    a = 0.17;
  // Footing and ballast first: the crane stands on its own foundation.
  let s = box(P, mx - 0.55, my - 0.55, mx + 0.55, my + 0.55, 0, 0.22, CONCRETE);
  s += box(P, mx - 0.45, my - 0.45, mx - 0.05, my - 0.05, 0.22, 0.42, CONCRETE) + box(P, mx + 0.05, my + 0.05, mx + 0.45, my + 0.45, 0.22, 0.42, CONCRETE);
  // Lattice mast, section by section: four chords, horizontal rings, zigzag lacing.
  const mastTop = 0.22 + (zc - 0.22) * built;
  const corners = [[mx - a, my - a], [mx + a, my - a], [mx - a, my + a], [mx + a, my + a]];
  corners.forEach(([x, y]) => (s += box(P, x - 0.03, y - 0.03, x + 0.03, y + 0.03, 0.22, mastTop, YELLOW)));
  for (let z = 0.22, i = 0; z < mastTop - 0.05; z += 0.42, i++) {
    const z1 = Math.min(mastTop, z + 0.42);
    s += seg(P(mx - a, my + a, z), P(mx + a, my + a, z), LACE, 0.9) + seg(P(mx + a, my - a, z), P(mx + a, my + a, z), LACE, 0.9);
    s += seg(P(i % 2 ? mx - a : mx + a, my + a, z), P(i % 2 ? mx + a : mx - a, my + a, z1), LACE, 0.9);
    s += seg(P(mx + a, i % 2 ? my - a : my + a, z), P(mx + a, i % 2 ? my + a : my - a, z1), LACE, 0.9);
  }
  if (built < 1) return s;

  // Slewing unit, cab facing the jib, tower head.
  s += box(P, mx - 0.26, my - 0.26, mx + 0.26, my + 0.26, zc, zc + 0.16, STEEL);
  s += box(P, mx + 0.1, my - 0.05, mx + 0.48, my + 0.33, zc - 0.42, zc, ["#f4f2ea", "#dcd8cc", "#c4bfb1"]);
  s += poly([P(mx + 0.49, my, zc - 0.36), P(mx + 0.49, my + 0.3, zc - 0.36), P(mx + 0.49, my + 0.3, zc - 0.1), P(mx + 0.49, my, zc - 0.1)], "#5b7a96");
  const apex = [mx, my, zc + 1.25];
  s += seg(P(mx - 0.15, my + 0.15, zc + 0.16), P(...apex), YELLOW[2], 1.8) + seg(P(mx + 0.15, my - 0.15, zc + 0.16), P(...apex), YELLOW[1], 1.8);

  // Counter-jib with concrete counterweights.
  const dx = end[0] - mx,
    dy = end[1] - my,
    len = Math.hypot(dx, dy),
    ux = dx / len,
    uy = dy / len,
    nx = -uy * 0.13,
    ny = ux * 0.13;
  const cj = [mx - ux * 1.5, my - uy * 1.5];
  s += seg(P(mx + nx, my + ny, zc + 0.16), P(cj[0] + nx, cj[1] + ny, zc + 0.16), YELLOW[1], 1.6) + seg(P(mx - nx, my - ny, zc + 0.16), P(cj[0] - nx, cj[1] - ny, zc + 0.16), YELLOW[2], 1.6);
  for (let i = 0; i < 3; i++) {
    const t = 1.0 + i * 0.17,
      cx = mx - ux * t,
      cy = my - uy * t;
    s += box(P, cx - 0.08, cy - 0.2, cx + 0.08, cy + 0.2, zc - 0.25, zc + 0.16, CONCRETE);
  }
  s += seg(P(...apex), P(cj[0], cj[1], zc + 0.16), "#5f5e5a", 0.8);

  // Jib: two bottom chords, a top chord and zigzag lacing.
  const zb = zc + 0.16,
    zt = zc + 0.5;
  const along = (t) => [mx + dx * t, my + dy * t];
  s += seg(P(mx + nx, my + ny, zb), P(end[0] + nx, end[1] + ny, zb), YELLOW[1], 1.4) + seg(P(mx - nx, my - ny, zb), P(end[0] - nx, end[1] - ny, zb), YELLOW[2], 1.4);
  s += seg(P(mx, my, zt), P(end[0], end[1], zt - 0.12), YELLOW[0], 1.4);
  for (let i = 0; i < 12; i++) {
    const [x0, y0] = along(i / 12),
      [x1, y1] = along((i + 1) / 12);
    s += seg(P(x0 + (i % 2 ? nx : -nx), y0 + (i % 2 ? ny : -ny), zb), P(x1, y1, zt - (0.12 * (i + 1)) / 12), LACE, 0.8);
  }
  s += seg(P(...apex), P(...along(0.62), zt - 0.07), "#5f5e5a", 0.8);

  // Trolley out along the jib, hoist ropes down to the hook block.
  const p = phaseAt(plan, shown);
  const k = Math.max(0, Math.min(1, (shown - p.a) / (p.b - p.a)));
  const u = 0.55 + 0.3 * (0.5 + 0.5 * Math.sin(time * 0.45));
  const [tx, ty] = along(u);
  const hook = Math.min(zb - 0.6, workZ + 1.5 + 0.35 * Math.sin(time * 0.9));
  s += box(P, tx - 0.12, ty - 0.12, tx + 0.12, ty + 0.12, zb - 0.1, zb, STEEL);
  s += seg(P(tx - 0.05, ty, zb - 0.1), P(tx - 0.05, ty, hook + 0.18), "#4a4f55", 0.8) + seg(P(tx + 0.05, ty, zb - 0.1), P(tx + 0.05, ty, hook + 0.18), "#4a4f55", 0.8);
  s += box(P, tx - 0.09, ty - 0.06, tx + 0.09, ty + 0.06, hook + 0.02, hook + 0.2, YELLOW);
  const [hx, hy] = P(tx, ty, hook);
  s += `<path d="M${n1(hx)} ${n1(hy)} q0 4 -3 4" fill="none" stroke="#3c4146" stroke-width="1.4"/>`;
  // The load on its sling, swaying a little.
  const sway = 0.05 * Math.sin(time * 1.3);
  const load = loadFor(P, p.key, sp, tx + sway, ty - sway, hook - 0.55, k);
  if (load && shown < 0.8) {
    for (const pt of load.at) s += seg(P(tx, ty, hook - 0.02), P(...pt), "#3c4146", 0.7);
    s += load.s;
  }
  return s;
}

// The geodesic dome: a 2V icosahedral hemisphere. Forty triangles, sixty-five
// steel struts of two lengths (A and B), twenty-six hubs, ten of them on the
// base ring where it is bolted down. Built the way it stands: base plates,
// struts ring by ring, the hubs bolted and torque-marked, then the panels
// closing the triangles one by one from the bottom. Pure functions of progress.
import { circle, ellipse, poly, seg } from "./iso.js";

const PHI = (1 + Math.sqrt(5)) / 2;
const clamp = (v) => Math.max(0, Math.min(1, v));
const norm = (v) => {
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
};
const mid = (a, b) => a.map((x, i) => (x + b[i]) / 2);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const add = (a, b) => a.map((x, i) => x + b[i]);
const mul = (a, k) => a.map((x) => x * k);
const dist = (a, b) => Math.hypot(...sub(a, b));

// Geometry on the unit sphere, built once.
function build() {
  const ico = [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]].map(norm);
  // Stand the icosahedron on a vertex (five-fold axis up), so the equator is a clean decagon.
  const up = ico[0],
    axis = norm([up[1], -up[0], 0]),
    sin = Math.hypot(up[0], up[1]),
    cos = up[2];
  const rot = (v) => {
    const dot = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
    const cr = [axis[1] * v[2] - axis[2] * v[1], axis[2] * v[0] - axis[0] * v[2], axis[0] * v[1] - axis[1] * v[0]];
    return v.map((x, i) => x * cos + cr[i] * sin + axis[i] * dot * (1 - cos));
  };
  const V = ico.map(rot);
  const near = Math.min(...V.slice(1).map((v) => dist(V[0], v)));
  const faces = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) if ([dist(V[i], V[j]), dist(V[j], V[k]), dist(V[i], V[k])].every((d) => Math.abs(d - near) < 1e-6)) faces.push([i, j, k]);
  const verts = new Map(),
    list = [];
  const vert = (v) => {
    v = norm(v);
    const key = v.map((x) => x.toFixed(4)).join(",");
    if (!verts.has(key)) (verts.set(key, list.length), list.push(v));
    return verts.get(key);
  };
  let tris = [];
  for (const [a, b, c] of faces) {
    const A = V[a], B = V[b], C = V[c], ab = mid(A, B), bc = mid(B, C), ca = mid(C, A);
    for (const t of [[A, ab, ca], [ab, B, bc], [ca, bc, C], [ab, bc, ca]]) tris.push(t.map(vert));
  }
  tris = tris.filter((t) => t.every((i) => list[i][2] > -1e-6));
  // Spin the dome about its axis so the ring has a vertex pointing away from the door side.
  const spin = Math.PI / 10;
  const turned = list.map(([x, y, z]) => [x * Math.cos(spin) - y * Math.sin(spin), x * Math.sin(spin) + y * Math.cos(spin), z]);
  const used = [...new Set(tris.flat())].sort((a, b) => a - b),
    index = new Map(used.map((old, n) => [old, n]));
  const verts3 = used.map((old) => turned[old]);
  tris = tris.map((t) => t.map((i) => index.get(i)));
  const edgeSet = new Map();
  for (const t of tris)
    for (let n = 0; n < 3; n++) {
      const a = t[n],
        b = t[(n + 1) % 3],
        key = a < b ? `${a}-${b}` : `${b}-${a}`;
      edgeSet.set(key, [Math.min(a, b), Math.max(a, b)]);
    }
  const edges = [...edgeSet.values()].map(([a, b]) => ({ a, b, len: dist(verts3[a], verts3[b]) }));
  const lens = [...new Set(edges.map((e) => e.len.toFixed(4)))].sort();
  edges.forEach((e) => (e.type = e.len.toFixed(4) === lens[0] ? "A" : "B"));
  const base = verts3.map((v, i) => i).filter((i) => verts3[i][2] < 1e-6).sort((a, b) => Math.atan2(verts3[a][1], verts3[a][0]) - Math.atan2(verts3[b][1], verts3[b][0]));
  return { verts: verts3, tris, edges, base, chord: { A: Number(lens[0]), B: Number(lens[1]) } };
}
export const MESH = build();
export const COUNTS = {
  nodes: MESH.verts.length,
  struts: MESH.edges.length,
  panels: MESH.tris.length,
  A: MESH.edges.filter((e) => e.type === "A").length,
  B: MESH.edges.filter((e) => e.type === "B").length,
};

// Strut length in metres, for a dome of the given radius in drawing units (one unit is 1.6 m).
export const strutMetres = (sp) => MESH.edges.reduce((n, e) => n + e.len * sp.h * 1.6, 0);

const azimuth = (v) => Math.atan2(v[1], v[0]);
// Assembly order: ring by ring from the bottom, round the dome inside a ring.
const rank = (zs, az) => Math.round(Math.min(...zs) * 1000) * 10 + (az + Math.PI) / 7;
const EDGE_ORDER = MESH.edges
  .map((e, i) => ({ i, r: rank([MESH.verts[e.a][2], MESH.verts[e.b][2]], azimuth(mid(MESH.verts[e.a], MESH.verts[e.b]))) }))
  .sort((x, y) => x.r - y.r)
  .map((x) => x.i);
const TRI_ORDER = MESH.tris
  .map((t, i) => {
    const c = t.reduce((s, n) => add(s, MESH.verts[n]), [0, 0, 0]);
    return { i, r: rank([c[2] / 3], azimuth(c)) };
  })
  .sort((x, y) => x.r - y.r)
  .map((x) => x.i);
const NODE_ORDER = MESH.verts
  .map((v, i) => ({ i, r: rank([v[2]], azimuth(v)) }))
  .sort((x, y) => x.r - y.r)
  .map((x) => x.i);
// Panels: the lowest ring is opaque insulated sandwich panel, the rest glass.
const OPAQUE_BELOW = 0.3;
const triCentre = (t) => mul(t.reduce((s, n) => add(s, MESH.verts[n]), [0, 0, 0]), 1 / 3);
// The doorway: the base triangle that faces the front (+y) most.
const DOOR_TRI = MESH.tris
  .map((t, i) => ({ t, i }))
  .filter(({ t }) => t.filter((n) => MESH.verts[n][2] < 1e-6).length === 2)
  .sort((a, b) => Math.abs(azimuth(triCentre(a.t)) - Math.PI / 2) - Math.abs(azimuth(triCentre(b.t)) - Math.PI / 2))[0];

const STEEL = ["#7d8995", "#5d6874", "#46505a"];
const GLASS_FRONT = "#bfe3e6",
  GLASS_LIT = "#ffe3a0",
  SANDWICH = ["#e8dcc4", "#d3c3a4", "#b9a785"];
const LIGHT = norm([-0.5, 0.75, 0.9]);

/** World position of a unit-sphere point on a dome of radius R lifted by `up`. */
const at = (R, v, up = 0) => [v[0] * R, v[1] * R, 0.3 + v[2] * R + up];
const depthOf = (p) => p[0] + p[1] + p[2];
// The dome is seen from the (1, 1, 1) corner.
const facing = (n) => n[0] + n[1] + n[2] > 0;

/**
 * The whole dome at one moment.
 * st: { anchor, struts, nodes, bolted?, panels, seal } each 0…1; deck: lay the
 * floor; lit: lights on; detail: 2 full, 1 panels only.
 */
export function geoSVG(P, sp, st, { lit = false, detail = 2 } = {}) {
  const R = sp.h,
    { verts, tris, edges, base } = MESH;
  const world = verts.map((v) => at(R, v));
  const screen = (p) => P(...p);
  let s = "";

  // ---- base plates on the slab, one at each ring node ----
  const plates = Math.ceil(clamp(st.anchor ?? 1) * base.length - 1e-9);
  const plateSVG = (n) => {
    const [x, y, z] = world[base[n]];
    const q = (dx, dy, h) => P(x + dx, y + dy, z + h);
    let o = poly([q(-0.14, -0.14, 0.04), q(0.14, -0.14, 0.04), q(0.14, 0.14, 0.04), q(-0.14, 0.14, 0.04)], "#9aa6b2") + poly([q(-0.14, 0.14, 0), q(0.14, 0.14, 0), q(0.14, 0.14, 0.04), q(-0.14, 0.14, 0.04)], "#6b7682") + poly([q(0.14, -0.14, 0), q(0.14, 0.14, 0), q(0.14, 0.14, 0.04), q(0.14, -0.14, 0.04)], "#59636e");
    for (const [dx, dy] of [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]]) {
      const b = q(dx, dy, 0.045);
      o += circle(b[0], b[1], 1.1, "#d7dde3");
    }
    return o;
  };
  // Interior deck: a plywood floor laid inside the ring.
  if (st.deck) {
    const ring = base.map((i) => P(world[i][0] * 0.98, world[i][1] * 0.98, 0.31));
    s += poly(ring, "#c9a97a") + poly(base.map((i) => P(world[i][0] * 0.6, world[i][1] * 0.6, 0.312)), "#d4b88c");
  }

  // ---- structure: struts, hubs ----
  const nStruts = (st.struts ?? 1) * edges.length,
    doneStruts = Math.floor(nStruts + 1e-9),
    placed = new Set();
  const members = [];
  EDGE_ORDER.forEach((ei, order) => {
    const e = edges[ei];
    let u = 0;
    if (order < doneStruts) u = 1;
    else if (order === doneStruts && nStruts - doneStruts > 0) u = nStruts - doneStruts;
    else return;
    // The strut in flight hangs from the crane hook above its place, swinging down.
    const lift = (1 - u) * 1.3;
    const a = at(R, verts[e.a], lift),
      b = at(R, verts[e.b], lift);
    if (u === 1) (placed.add(e.a), placed.add(e.b));
    const m = mid(a, b);
    members.push({ d: depthOf(m), back: !facing(mid(verts[e.a], verts[e.b])), a, b, type: e.type, flying: u < 1 });
  });
  const boltedNodes = new Set(NODE_ORDER.slice(0, Math.ceil(clamp(st.nodes ?? 1) * COUNTS.nodes - 1e-9)));
  const hubs = [...placed].map((i) => ({ d: depthOf(world[i]) + 0.01, back: !facing(verts[i]), p: world[i], bolted: boltedNodes.has(i) && (st.nodes ?? 1) > 0 }));
  const tube = (m, back) => {
    const k = back ? 0.55 : 1;
    const pa = screen(m.a),
      pb = screen(m.b);
    const col = m.type === "A" ? STEEL[1] : STEEL[0];
    return seg(pa, pb, back ? "#4a5560" : col, back ? 2.2 : 3, k) + (back ? "" : seg(pa, pb, "#c9d3dc", 0.9, 0.7));
  };
  const hubSVG = (h) => {
    const [x, y] = screen(h.p);
    let o = circle(x, y, h.back ? 2.3 : 3.1, h.back ? "#56616c" : "#8e9aa6");
    if (!h.back) {
      o += circle(x - 0.6, y - 0.6, 1.5, "#c5ced6");
      // A bolted hub shows its bolt head and the yellow torque mark across it.
      o += h.bolted ? circle(x, y, 1.15, "#eef2f5") + seg([x - 1.6, y + 1.3], [x + 1.6, y - 1.3], "#f2c14e", 1.1) : circle(x, y, 1.05, "#3a424b");
    }
    return o;
  };
  const drawStructure = (back) => {
    const items = [...members.filter((m) => m.back === back).map((m) => ({ d: m.d, svg: tube(m, back) })), ...hubs.filter((h) => h.back === back).map((h) => ({ d: h.d, svg: hubSVG(h) }))];
    return items.sort((x, y) => x.d - y.d).map((x) => x.svg).join("");
  };
  if (detail >= 2) s += drawStructure(true);

  // ---- panels, closing the triangles from the bottom ----
  const nPanels = (st.panels ?? 0) * tris.length,
    donePanels = Math.floor(nPanels + 1e-9);
  const panels = [];
  TRI_ORDER.forEach((ti, order) => {
    let u = 0;
    if (order < donePanels) u = 1;
    else if (order === donePanels && nPanels - donePanels > 0) u = nPanels - donePanels;
    else return;
    const t = tris[ti],
      c = triCentre(t);
    if (!facing(c) && u === 1) return;
    const lift = (1 - u) * 1.3;
    const pts = t.map((n) => at(R, verts[n], lift));
    const shade = clamp((norm(c).reduce((s2, v, i) => s2 + v * LIGHT[i], 0) + 0.4) / 1.4);
    const opaque = c[2] < OPAQUE_BELOW;
    panels.push({ d: depthOf(at(R, c, lift)), pts, shade, opaque, door: ti === DOOR_TRI.i });
  });
  for (const pn of panels.sort((x, y) => x.d - y.d)) {
    const sc = pn.pts.map(screen);
    if (pn.opaque) {
      s += poly(sc, SANDWICH[pn.shade > 0.66 ? 0 : pn.shade > 0.4 ? 1 : 2]);
    } else {
      // Glass: pale, let the structure behind it show through, brighter on the lit side.
      s += poly(sc, lit ? GLASS_LIT : GLASS_FRONT, lit ? 0.6 : 0.35 + 0.35 * pn.shade);
      s += poly(sc, "#ffffff", 0.08 + 0.25 * Math.max(0, pn.shade - 0.55));
    }
  }
  // Gaskets and sealant: a dark bead along every edge of a closed panel, then the silicone joint.
  const seal = clamp(st.seal ?? 0);
  if (seal > 0 && detail >= 2) {
    const n = Math.ceil(seal * edges.length - 1e-9);
    for (const ei of EDGE_ORDER.slice(0, n)) {
      const e = edges[ei];
      if (!facing(mid(verts[e.a], verts[e.b]))) continue;
      s += seg(screen(world[e.a]), screen(world[e.b]), "#2f353b", 1.1, 0.8);
    }
  }
  if (detail >= 2) s += drawStructure(false);
  else if (donePanels) {
    // Far away: just the edges of the front triangles.
    for (const e of edges) if (facing(mid(verts[e.a], verts[e.b]))) s += seg(screen(world[e.a]), screen(world[e.b]), "#6a7580", 0.9, 0.9);
  }

  // ---- plates over the structure so a plate in front is not buried ----
  const plateOrder = base.map((_, n) => n).slice(0, plates).sort((a, b) => depthOf(world[base[a]]) - depthOf(world[base[b]]));
  let before = "",
    after = "";
  for (const n of plateOrder) (facing(verts[base[n]]) ? (after += plateSVG(n)) : (before += plateSVG(n)));
  // Back plates go under everything drawn so far; the front ones are drawn last.
  return before + s + after;
}

/** The doorway cut into the front base panel, with the vent cap at the crown. */
export function geoDoorSVG(P, sp, t = 1) {
  const R = sp.h,
    t3 = DOOR_TRI.t.map((n) => at(R, MESH.verts[n]));
  const ring = t3.filter((p) => p[2] < 0.301),
    apex = t3.find((p) => p[2] > 0.301);
  const m = mid(ring[0], ring[1]),
    along = mul(sub(ring[1], ring[0]), 0.17),
    up = mul(sub(apex, m), 0.5 * t);
  const p0 = sub(m, along),
    p1 = add(m, along);
  const door = [p0, p1, add(p1, up), add(p0, up)].map((p) => P(...p));
  let s = poly(door, "#7b5532");
  const h = P(...add(mid(p0, p1), mul(up, 0.5)));
  s += seg(door[0], door[3], "#fff6e6", 1.2) + seg(door[1], door[2], "#fff6e6", 1.2) + seg(door[3], door[2], "#fff6e6", 1.2);
  s += circle(h[0] + 3, h[1], 0.9, "#f2c14e");
  // Vent cap on the crown hub.
  const top = P(0, 0, 0.3 + R + 0.05);
  return s + ellipse(top[0], top[1] - 1, 4.2, 2, "#8e9aa6") + ellipse(top[0], top[1] - 2.2, 2.6, 1.1, "#c5ced6");
}

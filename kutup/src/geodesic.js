// Jeodezik kubbe: a four-frequency icosahedral hemisphere of steel struts and
// hubs, standing on a concrete ring beam over the raft and closed with
// triangular sandwich panels, five pentagon windows and a pentagon skylight.
// Drawn face by face from the real geometry, so the site shows it going up
// ring by ring on a central shoring tower, then panel by panel.
import { GLASS, LIT, STONE, box, circle, gardenSVG, poly, seg } from "./iso.js";

const FREQ = 4;
export const STEM = 0.5; // ring beam over the raft, the dome's base
export const DOME_R = 2.15;
export const PANEL = { faces: ["#f6f3ec", "#e4dfd4", "#cbc4b6"], grain: "#a9a193", pattern: "geodesic" };
const CONCRETE = ["#d3d0c8", "#bdb9b0", "#a6a299"],
  WET = ["#8e9298", "#7a7e85", "#676b71"],
  PLY = ["#e6c383", "#cfa56a", "#b98e55"],
  REBAR = "#8a4b33",
  STRUT = "#5d6976",
  STRUT_BACK = "#66717d",
  HUB = "#3f4852",
  INSIDE = "#9c9385",
  SEAM = "#a39b8d",
  SCAF = "#9aa4ae";
const clamp = (v) => Math.max(0, Math.min(1, v));
const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

// ---------- geometry (unit sphere, built once) ----------
let GEO = null;
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const n = Math.hypot(...a);
  return a.map((v) => v / n);
};
// Towards the viewer of the isometric projection (screen position does not
// change along it), and the light, from the upper left like every box.
const VIEW = unit([1, 1, 1]),
  LIGHT = unit([0.2, 0.6, 0.8]);
// Struts go up in four rings, each closed before the next one starts.
export const BAND_TOPS = [0.3, 0.58, 0.83, 1.01];
export function geometry() {
  if (GEO) return GEO;
  // Icosahedron with a vertex up, turned so a pentagon faces the viewer and
  // the dome is symmetric about the screen's vertical (mirrored buildings).
  const h = 1 / Math.sqrt(5),
    r = 2 / Math.sqrt(5),
    turn = Math.PI / 4;
  const top = [0, 0, 1];
  const ring = (z, off) => Array.from({ length: 5 }, (_, i) => [r * Math.cos(turn + off + (2 * Math.PI * i) / 5), r * Math.sin(turn + off + (2 * Math.PI * i) / 5), z]);
  const U = ring(h, 0),
    L = ring(-h, Math.PI / 5);
  const big = [];
  for (let i = 0; i < 5; i++) {
    const j = (i + 1) % 5;
    big.push([top, U[i], U[j]], [U[i], L[i], U[j]], [U[j], L[i], L[j]]);
  }
  const verts = [],
    index = new Map();
  const vid = (p) => {
    const q = unit(p);
    const key = q.map((v) => Math.round(v * 1e5)).join(",");
    if (!index.has(key)) {
      index.set(key, verts.length);
      verts.push(q.map((v) => (Math.abs(v) < 1e-9 ? 0 : v)));
    }
    return index.get(key);
  };
  let faces = [];
  for (const [a, b, c] of big) {
    const at = (i, j) => vid(a.map((v, d) => v + ((b[d] - v) * i) / FREQ + ((c[d] - v) * j) / FREQ));
    for (let i = 0; i < FREQ; i++)
      for (let j = 0; j < FREQ - i; j++) {
        faces.push([at(i, j), at(i + 1, j), at(i, j + 1)]);
        if (i + j < FREQ - 1) faces.push([at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]);
      }
  }
  // The hemisphere: the equator lies exactly on edges of the subdivision.
  faces = faces.filter((f) => f.every((i) => verts[i][2] > -1e-6));
  const hubs = new Set([vid(top), ...U.map(vid)]);
  const list = faces.map((f) => {
    let [a, b, c] = f.map((i) => verts[i]);
    const centre = unit([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]);
    let n = unit(cross(sub(b, a), sub(c, a)));
    if (dot(n, centre) < 0) {
      f = [f[0], f[2], f[1]];
      n = n.map((v) => -v);
    }
    const pentagon = f.find((i) => hubs.has(i));
    return {
      v: f,
      n,
      z: centre[2],
      az: Math.atan2(centre[1], centre[0]),
      front: dot(n, VIEW) > 0,
      // Around the top hub: the skylight; around the five hubs below it: windows.
      glass: pentagon != null,
      sky: pentagon === vid(top),
    };
  });
  // Panels go on from the bottom ring up, round the dome.
  list.sort((p, q) => Math.round(p.z * 8) - Math.round(q.z * 8) || p.az - q.az);
  const edgeSet = new Map();
  for (const f of list)
    for (let e = 0; e < 3; e++) {
      const a = f.v[e],
        b = f.v[(e + 1) % 3],
        key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!edgeSet.has(key)) {
        const m = unit(verts[a].map((v, d) => (v + verts[b][d]) / 2));
        edgeSet.set(key, { a, b, z: m[2], az: Math.atan2(m[1], m[0]), front: dot(m, VIEW) > 0.05, base: verts[a][2] === 0 && verts[b][2] === 0 });
      }
    }
  const edges = [...edgeSet.values()].map((e) => ({ ...e, band: BAND_TOPS.findIndex((t) => e.z < t) }));
  edges.sort((p, q) => p.band - q.band || p.az - q.az);
  const base = verts.map((v, i) => [v, i]).filter(([v]) => v[2] === 0).map(([, i]) => i);
  const hubCount = new Set(list.flatMap((f) => f.v)).size;
  GEO = { verts, faces: list, edges, base, hubCount };
  return GEO;
}

// ---------- drawing helpers ----------
const domeZ = () => 0.3 + STEM;
const at = (sp, v) => [v[0] * sp.domeR, v[1] * sp.domeR, domeZ() + v[2] * sp.domeR];
// A face's shade: lit from the upper left on screen, also when mirrored.
function shade(P, n, faces) {
  const m = P.mirror ? [n[1], n[0], n[2]] : n;
  const t = clamp(dot(m, LIGHT) / 0.8);
  return t > 0.5 ? mix(faces[1], faces[0], (t - 0.5) * 2) : mix(faces[2], faces[1], t * 2);
}
const tri = (P, sp, f) => f.v.map((i) => P(...at(sp, GEO.verts[i])));

// A ring (annulus) between radii r0 and r1 from z0 to z1: inner faces seen
// through the middle, the top, then the outer faces in front.
export function ringSVG(P, r0, r1, z0, z1, faces, { top = true, inner = true, n = 40 } = {}) {
  const pt = (r, a, z) => P(r * Math.cos(a), r * Math.sin(a), z);
  const segs = Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * Math.PI * 2,
      a1 = ((i + 1) / n) * Math.PI * 2,
      am = (a0 + a1) / 2;
    return { a0, a1, depth: Math.cos(am) + Math.sin(am), n: [Math.cos(am), Math.sin(am), 0] };
  }).sort((p, q) => p.depth - q.depth);
  let s = "";
  if (inner) for (const g of segs) if (g.depth < 0) s += poly([pt(r0, g.a0, z0), pt(r0, g.a1, z0), pt(r0, g.a1, z1), pt(r0, g.a0, z1)], shade(P, g.n.map((v) => -v), faces));
  if (top) for (const g of segs) s += poly([pt(r0, g.a0, z1), pt(r1, g.a0, z1), pt(r1, g.a1, z1), pt(r0, g.a1, z1)], faces[0]);
  for (const g of segs) if (g.depth > 0) s += poly([pt(r1, g.a0, z0), pt(r1, g.a1, z0), pt(r1, g.a1, z1), pt(r1, g.a0, z1)], shade(P, g.n, faces));
  return s;
}
const circlePts = (P, r, z, n = 36, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return P(r * Math.cos(a), r * Math.sin(a), z);
});
function polyline(list, stroke, w, opacity = 1) {
  let s = "";
  for (let i = 1; i < list.length; i++) s += seg(list[i - 1], list[i], stroke, w, opacity);
  return s;
}

// ---------- ring beam ----------
// Reinforced-concrete ring beam over the raft: its cage (two hoops of bars,
// stirrups all round), plywood forms both sides, the pour, then the anchor
// bolts the base hubs are fixed to.
export function ringBeamSVG(P, sp, form, pour) {
  if (!(form > 0)) return "";
  const R = sp.domeR,
    r0 = R - 0.13,
    r1 = R + 0.13,
    z0 = 0.3,
    z1 = 0.3 + STEM;
  let s = "";
  const struck = pour > 0.9;
  const cage = () => {
    let c = "";
    const reach = Math.PI * 2 * clamp(form / 0.45);
    for (const r of [r0 + 0.05, r1 - 0.05]) for (const z of [z0 + 0.08, z1 - 0.08]) c += polyline(circlePts(P, r, z, 40, 0, reach), REBAR, 0.9);
    for (let a = 0; a < reach; a += Math.PI / 30) c += seg(P((r0 + 0.04) * Math.cos(a), (r0 + 0.04) * Math.sin(a), z0 + 0.06), P((r0 + 0.04) * Math.cos(a), (r0 + 0.04) * Math.sin(a), z1 - 0.06), "#a5654a", 0.6) + seg(P((r1 - 0.04) * Math.cos(a), (r1 - 0.04) * Math.sin(a), z0 + 0.06), P((r1 - 0.04) * Math.cos(a), (r1 - 0.04) * Math.sin(a), z1 - 0.06), "#a5654a", 0.6);
    return c;
  };
  const formed = clamp((form - 0.45) / 0.35);
  if (formed > 0 && !struck) s += ringSVG(P, r0 - 0.04, r0, z0, z0 + (z1 - z0 + 0.04) * formed, PLY, { top: false });
  if (!(pour > 0)) s += cage();
  else {
    const level = z0 + (z1 - z0) * clamp(pour / 0.8);
    s += ringSVG(P, r0, r1, z0, level, pour < 0.8 ? WET : CONCRETE.map((c, i) => mix(WET[i], c, clamp((pour - 0.8) / 0.2))));
  }
  if (formed > 0 && !struck) s += ringSVG(P, r1, r1 + 0.04, z0, z0 + (z1 - z0 + 0.04) * formed, PLY, { top: false, inner: false });
  // Anchor bolts: set in the cage on a template, standing proud of the pour.
  if (form > 0.8) s += anchorsSVG(P, sp, clamp((form - 0.8) / 0.2), pour > 0 ? Math.max(z1, 0.3) : z1);
  return s;
}
function anchorsSVG(P, sp, t, z1) {
  const { verts, base } = geometry();
  let s = "";
  const list = base.map((i) => verts[i]).sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  list.slice(0, Math.ceil(t * list.length)).forEach((v) => {
    const x = v[0] * sp.domeR,
      y = v[1] * sp.domeR;
    for (const [dx, dy] of [[-0.05, 0], [0.05, 0], [0, -0.05], [0, 0.05]]) s += seg(P(x + dx, y + dy, z1 - 0.05), P(x + dx, y + dy, z1 + 0.14), "#7d858d", 1);
  });
  return s;
}

// ---------- the frame ----------
// The temporary shoring tower in the middle carries the upper rings until
// the top hub closes the dome; then it comes down and the dome stands alone.
function shoreSVG(P, sp, height) {
  if (height <= 0.05) return "";
  const a = 0.32,
    z0 = 0.3,
    z1 = z0 + height;
  let s = "";
  const corners = [[-a, -a], [a, -a], [-a, a], [a, a]];
  for (const [x, y] of corners) s += seg(P(x, y, z0), P(x, y, z1), SCAF, 1.6);
  for (let z = z0 + 0.5, i = 0; z <= z1 + 0.01; z += 0.5, i++) {
    s += polyline([P(-a, -a, z), P(a, -a, z), P(a, a, z), P(-a, a, z), P(-a, -a, z)], "#f2c14e", 1);
    s += seg(P(a, i % 2 ? -a : a, z - 0.5), P(a, i % 2 ? a : -a, z), SCAF, 0.8, 0.8) + seg(P(i % 2 ? -a : a, a, z - 0.5), P(i % 2 ? a : -a, a, z), SCAF, 0.8, 0.8);
  }
  // The head jack under the top hub, and the working deck.
  s += box(P, -a - 0.08, -a - 0.08, a + 0.08, a + 0.08, z1 - 0.05, z1, ["#c79a5a", "#ad7f43", "#946b38"]);
  return s + box(P, -0.06, -0.06, 0.06, 0.06, z1, z1 + 0.12, ["#5b6775", "#4a5562", "#3f4954"]);
}
// Struts and hubs, ring by ring: `bands` holds each ring's progress.
function strutsSVG(P, sp, bands, front) {
  const { verts, edges } = geometry();
  const counts = BAND_TOPS.map((_, b) => edges.filter((e) => e.band === b).length);
  const done = new Set();
  let s = "";
  const seen = BAND_TOPS.map(() => 0);
  for (const e of edges) {
    const n = seen[e.band]++;
    if (n >= Math.ceil(clamp(bands[e.band]) * counts[e.band] - 1e-6)) continue;
    if (e.front !== front) continue;
    // Struts on the far side read darker than the fence behind them, so
    // their hubs never seem to float on their own.
    s += seg(P(...at(sp, verts[e.a])), P(...at(sp, verts[e.b])), front ? STRUT : STRUT_BACK, front ? 1.5 : 1.2, front ? 1 : 0.85);
    done.add(e.a).add(e.b);
  }
  for (const i of done) {
    const v = verts[i];
    if (front === dot(v, VIEW) > 0.05) {
      const [x, y] = P(...at(sp, v));
      s += circle(x, y, front ? 1.5 : 0.9, front ? HUB : STRUT_BACK);
    }
  }
  return s;
}

// ---------- the skin ----------
function panelsSVG(P, sp, { panels = 1, glazed = 1, sealed = 1, lit = false, front = true, detail = 2 }) {
  const { faces } = geometry();
  const opaque = faces.filter((f) => !f.glass),
    glass = faces.filter((f) => f.glass);
  const on = new Set(opaque.slice(0, Math.ceil(clamp(panels) * opaque.length - 1e-6)));
  // Windows first, the skylight last.
  const ordered = [...glass.filter((f) => !f.sky), ...glass.filter((f) => f.sky)];
  for (const f of ordered.slice(0, Math.ceil(clamp(glazed) * ordered.length - 1e-6))) on.add(f);
  let s = "";
  for (const f of faces) {
    if (f.front !== front || !on.has(f)) continue;
    const pts = tri(P, sp, f);
    if (!front) s += poly(pts, f.glass ? "#6f8796" : INSIDE);
    else if (f.glass) {
      s += poly(pts, lit ? (f.sky ? "#ffe39a" : LIT) : f.sky ? "#566a86" : GLASS);
      if (detail >= 2 && !lit) s += seg(pts[0].map((v, i) => v + (pts[1][i] - v) * 0.3), pts[0].map((v, i) => v + (pts[2][i] - v) * 0.3), "#ffffff", 0.8, 0.35);
    } else s += poly(pts, shade(P, f.n, sp.wall.faces));
  }
  // EPDM gaskets and capping strips along every joint, sealed from the bottom up.
  if (front && detail >= 2 && sealed > 0) {
    const { verts, edges } = geometry();
    const shown = edges.filter((e) => e.front);
    for (const e of shown.slice(0, Math.ceil(clamp(sealed) * shown.length - 1e-6))) s += seg(P(...at(sp, verts[e.a])), P(...at(sp, verts[e.b])), SEAM, 0.7, 0.9);
  }
  return s;
}

// ---------- entrance ----------
// The entrance tunnel on the door side: a steel-framed box through the
// dome's skin, clad in the same panels, with a flat roof and a glazed door.
const ENTRY = { x: 0.55, z1: 0.3 + 1.75 };
function entryReach(sp, x, z) {
  const R = sp.domeR + (z < domeZ() ? 0.13 : 0),
    dz = Math.max(0, z - domeZ());
  return Math.sqrt(Math.max(0.01, R * R - x * x - dz * dz));
}
export function entrySVG(P, sp, t = 1, lit = false) {
  if (!(t > 0)) return "";
  const R = sp.domeR,
    { x, z1 } = ENTRY,
    y1 = R + 0.6,
    zs = [0.3, 0.55, 0.8, 1.05, 1.3, 1.55, 1.8, z1],
    side = [P(x, y1, 0.3), P(x, y1, z1), ...zs.slice().reverse().map((z) => P(x, entryReach(sp, x, z), z))];
  let s = box(P, -x - 0.15, R + 0.13, x + 0.15, y1 + 0.35, 0, 0.3, STONE);
  if (t < 0.4) {
    // Steel posts and a ring of beams first.
    const up = 0.3 + (z1 - 0.3) * clamp(t / 0.25);
    for (const [px, py] of [[-x, y1], [x, y1], [x, entryReach(sp, x, z1)]]) s += seg(P(px, py, 0.3), P(px, py, up), "#5b6775", 1.4);
    if (t > 0.25) s += seg(P(-x, y1, z1), P(x, y1, z1), "#5b6775", 1.4) + seg(P(x, y1, z1), P(x, entryReach(sp, x, z1), z1), "#5b6775", 1.4);
    return s;
  }
  const faces = sp.wall.faces;
  const clad = clamp((t - 0.4) / 0.35);
  const zc = 0.3 + (z1 - 0.3) * clad;
  s += poly([P(x, y1, 0.3), P(x, y1, zc), ...zs.filter((z) => z <= zc).reverse().map((z) => P(x, entryReach(sp, x, z), z))], P.mirror ? faces[1] : faces[2]);
  s += poly([P(-x, y1, 0.3), P(x, y1, 0.3), P(x, y1, zc), P(-x, y1, zc)], P.mirror ? faces[2] : faces[1]);
  if (clad >= 1) {
    const back = entryReach(sp, x, z1);
    s += poly([P(-x - 0.06, back, z1), P(x + 0.06, back, z1), P(x + 0.06, y1 + 0.08, z1), P(-x - 0.06, y1 + 0.08, z1)], faces[0]);
    s += poly([P(-x - 0.06, y1 + 0.08, z1 - 0.08), P(x + 0.06, y1 + 0.08, z1 - 0.08), P(x + 0.06, y1 + 0.08, z1), P(-x - 0.06, y1 + 0.08, z1)], "#8f877a");
    // A porthole on the side, and the glazed door with its transom.
    const [cx, cy] = P(x + 0.005, (y1 + entryReach(sp, x, 1.2)) / 2 + 0.05, 1.25);
    s += circle(cx, cy, 4.2, "#e8e2d6") + circle(cx, cy, 3.1, lit ? LIT : GLASS);
  }
  if (t > 0.75) {
    const d = 0.32,
      h = 1.45,
      face = (a, b, za, zb, c) => poly([P(a, y1 + 0.01, za), P(b, y1 + 0.01, za), P(b, y1 + 0.01, zb), P(a, y1 + 0.01, zb)], c);
    s += face(-d - 0.06, d + 0.06, 0.3, 0.3 + h + 0.06, "#4a5562");
    s += face(-d, d, 0.3, 0.3 + h * clamp((t - 0.75) / 0.2), lit ? LIT : "#4f6478");
    if (t >= 0.95) s += seg(P(0, y1 + 0.02, 0.32), P(0, y1 + 0.02, 0.3 + h), "#4a5562", 1.2) + seg(P(0.08, y1 + 0.03, 0.95), P(0.08, y1 + 0.03, 1.15), "#d7dde3", 1.2);
  }
  return s;
}
// The lightning rod on the top hub.
function finialSVG(P, sp) {
  const top = domeZ() + sp.domeR;
  return seg(P(0, 0, top), P(0, 0, top + 0.45), "#6b737c", 1.3) + circle(...P(0, 0, top + 0.45), 1.4, "#c9a227");
}

// A scissor lift by the dome for the struts and panels up high.
export const LIFT = [-1.1, 2.38];
export function liftSVG(P, height) {
  const [x, y] = LIFT,
    z1 = 0.32 + Math.max(0.3, height);
  let s = box(P, x - 0.24, y - 0.18, x + 0.24, y + 0.18, 0.08, 0.3, ["#2f7ec2", "#2669a3", "#1f5788"]);
  for (const dx of [-0.17, 0.17]) {
    const [wx, wy] = P(x + dx, y + 0.18, 0.08);
    s += circle(wx, wy, 2.6, "#2f3338");
  }
  // The scissor: crossing arms, folding out as the deck goes up.
  const n = Math.max(1, Math.round((z1 - 0.3) / 0.45)),
    step = (z1 - 0.3) / n;
  for (let i = 0; i < n; i++) {
    const za = 0.3 + i * step,
      zb = za + step;
    s += seg(P(x - 0.2, y + 0.19, za), P(x + 0.2, y + 0.19, zb), "#3c4146", 1.1) + seg(P(x + 0.2, y + 0.19, za), P(x - 0.2, y + 0.19, zb), "#3c4146", 1.1);
  }
  s += box(P, x - 0.27, y - 0.2, x + 0.27, y + 0.2, z1, z1 + 0.05, ["#9aa4ae", "#7f8994", "#68727c"]);
  for (const r of [0.25, 0.5]) s += polyline([P(x - 0.27, y + 0.2, z1 + r), P(x + 0.27, y + 0.2, z1 + r), P(x + 0.27, y - 0.2, z1 + r)], "#f2c14e", 1);
  for (const [px, py] of [[x - 0.27, y + 0.2], [x + 0.27, y + 0.2], [x + 0.27, y - 0.2]]) s += seg(P(px, py, z1), P(px, py, z1 + 0.5), "#f2c14e", 1);
  return s;
}

// ---------- the site, by progress ----------
/** Everything of the dome above its ring beam at progress `shown`. */
export function domeSiteSVG(P, sp, plan, shown, lit) {
  const k = {};
  for (const p of plan) k[p.floor >= 0 ? `${p.key}${p.floor}` : p.key] = clamp((shown - p.a) / (p.b - p.a));
  geometry();
  const bands = BAND_TOPS.map((_, i) => k[`strut${i}`] || 0);
  const skin = { panels: k.panels, glazed: k.glazing, sealed: k.seal, lit };
  const closed = k.panels >= 1 && k.glazing >= 1;
  // Raised in the shoring phase, lowered once the bolts are checked.
  const shore = (sp.domeR - 0.05 + STEM) * clamp(k.shore) * (1 - clamp(k.unshore));
  let s = "";
  if (!closed) s += panelsSVG(P, sp, { ...skin, front: false }) + strutsSVG(P, sp, bands, false) + shoreSVG(P, sp, shore);
  s += strutsSVG(P, sp, bands, true) + panelsSVG(P, sp, skin);
  if (k.seal >= 1) s += finialSVG(P, sp);
  if (k.shore > 0 && k.seal < 1) {
    const p = plan.find((q) => shown >= q.a && shown < q.b) || plan[0];
    s += liftSVG(P, liftHeight(sp, p, k));
  }
  return s + entrySVG(P, sp, k.openings, lit);
}
// The deck of the scissor lift follows the work.
export function liftHeight(sp, p, k) {
  const top = (b) => domeZ() + sp.domeR * Math.min(0.72, BAND_TOPS[b]) - 0.9;
  if (p.key === "strut") return top(p.floor);
  if (["panels", "glazing", "seal"].includes(p.key)) return domeZ() - 0.9 + sp.domeR * 0.72 * clamp(k[p.key] ?? 0);
  return 0.3;
}
/** Height the crane and crew work at during the dome's phases. */
export function domeWorkHeight(sp, p, k = 0.5) {
  if (p.key === "strut") return domeZ() + sp.domeR * BAND_TOPS[Math.min(3, p.floor)] * 0.95;
  if (p.key === "shore" || p.key === "unshore") return domeZ() + sp.domeR * 0.8;
  if (["panels", "glazing", "seal"].includes(p.key)) return domeZ() + sp.domeR * clamp(0.15 + 0.85 * k);
  return null;
}

// ---------- the finished building ----------
export function domeShadowSVG(P, sp, t = 1) {
  const R = sp.domeR + 0.2,
    L = (STEM + sp.domeR) * 0.6 * t + 0.2;
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push(P(R * Math.cos(a), R * Math.sin(a), 0.01), P(R * Math.cos(a) + L, R * Math.sin(a) + L * 0.35, 0.01));
  }
  return poly(hull(pts), "#344a22", 0.2);
}
function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [],
    upper = [];
  for (const q of p) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  for (const q of p.reverse()) {
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
export const stemSVG = (P, sp) => ringSVG(P, sp.domeR - 0.13, sp.domeR + 0.13, 0.3, 0.3 + STEM, CONCRETE, { inner: false, n: 32 });
/** A finished dome: `detail` 2 = full, 1 = simple (far away), 0 = a block. */
export function geodesicSVG(P, sp, seed, { lit = sp.lit, detail = 2, shadowP = P } = {}) {
  geometry();
  const w = sp.hw + 0.2;
  let s = detail ? domeShadowSVG(shadowP, sp) : "";
  s += box(P, -w, -w, w, w, 0, 0.3, STONE) + stemSVG(P, sp);
  s += panelsSVG(P, sp, { lit, detail });
  if (!detail) return s;
  s += entrySVG(P, sp, 1, lit);
  if (detail < 2) return s;
  return s + finialSVG(P, sp) + gardenSVG(P, sp, seed);
}
/** Snow on the upper panels. */
export function domeSnowSVG(P, sp) {
  const { faces } = geometry();
  let s = "";
  for (const f of faces) if (f.front && f.z > 0.62 && !f.sky) s += poly(tri(P, sp, f), f.z > 0.8 ? "#f4f7fa" : "#e6edf3", 0.95);
  return s;
}

// ---------- how it is built ----------
const M = 1.6,
  V = M * M * M;
/** The dome as src/special.js describes buildings of their own. */
export const DOME = {
  system: "geodesic",
  ridge: 0.45,
  spec: () => ({ hw: DOME_R, domeR: DOME_R, h: STEM + DOME_R, floors: 1, wall: PANEL, roof: PANEL.faces }),
  // The raft, a ring beam with the anchor bolts, a shoring tower in the
  // middle, the struts ring by ring up to the top hub, the bolts torqued and
  // the geometry surveyed, the tower struck; then the skin.
  steps: [
    { key: "ringForm", label: "Halka kiriş: donatı, kalıp ve ankraj bulonları", w: 1.3, cost: 4, lift: true, liftAs: "footForm", inspect: "halka kiriş donatısı ve ankraj bulonları" },
    { key: "ringPour", label: "Halka kiriş betonu ve kür", w: 0.9, cost: 3, pour: true },
    { key: "shore", label: "Geçici merkez iskele kulesi", w: 0.7, cost: 2, lift: true, stock: "steel" },
    ...["taban halkası: düğümler ve alt çubuklar", "2. halka çubukları", "3. halka çubukları", "tepe halkası ve kilit düğümü"].map((label, i) => ({ key: "strut", label: `Kubbe ${label}`, w: i === 3 ? 0.6 : 0.9, cost: 5, floor: i, lift: true, stock: "steel" })),
    { key: "bolts", label: "Bulon sıkma ve kubbe geometrisi ölçümü", w: 0.6, cost: 2, inspect: "düğüm bulonları ve kubbe geometrisi", next: "iskele sökülebilir" },
    { key: "unshore", label: "Merkez iskele söküm: kubbe kendini taşıyor", w: 0.5, cost: 1 },
  ],
  frameEnd: 0.62,
  later: [
    { key: "panels", label: "Taş yünü dolgulu üçgen sandviç paneller", a: 0.62, b: 0.78, cost: 10, lift: true },
    { key: "glazing", label: "Lamine cam: beş pencere ve tepe feneri", a: 0.78, b: 0.83, cost: 6, lift: true },
    { key: "seal", label: "Derzler: EPDM conta ve kapak profilleri", a: 0.83, b: 0.86, cost: 3 },
    { key: "openings", label: "Giriş tüneli ve cam kapı", a: 0.86, b: 0.93 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1 },
  ],
  liftUntil: 0.83,
  craneEnd: 0.86,
  site: (P, sp, k) => ringBeamSVG(P, sp, k.ringForm, k.ringPour),
  scene: domeSiteSVG,
  shadow: domeShadowSVG,
  shadowFrom: "strut",
  building: geodesicSVG,
  snow: domeSnowSVG,
  workHeight: domeWorkHeight,
  chute: (sp) => [0.5, -sp.hw + 0.1, 0.85],
  // Fixers on the ring beam, erectors on the scissor lift and the shoring
  // tower, a surveyor checking the hubs, panel fitters.
  crew(sp, p, k, kk, time) {
    const tools = {
      ringForm: ["tie", "carry"], ringPour: ["hose", "trowel"], shore: ["hammer", "carry"], strut: ["hammer", "carry"],
      bolts: ["hammer", "none"], unshore: ["carry", "carry"], panels: ["hammer", "carry"], glazing: ["carry", "carry"], seal: ["trowel", "none"],
    }[p.key];
    if (!tools) return null;
    const w = sp.hw,
      list = [];
    if (["shore", "strut", "bolts", "panels", "glazing", "seal"].includes(p.key)) list.push([LIFT[0], LIFT[1] - 0.05, 0.37 + Math.max(0.3, liftHeight(sp, p, kk)), tools[0]]);
    else list.push([w * 0.62, w * 0.62, 0.3, tools[0]]);
    if (p.key === "strut" && p.floor >= 2) list.push([0.1, 0.1, 0.3 + (sp.h - 0.05) * 0.95 - 0.55, "hammer"]);
    if (p.key === "bolts") list.push([w + 1.0, -w - 0.2, 0, "survey"]);
    list.push([w * 0.2 + 0.6 * Math.sin(time * 0.2), w + 0.55, 0, tools[1]]);
    return list;
  },
  // The ring beam (26 × 50 cm), and the struts (Ø60 tube, about 4.5 kg/m)
  // with their hubs (about 6 kg each), ring by ring.
  metraj(sp, p, k) {
    const ring = 2 * Math.PI * sp.domeR * 0.26 * STEM * V;
    if (p.key === "ringPour") return { concrete: k * ring };
    if (p.key === "ringForm") return { rebar: k * ring * 0.12 };
    if (p.key !== "strut") return null;
    const { verts, edges, hubCount } = geometry();
    const band = edges.filter((e) => e.band === p.floor);
    const metres = band.reduce((n, e) => n + Math.hypot(...verts[e.a].map((v, i) => v - verts[e.b][i])), 0) * sp.domeR * M;
    return { steel: (k * (metres * 4.5 + (band.length / edges.length) * hubCount * 6)) / 1000 };
  },
  items: (q, num) => (q.steel > 0 ? `Çelik ${num(q.steel, 2)} t` : `Donatı ${num(q.rebar, 2)} t`),
};

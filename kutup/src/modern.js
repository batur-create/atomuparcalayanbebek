// Three buildings of modern structural engineering (n37): a market under
// Candela-style hypar umbrellas, an amphitheatre under a tensioned membrane,
// and a house whose upper floor cantilevers out on storey-high trusses. Each
// is drawn from its own geometry and goes up in the order it is really built;
// src/special.js wires them into the site, the crew, the crane and the quantities.
import { GLASS, LIT, box, circle, ellipse, faceX, faceY, poly, rng, seg } from "./iso.js";
import { CONCRETE, M, PLY, REBAR, V, WET, at, castShadow, clamp, facing, mix, mixAll, progress, rectOutline, shade } from "./kit.js";

const STEEL = ["#7d8995", "#66727e", "#525d68"],
  TUBE = "#5d6976",
  PROP = "#9aa4ae";
const ease = (t) => t * t * (3 - 2 * t);
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v) => v.map((c) => c / (Math.hypot(...v) || 1));
// A surface cell: its corners, its depth along the view, its upward normal.
function cell(a, b, c, d) {
  let n = unit(cross(sub(c, a), sub(d, b)));
  if (n[2] < 0) n = n.map((v) => -v);
  return { pts: [a, b, c, d], n, depth: (a[0] + b[0] + c[0] + d[0] + a[1] + b[1] + c[1] + d[1] + a[2] + b[2] + c[2] + d[2]) / 4 };
}
const areaOf = ({ pts: [a, b, c, d] }) => (Math.hypot(...cross(sub(b, a), sub(d, a))) + Math.hypot(...cross(sub(b, c), sub(d, c)))) / 2;
// Draw a list of { depth, s } far to near.
const painted = (list) => list.sort((a, b) => a.depth - b.depth).map((e) => e.s).join("");

// =====================================================================
// Kabuk çatılı pazar: four inverted umbrellas, each a column and four
// hyperbolic-paraboloid quadrants 4 cm thick. A hypar is ruled by straight
// lines, so its formwork is straight planks; one form is struck once the
// shell cures and moved to the next umbrella, as Candela did.
// =====================================================================
const K = { a: 0.97, h0: 1.55, H: 2.3, col: 0.13, n: 6 };
const UMBRELLAS = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
const SHELL = ["#eeebe4", "#d4d0c7", "#b3aea4"],
  SOFFIT = ["#c9c4b9", "#b0aba0", "#959086"];
// A point on the quadrant (sx, sy) of the umbrella at (cx, cy): a bilinear
// patch from the column head up to the level outer edges.
const shellPt = (cx, cy, sx, sy, u, v) => [cx + sx * K.a * u, cy + sy * K.a * v, K.h0 + (K.H - K.h0) * (u + v - u * v)];
const QUADS = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
function shellCells(cx, cy) {
  const list = [];
  QUADS.forEach(([sx, sy], q) => {
    for (let i = 0; i < K.n; i++)
      for (let j = 0; j < K.n; j++) {
        const [u0, u1, v0, v1] = [i / K.n, (i + 1) / K.n, j / K.n, (j + 1) / K.n];
        list.push({ ...cell(shellPt(cx, cy, sx, sy, u0, v0), shellPt(cx, cy, sx, sy, u1, v0), shellPt(cx, cy, sx, sy, u1, v1), shellPt(cx, cy, sx, sy, u0, v1)), q, r: (u0 + u1 + v0 + v1) / 4, i, j, sx, sy });
      }
  });
  return list;
}
const SHELL_AREA = shellCells(0, 0).reduce((n, c) => n + areaOf(c), 0) * M * M;
function columnSVG(P, cx, cy, t, faces = CONCRETE) {
  if (t <= 0) return "";
  const top = 0.3 + (K.h0 - 0.3) * clamp(t / 0.4),
    c = K.col;
  if (t < 0.4) {
    let s = "";
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) s += seg(P(cx + dx * c * 0.7, cy + dy * c * 0.7, 0.3), P(cx + dx * c * 0.7, cy + dy * c * 0.7, top), REBAR, 1);
    for (let z = 0.4; z < top; z += 0.15) s += seg(P(cx - c * 0.7, cy + c * 0.7, z), P(cx + c * 0.7, cy + c * 0.7, z), REBAR, 0.7) + seg(P(cx + c * 0.7, cy + c * 0.7, z), P(cx + c * 0.7, cy - c * 0.7, z), REBAR, 0.7);
    return s;
  }
  if (t < 0.7) return box(P, cx - c - 0.03, cy - c - 0.03, cx + c + 0.03, cy + c + 0.03, 0.3, K.h0 - 0.25, PLY);
  const conc = mixAll(WET, faces, clamp((t - 0.7) / 0.3));
  // The shaft, then its flared capital up to the shell.
  let s = box(P, cx - c, cy - c, cx + c, cy + c, 0.3, K.h0 - 0.28, conc);
  const z0 = K.h0 - 0.28,
    w = 0.32;
  s += poly([P(cx + c, cy - c, z0), P(cx + c, cy + c, z0), P(cx + w, cy + w, K.h0), P(cx + w, cy - w, K.h0)], shade(P, unit([1, 0, -0.6]), conc));
  s += poly([P(cx - c, cy + c, z0), P(cx + c, cy + c, z0), P(cx + w, cy + w, K.h0), P(cx - w, cy + w, K.h0)], shade(P, unit([0, 1, -0.6]), conc));
  return s;
}
// One umbrella in its state: props, plank forms and mesh, wet then cured
// concrete, and the formwork struck.
function umbrellaSVG(P, cx, cy, st, detail = 2, lit = false) {
  let s = "";
  const props = st.done ? 0 : clamp(st.form / 0.35),
    planks = st.done ? 4 : clamp((st.form - 0.35) / 0.4) * 4,
    mesh = st.done ? 1 : clamp((st.form - 0.75) / 0.25),
    poured = st.done ? 9 : clamp(st.pour / 0.6) * 1.0001,
    cured = st.done ? 1 : clamp((st.pour - 0.6) / 0.25),
    struck = st.done || st.pour >= 0.85 ? clamp((st.pour - 0.85) / 0.15) + (st.done ? 1 : 0) : 0;
  // Shoring under the quadrants: props on sole boards, braced.
  if (props > 0 && struck < 1) {
    const list = [];
    for (const [sx, sy] of QUADS) for (const u of [0.35, 0.8]) for (const v of [0.35, 0.8]) list.push(shellPt(cx, cy, sx, sy, u, v));
    list.sort((a, b) => a[0] + a[1] - b[0] - b[1]).slice(0, Math.ceil(props * list.length)).forEach(([x, y, z]) => (s += seg(P(x, y, 0.3), P(x, y, (z - 0.03) * Math.min(1, props * 1.3 + 0.2) + (1 - Math.min(1, props * 1.3 + 0.2)) * 0.3 - struck * 0.04), PROP, 1.4)));
  }
  s += columnSVG(P, cx, cy, st.col);
  if (planks <= 0 && !st.done) return s;
  const cells = shellCells(cx, cy).filter((c) => c.q < Math.ceil(planks - 1e-9));
  const list = cells.map((c) => {
    const up = facing(c.n);
    const conc = c.r <= poured;
    const formed = struck < 1 || !conc;
    let fill;
    if (conc) fill = up ? shade(P, c.n, mixAll(WET, SHELL, cured)) : shade(P, c.n.map((v) => -v), formed ? PLY : SOFFIT);
    else fill = up ? shade(P, c.n, PLY) : shade(P, c.n.map((v) => -v), PLY);
    if (lit && !up && conc && !formed) fill = mix(fill, LIT, 0.35);
    let e = poly(c.pts.map((p) => P(...p)), fill);
    if (detail >= 2 && up) {
      const [a, b, cc, d] = c.pts;
      if (!conc) {
        // The planks: straight lines along the hypar's rulings.
        e += seg(P(...lerp3(a, d, 0.5)), P(...lerp3(b, cc, 0.5)), "#b98e55", 0.6);
        if (mesh > 0 && (c.i + c.j) / (2 * K.n) < mesh) e += seg(P(...lerp3(a, b, 0.5)), P(...lerp3(d, cc, 0.5)), REBAR, 0.6) + seg(P(...lerp3(a, d, 0.5)), P(...lerp3(b, cc, 0.5)), REBAR, 0.6);
      } else if (cured >= 1 && (c.i === 0 || c.j === 0)) e += seg(P(...a), P(...(c.i === 0 ? d : b)), "#a9a499", 0.7);
    }
    return { depth: c.depth, s: e };
  });
  // The thin outer edges, where they face the viewer.
  if (planks >= 4 || st.done)
    for (const [sx, sy] of QUADS) {
      if (sx > 0) list.push({ depth: cx + K.a + cy + sy * K.a * 0.5 + K.H, s: poly([P(cx + K.a, cy, K.H), P(cx + K.a, cy + sy * K.a, K.H), P(cx + K.a, cy + sy * K.a, K.H - 0.06), P(cx + K.a, cy, K.H - 0.06)], poured >= 1 ? SHELL[1] : PLY[2]) });
      if (sy > 0) list.push({ depth: cy + K.a + cx + sx * K.a * 0.5 + K.H, s: poly([P(cx, cy + K.a, K.H), P(cx + sx * K.a, cy + K.a, K.H), P(cx + sx * K.a, cy + K.a, K.H - 0.06), P(cx, cy + K.a, K.H - 0.06)], poured >= 1 ? SHELL[2] : PLY[2]) });
    }
  return s + painted(list);
}
const PRODUCE = ["#d9483b", "#f29b38", "#79b04a", "#f2c94c", "#8e4f9e", "#c0392b"];
function stallSVG(P, cx, cy, t, lit, seed) {
  if (t <= 0) return "";
  const r = rng(seed);
  let s = box(P, cx + 0.22, cy + 0.3, cx + 0.8, cy + 0.6, 0.3, 0.62, ["#c99a62", "#ad7f48", "#8f6638"]);
  s += box(P, cx + 0.3, cy - 0.6, cx + 0.6, cy + 0.22, 0.3, 0.62, ["#c99a62", "#ad7f48", "#8f6638"]);
  const crates = Math.ceil(t * 8);
  for (let i = 0; i < crates; i++) {
    const [x, y] = i < 4 ? [cx + 0.27 + i * 0.13, cy + 0.36] : [cx + 0.36, cy - 0.55 + (i - 4) * 0.18];
    s += box(P, x, y, x + 0.11, y + 0.16, 0.62, 0.69, ["#e2c38f", "#c9a66d", "#b08d55"]);
    const [px, py] = P(x + 0.055, y + 0.08, 0.7);
    const c = PRODUCE[Math.floor(r() * PRODUCE.length)];
    for (let k = 0; k < 3; k++) s += circle(px - 2 + k * 2, py - (k % 2), 1.8, c);
  }
  if (lit) {
    const [gx, gy] = P(cx + 0.5, cy + 0.4, 0.3);
    s = ellipse(gx, gy, 26, 13, LIT, 0.35) + s;
  }
  return s;
}
function marketSVG(P, k, lit = false, detail = 2) {
  let s = "";
  // Terrazzo floor and its drains, laid from the back.
  if (k.floorFinish > 0) {
    const to = -2.2 + 4.4 * clamp(k.floorFinish);
    s += poly([P(-2.2, -2.2, 0.302), P(to, -2.2, 0.302), P(to, 2.2, 0.302), P(-2.2, 2.2, 0.302)], "#e9e3d6");
    if (detail >= 2) {
      const r = rng(5);
      for (let i = 0; i < 70; i++) {
        const x = -2.15 + r() * 4.3,
          y = -2.15 + r() * 4.3;
        if (x < to) {
          const [px, py] = P(x, y, 0.303);
          s += circle(px, py, 0.7, ["#b9b2a4", "#9c8f7b", "#cdbf9d"][i % 3]);
        }
      }
      for (const y of [-0.02, 0.02]) if (to > 2) s += seg(P(-2.2, y, 0.304), P(2.2, y, 0.304), "#8f8a80", 1);
    }
  }
  UMBRELLAS.forEach(([cx, cy], i) => {
    const st = { col: k.columns, form: k[`shellForm${i}`] || 0, pour: k[`shellPour${i}`] || 0, done: k.done };
    s += stallSVG(P, cx, cy, clamp(k.stalls * 4 - i), lit && k.openings > 0.5, 11 + i);
    s += umbrellaSVG(P, cx, cy, st, detail, lit && k.openings > 0.5);
    // Pendant lamps hung from the column heads.
    if (k.openings > 0.3)
      for (const [dx, dy] of [[0.5, 0.25], [0.25, 0.5]]) {
        const top = shellPt(cx, cy, 1, 1, dx / K.a, dy / K.a)[2];
        s += seg(P(cx + dx, cy + dy, top), P(cx + dx, cy + dy, 1.05), "#3c4146", 0.7);
        const [lx, ly] = P(cx + dx, cy + dy, 1.02);
        s += ellipse(lx, ly, 3.2, 1.8, lit ? LIT : "#3c4146");
      }
  });
  // The sign on the front edge.
  if (k.openings > 0.6) {
    const [x0, y0] = P(1.25, 1 + K.a + 0.01, K.H - 0.08),
      [x1, y1] = P(1.75, 1 + K.a + 0.01, K.H - 0.38);
    s += poly([P(1.2, 1 + K.a + 0.01, K.H - 0.07), P(1.8, 1 + K.a + 0.01, K.H - 0.07), P(1.8, 1 + K.a + 0.01, K.H - 0.33), P(1.2, 1 + K.a + 0.01, K.H - 0.33)], "#c0533e");
    s += `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${((y0 + y1) / 2 + 3).toFixed(1)}" font-size="7" font-weight="700" fill="#fff6e6" text-anchor="middle" font-family="DM Sans, sans-serif" transform="rotate(${P.mirror ? -26.6 : 26.6} ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)})">PAZAR</text>`;
  }
  return s;
}
const MARKET_DONE = { columns: 1, done: true, floorFinish: 1, stalls: 1, openings: 1 };
export const SHELL_MARKET = {
  system: "shell",
  ridge: K.H - 1.6 + 0.05,
  spec: () => ({ hw: 2, h: 1.3, floors: 1, wall: { faces: SHELL, grain: "#a9a499", pattern: "shell" }, roof: SHELL }),
  steps: [
    { key: "columns", label: "Kolonlar: içinden yağmur borusu geçen betonarme", w: 1.3, cost: 4, lift: true, liftAs: "colRebar", pour: true },
    ...[0, 1, 2, 3].flatMap((i) => [
      { key: "shellForm", floor: i, label: `${i + 1}. şemsiye: iskele, düz tahta kalıp ve hasır donatı`, w: 1, cost: 4, lift: true, liftAs: "footForm", inspect: `${i + 1}. şemsiyenin kabuk donatısı ve 4 cm pas payı takozları`, next: "kabuk betonu dökülebilir" },
      { key: "shellPour", floor: i, label: `${i + 1}. şemsiye: 4 cm kabuk betonu, kür ve kalıp sökümü`, w: 1, cost: 4, pour: true },
    ]),
  ],
  frameEnd: 0.66,
  later: [
    { key: "floorFinish", label: "Zemin: terrazzo ve yer süzgeçleri", a: 0.66, b: 0.74, cost: 4 },
    { key: "stalls", label: "Tezgâhlar ve sebze meyve kasaları", a: 0.74, b: 0.86, cost: 5 },
    { key: "openings", label: "Sarkıt lambalar ve tabela", a: 0.86, b: 0.93, cost: 3 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  liftUntil: 0.66,
  craneEnd: 0.66,
  scene: (P, sp, plan, shown, lit) => marketSVG(P, progress(plan, shown), lit),
  shadow: (P, sp, t) => castShadow(P, rectOutline(-2, -2, 2, 2), K.H * 0.42 * t + 0.2),
  shadowFrom: "shellPour",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    let s = detail ? castShadow(shadowP, rectOutline(-2, -2, 2, 2), K.H * 0.42 + 0.2) + box(P, -2.2, -2.2, 2.2, 2.2, 0, 0.3, CONCRETE) : "";
    return s + marketSVG(P, MARKET_DONE, lit, detail);
  },
  snow(P) {
    let s = "";
    for (const [cx, cy] of UMBRELLAS) for (const [sx, sy] of QUADS) s += poly([shellPt(cx, cy, sx, sy, 0.55, 0.55), shellPt(cx, cy, sx, sy, 1, 0.55), shellPt(cx, cy, sx, sy, 1, 1), shellPt(cx, cy, sx, sy, 0.55, 1)].map((p) => P(...p)), "#f4f7fa", 0.9);
    return s;
  },
  workHeight(sp, p) {
    if (p.key === "columns") return K.h0;
    if (p.key === "shellForm" || p.key === "shellPour") return K.H + 0.2;
    return null;
  },
  chute: () => [0, -2.3, 0.85],
  crew(sp, p, k) {
    if (p.key === "columns") return [at(-0.6, -0.55, 0.3, k < 0.4 ? "tie" : k < 0.7 ? "hammer" : "hose"), at(0.6, 1.4, 0.3, "carry")];
    if (p.key === "shellForm" || p.key === "shellPour") {
      const [cx, cy] = UMBRELLAS[p.floor],
        u = p.key === "shellPour" ? Math.min(0.9, 0.2 + k) : 0.6,
        [x, y, z] = shellPt(cx, cy, 1, 1, u, 0.45);
      return [at(x, y, z, p.key === "shellPour" ? (k < 0.6 ? "hose" : "trowel") : k < 0.75 ? "hammer" : "tie"), at(cx + 0.4, cy + 1.25, 0.3, "carry")];
    }
    if (p.key === "floorFinish") return [at(-2 + 4 * k, 0.4, 0.3, "trowel"), at(-2 + 4 * k, -0.6, 0.3, "roller")];
    if (p.key === "stalls") return [at(0.4, 1.6, 0.3, "carry"), at(-1.3, 1.5, 0.3, "hammer")];
    return null;
  },
  // Columns 26 × 26; shells 4 cm thick, thickened about a third at the
  // valleys and edges; mesh about 3 kg/m² in two layers.
  metraj(sp, p, k) {
    if (p.key === "columns") {
      const vol = 4 * 0.26 * 0.26 * (K.h0 - 0.3) * V;
      return { concrete: k * vol, rebar: k * vol * 0.18 };
    }
    if (p.key === "shellForm") return { rebar: (k * SHELL_AREA * 3) / 1000 };
    if (p.key === "shellPour") return { concrete: k * SHELL_AREA * 0.04 * 1.35, shell: k * SHELL_AREA };
    return null;
  },
  items: (q, num) => (q.shell > 0 ? `Kabuk ${Math.round(q.shell)} m² × 4 cm` : `Donatı ${num(q.rebar, 2)} t`),
};

// =====================================================================
// Gergi çadır amfi: concrete seating tiers in a fan round a stage, under a
// four-point PTFE sail: two tall masts, two low ones, a saddle surface
// pulled into shape by edge cables and prestressed from its corner plates.
// =====================================================================
const C = [0.85, 0.85],
  TIERS = 5,
  T0 = 0.95,
  TD = 0.36,
  TH = 0.14,
  ARC = [(165 * Math.PI) / 180, (285 * Math.PI) / 180];
const tierZ = (i) => TH * (i + 1);
const polar = (r, a, z) => [C[0] + r * Math.cos(a), C[1] + r * Math.sin(a), z];
const SAIL = ["#fbfaf6", "#e9e6de", "#cfcbc0"],
  UNDER = ["#f1ebde", "#dcd4c4", "#c2baa8"],
  SEAT = ["#cfcac0", "#b5b0a6", "#9b968c"];
// The sail's corners: back low, right high, front low, left high.
const CORNERS = { L1: [-1.45, -1.45, 2.0], H2: [1.7, -1.85, 3.45], L2: [1.85, 1.85, 2.15], H1: [-1.85, 1.7, 3.45] };
const MASTS = [
  { at: CORNERS.H1, out: unit([-1, 0.6, 0]) },
  { at: CORNERS.H2, out: unit([0.6, -1, 0]) },
  { at: CORNERS.L1, out: unit([-1, -1, 0]) },
  { at: CORNERS.L2, out: unit([1, 1, 0]) },
];
const SAG = 0.24;
const centre = [0, 1, 2].map((i) => (CORNERS.L1[i] + CORNERS.H2[i] + CORNERS.L2[i] + CORNERS.H1[i]) / 4);
// An edge cable from a to b, pulled in towards the middle of the sail.
function edge(a, b, t) {
  const m = lerp3(a, b, 0.5),
    d = unit([centre[0] - m[0], centre[1] - m[1], 0]),
    w = 4 * t * (1 - t) * SAG;
  return lerp3(a, b, t).map((v, i) => v + d[i] * w);
}
// The sail as a Coons patch between its four edge cables, sagging until it
// is prestressed.
function sailPt(u, v, slack = 0) {
  const { L1, H2, L2, H1 } = CORNERS;
  const c0 = edge(L1, H2, u),
    c1 = edge(H1, L2, u),
    d0 = edge(L1, H1, v),
    d1 = edge(H2, L2, v);
  const p = [0, 1, 2].map((i) => (1 - v) * c0[i] + v * c1[i] + (1 - u) * d0[i] + u * d1[i] - ((1 - u) * (1 - v) * L1[i] + u * (1 - v) * H2[i] + (1 - u) * v * H1[i] + u * v * L2[i]));
  p[2] -= slack * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
  return p;
}
const SN = 12;
function sailCells(slack = 0, open = 1) {
  const folded = [C[0] - 0.2, C[1] - 0.2, 0.55];
  const pt = (u, v) => (open >= 1 ? sailPt(u, v, slack) : lerp3(lerp3(folded, sailPt(u, v, slack), 0.08), sailPt(u, v, slack), ease(open)));
  const list = [];
  for (let i = 0; i < SN; i++) for (let j = 0; j < SN; j++) list.push({ ...cell(pt(i / SN, j / SN), pt((i + 1) / SN, j / SN), pt((i + 1) / SN, (j + 1) / SN), pt(i / SN, (j + 1) / SN)), i, j });
  return list;
}
const SAIL_AREA = sailCells().reduce((n, c) => n + areaOf(c), 0) * M * M;
function sectorTop(P, r0, r1, z, fill, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(P(...polar(r0, ARC[0] + ((ARC[1] - ARC[0]) * i) / n, z)));
  for (let i = n; i >= 0; i--) pts.push(P(...polar(r1, ARC[0] + ((ARC[1] - ARC[0]) * i) / n, z)));
  return poly(pts, fill);
}
// The inner face of a tier (it faces the stage, and the viewer).
function riser(P, r, z0, z1, faces, n = 14) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a0 = ARC[0] + ((ARC[1] - ARC[0]) * i) / n,
      a1 = ARC[0] + ((ARC[1] - ARC[0]) * (i + 1)) / n,
      am = (a0 + a1) / 2,
      nn = [-Math.cos(am), -Math.sin(am), 0];
    if (!facing(nn)) continue;
    s += poly([P(...polar(r, a0, z0)), P(...polar(r, a1, z0)), P(...polar(r, a1, z1)), P(...polar(r, a0, z1))], shade(P, nn, faces));
  }
  return s;
}
function tiersSVG(P, built, wet, seats, detail) {
  let s = "";
  for (let i = TIERS - 1; i >= 0; i--) {
    if (i >= built) continue;
    const faces = i === built - 1 && wet < 1 ? mixAll(WET, SEAT, wet) : SEAT,
      r0 = T0 + i * TD,
      r1 = r0 + TD,
      z = tierZ(i);
    s += sectorTop(P, r0, r1, z, shade(P, [0, 0, 1], faces));
    // The two ends of the fan.
    s += poly([P(...polar(r0, ARC[0], 0)), P(...polar(r1, ARC[0], 0)), P(...polar(r1, ARC[0], z)), P(...polar(r0, ARC[0], z))], shade(P, [Math.sin(ARC[0]), -Math.cos(ARC[0]), 0], faces));
    s += poly([P(...polar(r0, ARC[1], 0)), P(...polar(r1, ARC[1], 0)), P(...polar(r1, ARC[1], z)), P(...polar(r0, ARC[1], z))], shade(P, [-Math.sin(ARC[1]), Math.cos(ARC[1]), 0], faces));
    s += riser(P, r0, 0, z, faces);
    // Timber seat boards along the front of each tier.
    if (seats > i / TIERS) {
      s += sectorTop(P, r0 + 0.03, r0 + 0.16, z + 0.05, "#c99a62") + riser(P, r0 + 0.03, z, z + 0.05, ["#c99a62", "#ad7f48", "#8f6638"]);
      if (detail >= 2) for (let a = ARC[0] + 0.12; a < ARC[1]; a += 0.18) s += seg(P(...polar(r0 + 0.03, a, z + 0.05)), P(...polar(r0 + 0.16, a, z + 0.05)), "#8f6638", 0.6);
    }
  }
  return s;
}
function stageSVG(P, base, deck, lit) {
  if (base <= 0) return "";
  const r = 0.72,
    n = 28,
    h = 0.18;
  let s = "";
  const top = deck > 0 ? ["#b9874f", "#a07040", "#86592f"] : SEAT;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2,
      a1 = ((i + 1) / n) * Math.PI * 2,
      nn = [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0];
    if (facing(nn)) s += poly([P(C[0] + r * Math.cos(a0), C[1] + r * Math.sin(a0), 0), P(C[0] + r * Math.cos(a1), C[1] + r * Math.sin(a1), 0), P(C[0] + r * Math.cos(a1), C[1] + r * Math.sin(a1), h), P(C[0] + r * Math.cos(a0), C[1] + r * Math.sin(a0), h)], shade(P, nn, SEAT));
  }
  s += poly(Array.from({ length: n }, (_, i) => P(C[0] + r * Math.cos((i / n) * Math.PI * 2), C[1] + r * Math.sin((i / n) * Math.PI * 2), h)), shade(P, [0, 0, 1], top));
  if (deck > 0)
    for (let x = -r + 0.12; x < r; x += 0.12) {
      const w = Math.sqrt(r * r - x * x);
      s += seg(P(C[0] + x - 0.0, C[1] - w, h + 0.002), P(C[0] + x, C[1] + w, h + 0.002), "#86592f", 0.5, 0.8);
    }
  if (lit) {
    const [x, y] = P(C[0], C[1], h);
    s += ellipse(x, y, 30, 15, LIT, 0.4);
  }
  return s;
}
function mastSVG(P, m, t, lit, light) {
  if (t <= 0) return "";
  const [x, y, z] = m.at,
    len = z + 0.3,
    a = (Math.PI / 2) * ease(t);
  // Assembled lying on the ground pointing outwards, then rotated up.
  const top = [x + m.out[0] * len * Math.cos(a), y + m.out[1] * len * Math.cos(a), len * Math.sin(a)];
  let s = seg(P(x, y, 0), P(...top), TUBE, 3.2) + seg(P(x, y, 0), P(...top), "#8b97a3", 1);
  if (t >= 1 && light) {
    const [lx, ly] = P(x, y, z - 0.35);
    s += circle(lx, ly, 2.4, lit ? LIT : "#3c4146");
  }
  return s;
}
const anchorsOf = (m) => {
  const [x, y] = m.at,
    side = [-m.out[1], m.out[0]];
  return [-0.45, 0.45].map((d) => [x + m.out[0] * 0.75 + side[0] * d, y + m.out[1] * 0.75 + side[1] * d]);
};
function amphiSVG(P, k, lit = false, detail = 2) {
  let s = "";
  // The cut for the tiers.
  if (k.excavate > 0 && k.tiers < 1) {
    const r1 = T0 + (TIERS * TD + 0.1) * clamp(k.excavate);
    s += sectorTop(P, T0 - 0.15, Math.max(T0 - 0.1, r1), 0.006, "#9a7b55");
  }
  s += tiersSVG(P, Math.ceil(clamp(k.tiers) * TIERS - 1e-9), (clamp(k.tiers) * TIERS) % 1 || 1, clamp(k.seats), detail);
  // Anchor blocks for the masts and their backstays.
  const anchors = clamp(k.anchors);
  MASTS.forEach((m, i) => {
    if (anchors * 4 > i) {
      s += box(P, m.at[0] - 0.14, m.at[1] - 0.14, m.at[0] + 0.14, m.at[1] + 0.14, 0, 0.1, CONCRETE);
      for (const [ax, ay] of anchorsOf(m)) s += box(P, ax - 0.1, ay - 0.1, ax + 0.1, ay + 0.1, 0, 0.07, CONCRETE);
    }
  });
  s += stageSVG(P, k.tiers >= 1 ? 1 : 0, clamp(k.stage), lit && k.lights > 0.5);
  // Masts go up one by one; then backstays and edge cables.
  const masts = clamp(k.masts) * 4;
  const back = MASTS.filter((m) => m.at[0] + m.at[1] < 0),
    front = MASTS.filter((m) => m.at[0] + m.at[1] >= 0);
  const mastsOf = (list) => list.map((m) => mastSVG(P, m, clamp(masts - MASTS.indexOf(m)), lit, k.lights > 0.5)).join("");
  const stays = (list) => {
    if (k.cables <= 0) return "";
    let t = "";
    for (const m of list) for (const [ax, ay] of anchorsOf(m)) t += seg(P(ax, ay, 0.07), P(m.at[0], m.at[1], m.at[2] + 0.3 * clamp(k.cables * 2)), "#3c4146", 0.9);
    return t;
  };
  s += mastsOf(back) + stays(back);
  const open = clamp(k.membrane),
    slack = 0.45 * (1 - clamp(k.tension));
  if (open > 0) {
    const cells = sailCells(slack, open);
    const glow = lit && k.lights > 0.5;
    s += painted(
      cells.map((c) => {
        const up = facing(c.n);
        let fill = up ? shade(P, c.n, SAIL) : shade(P, c.n.map((v) => -v), UNDER);
        if (glow) fill = mix(fill, LIT, up ? 0.12 : 0.4);
        let e = poly(c.pts.map((p) => P(...p)), fill);
        // Seams of the cloth panels; folds until it is tensioned.
        if (detail >= 2 && c.j % 3 === 0) e += seg(P(...c.pts[0]), P(...c.pts[1]), up ? "#d9d5cb" : "#c4bca9", 0.6);
        if (slack > 0.05 && (c.i + c.j) % 4 === 0) e += seg(P(...c.pts[0]), P(...c.pts[2]), "#a9a497", 0.8, slack * 1.8);
        return { depth: c.depth, s: e };
      }),
    );
  }
  // Edge cables, drawn round the sail once it is up.
  if (k.cables > 0) {
    const reach = clamp(k.cables);
    for (const [a, b] of [["L1", "H2"], ["H2", "L2"], ["L2", "H1"], ["H1", "L1"]]) {
      const pts = Array.from({ length: 13 }, (_, i) => (open > 0 ? sailEdge(a, b, i / 12, slack, open) : edge(CORNERS[a], CORNERS[b], i / 12)));
      for (let i = 1; i < pts.length && i / 12 <= reach; i++) s += seg(P(...pts[i - 1]), P(...pts[i]), "#3c4146", 1.1);
    }
  }
  s += mastsOf(front) + stays(front);
  return s;
}
// The sail's edge as it hangs at this stage (same sag and unfolding as the cells).
function sailEdge(a, b, t, slack, open) {
  const uv = { L1: [0, 0], H2: [1, 0], L2: [1, 1], H1: [0, 1] };
  const [u, v] = lerp3([...uv[a], 0], [...uv[b], 0], t);
  const folded = [C[0] - 0.2, C[1] - 0.2, 0.55];
  const p = sailPt(u, v, slack);
  return open >= 1 ? p : lerp3(lerp3(folded, p, 0.08), p, ease(open));
}
const AMPHI_DONE = { excavate: 1, tiers: 1, anchors: 1, masts: 1, cables: 1, membrane: 1, tension: 1, seats: 1, stage: 1, lights: 1 };
export const TENSILE = {
  system: "tensile",
  ridge: 3.75 - 1.9,
  spec: () => ({ hw: 2, h: 1.6, floors: 1, wall: { faces: SAIL, grain: "#d9d5cb", pattern: "membrane" }, roof: SAIL }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "excavate", label: "Kazı: oturma kademelerine göre şev", w: 0.9, cost: 3 },
    { key: "tiers", label: "Oturma kademeleri ve sahne: betonarme", w: 1.6, cost: 7, pour: true },
    { key: "anchors", label: "Direk temelleri ve zemin ankrajları", w: 1, cost: 3, pour: true, inspect: "ankraj çekme testi: 1,5 × tasarım yükü", next: "direkler dikilebilir" },
    { key: "masts", label: "Çelik direkler: yerde kurulup vinçle dikiliyor", w: 1.2, cost: 5, lift: true, liftAs: "steelCol" },
    { key: "cables", label: "Gergi halatları ve kenar kabloları", w: 0.9, cost: 3 },
    { key: "membrane", label: "PTFE membran: paketten açılıp köşelere bağlanıyor", w: 1.1, cost: 7, lift: true, liftAs: "panels" },
    { key: "tension", label: "Ön germe: köşe plakalarından krikoyla", w: 0.8, cost: 2, inspect: "membran ön gerilmesi ve kablo kuvvetleri", next: "seyirci alınabilir" },
  ],
  frameEnd: 0.68,
  later: [
    { key: "seats", label: "Ahşap oturma tahtaları", a: 0.68, b: 0.78, cost: 4 },
    { key: "stage", label: "Sahne döşemesi", a: 0.78, b: 0.86, cost: 3 },
    { key: "lights", label: "Direk projektörleri ve membranı yıkayan ışıklar", a: 0.86, b: 0.93, cost: 3 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  liftUntil: 0.6,
  craneEnd: 0.6,
  garden: false,
  scene: (P, sp, plan, shown, lit) => amphiSVG(P, progress(plan, shown), lit),
  shadow: (P, sp, t) => castShadow(P, [CORNERS.L1, CORNERS.H2, CORNERS.L2, CORNERS.H1].map(([x, y]) => [x, y]), 1.2 * t + 0.2),
  shadowFrom: "membrane",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, [CORNERS.L1, CORNERS.H2, CORNERS.L2, CORNERS.H1].map(([x, y]) => [x, y]), 1.4) : "";
    return s + amphiSVG(P, AMPHI_DONE, lit, detail);
  },
  snow: (P) => painted(sailCells().filter((c) => facing(c.n) && c.n[2] > 0.75).map((c) => ({ depth: c.depth, s: poly(c.pts.map((p) => P(p[0], p[1], p[2] + 0.01)), "#f4f7fa", 0.9) }))),
  workHeight(sp, p, k) {
    if (p.key === "masts") return 2.2 * ease(clamp(k * 4 - Math.floor(k * 4))) + 0.3;
    if (p.key === "membrane") return 0.6 + 2.6 * ease(k);
    if (p.key === "tiers") return 0.6;
    return null;
  },
  chute: () => [0.2, -2.2, 0.6],
  crew(sp, p, k) {
    const m = MASTS[Math.min(3, Math.floor(clamp(k) * 4))];
    return (
      {
        excavate: [at(-0.6, -0.4, 0, "shovel"), at(0.6, -0.9, 0, "shovel")],
        tiers: [at(...polar(T0 + 0.2, 225 * (Math.PI / 180), 0).slice(0, 2), 0, "hose"), at(...polar(T0 + 0.2, 200 * (Math.PI / 180), 0).slice(0, 2), 0, "trowel")],
        anchors: [at(m.at[0] + 0.3, m.at[1] + 0.3, 0, "tie"), at(1.8, 0.2, 0, "survey")],
        masts: [at(m.at[0] + 0.35, m.at[1] + 0.35, 0, "carry"), at(1.9, 0.3, 0, "survey")],
        cables: [at(m.at[0] + 0.3, m.at[1] + 0.3, 0, "tie"), at(1.8, -0.3, 0, "carry")],
        membrane: [at(0.4, 1.9, 0, "carry"), at(-0.1, 1.9, 0, "carry")],
        tension: [at(CORNERS.H1[0] + 0.3, CORNERS.H1[1] + 0.3, 0, "bar"), at(CORNERS.H2[0] + 0.3, CORNERS.H2[1] + 0.3, 0, "survey")],
        seats: [at(...polar(T0 + 0.1 + clamp(k) * TIERS * TD, 210 * (Math.PI / 180), 0).slice(0, 2), tierZ(Math.min(4, Math.floor(clamp(k) * 5))), "hammer")],
        stage: [at(C[0] + 0.2, C[1] + 0.1, 0.18, "hammer"), at(C[0] - 0.3, C[1] + 0.3, 0.18, "carry")],
      }[p.key] || null
    );
  },
  // Tiers 15 cm slabs with risers; two masts Ø273 (about 60 kg/m), two
  // shorter ones; backstays and edge cables about 3 kg/m.
  metraj(sp, p, k) {
    if (p.key === "tiers") {
      let area = 0;
      for (let i = 0; i < TIERS; i++) area += ((ARC[1] - ARC[0]) / 2) * ((T0 + (i + 1) * TD) ** 2 - (T0 + i * TD) ** 2) + (ARC[1] - ARC[0]) * (T0 + i * TD) * TH;
      const vol = area * M * M * 0.15 + Math.PI * 0.72 ** 2 * 0.18 * V;
      return { concrete: k * vol, rebar: k * vol * 0.08 };
    }
    if (p.key === "anchors") return { concrete: k * (4 * 0.28 * 0.28 * 0.6 + 8 * 0.2 * 0.2 * 0.5) * V };
    if (p.key === "masts") return { steel: (k * MASTS.reduce((n, m) => n + (m.at[2] + 0.3) * M * 60, 0)) / 1000 };
    if (p.key === "cables") {
      let len = 0;
      for (const m of MASTS) for (const [ax, ay] of anchorsOf(m)) len += Math.hypot(m.at[0] - ax, m.at[1] - ay, m.at[2]);
      return { steel: (k * (len + 4 * 3.5) * M * 3) / 1000 };
    }
    if (p.key === "membrane") return { membrane: k * SAIL_AREA };
    return null;
  },
  items: (q, num) => (q.membrane > 0 ? `Membran ${Math.round(q.membrane)} m²` : q.steel > 0 ? `Çelik ${num(q.steel, 2)} t` : `Donatı ${num(q.rebar, 2)} t`),
};

// =====================================================================
// Konsol ev: a concrete core on a raft that doubles as counterweight, and
// a glass box on top that reaches 4.8 m past it on two storey-high steel
// trusses in its long walls. The diagonals lean one way over the back span
// and the other way over the cantilever, so each one works in tension; the
// back end is tied down into the raft.
// =====================================================================
const X = { x0: -2.0, x1: 2.45, y: 0.78, z0: 1.65, z1: 3.0, core: [-1.95, -0.35], cy: 0.7, panels: 9 };
const panelX = (i) => X.x0 + ((X.x1 - X.x0) * i) / X.panels;
const ZINC = ["#5d6670", "#4b535c", "#3c434b"],
  BOARD = ["#d7d3cb", "#bdb8ae", "#a29d93"];
// Truss members in one wall, as [x0, z0, x1, z1].
function trussMembers() {
  const list = [];
  for (let i = 0; i < X.panels; i++) {
    const a = panelX(i),
      b = panelX(i + 1),
      back = b <= X.core[1] + 0.01;
    list.push([a, X.z0, b, X.z0], [a, X.z1, b, X.z1], [a, X.z0, a, X.z1]);
    list.push(back ? [a, X.z0, b, X.z1] : [a, X.z1, b, X.z0]);
  }
  list.push([X.x1, X.z0, X.x1, X.z1]);
  return list;
}
const TRUSS = trussMembers();
const PROPS = [0.45, 1.25, 2.05];
function coreSVG(P, k, lit, detail) {
  let s = "";
  const [c0, c1] = X.core;
  // Pit, then the raft that holds the back of the box down.
  if (k.pit > 0 && k.raft < 1) {
    const d = 0.45 * clamp(k.pit);
    s += poly([P(c0 - 0.15, -0.95, 0.005), P(c1 + 0.15, -0.95, 0.005), P(c1 + 0.15, 0.95, 0.005), P(c0 - 0.15, 0.95, 0.005)], "#7d6142");
    s += poly([P(c0 - 0.15, -0.95, -d), P(c1 + 0.15, -0.95, -d), P(c1 + 0.15, 0.95, -d), P(c0 - 0.15, 0.95, -d)], "#94744f");
  }
  if (k.raftRebar > 0 && k.raft < 0.5) {
    for (let x = c0; x < c0 + (c1 - c0 + 0.1) * clamp(k.raftRebar); x += 0.14) s += seg(P(x, -0.85, -0.2), P(x, 0.85, -0.2), REBAR, 0.8);
    // Hold-down bars standing up out of the raft at the back.
    if (k.raftRebar > 0.6) for (const y of [-0.6, -0.2, 0.2, 0.6]) s += seg(P(c0 + 0.1, y, -0.2), P(c0 + 0.1, y, 0.75), REBAR, 1.2);
  }
  if (k.raft > 0) s += box(P, c0 - 0.1, -0.88, c1 + 0.1, 0.88, -0.45, -0.45 + 0.75 * clamp(k.raft / 0.6), mixAll(WET, CONCRETE, clamp((k.raft - 0.6) / 0.4)));
  // Core walls: rebar and forms, then concrete.
  if (k.coreWall > 0 && k.corePour < 0.9) {
    const top = 0.3 + (X.z0 - 0.3) * clamp(k.coreWall / 0.5);
    for (let x = c0; x <= c1; x += 0.2) s += seg(P(x, X.cy, 0.3), P(x, X.cy, top), REBAR, 0.8);
    for (let y = -X.cy; y <= X.cy; y += 0.2) s += seg(P(c1, y, 0.3), P(c1, y, top), REBAR, 0.8);
    if (k.coreWall > 0.5) s += box(P, c0 - 0.03, -X.cy - 0.03, c1 + 0.03, X.cy + 0.03, 0.3, 0.3 + (X.z0 - 0.3) * clamp((k.coreWall - 0.5) / 0.5), PLY);
  }
  if (k.corePour > 0.9 || k.done) {
    const faces = mixAll(WET, BOARD, k.done ? 1 : clamp((k.corePour - 0.9) / 0.1));
    s += box(P, c0, -X.cy, c1, X.cy, 0.3, X.z0, faces);
    if (detail >= 2) for (let z = 0.45; z < X.z0; z += 0.15) s += seg(P(c0, X.cy + 0.003, z), P(c1, X.cy + 0.003, z), "#a8a397", 0.5, 0.7) + seg(P(c1 + 0.003, -X.cy, z), P(c1 + 0.003, X.cy, z), "#9a958a", 0.5, 0.7);
    if (k.openings > 0.3) {
      s += poly(faceY(P, X.cy + 0.01, -1.15, -0.75, 0.3, 1.3), lit ? LIT : "#3a3f45");
      s += poly(faceX(P, c1 + 0.01, -0.35, 0.35, 0.75, 1.35), lit ? LIT : GLASS);
    }
  }
  return s;
}
function propsSVG(P, k) {
  if (k.props <= 0 || k.release >= 1) return "";
  const drop = 0.04 * clamp(k.release / 0.6),
    gone = clamp((k.release - 0.6) / 0.4);
  let s = "";
  PROPS.forEach((x, i) => {
    if (k.props * 3 <= i || gone * 3 > 2 - i) return;
    for (const y of [-0.55, 0.55]) {
      s += seg(P(x - 0.12, y, 0.02), P(x - 0.12, y, X.z0 - drop), PROP, 1.3) + seg(P(x + 0.12, y, 0.02), P(x + 0.12, y, X.z0 - drop), PROP, 1.3);
      for (let z = 0.1; z < X.z0 - 0.3; z += 0.4) s += seg(P(x - 0.12, y, z), P(x + 0.12, y, z + 0.4), PROP, 0.7);
    }
    s += seg(P(x - 0.12, -0.55, X.z0 - drop), P(x - 0.12, 0.55, X.z0 - drop), "#c9a227", 2);
  });
  return s;
}
function boxSVG(P, k, lit, detail) {
  let s = "";
  const reach = X.x0 + (X.x1 - X.x0) * clamp(k.truss);
  // Floor slab over the trapezoidal deck, poured from the core outwards.
  if (k.deck > 0) {
    const to = X.x0 + (X.x1 - X.x0) * clamp(k.deck / 0.7);
    s += box(P, X.x0, -X.y, to, X.y, X.z0 - 0.04, X.z0 + 0.06, mixAll(WET, CONCRETE, clamp((k.deck - 0.7) / 0.3)));
  }
  // Back wall's truss, seen through the box until the roof is on.
  const member = (y, w, color) => TRUSS.filter(([a, , b]) => Math.max(a, b) <= reach + 1e-6).map(([a, z0, b, z1]) => seg(P(a, y, z0), P(b, y, z1), color, w)).join("");
  if (!(k.cladding >= 1) && k.truss > 0) s += member(-X.y, 2, STEEL[2]);
  // Cross beams under the roof.
  if (k.truss > 0 && !(k.cladding > 0.5)) for (let i = 0; i <= X.panels; i++) if (panelX(i) <= reach) s += seg(P(panelX(i), -X.y, X.z1), P(panelX(i), X.y, X.z1), STEEL[1], 1.4);
  // Glass on the long wall and the end, panel by panel from the core out.
  const glass = clamp(k.glazing),
    pane = lit ? LIT : GLASS;
  if (glass > 0) {
    const to = X.x0 + (X.x1 - X.x0) * glass;
    s += poly(faceY(P, X.y, X.x0, to, X.z0 + 0.06, X.z1), pane);
    if (glass >= 1) s += poly(faceX(P, X.x1, -X.y, X.y, X.z0 + 0.06, X.z1), lit ? LIT : mix(GLASS, "#7d8fb0", 0.25));
    if (detail >= 2 && !lit) s += poly([P(X.x0 + 0.3, X.y + 0.002, X.z1 - 0.05), P(Math.min(to, X.x0 + 1.4), X.y + 0.002, X.z1 - 0.05), P(Math.min(to, X.x0 + 0.9), X.y + 0.002, X.z0 + 0.4)], "#ffffff", 0.08);
  }
  // The front wall's truss, in front of the glass.
  if (k.truss > 0) s += member(X.y + 0.01, 2.6, STEEL[2]) + member(X.y + 0.012, 0.8, "#8b97a3");
  if (glass >= 1) s += seg(P(X.x1, -X.y, X.z0 + 0.06), P(X.x1, -X.y, X.z1), STEEL[2], 2.4) + seg(P(X.x1, 0, X.z0 + 0.06), P(X.x1, 0, X.z1), STEEL[2], 1.2);
  // Zinc roof and the slab edge band, from the back.
  if (k.cladding > 0) {
    const to = X.x0 + (X.x1 - X.x0) * clamp(k.cladding);
    s += poly([P(X.x0 - 0.05, -X.y - 0.05, X.z1 + 0.08), P(to + 0.05, -X.y - 0.05, X.z1 + 0.08), P(to + 0.05, X.y + 0.05, X.z1 + 0.08), P(X.x0 - 0.05, X.y + 0.05, X.z1 + 0.08)], ZINC[0]);
    s += poly(faceY(P, X.y + 0.05, X.x0 - 0.05, to + 0.05, X.z1, X.z1 + 0.08), ZINC[1]);
    if (detail >= 2) for (let x = X.x0 + 0.15; x < to; x += 0.15) s += seg(P(x, -X.y - 0.05, X.z1 + 0.081), P(x, X.y + 0.05, X.z1 + 0.081), "#6c7680", 0.6);
    if (k.cladding >= 1) {
      s += poly(faceX(P, X.x1 + 0.05, -X.y - 0.05, X.y + 0.05, X.z1, X.z1 + 0.08), ZINC[2]);
      s += poly(faceY(P, X.y + 0.05, X.x0 - 0.05, X.x1 + 0.05, X.z0 - 0.08, X.z0 + 0.06), ZINC[1]) + poly(faceX(P, X.x1 + 0.05, -X.y - 0.05, X.y + 0.05, X.z0 - 0.08, X.z0 + 0.06), ZINC[2]);
    }
  }
  return s;
}
function cantileverSVG(P, k, lit = false, detail = 2) {
  let s = coreSVG(P, k, lit, detail) + propsSVG(P, k);
  // The swing hung from the tip's underside, its shadow on the grass.
  if (k.swing > 0.4) {
    const x = 1.7,
      seat = 0.55;
    for (const y of [-0.2, 0.2]) s += seg(P(x, y, X.z0 - 0.08), P(x, y, seat), "#6b5a45", 0.8);
    s += box(P, x - 0.1, -0.24, x + 0.1, 0.24, seat - 0.04, seat, ["#c99a62", "#ad7f48", "#8f6638"]);
  }
  return s + boxSVG(P, k, lit, detail);
}
const CANT_DONE = { pit: 1, raftRebar: 1, raft: 1, coreWall: 1, corePour: 1, props: 1, truss: 1, deck: 1, release: 1, glazing: 1, cladding: 1, openings: 1, swing: 1, done: true };
// The tip deflection the inspector checks once the props come down.
export const TIP = { calc: 18, measured: 16 };
export const CANTILEVER = {
  system: "cantilever",
  ridge: X.z1 - 1.6 + 0.1,
  spec: () => ({ hw: 2, h: 1.6, floors: 2, wall: { faces: BOARD, grain: "#a8a397", pattern: "cantilever" }, roof: ZINC }),
  ground: ["mobilize", "layout"],
  steps: [
    { key: "pit", label: "Kazı: çekirdek ve karşı ağırlık radyesi", w: 0.8, cost: 3 },
    { key: "raftRebar", label: "Radye donatısı ve çekme ankraj filizleri", w: 1, cost: 5, lift: true, liftAs: "footRebar", inspect: "radye donatısı ve arka uçtaki çekme ankrajları", next: "beton dökülebilir" },
    { key: "raft", label: "Karşı ağırlık radyesi: beton", w: 1, cost: 5, pour: true },
    { key: "coreWall", label: "Çekirdek perdeleri: donatı ve kalıp", w: 1, cost: 4, lift: true, liftAs: "colForm", inspect: "perde donatısı ve kafes kiriş bağlantı plakaları", next: "beton dökülebilir" },
    { key: "corePour", label: "Çekirdek perdeleri: beton", w: 0.9, cost: 3, pour: true },
    { key: "props", label: "Geçici iskele kuleleri: konsol ucuna kadar", w: 0.8, cost: 2, lift: true, liftAs: "shore" },
    { key: "truss", label: "Kat yüksekliğinde çelik kafes kirişler: arkadan uca", w: 1.7, cost: 9, lift: true, liftAs: "steelBeam" },
    { key: "deck", label: "Trapez sac üstüne döşeme betonu", w: 0.9, cost: 4, pour: true },
    { key: "release", label: "İskele indirme: konsol kendini taşıyor", w: 0.7, cost: 1, inspect: `uç sehimi: hesap ${TIP.calc} mm, ölçülen ${TIP.measured} mm`, next: "cepheye geçilebilir" },
  ],
  frameEnd: 0.64,
  later: [
    { key: "glazing", label: "Cam giydirme cephe: çekirdekten uca", a: 0.64, b: 0.74, cost: 8, lift: true },
    { key: "cladding", label: "Çatı ve döşeme alnı: çinko kaplama", a: 0.74, b: 0.82, cost: 4 },
    { key: "openings", label: "Giriş kapısı ve çekirdek penceresi", a: 0.82, b: 0.88, cost: 3 },
    { key: "swing", label: "Konsolun altına salıncak", a: 0.88, b: 0.93, cost: 1 },
    { key: "handover", label: "Peyzaj ve teslim", a: 0.93, b: 1, cost: 2 },
  ],
  liftUntil: 0.74,
  craneEnd: 0.76,
  scene: (P, sp, plan, shown, lit) => cantileverSVG(P, progress(plan, shown), lit),
  shadow: (P, sp, t) => castShadow(P, rectOutline(X.x0, -X.y, X.x1, X.y), X.z1 * 0.4 * t + 0.2),
  shadowFrom: "truss",
  building(P, sp, seed, { lit = false, detail = 2, shadowP = P } = {}) {
    const s = detail ? castShadow(shadowP, rectOutline(X.x0, -X.y, X.x1, X.y), X.z1 * 0.4 + 0.2) + box(P, X.core[0] - 0.1, -0.88, X.core[1] + 0.1, 0.88, 0, 0.3, CONCRETE) : "";
    return s + cantileverSVG(P, CANT_DONE, lit, detail);
  },
  snow: (P) => poly([P(X.x0, -X.y, X.z1 + 0.09), P(X.x1, -X.y, X.z1 + 0.09), P(X.x1, X.y, X.z1 + 0.09), P(X.x0, X.y, X.z1 + 0.09)], "#f4f7fa", 0.95),
  workHeight(sp, p, k) {
    if (["props", "truss", "deck", "release", "glazing"].includes(p.key)) return X.z1 + 0.2;
    if (p.key === "coreWall" || p.key === "corePour") return X.z0;
    return null;
  },
  chute: () => [X.core[1] + 0.3, -1.1, 0.85],
  crew(sp, p, k) {
    const tip = X.x0 + (X.x1 - X.x0) * k;
    return (
      {
        pit: [at(-1.4, 1.1, -0.3 * k, "shovel"), at(-0.7, 1.1, -0.3 * k, "shovel")],
        raftRebar: [at(-1.4, 0.2, -0.2, "tie"), at(-0.8, -0.3, -0.2, "tie")],
        raft: [at(-1.2, 1.1, 0, "hose"), at(-0.6, 1.1, 0, "trowel")],
        coreWall: [at(-1.2, 1.05, 0, "tie"), at(0.05, 0.3, 0, "hammer")],
        corePour: [at(-1.0, X.cy - 0.2, X.z0, "hose"), at(0.1, 0.9, 0, "survey")],
        props: [at(PROPS[Math.min(2, Math.floor(k * 3))], 1.0, 0, "hammer"), at(0.6, 1.4, 0, "carry")],
        truss: [at(Math.min(tip, X.x1 - 0.2), 0, X.z0, "hammer"), at(-0.8, 0.2, X.z0, "carry")],
        deck: [at(X.x0 + (X.x1 - X.x0) * Math.min(1, k / 0.7), 0.1, X.z0 + 0.06, "hose"), at(-0.6, -0.3, X.z0 + 0.06, "trowel")],
        release: [at(PROPS[0] + 0.3, 1.0, 0, "bar"), at(X.x1 + 0.3, 1.0, 0, "survey")],
        glazing: [at(X.x0 + (X.x1 - X.x0) * k, X.y - 0.25, X.z0 + 0.06, "carry"), at(-0.5, 0.1, X.z0 + 0.06, "hammer")],
        cladding: [at(X.x0 + (X.x1 - X.x0) * k, 0, X.z1 + 0.08, "hammer")],
        swing: [at(1.4, 0.6, 0, "tie")],
      }[p.key] || null
    );
  },
  // Raft 0.75 units deep (it is the counterweight), 25 cm core walls,
  // trusses of about 45 kg/m with their cross beams, a 10 cm slab.
  metraj(sp, p, k) {
    const [c0, c1] = X.core;
    if (p.key === "raft") return { concrete: k * (c1 - c0 + 0.2) * 1.76 * 0.75 * V };
    if (p.key === "raftRebar") return { rebar: (k * (c1 - c0 + 0.2) * 1.76 * 0.75 * V * 90) / 1000 };
    const coreVol = 2 * (c1 - c0 + 2 * X.cy) * (X.z0 - 0.3) * M * M * 0.25;
    if (p.key === "corePour") return { concrete: k * coreVol };
    if (p.key === "coreWall") return { rebar: (k * coreVol * 110) / 1000 };
    if (p.key === "truss") {
      const len = TRUSS.reduce((n, [a, z0, b, z1]) => n + Math.hypot(b - a, z1 - z0), 0) * 2 + (X.panels + 1) * 2 * X.y;
      return { steel: (k * len * M * 45) / 1000 };
    }
    if (p.key === "deck") return { concrete: k * (X.x1 - X.x0) * 2 * X.y * M * M * 0.1 };
    return null;
  },
  items: (q, num) => (q.steel > 0 ? `Çelik ${num(q.steel, 2)} t` : `Donatı ${num(q.rebar, 2)} t`),
};

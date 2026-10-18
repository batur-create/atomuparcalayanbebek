// The construction site, built the way a reinforced-concrete building is built:
// mobilisation, setting out, excavation, blinding, foundation waterproofing,
// foundation rebar, formwork and pour, then for every storey column rebar →
// column formwork → pour and strike → props, beam and deck formwork → beam and
// slab rebar → beam and slab pour. Everything is drawn straight from the
// session's progress: pieces are placed, laid or poured, never faded in.
import { STONE, WOOD, box, faceX, faceY, openingList, outline, poly, seg } from "./iso.js";
import { materialsSVG } from "./sitedetail.js";
import { domeWorkHeight, ringBeamSVG } from "./geodesic.js";

// Share of the session for the substructure and the frame; the rest is walls,
// roof, openings, finishes and handover (drawn by the scene's later parts).
export const FRAME_END = 0.55;
// Where the walls are the structure (masonry, a timber frame, a steel frame)
// the frame runs on to here, when a concrete frame's infill would be done.
export const WALLS_END = 0.68;
// How the building stands up, from what its walls are: rendered walls hide a
// reinforced-concrete frame; brick and stone are load-bearing masonry with
// concrete ties; planks clad a timber frame; glass hangs on a steel frame; a
// geodesic dome is its own frame of struts and hubs.
export const systemOf = (sp) => ({ rows: "masonry", blocks: "masonry", planks: "timber", panes: "steel", geodesic: "geodesic" })[sp.wall.pattern] || "rc";
export const frameEndOf = (sp) => (systemOf(sp) === "rc" ? FRAME_END : WALLS_END);
// Walls that are rendered and painted get an insulated render facade (ETICS):
// boards and anchors, mesh and base coat, then paint.
export const rendered = (sp) => systemOf(sp) === "rc";
export function laterPhases(sp) {
  const dome = sp.roofType === "dome",
    sys = systemOf(sp),
    steel = sys === "steel";
  const facade = {
    rc: [
      ["eps", "Mantolama: yalıtım levhaları ve dübeller", 0.86, 0.885],
      ["render", "Sıva: file ve ince sıva", 0.885, 0.905],
      ["paint", "Dış cephe boyası", 0.905, 0.93],
    ],
    masonry: [["finish", sp.wall.pattern === "rows" ? "Cephe: derz dolgusu, hatıllara tuğla kaplama" : "Cephe: taş derzleri, hatıllara taş kaplama", 0.86, 0.93]],
    timber: [["finish", "Cephe: ahşap dış kaplama ve vernik", 0.86, 0.93]],
  }[sys];
  return [
    ...(sys === "rc" ? [["walls", "Dolgu duvar: gazbeton bloklar ve lentolar", FRAME_END, WALLS_END]] : []),
    ["roofFrame", dome ? "Kubbe: taşıyıcı halka" : steel ? "Çatı: çelik makaslar ve aşıklar" : "Çatı: makaslar ve aşıklar", 0.68, 0.715],
    ["roofDeck", dome ? "Kubbe: kaplama ve su yalıtımı" : steel ? "Çatı: alüminyum kayıtlar ve contalar" : "Çatı: OSB kaplama ve su yalıtım örtüsü", 0.715, 0.748],
    ["roofTiles", dome ? "Kubbe: metal kaplama" : steel ? "Çatı: temperli cam paneller" : "Çatı: kiremit, saçaktan mahyaya", 0.748, 0.78],
    // Glass goes on the steel frame before the doors and vents are hung.
    ...(steel
      ? [
          ["finish", "Cephe: alüminyum kayıtlar ve cam paneller", 0.78, 0.86],
          ["openings", "Kapı ve havalandırma kapakları", 0.86, 0.93],
        ]
      : [["openings", "Doğrama ve kapı", 0.78, 0.86], ...facade]),
    ["handover", "Peyzaj ve teslim", 0.93, 1],
  ];
}

// Each storey's steps, by structural system.
function storeySteps(sp, i) {
  const top = i === sp.floors - 1;
  switch (systemOf(sp)) {
    case "masonry":
      return [
        ["wallLay", `${sp.wall.pattern === "rows" ? "tuğla" : "taş"} duvar örme ve lentolar`, 1.7],
        ["tieCol", "düşey hatıllar: kalıp ve beton", 0.6],
        ["deckForm", "yatay hatıl ve döşeme kalıbı", 0.8],
        ["deckRebar", "hatıl ve döşeme donatısı", 0.8],
        ["deckPour", "hatıl ve döşeme betonu", 0.7],
      ];
    case "timber":
      return [
        ["studs", "taban ankrajı, dikmeler ve çaprazlar", 1.2],
        ["joists", top ? "tavan kirişleri ve OSB" : "döşeme kirişleri ve OSB", 0.9],
      ];
    case "steel":
      return [
        ["steelCol", "çelik kolonlar ve ankraj bulonları", 0.7],
        ["steelBeam", "çelik kirişler ve bulonlu birleşimler", 0.7],
        ["brace", "çapraz bağlantılar", 0.5],
        ...(top ? [] : [["steelDeck", "trapez sac ve döşeme betonu", 0.9]]),
      ];
    default: {
      const v = sp.kind === "tower" ? "kolon ve perde" : "kolon";
      return [
        ["colRebar", `${v} donatısı`, 0.8],
        ["colForm", `${v} kalıbı`, 0.5],
        ["colPour", `${v} betonu ve kalıp söküm`, 0.6],
        ["deckForm", "dikmeler, kiriş ve döşeme kalıbı", 0.9],
        ["deckRebar", "kiriş ve döşeme donatısı", 0.9],
        ["deckPour", "kiriş ve döşeme betonu", 0.8],
      ];
    }
  }
}

// A geodesic dome: the raft, a ring beam with the anchor bolts, a shoring
// tower in the middle, the struts ring by ring up to the top hub, the bolts
// torqued and the geometry surveyed, the tower struck, then the skin.
const DOME_STEPS = [
  ["ringForm", "Halka kiriş: donatı, kalıp ve ankraj bulonları", 1.3],
  ["ringPour", "Halka kiriş betonu ve kür", 0.9],
  ["shore", "Geçici merkez iskele kulesi", 0.7],
  ...["taban halkası: düğümler ve alt çubuklar", "2. halka çubukları", "3. halka çubukları", "tepe halkası ve kilit düğümü"].map((label, i) => ["strut", `Kubbe ${label}`, i === 3 ? 0.6 : 0.9, i]),
  ["bolts", "Bulon sıkma ve kubbe geometrisi ölçümü", 0.6],
  ["unshore", "Merkez iskele söküm: kubbe kendini taşıyor", 0.5],
];
const DOME_LATER = [
  ["panels", "Taş yünü dolgulu üçgen sandviç paneller", 0.62, 0.78],
  ["glazing", "Lamine cam: beş pencere ve tepe feneri", 0.78, 0.83],
  ["seal", "Derzler: EPDM conta ve kapak profilleri", 0.83, 0.86],
  ["openings", "Giriş tüneli ve cam kapı", 0.86, 0.93],
  ["handover", "Peyzaj ve teslim", 0.93, 1],
];
export const DOME_FRAME_END = 0.62;

export function sitePlan(sp) {
  const dome = systemOf(sp) === "geodesic";
  const steps = [
    ["mobilize", "Mobilizasyon: çit, konteyner ve ruhsat tabelası", 1],
    ["layout", "Aplikasyon: kazık ve ip iskelesi", 1.2],
    ["dig", "Hafriyat", 2.2],
    ["lean", "Grobeton", 0.9],
    ["footWater", "Temel su yalıtımı", 0.7],
    ["footRebar", "Temel donatısı", 1.6],
    ["footForm", "Temel kalıbı", 0.9],
    ["footPour", "Temel betonu ve kür", 1.4],
  ].map(([key, label, w]) => ({ key, label, w, floor: -1 }));
  if (dome) steps.push(...DOME_STEPS.map(([key, label, w, floor = -1]) => ({ key, label, w, floor })));
  else for (let i = 0; i < sp.floors; i++)
    for (const [key, label, w] of storeySteps(sp, i)) steps.push({ key, label: `${i + 1}. kat ${label}`, w, floor: i });
  // A timber frame is sheathed and wrapped once it stands.
  if (systemOf(sp) === "timber") steps.push({ key: "sheath", label: "Dış OSB kaplama ve rüzgâr bariyeri", w: 1, floor: -1 });
  const total = steps.reduce((n, s) => n + s.w, 0),
    end = dome ? DOME_FRAME_END : frameEndOf(sp);
  let at = 0;
  const phases = steps.map((s) => {
    const a = at;
    at += (s.w / total) * end;
    return { ...s, a, b: at };
  });
  for (const [key, label, a, b] of dome ? DOME_LATER : laterPhases(sp)) phases.push({ key, label, a, b, floor: -1 });
  return phases;
}

const clamp = (v) => Math.max(0, Math.min(1, v));
export function phaseAt(plan, shown) {
  return plan.find((p) => shown < p.b) || plan[plan.length - 1];
}
// Height the crane hook works at: the storey being built, or the roof later.
export function workHeight(plan, sp, shown) {
  const hf = sp.h / sp.floors;
  const p = phaseAt(plan, shown);
  if (systemOf(sp) === "geodesic") return domeWorkHeight(sp, p, clamp((shown - p.a) / (p.b - p.a))) ?? (shown < plan.find((q) => q.key === "shore").a ? 0.4 : 0.3 + sp.h);
  if (p.floor >= 0) return 0.3 + (p.floor + 1) * hf;
  return shown < plan.find((q) => q.floor >= 0).a ? 0.4 : 0.3 + sp.h;
}

// ---------- colours ----------
const SOIL = "#7d6142",
  SOIL_WALLS = ["#8a6a48", "#735737"],
  PIT_FLOOR = "#94744f",
  LEAN = "#b8b4ab",
  REBAR = "#8a4b33",
  PLY = ["#e6c383", "#cfa56a", "#b98e55"],
  WET = ["#8e9298", "#7a7e85", "#676b71"],
  CONCRETE = ["#cdcac2", "#b2afa7", "#99968f"],
  PROP = "#6e7c8c",
  MEMBRANE = ["#33363b", "#2b2e33", "#55595f"],
  FENCE = "#9aa3ad",
  BARRIER = ["#f2c14e", "#d9a930", "#bf9322"];
const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};
const mixAll = (a, b, t) => a.map((c, i) => mix(c, b[i], t));

let clipSerial = 0;

function windrow(P, x0, x1, y0, y1, h) {
  const xc = (x0 + x1) / 2,
    r = Math.min(0.3, (y1 - y0) / 2);
  const a = P(xc, y0 + r, h),
    b = P(xc, y1 - r, h);
  let s = poly([P(x0, y0, 0), P(x0, y1, 0), b, a], "#b8946a");
  s += poly([P(x0, y1, 0), P(x1, y1, 0), b], "#8f6d4a");
  s += poly([P(x1, y0, 0), P(x1, y1, 0), b, a], "#a07e58");
  s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#c4a27a" stroke-width="1.2" stroke-linecap="round"/>`;
  // A few clods on the slope.
  for (let i = 1; i < 6; i++) {
    const t = i / 6,
      [cx, cy] = P(xc + 0.12 + 0.08 * (i % 2), y0 + (y1 - y0) * t, h * 0.45);
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.3" fill="#7d5d3e"/>`;
  }
  return s;
}

/** SVG for everything up to the finished frame, at progress `shown` (0…1): { yard, rest, front }. */
export function siteSVG(P, sp, plan, shown) {
  const k = {};
  for (const p of plan) k[p.floor >= 0 ? `${p.key}${p.floor}` : p.key] = clamp((shown - p.a) / (p.b - p.a));
  const w = sp.hw,
    wf = w + 0.2,
    E = wf + 0.25,
    D = 0.6,
    hf = sp.h / sp.floors;
  const bottom = -D + 0.08;
  let back = "",
    pit = "",
    above = "",
    front = "";

  // Mobilisation: wire-mesh panels on the far sides, a low barrier in front so
  // the work stays in view, and the site container. All gone at handover.
  const handover = clamp((shown - 0.93) / 0.05);
  const panels = Math.round(10 * k.mobilize * (1 - handover));
  const F = 2.95;
  for (let i = 0; i < panels; i++) {
    const t0 = -F + (i % 5) * 1.18,
      t1 = t0 + 1.12;
    if (i < 5) {
      back += box(P, -F - 0.04, t0, -F, t1, 0, 0.9, [FENCE, "#8a939d", "#7a838d"]);
      for (let z = 0.15; z < 0.9; z += 0.25) back += seg(P(-F + 0.01, t0, z), P(-F + 0.01, t1, z), "#c4cbd3", 0.6);
    } else {
      back += box(P, t0, -F - 0.04, t1, -F, 0, 0.9, [FENCE, "#8a939d", "#7a838d"]);
      for (let z = 0.15; z < 0.9; z += 0.25) back += seg(P(t0, -F + 0.01, z), P(t1, -F + 0.01, z), "#c4cbd3", 0.6);
    }
  }
  if (k.mobilize > 0.5 && handover < 1) {
    back += box(P, -2.85, -2.85, -1.75, -2.25, 0, 0.75, ["#eef1f4", "#d7dde3", "#c1c8d0"]);
    back += box(P, -2.6, -2.27, -2.2, -2.24, 0.3, 0.55, ["#6f8fb3", "#5d7ea3", "#4c6c90"]);
    // "İş güvenliği önce!" board on the fence.
    back += box(P, -2.93, 1.2, -2.9, 2.1, 0.45, 0.85, BARRIER);
    // The permit board on the back fence: building, permit number, owner,
    // contractor, site engineer, inspection firm.
    back += seg(P(0.45, -F + 0.03, 0), P(0.45, -F + 0.03, 0.4), "#7a838d", 1.2) + seg(P(1.35, -F + 0.03, 0), P(1.35, -F + 0.03, 0.4), "#7a838d", 1.2);
    back += poly([P(0.4, -F + 0.04, 0.4), P(1.4, -F + 0.04, 0.4), P(1.4, -F + 0.04, 1.05), P(0.4, -F + 0.04, 1.05)], "#fbfaf6");
    back += poly([P(0.4, -F + 0.045, 0.9), P(1.4, -F + 0.045, 0.9), P(1.4, -F + 0.045, 1.05), P(0.4, -F + 0.045, 1.05)], "#2f62a6");
    for (let z = 0.5; z < 0.86; z += 0.08) back += seg(P(0.5, -F + 0.05, z), P(z > 0.8 ? 1.0 : 1.3, -F + 0.05, z), "#9aa3ad", 0.8);
  }
  if (k.mobilize > 0.8 && handover < 1)
    for (const [x0, y0, x1, y1] of [[2.6, -2.6, 2.7, 2.7], [-2.6, 2.6, 2.6, 2.7]]) front += box(P, x0, y0, x1, y1, 0.15, 0.32, BARRIER);

  // Setting out: corner stakes first, then batter boards with strings along
  // the footprint lines; they stay until the foundation is poured.
  if (k.layout > 0 && k.footPour < 1) {
    const corners = [[-wf, -wf], [wf, -wf], [wf, wf], [-wf, wf]];
    corners.slice(0, Math.ceil(clamp(k.layout / 0.4) * 4)).forEach(([x, y]) => {
      const stake = box(P, x - 0.03, y - 0.03, x + 0.03, y + 0.03, 0, 0.3, WOOD);
      if (x + y > 0) front += stake;
      else back += stake;
    });
    if (k.layout > 0.4) {
      const o = wf + 0.7;
      const lines = [
        [[-o, -wf], [o, -wf]], [[-o, wf], [o, wf]], [[-wf, -o], [-wf, o]], [[wf, -o], [wf, o]],
      ].slice(0, Math.ceil(clamp((k.layout - 0.4) / 0.6) * 4));
      for (const [[ax, ay], [bx, by]] of lines) {
        for (const [x, y] of [[ax, ay], [bx, by]]) {
          const board = box(P, x - 0.05, y - 0.05, x + 0.05, y + 0.05, 0, 0.55, WOOD);
          if (x + y > 0) front += board;
          else back += board;
        }
        above += seg(P(ax, ay, 0.48), P(bx, by, 0.48), "#fbfaf6", 0.8, 0.9);
      }
    }
    if (k.dig < 1) {
      // Total station on its tripod.
      const [tx, ty] = [wf + 1.25, -wf - 0.4];
      for (const [dx, dy] of [[-0.25, -0.15], [0.2, -0.2], [0, 0.25]]) front += seg(P(tx + dx, ty + dy, 0), P(tx, ty, 0.75), "#c9a227", 1.3);
      front += box(P, tx - 0.1, ty - 0.08, tx + 0.1, ty + 0.08, 0.75, 0.97, ["#f6d24a", "#e0b92a", "#c49f1d"]);
    }
  }

  // Excavation: the pit deepens and the spoil heap grows; the spoil goes back
  // as backfill once the foundation is cast.
  const backfilled = k.footPour >= 1;
  const d = D * k.dig;
  // Starter bars for the columns (or a masonry building's tie columns); a
  // steel frame gets anchor bolts instead, a timber one is bolted down later.
  const cols = { rc: rcColumnsOf(sp), masonry: columnsOf(sp), steel: steelColumns(sp) }[systemOf(sp)] || [],
    bolts = systemOf(sp) === "steel";
  const formZ = bottom + (0.32 - bottom) * k.footForm,
    struck = k.footPour > 0.8,
    level = bottom + (0.3 - bottom) * clamp(k.footPour / 0.6),
    cured = mixAll(WET, STONE, clamp((k.footPour - 0.6) / 0.4));
  const bars = Math.floor((2 * wf) / 0.32);
  const mesh = (z, count) => {
    let s = "";
    for (let i = 0; i < count; i++) {
      const t = -wf + 0.16 + (Math.floor(i / 2) % bars) * 0.32;
      s += i % 2
        ? seg(P(t, -wf + 0.05, z), P(t, wf - 0.05, z), REBAR, 1)
        : seg(P(-wf + 0.05, t, z), P(wf - 0.05, t, z), REBAR, 1);
    }
    return s;
  };
  const starters = k.footRebar > 0.5 ? Math.ceil(clamp((k.footRebar - 0.5) / 0.25) * cols.length) : 0;
  if (k.dig > 0 && !backfilled) {
    const id = `pit${++clipSerial}`;
    const rim = [P(-E, -E, 0), P(E, -E, 0), P(E, E, 0), P(-E, E, 0)];
    pit += `<clipPath id="${id}"><polygon points="${rim.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/></clipPath><g clip-path="url(#${id})">`;
    pit += poly(rim, SOIL);
    pit += poly([P(-E, -E, -d), P(E, -E, -d), P(E, E, -d), P(-E, E, -d)], PIT_FLOOR);
    pit += poly([P(-E, -E, 0), P(-E, E, 0), P(-E, E, -d), P(-E, -E, -d)], SOIL_WALLS[0]);
    pit += poly([P(-E, -E, 0), P(E, -E, 0), P(E, -E, -d), P(-E, -E, -d)], SOIL_WALLS[1]);
    // Blinding concrete spreads across the bottom, then the bottom mesh, bar by bar.
    if (k.lean > 0) pit += poly([P(-wf, -wf, -d + 0.06), P(-wf + 2 * wf * k.lean, -wf, -d + 0.06), P(-wf + 2 * wf * k.lean, wf, -d + 0.06), P(-wf, wf, -d + 0.06)], LEAN);
    // Bitumen membrane, torched on in overlapping strips across the blinding.
    if (k.footWater > 0) {
      const strips = Math.ceil(k.footWater * 6),
        sw = (2 * wf) / 6;
      for (let i = 0; i < strips; i++) {
        const y0 = -wf + i * sw,
          y1 = Math.min(wf, y0 + sw + 0.06),
          x1 = i === strips - 1 ? -wf + 2 * wf * clamp(k.footWater * 6 - i) : wf;
        pit += poly([P(-wf, y0, -d + 0.07), P(x1, y0, -d + 0.07), P(x1, y1, -d + 0.07), P(-wf, y1, -d + 0.07)], i % 2 ? MEMBRANE[0] : MEMBRANE[1]);
        pit += seg(P(-wf, y1, -d + 0.071), P(x1, y1, -d + 0.071), MEMBRANE[2], 0.7);
      }
    }
    pit += mesh(-d + 0.15, clamp(k.footRebar / 0.5) * bars * 2);
    if (!bolts) for (let i = 0; i < starters; i++) pit += cage(P, cols[i][0], cols[i][1], bottom + 0.1, 0, false, (cols[i][2] || 0.11) - 0.04, (cols[i][3] || 0.11) - 0.04);
    if (k.footForm > 0 && !struck) {
      const top = Math.min(0, formZ);
      pit += box(P, -wf - 0.06, -wf - 0.06, -wf, wf + 0.06, bottom, top, PLY) + box(P, -wf - 0.06, -wf - 0.06, wf + 0.06, -wf, bottom, top, PLY);
    }
    if (k.footPour > 0) pit += box(P, -wf, -wf, wf, wf, bottom, Math.min(0, level), cured);
    if (k.footForm > 0 && !struck) {
      const top = Math.min(0, formZ);
      pit += box(P, wf, -wf - 0.06, wf + 0.06, wf + 0.06, bottom, top, PLY) + box(P, -wf - 0.06, wf, wf + 0.06, wf + 0.06, bottom, top, PLY);
    }
    pit += "</g>";
  }
  // It goes back with the first work after the foundation (the excavator
  // pushes it in round the raft).
  const after = plan[plan.findIndex((p) => p.key === "footPour") + 1];
  const spoil = Math.max(0, k.dig - (k[after.floor >= 0 ? `${after.key}${after.floor}` : after.key] || 0) / 0.75);
  // The spoil kept for backfill lies in a windrow along the right-hand edge,
  // clear of the crane, the stockpiles and both truck lanes.
  if (spoil > 0) back += windrow(P, 2.76, 3.36, -2.1, -2.1 + 1.9 * Math.sqrt(spoil), 0.42 * Math.sqrt(spoil));

  // Above ground: starter bars, the back of the formwork, the top mesh, the
  // concrete as it rises (wet grey curing to pale), then the front formwork.
  for (let i = 0; i < starters; i++) above += bolts ? anchorBolts(P, cols[i][0], cols[i][1]) : cage(P, cols[i][0], cols[i][1], 0, 0.95, false, (cols[i][2] || 0.11) - 0.04, (cols[i][3] || 0.11) - 0.04);
  if (k.footForm > 0 && !struck && formZ > 0)
    above += box(P, -wf - 0.06, -wf - 0.06, -wf, wf + 0.06, 0, formZ, PLY) + box(P, -wf - 0.06, -wf - 0.06, wf + 0.06, -wf, 0, formZ, PLY);
  if (k.footRebar > 0.75) above += mesh(0.2, clamp((k.footRebar - 0.75) / 0.25) * bars * 2);
  if (k.footPour > 0 && level > 0) above += box(P, -wf, -wf, wf, wf, 0, level, cured);
  if (k.footForm > 0 && !struck && formZ > 0)
    above += box(P, wf, -wf - 0.06, wf + 0.06, wf + 0.06, 0, formZ, PLY) + box(P, -wf - 0.06, wf, wf + 0.06, wf + 0.06, 0, formZ, PLY);

  // The structure, storey by storey.
  const sys = systemOf(sp);
  let frame = "";
  // Once the facade is up, walls, ties and frame are all out of sight.
  if (sys === "geodesic") frame += ringBeamSVG(P, sp, k.ringForm, k.ringPour);
  for (let i = 0; i < sp.floors && sys !== "geodesic" && !(sys !== "rc" && shown >= 0.93); i++) {
    const z0 = 0.3 + i * hf,
      zs = 0.3 + (i + 1) * hf;
    const piece = { rc: rcStorey, masonry: masonryStorey, timber: timberStorey, steel: steelStorey }[sys](P, sp, i, k, z0, zs, shown);
    if (piece == null) break;
    frame += piece;
  }
  if (sys === "timber" && k.sheath > 0 && shown < 0.93) frame += sheathSVG(P, sp, k.sheath);
  // The yard (fence, container, spoil) sits under the machines; the rest above them.
  const stock = materialsSVG(P, sp, k, shown, plan);
  return { yard: back + stock.back, rest: pit + above + frame, front: front + stock.front };
}

// Columns: the corners, and mid-side columns on a wider plan.
export function columnsOf(sp) {
  const c = sp.hw - 0.14;
  const list = [[-c, -c], [c, -c], [-c, c], [c, c]];
  if (sp.hw >= 1.8) list.push([0, -c], [-c, 0], [c, 0], [0, c]);
  return list.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
}
// Beams: round the perimeter on the column lines, and across the middle on a
// wider plan. Back ones first, so the front ones are drawn over them.
export const BEAM_DEPTH = 0.3;
export function beamsOf(sp) {
  const c = sp.hw - 0.14,
    e = c + 0.11;
  const list = [
    { x0: -e, x1: e, y0: -c - 0.1, y1: -c + 0.1 },
    { x0: -c - 0.1, x1: -c + 0.1, y0: -e, y1: e },
  ];
  if (sp.hw >= 1.8) list.push({ x0: -e, x1: e, y0: -0.1, y1: 0.1 }, { x0: -0.1, x1: 0.1, y0: -e, y1: e });
  list.push({ x0: c - 0.1, x1: c + 0.1, y0: -e, y1: e }, { x0: -e, x1: e, y0: c - 0.1, y1: c + 0.1 });
  return list;
}
function beamBox(P, b, z0, z1, pad, faces) {
  return box(P, b.x0 - pad, b.y0 - pad, b.x1 + pad, b.y1 + pad, z0, z1, faces);
}
// A beam's cage: two top bars along it and stirrups across it.
function beamCage(P, b, under, soffit) {
  const along = b.x1 - b.x0 > b.y1 - b.y0;
  const [cx, cy] = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
  let s = "";
  for (const o of [-0.05, 0.05])
    s += along ? seg(P(b.x0, cy + o, soffit + 0.04), P(b.x1, cy + o, soffit + 0.04), REBAR, 1) : seg(P(cx + o, b.y0, soffit + 0.04), P(cx + o, b.y1, soffit + 0.04), REBAR, 1);
  const len = along ? b.x1 - b.x0 : b.y1 - b.y0;
  // Closer stirrups for twice the beam's depth from each column face.
  for (let t = 0.12; t < len - 0.05; t += t < 0.6 || t > len - 0.6 ? 0.1 : 0.22) {
    const q = (dx, dy, z) => (along ? P(b.x0 + t, cy + dy, z) : P(cx + dx, b.y0 + t, z));
    s += outline([q(-0.06, -0.06, under + 0.04), q(0.06, 0.06, under + 0.04), q(0.06, 0.06, soffit + 0.05), q(-0.06, -0.06, soffit + 0.05)], "#a5654a", 0.7);
  }
  return s;
}
// A column's (or shear wall's) rebar cage: longitudinal bars round the edge
// and closed stirrups with 135° hooks. Stirrups are closer at both ends, in
// the confinement zones TBDY 2018 asks for, than in the middle.
function cage(P, x, y, z0, z1, stirrups, hx = 0.07, hy = 0.07) {
  let s = "";
  const bars = [];
  for (const sy of [-1, 1]) for (let u = -hx; u <= hx + 1e-6; u += Math.max(0.14, (2 * hx) / Math.ceil((2 * hx) / 0.2))) bars.push([u, sy * hy]);
  for (const sx of [-1, 1]) for (let u = -hy + 0.2; u < hy - 0.1; u += 0.2) bars.push([sx * hx, u]);
  for (const [dx, dy] of bars) s += seg(P(x + dx, y + dy, z0), P(x + dx, y + dy, z1), REBAR, 1);
  if (stirrups) {
    const zone = Math.min(0.45, (z1 - z0) / 4),
      ex = hx + 0.01,
      ey = hy + 0.01;
    for (let z = z0 + 0.08; z < z1 - 0.15; z += z < z0 + zone || z > z1 - 0.3 - zone ? 0.1 : 0.25) {
      s += outline([P(x - ex, y - ey, z), P(x + ex, y - ey, z), P(x + ex, y + ey, z), P(x - ex, y + ey, z)], "#a5654a", 0.7);
      s += seg(P(x + ex, y + ey, z), P(x + ex - 0.05, y + ey - 0.05, z - 0.04), "#a5654a", 0.6);
    }
  }
  return s;
}
// Columns as [x, y, half width in x, half width in y]: the corners, mid-side
// columns on a wider plan, and in a concrete tower two shear walls on the
// back faces to carry the earthquake load.
export function rcColumnsOf(sp) {
  const cols = columnsOf(sp).map(([x, y]) => [x, y, 0.11, 0.11]);
  if (sp.kind !== "tower") return cols;
  const c = sp.hw - 0.14;
  return [...cols, [-c, 0, 0.11, 0.42], [0, -c, 0.42, 0.11]].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
}

// ---------- storeys ----------
// Props under the beams and the deck, from deck formwork until the frame is done.
function propsSVG(P, sp, df, z0, soffit, shown) {
  const w = sp.hw;
  let s = "";
  if (df > 0 && shown < frameEndOf(sp) + 0.02) {
    const n = Math.ceil(clamp(df / 0.35) * 9);
    for (let j = 0; j < n; j++) {
      const x = -w + 0.5 + (j % 3) * (w - 0.5),
        y = -w + 0.5 + Math.floor(j / 3) * (w - 0.5);
      s += seg(P(x, y, z0), P(x, y, soffit), PROP, 1.3);
    }
  }
  return s;
}
// Beams (or a masonry building's ring beams) and the slab: plywood troughs,
// deck panels, beam cages, the slab mesh, then all poured together from the back.
function deckSVG(P, sp, beams, under, soffit, zs, df, dr, dp) {
  const w = sp.hw;
  let s = "";
  const troughs = df > 0.3 && !(dp >= 1) ? Math.ceil(clamp((df - 0.3) / 0.3) * beams.length) : 0;
  for (let j = 0; j < troughs; j++) s += beamBox(P, beams[j], under - 0.04, soffit, 0.06, PLY);
  if (df > 0.6 && !(dp >= 1)) {
    const n = Math.ceil(clamp((df - 0.6) / 0.4) * 9),
      cell = (2 * w) / 3;
    for (let j = 0; j < n; j++) {
      const x0 = -w + (j % 3) * cell,
        y0 = -w + Math.floor(j / 3) * cell;
      s += poly([P(x0, y0, soffit), P(x0 + cell, y0, soffit), P(x0 + cell, y0 + cell, soffit), P(x0, y0 + cell, soffit)], PLY[0]);
      s += outline([P(x0, y0, soffit), P(x0 + cell, y0, soffit), P(x0 + cell, y0 + cell, soffit), P(x0, y0 + cell, soffit)], "#b98e55", 0.6);
    }
  }
  if (dr > 0 && !(dp >= 1)) {
    const cages = Math.ceil(clamp(dr / 0.45) * beams.length);
    for (let j = 0; j < cages; j++) s += beamCage(P, beams[j], under, soffit);
    // Spacers on the deck keep the mesh 3 cm clear for its concrete cover.
    if (dr > 0.45)
      for (let a = -w + 0.5; a < w; a += w - 0.5)
        for (let b = -w + 0.5; b < w; b += w - 0.5) {
          const [cx, cy] = P(a, b, soffit + 0.015);
          s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.3" fill="#9a968d"/>`;
        }
    const bars = Math.floor((2 * w) / 0.3),
      n = clamp((dr - 0.45) / 0.55) * bars * 2;
    for (let j = 0; j < n; j++) {
      const t = -w + 0.15 + (Math.floor(j / 2) % bars) * 0.3;
      s += j % 2
        ? seg(P(t, -w + 0.05, soffit + 0.03), P(t, w - 0.05, soffit + 0.03), REBAR, 0.9)
        : seg(P(-w + 0.05, t, soffit + 0.03), P(w - 0.05, t, soffit + 0.03), REBAR, 0.9);
    }
  }
  if (dp > 0) {
    const edge = -w + 2 * w * Math.min(1, dp / 0.85);
    const faces = mixAll(WET, CONCRETE, clamp((dp - 0.85) / 0.15));
    for (const b of beams) {
      const x1 = Math.min(b.x1, edge);
      if (x1 > b.x0) s += beamBox(P, { ...b, x1 }, under, soffit, 0, faces);
    }
    s += box(P, -w, -w, edge, w, soffit, zs, faces);
  }
  return s;
}

// Reinforced-concrete frame: columns stop at the beam soffit; beams and slab
// are formed, reinforced and poured together over them.
function rcStorey(P, sp, i, k, z0, zs, shown) {
  const soffit = zs - 0.14,
    under = soffit - BEAM_DEPTH,
    cols = rcColumnsOf(sp);
  const cr = k[`colRebar${i}`],
    cf = k[`colForm${i}`],
    cp = k[`colPour${i}`],
    df = k[`deckForm${i}`];
  if (!(cr > 0)) return null;
  let s = propsSVG(P, sp, df, z0, soffit, shown);
  cols.forEach(([x, y, hx, hy], j) => {
    const order = (j + 0.5) / cols.length;
    if (cp >= order) s += box(P, x - hx, y - hy, x + hx, y + hy, z0, under, CONCRETE);
    else if (cf >= order) {
      // Formwork held by steel clamps, kept plumb by a push-pull prop.
      const fx = hx + 0.04,
        fy = hy + 0.04;
      s += box(P, x - fx, y - fy, x + fx, y + fy, z0, under, PLY);
      for (let zc = z0 + 0.25; zc < under - 0.1; zc += 0.42)
        s += outline([P(x - fx - 0.01, y - fy - 0.01, zc), P(x + fx + 0.01, y - fy - 0.01, zc), P(x + fx + 0.01, y + fy + 0.01, zc), P(x - fx - 0.01, y + fy + 0.01, zc)], "#5b6168", 1.2);
      const out = x + y > 0 ? 1 : -1;
      s += seg(P(x + out * fx, y, under - 0.45), P(x + out * 0.95, y, z0), "#6e7c8c", 1.1);
    } else if (cr >= order) s += cage(P, x, y, z0, soffit + 0.3, true, hx - 0.04, hy - 0.04);
  });
  return s + deckSVG(P, sp, beamsOf(sp), under, soffit, zs, df, k[`deckRebar${i}`], k[`deckPour${i}`]);
}

// Load-bearing masonry (TBDY 2018, ch. 11): walls laid course by course in
// running bond with concrete lintels over the openings, vertical tie columns
// cast in the toothed corners, then a ring beam and slab poured together.
const RING_DEPTH = 0.12;
function coursesSVG(P, sp, z0, z1, t) {
  const brick = sp.wall.pattern === "rows",
    w = sp.hw,
    unit = brick ? 0.34 : 0.55,
    n = Math.max(1, Math.round((z1 - z0) / (brick ? 0.17 : 0.31))),
    step = (z1 - z0) / n,
    done = Math.floor(t * n),
    part = t * n - done,
    top = z0 + done * step,
    joint = brick ? "#f6e3d6" : "#ebe6dc";
  // Walls a brick (or stone) thick: the back two first, so the inside shows.
  const ring = (za, zb, back, reach = w) =>
    back
      ? box(P, -w, -w, reach, -w + 0.2, za, zb, sp.wall.faces) + box(P, -w, -w, -w + 0.2, reach, za, zb, sp.wall.faces)
      : box(P, -w, w - 0.2, reach, w, za, zb, sp.wall.faces) + box(P, w - 0.2, -w, w, reach, za, zb, sp.wall.faces);
  let back = done ? ring(z0, top, true) : "",
    s = done ? ring(z0, top, false) : "";
  if (part > 0 && done < n) back += ring(top, top + step, true, -w + 2 * w * part);
  if (done) {
    for (let c = 0; c < done; c++) {
      const z = z0 + c * step;
      if (c) s += seg(P(-w, w + 0.005, z), P(w, w + 0.005, z), joint, 0.7) + seg(P(w + 0.005, -w, z), P(w + 0.005, w, z), joint, 0.6);
      for (let u = -w + (c % 2 ? unit / 2 : unit); u < w - 0.03; u += unit)
        s += seg(P(u, w + 0.005, z), P(u, w + 0.005, z + step), joint, 0.6) + seg(P(w + 0.005, u, z), P(w + 0.005, u, z + step), joint, 0.5);
    }
  }
  for (const o of openingList(sp)) {
    if (o.z1 <= z0 || o.z0 >= Math.max(top, z0)) continue;
    const face = (a, b, za, zb) => (o.face === "y" ? faceY(P, w + 0.012, a, b, za, zb) : faceX(P, w + 0.012, a, b, za, zb));
    s += poly(face(o.a, o.b, Math.max(o.z0, z0), Math.min(o.z1, top)), "#57544e");
    // Lintels bear 20 cm into the wall either side.
    if (top >= o.z1 + 0.14) s += poly(face(o.a - 0.2, o.b + 0.2, o.z1, o.z1 + 0.14), "#b9b6ae");
  }
  if (part > 0 && done < n) s += ring(top, top + step, false, -w + 2 * w * part);
  return { back, front: s };
}
// A tie column fills the corner out to the wall faces it meets.
function tieBox(P, sp, x, y, z0, z1, faces, pad = 0) {
  const w = sp.hw + pad,
    x0 = x < -0.01 ? -w : x - 0.12 - pad,
    x1 = x > 0.01 ? w : x + 0.12 + pad,
    y0 = y < -0.01 ? -w : y - 0.12 - pad,
    y1 = y > 0.01 ? w : y + 0.12 + pad;
  return box(P, x0 + (x < -0.01 ? -0.005 : 0), y0 + (y < -0.01 ? -0.005 : 0), x1 + (x > 0.01 ? 0.005 : 0), y1 + (y > 0.01 ? 0.005 : 0), z0, z1, faces);
}
function masonryStorey(P, sp, i, k, z0, zs, shown) {
  const soffit = zs - 0.14,
    under = soffit - RING_DEPTH,
    cols = columnsOf(sp);
  const wl = k[`wallLay${i}`],
    tc = k[`tieCol${i}`],
    df = k[`deckForm${i}`];
  if (!(wl > 0)) return null;
  const walls = coursesSVG(P, sp, z0, under, wl);
  let s = walls.back + propsSVG(P, sp, df, z0, soffit, shown);
  // The tie columns' cages stand first; the walls are toothed round them.
  if (!(tc > 0)) for (const [x, y] of cols) s += cage(P, x, y, z0, under + 0.3, true);
  s += walls.front;
  cols.forEach(([x, y], j) => {
    const order = (j + 0.5) / cols.length;
    if (tc >= 0.8) s += tieBox(P, sp, x, y, z0, under, mixAll(WET, CONCRETE, clamp((tc - 0.8) / 0.2)));
    else if (tc >= order * 0.4) s += tieBox(P, sp, x, y, z0, under, PLY, 0.04);
  });
  return s + deckSVG(P, sp, beamsOf(sp), under, soffit, zs, df, k[`deckRebar${i}`], k[`deckPour${i}`]);
}

// Timber platform frame: sole plates bolted down, studs at 40 cm centres with
// headers and sills round the openings, double top plates and let-in braces;
// then joists and an OSB deck for the next storey to stand on.
const TIMBER = ["#efd3a1", "#dab47c", "#c29862"],
  STEELF = ["#6f7c8a", "#5b6775", "#4a5562"];
function wallLines(sp) {
  const c = sp.hw - 0.05;
  // Back walls first, so the front ones are drawn over them.
  return [
    { back: true, along: "y", at: -c },
    { back: true, along: "x", at: -c },
    { back: false, along: "x", at: c, face: "y" },
    { back: false, along: "y", at: c, face: "x" },
  ];
}
function timberStorey(P, sp, i, k, z0, zs) {
  const st = k[`studs${i}`],
    jo = k[`joists${i}`];
  if (!(st > 0)) return null;
  const w = sp.hw,
    plate = z0 + 0.05,
    head = zs - 0.22,
    openings = openingList(sp).filter((o) => o.z0 < zs && o.z1 > z0);
  const stick = (line, u, za, zb) => (line.along === "x" ? box(P, u - 0.025, line.at - 0.05, u + 0.025, line.at + 0.05, za, zb, TIMBER) : box(P, line.at - 0.05, u - 0.025, line.at + 0.05, u + 0.025, za, zb, TIMBER));
  const run = (line, za, zb) => (line.along === "x" ? box(P, -w, line.at - 0.05, w, line.at + 0.05, za, zb, TIMBER) : box(P, line.at - 0.05, -w, line.at + 0.05, w, za, zb, TIMBER));
  const lines = wallLines(sp);
  const per = Math.floor((2 * w - 0.1) / 0.4) + 1,
    shownStuds = Math.ceil(clamp((st - 0.1) / 0.6) * per * lines.length);
  const wall = (line, li) => {
    let s = st > 0 ? run(line, z0, plate) : "";
    const holes = line.face ? openings.filter((o) => o.face === line.face) : [];
    for (let j = 0; j < per; j++) {
      if (li * per + j >= shownStuds) break;
      const u = -w + 0.05 + j * 0.4;
      const hole = holes.find((o) => u > o.a - 0.03 && u < o.b + 0.03);
      if (!hole) s += stick(line, u, plate, head);
      else {
        // Cripple studs under the sill and over the header.
        if (hole.z0 > plate + 0.05) s += stick(line, u, plate, hole.z0 - 0.04);
        if (hole.z1 + 0.16 < head) s += stick(line, u, hole.z1 + 0.16, head);
      }
    }
    if (st > 0.72) {
      s += run(line, head, head + 0.05) + (st > 0.8 ? run(line, head + 0.05, head + 0.1) : "");
      for (const o of holes) {
        const z = o.z1;
        s += line.along === "x" ? box(P, o.a - 0.06, line.at - 0.05, o.b + 0.06, line.at + 0.05, z, z + 0.16, TIMBER) : box(P, line.at - 0.05, o.a - 0.06, line.at + 0.05, o.b + 0.06, z, z + 0.16, TIMBER);
        if (o.z0 > plate + 0.05) s += line.along === "x" ? box(P, o.a, line.at - 0.05, o.b, line.at + 0.05, o.z0 - 0.04, o.z0, TIMBER) : box(P, line.at - 0.05, o.a, line.at + 0.05, o.b, o.z0 - 0.04, o.z0, TIMBER);
      }
    }
    if (st > 0.88) {
      // A let-in brace from each bottom corner, on the outside of the studs.
      const off = line.at + Math.sign(line.at) * 0.055;
      for (const end of [-1, 1]) {
        const a = end * (w - 0.05),
          b = end * (w - 1.05);
        s += line.along === "x" ? seg(P(a, off, plate), P(b, off, head), "#a8793f", 1.6) : seg(P(off, a, plate), P(off, b, head), "#a8793f", 1.6);
      }
    }
    return s;
  };
  let s = wall(lines[0], 0) + wall(lines[1], 1);
  if (jo > 0) {
    const zj = zs - 0.03;
    const n = Math.floor((2 * w) / 0.4),
      joists = Math.ceil(clamp(jo / 0.55) * (n + 1));
    for (let j = 0; j < joists; j++) {
      const x = -w + 0.05 + (j * (2 * w - 0.1)) / n;
      s += box(P, x - 0.03, -w + 0.05, x + 0.03, w - 0.05, head + 0.1, zj, TIMBER);
    }
    if (jo > 0.55) {
      const cells = Math.ceil(clamp((jo - 0.55) / 0.45) * 8),
        cell = (2 * w) / 4;
      for (let j = 0; j < cells; j++) {
        const x0 = -w + (j % 4) * cell,
          y0 = -w + Math.floor(j / 4) * w;
        s += box(P, x0, y0, x0 + cell, y0 + w, zj, zs, OSB_FACES);
        s += outline([P(x0, y0, zs), P(x0 + cell, y0, zs), P(x0 + cell, y0 + w, zs), P(x0, y0 + w, zs)], "#a7824b", 0.6);
      }
    }
  }
  return s + wall(lines[2], 2) + wall(lines[3], 3);
}
const OSB_FACES = ["#d6b27a", "#c29d63", "#a7824b"],
  WRAP = ["#f1f3f4", "#e2e6e9"];
// OSB sheets nailed on the two visible faces, openings cut out, then the
// breather membrane rolled on in laps from the bottom up.
function sheathSVG(P, sp, t) {
  const w = sp.hw + 0.005,
    top = 0.3 + sp.h,
    hf = sp.h / sp.floors;
  let s = "";
  const sheets = Math.ceil((2 * w) / 0.6),
    placed = Math.ceil(clamp(t / 0.55) * sheets * sp.floors * 2);
  for (let n = 0; n < placed; n++) {
    const f = Math.floor(n / (sheets * 2)),
      m = n % (sheets * 2),
      j = m >> 1,
      a = -w + j * 0.6,
      b = Math.min(w, a + 0.6),
      z0 = 0.3 + f * hf,
      z1 = z0 + hf;
    s += m % 2 ? poly(faceX(P, w, a, b, z0, z1), OSB_FACES[2]) + outline(faceX(P, w, a, b, z0, z1), "#9a7646", 0.5) : poly(faceY(P, w, a, b, z0, z1), OSB_FACES[1]) + outline(faceY(P, w, a, b, z0, z1), "#9a7646", 0.5);
  }
  if (t > 0.55) {
    const laps = Math.ceil(sp.h / 0.5),
      rolled = clamp((t - 0.55) / 0.45) * laps;
    for (let r = 0; r < Math.ceil(rolled); r++) {
      const z0 = 0.3 + r * 0.5,
        z1 = Math.min(top, z0 + 0.55),
        end = -w + 2 * w * (r < Math.floor(rolled) ? 1 : rolled - r);
      s += poly(faceY(P, w + 0.01, -w, end, z0, z1), WRAP[0]) + poly(faceX(P, w + 0.01, -w, end, z0, z1), WRAP[1]);
      s += seg(P(-w, w + 0.012, z0 + 0.25), P(end, w + 0.012, z0 + 0.25), "#8fb0cf", 0.8, 0.8) + seg(P(w + 0.012, -w, z0 + 0.25), P(w + 0.012, end, z0 + 0.25), "#8fb0cf", 0.8, 0.7);
    }
  }
  for (const o of openingList(sp)) s += poly(o.face === "y" ? faceY(P, w + 0.015, o.a, o.b, o.z0, o.z1) : faceX(P, w + 0.015, o.a, o.b, o.z0, o.z1), "#4d4a45");
  return s;
}

// Steel frame: columns on base plates over the anchor bolts, beams bolted to
// them through end plates, cross-bracing in the end bays.
export function steelColumns(sp) {
  const c = sp.hw - 0.07,
    at = [-c, -c / 3, c / 3, c],
    list = [];
  for (const x of at) for (const y of at) if (Math.abs(x) === c || Math.abs(y) === c) list.push([x, y]);
  return list.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
}
function anchorBolts(P, x, y) {
  let s = "";
  for (const [dx, dy] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) s += seg(P(x + dx, y + dy, 0.18), P(x + dx, y + dy, 0.42), "#7d858d", 1.1);
  return s;
}
function steelStorey(P, sp, i, k, z0, zs) {
  const sc = k[`steelCol${i}`],
    sb = k[`steelBeam${i}`],
    br = k[`brace${i}`],
    sd = k[`steelDeck${i}`];
  if (!(sc > 0)) return null;
  const w = sp.hw,
    c = w - 0.07,
    cols = steelColumns(sp),
    zb = zs - 0.16;
  const beams = [
    { back: true, s: box(P, -c - 0.04, -c - 0.04, c + 0.04, -c + 0.04, zb, zs, STEELF) },
    { back: true, s: box(P, -c - 0.04, -c - 0.04, -c + 0.04, c + 0.04, zb, zs, STEELF) },
    { back: false, s: box(P, c - 0.04, -c - 0.04, c + 0.04, c + 0.04, zb, zs, STEELF) },
    { back: false, s: box(P, -c - 0.04, c - 0.04, c + 0.04, c + 0.04, zb, zs, STEELF) },
  ].slice(0, Math.ceil(clamp(sb / 0.7) * 4));
  // X-braces in the end bays of each face, back faces first.
  const third = (2 * c) / 3;
  const braces = [
    [true, (a, z) => P(a, -c, z)],
    [true, (a, z) => P(-c, a, z)],
    [false, (a, z) => P(c, a, z)],
    [false, (a, z) => P(a, c, z)],
  ].slice(0, Math.ceil(clamp(br) * 4));
  const brace = ([, at]) => {
    let s = "";
    for (const a0 of [-c, c - third]) s += seg(at(a0, z0 + 0.1), at(a0 + third, zb), "#3f474f", 1.1) + seg(at(a0 + third, z0 + 0.1), at(a0, zb), "#3f474f", 1.1);
    return s;
  };
  let s = braces.filter((b) => b[0]).map(brace).join("") + beams.filter((b) => b.back).map((b) => b.s).join("");
  const n = Math.ceil(clamp(sc / 0.85) * cols.length);
  cols.slice(0, n).forEach(([x, y]) => {
    if (i === 0) s += box(P, x - 0.11, y - 0.11, x + 0.11, y + 0.11, z0, z0 + 0.03, ["#4a5562", "#3f4954", "#353e48"]);
    s += box(P, x - 0.06, y - 0.06, x + 0.06, y + 0.06, z0 + 0.03, zs, STEELF);
    // The flange edge catching the light.
    s += seg(P(x + 0.06, y + 0.06, z0 + 0.03), P(x + 0.06, y + 0.06, zs), "#9aa6b2", 0.8);
  });
  s += beams.filter((b) => !b.back).map((b) => b.s).join("") + braces.filter((b) => !b[0]).map(brace).join("");
  // Bolts at the beam-to-column joints once the beams are all on.
  if (sb > 0.75)
    for (const [x, y] of cols.slice(0, Math.ceil(clamp((sb - 0.75) / 0.25) * cols.length))) {
      if (x !== c && y !== c) continue;
      const [bx, by] = P(x + (x === c ? 0.065 : 0), y + (y === c ? 0.065 : 0), zb + 0.08);
      s += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="1.1" fill="#d7dde3"/>`;
    }
  if (sd > 0) {
    // Profiled steel deck, then the concrete topping poured over it.
    s += poly([P(-w, -w, zs), P(w, -w, zs), P(w, w, zs), P(-w, w, zs)], "#aab2ba");
    for (let x = -w + 0.15; x < w; x += 0.15) s += seg(P(x, -w, zs + 0.005), P(x, w, zs + 0.005), "#8c959e", 0.6);
    if (sd > 0.4) s += box(P, -w, -w, -w + 2 * w * clamp((sd - 0.4) / 0.5), w, zs, zs + 0.1, mixAll(WET, CONCRETE, clamp((sd - 0.9) / 0.1)));
  }
  return s;
}

// Live quantities and the progress payment: what has gone into the building so
// far (concrete, rebar, walls, timber, steel) and the share of the contract
// earned, with each work item weighted by what it costs rather than how long
// it takes. One drawing unit is taken as 1.6 m.
import { beamsOf, rcColumnsOf, columnsOf, steelColumns, systemOf } from "./construction.js";
import { openingList } from "./iso.js";
import { specialOf } from "./special.js";

const M = 1.6,
  V = M * M * M;
// Rough cost shares of a small building's work items.
const COST = {
  mobilize: 2, layout: 1, dig: 4, lean: 1, footWater: 2, footRebar: 6, footForm: 3, footPour: 7,
  colRebar: 3, colForm: 2, colPour: 3, deckForm: 4, deckRebar: 4, deckPour: 5, walls: 8,
  wallLay: 9, tieCol: 2, studs: 7, joists: 4, sheath: 4, steelCol: 7, steelBeam: 6, brace: 2, steelDeck: 5,
  roofFrame: 4, roofDeck: 3, roofTiles: 5, openings: 9, eps: 5, render: 3, paint: 2, finish: 8, handover: 4,
};
const clamp = (v) => Math.max(0, Math.min(1, v));
const num = (v, d = 1) => v.toFixed(d).replace(".", ",");

export function metraj(sp, plan, shown) {
  const sys = systemOf(sp),
    w = sp.hw,
    hf = sp.h / sp.floors,
    side = 2 * w * M,
    wallH = (hf - 0.26) * M;
  let cost = 0,
    earned = 0,
    concrete = 0,
    rebar = 0,
    wall = 0,
    timber = 0,
    steel = 0;
  const holes = openingList(sp).reduce((n, o) => n + (o.b - o.a) * (o.z1 - o.z0), 0) * M * M;
  const wf = w + 0.2;
  const colVol = rcColumnsOf(sp).reduce((n, [, , hx, hy]) => n + 4 * hx * hy * (hf - 0.44), 0) * V;
  const deckVol = ((2 * w) ** 2 * 0.14 + beamsOf(sp).reduce((n, b) => n + (b.x1 - b.x0) * (b.y1 - b.y0) * 0.3, 0)) * V;
  const tieVol = columnsOf(sp).length * 0.24 * 0.24 * hf * V;
  const studLen = steelColumns(sp).length * hf * M;
  const own = specialOf(sp),
    extra = { concrete: 0, rebar: 0, steel: 0, timber: 0, wall: 0, stone: 0 };
  for (const p of plan) {
    const k = clamp((shown - p.a) / (p.b - p.a)),
      c = p.cost ?? COST[p.key] ?? 1;
    cost += c;
    earned += c * k;
    // Concrete placed and rebar fixed (t/m³ by element: raft, columns and
    // shear walls, beams and slab, tie columns).
    if (p.key === "lean") concrete += k * (2 * wf) ** 2 * 0.06 * V;
    if (p.key === "footPour") concrete += k * (2 * wf) ** 2 * 0.5 * V;
    if (p.key === "footRebar") rebar += k * (2 * wf) ** 2 * 0.5 * V * 0.08;
    if (p.key === "colPour") concrete += k * colVol;
    if (p.key === "colRebar") rebar += k * colVol * 0.16;
    if (p.key === "deckPour") concrete += k * deckVol;
    if (p.key === "deckRebar") rebar += k * deckVol * 0.11;
    if (p.key === "tieCol") (concrete += k * tieVol), (rebar += k * tieVol * 0.12);
    if (p.key === "steelDeck") concrete += k * (2 * w) ** 2 * 0.1 * V;
    if (p.key === "wallLay") wall += k * (4 * side * wallH - holes / sp.floors);
    if (p.key === "walls") wall += k * (4 * side * hf * M * sp.floors - holes);
    // Studs and plates by wall area, joists by floor area.
    if (p.key === "studs") timber += k * 4 * side * hf * M * 0.02;
    if (p.key === "joists") timber += k * side * side * 0.03;
    // Columns, perimeter beams (about 20 kg/m) and the braces (8 kg/m).
    if (p.key === "steelCol") steel += (k * studLen * 20) / 1000;
    if (p.key === "steelBeam") steel += (k * 4 * side * 20) / 1000;
    if (p.key === "brace") steel += (k * 16 * Math.hypot(side / 3, hf * M) * 8) / 1000;
    const add = own?.metraj(sp, p, k);
    if (add) for (const q in add) extra[q] += add[q];
  }
  concrete += extra.concrete;
  rebar += extra.rebar;
  steel += extra.steel;
  timber += extra.timber;
  wall += extra.wall;
  const hakedis = Math.round((earned / cost) * 100),
    mine = own?.items({ concrete, rebar, steel, timber, wall, stone: extra.stone }, num);
  // A building with no concrete to speak of names both of its own items.
  if (Array.isArray(mine)) return { hakedis, items: mine };
  const items = [`Beton ${num(concrete)} m³`];
  if (sys === "rc") items.push(shown < 0.55 || !wall ? `Donatı ${num(rebar, 2)} t` : `Duvar ${Math.round(wall)} m²`);
  if (sys === "masonry") items.push(wall > 0 ? `Duvar ${Math.round(wall)} m²` : `Donatı ${num(rebar, 2)} t`);
  if (sys === "timber") items.push(timber > 0 ? `Kereste ${num(timber)} m³` : `Donatı ${num(rebar, 2)} t`);
  if (own) items.push(mine);
  if (sys === "steel") items.push(steel > 0 ? `Çelik ${num(steel, 2)} t` : `Donatı ${num(rebar, 2)} t`);
  return { hakedis, items };
}

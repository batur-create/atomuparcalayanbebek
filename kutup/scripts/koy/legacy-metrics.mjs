// n46 A: measures today's (legacy) village on a fixture, the way the app
// draws it (src/villageWorld.js), so the renewal has numbers to beat:
//
//   doorsUnlinked   doors with no drawn path to a lane (the app skips paths ≥ 9)
//   doorsThrough    door paths that run through another building
//   scaleDrift      landmarks drawn at another size once later neighbours came
//   squeezed        landmarks drawn smaller than their own size (shared/olcek.js)
//   overlaps        pairs of buildings whose drawn ground overlaps
//   laneHits        buildings whose drawn ground reaches onto a lane
//   contextless     water / bridge / rail models standing on dry ground
import { buildWorld, skyAt } from "../../src/villageWorld.js";
import { drawnSize } from "../../src/iso.js";
import { LANE, cellLayout, lineDistance, monumentCells, nearestOnLine, roadNetwork } from "../../shared/village.js";
import { BY_ID } from "../../shared/catalog.js";

const WATER = new Set(["yuzenev", "sudegirmeni", "asmakopru", "kemer"]);
const SKY = skyAt(Date.UTC(2026, 9, 20, 9));

export function legacyWorld(f, upTo = f.buildings.length) {
  const buildings = f.buildings.slice(0, upTo).map((b) => ({ ...b, likes: 0, mine: false, patched: false, gift: null }));
  const members = f.members.map((m) => ({ ...m, status: "away", focusEnd: 0, focusPausedAt: 0 }));
  return buildWorld({
    groupKey: f.groupKey,
    village: { rev: 1, monument: 1, districts: f.districts, buildings, ruins: [] },
    members,
    me: "m0",
    sky: SKY,
  });
}

// Ground radius of a drawn building: an enlarged landmark's reach, or a box's half-diagonal.
const groundOf = (sp) => sp.reach || sp.hw * Math.SQRT2;
const segHitsCircle = (a, b, c, r) => lineDistance(c, [a, b]).d < r;

export function legacyMetrics(f) {
  const world = legacyWorld(f);
  const placed = f.buildings.filter((b) => b.x != null);
  const sp = new Map(placed.map((b) => [b.id, world.byId.get(b.id).sp]));
  const cells = f.districts.map((d) => [d.q, d.r]);
  const monuments = monumentCells(f.groupKey, cells, placed);
  const net = roadNetwork(f.groupKey, cells, monuments);
  const lanes = net.lanes;
  const out = { buildings: placed.length, doorsUnlinked: [], doorsThrough: [], scaleDrift: [], squeezed: [], overlaps: [], laneHits: [] };
  for (const b of placed) {
    const s = sp.get(b.id);
    const door = b.facing ? [b.x + s.hw + 0.7, b.y] : [b.x, b.y + s.hw + 0.7];
    let best = { d: Infinity, point: door };
    for (const l of lanes) {
      const n = nearestOnLine(door, l);
      if (n.d < best.d) best = n;
    }
    if (best.d >= 9) out.doorsUnlinked.push(b.id);
    else {
      const other = placed.find((o) => o !== b && segHitsCircle(door, best.point, [o.x, o.y], groundOf(sp.get(o.id)) * 0.8));
      if (other) out.doorsThrough.push([b.id, other.id]);
    }
    const look = BY_ID[b.model]?.look;
    if (look?.special) {
      const want = drawnSize(b.model).k;
      if (s.k < want - 0.01) out.squeezed.push([b.id, b.model, round(s.k), round(want)]);
    }
    const ground = groundOf(s);
    if (lanes.some((l) => lineDistance([b.x, b.y], l).d < ground * 0.72 + LANE - 0.05)) out.laneHits.push(b.id);
  }
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i],
        c = placed[j];
      const gap = Math.hypot(a.x - c.x, a.y - c.y) - groundOf(sp.get(a.id)) * 0.72 - groundOf(sp.get(c.id)) * 0.72;
      if (gap < -0.05) out.overlaps.push([a.id, c.id, round(gap)]);
    }
  // The size a landmark was drawn at right after it was built, against now.
  for (let i = 0; i < f.buildings.length; i++) {
    const b = f.buildings[i];
    if (b.x == null || !BY_ID[b.model]?.look?.special) continue;
    const then = legacyWorld(f, i + 1).byId.get(b.id).sp.k;
    const now = sp.get(b.id).k;
    if (Math.abs(then - now) > 0.01) out.scaleDrift.push([b.id, b.model, round(then), round(now)]);
  }
  // A watermill, floating house or bridge needs water beside it, a station a
  // railway; the legacy village has small ponds and no railway at all.
  const ponds = f.districts.map((d) => cellLayout(f.groupKey, d.q, d.r, monuments.has(`${d.q},${d.r}`)).pond).filter(Boolean);
  out.contextless = [];
  for (const b of placed) {
    const need = WATER.has(b.model) ? "water" : b.model === "istasyon" ? "rail" : null;
    if (!need) continue;
    const near = need === "water" && ponds.some((p) => Math.hypot(p.x - b.x, p.y - b.y) < p.rx + groundOf(sp.get(b.id)) + 1.5);
    if (!near) out.contextless.push([b.id, b.model, need]);
  }
  out.districts = f.districts.length;
  out.lanes = lanes.length;
  out.monumentCells = [...monuments].length;
  out.unplaced = f.buildings.filter((b) => b.x == null).map((b) => b.id);
  return out;
}
const round = (v) => Math.round(v * 100) / 100;
export const count = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]));

// Growth: `extra` more buildings placed by today's planner after the fixture;
// how many of the buildings already standing are then drawn differently?
// (Saved positions never move in the legacy village; drawn sizes can.)
export async function legacyGrowth(f, extra = 100) {
  const { createPlanner } = await import("../../shared/village.js");
  const planner = createPlanner(f.groupKey, f.districts, f.buildings.filter((b) => b.x != null));
  const models = ["kulube", "ev", "bostan", "kahve", "konak", "kule", "sahaf", "cicekci", "galata", "pisa"];
  let seq = 0;
  const grown = { ...f, districts: undefined, buildings: [...f.buildings] };
  for (let i = 0; i < extra; i++) {
    const model = models[(i * 7) % models.length],
      memberId = f.members[i % f.members.length].id;
    const spot = planner.place(memberId, BY_ID[model].kind, () => `g${seq++}`, { model });
    if (!spot) continue;
    grown.buildings.push({ id: `x${i}`, memberId, model, kind: BY_ID[model].kind, seed: 1000 + i, minutes: 25, created: f.now + i, x: spot.x, y: spot.y, facing: spot.facing, districtId: spot.district.id });
  }
  grown.districts = planner.districts.map(({ id, memberId, q, r, seed }) => ({ id, memberId, q, r, seed }));
  const before = legacyWorld(f),
    after = legacyWorld(grown);
  const changed = [];
  for (const b of f.buildings) {
    if (b.x == null) continue;
    const a = before.byId.get(b.id).sp,
      c = after.byId.get(b.id).sp;
    if (Math.abs((a.k || 1) - (c.k || 1)) > 0.01 || Math.abs(a.hw - c.hw) > 0.01) changed.push([b.id, b.model, round(a.k || 1), round(c.k || 1)]);
  }
  return { added: grown.buildings.length - f.buildings.length, changed };
}

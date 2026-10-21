// n46 A: the four fixed village scenes of the renewal plan (§3.3), built with
// the real legacy planner (shared/village.js) so every building stands where
// today's server would have put it. Synthetic: no live data is read.
//
//   baslangic  4 people, a few houses and one site under way
//   yapi32     6 people, 32 buildings: narrow, wide and tall models together
//   baskin100  4 people, 76/8/8/8: one builder must not wall the others in
//   anitkabir  the team's Anıtkabir project beside a few houses
//
// Same name → same JSON, byte for byte (fixed seeds, ids and clock).
import { createPlanner, hashSeed, kindFor } from "../../shared/village.js";
import { BY_ID } from "../../shared/catalog.js";

export const SCENES = ["baslangic", "yapi32", "baskin100", "anitkabir"];
const T0 = Date.UTC(2026, 9, 1, 9); // 1 Oct 2026, 12:00 in Ankara
const NAMES = ["Batur", "Bensu", "Sıla", "Ediz", "Zeynep", "Ada"];
const COLORS = ["lilac", "mint", "blue", "peach", "pink", "lemon"];

// Who builds what, in order. Each entry: [memberIndex, model].
const ORDERS = {
  baslangic: [[0, "ev"], [1, "kulube"], [2, "kahve"], [0, "sahaf"], [3, "bostan"], [1, "cicekci"]],
  yapi32: [
    [0, "ev"], [1, "kulube"], [2, "kahve"], [3, "kule"], [4, "konak"], [5, "bostan"],
    [0, "sahaf"], [1, "galata"], [2, "firin"], [3, "konsol"], [4, "pazar"], [5, "cicekci"],
    [0, "pisa"], [1, "ev"], [2, "amfi"], [3, "kapsul"], [4, "kemer"], [5, "serender"],
    [0, "burgu"], [1, "kubbe"], [2, "kerpic"], [3, "saat"], [4, "sukulesi"], [5, "degirmen"],
    [0, "sudegirmeni"], [1, "istasyon"], [2, "yuzenev"], [3, "asmakopru"], [4, "kervansaray"], [5, "mardinevi"],
    [0, "eyfel"], [1, "kutuphane"],
  ],
  baskin100: [
    ...Array.from({ length: 76 }, (_, i) => [0, ["kulube", "ev", "bostan", "kahve", "sahaf", "konak", "kule", "cicekci"][i % 8]]),
    ...Array.from({ length: 24 }, (_, i) => [1 + (i % 3), ["ev", "kulube", "kahve"][i % 3]]),
  ],
  anitkabir: [[0, "ev"], [1, "kulube"], [2, "konak"], [3, "kahve"], [0, "anitkabir"], [2, "galata"]],
};
// Sessions still under way when the snapshot is taken: they must become sites.
const ACTIVE = {
  baslangic: [{ member: 2, model: "ev", minutes: 50, startedAgo: 12 }],
  yapi32: [
    { member: 1, model: "konak", minutes: 50, startedAgo: 30 },
    { member: 4, model: "kule", minutes: 75, startedAgo: 5 },
    { member: 5, model: null, minutes: 25, startedAgo: 8 }, // binasız odak: no site
  ],
  baskin100: [{ member: 0, model: "kulube", minutes: 25, startedAgo: 20 }, { member: 2, model: "ev", minutes: 50, startedAgo: 2 }],
  anitkabir: [{ member: 3, model: null, minutes: 50, startedAgo: 10, imece: true }],
};

const pad = (n) => String(n).padStart(3, "0");

export function makeFixture(name) {
  const order = ORDERS[name];
  if (!order) throw new Error(`unknown scene ${name}`);
  const groupKey = `n46-${name}`;
  const people = Math.max(...order.map(([m]) => m)) + 1;
  const members = Array.from({ length: Math.max(people, 4) }, (_, i) => ({
    id: `m${i}`,
    name: NAMES[i],
    color: COLORS[i],
    avatar: "📚",
    joined: T0 + i * 60000,
  }));
  let seq = 0;
  const newId = () => `d${pad(seq++)}`;
  const planner = createPlanner(groupKey, [], []);
  for (const m of members) planner.ensure(m.id, newId);
  const buildings = [];
  order.forEach(([who, model], i) => {
    const item = BY_ID[model];
    const memberId = `m${who}`;
    const spot = planner.place(memberId, item.kind, newId, { model });
    buildings.push({
      id: `b${pad(i)}`,
      memberId,
      model,
      kind: item.kind,
      seed: hashSeed(`${groupKey}:${i}`) % 1000000,
      minutes: { cottage: 25, house: 50, tower: 75 }[item.kind],
      created: T0 + 3600000 + i * 3600000,
      x: spot?.x ?? null,
      y: spot?.y ?? null,
      facing: spot?.facing ?? 0,
      districtId: spot?.district.id ?? null,
    });
  });
  const now = T0 + 3600000 * (order.length + 2);
  const sessions = (ACTIVE[name] || []).map((s) => ({
    memberId: `m${s.member}`,
    model: s.model,
    kind: s.model ? BY_ID[s.model].kind : kindFor(s.minutes),
    minutes: s.minutes,
    strict: !!s.model,
    imece: !!s.imece,
    end: now - s.startedAgo * 60000 + s.minutes * 60000,
    seed: hashSeed(`${groupKey}:session:${s.member}`) % 1000000,
  }));
  return {
    scene: name,
    synthetic: true,
    groupKey,
    now,
    members,
    districts: planner.districts.map(({ id, memberId, q, r, seed }) => ({ id, memberId, q, r, seed })),
    buildings,
    sessions,
    imece: name === "anitkabir" ? { projectId: "p-n46", minutes: 640, goal: 2000, crew: ["m0", "m1", "m2", "m3"] } : null,
  };
}

// What must never change through the renewal, per building and per session:
// identity, owner, model, seed, size class, earned minutes and creation time.
// Positions are deliberately left out: a new layout may move them.
export function protectedRows(f) {
  return {
    buildings: f.buildings.map((b) => [b.id, b.memberId, b.model, b.kind, b.seed, b.minutes, b.created]).sort(),
    sessions: f.sessions.map((s) => [s.memberId, s.model, s.minutes, s.end, s.seed]).sort(),
    imece: f.imece ? [f.imece.projectId, f.imece.minutes, f.imece.goal, ...f.imece.crew] : null,
  };
}

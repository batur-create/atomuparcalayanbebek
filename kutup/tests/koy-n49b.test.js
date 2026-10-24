// n49-2: the train revised. A live village on the old straight line gets its
// railway re-laid in bends (terrain 4) with every house where it stands, the
// server checks it like any draft, and a materials train brings loads that
// workers carry off to a building site.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { growth } from "../scripts/koy/grow.mjs";
import { layoutFrom } from "../shared/koy2/draft.js";
import { pointRect } from "../shared/koy2/geom.js";
import { emptyLayout, railCrossing, validateLayout } from "../shared/koy2/planner.js";
import { RERAIL_TERRAIN, canRerail, rerailLayout } from "../shared/koy2/rerail.js";
import { planDraft, planRerail } from "../shared/koy2/switch.js";
import { TERRAINS, makeTerrain, railProblem } from "../shared/koy2/terrain.js";
import { CARS, LOADS, TRAIN, createTrain } from "../src/koy2/train.js";

const T0 = Date.UTC(2026, 9, 24, 9);
const houses = (n, extra = []) => [
  ...Array.from({ length: n }, (_, k) => ({ subject: { type: "building", id: `b${k}` }, model: ["ev", "kulube", "kahve", "sahaf"][k % 4], owner: `m${k % 3}`, created: k })),
  ...extra,
];
const station = (created = 100) => ({ subject: { type: "building", id: "st" }, model: "istasyon", owner: "m1", created });
const bare = (t) => JSON.stringify({ ...t, version: null, rail: null });
const plain = ({ railCrossing: _, ...r }) => JSON.stringify(r);

test("n49-2: terrain 4 is version 2's ground; a laid line must be a sound railway", () => {
  assert.deepEqual(TERRAINS[3], [2, 3, 4]);
  for (const seed of ["group:a", "group:b", "group:c"]) {
    const two = makeTerrain(seed, 2),
      four = makeTerrain(seed, 4);
    assert.equal(four.version, 4);
    assert.equal(bare(four), bare(two));
    assert.deepEqual(four.rail, two.rail);
    assert.equal(railProblem(two), null, seed);
    assert.equal(railProblem(makeTerrain(seed, 3)), null, seed);
  }
  const t = makeTerrain("group:a", 4);
  const kinked = t.rail.pts.map((p, i) => (i === 40 ? [p[0] + 6, p[1] - 6] : p));
  assert.ok(railProblem({ ...t, rail: { ...t.rail, pts: kinked } }));
  assert.equal(railProblem({ ...t, rail: { ...t.rail, pts: t.rail.pts.slice(0, 30) } }), "rail_shape");
  assert.equal(railProblem({ ...t, rail: { ...t.rail, pts: t.rail.pts.map(([x, y]) => [x * 0.5, y * 0.5]) } }) !== null, true);
});

test("n49-2: a grown village's railway is re-laid in bends; every plot, street and square stays, every rule holds", () => {
  // many-80-2: a river that comes close to the line (the bridge stays where it was).
  for (const [seed, count] of [["group:n49b-a", 120], ["group:n49b-b", 260], ["group:many-80-2", 80]]) {
    const { layout } = growth({ seed, count, terrainVersion: 2 });
    assert.equal(layout.terrainVersion, 2);
    assert.ok(canRerail(layout));
    const t0 = performance.now();
    const r = rerailLayout(layout);
    const ms = performance.now() - t0;
    assert.ok(r.layout, `${seed}: ${r.error}`);
    const next = r.layout;
    assert.ok(r.bends >= 2, `${seed}: ${r.bends} bends`);
    assert.equal(next.terrainVersion, RERAIL_TERRAIN);
    assert.equal(railProblem(next.terrain), null);
    assert.equal(bare(next.terrain), bare(makeTerrain(seed, 4)));
    assert.notDeepEqual(next.terrain.rail.pts, layout.terrain.rail.pts);
    // Nothing that stands moves.
    assert.equal(JSON.stringify(next.plots), JSON.stringify(layout.plots));
    assert.equal(JSON.stringify(next.foci), JSON.stringify(layout.foci));
    assert.equal(JSON.stringify(next.nodes), JSON.stringify(layout.nodes));
    assert.deepEqual(next.roads.map(plain), layout.roads.map(plain));
    // Level crossings are exactly where streets now meet the line.
    for (const road of next.roads) if (road.railCrossing) assert.deepEqual(road.railCrossing, railCrossing(next.terrain, road.pts));
    assert.deepEqual(validateLayout(next), []);
    assert.ok(ms < 3000, `${seed}: ${ms} ms`);
    // A layout already re-laid (or on the winding line) is not re-laid again.
    assert.equal(canRerail(next), false);
    assert.equal(rerailLayout(growth({ seed, count: 10 }).layout).error, "no_old_line");
  }
});

test("n49-2: a station's platform holds the line where it stands", () => {
  const seed = "group:n49b-st";
  const { layout, missing } = layoutFrom(seed, houses(16, [station(20)]), emptyLayout(seed, 3, 2));
  assert.equal(missing.length, 0);
  const st = layout.plots.find((p) => p.model === "istasyon");
  const r = rerailLayout(layout);
  assert.ok(r.layout, r.error);
  // The rules include the platform's rails lying on the railway.
  assert.deepEqual(validateLayout(r.layout), []);
  const train = createTrain(r.layout);
  assert.equal(train.stop.kind, "station");
  assert.equal(train.stop.plot, st.id);
});

const call = (app, path, { method = "GET", body, headers = {} } = {}) =>
  app
    .fetch(new Request(`http://kutup.test/api${path}`, { method, headers: { "Content-Type": "application/json", "X-Kutup": "1", ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) }), { ip: "test" })
    .then(async (r) => ({ status: r.status, data: await r.json(), cookie: r.headers.get("set-cookie")?.split(";")[0] }));

test("n49-2: Rayı kıvır goes through the server's checks, opens with the switch and can be gone back from", async () => {
  const OWNER = "n49b-owner-key-1234";
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: OWNER, testHooks: true } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_n49b", password: "n49b-pass-1" } });
  const owner = { Cookie: (await call(app, "/owner/login", { method: "POST", body: { key: OWNER } })).cookie };
  const gid = ada.data.group.id;
  for (let i = 0; i < 6; i++) await call(app, `/owner/members/${ada.data.memberId}/gift`, { method: "POST", headers: owner, body: { model: "ev" } });
  const send = (body) => call(app, `/owner/village/${gid}/layouts`, { method: "POST", headers: owner, body: { role: "draft", ...body } });
  const checkAll = async (id) => {
    for (let part = { checked: 0, sound: false }; !part.sound; ) {
      const r = await call(app, `/owner/village/${gid}/layouts/${id}/check`, { method: "POST", headers: owner, body: { from: part.checked } });
      if (r.status !== 200) return r;
      part = r.data;
    }
    return { status: 200 };
  };
  // A team that went to the new village before n49: its live layout is on terrain 2.
  let source = (await call(app, `/owner/village/${gid}/source`, { headers: owner })).data;
  const old = planDraft(source, emptyLayout(source.seed, 3, 2)).layout;
  let s = (await send({ layout: old, contentRev: source.contentRev })).data;
  assert.equal((await checkAll(s.draft.id)).status, 200);
  s = (await call(app, `/owner/village/${gid}/activate`, { method: "POST", headers: owner, body: { draftId: s.draft.id, active: null, contentRev: source.contentRev } })).data;
  const straight = s.active.id;
  assert.equal(s.active.terrainVersion, 2);

  // Without saying so, a sync can never change the ground.
  source = (await call(app, `/owner/village/${gid}/source?layout=active`, { headers: owner })).data;
  const planned = planRerail(source);
  assert.ok(planned.layout, planned.error);
  assert.equal(planned.missing.length, 0);
  assert.equal(planned.layout.terrainVersion, 4);
  const house = planned.layout.plots[0];
  // A moved house is refused outright.
  const moved = structuredClone(planned.layout);
  moved.plots[0] = { ...moved.plots[0], x: moved.plots[0].x + 1 };
  const refusedMove = await send({ layout: moved, rerail: true, contentRev: source.contentRev });
  assert.equal(refusedMove.status, 422);
  assert.match(refusedMove.data.error, /yer değiştirmiş/);
  // Another ground is not the team's.
  const elsewhere = { ...structuredClone(planned.layout), terrain: { ...makeTerrain("group:else", 4), rail: planned.layout.terrain.rail } };
  assert.equal((await send({ layout: elsewhere, rerail: true, contentRev: source.contentRev })).status, 422);
  // A kinked line is not a railway.
  const kinked = structuredClone(planned.layout);
  kinked.terrain.rail.pts[60] = [kinked.terrain.rail.pts[60][0] + 7, kinked.terrain.rail.pts[60][1]];
  assert.match((await send({ layout: kinked, rerail: true, contentRev: source.contentRev })).data.error, /Demiryolu/);
  // A line laid over a house is caught by the rule check.
  const over = structuredClone(planned.layout);
  const i = over.terrain.rail.pts.reduce((b, p, k) => (pointRect(p, house.ground) < pointRect(over.terrain.rail.pts[b], house.ground) ? k : b), 0);
  const [hx, hy] = [(house.ground[0] + house.ground[2]) / 2, (house.ground[1] + house.ground[3]) / 2];
  const dx = hx - over.terrain.rail.pts[i][0],
    dy = hy - over.terrain.rail.pts[i][1];
  // Shift a long stretch so the bend stays gentle.
  over.terrain.rail.pts = over.terrain.rail.pts.map(([x, y], k) => {
    const w = Math.max(0, 1 - Math.abs(k - i) / 60);
    const e = (1 - Math.cos(Math.PI * w)) / 2;
    return [x + dx * e, y + dy * e];
  });
  if (!railProblem(over.terrain)) {
    const stored = await send({ layout: over, rerail: true, contentRev: source.contentRev });
    if (stored.status === 201) assert.equal((await checkAll(stored.data.draft.id)).status, 422);
    else assert.equal(stored.status, 422);
  }

  // The real one: stored, checked, opened; the straight line stays the way back.
  const stored = await send({ layout: planned.layout, rerail: true, contentRev: source.contentRev });
  assert.equal(stored.status, 201, JSON.stringify(stored.data));
  assert.equal((await checkAll(stored.data.draft.id)).status, 200);
  s = (await call(app, `/owner/village/${gid}`, { headers: owner })).data;
  assert.equal(s.draft.terrainVersion, 4);
  assert.equal(s.draft.sound, true);
  s = (await call(app, `/owner/village/${gid}/activate`, { method: "POST", headers: owner, body: { draftId: s.draft.id, active: straight, contentRev: s.contentRev } })).data;
  assert.equal(s.active.terrainVersion, 4);
  assert.equal(s.previous.id, straight);
  // The members' village carries the new line.
  const village = await call(app, "/village", { headers: { Cookie: ada.cookie } });
  if (village.status === 200 && village.data.regions) assert.equal(village.data.terrainVersion, 4);
  // Re-laying again is refused (it is not the old line any more).
  source = (await call(app, `/owner/village/${gid}/source?layout=active`, { headers: owner })).data;
  assert.equal(planRerail(source).error, "no_old_line");
  const again = await send({ layout: source.layout, rerail: true, contentRev: source.contentRev });
  assert.equal(again.status, 422);
  // Going back: the straight line, every house where it was.
  s = (await call(app, `/owner/village/${gid}/rollback`, { method: "POST", headers: owner, body: { active: s.active.id, contentRev: s.contentRev } })).data;
  assert.equal(s.active.id, straight);
  assert.equal(s.active.terrainVersion, 2);
});

test("n49-2: a materials train stands while three workers carry its loads off; the wagons empty as they go", () => {
  const seed = "group:n49b-mz";
  const { layout } = layoutFrom(seed, houses(20, [station(30)]));
  const train = createTrain(layout);
  const from = Math.floor(T0 / 1000 / TRAIN.slot);
  let run = null;
  for (let n = from; n < from + 300 && !run; n++) if (train.runOf(n)?.kind === "malzeme") run = train.runOf(n);
  assert.ok(run, "a materials train within 40 hours");
  assert.deepEqual(run.cars, ["loco", "bricks", "logs", "cement"]);
  assert.ok(run.stops && run.dwell >= TRAIN.unload[0] && run.dwell <= TRAIN.unload[1]);
  const at = (t) => train.at(t * 1000);
  // Waiting by the track as it comes in.
  const before = at(run.arrive - 10).riders;
  assert.equal(before.length, 3);
  assert.ok(before.every((w) => w.worker && !w.load && !w.walking));
  // Every wagon's load is lifted while the train stands; each worker carries one.
  const carried = new Set();
  let emptied = 0;
  for (let t = run.arrive; t < run.depart; t += 0.5) {
    const a = at(t);
    assert.equal(a.state, "standing");
    for (const w of a.riders) if (w.load) carried.add(`${w.id}:${w.load}`);
    emptied = Math.max(emptied, a.cars.filter((c) => c.left !== undefined && c.left < 1).length);
  }
  assert.deepEqual([...carried].map((x) => x.split(":").at(-1)).sort(), Object.keys(LOADS).sort());
  assert.equal(emptied, 3);
  // They walk off with them (slower than an empty-handed walk) and are gone once delivered.
  const later = at(run.depart + 600).riders;
  assert.equal(later.length, 0);
  // A passenger train's people are not workers; with motion off there are none.
  assert.equal(train.at((run.arrive + 10) * 1000, { motion: "calm" }).riders.length, 0);
  for (const kind of ["bricks", "cement"]) assert.ok(CARS[kind] > 0);
});

test("n49-2: with a building site in the village, the loads go to its door", () => {
  const seed = "group:n49b-site";
  const items = houses(18, [station(30), { subject: { type: "site", id: "run-1" }, model: "konak", owner: "m2", created: 40 }]);
  const { layout } = layoutFrom(seed, items);
  const site = layout.plots.find((p) => p.subject.type === "site");
  assert.ok(site);
  const train = createTrain(layout);
  const from = Math.floor(T0 / 1000 / TRAIN.slot);
  let run = null;
  for (let n = from; n < from + 300 && !run; n++) if (train.runOf(n)?.kind === "malzeme") run = train.runOf(n);
  // The last point a worker reaches is the site's door.
  let last = null;
  for (let t = run.arrive; t < run.depart + 900; t += 0.25) {
    const w = at(train, t).find((x) => x.id.endsWith(":m0") && x.load);
    if (w) last = [w.x, w.y];
  }
  assert.ok(last);
  assert.ok(Math.hypot(last[0] - site.door[0][0], last[1] - site.door[0][1]) < 1, JSON.stringify([last, site.door[0]]));
});
const at = (train, t) => train.at(t * 1000).riders;

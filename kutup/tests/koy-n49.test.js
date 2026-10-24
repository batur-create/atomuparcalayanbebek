// n49 — the winding railway (terrain 3), the village's little train, its halt
// and level crossings, and the new village life (ducks, a rowing boat,
// fireflies). Synthetic layouts and temporary databases only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { inventoryOf, makeFixture } from "../scripts/koy/fixtures.mjs";
import { growth } from "../scripts/koy/grow.mjs";
import { layoutFrom } from "../shared/koy2/draft.js";
import { inPolygon, linePoint, pointRect } from "../shared/koy2/geom.js";
import { emptyLayout, validateLayout } from "../shared/koy2/planner.js";
import { planDraft } from "../shared/koy2/switch.js";
import { TERRAINS, TERRAIN_VERSION, makeTerrain } from "../shared/koy2/terrain.js";
import { createLife, walkable } from "../src/koy2/life.js";
import { CARS, HALT, TRAIN, createTrain } from "../src/koy2/train.js";

const T0 = Date.UTC(2026, 9, 24, 9);
const houses = (n, extra = []) => [
  ...Array.from({ length: n }, (_, k) => ({ subject: { type: "building", id: `b${k}` }, model: ["ev", "kulube", "kahve", "sahaf"][k % 4], owner: `m${k % 3}`, created: k })),
  ...extra,
];
const station = (created = 100) => ({ subject: { type: "building", id: "st" }, model: "istasyon", owner: "m1", created });
const curvature = (p) => {
  let k = 0;
  for (let j = 1; j < p.length - 1; j++) {
    const [a, b, c] = [p[j - 1], p[j], p[j + 1]];
    const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ac = Math.hypot(c[0] - a[0], c[1] - a[1]);
    k = Math.max(k, (2 * Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]))) / (ab * bc * ac));
  }
  return k;
};

test("n49: terrain 3 keeps version 2's ground and lays a winding railway", () => {
  assert.equal(TERRAIN_VERSION, 3);
  assert.deepEqual(TERRAINS[3], [2, 3]);
  assert.equal(emptyLayout("group:x").terrainVersion, 3);
  assert.equal(emptyLayout("group:x", 3, 2).terrainVersion, 2, "a layout made on version 2 can be rebuilt on it");
  for (let i = 0; i < 200; i++) {
    const seed = `group:n49-${i}`;
    const [v2, v3] = [makeTerrain(seed, 2), makeTerrain(seed, 3)];
    assert.deepEqual(v3, makeTerrain(seed, 3), "same seed, same line");
    for (const key of ["river", "lake", "streams", "nature"]) assert.deepEqual(v3[key], v2[key], `${seed} ${key}`);
    const rail = v3.rail.pts;
    // Never nearer than 38 units to the square; it swings in towards the village somewhere.
    const near = Math.min(...rail.map(([x, y]) => Math.hypot(x, y)));
    assert.ok(near >= 38 && near < 60, `${seed} ${near}`);
    // The sharpest bend still holds a platform (radius over 20 units).
    assert.ok(1 / curvature(rail) > 20, seed);
    // Not a straight line: near the village it moves sideways by more than 8 units (version 2: about 1).
    const side = (pts) => {
      const spread = (i) => Math.max(...pts.map((q) => q[i])) - Math.min(...pts.map((q) => q[i]));
      const k = spread(0) < spread(1) ? 0 : 1; // the axis across the line
      const off = pts.filter(([x, y]) => Math.hypot(x, y) < 150).map((q) => q[k]);
      return Math.max(...off) - Math.min(...off);
    };
    assert.ok(side(rail) > 8, `${seed} ${side(rail)}`);
    assert.ok(side(rail) > side(v2.rail.pts) * 2, seed);
  }
});

test("n49: a station always finds its platform on the winding line", () => {
  for (let i = 0; i < 12; i++) {
    const seed = `group:n49-st-${i}`;
    const { layout, missing } = layoutFrom(seed, houses(14, [station(30)]));
    assert.deepEqual(missing, [], seed);
    assert.equal(layout.terrainVersion, 3);
    assert.deepEqual(validateLayout(layout), [], seed);
    const train = createTrain(layout);
    assert.equal(train.stop.kind, "station", seed);
  }
});

test("n49: the train runs on the line, stops centred at the platform, and every phone sees the same one", () => {
  const { layout } = layoutFrom("group:n49-run", houses(20, [station(40)]));
  const a = createTrain(layout),
    b = createTrain(layout);
  const rail = layout.terrain.rail.pts;
  let runs = new Set(),
    standing = 0,
    prev = null;
  for (let s = 0; s < 4 * 3600; s += 0.5) {
    const t = T0 + s * 1000;
    const x = a.at(t),
      y = b.at(t);
    assert.deepEqual(x.cars, y.cars, "two phones, one train");
    if (!x.run) {
      prev = null;
      continue;
    }
    runs.add(x.run.n);
    for (const car of x.cars) assert.ok(linePoint(rail, [car.x, car.y]).d < 0.15, "on the rails");
    // Never faster than the line's speed, never a jump.
    const loco = x.cars.find((c) => c.kind === "loco");
    if (prev?.n === x.run.n && prev.loco && loco) assert.ok(Math.hypot(loco.x - prev.loco.x, loco.y - prev.loco.y) <= TRAIN.cruise * 0.5 + 0.05);
    prev = { n: x.run.n, loco };
    if (x.state === "standing") {
      standing++;
      // The middle of the train within a few units of the platform (it may pull up to keep a crossing open).
      const mid = [(x.cars[0].x + x.cars.at(-1).x) / 2, (x.cars[0].y + x.cars.at(-1).y) / 2];
      assert.ok(Math.hypot(mid[0] - a.stop.p[0], mid[1] - a.stop.p[1]) < 8, "at the platform");
      assert.equal(x.speed, 0);
    }
  }
  assert.ok(runs.size >= 20 && runs.size <= 32, `about one train in eight minutes (${runs.size})`);
  assert.ok(standing > 0);
  // nextIn points at the next train.
  for (let s = 0; s < 3600; s += 97) {
    const t = T0 + s * 1000,
      wait = a.nextIn(t);
    if (wait > 0) assert.ok(a.at(t + wait + 500).run, "a train is on the line when nextIn said");
    else assert.ok(a.at(t).run);
  }
});

test("n49: with motion off only a standing train shows, as a still picture", () => {
  const { layout } = layoutFrom("group:n49-calm", houses(12, [station(20)]));
  const tr = createTrain(layout);
  let still = 0;
  for (let s = 0; s < 3 * 3600; s += 1) {
    const t = T0 + s * 1000;
    const full = tr.at(t);
    for (const motion of ["calm", "still"]) {
      const x = tr.at(t, { motion });
      assert.equal(x.moving, false);
      assert.deepEqual([x.puffs.length, x.riders.length, x.whistle], [0, 0, null]);
      if (full.state === "standing") assert.deepEqual(x.cars, full.cars);
      else assert.equal(x.cars.length, 0);
    }
    if (full.state === "standing") still++;
  }
  assert.ok(still > 0);
});

test("n49: level crossings close while a train goes over them and stay open for a train standing clear", () => {
  const { layout } = growth({ seed: "n49-a", count: 300 });
  const tr = createTrain(layout);
  assert.ok(tr.crossings.length > 0);
  let closed = 0;
  for (let s = 0; s < 4 * 3600; s += 0.5) {
    const x = tr.at(T0 + s * 1000);
    if (!x.run) {
      assert.ok(x.crossings.every((c) => c.close === 0));
      continue;
    }
    for (const c of x.crossings) {
      const over = x.cars.some((car) => Math.hypot(car.x - c.x, car.y - c.y) < CARS[car.kind] / 2 + c.w / 2);
      if (over) assert.equal(c.close, 1, "down while a car is on the crossing");
      if (c.close === 1) closed++;
    }
  }
  assert.ok(closed > 0);
});

test("n49: the halt stands on the free strip by the track, never on a plot, street or door path", () => {
  const layouts = [layoutFrom("group:n49-halt", houses(30)).layout, growth({ seed: "n49-b", count: 300 }).layout, layoutFrom(makeFixture("baskin100").groupKey, inventoryOf(makeFixture("baskin100"))).layout];
  for (const grown of layouts) {
    // The halt is only for a village without a station (a grown one may have built one).
    const layout = { ...grown, plots: grown.plots.filter((p) => p.model !== "istasyon") };
    const tr = createTrain(layout);
    assert.equal(tr.stop?.kind, "halt");
    const { p, dir, n } = tr.stop;
    const spots = [];
    for (let a = -HALT.half; a <= HALT.half; a += 0.5) for (let o = HALT.from; o <= HALT.to; o += 0.15) spots.push([p[0] + dir[0] * a + n[0] * o, p[1] + dir[1] * a + n[1] * o]);
    for (const q of spots) {
      assert.ok(layout.plots.every((pl) => pointRect(q, pl.ground) > 0.2), "off every plot");
      assert.ok(layout.roads.filter((r) => r.status === "usable").every((r) => linePoint(r.pts, q).d > r.w / 2 + 0.3), "off every street");
      assert.ok(layout.plots.every((pl) => !pl.door || linePoint(pl.door, q).d > 0.5), "off every door path");
    }
    // On the village's side of the line.
    assert.ok(n[0] * -p[0] + n[1] * -p[1] > 0);
  }
});

test("n49: passengers who get off at the station walk into the village on its own ground", () => {
  const { layout } = layoutFrom("group:n49-riders", houses(24, [station(50)]));
  const tr = createTrain(layout);
  assert.ok(tr.walkIn && tr.walkIn.total > 0);
  let seen = 0;
  for (let s = 0; s < 6 * 3600; s += 1) {
    const x = tr.at(T0 + s * 1000);
    for (const r of x.riders) {
      seen++;
      // On the platform (beside the line), or on the village's streets and paths.
      const platform = linePoint(layout.terrain.rail.pts, [r.x, r.y]).d < 1.6;
      assert.ok(platform || walkable(layout, [r.x, r.y], 0.1), `${r.id} at ${r.x},${r.y}`);
    }
  }
  assert.ok(seen > 0);
});

test("n49: ducks keep to the pond, the boat to the river, fireflies to summer nights", () => {
  const { layout } = layoutFrom("group:n49-life", houses(30));
  const life = createLife({ layout });
  const t = layout.terrain;
  const big = [-400, -400, 400, 400];
  let swam = 0,
    rowed = 0,
    flies = 0;
  for (let s = 0; s < 6 * 3600; s += 3) {
    const at = T0 + s * 1000;
    const day = life.at(at, big, { lod: 2, sky: { night: 0, season: "summer" } });
    for (const d of day.ducks.brood) assert.ok(inPolygon([d.x, d.y], t.lake.poly), "a duck on the water");
    if (day.ducks.moving) swam++;
    if (day.boat) {
      rowed++;
      assert.ok(linePoint(t.river.pts, [day.boat.x, day.boat.y]).d < t.river.w / 2 - 0.4, "the boat on the river");
    }
    assert.ok(day.nature?.kind !== "fireflies");
    const night = life.at(at, big, { lod: 2, sky: { night: 1, season: "summer" } });
    assert.equal(night.boat, null, "nobody rows at night");
    if (night.nature?.kind === "fireflies") flies++;
    const winter = life.at(at, big, { lod: 2, sky: { night: 1, season: "winter" } });
    assert.ok(winter.nature?.kind !== "fireflies");
    // Motion off: ducks rest in a still row, no boat, nothing moving.
    const calm = life.at(at, big, { lod: 2, motion: "calm", sky: { night: 0, season: "summer" } });
    assert.deepEqual([calm.ducks.moving, calm.boat, calm.moving], [false, null, false]);
  }
  assert.ok(swam > 0 && rowed > 0 && flies > 0, `${swam} ${rowed} ${flies}`);
});

// ---------- the server: a team already on terrain 2 keeps it ----------
const call = (app, path, { method = "GET", body, headers = {} } = {}) =>
  app
    .fetch(new Request(`http://kutup.test/api${path}`, { method, headers: { "Content-Type": "application/json", "X-Kutup": "1", ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) }), { ip: "test" })
    .then(async (r) => ({ status: r.status, data: await r.json(), cookie: r.headers.get("set-cookie")?.split(";")[0] }));

test("n49: drafts get the winding line; a layout on terrain 2 is still accepted and can never change ground while catching up", async () => {
  const OWNER = "n49-owner-key-1234";
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: OWNER, testHooks: true } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_n49", password: "n49-pass-1" } });
  const owner = { Cookie: (await call(app, "/owner/login", { method: "POST", body: { key: OWNER } })).cookie };
  const gid = ada.data.group.id;
  for (let i = 0; i < 3; i++) await call(app, `/owner/members/${ada.data.memberId}/gift`, { method: "POST", headers: owner, body: { model: "ev" } });
  const source = (await call(app, `/owner/village/${gid}/source`, { headers: owner })).data;
  const send = (layout, base = null) => call(app, `/owner/village/${gid}/layouts`, { method: "POST", headers: owner, body: { layout, base, role: "draft", contentRev: source.contentRev } });
  // A new draft from today's browser: terrain 3.
  const fresh = planDraft(source, null).layout;
  assert.equal(fresh.terrainVersion, 3);
  assert.equal((await send(fresh)).status, 201);
  // A draft made before n49 (terrain 2) is still the team's ground.
  const old = planDraft({ ...source }, emptyLayout(source.seed, 3, 2)).layout;
  assert.equal(old.terrainVersion, 2);
  const stored = await send(old);
  assert.equal(stored.status, 201, JSON.stringify(stored.data));
  // Catching it up keeps terrain 2; swapping in another ground is refused.
  const id = stored.data.draft.id;
  const base = (await call(app, `/owner/village/${gid}/source?layout=${id}`, { headers: owner })).data;
  assert.equal(base.layout.terrainVersion, 2);
  const swapped = { ...planDraft(base, base.layout).layout, terrainVersion: 3, terrain: makeTerrain(source.seed, 3) };
  const refused = await send(swapped, id);
  assert.equal(refused.status >= 400, true);
  assert.match(JSON.stringify(refused.data), /arazi/i);
  // A made-up terrain version is not anybody's ground.
  const bogus = { ...fresh, terrainVersion: 9 };
  assert.match(JSON.stringify((await send(bogus)).data), /Arazi/);
});

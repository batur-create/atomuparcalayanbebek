import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { acceptanceScenes } from "../scripts/koy/neighbours.mjs";
import { applyPlan, checkPlan, convertSubject, emptyLayout, movePlans, personalCentre, planPlacement, seedNeighbourhoods, validateLayout } from "../shared/koy2/planner.js";
import { makeTerrain } from "../shared/koy2/terrain.js";
import { modelSpec, shapeAt } from "../shared/koy2/models.js";
import { planDraft } from "../shared/koy2/switch.js";

test("neighbours: 47 → 200 → 500 is one world; unequal growth loses nobody and never moves old work", () => {
  const stages = acceptanceScenes("komsu-2");
  let before = new Map(), homes = null, terrain = null;
  for (const stage of stages) {
    assert.deepEqual(stage.missing, [], `${stage.count}: every structure must be present`);
    assert.deepEqual(stage.problems, []);
    assert.equal(stage.layout.plots.length, stage.count);
    const centres = stage.layout.foci.filter((f) => f.personal);
    assert.equal(centres.length, 4);
    if (homes) assert.deepEqual(centres, homes);
    if (terrain) assert.deepEqual(stage.layout.terrain, terrain);
    homes = centres; terrain = stage.layout.terrain;
    for (const p of stage.layout.plots) {
      if (before.has(p.subject.id)) assert.deepEqual(p, before.get(p.subject.id));
      assert.equal(p.scale, modelSpec(p.model, p.gv).scale);
    }
    before = new Map(stage.layout.plots.map((p) => [p.subject.id, p]));
  }
  assert.deepEqual(stages.at(-1).metrics.owners.map((o) => o.count), [250, 120, 80, 50]);
  for (const o of stages.at(-1).metrics.owners) assert.ok(o.nearestCentreFraction >= 0.75, `${o.owner} spatial identity: ${o.nearestCentreFraction}`);
});

test("neighbours: twelve members and a late arrival have stable individual centres, not four fixed parcels", () => {
  let layout = seedNeighbourhoods(emptyLayout("many-12"), Array.from({ length: 12 }, (_, i) => `m${i}`));
  const homes = layout.foci.filter((f) => f.personal);
  assert.equal(homes.length, 12);
  for (let i = 0; i < 36; i++) {
    const req = { subject: { type: "building", id: `b${i}` }, model: "ev", owner: `m${i % 12}` };
    const p = planPlacement(layout, req);
    assert.ok(p.ok, String(i)); assert.equal(checkPlan(layout, p, req), null);
    layout = applyPlan(layout, p);
  }
  const before = layout.plots;
  const req = { subject: { type: "site", id: "late" }, model: "kulube", owner: "late" };
  const p = planPlacement(layout, req);
  assert.ok(p.ok); assert.equal(checkPlan(layout, p, req), null);
  layout = applyPlan(layout, p);
  assert.ok(personalCentre(layout, "late"));
  assert.deepEqual(layout.plots.slice(0, before.length), before);
  assert.deepEqual(layout.foci.filter((f) => homes.some((h) => h.id === f.id)), homes);
  assert.deepEqual(validateLayout(layout), []);
});

test("neighbours: terrain is deterministic; a connected outlet and protected nature are real placement constraints", () => {
  const terrain = makeTerrain("water-test");
  assert.deepEqual(terrain, makeTerrain("water-test"));
  assert.ok(terrain.nature.length);
  assert.deepEqual(terrain.streams[0].pts[0], [terrain.lake.cx, terrain.lake.cy]);
  assert.ok(terrain.river.pts.some((p) => JSON.stringify(p) === JSON.stringify(terrain.streams[0].pts.at(-1))));
  let layout = emptyLayout("water-test");
  const req = { subject: { type: "site", id: "run" }, model: "ev", owner: "m0" };
  const p = planPlacement(layout, req); assert.ok(p.ok);
  assert.equal(checkPlan(layout, p, req), null);
  const forged = structuredClone(p);
  forged.foci.find((f) => f.personal).personal = "another-team";
  assert.equal(checkPlan(layout, forged, req), "personal_centre_mismatch");
  const valid = applyPlan(layout, p);
  const nature = valid.terrain.nature.at(-1), x = nature.poly.reduce((s, p) => s + p[0], 0) / nature.poly.length, y = nature.poly.reduce((s, p) => s + p[1], 0) / nature.poly.length;
  const shape = shapeAt(modelSpec("ev"), x, y, p.plot.facing);
  const onNature = { ...valid, plots: [{ ...p.plot, x, y, ground: shape.ground, over: shape.over, plot: shape.plot }] };
  assert.ok(validateLayout(onNature).some(([, why]) => why === "protected_nature"), "the server rejects a real footprint on protected nature, not just a decorative tree collision");
});

test("neighbours: sites become one permanent building in place, and moves preserve identity and scale", () => {
  const req = { subject: { type: "site", id: "run" }, model: "ev", owner: "m0" };
  let layout = emptyLayout("neighbour-site"), plan = planPlacement(layout, req);
  assert.ok(plan.ok); layout = applyPlan(layout, plan);
  const permanent = { type: "building", id: "built" };
  layout = convertSubject(layout, req.subject, permanent);
  assert.deepEqual(layout.plots[0], { ...plan.plot, subject: permanent });
  const moves = movePlans(layout, permanent);
  assert.ok(moves.length);
  for (const m of moves) {
    assert.equal(m.plot.owner, "m0"); assert.equal(m.plot.scale, plan.plot.scale);
    assert.equal(checkPlan(layout, m, { ...req, subject: permanent, exclude: plan.plot.id }), null);
  }
});

test("neighbours: synchronising a stored generator-2 layout retains its geography and never upgrades it in place", () => {
  let legacy = emptyLayout("continue-old", 2);
  const a = { subject: { type: "building", id: "old" }, model: "kulube", owner: "m0", created: 1 };
  legacy = applyPlan(legacy, planPlacement(legacy, a));
  const b = { subject: { type: "building", id: "new" }, model: "ev", owner: "m1", created: 2 };
  const next = planDraft({ seed: legacy.seed, items: [a, b] }, legacy);
  assert.deepEqual(next.missing, []);
  assert.equal(next.layout.generator, 2); assert.equal(next.layout.terrainVersion, 1);
  assert.deepEqual(next.layout.terrain, legacy.terrain);
  assert.deepEqual(next.layout.plots[0], legacy.plots[0]);
  assert.equal(next.layout.foci.some((f) => f.personal), false);
});

test("neighbours: the Worker's browser-only policy rejects missing/stale plans without charging; a valid retry starts exactly once", async () => {
  const sql = new DatabaseSync(":memory:"); sql.exec("PRAGMA foreign_keys=ON");
  const app = createApp({ db: sqliteAdapter(sql), config: { adminKey: "local-budget-test-key", testHooks: true, browserPlanningOnly: true } });
  let cookie = "";
  const call = async (path, body = null, version = "3") => {
    const r = await app.fetch(new Request(`http://local.test/api${path}`, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", "X-Kutup": "1", "X-Kutup-Village-Version": version, Cookie: cookie }, ...(body ? { body: JSON.stringify(body) } : {}) }), { ip: "budget-test" });
    return { status: r.status, cookie: r.headers.get("set-cookie")?.split(";")[0], data: await r.json() };
  };
  const created = await call("/groups", { name: "Budget", username: "budget_test", password: "local-test-pass-123" });
  assert.equal(created.status, 201); cookie = created.cookie;
  sql.prepare("UPDATE members SET bricks=1000").run();
  const made = await call("/__test/village-v2", { name: "Budget" });
  assert.equal(made.status, 200);
  assert.equal((await call("/village", null, "2")).status, 426);
  const village = (await call("/village")).data;
  const start = { action: "start", strict: true, model: "kulube", minutes: 25, requestKey: "browser-budget-start-0001" };
  const refused = await call("/focus", start);
  assert.equal(refused.status, 409);
  assert.equal(sql.prepare("SELECT bricks FROM members").get().bricks, 1000);
  assert.equal(sql.prepare("SELECT count(*) AS n FROM focus_runs").get().n, 0);
  const plan = planPlacement(made.data.layout, { subject: { type: "site", id: "proposal" }, model: "kulube", owner: created.data.memberId });
  assert.ok(plan.ok);
  const begun = await call("/focus", { ...start, village: { layoutRev: village.layoutRev, plan } });
  assert.equal(begun.status, 200, JSON.stringify(begun.data));
  assert.equal((await call("/focus", start)).status, 200, "replay returns its original result without a second plan/search/charge");
  assert.equal(sql.prepare("SELECT count(*) AS n FROM focus_runs").get().n, 1);
  assert.equal((await call("/focus", { action: "cancel" })).status, 200);
  const before = sql.prepare("SELECT bricks FROM members").get().bricks;
  const stale = await call("/focus", { ...start, requestKey: "browser-budget-start-0002", village: { layoutRev: village.layoutRev, plan } });
  assert.equal(stale.status, 409);
  assert.equal(sql.prepare("SELECT bricks FROM members").get().bricks, before);
  assert.equal(sql.prepare("SELECT count(*) AS n FROM focus_runs").get().n, 1);
  sql.close();
});

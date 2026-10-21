// n46 E — every model, a long-growing village and the shared Anıtkabir's own
// ground (plan §4.3, §4.6, §5, §10 E). Synthetic data only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { CATALOG } from "../shared/catalog.js";
import { SCENES, inventoryOf, makeFixture } from "../scripts/koy/fixtures.mjs";
import { layoutFrom } from "../shared/koy2/draft.js";
import { GEOMETRY_VERSION, MODEL_IDS, doorsAt, modelSpec, shapeAt, worldRect } from "../shared/koy2/models.js";
import { applyPlan, emptyLayout, planPlacement, plotOf, reachableRoads, validateLayout } from "../shared/koy2/planner.js";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { growth } from "../scripts/koy/grow.mjs";

test("n46 E: geometry version 2 is Anıtkabir at 1.25× and nothing else; version 1 still reads", () => {
  assert.equal(GEOMETRY_VERSION, 2);
  for (const id of MODEL_IDS) {
    const [v1, v2] = [modelSpec(id, 1), modelSpec(id, 2)];
    if (id !== "anitkabir") {
      assert.deepEqual({ ...v2, version: 1 }, v1, id);
      continue;
    }
    for (const key of ["ground", "over"]) assert.deepEqual(v2[key].map((x) => +x.toFixed(6)), v1[key].map((x) => +(x * 1.25).toFixed(6)));
    assert.equal(+v2.height.toFixed(6), +(v1.height * 1.25).toFixed(6));
    assert.equal(+v2.scale.toFixed(6), +(v1.scale * 1.25).toFixed(6));
    assert.deepEqual(v2.entrances[0].dir, [0, 1], "visitors still come up the Road of Lions");
    assert.equal(+v2.entrances[0].x.toFixed(6), +(v1.entrances[0].x * 1.25).toFixed(6));
  }
  assert.equal(modelSpec("ev", 3), null, "no version from the future");
  assert.equal(modelSpec("ev", 0), null);
});

test("n46 E: all 48 models find a plot at their own size, with a reachable door", () => {
  assert.equal(CATALOG.length, 48);
  const f = makeFixture("yapi32");
  const { layout: base } = layoutFrom(f.groupKey, inventoryOf(f));
  const reach = reachableRoads(base);
  assert.ok(reach.size);
  for (const id of MODEL_IDS) {
    const plan = planPlacement(base, { subject: { type: "building", id: `atlas-${id}` }, model: id, owner: "m0", created: 1 });
    assert.ok(plan.ok, `${id}: ${plan.error} ${JSON.stringify(plan.rejected)}`);
    const spec = modelSpec(id);
    const p = plan.plot;
    // Never squeezed: the plot carries the contract's own scale and shape.
    assert.equal(p.scale, spec.scale, id);
    assert.equal(p.gv, GEOMETRY_VERSION, id);
    const ground = worldRect(spec.ground, p.x, p.y, p.facing);
    assert.ok(ground.every((v, i) => Math.abs(v - p.ground[i]) < 0.01), id);
    assert.ok(spec.facings.includes(p.facing), id);
    const after = applyPlan(base, plan);
    assert.deepEqual(validateLayout(after), [], id);
    // The public door (or a bridge's deck) joins the village's streets.
    if (spec.context !== "bridge") assert.ok(p.door && p.door.length >= 2, id);
  }
  // Both facings of every model are the same building mirrored, never resized.
  for (const id of MODEL_IDS) {
    const spec = modelSpec(id);
    const [a, b] = [shapeAt(spec, 0, 0, 0).ground, shapeAt(spec, 0, 0, 1).ground];
    assert.deepEqual(b, [a[1], a[0], a[3], a[2]], id);
    assert.equal(doorsAt(spec, 0, 0, 1).length, doorsAt(spec, 0, 0, 0).length, id);
  }
});

test("n46 E: the village keeps growing — 300 buildings, many squares, nothing placed ever moves", () => {
  const seen = new Map();
  const run = growth({ seed: "n46e-test", count: 300, onStep(layout) {
    for (const p of layout.plots) {
      const was = seen.get(p.id);
      const now = JSON.stringify(p);
      if (was) assert.equal(now, was, `plot ${p.id} changed`);
      else seen.set(p.id, now);
    }
  } });
  const ordinary = run.missed.filter((m) => !["dry-landmark", "water"].includes(m.group));
  assert.deepEqual(ordinary, [], "every ordinary building finds a plot");
  assert.ok(run.layout.plots.length >= 296, String(run.layout.plots.length));
  assert.deepEqual(validateLayout(run.layout), []);
  // Growth is many-centred: squares all round, not one ring around the first.
  const open = run.layout.foci.filter((f) => f.status === "open" && !f.landmark);
  assert.ok(open.length >= 20, String(open.length));
  const quarters = new Set(open.map((f) => `${Math.sign(Math.round(f.x / 20))}${Math.sign(Math.round(f.y / 20))}`));
  assert.ok(quarters.size >= 5, [...quarters].join(" "));
  // Owners live near their own: the median distance from a new house to that
  // owner's nearest earlier one stays within a few plots.
  assert.ok(run.ownerMedian < 30, String(run.ownerMedian));
});

test("n46 E: the four fixed scenes still place everything; the shared Anıtkabir gets its own big ground", () => {
  const want = { baslangic: 7, yapi32: 34, baskin100: 102, anitkabir: 7 };
  for (const name of SCENES) {
    const f = makeFixture(name);
    const { layout, missing } = layoutFrom(f.groupKey, inventoryOf(f));
    assert.deepEqual(missing, [], name);
    assert.equal(layout.plots.length, want[name], name);
    assert.deepEqual(validateLayout(layout), [], name);
  }
  const f = makeFixture("anitkabir");
  const { layout } = layoutFrom(f.groupKey, inventoryOf(f));
  const shared = layout.plots.find((p) => p.subject.type === "imece");
  assert.ok(shared);
  assert.equal(shared.owner, null, "nobody's personal plot");
  assert.equal(shared.gv, 2);
  assert.equal(+shared.scale.toFixed(4), +(modelSpec("anitkabir", 1).scale * 1.25).toFixed(4));
  // Its forecourt is a public space of its own, reached by an approach road.
  const court = layout.foci.find((x) => x.landmark && x.of === shared.id);
  assert.ok(court);
  assert.ok(layout.roads.some((r) => r.type === "yaklasim" && r.status === "usable"));
});

// ---------- server: the shared project's place ----------
const call = (app, path, { method = "GET", body, headers = {} } = {}) =>
  app
    .fetch(
      new Request(`http://kutup.test/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", "X-Kutup": "1", ...headers },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
      { ip: "test" },
    )
    .then(async (r) => ({ status: r.status, data: await r.json(), cookie: r.headers.get("set-cookie")?.split(";")[0] }));
const OWNER = "n46e-owner-key-1234";

test("n46 E: launching the shared Anıtkabir on a v2 team gives it a big plot; minutes, not looks, set its stage", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = sqliteAdapter(sqlite);
  const app = createApp({ db, config: { adminKey: OWNER, testHooks: true } });
  const owner = { "X-Owner-Key": OWNER };
  const first = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_n46e", password: "n46e-pass-1" } });
  const people = [first];
  for (const [i, name] of ["Ege", "Can", "Su"].entries())
    people.push(await call(app, "/join", { method: "POST", body: { invite: first.data.group.invite, name, username: `n46e_${i}`, password: "n46e-pass-1" } }));
  const ids = people.map((p) => p.data.memberId);
  await call(app, "/__test/village-v2", { method: "POST", body: { name: "Ada" } });
  const v2 = { Cookie: first.cookie, "X-Kutup-Village-Version": "2" };
  const before = (await call(app, "/village", { headers: v2 })).data;
  const launched = await call(app, "/owner/imece", { method: "POST", headers: owner, body: { members: ids } });
  assert.equal(launched.status, 201, JSON.stringify(launched.data));
  const v = (await call(app, "/village", { headers: v2 })).data;
  assert.equal(v.projects.length, 1);
  const project = v.projects[0];
  assert.ok(project.placement, "the project has its place");
  assert.equal(project.placement.model, "anitkabir");
  assert.equal(project.placement.geometryVersion, 2);
  assert.deepEqual([project.minutes, project.goal, project.stage], [0, 2000, 0]);
  const plot = v.plots.find((p) => p.id === project.placement.plotId);
  assert.equal(plot.owner, null);
  assert.ok(v.layoutRev > before.layoutRev);
  const change = sqlite.prepare("SELECT entity_type, op FROM village_changes WHERE entity_id = ?").all(project.id).map((r) => ({ ...r }));
  assert.deepEqual(change, [{ entity_type: "imece", op: "create" }]);
  // The crew's minutes move the stage; the 2,000-minute ledger is the only source.
  sqlite.prepare("INSERT INTO imece_work (id, project_id, slot, phase, minutes, personal, session_end, created) VALUES ('w1', ?, 0, 0, 50, 50, 1, 1), ('w2', ?, 1, 0, 50, 50, 1, 2)").run(project.id, project.id);
  const later = (await call(app, "/village", { headers: v2 })).data.projects[0];
  assert.deepEqual([later.minutes, later.stage], [100, 0.05]);
  assert.deepEqual(later.placement, project.placement, "progress never moves it");
  // A second launch is still refused, and makes no second place.
  assert.equal((await call(app, "/owner/imece", { method: "POST", headers: owner, body: { members: ids } })).status, 409);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM village_placements WHERE subject_type = 'imece'").get().n, 1);
});

test("n46 E: growth report helper places 32 and an unbalanced 100 with nothing missing", () => {
  for (const [count, unbalanced] of [[32, false], [100, true]]) {
    const run = growth({ seed: `n46e-${count}`, count, unbalanced });
    assert.deepEqual(run.missed.filter((m) => m.group === "ordinary"), [], String(count));
    assert.deepEqual(validateLayout(run.layout), []);
    assert.ok(plotOf(run.layout, { type: "building", id: "b0" }));
  }
  assert.ok(emptyLayout("x").roads.length >= 4, "the first square starts with its streets reserved");
});

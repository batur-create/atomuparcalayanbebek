// n46 B — the v2 prototype: model contracts match the drawings, the planner
// is deterministic, every scene validates, nothing placed ever moves when the
// village grows, water and rail models stand on their own ground, and only
// sessions that build a model get a site.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SCENES, inventoryOf, makeFixture } from "../scripts/koy/fixtures.mjs";
import { measureAll } from "../scripts/koy/measure-models.mjs";
import { MODEL_DATA } from "../shared/koy2/modelData.js";
import { CONTEXT, modelSpec } from "../shared/koy2/models.js";
import { layoutFrom } from "../shared/koy2/draft.js";
import { applyPlan, convertSubject, emptyLayout, planPlacement, plotOf, releaseSubject, seedNeighbourhoods, validateLayout } from "../shared/koy2/planner.js";
import { makeTerrain } from "../shared/koy2/terrain.js";
import { lineRect } from "../shared/koy2/geom.js";
import { CATALOG } from "../shared/catalog.js";

const drafts = new Map();
const draft = (name) => {
  if (!drafts.has(name)) {
    const f = makeFixture(name);
    drafts.set(name, { f, ...layoutFrom(f.groupKey, inventoryOf(f)) });
  }
  return drafts.get(name);
};

test("n46 B: the model contracts are the drawings' own numbers, for all 48 models", () => {
  assert.equal(CATALOG.length, 48);
  assert.deepEqual(measureAll(), MODEL_DATA, "run node scripts/koy/measure-models.mjs and bump GEOMETRY_VERSION");
  for (const item of CATALOG) {
    const m = modelSpec(item.id);
    assert.ok(m.entrances.length >= 1, item.id);
    assert.ok(m.ground[0] < m.ground[2] && m.ground[1] < m.ground[3], item.id);
    // What is drawn overhead always covers what touches the ground.
    assert.ok(m.over[0] <= m.ground[0] && m.over[3] >= m.ground[3], item.id);
  }
  assert.deepEqual(modelSpec("anitkabir").entrances[0].dir, [0, 1], "visitors come up the Road of Lions");
});

test("n46 B: the same inventory gives the same layout, byte for byte", () => {
  for (const name of SCENES) {
    const f = makeFixture(name);
    const a = layoutFrom(f.groupKey, inventoryOf(f));
    const { layout, missing } = draft(name);
    assert.equal(JSON.stringify(a), JSON.stringify({ layout, missing }), name);
  }
  assert.deepEqual(makeTerrain("n46-yapi32"), makeTerrain("n46-yapi32"));
  assert.notDeepEqual(makeTerrain("n46-yapi32").river, makeTerrain("n46-baskin100").river);
});

test("n46 B: every scene places everything and breaks no rule", () => {
  const want = { baslangic: 7, yapi32: 34, baskin100: 102, anitkabir: 7 };
  for (const name of SCENES) {
    const { layout, missing } = draft(name);
    assert.deepEqual(missing, [], name);
    assert.equal(layout.plots.length, want[name], name);
    assert.deepEqual(validateLayout(layout), [], name);
    // Plots never overlap, and no street (open or reserved) crosses one.
    const ps = layout.plots;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const [a, b] = [ps[i].ground, ps[j].ground];
        assert.ok(!(a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]), `${name}: ${ps[i].id} × ${ps[j].id}`);
      }
    for (const r of layout.roads)
      if (r.type !== "kopru")
        for (const p of ps) assert.ok(lineRect(r.pts, p.ground) > 0, `${name}: ${r.id} (${r.status}) on ${p.id}`);
  }
});

test("n46 B: growing the village never moves a placed plot or an open street", () => {
  const f = makeFixture("baskin100");
  const order = inventoryOf(f).sort((a, b) => a.created - b.created);
  let layout = seedNeighbourhoods(emptyLayout(f.groupKey), order.map((i) => i.owner));
  for (const item of order) {
    const before = layout;
    const plan = planPlacement(layout, item);
    assert.ok(plan.ok, item.subject.id);
    layout = applyPlan(layout, plan);
    assert.deepEqual(layout.plots.slice(0, before.plots.length), before.plots);
    const kept = new Map(layout.roads.map((r) => [r.id, r]));
    for (const r of before.roads.filter((r) => r.status === "usable")) assert.deepEqual(kept.get(r.id), r, r.id);
  }
  assert.equal(JSON.stringify(layout), JSON.stringify(draft("baskin100").layout));
});

test("n46 B: opening a reserved corridor makes it a street; dropping one removes it", () => {
  const empty = emptyLayout("n46-open");
  assert.equal(empty.roads.filter((r) => r.status === "reserved").length, 6);
  const plan = planPlacement(empty, { subject: { type: "building", id: "b1" }, model: "ev", owner: "m0", created: 1 });
  assert.ok(plan.ok && plan.open.length >= 1);
  const next = applyPlan(empty, plan);
  for (const id of plan.open) {
    const r = next.roads.find((x) => x.id === id) || next.foci.find((x) => x.id === id);
    assert.ok(r && r.status !== "reserved", id);
  }
  // A landmark clears the reservations in its way (Anıtkabir takes two radials).
  let dropped = 0;
  let l = emptyLayout("n46-anitkabir");
  for (const item of inventoryOf(makeFixture("anitkabir")).sort((a, b) => a.created - b.created)) {
    const p = planPlacement(l, item);
    for (const id of p.drop || []) {
      dropped++;
      assert.ok(!l.roads.some((r) => r.id === id && r.status === "usable"), `${id}: only reserved pieces are dropped`);
    }
    l = applyPlan(l, p);
    for (const id of p.drop || []) assert.ok(!l.roads.some((r) => r.id === id) && !l.foci.some((x) => x.id === id), id);
  }
  assert.ok(dropped > 0, "some reservation was dropped");
});

test("n46 B: the mill, the floating house, the bridges and the station stand on their own ground", () => {
  const { layout } = draft("yapi32");
  assert.ok(layout.terrain.rail, "a railway");
  const placed = new Map(layout.plots.map((p) => [p.model, p]));
  for (const [id, ctx] of Object.entries(CONTEXT)) {
    if (id === "fener") continue; // not in the scene
    const p = placed.get(id);
    assert.ok(p, `${id} placed`);
    if (ctx === "bridge") assert.ok(layout.roads.some((r) => r.type === "kopru" && lineRect(r.pts, p.ground) === 0), `${id} deck`);
    else assert.ok(p.door?.length >= 2, `${id} door path`);
  }
  assert.ok(placed.get("yuzenev").jetty, "the floating house reaches the shore by a jetty");
  // A lighthouse finds the pond's shore too.
  const plan = planPlacement(layout, { subject: { type: "building", id: "x-fener" }, model: "fener", owner: "m0", created: 9e15 });
  assert.ok(plan.ok, plan.error);
  assert.deepEqual(validateLayout(applyPlan(layout, plan)), []);
});

test("n46 B: only a session that builds a model gets a site; it turns into its building in place", () => {
  for (const name of SCENES) {
    const { f, layout } = draft(name);
    const sites = layout.plots.filter((p) => p.subject.type === "site");
    assert.equal(sites.length, f.sessions.filter((s) => s.strict && !s.imece).length, name);
    for (const s of f.sessions.filter((s) => !s.strict || s.imece)) assert.equal(plotOf(layout, { type: "site", id: `run-${s.memberId}` }), null, `${name}: no site for ${s.memberId}`);
  }
  const { layout } = draft("baslangic");
  const site = layout.plots.find((p) => p.subject.type === "site");
  const done = convertSubject(layout, site.subject, { type: "building", id: "b-new" });
  const built = plotOf(done, { type: "building", id: "b-new" });
  assert.deepEqual({ ...built, subject: site.subject }, site, "same plot, same door");
  const gone = releaseSubject(layout, site.subject);
  assert.equal(gone.plots.length, layout.plots.length - 1);
  assert.deepEqual(gone.roads, layout.roads, "a cancelled site leaves the streets");
  // The shared Anıtkabir is the team's, not anyone's own.
  const shared = draft("anitkabir").layout.plots.find((p) => p.subject.type === "imece");
  assert.equal(shared.owner, null);
  assert.equal(shared.model, "anitkabir");
});

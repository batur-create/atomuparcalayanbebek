// n46 G — the free plan's CPU budget (about 10 ms per request): a new plot is
// found in the browser of whoever acts and the server only checks it. These
// tests send what the app sends: a plan made on the member's own copy of the
// village, a tampered one, a stale one, a move. Temporary databases only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { readLayout } from "../server/villageStore.js";
import { changeStatements } from "../server/villageSpatial.js";
import { applyPlan, checkPlan, emptyLayout, movePlans, planPlacement, validateLayout } from "../shared/koy2/planner.js";
import { mergeVillage2 } from "../src/koy2/village2.js";
import { plannerLayout, sendable } from "../src/koy2/browserPlan.js";

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
const OWNER = "n46g-plan-owner-key-1234";
const V2 = { "X-Kutup-Village-Version": "3" };
const MODELS = ["ev", "kulube", "kahve", "sahaf", "bostan", "konak", "kule", "cicekci"];

async function v2team(gifts = 12) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = sqliteAdapter(sqlite);
  const app = createApp({ db, config: { adminKey: OWNER, testHooks: true } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_n46gp", password: "n46g-pass-1" } });
  const ege = await call(app, "/join", { method: "POST", body: { invite: ada.data.group.invite, name: "Ege", username: "ege_n46gp", password: "n46g-pass-1" } });
  const owner = { Cookie: (await call(app, "/owner/login", { method: "POST", body: { key: OWNER } })).cookie };
  for (let i = 0; i < gifts; i++) await call(app, `/owner/members/${(i % 2 ? ege : ada).data.memberId}/gift`, { method: "POST", headers: owner, body: { model: MODELS[i % MODELS.length] } });
  const made = await call(app, "/__test/village-v2", { method: "POST", body: { name: "Ada" } });
  sqlite.prepare("UPDATE members SET bricks = 2000").run();
  // The member's own copy of the village, as the app keeps it.
  const mine = async (who = ada) => mergeVillage2(null, (await call(app, "/village", { headers: { Cookie: who.cookie, ...V2 } })).data);
  const one = (sql, ...args) => sqlite.prepare(sql).get(...args);
  return { sqlite, db, app, ada, ege, owner, mine, one, layoutId: made.data.id };
}
const key = (n) => `n46g-plan-request-${String(n).padStart(4, "0")}`;
const start = (t, who, model, n, village) =>
  call(t.app, "/focus", { method: "POST", headers: { Cookie: who.cookie, ...V2 }, body: { action: "start", strict: true, model, minutes: 50, requestKey: key(n), ...(village ? { village } : {}) } });
const placementOf = async (t, type, id) => t.one("SELECT plot_id AS plot, x, y FROM village_placements WHERE layout_id = ? AND subject_type = ? AND subject_id = ?", t.layoutId, type, String(id));

test("n46 G: the member's browser finds the plot; the server checks it and writes exactly that plot", async () => {
  const t = await v2team();
  const village = await t.mine();
  const layout = plannerLayout(village);
  // The member's copy is the server's layout, row for row: a plan made on it holds there.
  const stored = (await readLayout(t.db, t.layoutId)).layout;
  assert.deepEqual(JSON.parse(JSON.stringify({ ...layout, plots: layout.plots.map((p) => p.id) })), JSON.parse(JSON.stringify({ ...stored, plots: stored.plots.map((p) => p.id) })));
  const plan = planPlacement(layout, { subject: { type: "site", id: "new" }, model: "konak", owner: t.ada.data.memberId, created: Date.now() });
  assert.ok(plan.ok);
  const r = await start(t, t.ada, "konak", 1, { layoutRev: village.layoutRev, plan: sendable(plan) });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const at = await placementOf(t, "site", r.data.run);
  assert.deepEqual([at.plot, at.x, at.y], [plan.plot.id, plan.plot.x, plan.plot.y]);
  assert.deepEqual(validateLayout((await readLayout(t.db, t.layoutId)).layout), []);
});

test("n46 G: a tampered or stale plan is never written as sent; the server plans itself", async () => {
  const t = await v2team();
  const village = await t.mine();
  const layout = plannerLayout(village);
  const plan = sendable(planPlacement(layout, { subject: { type: "site", id: "new" }, model: "ev", owner: t.ada.data.memberId, created: Date.now() }));
  const taken = layout.plots.find((p) => p.subject);
  const tampered = [
    // On top of a neighbour's house.
    { ...plan, plot: { ...plan.plot, x: taken.x, y: taken.y, ground: taken.ground, over: taken.over, plot: taken.plot } },
    // A smaller footprint than the model has, to squeeze in.
    { ...plan, plot: { ...plan.plot, ground: plan.plot.ground.map((v, i) => (i < 2 ? v + 1 : v - 1)) } },
    // Another model's spot passed off for this one, and an id that already exists.
    { ...plan, plot: { ...plan.plot, model: "kulube" } },
    { ...plan, plot: { ...plan.plot, id: taken.id } },
    // A street across the pond.
    { ...plan, roads: [{ id: "r999", type: "sokak", w: 2, status: "usable", a: "n0", b: "n0", pts: [layout.terrain.lake.poly[0], layout.terrain.lake.poly[3]] }] },
  ];
  tampered.forEach((bad, i) => assert.ok(checkPlan(layout, bad, { subject: { type: "site", id: "new" }, model: "ev", owner: t.ada.data.memberId }), `checkPlan refuses tampered plan ${i}`));
  // Sent anyway: the session still starts, on a plot the server planned, and the layout stays sound.
  const r = await start(t, t.ada, "ev", 2, { layoutRev: village.layoutRev, plan: tampered[0] });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const at = await placementOf(t, "site", r.data.run);
  assert.notEqual(at.plot, taken.id);
  assert.notDeepEqual([at.x, at.y], [taken.x, taken.y]);
  // A plan made before someone else built: its revision is old, so the server plans again.
  const r2 = await start(t, t.ege, "ev", 3, { layoutRev: village.layoutRev, plan: sendable(planPlacement(layout, { subject: { type: "site", id: "new" }, model: "ev", owner: t.ege.data.memberId, created: Date.now() })) });
  assert.equal(r2.status, 200, JSON.stringify(r2.data));
  assert.ok(await placementOf(t, "site", r2.data.run));
  assert.deepEqual(validateLayout((await readLayout(t.db, t.layoutId)).layout), []);
});

test("n46 G: a move chosen among the browser's proposals; a choice the village has outgrown is refused", async () => {
  const t = await v2team();
  const village = await t.mine();
  const own = village.buildings.find((b) => b.memberId === t.ada.data.memberId);
  const plans = movePlans(plannerLayout(village), { type: "building", id: own.id });
  assert.ok(plans.length >= 2);
  // Every proposal holds on its own (none leans on a street another one would lay).
  const current = plannerLayout(village).plots.find((p) => p.subject?.id === own.id);
  for (const p of plans) assert.equal(checkPlan(plannerLayout(village), p, { subject: { type: "building", id: own.id }, model: current.model, version: current.gv, owner: current.owner, exclude: current.id }), null);
  const pick = plans[1];
  const moved = await call(t.app, `/buildings/${own.id}/move`, { method: "POST", headers: { Cookie: t.ada.cookie, ...V2 }, body: { x: pick.plot.x, y: pick.plot.y, village: { layoutRev: village.layoutRev, plan: sendable(pick) } } });
  assert.equal(moved.status, 200, JSON.stringify(moved.data));
  const at = await placementOf(t, "building", own.id);
  assert.deepEqual([at.plot, at.x, at.y], [pick.plot.id, pick.plot.x, pick.plot.y]);
  // The same choice again, from the copy the village has since moved past.
  const again = await call(t.app, `/buildings/${own.id}/move`, { method: "POST", headers: { Cookie: t.ada.cookie, ...V2 }, body: { x: plans[0].plot.x, y: plans[0].plot.y, village: { layoutRev: village.layoutRev, plan: sendable(plans[0]) } } });
  assert.equal(again.status, 409);
  assert.deepEqual(validateLayout((await readLayout(t.db, t.layoutId)).layout), []);
});

test("n46 G: a gift planned in the owner's browser lands on that plot", async () => {
  const t = await v2team(4);
  const gid = t.one("SELECT group_id AS g FROM members WHERE id = ?", t.ada.data.memberId).g;
  const source = (await call(t.app, `/owner/village/${gid}/source?layout=active`, { headers: t.owner })).data;
  assert.equal(source.layoutId, t.layoutId);
  const plan = planPlacement(source.layout, { subject: { type: "building", id: "new" }, model: "kule", owner: t.ege.data.memberId, created: Date.now() });
  const r = await call(t.app, `/owner/members/${t.ege.data.memberId}/gift`, { method: "POST", headers: t.owner, body: { model: "kule", village: { layoutRev: source.layoutRev, plan: sendable(plan) } } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const at = await placementOf(t, "building", r.data.id);
  assert.deepEqual([at.plot, at.x, at.y], [plan.plot.id, plan.plot.x, plan.plot.y]);
});

test("n46 G: writing a known plan's rows is the same as comparing every row (and much cheaper)", () => {
  let layout = emptyLayout("group:changes");
  for (let i = 0; i < 160; i++) {
    const req = { subject: { type: "building", id: `b${i}` }, model: MODELS[i % MODELS.length], owner: `m${i % 5}`, created: i };
    const plan = planPlacement(layout, req);
    if (!plan.ok) continue;
    const next = applyPlan(layout, plan);
    assert.deepEqual(changeStatements("L", 3, layout, next, plan), changeStatements("L", 3, layout, next), `plan ${i} (${plan.how})`);
    layout = next;
  }
});

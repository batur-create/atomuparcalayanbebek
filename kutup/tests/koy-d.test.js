// n46 D — the small end-to-end v2 village: a building session reserves its
// final plot at start and shows a real site, the server's own minutes set its
// stage, success turns it into one building on the very same plot, a cancel
// gives only that plot back, and a finished building moves to a planned plot
// (or stays where it is if the target is gone). Plan §11.3, step by step.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { readLayout } from "../server/villageStore.js";
import { validateLayout } from "../shared/koy2/planner.js";
import { mergeVillage } from "../src/villageWorld.js";
import { siteStage } from "../src/koy2/village2.js";
import { buildWorld2 } from "../src/koy2/world2.js";

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

const OWNER = "n46d-owner-key-1234";
async function v2team() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = sqliteAdapter(sqlite);
  const app = createApp({ db, config: { adminKey: OWNER, testHooks: true } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_n46d", password: "n46d-pass-1" } });
  const ege = await call(app, "/join", { method: "POST", body: { invite: ada.data.group.invite, name: "Ege", username: "ege_n46d", password: "n46d-pass-1" } });
  const owner = { "X-Owner-Key": OWNER };
  // Something already standing, then the team switches to a v2 layout.
  await call(app, `/owner/members/${ada.data.memberId}/gift`, { method: "POST", headers: owner, body: { model: "kahve" } });
  const made = await call(app, "/__test/village-v2", { method: "POST", body: { name: "Ada" } });
  sqlite.prepare("UPDATE members SET bricks = 500").run();
  const as = (who) => ({ Cookie: who.cookie, "X-Kutup-Village-Version": "2" });
  const village = async (who = ada) => (await call(app, "/village", { headers: as(who) })).data;
  const one = (sql, ...args) => sqlite.prepare(sql).get(...args);
  const all = (sql, ...args) => sqlite.prepare(sql).all(...args).map((r) => ({ ...r }));
  return { sqlite, db, app, ada, ege, owner, as, village, one, all, layoutId: made.data.id };
}
const key = (n) => `n46d-request-key-${String(n).padStart(4, "0")}`;

test("n46 D: two people build at once, then one cancels, one finishes, and the building moves (plan §11.3)", async () => {
  const t = await v2team();
  const [A, B] = [t.ada.data.memberId, t.ege.data.memberId];
  // 1–2. Both start a building session at the same moment: two real sites on different plots, one charge each.
  const starts = await Promise.all([
    call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: { action: "start", strict: true, model: "ev", minutes: 50, requestKey: key(1) } }),
    call(t.app, "/focus", { method: "POST", headers: t.as(t.ege), body: { action: "start", strict: true, model: "kahve", minutes: 25, requestKey: key(2) } }),
  ]);
  assert.deepEqual(starts.map((r) => r.status), [200, 200], JSON.stringify(starts.map((r) => r.data.error)));
  const [runA, runB] = starts.map((r) => r.data.run);
  assert.equal(t.one("SELECT bricks FROM members WHERE id = ?", A).bricks, 460);
  assert.equal(t.one("SELECT bricks FROM members WHERE id = ?", B).bricks, 470);
  let v = await t.village();
  assert.equal(v.sites.length, 2);
  const siteA = v.sites.find((s) => s.focusRunId === runA),
    siteB = v.sites.find((s) => s.focusRunId === runB);
  assert.ok(siteA.placement && siteB.placement);
  assert.notEqual(siteA.placement.plotId, siteB.placement.plotId);
  assert.deepEqual([siteA.modelId, siteA.memberId, siteA.status], ["ev", A, "running"]);
  assert.equal(siteA.placement.model, "ev", "the plot was chosen for the finished model");
  assert.deepEqual(validateLayout((await readLayout(t.db, t.layoutId)).layout), []);
  // 3. Each stage follows its own server session.
  t.sqlite.prepare("UPDATE members SET focus_end = ? WHERE id = ?").run(Date.now() + 25 * 60000, A);
  v = await t.village();
  const stageA = v.sites.find((s) => s.focusRunId === runA).verifiedStage;
  assert.ok(stageA > 0.45 && stageA < 0.55, String(stageA));
  assert.ok(v.sites.find((s) => s.focusRunId === runB).verifiedStage < 0.05);
  // 4. Refreshing changes nothing: same plot, facing, scale and run.
  const again = await t.village(t.ege);
  for (const s of again.sites) assert.deepEqual(s.placement, v.sites.find((x) => x.focusRunId === s.focusRunId).placement);
  // 5. Ege gives up: only Ege's site goes.
  t.sqlite.prepare("UPDATE members SET focus_end = focus_end - 10 * 60000 WHERE id = ?").run(B); // past the free two minutes
  assert.equal((await call(t.app, "/focus", { method: "POST", headers: t.as(t.ege), body: { action: "cancel" } })).status, 200);
  v = await t.village();
  assert.deepEqual(v.sites.map((s) => s.focusRunId), [runA]);
  assert.deepEqual(v.sites[0].placement, siteA.placement, "Ada's site did not move");
  assert.equal(t.one("SELECT count(*) AS n FROM village_placements WHERE subject_type = 'site'").n, 1);
  // 6. Ada finishes: one building on the very same plot, one reward, one delivery.
  t.sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 1000, A);
  await Promise.all([call(t.app, "/state", { headers: t.as(t.ada) }), call(t.app, "/state", { headers: t.as(t.ege) })]);
  v = await t.village();
  assert.equal(v.sites.length, 0);
  const built = v.buildings.filter((b) => b.memberId === A && b.model === "ev");
  assert.equal(built.length, 1);
  assert.equal(built[0].placement.plotId, siteA.placement.plotId);
  assert.deepEqual([built[0].placement.x, built[0].placement.y, built[0].placement.facing, built[0].placement.scale], [siteA.placement.x, siteA.placement.y, siteA.placement.facing, siteA.placement.scale]);
  assert.equal(t.one("SELECT source_focus_run_id AS r FROM buildings WHERE id = ?", built[0].id).r, runA);
  assert.equal(t.one("SELECT count(*) AS n FROM bricks_log WHERE member_id = ? AND reason = 'wage'", A).n, 1);
  // 7. A repeated start or settle makes nothing twice.
  assert.equal((await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: { action: "start", strict: true, model: "ev", minutes: 50, requestKey: key(1) } })).data.replayed, true);
  await call(t.app, "/state", { headers: t.as(t.ada) });
  assert.equal(t.one("SELECT count(*) AS n FROM buildings WHERE member_id = ? AND model = 'ev'", A).n, 1);
  assert.equal(t.one("SELECT count(*) AS n FROM focus_runs WHERE member_id = ?", A).n, 1);
  assert.equal(t.one("SELECT count(*) AS n FROM bricks_log WHERE member_id = ? AND reason = 'cost'", A).n, 1);
  // 8–9. The building is offered planned plots and moves with an explicit choice; nothing else changes.
  const before = t.one("SELECT id, member_id, model, seed, created, likes, minutes FROM buildings WHERE id = ?", built[0].id);
  const others = v.buildings.filter((b) => b.id !== built[0].id).map((b) => [b.id, b.placement]);
  const spots = (await call(t.app, `/buildings/${built[0].id}/spots`, { headers: t.as(t.ada) })).data.spots;
  assert.ok(spots.length >= 2);
  const moved = await call(t.app, `/buildings/${built[0].id}/move`, { method: "POST", headers: t.as(t.ada), body: { x: spots[0][0], y: spots[0][1] } });
  assert.equal(moved.status, 200, moved.data.error);
  v = await t.village();
  const now = v.buildings.find((b) => b.id === built[0].id);
  assert.deepEqual([now.placement.x, now.placement.y], [spots[0][0], spots[0][1]]);
  assert.equal(now.placement.scale, built[0].placement.scale);
  assert.equal(now.placement.geometryVersion, built[0].placement.geometryVersion);
  assert.deepEqual({ ...t.one("SELECT id, member_id, model, seed, created, likes, minutes FROM buildings WHERE id = ?", built[0].id) }, { ...before });
  for (const [id, placement] of others) assert.deepEqual(v.buildings.find((b) => b.id === id).placement, placement);
  assert.deepEqual(validateLayout((await readLayout(t.db, t.layoutId)).layout), []);
  assert.ok(v.deletes && v.plots.every((p) => p.id !== built[0].placement.plotId), "the old plot is let go");
  // 10. A target someone took in the meantime is refused and the building stays.
  const next = (await call(t.app, `/buildings/${built[0].id}/spots`, { headers: t.as(t.ada) })).data.spots[0];
  await call(t.app, `/owner/members/${B}/gift`, { method: "POST", headers: t.owner, body: { model: "konak" } }); // lands somewhere
  // Take the target for sure: a plot right there for someone else.
  const layout = (await readLayout(t.db, t.layoutId)).layout;
  const taken = layout.plots.find((p) => p.subject.type === "building" && p.subject.id !== built[0].id);
  t.sqlite.prepare("UPDATE village_plots SET data = json_set(data, '$.x', ?, '$.y', ?, '$.ground', json(?), '$.plot', json(?)) WHERE layout_id = ? AND id = ?").run(
    next[0], next[1], JSON.stringify([next[0] - 4, next[1] - 4, next[0] + 4, next[1] + 4]), JSON.stringify([next[0] - 5, next[1] - 5, next[0] + 5, next[1] + 5]), t.layoutId, taken.id,
  );
  // Every change to a layout's rows raises its revision (servers keep parsed copies by revision).
  t.sqlite.prepare("UPDATE village_layouts SET rev = rev + 1 WHERE id = ?").run(t.layoutId);
  t.sqlite.prepare("UPDATE village_plots SET rev = (SELECT rev FROM village_layouts WHERE id = ?) WHERE layout_id = ? AND id = ?").run(t.layoutId, t.layoutId, taken.id);
  const refused = await call(t.app, `/buildings/${built[0].id}/move`, { method: "POST", headers: t.as(t.ada), body: { x: next[0], y: next[1] } });
  assert.equal(refused.status, 409);
  assert.deepEqual((await t.village()).buildings.find((b) => b.id === built[0].id).placement, now.placement);
});

test("n46 D: no site without a building; no room means no charge and no session", async () => {
  const t = await v2team();
  const A = t.ada.data.memberId;
  // A free session: a run, no site.
  const free = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ege), body: { action: "start", minutes: 25 } });
  assert.equal(free.status, 200);
  assert.equal((await t.village()).sites.length, 0);
  assert.equal(t.one("SELECT count(*) AS n FROM village_placements WHERE subject_type = 'site'").n, 0);
  // No room at all (the whole village under the pond): refused before any charge.
  const before = t.one("SELECT bricks FROM members WHERE id = ?", A).bricks;
  t.sqlite.prepare("UPDATE village_layouts SET rev = rev + 1 WHERE id = ?").run(t.layoutId);
  t.sqlite.prepare("UPDATE village_regions SET terrain = json_set(terrain, '$.lake.poly', json(?)), rev = (SELECT rev FROM village_layouts WHERE id = ?) WHERE layout_id = ?").run(JSON.stringify([[-500, -500], [500, -500], [500, 500], [-500, 500]]), t.layoutId, t.layoutId);
  const refused = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: { action: "start", strict: true, model: "ev", minutes: 50 } });
  assert.equal(refused.status, 409, JSON.stringify(refused.data));
  assert.match(refused.data.error, /uygun yer/);
  assert.equal(t.one("SELECT bricks FROM members WHERE id = ?", A).bricks, before);
  assert.equal(t.one("SELECT focus_end FROM members WHERE id = ?", A).focus_end, 0);
  assert.equal(t.all("SELECT * FROM focus_runs WHERE member_id = ?", A).length, 0);
});

test("n46 D: a site that collapses lets its plot go; the plot is free for the next one", async () => {
  const t = await v2team();
  const A = t.ada.data.memberId;
  const started = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: { action: "start", strict: true, model: "ev", minutes: 50 } });
  const plot = (await t.village()).sites[0].placement.plotId;
  // Ended without the app watching: the session fails on the server's rules.
  t.sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = 0 WHERE id = ?").run(Date.now() - 1000, A);
  await call(t.app, "/state", { headers: t.as(t.ada) });
  assert.equal(t.one("SELECT status FROM focus_runs WHERE id = ?", started.data.run).status, "failed");
  const v = await t.village();
  assert.equal(v.sites.length, 0);
  assert.equal(t.one("SELECT count(*) AS n FROM buildings WHERE member_id = ? AND model = 'ev'", A).n, 0);
  assert.equal(t.one("SELECT deleted FROM village_plots WHERE layout_id = ? AND id = ?", t.layoutId, plot).deleted, 1);
});

test("n46 D: the app keeps a v2 village row by row, draws it, and still reads today's village the same", async () => {
  const t = await v2team();
  const A = t.ada.data.memberId;
  const fetchV = async (cursor) => (await call(t.app, `/village${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { headers: t.as(t.ada) })).data;
  let held = mergeVillage(null, await fetchV());
  assert.equal(held.v2, true);
  assert.equal(held.buildings.length, 1);
  const gift = held.buildings[0];
  assert.deepEqual([gift.x, gift.y], [gift.placement.x, gift.placement.y], "today's cards read x/y from the placement");
  assert.equal(held.layout.plots.length, 1);
  assert.deepEqual(held.layout.plots[0].subject, { type: "building", id: gift.id });
  // Nothing new: the cursor answers "unchanged" and the same object is kept.
  assert.equal(mergeVillage(held, await fetchV(held.cursor)), held);
  // A start: only the new rows travel, the site appears on its own plot.
  const run = (await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: { action: "start", strict: true, model: "ev", minutes: 50 } })).data.run;
  const delta = await fetchV(held.cursor);
  assert.equal(delta.full, false);
  assert.equal(delta.plots.length, 1);
  held = mergeVillage(held, delta);
  assert.equal(held.layout.plots.length, 2);
  const sitePlot = held.layout.plots.find((p) => p.subject.type === "site");
  assert.equal(sitePlot.subject.id, run);
  const site = held.sites[0];
  assert.ok(siteStage(site, site.receivedAt + 25 * 60000) > 0.49, "a running site rises with time between answers");
  // Drawn: the gift, the site (pickable, as its run), and move spots when asked.
  const world = buildWorld2({ layout: held.layout, things: held.things, members: [], me: A, spots: [{ x: 30, y: 30, facing: 0 }] });
  assert.ok(world.byId.get(run)?.building.site);
  assert.ok(world.byId.get(gift.id));
  assert.ok(world.byId.get("spot-0")?.building.spot);
  // A cancel: the plot comes back as a tombstone and disappears from the drawing.
  t.sqlite.prepare("UPDATE members SET focus_end = focus_end - 10 * 60000 WHERE id = ?").run(A);
  await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: { action: "cancel" } });
  const gone = await fetchV(held.cursor);
  assert.deepEqual(gone.deletes.plots, [sitePlot.id]);
  held = mergeVillage(held, gone);
  assert.equal(held.layout.plots.length, 1);
  assert.equal(held.sites.length, 0);
  // The team goes back to today's village: the legacy answer replaces the v2 one whole.
  t.sqlite.prepare("UPDATE groups SET active_layout_id = NULL").run();
  const legacy = mergeVillage(held, (await call(t.app, "/village", { headers: t.as(t.ada) })).data);
  assert.equal(legacy.v2, undefined);
  assert.equal(legacy.buildings.length, 1);
  assert.ok(Array.isArray(legacy.districts) && legacy.districts.length);
});
